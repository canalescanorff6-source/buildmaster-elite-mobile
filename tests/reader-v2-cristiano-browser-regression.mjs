import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

// Fixture: EFHub Cristiano print embedded in app review (03-1000716829.png).
// Lossless crop (96,345,827,1181), without resizing or invented text.

const cards=[{file:'cristiano-efhub-from-review.png',name:'Cristiano Ronaldo',level:'32',points:'62',position:'CF',values:[97,84,84,82,71,63,96,88,83,87,43,43,42,44,41,41,41,41,41,92,93,96,92,88,86,87]}];
assert.ok(fs.existsSync('public/tesseract/lang/por.traineddata'),'Prepare os assets reais com npm run vendor:ocr.');
const bundle=await build({stdin:{contents:`
 import {createPlayerCardPreviewR130} from './src/modules/card-reader/cardPreviewServiceR130';
 window.readCover=createPlayerCardPreviewR130;
 import {createReaderV2AppOrchestrator} from './src/modules/card-reader-v2/readerV2AppRuntime';
 import {READER_V2_DEFAULT_ZONES} from './src/modules/card-reader-v2/readerV2ZoneProfile';
 import {ATTRIBUTE_INPUTS} from './src/lib/analyzerDomain';
 import {readerV2ReviewAttributes,readerV2ReviewRawText} from './src/modules/card-reader-v2/readerV2Review';
 window.readCard=async(blob,mode='zones')=>{
  const events=[];const orchestrator=createReaderV2AppOrchestrator(p=>events.push(p));
  try{await orchestrator.select(blob);const output=await orchestrator.start(mode,mode==='zones'?READER_V2_DEFAULT_ZONES:undefined);
   return {...output,keys:ATTRIBUTE_INPUTS.map(item=>item.key),attributes:readerV2ReviewAttributes(output.review),raw:readerV2ReviewRawText(output.review),events};
  }finally{orchestrator.close()}
 };
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
const root=path.resolve('public');
const server=http.createServer((request,response)=>{
 if(request.url==='/bundle.js'){response.setHeader('Content-Type','text/javascript; charset=utf-8');response.end(bundle.outputFiles[0].text);return}
 if(request.url==='/'){response.setHeader('Content-Type','text/html; charset=utf-8');response.end('<html><head><meta charset="utf-8"></head><body><script src="/bundle.js"></script></body></html>');return}
 const target=path.resolve(root,'.'+decodeURIComponent(request.url.split('?')[0]));
 if(!target.startsWith(root+path.sep)||!fs.existsSync(target)){response.writeHead(404);response.end();return}
 response.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':'application/octet-stream');
 fs.createReadStream(target).pipe(response);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
 const page=await browser.newPage();
 const external=[];const errors=[];
 page.on('pageerror',error=>{errors.push(String(error));console.error('Browser:',String(error))});
 await page.route('**/*',route=>{
  const url=route.request().url();if(url.startsWith(origin)||url.startsWith('blob:')||url.startsWith('data:'))return route.continue();
  external.push(url);return route.abort();
 });
 await page.goto(origin);
 assert.deepEqual(errors,[],'O runtime OCR deve carregar antes de iniciar uma leitura.');
 const observations=[];
 for(const mode of ['automatic','zones'])for(const card of cards){
 const output=await page.evaluate(async ({encoded,mode})=>{
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  window.cardFile=new File([bytes],'card.png',{type:'image/png'});
  return window.readCard(window.cardFile,mode);
 },{encoded:fs.readFileSync('tests/fixtures/reader/'+card.file).toString('base64'),mode});
 console.log(JSON.stringify({card:card.name,mode,name:output.review.playerName,position:output.review.mainPosition,attributes:Object.keys(output.attributes).length}));
 assert.deepEqual(output.review.impetoNames,['Instinto artilheiro','Fisicalidade']);
 assert.ok(!output.review.uncertainKeys.includes('impeto'));
 assert.equal(output.review.skillValues.length,7);
 assert.deepEqual(output.review.specialSkillValues,['Finalização fenomenal','Cabeçada fulminante','Chute rasteiro fulminante']);
 assert.match(output.raw,/ÍMPETO: Instinto artilheiro \+4/);assert.match(output.raw,/ÍMPETO: Fisicalidade \+3/);
 assert.equal(output.review.playerName,card.name);


 assert.equal(Object.keys(output.attributes).length,26,'Todos os26 atributos legíveis devem ser preenchidos.');
 for(const [index,key] of output.keys.entries())assert.equal(output.attributes[key],String(card.values[index]),`Célula ${key} deve corresponder ao valor impresso.`);
 assert.equal(output.review.playerName.normalize('NFD').replace(/[\u0300-\u036f]/g,''),card.name.normalize('NFD').replace(/[\u0300-\u036f]/g,''));observations.push([output.review.level,card.level]);assert.equal(output.review.points,card.points);observations.push([output.review.mainPosition,card.position]);
 const cover=await page.evaluate(async()=>{
  const draw=CanvasRenderingContext2D.prototype.drawImage;const crops=[];
  CanvasRenderingContext2D.prototype.drawImage=function(...args){
   if(args.length===9&&this.canvas.height>this.canvas.width*1.25&&this.canvas.width>=240)crops.push(args.slice(1,5));
   return draw.apply(this,args);
  };
  try{return {...await window.readCover(window.cardFile),crops};}finally{CanvasRenderingContext2D.prototype.drawImage=draw;}
 });assert.match(cover?.preview??'',/^data:image\/jpeg/);
 assert.equal(output.ocrSnapshot.workerReady,false);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 }
 for(const [actual,expected] of observations)assert.equal(actual,expected);
 console.log('Cristiano: nome, posição,26 atributos, dois ímpetos, habilidades especiais e capa aprovados.');
}finally{
 await browser?.close();await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}
