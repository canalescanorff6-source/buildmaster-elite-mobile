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

async function main() {
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

  assert.deepEqual(cropOrder, ['playerName', 'level', 'points', 'attributes', 'skills'], 'R542-E: zonas devem ser lidas em ordem determinística.');
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

void main().then(() => {
  console.log('R542-E aprovado: quadrados seriais, progresso e falhas parciais honestas.');
}).catch((cause) => {
  console.error(cause);
  process.exitCode = 1;
});
