import assert from 'node:assert/strict';
import { createReaderV2OcrWorkerSession } from '../src/modules/card-reader-v2/readerV2OcrWorker';

async function main() {
  let created = 0;
  let terminated = 0;
  let active = 0;
  let maxActive = 0;
  const session = createReaderV2OcrWorkerSession(async () => {
    created += 1;
    return {
      async recognize(input: unknown) {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return { text: String(input), confidence: 92 };
      },
      async terminate() { terminated += 1; },
    };
  });

  assert.equal(created, 0, 'seleção/construção da sessão não pode criar worker');
  await session.start('r542-worker');
  await session.start('r542-worker');
  assert.equal(created, 1, 'start deve criar no máximo um worker');

  const [first, second] = await Promise.all([
    session.recognize('A', 'first'),
    session.recognize('B', 'second'),
  ]);
  assert.equal(first.value, 'A');
  assert.equal(second.value, 'B');
  assert.equal(maxActive, 1, 'OCR deve ser serializado');

  await session.close();
  await session.close();
  assert.equal(terminated, 1, 'close idempotente termina o worker uma única vez');
  const closed = session.snapshot();
  assert.equal(closed.workerReady, false);
  assert.equal(closed.pendingRecognitions, 0);
  assert.equal(closed.stage, 'ocrClosed');
  await assert.rejects(() => session.recognize('C', 'third'));

  let cancelledTerminated = 0;
  const cancelled = createReaderV2OcrWorkerSession(async () => ({
    async recognize() { return { text: 'x', confidence: 90 }; },
    async terminate() { cancelledTerminated += 1; },
  }));
  await cancelled.start('r542-cancel');
  await cancelled.cancel();
  assert.equal(cancelledTerminated, 1, 'cancel deve terminar worker');
  assert.equal(cancelled.snapshot().workerReady, false);
  await assert.rejects(() => cancelled.recognize('x', 'x'));

  console.log('R542-B/C GREEN: worker único, OCR serial e lifecycle determinístico.');
}

void main();
