/** R542 — boundary leve: V2 primeiro; clássico só após fallback/confirmação. */
import type { CardVisionReaderActionsInputR187,CardVisionReadingModeR187,CardVisionAnalysisOutcomeR187 } from '../card-reader/cardVisionReaderActionsLegacyR187';
import type { OcrQueueJob } from '../card-reader/ocrQueue';
import type { TotalCardCaptureInput } from '../../lib/totalCardReader';
import type { PremiumEnhancementMode } from '../../lib/premiumReading';
import type { CardCropResult } from '../card-reader/cardArtCrop';
import type { ReaderV2Bridge } from './readerV2Bridge';
import type { ReaderV2Orchestrator } from './readerV2Orchestrator';
import type { ReaderV2ReviewDraft,ReaderV2SessionSnapshot } from './readerV2Types';
import { readReaderV2Backend } from './readerV2FeatureGate';
import { activeAccountNamespace } from '../../lib/accountStorage';
import { mapLegacyCalibrationToReaderV2 } from './readerV2ZoneProfile';
import { normalizeReaderV2Position, readerV2ReviewAttributes, readerV2ReviewRawText } from './readerV2Review';
import { deriveReaderCanonicalEvidenceR549 } from '../../lib/readerCanonicalEvidenceR549';
export type { CardVisionReaderActionsInputR187,CardVisionReadingModeR187 };

let readerV2OrchestratorR542:ReaderV2Orchestrator|null=null;
let readerV2ClosedSnapshotR542:ReaderV2SessionSnapshot|null=null;
let readerV2ReviewDraftR542:ReaderV2ReviewDraft|null=null;
let readerV2BridgeR542:ReaderV2Bridge<CardVisionAnalysisOutcomeR187>|null=null;
let readerV2SourceFileR542:File|null=null;
let readerV2ReviewAccountR551:string|null=null;
let readerV2SelectedFileR542:File|null|undefined;
let readerV2GenerationR542=0;
let coverCalibration='',coverRevision=0,coverFile:File|null=null,selectedCover:CardCropResult|null=null;
let coverManuallyAdjusted=false;
const isV2=()=>readReaderV2Backend()==='v2';
async function loadLegacyActions(input:CardVisionReaderActionsInputR187){const legacy=await import('../card-reader/cardVisionReaderActionsLegacyR187');return legacy.createCardVisionReaderActionsR187(input)}
function clearFinal(){readerV2ClosedSnapshotR542=null;readerV2ReviewDraftR542=null;readerV2BridgeR542=null;readerV2SourceFileR542=null;readerV2ReviewAccountR551=null}
function raw(review:ReaderV2ReviewDraft){return readerV2ReviewRawText(review)}

