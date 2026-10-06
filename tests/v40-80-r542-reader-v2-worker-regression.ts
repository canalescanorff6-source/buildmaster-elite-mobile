import * as assert from 'node:assert/strict';
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

async function testCancelHardStopsHangingRecognition() {
  let terminateCalls = 0;
  let rejectRecognition: ((cause?: unknown) => void) | null = null;
  const session = createReaderV2OcrWorkerSession(async () => ({
    async recognize() {
      return await new Promise<never>((_resolve, reject) => {
        rejectRecognition = reject;
      });
    },
    async terminate() {
      terminateCalls += 1;
      rejectRecognition?.(new Error('worker terminated'));
    },
  }));

  await session.start();
  const pending = session.recognize('travado', 'attributes').catch(() => null);
  await delay(5);

  const outcome = await Promise.race([
    session.cancel().then(() => 'cancelled'),
    delay(80).then(() => 'timeout'),
  ]);

  assert.equal(outcome, 'cancelled', 'R543-A: cancelar não pode esperar um recognize travado terminar.');
  assert.equal(terminateCalls, 1, 'R543-A: cancelamento deve terminar o worker imediatamente.');
  assert.equal(session.snapshot().stage, 'cancelled');
  assert.equal(session.snapshot().workerReady, false);
  await pending;
}


async function testRecoverableFieldTimeoutRestartsWorker() {
  let factoryCalls = 0;
  let terminateCalls = 0;

  const session = createReaderV2OcrWorkerSession(async () => {
    factoryCalls += 1;
    const generation = factoryCalls;
    return {
      async recognize(input) {
        if (generation === 1) {
          throw Object.assign(new Error('field timeout'), { readerV2Recoverable: true });
        }
        return { text: String(input), confidence: 88 };
      },
      async terminate() {
        terminateCalls += 1;
      },
    };
  });

  await session.start();
  await assert.rejects(
    () => session.recognize('campo ruim', 'playerName'),
    /field timeout/,
    'R543-B: o campo que excedeu o tempo deve continuar sendo reportado como falha local.',
  );

  const recovered = await session.recognize('nível 35', 'level');
  assert.equal(recovered.value, 'nível 35', 'R543-B: o próximo campo deve continuar após recriar o worker.');
  assert.equal(factoryCalls, 2, 'R543-B: timeout recuperável deve criar exatamente uma nova geração de worker.');
  assert.equal(terminateCalls, 1, 'R543-B: a geração contaminada deve ser encerrada antes do restart.');
  assert.equal(session.snapshot().workerReady, true, 'R543-B: a sessão deve voltar ao estado utilizável após o restart.');

  await session.close();
  assert.equal(terminateCalls, 2, 'R543-B: close() também deve encerrar a geração recuperada.');
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

async function main() {
  await testLifecycleAndSerialization();
  await testCancelTerminatesWorker();
  await testCancelHardStopsHangingRecognition();
  await testRecoverableFieldTimeoutRestartsWorker();
  await testRecognitionErrorTerminatesWorker();
  console.log('R542-B/C + R543-A/B aprovado: lifecycle determinístico, OCR serial e cancelamento hard-stop.');
}

void main().catch((cause) => {
  console.error(cause);
  process.exitCode = 1;
});
