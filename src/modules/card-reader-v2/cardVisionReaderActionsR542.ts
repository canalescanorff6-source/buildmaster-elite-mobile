/** R542 — boundary leve: V2 primeiro; clássico só após fallback/confirmação. */
import type { CardVisionReaderActionsInputR187,CardVisionReadingModeR187 } from '../card-reader/cardVisionReaderActionsLegacyR187';
import type { OcrQueueJob } from '../card-reader/ocrQueue';
import type { TotalCardCaptureInput } from '../../lib/totalCardReader';
import type { PremiumEnhancementMode } from '../../lib/premiumReading';
import type { ReaderV2Bridge } from './readerV2Bridge';
import type { ReaderV2Orchestrator } from './readerV2Orchestrator';
import type { ReaderV2ReviewDraft,ReaderV2SessionSnapshot } from './readerV2Types';
import { readReaderV2Backend } from './readerV2FeatureGate';
import { mapLegacyCalibrationToReaderV2 } from './readerV2ZoneProfile';
export type { CardVisionReaderActionsInputR187,CardVisionReadingModeR187 };

let readerV2OrchestratorR542:ReaderV2Orchestrator|null=null;
let readerV2ClosedSnapshotR542:ReaderV2SessionSnapshot|null=null;
let readerV2ReviewDraftR542:ReaderV2ReviewDraft|null=null;
let readerV2BridgeR542:ReaderV2Bridge<unknown>|null=null;
const isV2=()=>readReaderV2Backend()==='v2';
async function loadLegacyActions(input:CardVisionReaderActionsInputR187){const legacy=await import('../card-reader/cardVisionReaderActionsLegacyR187');return legacy.createCardVisionReaderActionsR187(input)}
function clearFinal(){readerV2ClosedSnapshotR542=null;readerV2ReviewDraftR542=null;readerV2BridgeR542=null}
function raw(review:ReaderV2ReviewDraft){const canonical=[review.skillValues?.length?`HABILIDADES JÁ POSSUI: ${review.skillValues.join(', ')}`:'',review.impetoName?`ÍMPETO: ${review.impetoName}`:''].filter(Boolean).join('\n');return [canonical,review.fields.filter(f=>f.value.trim()).map(f=>`${f.label}: ${f.value.trim()}`).join('\n'),review.rawText.trim()].filter(Boolean).join('\n')}

