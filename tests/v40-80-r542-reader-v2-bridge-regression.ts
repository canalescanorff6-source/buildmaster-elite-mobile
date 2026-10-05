import * as assert from 'node:assert/strict';
import { createReaderV2Bridge } from '../src/modules/card-reader-v2/readerV2Bridge';
import type { ReaderV2ReviewDraft, ReaderV2SessionSnapshot } from '../src/modules/card-reader-v2/readerV2Types';

const draft: ReaderV2ReviewDraft = {
  playerName: 'Messi', level: '34', points: '66', mainPosition: 'SS', rawText: 'Messi', fields: [], uncertainKeys: [], preview: null,
};
const closed: ReaderV2SessionSnapshot = {
  stage: 'ocrClosed', mode: 'zones', workerReady: false, pendingRecognitions: 0, cancelled: false, error: null,
};

async function main() {
  let pipelineCalls = 0;
  const bridge = createReaderV2Bridge(async (payload) => {
    pipelineCalls += 1;
    return `${payload.playerName}:${payload.level}:${payload.points}`;
  });

  await assert.rejects(() => bridge.forward({ ...closed, stage: 'reading' }, draft), /ocrClosed|encerrad/i);
  await assert.rejects(() => bridge.forward({ ...closed, workerReady: true }, draft), /worker|ocr/i);
  await assert.rejects(() => bridge.forward({ ...closed, pendingRecognitions: 1 }, draft), /pendente|reconhecimento/i);
  assert.equal(pipelineCalls, 0, 'R542-F: pipeline atual não pode ser chamado antes do OCR estar totalmente fechado.');

  const result = await bridge.forward(closed, draft);
  assert.equal(result, 'Messi:34:66');
  assert.equal(pipelineCalls, 1, 'R542-F: bridge deve chamar o pipeline exatamente uma vez.');

  await assert.rejects(() => bridge.forward(closed, draft), /já|finalizad|uma vez/i);
  assert.equal(pipelineCalls, 1, 'R542-F: segunda finalização nunca pode duplicar ficha/persistência.');
}

void main().then(() => console.log('R542-F aprovado: bridge fail-closed e finalização única.')).catch((cause) => {
  console.error(cause);
  process.exitCode = 1;
});
