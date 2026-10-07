import * as assert from 'node:assert/strict';
import { createReaderV2Orchestrator } from '../src/modules/card-reader-v2/readerV2Orchestrator';
import { createReaderV2OcrWorkerSession } from '../src/modules/card-reader-v2/readerV2OcrWorker';
import { buildReaderV2ReviewDraft, assertReaderV2ReviewReady } from '../src/modules/card-reader-v2/readerV2Review';

async function main() {
  let finishOpening!: (image:any)=>void;
  let enteredOpening!: ()=>void;
  const openingEntered=new Promise<void>(resolve=>{enteredOpening=resolve;});
  let closedImages=0,workerStarts=0;
  const orchestrator=createReaderV2Orchestrator({
    openImageSession:async()=>{enteredOpening();return new Promise(resolve=>{finishOpening=resolve;});},
    createWorkerSession:()=>{workerStarts++;return createReaderV2OcrWorkerSession(()=>({recognize:async()=>({text:''}),terminate:()=>{}}));},
    readAutomatic:async()=>({mode:'automatic',rawText:'',fields:[],uncertainKeys:[]}),
    readZones:async()=>({mode:'zones',rawText:'',fields:[],uncertainKeys:[]}),
    buildReview:buildReaderV2ReviewDraft,assertReviewReady:assertReaderV2ReviewReady,
  });
  await orchestrator.select(new Blob(['image'],{type:'image/png'}));
  const reading=orchestrator.start('automatic');
  await openingEntered;
  await orchestrator.cancel();
  finishOpening({preview:'blob:late',width:100,height:100,close:()=>{closedImages++;},withCrop:async()=>{},snapshot:()=>({})});
  await assert.rejects(()=>reading,/cancelad|encerrad/i,'Leitura cancelada na decodificação não pode ressuscitar o worker/conferência.');
  assert.equal(workerStarts,0);
  assert.equal(closedImages,1);
  assert.equal(orchestrator.snapshot().stage,'cancelled');

  let started!:()=>void;
  const recognizeStarted=new Promise<void>(resolve=>{started=resolve;});
  let terminations=0;
  const session=createReaderV2OcrWorkerSession(()=>({recognize:async()=>{started();return new Promise(()=>{});},terminate:()=>{terminations++;}}));
  const pending=session.recognize({},'playerName');
  pending.catch(()=>{});
  await recognizeStarted;
  let cancelled=false;
  const cancellation=session.cancel().then(()=>{cancelled=true;});
  await new Promise<void>(resolve=>setImmediate(resolve));
  assert.equal(cancelled,true,'Cancelar deve encerrar o recurso sem esperar um recognize que nunca termina.');
  await cancellation;
  assert.equal(terminations,1);
  assert.equal(session.snapshot().stage,'cancelled');
}
void main().then(()=>console.log('Reader V2: cancelamento na abertura e no OCR travado aprovado.')).catch(cause=>{console.error(cause);process.exitCode=1;});
