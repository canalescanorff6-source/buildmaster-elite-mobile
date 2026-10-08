import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const cards=[{file:'dani-olmo-efhub.jpg',name:'Dani Olmo',level:'32',points:'62',position:'AMF',values:[86,96,93,96,92,83,87,51,77,84,54,69,52,58,41,41,41,41,41,88,92,87,61,70,90,84]},{file:'petr-cech-efhub.jpg',name:'Petr Čech',level:'29',points:'56',position:'GK',values:[41,50,41,45,54,55,41,48,51,43,46,51,43,45,99,98,95,101,98,59,53,70,82,74,52,54]}];
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
 for(const card of cards){
 const output=await page.evaluate(async encoded=>{
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  window.cardFile=new File([bytes],'card.jpg',{type:'image/jpeg'});
  return window.readCard(window.cardFile,'automatic');
 },fs.readFileSync('tests/fixtures/reader/'+card.file).toString('base64'));
 console.log(JSON.stringify({card:card.name,name:output.review.playerName,level:output.review.level,position:output.review.mainPosition,attrs:output.attributes,fields:output.evidence.fields.filter(f=>['mainPosition','level'].includes(f.key))}));
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
 const frame=card.file.startsWith('dani')?[117,156,408,571]:[122,164,420,590];
 assert.ok(cover.crops.some(([x,y,w,h])=>x<=frame[0]&&y<=frame[1]&&x+w>=frame[2]&&y+h>=frame[3]),'O recorte deve preservar as quatro bordas da carta original: '+JSON.stringify(cover.crops));
 assert.equal(output.ocrSnapshot.workerReady,false);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 }
 for(const [actual,expected] of observations)assert.equal(actual,expected);
 console.log('Prints originais: Olmo e Čech,26 atributos exatos e capa aprovados.');
}finally{
 await browser?.close();await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}
