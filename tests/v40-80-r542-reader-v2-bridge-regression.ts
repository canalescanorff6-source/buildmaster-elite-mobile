import assert from 'node:assert/strict';
import { bridgeReaderV2Review } from '../src/modules/card-reader-v2/readerV2Bridge';
import type { ReaderV2ReviewDraft, ReaderV2SessionSnapshot } from '../src/modules/card-reader-v2/readerV2Types';

async function main() {
  const draft: ReaderV2ReviewDraft = { playerName:'X', level:'10', points:'18', mainPosition:'CF', rawText:'X', fields:[], uncertainKeys:[], preview:null };
  const base: ReaderV2SessionSnapshot = { sessionId:'s', mode:'automatic', stage:'ocrClosed', workerReady:false, pendingRecognitions:0, cancelled:false, imageSelected:true };
  let calls = 0;
  const port = { finalize(payload: ReaderV2ReviewDraft) { calls += 1; return payload.playerName; } };

  await assert.rejects(() => bridgeReaderV2Review(draft, { ...base, stage:'reading' }, port));
  await assert.rejects(() => bridgeReaderV2Review(draft, { ...base, workerReady:true }, port));
  await assert.rejects(() => bridgeReaderV2Review(draft, { ...base, pendingRecognitions:1 }, port));
  assert.equal(calls, 0);
  const result = await bridgeReaderV2Review(draft, base, port);
  assert.equal(result, 'X');
  assert.equal(calls, 1);
  console.log('R542-F GREEN: bridge fail-closed após OCR encerrado.');
}
void main();
