import assert from 'node:assert/strict';
import Module from 'node:module';
let manualZone:any=null;
let account='first',entered!:()=>void,release!:()=>void,wait=false;
const review={playerName:'Old card',level:'32',points:'62',mainPosition:'CF',rawText:'Old print',fields:[],uncertainKeys:[],preview:'blob:old'};
const originalLoad=(Module as unknown as {_load:Function})._load;
(Module as unknown as {_load:Function})._load=function(request:string,...args:unknown[]){
 if(request==='../../lib/accountStorage')return {activeAccountNamespace:()=>account};
 if(request==='./readerV2AppRuntime')return {createReaderV2AppOrchestrator:()=>({select:async()=>{},start:async()=>({review:{...review},evidence:{fields:[]},ocrSnapshot:{stage:'ocrClosed',workerReady:false,pendingRecognitions:0}}),cancel:async()=>{},close:()=>{}})};
 if(request==='../card-reader/cardPreviewServiceR130')return {createPlayerCardPreviewR130:async(_file:any,zones:any[])=>{const zone=zones?.find(zone=>zone.key==='cardType');if(zone){manualZone=zone;return {preview:'blob:calibrated-cover',box:zone}}return {preview:'blob:cover',box:{x:0,y:0,w:1,h:1}}}};
 if(request==='../card-reader/cardArtCrop')return {createManualEfhubCardPreview:async(_file:any,zone:any)=>{manualZone=zone;return {preview:'blob:calibrated-cover',box:zone}},adjustCardCropBox:(box:any)=>({...box,x:.1}),renderCardCropPreview:async()=> 'blob:adjusted',renderPlayerPortraitPreview:async()=>({preview:'blob:portrait-adjusted',box:{x:.1,y:0,w:.8,h:1}})};
 if(request==='../card-catalog/readerCardEdition')return {identifyReadCardEdition:async()=>{if(wait){entered();await new Promise<void>(done=>release=done)}return null}};
 return originalLoad.call(this,request,...args);
};
async function scenario(duringRecognition:boolean,calibrated=false){
 account='first';wait=duringRecognition;const ready=new Promise<void>(done=>entered=done);
 const state:Record<string,any>={selectedFile:null,preview:null,manualFields:{playerName:'',level:'',trainingPointsTotal:'',attributes:{},nativeSkills:[]},objective:'COMPETITIVE',targetPosition:'CF',singlePrintSession:null};
 const input:any={readerImageMemory:{replacePreview:(file:File)=>'blob:'+file.name,releaseEnhanced:()=>{},releaseAll:()=>{}},efhubCalibrationActiveRef:{current:calibrated},efhubCalibrationZonesRef:{current:calibrated?[{key:'cardType',x:.1,y:.2,w:.3,h:.4,enabled:true}]:[]}};
 for(const name of ['Loading','OcrCancelable','ReaderProgress','Status','PreFinalConfirmation','PendingBackgroundCheckpoint','FileName','SelectedFile','Preview','PlayerCardImage','CardCropResult','CardCropAdjustOpen','Result','DraftResult','RawText','OcrDone','PremiumReadings','TotalReadingSession','SinglePrintSession','EnhancedPreview','QualityReport','EnhancementMode','ManualMode','ManualFields','CardPositionOverride','PlaystyleOverride','DefensivePlaystyleOverride','MainSection','Objective'])input['set'+name]=(value:any)=>{const key=name[0].toLowerCase()+name.slice(1);state[key]=typeof value==='function'?value(state[key]):value;};
 input.openMainSection=(value:string)=>{state.mainSection=value;};
 const {createCardVisionReaderActionsR187}=await import('../src/modules/card-reader-v2/cardVisionReaderActionsR542');
 const actions=()=>createCardVisionReaderActionsR187({...input,...state});
 await actions().handleFile(new File(['old'],'old.png',{type:'image/png'}));
 assert.equal(state.playerCardImage,calibrated?'blob:calibrated-cover':'blob:cover','Selecionar o print deve preparar a foto antes de iniciar OCR.');
 if(calibrated)assert.deepEqual(manualZone,{key:'cardType',label:'Zona 1',x:.1,y:.2,w:.3,h:.4,enabled:true});
 await actions().adjustDetectedCard('right');
 assert.equal(state.playerCardImage,'blob:portrait-adjusted');
 const reading=actions().analyzeSelectedImage();
 if(duringRecognition){await ready;account='second';release();}else{await reading;account='second';}
 await reading;
 assert.equal(state.playerCardImage,'blob:portrait-adjusted','A conclusão do OCR deve preservar o enquadramento ajustado.');
 if(duringRecognition){assert.equal(state.loading,false);assert.equal(state.ocrCancelable,false);}
 assert.deepEqual(await actions().runAnalysis(true),{status:'failed',persistenceStarted:false},'A revisão da conta anterior não pode iniciar análise ou gravação na conta nova.');
}
void(async()=>{await scenario(true);await scenario(false);await scenario(false,true);console.log('Reader account origin: switch during/after edition lookup cannot persist old review PASS');})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{(Module as unknown as {_load:Function})._load=originalLoad;});
