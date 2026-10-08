import * as assert from 'node:assert/strict';
import Module from 'node:module';
import { createCardVisionReaderActionsR187 } from '../src/modules/card-reader-v2/cardVisionReaderActionsR542';
import type { CardVisionReaderActionsInputR187 } from '../src/modules/card-reader-v2/cardVisionReaderActionsR542';
import type { ReaderV2ReviewDraft } from '../src/modules/card-reader-v2/readerV2Types';
import { captureReaderContextAuthorityR549 } from '../src/lib/readerContextAuthorityR549';

const values = [90,88,87,82,71,63,96,88,83,80,45,52,43,44,41,41,41,41,41,75,79,94,92,88,86,85];
const review: ReaderV2ReviewDraft = {
  playerName: 'D. Drogba', level: '32', points: '62', mainPosition: 'CF',
  rawText: 'D. Drogba\nHomem de área\n32\n62\n'+values.join(' '),
  fields: [{key:'playstyle',label:'Estilo',value:'Homem de área',confidence:94,source:'zones'}, {key:'skills',label:'Habilidades',value:'Cabeçada\nChute de primeira\nPasse de primeira',confidence:94,source:'zones'}, {key:'impeto',label:'Ímpeto',value:'Agilidade',confidence:94,source:'zones'}],
  attributeValues: values, uncertainKeys: [], preview: 'blob:worker-preview',
};
const closed = {stage:'ocrClosed' as const,mode:'zones' as const,workerReady:false,pendingRecognitions:0,cancelled:false,error:null};
let outputReview = review;
let pipelineInput: CardVisionReaderActionsInputR187 | undefined;
let legacyCalls = 0;
let rejectNext = false;
let startError: Error | null = null;
let pendingSelect: Promise<void> | null = null;
let selectEntered: (()=>void) | null = null;
let starts = 0;
let pendingCancel: Promise<void> | null = null;
let cancelEntered: (()=>void) | null = null;
const originalLoad = (Module as unknown as {_load:Function})._load;
(Module as unknown as {_load:Function})._load = function(request:string,...args:unknown[]) {
  if(request === './readerV2AppRuntime') return {createReaderV2AppOrchestrator:()=>({
    select:async()=>{selectEntered?.();await pendingSelect;},start:async()=>{starts++;if(startError)throw startError;return {review:outputReview,evidence:{fields:outputReview.fields},ocrSnapshot:closed};},
    cancel:async()=>{cancelEntered?.();await pendingCancel;},close:()=>{},
  })};
  if(request === '../card-reader/cardVisionReaderActionsLegacyR187') return {createCardVisionReaderActionsR187:(input:CardVisionReaderActionsInputR187)=>({
    runAnalysis:async(confirmed=false)=>{legacyCalls++;pipelineInput=input;if(!confirmed)return {status:'preview',persistenceStarted:false};if(rejectNext){rejectNext=false;return {status:'review',persistenceStarted:false};}return {status:'completed',persistenceStarted:true};},
  })};
  return originalLoad.call(this,request,...args);
};

function context() {
  const state:Record<string,any> = {
    mainSection:'leitor',selectedFile:null,rawText:'',preview:null,fileName:null,
    manualFields:{playerName:'Jogador anterior',level:'99',trainingPointsTotal:'196',attributes:{finishing:'55'},nativeSkills:['Cabeçada']},
    cardPositionOverride:'AUTO',playstyleOverride:'AUTO',defensivePlaystyleOverride:'AUTO',
  };
  const input:any = {
    objective:'COMPETITIVE',targetPosition:'CF',usageFunction:'AUTO',tacticalProfile:{formation:'AUTO',style:'POSSE_DE_BOLA'},
    readerImageMemory:{replacePreview:()=> 'blob:original-preview',releaseEnhanced:()=>{},releaseAll:()=>{}},
    efhubCalibrationActiveRef:{current:false},efhubCalibrationZonesRef:{current:[]},
  };
  const setters = ['Objective','OcrCancelable','Loading','ReaderProgress','PendingBackgroundCheckpoint','Status','PlayerCardImage','CardCropResult','FileName','SelectedFile','Preview','CardCropAdjustOpen','Result','DraftResult','ManualFields','ManualMode','RawText','OcrDone','PremiumReadings','TotalReadingSession','SinglePrintSession','EnhancedPreview','QualityReport','EnhancementMode','OcrQueue','OcrZones','PreFinalConfirmation','MainSection','CardPositionOverride','PlaystyleOverride','DefensivePlaystyleOverride'];
  for(const name of setters){const key=name[0].toLowerCase()+name.slice(1);input['set'+name]=(value:any)=>{state[key]=typeof value==='function'?value(state[key]):value;};}
  input.openMainSection=(section:string)=>{state.mainSection=section;};
  const ref={get current(){return {selectedFile:state.selectedFile,fileName:state.fileName};}};
  const actions=()=>createCardVisionReaderActionsR187({...input,...state,isAnalysisCurrent:captureReaderContextAuthorityR549(ref)} as CardVisionReaderActionsInputR187);
  return {state,actions};
}

