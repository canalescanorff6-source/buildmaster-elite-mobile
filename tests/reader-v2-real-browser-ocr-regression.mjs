import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const values=[90,88,87,82,71,63,96,88,83,80,45,52,43,44,41,41,41,41,41,75,79,94,92,88,86,85];
assert.ok(fs.existsSync('public/tesseract/lang/por.traineddata'),'Prepare os assets reais com npm run vendor:ocr.');
const bundle=await build({stdin:{contents:`
 import {createReaderV2AppOrchestrator} from './src/modules/card-reader-v2/readerV2AppRuntime';
 import {READER_V2_DEFAULT_ZONES} from './src/modules/card-reader-v2/readerV2ZoneProfile';
 import {readerV2ReviewAttributes,readerV2ReviewRawText} from './src/modules/card-reader-v2/readerV2Review';
 window.readCard=async(blob,mode='zones')=>{
  const events=[];const orchestrator=createReaderV2AppOrchestrator(p=>events.push(p));
  try{await orchestrator.select(blob);const output=await orchestrator.start(mode,mode==='zones'?READER_V2_DEFAULT_ZONES:undefined);
   return {...output,attributes:readerV2ReviewAttributes(output.review),raw:readerV2ReviewRawText(output.review),events};
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
 const output=await page.evaluate(async numbers=>{
  const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=1600;
  const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1400,1600);ctx.fillStyle='black';
  ctx.font='34px Arial';ctx.fillText('D. Drogba',15,42);ctx.fillText('Homem de área',15,89);
  ctx.font='28px Arial';ctx.fillText('Nível máximo: 32',365,160);ctx.fillText('Pontos totais: 62',365,215);ctx.fillText('Posição principal: CA',365,270);
  ctx.fillText('Agilidade',25,520);
  ctx.font='32px Arial';
  for(const [start,count,x] of [[0,10,390],[10,9,840],[19,7,1280]])for(let i=0;i<count;i++)ctx.fillText(String(numbers[start+i]),x,600+i*48);
  ctx.font='28px Arial';ctx.fillText('Cabeçada',30,1470);ctx.fillText('Chute de primeira',30,1515);ctx.fillText('Passe de primeira',30,1560);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  window.cardFile=new File([blob],'canonical-card.png',{type:'image/png'});
  return window.readCard(window.cardFile);
 },values);
 console.log(JSON.stringify({name:output.review.playerName,level:output.review.level,points:output.review.points,position:output.review.mainPosition,uncertain:output.review.uncertainKeys,fields:output.evidence.fields.map(f=>({key:f.key,text:f.value,confidence:f.confidence}))}));
 assert.equal(output.review.playerName,'D. Drogba','Zona Nome + estilo deve preservar o nome e separar as duas linhas.');
 assert.equal(output.review.level,'32');assert.equal(output.review.points,'62');assert.equal(output.review.mainPosition,'CF');
 assert.deepEqual(output.review.attributeValues,values,'As 26 leituras do WASM real devem preservar a ordem 10+9+7.');
 assert.equal(output.attributes.finishing,'96');assert.equal(output.attributes.speed,'75');
 assert.deepEqual(output.review.skillValues,['Cabeçada','Chute de primeira','Passe de primeira']);assert.equal(output.review.impetoName,'Agilidade');
 assert.equal(output.ocrSnapshot.stage,'ocrClosed');assert.equal(output.ocrSnapshot.workerReady,false);assert.equal(output.ocrSnapshot.pendingRecognitions,0);
 assert.deepEqual(external,[],'Leitura pessoal deve funcionar com assets locais, sem serviço de IA externo.');assert.deepEqual(errors,[]);
 const automatic=await page.evaluate(()=>window.readCard(window.cardFile,'automatic'));
 assert.equal(automatic.review.playerName,'D. Drogba');
 assert.equal(automatic.review.level,'32','O modo automático deve ler a bio do mesmo layout usado na calibração padrão.');
 assert.equal(automatic.review.points,'62');assert.equal(automatic.review.mainPosition,'CF');
 assert.deepEqual(automatic.review.attributeValues,values);
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 console.log('OCR browser/WASM real: imagem, nome/estilo, nível/PP, 26 atributos, habilidades, ímpeto e encerramento aprovados.');
}finally{
 await browser?.close();await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}
