import assert from 'node:assert/strict';
import {
  createReaderV2OcrWorkerSession,
  type ReaderV2WorkerFactory,
  type ReaderV2WorkerPort,
} from '../src/modules/card-reader-v2/readerV2OcrWorker';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function testLifecycleAndSerialization() {
  let factoryCalls = 0;
  let terminateCalls = 0;
  let activeRecognitions = 0;
  let maxActiveRecognitions = 0;

  const worker: ReaderV2WorkerPort = {
    async recognize(input) {
      activeRecognitions += 1;
      maxActiveRecognitions = Math.max(maxActiveRecognitions, activeRecognitions);
      await delay(15);
      activeRecognitions -= 1;
      return { text: String(input), confidence: 91 };
    },
    async terminate() {
      terminateCalls += 1;
    },
  };

  const factory: ReaderV2WorkerFactory = async () => {
    factoryCalls += 1;
    return worker;
  };

  const session = createReaderV2OcrWorkerSession(factory);
  assert.equal(factoryCalls, 0, 'R542-B: criar a sessão/selecionar imagem não pode criar worker.');
  assert.equal(session.snapshot().workerReady, false);

  await Promise.all([session.start(), session.start(), session.start()]);
  assert.equal(factoryCalls, 1, 'R542-B: start() concorrente deve criar no máximo um worker.');
  assert.equal(session.snapshot().workerReady, true);

  const [first, second] = await Promise.all([
    session.recognize('primeiro', 'playerName'),
    session.recognize('segundo', 'level'),
  ]);

  assert.equal(maxActiveRecognitions, 1, 'R542-C: reconhecimentos precisam ser serializados.');
  assert.equal(first.value, 'primeiro');
  assert.equal(second.value, 'segundo');
  assert.equal(session.snapshot().pendingRecognitions, 0);

  await session.close();
  await session.close();
  assert.equal(terminateCalls, 1, 'R542-B: close() deve ser idempotente e terminar o worker uma única vez.');
  assert.deepEqual(
    { workerReady: session.snapshot().workerReady, pendingRecognitions: session.snapshot().pendingRecognitions, stage: session.snapshot().stage },
    { workerReady: false, pendingRecognitions: 0, stage: 'ocrClosed' },
    'R542-B: após close() a sessão deve estar realmente sem OCR ativo.'
  );
  await assert.rejects(() => session.recognize('depois', 'points'), /encerrada|fechada|cancelada/i);
}

async function testCancelTerminatesWorker() {
  let terminateCalls = 0;
  const session = createReaderV2OcrWorkerSession(async () => ({
    async recognize(input) { return { text: String(input), confidence: 80 }; },
    async terminate() { terminateCalls += 1; },
  }));

  await session.start();
  await session.cancel();
  assert.equal(terminateCalls, 1, 'R542-B: cancelamento precisa terminar o worker.');
  assert.equal(session.snapshot().workerReady, false);
  assert.equal(session.snapshot().pendingRecognitions, 0);
  assert.equal(session.snapshot().stage, 'cancelled');
  await assert.rejects(() => session.recognize('x', 'playerName'), /cancelada|encerrada|fechada/i);
}

async function testRecognitionErrorTerminatesWorker() {
  let terminateCalls = 0;
  const session = createReaderV2OcrWorkerSession(async () => ({
    async recognize() { throw new Error('ocr exploded'); },
    async terminate() { terminateCalls += 1; },
  }));

  await session.start();
  await assert.rejects(() => session.recognize('x', 'playerName'), /ocr exploded/);
  assert.equal(terminateCalls, 1, 'R542-B: erro OCR precisa terminar o worker para não contaminar a próxima leitura.');
  assert.equal(session.snapshot().workerReady, false);
  assert.equal(session.snapshot().pendingRecognitions, 0);
  assert.equal(session.snapshot().stage, 'error');
  assert.match(session.snapshot().error ?? '', /ocr exploded/);
}

await testLifecycleAndSerialization();
await testCancelTerminatesWorker();
await testRecognitionErrorTerminatesWorker();

console.log('R542-B/C aprovado: lifecycle determinístico e OCR serial.');