async function main() {
  const c=context(); const file=new File(['print'],'carta.png',{type:'image/png'});
  await c.actions().handleFile(file); await c.actions().analyzeSelectedImage();
  assert.equal(c.state.mainSection,'resultado','OCR concluído deve abrir a tela onde a conferência é renderizada.');
  assert.equal(c.state.preFinalConfirmation.preview,'blob:original-preview');
  assert.equal(c.state.manualFields.attributes.finishing,'96','26 valores estruturados devem chegar aos campos do gerador.');
  assert.equal(c.state.manualFields.attributes.speed,'75');
  assert.equal(c.state.manualFields.attributes.goalkeeperReach,'41');
  assert.equal(c.state.manualFields.playerName,'D. Drogba');
  assert.deepEqual(c.state.manualFields.nativeSkills,['Cabeçada','Chute de primeira','Passe de primeira'],'Habilidades lidas da própria carta devem chegar ao gerador.');
  c.state.manualFields.playerName='Drogba conferido';
  c.state.manualFields.level='33'; c.state.manualFields.trainingPointsTotal='64';
  c.state.manualFields.attributes.finishing='';
  c.state.manualFields.attributes.speed='78';
  c.state.manualFields.nativeSkills=['Cabeçada'];
  const preview=await c.actions().runAnalysis(false);
  assert.deepEqual(preview,{status:'preview',persistenceStarted:false},'Prévia não pode iniciar persistência.');
  assert.doesNotMatch(pipelineInput?.rawText??'',/Finalização: 96/,'A prévia não pode recuperar um atributo apagado do OCR original.');
  assert.match(pipelineInput?.rawText??'',/Velocidade: 78/,'A prévia deve usar o atributo corrigido na conferência.');
  assert.doesNotMatch(pipelineInput?.rawText??'',/Passe de primeira/,'Habilidade removida não pode reaparecer na prévia.');
  assert.equal(pipelineInput?.manualFields.trainingPointsTotal,'64');
  await c.actions().runAnalysis(false);
  c.state.manualFields.attributes.finishing='96';
  await c.actions().runAnalysis(true);
  assert.equal(pipelineInput?.manualFields.playerName,'Drogba conferido');
  assert.match(pipelineInput?.rawText??'',/Finalização: 96/,'Bridge precisa entregar atributos com nomes, não números soltos.');
  assert.match(pipelineInput?.rawText??'',/ÍMPETO: Agilidade/,'O ímpeto confirmado deve manter uma etiqueta canônica.');

  const capturedActions=c.actions();
  const nextFile=new File(['next'],'proxima.png',{type:'image/png'});
  await c.actions().handleFile(nextFile);
  const callsBefore=legacyCalls,startsBefore=starts;
  const staleOutcome=await capturedActions.runAnalysis(true);
  assert.equal(staleOutcome?.status,'failed','Contexto capturado antes da troca de print não pode entrar no fallback legado.');
  assert.equal(legacyCalls,callsBefore);
  await capturedActions.analyzeSelectedImage();
  assert.equal(starts,startsBefore,'A ação capturada não pode iniciar OCR do print anterior depois da seleção nova.');
  assert.equal(c.state.selectedFile,nextFile);
  assert.equal(c.state.preFinalConfirmation,null);
  c.state.rawText='Dados conferidos do modo avançado';
  const advancedOutcome=await c.actions().runAnalysis(true);
  assert.equal(advancedOutcome?.status,'completed','A seleção atual pode usar revisão avançada sem snapshot V2.');
  assert.equal(pipelineInput?.selectedFile,nextFile);
  c.state.selectedFile=null;
  assert.equal((await c.actions().runAnalysis(true))?.status,'completed','Entrada manual sem arquivo precisa continuar disponível.');
  const capturedManual=c.actions(),beforeManual=legacyCalls;
  const imageAfterManual=new File(['after-manual'],'apos-manual.png',{type:'image/png'});
  await c.actions().handleFile(imageAfterManual);
  assert.equal((await capturedManual.runAnalysis(true))?.status,'failed','Contexto manual capturado antes da importação deve expirar ao selecionar um print.');
  assert.equal(legacyCalls,beforeManual);
  assert.equal(c.state.selectedFile,imageAfterManual);

  outputReview={...review,fields:[],playerName:'Outra carta',level:'',points:'',attributeValues:undefined,uncertainKeys:['attributes']};
  await c.actions().handleFile(new File(['next'],'outra.png',{type:'image/png'}));
  await c.actions().analyzeSelectedImage();
  assert.equal(c.state.manualFields.level,'','Novo print sem nível não pode herdar orçamento da carta anterior.');
  assert.equal(c.state.manualFields.trainingPointsTotal,'');
  assert.deepEqual(c.state.manualFields.attributes,{});
  assert.deepEqual(c.state.manualFields.nativeSkills,[]);
  rejectNext=true;
  await c.actions().runAnalysis(true);
  c.state.manualFields.playerName='Outra carta corrigida';
  await c.actions().runAnalysis(true);
  assert.equal(pipelineInput?.manualFields.playerName,'Outra carta corrigida','Falha de geração anterior à persistência deve permitir correção e nova tentativa com dados atuais.');
  startError=new Error('Não foi possível iniciar o OCR');
  await assert.doesNotReject(()=>c.actions().analyzeSelectedImage(),'Falha do worker deve virar feedback preservando print, sem unhandled rejection da ação UI.');
  assert.equal(c.state.loading,false);
  assert.match(c.state.status,/Não foi possível iniciar/);
  startError=null;
  let releaseSelect!:()=>void;
  pendingSelect=new Promise(resolve=>{releaseSelect=resolve;});
  const entered=new Promise<void>(resolve=>{selectEntered=resolve;});
  const before=starts;
  const pending=c.actions().analyzeSelectedImage();await entered;
  await c.actions().cancelCurrentOcr();releaseSelect();await pending;
  assert.equal(starts,before,'Cancelar durante select deve impedir uma leitura tardia de reabrir a conferência.');
  assert.equal(c.state.preFinalConfirmation,null);
  assert.match(c.state.status,/cancelada/);
  pendingSelect=new Promise(resolve=>{releaseSelect=resolve;});
  const oldSelectEntered=new Promise<void>(resolve=>{selectEntered=resolve;});
  const oldRead=c.actions().analyzeSelectedImage();await oldSelectEntered;
  const releaseOldSelect=releaseSelect;
  let releaseCancel!:()=>void;
  pendingCancel=new Promise(resolve=>{releaseCancel=resolve;});
  const cancelStarted=new Promise<void>(resolve=>{cancelEntered=resolve;});
  const oldCancel=c.actions().cancelCurrentOcr();await cancelStarted;
  pendingSelect=new Promise(resolve=>{releaseSelect=resolve;});
  const newSelectEntered=new Promise<void>(resolve=>{selectEntered=resolve;});
  const newRead=c.actions().analyzeSelectedImage();await newSelectEntered;
  releaseCancel();await oldCancel;
  assert.equal(c.state.loading,true,'Finalizar cancelamento antigo não pode apagar o progresso da nova leitura.');
  assert.equal(c.state.ocrCancelable,true);assert.ok(c.state.readerProgress);
  releaseOldSelect();await oldRead;releaseSelect();await newRead;
}
void main().then(()=>console.log('Reader V2: navegação, dados por carta e tentativa após falha aprovados.')).catch(cause=>{console.error(cause);process.exitCode=1;}).finally(()=>{(Module as unknown as {_load:Function})._load=originalLoad;});
