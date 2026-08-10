import type { OcrFieldKind } from '@/lib/ocrWorkerManager';
import { recognizeWithOcrWorker } from '@/lib/ocrWorkerManager';
import type { OcrZoneKey } from '@/lib/ocr';
import type { PremiumZoneReading } from '@/lib/premiumReading';
import { cropImage } from './imageProcessing';
import { normalizeEfhubCalibrationZones, type EfhubCalibrationZone, type EfhubCalibrationZoneId } from './efhubManualCalibration';

export const MANUAL_CALIBRATION_FAST_READER_VERSION = '38.40-macro-8-r5';

type MacroPlan = {
  id: EfhubCalibrationZoneId;
  label: string;
  kind: OcrFieldKind;
  width: number;
  outputs: Array<{ key: OcrZoneKey; label: string }>;
};

const MACRO_PLANS: MacroPlan[] = [
  {
    id: 'identity', label: 'Nome e estilo', kind: 'nameSparse', width: 1450,
    outputs: [
      { key: 'name', label: 'Nome do jogador' },
      { key: 'playstyle', label: 'Estilo de jogo' }
    ]
  },
  {
    id: 'card', label: 'Carta e posição', kind: 'general', width: 1350,
    outputs: [
      { key: 'overall', label: 'GER da carta' },
      { key: 'mainPosition', label: 'Posição principal da carta' },
      { key: 'cardType', label: 'Carta completa e arte do jogador' }
    ]
  },
  {
    id: 'bio', label: 'Bio, condição e nível', kind: 'general', width: 1450,
    outputs: [
      { key: 'identityMeta', label: 'Altura, peso, idade e nível' },
      { key: 'level', label: 'Nível máximo' },
      { key: 'condition', label: 'Pior pé, condição e lesão' },
      { key: 'manager', label: 'Técnico e bônus' }
    ]
  },
  {
    id: 'positions', label: 'Posições e overalls', kind: 'tableSparse', width: 1550,
    outputs: [{ key: 'positionGrid', label: 'Mapa completo de posições' }]
  },
  {
    id: 'boosters', label: 'Boosters e Ímpetos', kind: 'style', width: 1550,
    outputs: [{ key: 'impetos', label: 'Booster e Ímpeto' }]
  },
  {
    id: 'attributes', label: 'Atributos', kind: 'table', width: 1850,
    outputs: [{ key: 'attributes', label: 'Tabela completa de atributos' }]
  },
  {
    id: 'physical', label: 'Modelo físico', kind: 'table', width: 1650,
    outputs: [{ key: 'physicalModel', label: 'Modelo físico e alcance corporal' }]
  },
  {
    id: 'skills', label: 'Habilidades', kind: 'skills', width: 1900,
    outputs: [{ key: 'skills', label: 'Habilidades visíveis' }]
  }
];

function status(confidence: number, text: string): PremiumZoneReading['status'] {
  if (!text.trim()) return 'unread';
  return confidence >= 72 ? 'confirmed' : 'review';
}

function zoneFor(zone: EfhubCalibrationZone) {
  return { x: zone.x, y: zone.y, w: zone.w, h: zone.h };
}

export async function readEightEfhubCalibrationMacros(
  file: File | Blob,
  zones: EfhubCalibrationZone[],
  options: {
    imageHash: string;
    onProgress?: (completed: number, total: number, label: string) => void;
  }
): Promise<PremiumZoneReading[]> {
  const safe = normalizeEfhubCalibrationZones(zones);
  const byId = new Map(safe.map((zone) => [zone.id, zone]));
  const readings: PremiumZoneReading[] = [];
  const enabledPlans = MACRO_PLANS.filter((plan) => byId.get(plan.id)?.enabled !== false);

  for (let index = 0; index < enabledPlans.length; index += 1) {
    const plan = enabledPlans[index];
    const zone = byId.get(plan.id);
    if (!zone) continue;
    options.onProgress?.(index, enabledPlans.length, plan.label);

    let text = '';
    let confidence = 0;
    let enhancement: PremiumZoneReading['enhancement'] = 'contrast';
    const cacheBase = `${MANUAL_CALIBRATION_FAST_READER_VERSION}:${options.imageHash}:${plan.id}:${zone.x.toFixed(5)}:${zone.y.toFixed(5)}:${zone.w.toFixed(5)}:${zone.h.toFixed(5)}`;

    try {
      const image = await cropImage(file, zoneFor(zone), plan.width, 'contrast');
      const first = await recognizeWithOcrWorker(image, {
        label: `Quadrado ${index + 1}/${enabledPlans.length} • ${plan.label}`,
        kind: plan.kind,
        cacheKey: `${cacheBase}:contrast`,
        timeoutMs: 16_000
      });
      text = first.text;
      confidence = first.confidence;

      // O nome é o único quadro que recebe uma segunda tentativa, e somente
      // quando a primeira leitura é realmente fraca. Isso mantém a precisão
      // sem transformar 8 quadros em dezenas de chamadas OCR.
      if (plan.id === 'identity' && (confidence < 62 || text.trim().length < 3)) {
        const retryImage = await cropImage(file, zoneFor(zone), Math.min(1750, plan.width + 250), 'sharp');
        const retry = await recognizeWithOcrWorker(retryImage, {
          label: 'Nome • conferência rápida',
          kind: 'nameSparse',
          cacheKey: `${cacheBase}:sharp`,
          timeoutMs: 12_000
        }).catch(() => null);
        if (retry && (retry.confidence > confidence || retry.text.trim().length > text.trim().length)) {
          text = retry.text;
          confidence = retry.confidence;
          enhancement = 'sharp';
        }
      }
    } catch (error) {
      // Uma área ruim não pode congelar a carta inteira. Ela segue para
      // revisão manual enquanto os demais quadrados continuam sendo lidos.
      text = '';
      confidence = 0;
    }

    for (const output of plan.outputs) {
      readings.push({
        id: `${options.imageHash}-${plan.id}-${output.key}`,
        sourceId: options.imageHash,
        sourceLabel: `Quadrado ${plan.label}`,
        screenType: 'detailed-profile',
        key: output.key,
        label: output.label,
        text,
        confidence,
        status: status(confidence, text),
        originPreview: null,
        enhancement,
        passCount: 1,
        consistency: confidence,
        agreement: text.trim() ? 1 : 0,
        precisionVersion: MANUAL_CALIBRATION_FAST_READER_VERSION,
        validationNotes: [
          `Uma leitura do quadro manual ${plan.label}; o texto é reaproveitado para os campos relacionados.`,
          'Se algum campo ficar incerto, a revisão manual é usada em vez de repetir dezenas de passagens.'
        ],
        rawPasses: text ? [{ text, confidence, enhancement, kind: `${plan.kind}:macro-${plan.id}` }] : []
      });
    }

    options.onProgress?.(index + 1, enabledPlans.length, plan.label);
    if (typeof window !== 'undefined') await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  }

  return readings;
}