export function createCardVisionReaderActionsR187(input:CardVisionReaderActionsInputR187){
 async function stopV2(cancel=false){const active=readerV2OrchestratorR542;if(!active)return;readerV2OrchestratorR542=null;if(cancel)await active.cancel().catch(()=>undefined);active.close()}
 function calibratedZones(){return input.efhubCalibrationActiveRef.current?mapLegacyCalibrationToReaderV2(input.efhubCalibrationZonesRef.current):undefined}
 async function prepareCover(file:File){
  const generation=readerV2GenerationR542,account=activeAccountNamespace(),revision=++coverRevision;
  const zones=calibratedZones(),calibration=JSON.stringify(zones??null);
  const cover=await import('../card-reader/cardPreviewServiceR130').then(module=>module.createPlayerCardPreviewR130(file,zones)).catch(()=>null);
  if(generation!==readerV2GenerationR542||account!==activeAccountNamespace()||revision!==coverRevision)return;
  if(cover){coverCalibration=calibration;coverFile=file;selectedCover=cover;coverManuallyAdjusted=false;input.setPlayerCardImage(cover.portraitPreview??cover.preview);input.setCardCropResult(cover)}
  else input.setStatus('Não foi possível detectar a foto. O print original foi preservado; tente redetectar.');
 }
 async function handleFile(file:File){
  if(isV2()){
   if(!file.type?.toLowerCase().startsWith('image/')){input.setStatus('Selecione uma imagem válida da carta.');return}
   const generation=++readerV2GenerationR542;readerV2SelectedFileR542=file;coverRevision++;coverFile=null;selectedCover=null;coverCalibration='';coverManuallyAdjusted=false;await stopV2(true);if(generation!==readerV2GenerationR542)return;clearFinal();input.setPendingBackgroundCheckpoint(null);input.setFileName(file.name||`reader-v2-${Date.now()}.png`);input.setSelectedFile(file);input.setPreview(input.readerImageMemory.replacePreview(file));
   input.setPlayerCardImage(null);input.setCardCropResult(null);input.setCardCropAdjustOpen(false);input.setResult(null);input.setDraftResult(null);input.setRawText('');input.setOcrDone(false);input.setLoading(false);input.setOcrCancelable(false);input.setReaderProgress(null);input.setPremiumReadings([]);input.setTotalReadingSession(null);input.setSinglePrintSession(null);input.readerImageMemory.releaseEnhanced();input.setEnhancedPreview(null);input.setQualityReport(null);input.setEnhancementMode('original');input.setManualMode(false);input.setPreFinalConfirmation(null);input.setStatus('Imagem selecionada no Reader V2. O OCR só será carregado quando você iniciar a leitura.');await prepareCover(file);return
  }
  return (await loadLegacyActions(input)).handleFile(file)
 }
 async function analyzeSelectedImage(fileOverride?:File,resumed=false){
  if(!isV2())return (await loadLegacyActions(input)).analyzeSelectedImage(fileOverride,resumed);
  const file=fileOverride??input.selectedFile;if(!file){input.setLoading(false);input.setOcrCancelable(false);input.setStatus('Selecione novamente a imagem da carta para iniciar o Reader V2.');return}
  if(!fileOverride&&readerV2SelectedFileR542!==undefined&&file!==readerV2SelectedFileR542)return;
  readerV2SelectedFileR542=file;
  const generation=++readerV2GenerationR542;await stopV2(true);if(generation!==readerV2GenerationR542)return;clearFinal();readerV2SourceFileR542=file;input.setPreFinalConfirmation(null);
  const account=activeAccountNamespace();readerV2ReviewAccountR551=account;
  const startedAt=Date.now();input.setLoading(true);input.setOcrCancelable(true);input.setReaderProgress({percent:1,phase:'Iniciando Reader V2',detail:'Preparando a leitura leve antes de iniciar o worker OCR.',startedAt,completed:0,total:0,deadlineMs:120_000});input.setStatus('Iniciando Reader V2 em memória isolada...');
  try{
   const runtime=await import('./readerV2AppRuntime');if(generation!==readerV2GenerationR542)return;
   const orchestrator=runtime.createReaderV2AppOrchestrator(p=>{if(generation===readerV2GenerationR542)input.setReaderProgress({percent:p.percent,phase:p.label,detail:p.detail??'Lendo um campo por vez e liberando cada recorte.',startedAt,completed:p.current,total:p.total,deadlineMs:120_000})});readerV2OrchestratorR542=orchestrator;await orchestrator.select(file);if(generation!==readerV2GenerationR542)return;
   const zones=input.efhubCalibrationActiveRef.current?mapLegacyCalibrationToReaderV2(input.efhubCalibrationZonesRef.current):undefined;
   const output=await orchestrator.start(zones?'zones':'automatic',zones);if(generation!==readerV2GenerationR542)return;readerV2ClosedSnapshotR542=output.ocrSnapshot;readerV2ReviewDraftR542=output.review;readerV2BridgeR542=null;
   orchestrator.close();readerV2OrchestratorR542=null;
   try{if(coverFile!==file||!selectedCover||(!coverManuallyAdjusted&&coverCalibration!==JSON.stringify(calibratedZones()??null)))await prepareCover(file);const cover=coverFile===file?selectedCover:null;if(generation!==readerV2GenerationR542)return;if(account!==activeAccountNamespace()){clearFinal();readerV2ReviewAccountR551=account;input.setLoading(false);input.setOcrCancelable(false);return}if(cover){const {identifyReadCardEdition}=await import('../card-catalog/readerCardEdition');const edition=await identifyReadCardEdition(file,cover.box,output.review);if(generation!==readerV2GenerationR542)return;if(account!==activeAccountNamespace()){clearFinal();readerV2ReviewAccountR551=account;input.setLoading(false);input.setOcrCancelable(false);return}if(edition){output.review.editionIdentity=edition.identity;output.review.trainingBase=edition.trainingBase}}}catch{/* OCR remains usable when cover extraction fails. */}
   if(generation!==readerV2GenerationR542)return;if(account!==activeAccountNamespace()){clearFinal();readerV2ReviewAccountR551=account;input.setLoading(false);input.setOcrCancelable(false);return}
   input.setRawText(raw(output.review));input.setOcrDone(true);input.setManualMode(true);input.setManualFields({playerName:output.review.playerName,level:output.review.level,trainingPointsTotal:output.review.points,attributes:readerV2ReviewAttributes(output.review),nativeSkills:deriveReaderCanonicalEvidenceR549(output.review.fields).skillValues??[]});input.setCardPositionOverride(normalizeReaderV2Position(output.review.mainPosition)??'AUTO');input.setPlaystyleOverride(output.review.fields.find(field=>field.key==='playstyle')?.value||'AUTO');input.setDefensivePlaystyleOverride('AUTO');input.setPremiumReadings([]);input.setTotalReadingSession(null);input.setSinglePrintSession(null);input.setPreFinalConfirmation({playerName:output.review.playerName,level:output.review.level,points:output.review.points,pointsSource:output.review.pointsSource,preview:input.preview??null,mainPosition:output.review.mainPosition,uncertainKeys:[...output.review.uncertainKeys]});input.setReaderProgress({percent:100,phase:'Leitura concluída',detail:'OCR encerrado. Confira nome, nível e pontos antes de gerar a ficha.',startedAt,completed:output.evidence.fields.length,total:output.evidence.fields.length,deadlineMs:120_000});input.setStatus('Leitura concluída. Confira os dados antes de gerar a ficha.');input.openMainSection('resultado');
   input.setLoading(false);input.setOcrCancelable(false);return output
  }catch(cause){if(generation!==readerV2GenerationR542)return;await stopV2(true);if(generation!==readerV2GenerationR542)return;input.setLoading(false);input.setOcrCancelable(false);input.setReaderProgress(null);input.setStatus(cause instanceof Error?`Reader V2: ${cause.message}`:'O Reader V2 não conseguiu concluir a leitura.');return}
 }
 async function runAnalysis(confirmed=false){
  const generation=readerV2GenerationR542,namespace=activeAccountNamespace();
  const isAnalysisCurrent=()=>generation===readerV2GenerationR542&&namespace===activeAccountNamespace()&&(!readerV2ReviewAccountR551||readerV2ReviewAccountR551===namespace)&&(!isV2()||!input.selectedFile||readerV2SelectedFileR542===undefined||input.selectedFile===readerV2SelectedFileR542)&&input.isAnalysisCurrent?.()!==false;
  if(!isAnalysisCurrent())return {status:'failed' as const,persistenceStarted:false};
  if(isV2()&&input.selectedFile===readerV2SourceFileR542&&readerV2ClosedSnapshotR542&&readerV2ReviewDraftR542){
   const draft={...readerV2ReviewDraftR542,playerName:input.manualFields.playerName.trim(),level:input.manualFields.level.trim(),points:input.manualFields.trainingPointsTotal.trim()};if(draft.playerName!==readerV2ReviewDraftR542.playerName){draft.editionIdentity=null;draft.trainingBase=null}else if(draft.level!==readerV2ReviewDraftR542.level||draft.points!==readerV2ReviewDraftR542.points){draft.trainingBase=null;if(draft.editionIdentity)draft.editionIdentity={...draft.editionIdentity,officialCardIdVerified:false}}if(draft.trainingBase){const {referenceBaseAgreesWithPrint}=await import('../card-catalog/readerCardEdition');if(!referenceBaseAgreesWithPrint(draft.trainingBase,input.manualFields.attributes)){draft.trainingBase=null;if(draft.editionIdentity)draft.editionIdentity={...draft.editionIdentity,officialCardIdVerified:false}}}if(!isAnalysisCurrent())return {status:'failed' as const,persistenceStarted:false};readerV2ReviewDraftR542=draft;
   const pipeline=async(review:ReaderV2ReviewDraft)=>{const legacy=await loadLegacyActions({...input,rawText:readerV2ReviewRawText(review,input.manualFields),editionIdentity:review.editionIdentity,trainingBase:review.trainingBase,isAnalysisCurrent});return confirmed?legacy.runAnalysis(true):legacy.runAnalysis(false)};
   if(!readerV2BridgeR542){const {createReaderV2Bridge}=await import('./readerV2Bridge');readerV2BridgeR542=createReaderV2Bridge(pipeline,outcome=>!outcome.persistenceStarted&&(outcome.status==='preview'||outcome.status==='review'||outcome.status==='failed'))}
   return readerV2BridgeR542.forward(readerV2ClosedSnapshotR542,draft,pipeline)
  }
  return (await loadLegacyActions({...input,isAnalysisCurrent})).runAnalysis(confirmed)
 }
 async function cancelCurrentOcr(){if(isV2()){const generation=++readerV2GenerationR542;clearFinal();await stopV2(true);if(generation!==readerV2GenerationR542)return;input.setLoading(false);input.setOcrCancelable(false);input.setReaderProgress(null);input.setStatus('Leitura V2 cancelada. O print continua selecionado para uma nova tentativa.');return}return (await loadLegacyActions(input)).cancelCurrentOcr()}
 async function refreshOcrQueue(){if(isV2()){const q=await import('../card-reader/ocrQueue');input.setOcrQueue(await q.listOcrQueue());return}return (await loadLegacyActions(input)).refreshOcrQueue()}
 async function queueSelectedPrint(){if(isV2()){if(!input.selectedFile)return;const q=await import('../card-reader/ocrQueue');const {duplicate}=await q.enqueueOcrFile(input.selectedFile);input.setOcrQueue(await q.listOcrQueue());input.setStatus(duplicate?'Este print já estava na fila local.':'Print guardado na fila local.');return}return (await loadLegacyActions(input)).queueSelectedPrint()}
 async function openQueuedPrint(job:OcrQueueJob){if(isV2()){const q=await import('../card-reader/ocrQueue');await handleFile(q.queueJobAsFile(job));await q.removeOcrQueueJob(job.id);input.setOcrQueue(await q.listOcrQueue());return}return (await loadLegacyActions(input)).openQueuedPrint(job)}
 async function discardQueuedPrint(id:string){if(isV2()){const q=await import('../card-reader/ocrQueue');await q.removeOcrQueueJob(id);input.setOcrQueue(await q.listOcrQueue());return}return (await loadLegacyActions(input)).discardQueuedPrint(id)}
 async function changeEnhancementMode(mode:PremiumEnhancementMode){if(isV2()){input.setEnhancementMode(mode);input.readerImageMemory.releaseEnhanced();input.setEnhancedPreview(null);input.setStatus('Reader V2 mantém o print original sem enhancement global para reduzir memória.');return}return (await loadLegacyActions(input)).changeEnhancementMode(mode)}
 async function adjustDetectedCard(action:'left'|'right'|'up'|'down'|'zoom-in'|'zoom-out'){
  if(!isV2())return (await loadLegacyActions(input)).adjustDetectedCard(action);
  const file=input.selectedFile,crop=input.cardCropResult;if(!file||!crop)return;
  const generation=readerV2GenerationR542,account=activeAccountNamespace(),revision=++coverRevision;
  const art=await import('../card-reader/cardArtCrop').catch(()=>null);if(!art)return;const box=art.adjustCardCropBox(crop.box,action);
  const preview=await art.renderCardCropPreview(file,box).catch(()=>null);if(!preview)return;
  const portrait=await art.renderPlayerPortraitPreview(file,box).catch(()=>null);
  if(generation!==readerV2GenerationR542||account!==activeAccountNamespace()||revision!==coverRevision)return;
  input.setPlayerCardImage(portrait?.preview??preview);selectedCover={...crop,preview,portraitPreview:portrait?.preview??null,portraitBox:portrait?.box,box,method:'manual-adjustment'};coverFile=file;coverManuallyAdjusted=true;input.setCardCropResult(selectedCover);
 }

 async function redetectPlayerCard(){if(isV2()){if(input.selectedFile)await prepareCover(input.selectedFile);return}return (await loadLegacyActions(input)).redetectPlayerCard()}
 async function analyzeTotalCardCaptures(captures:TotalCardCaptureInput[]){return (await loadLegacyActions(input)).analyzeTotalCardCaptures(captures)}
 async function resumeInterruptedReading(){return (await loadLegacyActions(input)).resumeInterruptedReading()}
 async function discardInterruptedReading(){return (await loadLegacyActions(input)).discardInterruptedReading()}
 return {cancelCurrentOcr,resumeInterruptedReading,discardInterruptedReading,adjustDetectedCard,redetectPlayerCard,handleFile,refreshOcrQueue,queueSelectedPrint,openQueuedPrint,discardQueuedPrint,changeEnhancementMode,analyzeSelectedImage,analyzeTotalCardCaptures,runAnalysis}
}
