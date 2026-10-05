import assert from 'node:assert/strict';
import { createReaderV2Orchestrator } from '../src/modules/card-reader-v2/readerV2Orchestrator';
import { createReaderV2OcrWorkerSession } from '../src/modules/card-reader-v2/readerV2OcrWorker';
import type { ReaderV2Zone } from '../src/modules/card-reader-v2/readerV2Types';

async function main() {
  const events: string[] = [];
  let workerCreated = 0;
  let workerClosed = 0;
  let analysisCalls = 0;
  const zones: ReaderV2Zone[] = [
    { key:'playerName', label:'Nome', x:0, y:0, w:.5, h:.1 },
    { key:'level', label:'Nível', x:.5, y:0, w:.25, h:.1 },
    { key:'points', label:'Pontos', x:.75, y:0, w:.25, h:.1 },
    { key:'mainPosition', label:'Posição', x:0, y:.1, w:.25, h:.1 },
  ];
  const orchestrator = createReaderV2Orchestrator({
    zones,
    openImageSession: async () => ({
      previewUrl: 'blob:image',
      async withCrop<T>(zone: ReaderV2Zone, callback: (value: HTMLCanvasElement) => Promise<T> | T) {
        return await callback(zone.key as unknown as HTMLCanvasElement);
      },
      async close() {},
      snapshot: () => ({ width:100, height:100, previewUrl:'blob:image', closed:false, cropActive:false }),
    }),
    createWorkerSession: () => createReaderV2OcrWorkerSession(async () => {
      workerCreated += 1;
      return {
        async recognize(input: unknown) {
          const key = String(input);
          const values: Record<string,string> = { playerName:'Messi', level:'10', points:'18', mainPosition:'SS' };
          return { text: values[key] ?? '', confidence:95 };
        },
        async terminate() { workerClosed += 1; },
      };
    }),
    onEvent: (event) => events.push(event),
    analysisProbe: () => { analysisCalls += 1; },
  });
  const fake = new File(['x'], 'card.png', { type:'image/png' });
  await orchestrator.select(fake);
  assert.equal(workerCreated, 0, 'select não pode criar worker');
  const result = await orchestrator.start('automatic');
  assert.equal(workerCreated, 1);
  assert.equal(workerClosed, 1);
  assert.equal(analysisCalls, 0, 'OCR não pode executar análise final');
  assert.equal(result.snapshot.stage, 'ocrClosed');
  assert.equal(result.review.playerName, 'Messi');
  assert.ok(events.indexOf('worker_terminated') < events.indexOf('review_opened'));
  console.log('R542-D GREEN: automático conclui OCR, fecha worker e só então abre review.');
}
void main();
