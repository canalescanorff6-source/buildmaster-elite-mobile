import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {build} from 'esbuild';
import {chromium} from 'playwright';

// Real card pixels embedded in complete screenshots; no added player text.
const cards = [
  {file:'cristiano-efhub-from-review.png',name:'Cristiano Ronaldo',level:'32',points:'62',position:'CF',size:[921,2048],panel:[96,345,731,836],values:[97,84,84,82,71,63,96,88,83,87,43,43,42,44,41,41,41,41,41,92,93,96,92,88,86,87]},
  {file:'rivaldo-efhub-from-review.png',name:'Rivaldo',level:'31',points:'60',position:'AMF',size:[1080,2400],panel:[111,480,857,980],values:[91,99,92,94,82,83,91,66,93,94,49,52,51,55,41,41,41,41,41,81,78,96,68,78,81,84]},
  {file:'dani-olmo-efhub.jpg',name:'Dani Olmo',level:'32',points:'62',position:'AMF',size:[2000,1350],panel:[550,150,896,1024],values:[86,96,93,96,92,83,87,51,77,84,54,69,52,58,41,41,41,41,41,88,92,87,61,70,90,84]},
  {file:'petr-cech-efhub.jpg',name:'Petr Čech',level:'29',points:'56',position:'GK',size:[1100,2300],panel:[63,600,925,1024],values:[41,50,41,45,54,55,41,48,51,43,46,51,43,45,99,98,95,101,98,59,53,70,82,74,52,54]},
];
const bundle=await build({stdin:{contents:`
 import {createReaderV2AppOrchestrator} from './src/modules/card-reader-v2/readerV2AppRuntime';
 import {ATTRIBUTE_INPUTS} from './src/lib/analyzerDomain';
 import {readerV2ReviewAttributes} from './src/modules/card-reader-v2/readerV2Review';
 import {createPlayerCardPreviewR130} from './src/modules/card-reader/cardPreviewServiceR130';
 import {openReaderV2ImageSession} from './src/modules/card-reader-v2/readerV2ImageSession';
 import {createCardVisionReaderActionsR187} from './src/modules/card-reader-v2/cardVisionReaderActionsR542';
 import {READER_V2_DEFAULT_ZONES} from './src/modules/card-reader-v2/readerV2ZoneProfile';
 window.readFramed=async(encoded,card,mode)=>{
  const image=await createImageBitmap(new Blob([Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))]));
  const canvas=document.createElement('canvas');[canvas.width,canvas.height]=card.size;
  const context=canvas.getContext('2d');context.fillStyle='#101e30';context.fillRect(0,0,canvas.width,canvas.height);
  context.fillStyle='white';context.font='30px sans-serif';context.fillText('Confira antes de gerar a ficha',40,70);
  context.drawImage(image,...card.panel);image.close();
  const file=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));canvas.width=1;canvas.height=1;
  const session=await openReaderV2ImageSession(file);const frame=session.frame;session.close();
  const cover=await createPlayerCardPreviewR130(new File([file],'framed.png',{type:'image/png'}));
  if(mode==='saved-calibration'||mode==='photo-calibration'){
   const urls=[];const state={selectedFile:null,mainSection:'leitor',manualFields:{}};
   const calibration=READER_V2_DEFAULT_ZONES.map(zone=>({...zone,key:zone.key==='playerName'?'name':zone.key,...(card.validCalibration?{x:(card.panel[0]+zone.x*card.panel[2])/card.size[0],y:(card.panel[1]+zone.y*card.panel[3])/card.size[1],w:zone.w*card.panel[2]/card.size[0]*(zone.key==='cardType'?.8:1),h:zone.h*card.panel[3]/card.size[1]}:{})}));
   const input={efhubCalibrationActiveRef:{current:true},efhubCalibrationZonesRef:{current:calibration},readerImageMemory:{replacePreview:file=>{const url=URL.createObjectURL(file);urls.push(url);return url},releaseEnhanced:()=>{},releaseAll:()=>{}}};
   for(const name of ['Loading','OcrCancelable','ReaderProgress','Status','PreFinalConfirmation','PendingBackgroundCheckpoint','FileName','SelectedFile','Preview','PlayerCardImage','CardCropResult','CardCropAdjustOpen','Result','DraftResult','RawText','OcrDone','PremiumReadings','TotalReadingSession','SinglePrintSession','EnhancedPreview','QualityReport','EnhancementMode','ManualMode','ManualFields','CardPositionOverride','PlaystyleOverride','DefensivePlaystyleOverride','MainSection','Objective'])input['set'+name]=value=>{const key=name[0].toLowerCase()+name.slice(1);state[key]=typeof value==='function'?value(state[key]):value};
   input.openMainSection=value=>{state.mainSection=value};const actions=()=>createCardVisionReaderActionsR187({...input,...state});
   try{
    await actions().handleFile(new File([file],'framed.png',{type:'image/png'}));
    if(mode==='photo-calibration')return {frame,coverBox:state.cardCropResult?.box};
    const output=await actions().analyzeSelectedImage();
    if(!output)throw new Error(state.status);
    return {...output,frame,coverBox:state.cardCropResult?.box,keys:ATTRIBUTE_INPUTS.map(item=>item.key),attributes:state.manualFields.attributes,ui:{name:state.manualFields.playerName,level:state.manualFields.level,points:state.manualFields.trainingPointsTotal,section:state.mainSection,preview:state.preFinalConfirmation.preview}};
   }finally{urls.forEach(url=>URL.revokeObjectURL(url))}
  }
  const runtime=createReaderV2AppOrchestrator();
  try{await runtime.select(file);const output=await runtime.start('automatic');
   return {...output,frame,coverBox:cover?.box,keys:ATTRIBUTE_INPUTS.map(item=>item.key),attributes:readerV2ReviewAttributes(output.review)};
  }finally{runtime.close()}
 };
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
const root=path.resolve('public');
const server=http.createServer((request,response)=>{
 if(request.url==='/bundle.js'){response.setHeader('Content-Type','text/javascript');response.end(bundle.outputFiles[0].text);return}
 if(request.url==='/'){response.setHeader('Content-Type','text/html');response.end('<html><meta charset="utf-8"><script src="/bundle.js"></script></html>');return}
 const target=path.resolve(root,'.'+decodeURIComponent(request.url.split('?')[0]));
 if(!target.startsWith(root+path.sep)||!fs.existsSync(target)){response.writeHead(404);response.end();return}
 response.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':'application/octet-stream');fs.createReadStream(target).pipe(response);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
 const page=await browser.newPage();const external=[];const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*',route=>{const url=route.request().url();if(url.startsWith(origin)||url.startsWith('blob:')||url.startsWith('data:'))return route.continue();external.push(url);return route.abort()});
 await page.goto(origin);
 for(const validCalibration of [false,true]){
  const card={...cards[0],size:[1000,1500],panel:[20,60,950,1086],validCalibration};
  const output=await page.evaluate(({encoded,card})=>window.readFramed(encoded,card,'photo-calibration'),{encoded:fs.readFileSync('tests/fixtures/reader/'+card.file).toString('base64'),card});
  const expected={x:20+950*75/1400,y:60+1086*115/1600,w:950*260/1400*(validCalibration?.8:1),h:1086*355/1600};
  for(const key of ['x','y','w','h'])assert.ok(Math.abs(output.coverBox?.[key]*card.size[key==='x'||key==='w'?0:1]-expected[key])<3,'Foto deve resolver a geometria completa, mesmo quando a caixa antiga cabe no novo painel: '+key);
 }
 for(const mode of ['automatic','saved-calibration'])for(const card of mode==='saved-calibration'?[...cards,{...cards[0],size:[1400,1664],panel:[0,64,1400,1600],smallTopBar:true}]:cards){
  const output=await page.evaluate(({encoded,card,mode})=>window.readFramed(encoded,card,mode),{encoded:fs.readFileSync('tests/fixtures/reader/'+card.file).toString('base64'),card,mode});
  console.log(JSON.stringify({card:card.name,mode,frame:output.frame,name:output.review.playerName,attributes:output.attributes,level:output.review.level,points:output.review.points,uncertain:output.review.uncertainKeys}));
  const [px,py,pw,ph]=card.panel;const [width,height]=card.size;
  if(card.smallTopBar)for(const [key,value] of Object.entries({x:75,y:179,w:260,h:355}))assert.ok(Math.abs(output.coverBox?.[key]*card.size[key==='x'||key==='w'?0:1]-value)<5,'Foto deve seguir a carta mesmo com uma pequena barra superior: '+key);
  assert.ok(output.coverBox?.x*width>=px&&output.coverBox?.y*height>=py&&output.coverBox?.x*width<pw*.4+px&&output.coverBox?.y*height<ph*.3+py,'Foto deve ser recortada no painel da carta dentro da captura.');
  assert.equal(output.review.playerName.normalize('NFD').replace(/[\u0300-\u036f]/g,''),card.name.normalize('NFD').replace(/[\u0300-\u036f]/g,''),'Captura inteira deve ler o nome da carta, mesmo com cabeçalho do app.');
  assert.equal(Object.keys(output.attributes).length,26);
  for(const [index,key] of output.keys.entries())assert.equal(output.attributes[key],String(card.values[index]),key);
  assert.equal(output.review.level,card.level);assert.equal(output.review.points,card.points);assert.equal(output.review.mainPosition,card.position);
  assert.equal(output.review.pointsSource,'level');assert.equal(output.ocrSnapshot.workerReady,false);assert.equal(output.ocrSnapshot.pendingRecognitions,0);
  if(output.ui){assert.equal(output.ui.name,output.review.playerName);assert.equal(output.ui.level,card.level);assert.equal(output.ui.points,card.points);assert.equal(output.ui.section,'resultado');assert.match(output.ui.preview,/^blob:/)}
 }
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 console.log('Capturas completas: quatro cartas, automático e fluxo real com calibração salva, foto, nomes, 26 atributos, posições, níveis e pontos exatos.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
