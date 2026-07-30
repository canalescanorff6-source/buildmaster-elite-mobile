import type { OcrZone } from '@/lib/ocr';
import { canonicalEfhubOcrZones } from './efhubLayoutGeometry';

export const EFHUB_PROFILE_VERSION = '32.00-visual-calibration-profile-1';
export const EFHUB_PROFILE_ID = 'efhub-complete-profile-v1';

export const EFHUB_EXPECTED_COUNTS = {
  attributes: 26,
  positions: 13,
  physicalModel: 16
} as const;

export type EfhubProfileGate = {
  key: 'identity' | 'positions' | 'attributes' | 'physicalModel' | 'skills';
  label: string;
  recognized: number;
  expected: number | null;
  status: 'complete' | 'review' | 'blocked';
  reason: string;
};

export type EfhubProfileAudit = {
  id: typeof EFHUB_PROFILE_ID;
  version: string;
  detected: boolean;
  score: number;
  ready: boolean;
  gates: EfhubProfileGate[];
  missing: string[];
};

/**
 * As coordenadas partem do mapa oficial 1400 × 1600 enviado pelo usuário.
 * O módulo efhubLayoutGeometry converte essas áreas para a resolução real,
 * compensa barras e impede leitura de regiões cortadas.
 */
export const EFHUB_PROFILE_ZONES: OcrZone[] = canonicalEfhubOcrZones();

export const EFHUB_CARD_ART_ZONE: OcrZone =
  EFHUB_PROFILE_ZONES.find((item) => item.key === 'cardType') ?? {
    key: 'cardType', label: 'Carta completa e arte do jogador',
    x: 75 / 1400, y: 115 / 1600, w: 260 / 1400, h: 355 / 1600, enabled: true
  };

function normalized(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isLikelyEfhubProfileGeometry(width: number, height: number) {
  const ratio = width / Math.max(1, height);
  return width >= 900 && height >= 1000 && ratio >= 0.80 && ratio <= 0.93;
}

export function looksLikeEfhubProfileText(text: string) {
  const norm = normalized(text);
  const strongMarkers = [
    'modelo de jogador',
    'raio de cobertura das pernas',
    'raio de cobertura dos bracos',
    'condicao fisica',
    'resistencia a lesao',
    'talento ofensivo',
    'talento defensivo',
    'habilidades'
  ];
  const positionMarkers = ['lwf', 'cf', 'rwf', 'ss', 'amf', 'cmf', 'dmf', 'cb', 'gk'];
  const strongCount = strongMarkers.filter((marker) => norm.includes(marker)).length;
  const positionCount = positionMarkers.filter((marker) => new RegExp(`(?:^|\\s)${marker}(?:\\s|$)`).test(norm)).length;
  return strongCount >= 4 && positionCount >= 3;
}

export function buildEfhubProfileAudit(input: {
  detected: boolean;
  identityCount: number;
  positionCount: number;
  attributeCount: number;
  physicalCount: number;
  skillCount: number;
  unknownSkillCount: number;
}): EfhubProfileAudit {
  const gates: EfhubProfileGate[] = [
    {
      key: 'identity',
      label: 'Identidade da carta',
      recognized: input.identityCount,
      expected: 8,
      status: input.identityCount >= 7 ? 'complete' : input.identityCount >= 5 ? 'review' : 'blocked',
      reason: input.identityCount >= 7 ? 'Nome, estilo, GER, posição e dados principais foram encontrados.' : 'Faltam dados críticos do cabeçalho.'
    },
    {
      key: 'positions',
      label: 'Mapa de posições',
      recognized: input.positionCount,
      expected: EFHUB_EXPECTED_COUNTS.positions,
      status: input.positionCount === EFHUB_EXPECTED_COUNTS.positions ? 'complete' : input.positionCount >= 10 ? 'review' : 'blocked',
      reason: input.positionCount === EFHUB_EXPECTED_COUNTS.positions ? 'Todas as 13 células foram lidas.' : 'A grade precisa ser relida célula por célula.'
    },
    {
      key: 'attributes',
      label: 'Atributos',
      recognized: input.attributeCount,
      expected: EFHUB_EXPECTED_COUNTS.attributes,
      status: input.attributeCount === EFHUB_EXPECTED_COUNTS.attributes ? 'complete' : input.attributeCount >= 22 ? 'review' : 'blocked',
      reason: input.attributeCount === EFHUB_EXPECTED_COUNTS.attributes ? 'Os 26 atributos estão completos.' : 'Nenhum atributo ausente deve ser estimado.'
    },
    {
      key: 'physicalModel',
      label: 'Modelo físico',
      recognized: input.physicalCount,
      expected: EFHUB_EXPECTED_COUNTS.physicalModel,
      status: input.physicalCount === EFHUB_EXPECTED_COUNTS.physicalModel ? 'complete' : input.physicalCount >= 12 ? 'review' : 'blocked',
      reason: input.physicalCount === EFHUB_EXPECTED_COUNTS.physicalModel ? 'As 16 medidas corporais estão completas.' : 'Faltam medidas de alcance ou colisão.'
    },
    {
      key: 'skills',
      label: 'Habilidades',
      recognized: input.skillCount + input.unknownSkillCount,
      expected: null,
      status: input.skillCount + input.unknownSkillCount >= 1 && input.unknownSkillCount === 0 ? 'complete' : input.skillCount + input.unknownSkillCount >= 1 ? 'review' : 'blocked',
      reason: input.unknownSkillCount > 0 ? `${input.unknownSkillCount} habilidade(s) nova(s) aguardam confirmação.` : 'Todas as cápsulas reconhecidas estão no catálogo confiável.'
    }
  ];
  const missing = gates.filter((gate) => gate.status !== 'complete').map((gate) => gate.label);
  const weighted = gates.reduce((sum, gate) => sum + (gate.status === 'complete' ? 20 : gate.status === 'review' ? 11 : 2), 0);
  const score = input.detected ? Math.min(100, weighted) : 0;
  return {
    id: EFHUB_PROFILE_ID,
    version: EFHUB_PROFILE_VERSION,
    detected: input.detected,
    score,
    ready: input.detected && gates.every((gate) => gate.status === 'complete'),
    gates,
    missing
  };
}
