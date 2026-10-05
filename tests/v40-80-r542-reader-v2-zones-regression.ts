import assert from 'node:assert/strict';
import { readReaderV2Zones } from '../src/modules/card-reader-v2/readerV2Zones';
import type { ReaderV2Zone } from '../src/modules/card-reader-v2/readerV2Types';

async function main() {
  const zones: ReaderV2Zone[] = [
    { key: 'playerName', label: 'Nome', x: 0, y: 0, w: .5, h: .1 },
    { key: 'attributes', label: 'Atributos', x: 0, y: .1, w: 1, h: .5, kind: 'attributes' },
    { key: 'points', label: 'Pontos', x: .5, y: 0, w: .5, h: .1 },
  ];
  const order: string[] = [];
  let crops = 0;
  let maxCrops = 0;
  const imageSession = {
    async withCrop<T>(zone: ReaderV2Zone, cb: (input: unknown) => Promise<T> | T) {
      crops += 1; maxCrops = Math.max(maxCrops, crops); order.push(`crop:${zone.key}`);
      try { return await cb(zone.key); } finally { crops -= 1; }
    },
  };
  const worker = {
    async recognize(_input: unknown, key: string) {
      order.push(`ocr:${key}`);
      if (key === 'playerName') return { key, label: key, value: 'Messi', confidence: 95 };
      if (key === 'attributes') return { key, label: key, value: '90 91 92', confidence: 92 };
      return { key, label: key, value: '', confidence: 0, uncertain: true };
    },
  };
  const progress: string[] = [];
  const evidence = await readReaderV2Zones({ sessionId: 'z1', zones, imageSession, worker, onProgress: (p) => progress.push(p.key ?? '') });
  assert.equal(maxCrops, 1);
  assert.deepEqual(order, ['crop:playerName','ocr:playerName','crop:attributes','ocr:attributes','crop:points','ocr:points']);
  assert.ok(evidence.uncertainKeys.includes('attributes'), 'atributos 3/26 devem ficar incertos');
  assert.ok(evidence.uncertainKeys.includes('points'), 'campo vazio deve ficar incerto');
  assert.equal(progress.length, 3);
  console.log('R542-E GREEN: zonas sequenciais, fail-soft e atributos incompletos sinalizados.');
}
void main();
