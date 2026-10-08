import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const values=[83,79,85,83,85,84,72,76,65,76,79,78,80,82,41,41,41,41,41,102,96,93,77,78,82,100];
assert.ok(fs.existsSync('public/tesseract/lang/por.traineddata'),'Prepare os assets reais com npm run vendor:ocr.');
const bundle=await build({stdin:{contents:`
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
 const output=await page.evaluate(async encoded=>{
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  window.cardFile=new File([bytes],'cafu-efhub-video.png',{type:'image/png'});
  return window.readCard(window.cardFile,'automatic');
 },fs.readFileSync('tests/fixtures/reader/cafu-efhub-video.png').toString('base64'));
 // This652px source is a reduced video preview, not the original uploaded
 // screenshot. Validate every accepted value against hand-read annotations;
 // unresolved cells must stay empty, without shifting the following values.
 assert.ok(Object.keys(output.attributes).length>=22,'A falha de uma célula não pode devolver0/26 atributos.');
 for(const [index,key] of output.keys.entries()) if(output.attributes[key]!==undefined) {
  assert.equal(output.attributes[key],String(values[index]),'Um valor OCR aceito deve ser o valor da mesma célula do print.');
 }
 for(const index of [8,15,16,17]) assert.equal(output.attributes[output.keys[index]],undefined,'Não preencher glifos ilegíveis copiando valores vizinhos.');
 assert.ok(output.review.uncertainKeys.includes('attributes'));
 assert.equal(output.review.attributeValues,undefined);
 assert.equal(output.review.playerName,'Cafu');
 assert.equal(output.review.level,'37','O nível da carta deve vir da bio, sem confundir idade 31 ou nível do treino.');
 assert.equal(output.review.points,'72');
 assert.equal(output.review.mainPosition,'','Uma sigla ilegível não pode virar a posição de maior overall da grade.');
 assert.ok(output.review.uncertainKeys.includes('mainPosition'));
 assert.equal(output.review.pointsSource,'level');
 assert.equal(output.ocrSnapshot.workerReady,false);
 assert.equal(output.ocrSnapshot.pendingRecognitions,0);
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 console.log('Print eFHUB comprimido:22 atributos preservados, nível37/PP72 automáticos e dados ilegíveis sinalizados.');
}finally{
 await browser?.close();await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}
