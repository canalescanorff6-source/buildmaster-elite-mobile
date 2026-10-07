import * as assert from 'node:assert/strict';
import Module from 'node:module';
function deferred(){let resolve!:()=>void;const promise=new Promise<void>(done=>{resolve=done;});return {resolve,promise};}
let phase:'locks'|'persist'='locks';
let entered=deferred(),gate=deferred(),persists=0,releases=0;
let persistedGuard:(()=>boolean)|undefined;
const review={playerName:'Old card',level:'32',points:'62',mainPosition:'CF',rawText:'Old print',fields:[],uncertainKeys:[],preview:'blob:old'};
const result={parsed:{playerName:'Old card',mainPosition:'CF',playstyle:'Homem de área'},trainingPointsTotal:62,note:'Old result',cleanSlate2027R119:{cardTruthCertificationR501:{state:'FINAL_CERTIFIED',canFinalize:true}}};
const originalLoad=(Module as unknown as {_load:Function})._load;
(Module as unknown as {_load:Function})._load=function(request:string,...args:unknown[]){
 if(request==='./readerV2AppRuntime')return {createReaderV2AppOrchestrator:()=>({select:async()=>{},start:async()=>({review,evidence:{fields:[]},ocrSnapshot:{stage:'ocrClosed',workerReady:false,pendingRecognitions:0}}),cancel:async()=>{},close:()=>{}})};
 if(request==='@/modules/analysis')return {createProductionAnalysisR138:()=>result,POSITION_LABELS:[]};
 if(request==='@/modules/vault/cardHistoryStore')return {findLearnedCard:()=>null,isRenderableAnalysisResult:()=>true,saveLearnedCard:()=>{}};
 if(request==='@/lib/localDatabase')return {};
 if(request==='@/lib/safeDiagnostics')return {recordSafeRuntimeError:async()=>{}};
 if(request==='@/modules/card-reader/readerEvidenceRuntimeR161')return {loadReaderEvidenceRuntimeR161:async()=>({reviewWorkflow:{buildManualReviewTextR131:async()=>{if(phase==='locks'){entered.resolve();await gate.promise;}return 'Confirmed old print';}},physicalEvidence:{}})};
 if(request==='@/lib/intelligentLearningR470')return {markActiveReadingSessionR470:async()=>{},persistConfirmedAnalysisR470:async(_result:unknown,payload:{isAnalysisCurrent?:()=>boolean})=>{persists++;persistedGuard=payload.isAnalysisCurrent;if(phase==='persist'){entered.resolve();await gate.promise;}}};
 return originalLoad.call(this,request,...args);
};
async function scenario(stage:'locks'|'persist'){
 phase=stage;entered=deferred();gate=deferred();persists=0;releases=0;persistedGuard=undefined;
 const state:Record<string,any>={selectedFile:null,preview:null,manualFields:{playerName:'',level:'',trainingPointsTotal:'',attributes:{},nativeSkills:[]},objective:'COMPETITIVE',targetPosition:'CF',singlePrintSession:null};
 const input:any={readerImageMemory:{replacePreview:(file:File)=>'blob:'+file.name,releaseEnhanced:()=>{},releaseAll:()=>{releases++;}},efhubCalibrationActiveRef:{current:false},efhubCalibrationZonesRef:{current:[]}};
 for(const name of ['Loading','OcrCancelable','ReaderProgress','Status','PreFinalConfirmation','PendingBackgroundCheckpoint','FileName','SelectedFile','Preview','PlayerCardImage','CardCropResult','CardCropAdjustOpen','Result','DraftResult','RawText','OcrDone','PremiumReadings','TotalReadingSession','SinglePrintSession','EnhancedPreview','QualityReport','EnhancementMode','ManualMode','ManualFields','CardPositionOverride','PlaystyleOverride','DefensivePlaystyleOverride','MainSection','Objective'])input['set'+name]=(value:any)=>{const key=name[0].toLowerCase()+name.slice(1);state[key]=typeof value==='function'?value(state[key]):value;};
 input.openMainSection=(value:string)=>{state.mainSection=value;};
 const {createCardVisionReaderActionsR187}=await import('../src/modules/card-reader-v2/cardVisionReaderActionsR542');
 const actions=()=>createCardVisionReaderActionsR187({...input,...state});
 await actions().handleFile(new File(['old'],'old.png',{type:'image/png'}));await actions().analyzeSelectedImage();
 const pending=actions().runAnalysis(true);await entered.promise;
 const nextFile=new File(['next'],'next.png',{type:'image/png'});await actions().handleFile(nextFile);
 if(stage==='persist'){assert.equal(typeof persistedGuard,'function');assert.equal(persistedGuard?.(),false,'O gravador real precisa receber a invalidação da carta em andamento.');}
 gate.resolve();const outcome=await pending;
 assert.equal(outcome?.status,'failed','Uma geração antiga deve encerrar sem adotar o resultado depois da troca de print.');
 assert.equal(outcome?.persistenceStarted,stage==='persist');
 assert.equal(state.selectedFile,nextFile);assert.equal(state.preview,'blob:next.png');assert.equal(state.result,null);
 assert.equal(releases,0,'A geração antiga não pode revogar a imagem selecionada depois.');
 assert.equal(persists,stage==='persist'?1:0,'Cancelamento anterior à persistência não pode iniciar gravação.');
}
void (async()=>{await scenario('locks');await scenario('persist');console.log('Reader: geração atrasada não grava antes da invalidação nem descarta/adota dados da próxima carta.');})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{(Module as unknown as {_load:Function})._load=originalLoad;});
