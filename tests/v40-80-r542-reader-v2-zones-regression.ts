import * as assert from 'node:assert/strict';
import { mapLegacyCalibrationToReaderV2, READER_V2_DEFAULT_ZONES } from '../src/modules/card-reader-v2/readerV2ZoneProfile';
import { readReaderV2Zones } from '../src/modules/card-reader-v2/readerV2Zones';
import type { ReaderV2ImageSession } from '../src/modules/card-reader-v2/readerV2ImageSession';
import type { ReaderV2OcrWorkerSession } from '../src/modules/card-reader-v2/readerV2OcrWorker';
import type { ReaderV2FieldEvidence, ReaderV2Progress, ReaderV2Zone } from '../src/modules/card-reader-v2/readerV2Types';

const zones: ReaderV2Zone[] = [
  { key: 'playerName', label: 'Nome', x: 0, y: 0, w: 0.2, h: 0.1, enabled: true },
  { key: 'level', label: 'Nível', x: 0.2, y: 0, w: 0.2, h: 0.1, enabled: true },
  { key: 'points', label: 'Pontos', x: 0.4, y: 0, w: 0.2, h: 0.1, enabled: true },
  { key: 'attributes', label: '26 atributos', x: 0, y: 0.2, w: 1, h: 0.4, enabled: true },
  { key: 'skills', label: 'Habilidades', x: 0, y: 0.7, w: 1, h: 0.2, enabled: true },
];

async function testSerialZonesAndPartialFailure() {
  assert.equal(READER_V2_DEFAULT_ZONES.length, 10, 'R542-E: perfil padrão precisa manter as 10 macrozonas calibradas.');

  const mapped = mapLegacyCalibrationToReaderV2([
    { key: 'name', label: 'Identidade', x: 0.1, y: 0.2, w: 0.3, h: 0.1, enabled: true },
    { key: 'impetos', label: 'Ímpeto', x: 0.2, y: 0.3, w: 0.4, h: 0.1, enabled: true },
  ]);
  assert.equal(mapped[0]?.key, 'playerName');
  assert.equal(mapped[1]?.key, 'impeto');
  assert.deepEqual(mapped.map((zone) => zone.label), ['Identidade', 'Ímpeto'], 'R542-E: calibração precisa preservar ordem e rótulos do usuário.');

  const results: Record<string, string | Error> = {
    playerName: 'Lionel Messi',
    level: '34',
    points: '',
    'attributes-values-left': '90 88 87',
    'attributes-values-center': '',
    'attributes-values-right': '82',
    attributes: '90 88 87 91 92 85 84 89 86 90 82 80',
    skills: new Error('falha recuperável da zona skills'),
  };
  const cropOrder: string[] = [];
  let activeCrops = 0;
  let maxActiveCrops = 0;
  const progress: ReaderV2Progress[] = [];

  const imageSession = {
    async withCrop<T>(zone: ReaderV2Zone, operation: (crop: HTMLCanvasElement) => Promise<T> | T): Promise<T> {
      activeCrops += 1;
      maxActiveCrops = Math.max(maxActiveCrops, activeCrops);
      cropOrder.push(String(zone.key));
      try {
        return await operation({ zoneKey: zone.key } as unknown as HTMLCanvasElement);
      } finally {
        activeCrops -= 1;
      }
    },
  } as Pick<ReaderV2ImageSession, 'withCrop'>;

  const workerSession = {
    async recognize(_input: unknown, key: string): Promise<ReaderV2FieldEvidence> {
      const next = results[key];
      if (next instanceof Error) throw next;
      return {
        key,
        label: key,
        value: next ?? '',
        confidence: next ? 93 : 0,
        source: 'zones',
        rawText: next ?? '',
      };
    },
  } as Pick<ReaderV2OcrWorkerSession, 'recognize'>;

  const evidence = await readReaderV2Zones({
    imageSession,
    workerSession,
    zones,
    onProgress: (snapshot) => progress.push(snapshot),
  });

  assert.deepEqual(cropOrder, ['playerName', 'level', 'points', 'attributes-values-left', 'attributes-values-center', 'attributes-values-right', 'attributes', 'skills'], 'R543-C: atributos devem tentar 10+9+7 serialmente e usar fallback único quando incompletos.');
  assert.equal(maxActiveCrops, 1, 'R542-E: somente um crop pode estar ativo por vez.');
  assert.equal(progress.filter((item) => item.stage === 'reading').at(-1)?.current, zones.length, 'R542-E: progresso precisa chegar ao total de zonas.');
  assert.equal(evidence.fields.length, zones.length, 'R542-E: falha de uma zona não pode cancelar as demais.');
  assert.match(evidence.fields.find((field) => field.key === 'skills')?.error ?? '', /falha recuperável/, 'R542-E: erro da zona deve ser registrado como evidência recuperável.');
  assert.ok(evidence.uncertainKeys.includes('points'), 'R542-E: campo vazio precisa ir para conferência.');
  assert.ok(evidence.uncertainKeys.includes('skills'), 'R542-E: zona com erro precisa ir para conferência.');
  assert.ok(evidence.uncertainKeys.includes('attributes'), 'R542-E: atributos muito incompletos precisam ir para conferência.');
  assert.equal(evidence.attributesExpected, 26);
  assert.equal(evidence.attributesRead, 12, 'R542-E: leitura parcial não pode fingir 26 atributos.');
  assert.equal(evidence.mode, 'zones');
  assert.match(evidence.rawText, /Lionel Messi/);
}

