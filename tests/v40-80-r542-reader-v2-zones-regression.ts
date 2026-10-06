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
  assert.deepEqual(
    evidence.attributeValues,
    [90, 88, 87, 91, 92, 85, 84, 89, 86, 90, 82, 80, 79, 83, 84, 81, 85, 86, 87, 76, 77, 78, 79, 80, 81, 82],
    'R548 RED: os 26 atributos exatos precisam sobreviver como valores estruturados e na ordem lida.',
  );
}

async function testAttributeOverflowCannotMasqueradeAsExact26() {
  const attributeOnly: ReaderV2Zone[] = [
    { key: 'attributes', label: 'Atributos', x: 0.05, y: 0.2, w: 0.9, h: 0.45, enabled: true },
  ];
  const overflow = Array.from({ length: 27 }, (_, index) => String(70 + (index % 20))).join(' ');

  const imageSession = {
    async withCrop<T>(zone: ReaderV2Zone, operation: (crop: HTMLCanvasElement) => Promise<T> | T): Promise<T> {
      return await operation({ zoneKey: zone.key } as unknown as HTMLCanvasElement);
    },
  } as Pick<ReaderV2ImageSession, 'withCrop'>;
  const workerSession = {
    async recognize(_input: unknown, key: string): Promise<ReaderV2FieldEvidence> {
      if (key.startsWith('attributes-values-')) {
        return { key, label: key, value: '', confidence: 0, source: 'zones', rawText: '' };
      }
      return { key, label: key, value: overflow, confidence: 96, source: 'zones', rawText: overflow };
    },
  } as Pick<ReaderV2OcrWorkerSession, 'recognize'>;

  const evidence = await readReaderV2Zones({ imageSession, workerSession, zones: attributeOnly });
  assert.equal(evidence.attributesRead, 27, 'R548 RED: 27 valores não podem ser truncados silenciosamente para 26.');
  assert.equal(evidence.attributeValues, undefined, 'R548 RED: lista estruturada só existe quando são exatamente 26 valores válidos.');
  assert.ok(evidence.uncertainKeys.includes('attributes'), 'R548 RED: excesso de valores deve obrigar revisão dos atributos.');
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


async function testCriticalFieldsRetryOnceWhenWeak() {
  const criticalZones: ReaderV2Zone[] = [
    { key: 'playerName', label: 'Nome', x: 0, y: 0, w: 0.3, h: 0.1, enabled: true },
    { key: 'level', label: 'Nível', x: 0.3, y: 0, w: 0.2, h: 0.1, enabled: true },
    { key: 'skills', label: 'Skills', x: 0, y: 0.7, w: 1, h: 0.2, enabled: true },
  ];
  const attempts = new Map<string, number>();
  const recognitionKeys: string[] = [];
  const cropOrder: string[] = [];

  const imageSession = {
    async withCrop<T>(zone: ReaderV2Zone, operation: (crop: HTMLCanvasElement) => Promise<T> | T): Promise<T> {
      cropOrder.push(String(zone.key));
      return await operation({ zoneKey: zone.key } as unknown as HTMLCanvasElement);
    },
  } as Pick<ReaderV2ImageSession, 'withCrop'>;

  const workerSession = {
    async recognize(_input: unknown, key: string): Promise<ReaderV2FieldEvidence> {
      recognitionKeys.push(key);
      const baseKey = key.replace(/#retry$/, '');
      const attempt = (attempts.get(baseKey) ?? 0) + 1;
      attempts.set(baseKey, attempt);
      if (baseKey === 'playerName') {
        const value = attempt === 1 ? 'M3' : 'Lionel Messi';
        return { key, label: key, value, confidence: 91, source: 'zones', rawText: value };
      }
      if (baseKey === 'level') {
        const confidence = attempt === 1 ? 18 : 94;
        return { key, label: key, value: '35', confidence, source: 'zones', rawText: '35' };
      }
      return { key, label: key, value: 'Passe de primeira', confidence: 18, source: 'zones', rawText: 'Passe de primeira' };
    },
  } as Pick<ReaderV2OcrWorkerSession, 'recognize'>;

  const evidence = await readReaderV2Zones({ imageSession, workerSession, zones: criticalZones });

  assert.equal(attempts.get('playerName'), 2, 'R543-D: nome implausível deve receber uma única segunda tentativa.');
  assert.equal(attempts.get('level'), 2, 'R543-D: nível de baixa confiança deve receber uma única segunda tentativa.');
  assert.equal(attempts.get('skills'), 1, 'R543-D: campos pesados não críticos não devem ganhar multipass automático.');
  assert.ok(recognitionKeys.includes('playerName#retry'), 'R544: segunda leitura do nome deve usar o perfil alternativo #retry.');
  assert.ok(recognitionKeys.includes('level#retry'), 'R544: segunda leitura numérica deve usar o perfil alternativo #retry.');
  assert.deepEqual(cropOrder, ['playerName', 'level', 'skills'], 'R543-D: retry crítico deve reutilizar o mesmo crop, sem ampliar o pico de memória.');
  assert.equal(evidence.fields.find((field) => field.key === 'playerName')?.value, 'Lionel Messi');
  assert.ok(!evidence.uncertainKeys.includes('playerName'), 'R543-D: segunda leitura plausível deve retirar nome da revisão.');
  assert.ok(!evidence.uncertainKeys.includes('level'), 'R543-D: segunda leitura confiável deve retirar nível da revisão.');
  assert.ok(evidence.uncertainKeys.includes('skills'), 'R543-D: skill fraca deve continuar na revisão sem multipass pesado.');
}

async function testIdenticalGeometryReusesRecognition() {
  const duplicateZones: ReaderV2Zone[] = [
    { key: 'skills', label: '8. Habilidades', x: 0.01, y: 0.87, w: 0.98, h: 0.12, enabled: true },
    { key: 'specialSkill', label: '10. Habilidade especial', x: 0.01, y: 0.87, w: 0.98, h: 0.12, enabled: true },
  ];
  const cropOrder: string[] = [];
  const recognitionKeys: string[] = [];

  const imageSession = {
    async withCrop<T>(zone: ReaderV2Zone, operation: (crop: HTMLCanvasElement) => Promise<T> | T): Promise<T> {
      cropOrder.push(String(zone.key));
      return await operation({ zoneKey: zone.key } as unknown as HTMLCanvasElement);
    },
  } as Pick<ReaderV2ImageSession, 'withCrop'>;

  const workerSession = {
    async recognize(_input: unknown, key: string): Promise<ReaderV2FieldEvidence> {
      recognitionKeys.push(key);
      const value = 'Finalizador nato Cabeçada Matadora Foguete Rasante';
      return { key, label: key, value, confidence: 91, source: 'zones', rawText: value };
    },
  } as Pick<ReaderV2OcrWorkerSession, 'recognize'>;

  const evidence = await readReaderV2Zones({ imageSession, workerSession, zones: duplicateZones });

  assert.deepEqual(cropOrder, ['skills'], 'R546-A: duas zonas com geometria idêntica devem compartilhar um único crop/OCR.');
  assert.deepEqual(recognitionKeys, ['skills'], 'R546-A: geometria já lida não pode disparar uma segunda chamada ao worker.');
  assert.equal(evidence.fields.length, 2, 'R546-A: deduplicar OCR não pode remover a evidência lógica da segunda zona.');
  assert.equal(evidence.fields[1]?.key, 'specialSkill');
  assert.equal(evidence.fields[1]?.value, evidence.fields[0]?.value, 'R546-A: zona duplicada deve reutilizar a evidência da primeira leitura.');
}

async function testCanonicalSkillsAndImpetoEvidence() {
  const evidenceZones: ReaderV2Zone[] = [
    { key: 'skills', label: 'Habilidades', x: 0.05, y: 0.65, w: 0.9, h: 0.15, enabled: true },
    { key: 'impeto', label: 'Ímpeto / booster', x: 0.05, y: 0.82, w: 0.9, h: 0.10, enabled: true },
  ];
  const imageSession = {
    async withCrop<T>(zone: ReaderV2Zone, operation: (crop: HTMLCanvasElement) => Promise<T> | T): Promise<T> {
      return await operation({ zoneKey: zone.key } as unknown as HTMLCanvasElement);
    },
  } as Pick<ReaderV2ImageSession, 'withCrop'>;
  const workerSession = {
    async recognize(_input: unknown, key: string): Promise<ReaderV2FieldEvidence> {
      const value = key === 'skills'
        ? 'Passe de primeira  Passe em profundidade  Ply'
        : 'Impeto / booster: Protecao de Posse +2';
      return { key, label: key, value, confidence: 94, source: 'zones', rawText: value };
    },
  } as Pick<ReaderV2OcrWorkerSession, 'recognize'>;

  const evidence = await readReaderV2Zones({ imageSession, workerSession, zones: evidenceZones });
  assert.deepEqual(
    evidence.skillValues,
    ['Passe de primeira', 'Passe em profundidade'],
    'R549 RED: Reader V2 deve expor somente skills oficiais/canônicas, ignorando ruído OCR.',
  );
  assert.equal(evidence.impetoName, 'Proteção de Posse', 'R549 RED: Ímpeto deve ser canonizado pelo catálogo reconhecível existente.');
  assert.ok(!evidence.uncertainKeys.includes('skills'), 'R549: skills oficiais e confiáveis não devem cair em revisão.');
  assert.ok(!evidence.uncertainKeys.includes('impeto'), 'R549: Ímpeto único e reconhecível não deve cair em revisão.');

  const noisyWorker = {
    async recognize(_input: unknown, key: string): Promise<ReaderV2FieldEvidence> {
      const value = key === 'skills' ? 'Ply O IN A 123' : 'Finalização fenomenal';
      return { key, label: key, value, confidence: 98, source: 'zones', rawText: value };
    },
  } as Pick<ReaderV2OcrWorkerSession, 'recognize'>;
  const noisy = await readReaderV2Zones({ imageSession, workerSession: noisyWorker, zones: evidenceZones });
  assert.equal(noisy.skillValues, undefined, 'R549 RED: ruído com alta confiança do OCR não pode virar habilidade possuída.');
  assert.equal(noisy.impetoName, undefined, 'R549 RED: habilidade especial não pode ser confundida com Ímpeto.');
  assert.ok(noisy.uncertainKeys.includes('skills'), 'R549 RED: skill sem nome oficial deve exigir revisão.');
  assert.ok(noisy.uncertainKeys.includes('impeto'), 'R549 RED: Ímpeto sem correspondência única deve exigir revisão.');
}

async function testLevelAndPointsConsistencyGoesToReview() {
  const identityZones: ReaderV2Zone[] = [
    { key: 'level', label: 'Nível', x: 0.10, y: 0.10, w: 0.20, h: 0.10, enabled: true },
    { key: 'points', label: 'Pontos', x: 0.40, y: 0.10, w: 0.20, h: 0.10, enabled: true },
  ];

  const imageSession = {
    async withCrop<T>(zone: ReaderV2Zone, operation: (crop: HTMLCanvasElement) => Promise<T> | T): Promise<T> {
      return await operation({ zoneKey: zone.key } as unknown as HTMLCanvasElement);
    },
  } as Pick<ReaderV2ImageSession, 'withCrop'>;

  const inconsistentWorker = {
    async recognize(_input: unknown, key: string): Promise<ReaderV2FieldEvidence> {
      const baseKey = key.replace(/#retry$/, '');
      const value = baseKey === 'level' ? '34' : '60';
      return { key, label: key, value, confidence: 96, source: 'zones', rawText: value };
    },
  } as Pick<ReaderV2OcrWorkerSession, 'recognize'>;

  const inconsistent = await readReaderV2Zones({
    imageSession,
    workerSession: inconsistentWorker,
    zones: identityZones,
  });

  assert.equal(inconsistent.fields.find((field) => field.key === 'level')?.value, '34', 'R547: não corrigir/inventar o nível lido.');
  assert.equal(inconsistent.fields.find((field) => field.key === 'points')?.value, '60', 'R547: não corrigir/inventar os pontos lidos.');
  assert.ok(inconsistent.uncertainKeys.includes('level'), 'R547 RED: nível deve ir para revisão quando PP não corresponde a (nível - 1) × 2.');
  assert.ok(inconsistent.uncertainKeys.includes('points'), 'R547 RED: PP deve ir para revisão quando não corresponde ao nível.');

  const consistentWorker = {
    async recognize(_input: unknown, key: string): Promise<ReaderV2FieldEvidence> {
      const baseKey = key.replace(/#retry$/, '');
      const value = baseKey === 'level' ? '34' : '66';
      return { key, label: key, value, confidence: 96, source: 'zones', rawText: value };
    },
  } as Pick<ReaderV2OcrWorkerSession, 'recognize'>;

  const consistent = await readReaderV2Zones({
    imageSession,
    workerSession: consistentWorker,
    zones: identityZones,
  });

  assert.ok(!consistent.uncertainKeys.includes('level'), 'R547: par nível/PP consistente e confiável não deve ser marcado por conflito.');
  assert.ok(!consistent.uncertainKeys.includes('points'), 'R547: PP consistente e confiável não deve ser marcado por conflito.');
}

async function main() {
  await testSerialZonesAndPartialFailure();
  await testExactAttributeStripsAvoidBroadFallback();
  await testAttributeOverflowCannotMasqueradeAsExact26();
  await testWeakOrImpossibleEvidenceGoesToReview();
  await testCriticalFieldsRetryOnceWhenWeak();
  await testIdenticalGeometryReusesRecognition();
  await testCanonicalSkillsAndImpetoEvidence();
  await testLevelAndPointsConsistencyGoesToReview();
}

void main().then(() => {
  console.log('R542-E + R543-B/C/D aprovado: quadrados seriais, evidência fraca revisável e atributos 10+9+7 com fallback único.');
}).catch((cause) => {
  console.error(cause);
  process.exitCode = 1;
});