export function createCardVisionReaderActionsR187(input:CardVisionReaderActionsInputR187){
 async function stopV2(cancel=false){if(!readerV2OrchestratorR542)return;if(cancel)await readerV2OrchestratorR542.cancel().catch(()=>undefined);readerV2OrchestratorR542.close();readerV2OrchestratorR542=null}
 async function handleFile(file:File){
  if(isV2()){
   if(!file.type?.toLowerCase().startsWith('image/')){input.setStatus('Selecione uma imagem válida da carta.');return}
   await stopV2(true);clearFinal();input.setPendingBackgroundCheckpoint(null);input.setFileName(file.name||`reader-v2-${Date.now()}.png`);input.setSelectedFile(file);input.setPreview(input.readerImageMemory.replacePreview(file));
   input.setPlayerCardImage(null);input.setCardCropResult(null);input.setCardCropAdjustOpen(false);input.setResult(null);input.setDraftResult(null);input.setRawText('');input.setOcrDone(false);input.setLoading(false);input.setOcrCancelable(false);input.setReaderProgress(null);input.setPremiumReadings([]);input.setTotalReadingSession(null);input.setSinglePrintSession(null);input.readerImageMemory.releaseEnhanced();input.setEnhancedPreview(null);input.setQualityReport(null);input.setEnhancementMode('original');input.setManualMode(false);input.setPreFinalConfirmation(null);input.setStatus('Imagem selecionada no Reader V2. O OCR só será carregado quando você iniciar a leitura.');return
  }
  return (await loadLegacyActions(input)).handleFile(file)
 }
 async function analyzeSelectedImage(fileOverride?:File,resumed=false){
  if(!isV2())return (await loadLegacyActions(input)).analyzeSelectedImage(fileOverride,resumed);
  const file=fileOverride??input.selectedFile;if(!file){input.setLoading(false);input.setOcrCancelable(false);input.setStatus('Selecione novamente a imagem da carta para iniciar o Reader V2.');return}
  const startedAt=Date.now();input.setLoading(true);input.setOcrCancelable(true);input.setReaderProgress({percent:1,phase:'Iniciando Reader V2',detail:'Preparando a leitura leve antes de iniciar o worker OCR.',startedAt,completed:0,total:0,deadlineMs:120_000});input.setStatus('Iniciando Reader V2 em memória isolada...');
  try{
   const runtime=await import('./readerV2AppRuntime');
   const orchestrator=runtime.createReaderV2AppOrchestrator(p=>input.setReaderProgress({percent:p.percent,phase:p.label,detail:p.detail??'Lendo um campo por vez e liberando cada recorte.',startedAt,completed:p.current,total:p.total,deadlineMs:120_000}));readerV2OrchestratorR542=orchestrator;await orchestrator.select(file);
   const zones=input.efhubCalibrationActiveRef.current?mapLegacyCalibrationToReaderV2(input.efhubCalibrationZonesRef.current):undefined;
   const output=await orchestrator.start(zones?'zones':'automatic',zones);readerV2ClosedSnapshotR542=output.ocrSnapshot;readerV2ReviewDraftR542=output.review;readerV2BridgeR542=null;
   input.setRawText(raw(output.review));input.setOcrDone(true);input.setManualMode(true);input.setManualFields(current=>({...current,playerName:output.review.playerName||current.playerName,level:output.review.level||current.level,trainingPointsTotal:output.review.points||current.trainingPointsTotal}));input.setPremiumReadings([]);input.setTotalReadingSession(null);input.setSinglePrintSession(null);input.setPreFinalConfirmation({playerName:output.review.playerName,level:output.review.level,points:output.review.points,preview:input.preview??null});input.setReaderProgress({percent:100,phase:'Leitura concluída',detail:'OCR encerrado. Confira nome, nível e pontos antes de gerar a ficha.',startedAt,completed:output.evidence.fields.length,total:output.evidence.fields.length,deadlineMs:120_000});input.setStatus('Reader V2 concluiu o OCR e encerrou o worker. Confira os dados antes de gerar a ficha.');
   orchestrator.close();readerV2OrchestratorR542=null;input.setLoading(false);input.setOcrCancelable(false);return output
  }catch(cause){await stopV2(true);input.setLoading(false);input.setOcrCancelable(false);input.setReaderProgress(null);input.setStatus(cause instanceof Error?`Reader V2: ${cause.message}`:'O Reader V2 não conseguiu concluir a leitura.');throw cause}
 }
 async function runAnalysis(confirmed=false){
  if(confirmed&&readerV2ClosedSnapshotR542&&readerV2ReviewDraftR542){const draft={...readerV2ReviewDraftR542,playerName:input.manualFields.playerName.trim()||readerV2ReviewDraftR542.playerName,level:input.manualFields.level.trim()||readerV2ReviewDraftR542.level,points:input.manualFields.trainingPointsTotal.trim()||readerV2ReviewDraftR542.points};readerV2ReviewDraftR542=draft;if(!readerV2BridgeR542){const {createReaderV2Bridge}=await import('./readerV2Bridge');readerV2BridgeR542=createReaderV2Bridge(async()=>{const legacy=await loadLegacyActions(input);return legacy.runAnalysis(true)})}return readerV2BridgeR542.forward(readerV2ClosedSnapshotR542,draft)}
  return (await loadLegacyActions(input)).runAnalysis(confirmed)
 }
 async function cancelCurrentOcr(){if(isV2()&&readerV2OrchestratorR542){await stopV2(true);input.setLoading(false);input.setOcrCancelable(false);input.setReaderProgress(null);input.setStatus('Leitura V2 cancelada. O print continua selecionado para uma nova tentativa.');return}return (await loadLegacyActions(input)).cancelCurrentOcr()}
 async function refreshOcrQueue(){if(isV2()){const q=await import('../card-reader/ocrQueue');input.setOcrQueue(await q.listOcrQueue());return}return (await loadLegacyActions(input)).refreshOcrQueue()}
 async function queueSelectedPrint(){if(isV2()){if(!input.selectedFile)return;const q=await import('../card-reader/ocrQueue');const {duplicate}=await q.enqueueOcrFile(input.selectedFile);input.setOcrQueue(await q.listOcrQueue());input.setStatus(duplicate?'Este print já estava na fila local.':'Print guardado na fila local.');return}return (await loadLegacyActions(input)).queueSelectedPrint()}
 async function openQueuedPrint(job:OcrQueueJob){if(isV2()){const q=await import('../card-reader/ocrQueue');await handleFile(q.queueJobAsFile(job));await q.removeOcrQueueJob(job.id);input.setOcrQueue(await q.listOcrQueue());return}return (await loadLegacyActions(input)).openQueuedPrint(job)}
 async function discardQueuedPrint(id:string){if(isV2()){const q=await import('../card-reader/ocrQueue');await q.removeOcrQueueJob(id);input.setOcrQueue(await q.listOcrQueue());return}return (await loadLegacyActions(input)).discardQueuedPrint(id)}
 async function changeEnhancementMode(mode:PremiumEnhancementMode){if(isV2()){input.setEnhancementMode(mode);input.readerImageMemory.releaseEnhanced();input.setEnhancedPreview(null);input.setStatus('Reader V2 mantém o print original sem enhancement global para reduzir memória.');return}return (await loadLegacyActions(input)).changeEnhancementMode(mode)}
 async function adjustDetectedCard(action:'left'|'right'|'up'|'down'|'zoom-in'|'zoom-out'){if(isV2()){input.setStatus('O Reader V2 usa o print original e não mantém recorte pesado durante a leitura.');return}return (await loadLegacyActions(input)).adjustDetectedCard(action)}
 async function redetectPlayerCard(){if(isV2()){input.setStatus('O Reader V2 lê as regiões diretamente do print sem pré-recorte da carta.');return}return (await loadLegacyActions(input)).redetectPlayerCard()}
 async function analyzeTotalCardCaptures(captures:TotalCardCaptureInput[]){return (await loadLegacyActions(input)).analyzeTotalCardCaptures(captures)}
 async function resumeInterruptedReading(){return (await loadLegacyActions(input)).resumeInterruptedReading()}
 async function discardInterruptedReading(){return (await loadLegacyActions(input)).discardInterruptedReading()}
 return {cancelCurrentOcr,resumeInterruptedReading,discardInterruptedReading,adjustDetectedCard,redetectPlayerCard,handleFile,refreshOcrQueue,queueSelectedPrint,openQueuedPrint,discardQueuedPrint,changeEnhancementMode,analyzeSelectedImage,analyzeTotalCardCaptures,runAnalysis}
}