async function testExactAttributeStripsAvoidBroadFallback() {
  const attributeOnly: ReaderV2Zone[] = [
    { key: 'attributes', label: 'Atributos', x: 0.05, y: 0.2, w: 0.9, h: 0.45, enabled: true },
  ];
  const stripValues: Record<string, string> = {
    'attributes-values-left': '90 88 87 91 92 85 84 89 86 90',
    'attributes-values-center': '82 80 79 83 84 81 85 86 87',
    'attributes-values-right': '76 77 78 79 80 81 82',
  };
  const cropOrder: string[] = [];

  const imageSession = {
    async withCrop<T>(zone: ReaderV2Zone, operation: (crop: HTMLCanvasElement) => Promise<T> | T): Promise<T> {
      cropOrder.push(String(zone.key));
      return await operation({ zoneKey: zone.key } as unknown as HTMLCanvasElement);
    },
  } as Pick<ReaderV2ImageSession, 'withCrop'>;
  const workerSession = {
    async recognize(_input: unknown, key: string): Promise<ReaderV2FieldEvidence> {
      if (key === 'attributes') throw new Error('R543-C: fallback amplo não deveria rodar com 10+9+7 completos.');
      const value = stripValues[key] ?? '';
      return { key, label: key, value, confidence: 92, source: 'zones', rawText: value };
    },
  } as Pick<ReaderV2OcrWorkerSession, 'recognize'>;

  const evidence = await readReaderV2Zones({ imageSession, workerSession, zones: attributeOnly });
  assert.deepEqual(cropOrder, ['attributes-values-left', 'attributes-values-center', 'attributes-values-right'], 'R543-C: 26 atributos completos devem usar somente as três tiras numéricas.');
  assert.equal(evidence.attributesRead, 26, 'R543-C: 10+9+7 badges válidos devem fechar os 26 atributos.');
  assert.ok(!evidence.uncertainKeys.includes('attributes'), 'R543-C: atributos completos e confiáveis não devem cair em revisão.');
  assert.equal((evidence.fields.find((field) => field.key === 'attributes')?.value.match(/\b\d{1,3}\b/g) ?? []).length, 26);
}

async function testWeakOrImpossibleEvidenceGoesToReview() {
  const weakZones: ReaderV2Zone[] = [
    { key: 'playerName', label: 'Nome', x: 0, y: 0, w: 0.2, h: 0.1, enabled: true },
    { key: 'level', label: 'Nível', x: 0.2, y: 0, w: 0.2, h: 0.1, enabled: true },
    { key: 'points', label: 'Pontos', x: 0.4, y: 0, w: 0.2, h: 0.1, enabled: true },
    { key: 'mainPosition', label: 'Posição', x: 0.6, y: 0, w: 0.2, h: 0.1, enabled: true },
    { key: 'attributes', label: 'Atributos', x: 0, y: 0.2, w: 1, h: 0.4, enabled: true },
    { key: 'skills', label: 'Skills', x: 0, y: 0.7, w: 1, h: 0.2, enabled: true },
  ];
  const exact26 = Array.from({ length: 26 }, (_, index) => String(70 + (index % 25))).join(' ');
  const weak: Record<string, { value: string; confidence: number }> = {
    playerName: { value: '111111', confidence: 92 },
    level: { value: 'XX', confidence: 95 },
    points: { value: '42', confidence: 18 },
    mainPosition: { value: 'CA', confidence: 22 },
    attributes: { value: exact26, confidence: 24 },
    skills: { value: 'Finalização precisa', confidence: 18 },
  };

  const imageSession = {
    async withCrop<T>(zone: ReaderV2Zone, operation: (crop: HTMLCanvasElement) => Promise<T> | T): Promise<T> {
      return await operation({ zoneKey: zone.key } as unknown as HTMLCanvasElement);
    },
  } as Pick<ReaderV2ImageSession, 'withCrop'>;
  const workerSession = {
    async recognize(_input: unknown, key: string): Promise<ReaderV2FieldEvidence> {
      const next = weak[key] ?? { value: '', confidence: 0 };
      return { key, label: key, value: next.value, confidence: next.confidence, source: 'zones', rawText: next.value };
    },
  } as Pick<ReaderV2OcrWorkerSession, 'recognize'>;

  const evidence = await readReaderV2Zones({ imageSession, workerSession, zones: weakZones });
  for (const key of ['playerName', 'level', 'points', 'mainPosition', 'attributes', 'skills']) {
    assert.ok(evidence.uncertainKeys.includes(key), `R543-B: ${key} fraco/impossível deve ir para conferência.`);
  }
  assert.equal(evidence.fields.find((field) => field.key === 'playerName')?.value, '111111', 'R543-B: evidência fraca deve ser preservada, não inventada/corrigida.');
  assert.equal(evidence.attributesRead, 26, 'R543-B: contagem completa não pode esconder baixa confiança.');
}

async function main() {
  await testSerialZonesAndPartialFailure();
  await testExactAttributeStripsAvoidBroadFallback();
  await testWeakOrImpossibleEvidenceGoesToReview();
}

void main().then(() => {
  console.log('R542-E + R543-B/C aprovado: quadrados seriais, evidência fraca revisável e atributos 10+9+7 com fallback único.');
}).catch((cause) => {
  console.error(cause);
  process.exitCode = 1;
});
