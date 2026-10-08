import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import {buildReaderReviewHarness} from './helpers/reader-prefinal-react-harness.mjs';

const values=[90,88,87,82,71,63,96,88,83,80,45,52,43,44,41,41,41,41,41,75,79,94,92,88,86,85];
assert.ok(fs.existsSync('public/tesseract/lang/por.traineddata'),'Prepare os assets reais com npm run vendor:ocr.');
const bundle=await build({stdin:{contents:`
 import {openReaderV2ImageSession} from './src/modules/card-reader-v2/readerV2ImageSession';
 import {createPlayerCardPreviewR130} from './src/modules/card-reader/cardPreviewServiceR130';
 window.testImageFallback=async()=>{const native=window.createImageBitmap;try{window.createImageBitmap=async()=>{throw new Error('decoder unavailable')};const session=await openReaderV2ImageSession(window.cardFile,{maxSourceDimension:320});const size=session.snapshot();session.close();const cover=await createPlayerCardPreviewR130(window.cardFile);return {size,closed:session.snapshot().closed,cover:cover?.preview};}finally{window.createImageBitmap=native;}};
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
const reviewBundle=await buildReaderReviewHarness();
const root=path.resolve('public');
const server=http.createServer((request,response)=>{
 if(request.url==='/review'){response.setHeader('Content-Type','text/html; charset=utf-8');response.end('<html><body><div id="root"></div><script>'+reviewBundle.replaceAll('</script','<\\/script')+'</script></body></html>');return}
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
 await page.evaluate(()=>{window.createTestCard=async ({numbers,colored,identityRecovery=false})=>{
  const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=1600;
  const ctx=canvas.getContext('2d');ctx.fillStyle=colored?'#18191c':'white';ctx.fillRect(0,0,1400,1600);ctx.fillStyle=colored?'white':'black';
  ctx.font='34px Arial';ctx.fillText('D. Drogba',15,42);ctx.fillText('Homem de área',15,89);
  ctx.font='28px Arial';ctx.fillText(identityRecovery?'Idade:31':'Nível máximo: 32',365,160);if(!colored)ctx.fillText('Pontos totais: 62',365,215);if(!identityRecovery)ctx.fillText('Posição principal: CA',365,270);
  if(identityRecovery){ctx.fillText('37',340,439);ctx.font='bold 28px Arial';ctx.fillText('RB',95,197);ctx.font='28px Arial';ctx.fillText('Comprimento da perna',25,1140);ctx.fillText('Tamanho da cintura',25,1200);}
  ctx.fillText('Agilidade',25,520);
  ctx.font='32px Arial';
  for(const [start,count,x] of [[0,10,390],[10,9,840],[19,7,1280]])for(let i=0;i<count;i++){if(colored){const value=numbers[start+i];ctx.fillStyle=value<70?'#f45c71':value<90?'#e4db50':'#79ed92';ctx.fillRect(x-10,570+i*48,80,42);ctx.fillStyle='black';}ctx.fillText(String(numbers[start+i]),x,600+i*48);}
  ctx.fillStyle=colored?'white':'black';ctx.font='28px Arial';ctx.fillText('Cabeçada',30,1470);ctx.fillText('Chute de primeira',30,1515);ctx.fillText('Passe de primeira',30,1560);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  window.cardFile=new File([blob],'canonical-card.png',{type:'image/png'});
  return window.readCard(window.cardFile);
 };});
 const output=await page.evaluate(input=>window.createTestCard(input),{numbers:values,colored:false});
 console.log(JSON.stringify({name:output.review.playerName,level:output.review.level,points:output.review.points,position:output.review.mainPosition,uncertain:output.review.uncertainKeys,fields:output.evidence.fields.map(f=>({key:f.key,text:f.value,confidence:f.confidence}))}));
 assert.equal(output.review.playerName,'D. Drogba','Zona Nome + estilo deve preservar o nome e separar as duas linhas.');
 assert.equal(output.review.level,'32');assert.equal(output.review.points,'62');assert.equal(output.review.mainPosition,'CF');
 assert.deepEqual(output.review.attributeValues,values,'As 26 leituras do WASM real devem preservar a ordem 10+9+7.');
 assert.equal(output.attributes.finishing,'96');assert.equal(output.attributes.speed,'75');
 assert.deepEqual(output.review.skillValues,['Cabeçada','Chute de primeira','Passe de primeira']);assert.equal(output.review.impetoName,'Agilidade');
 assert.equal(output.ocrSnapshot.stage,'ocrClosed');assert.equal(output.ocrSnapshot.workerReady,false);assert.equal(output.ocrSnapshot.pendingRecognitions,0);
 assert.deepEqual(external,[],'Leitura pessoal deve funcionar com assets locais, sem serviço de IA externo.');assert.deepEqual(errors,[]);
 const fallback=await page.evaluate(()=>window.testImageFallback());assert.equal(fallback.size.height,320);assert.equal(fallback.closed,true);assert.match(fallback.cover??'',/^data:image\/jpeg/,'Decodificação HTML precisa permitir capa real após bitmap rejeitado.');
 const automatic=await page.evaluate(()=>window.readCard(window.cardFile,'automatic'));
 assert.equal(automatic.review.playerName,'D. Drogba');
 assert.equal(automatic.review.level,'32','O modo automático deve ler a bio do mesmo layout usado na calibração padrão.');
 assert.equal(automatic.review.points,'62');assert.equal(automatic.review.mainPosition,'CF');
 assert.deepEqual(automatic.review.attributeValues,values);
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 const colored=await page.evaluate(input=>window.createTestCard(input),{numbers:values,colored:true});
 assert.deepEqual(colored.review.attributeValues,values,'O perfil escuro com badges coloridos precisa preencher26 atributos automaticamente.');
 assert.equal(Object.keys(colored.attributes).length,26);
 assert.equal(colored.review.playerName,'D. Drogba');assert.equal(colored.review.level,'32');assert.equal(colored.review.points,'62');
 assert.equal(colored.review.pointsSource,'level');assert.equal(colored.review.mainPosition,'CF');
 assert.deepEqual(colored.review.skillValues,['Cabeçada','Chute de primeira','Passe de primeira']);
 assert.equal(colored.ocrSnapshot.workerReady,false);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 const profile=await page.evaluate(input=>window.createTestCard(input),{numbers:values,colored:true,identityRecovery:true});
 assert.equal(profile.review.level,'37','Ler o máximo da bio sem confundir a idade31.');
 const recoveredLevel=profile.review.fields.find(field=>field.key==='level');
 console.log('Nível recuperado:',JSON.stringify(recoveredLevel));
 if(recoveredLevel.confidence>=80){assert.equal(profile.review.points,'72');assert.equal(profile.review.pointsSource,'level');}
 else {assert.equal(profile.review.points,'');assert.equal(profile.review.pointsSource,undefined);assert.ok(profile.review.uncertainKeys.includes('points'),'Não derivar pontos de um máximo com baixa confiança.');}
 assert.equal(profile.review.mainPosition,'RB','A sigla impressa na foto deve prevalecer sobre posição deduzida pelo nome/estilo.');
 assert.deepEqual(profile.review.attributeValues,values);
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 const confirmation={...colored.review,preview:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'};
 const reviewPage=await browser.newPage();
 await reviewPage.addInitScript(input=>{window.__reviewFixture=input;window.__reviewControl={requests:[]};},{confirmation,manualFields:{playerName:colored.review.playerName,level:colored.review.level,trainingPointsTotal:colored.review.points,attributes:colored.attributes,nativeSkills:colored.review.skillValues},position:colored.review.mainPosition});
 await reviewPage.goto(origin+'/review');
 await reviewPage.getByRole('button',{name:'Gerar ficha',exact:true}).waitFor();
 assert.equal(await reviewPage.getByRole('textbox',{name:'Nome do jogador',exact:true}).inputValue(),'D. Drogba');
 assert.equal(await reviewPage.getByRole('combobox',{name:'Posição natural da carta',exact:true}).inputValue(),'CF');
 assert.match(await reviewPage.locator('section').innerText(),/Pontos calculados automaticamente a partir do nível máximo\s*32/);
 await reviewPage.getByRole('button',{name:'Gerar ficha',exact:true}).click();
 await reviewPage.waitForFunction(()=>window.__reviewControl.requests.length===1);
 const generated=await reviewPage.evaluate(()=>window.__reviewControl.requests[0]);
 assert.deepEqual(generated.fields.attributes,colored.attributes,'Os26 atributos OCR devem chegar à geração sem preencher inputs.');
 assert.equal(generated.fields.trainingPointsTotal,'62');assert.equal(generated.naturalPosition,'CF');
 assert.deepEqual(generated.fields.nativeSkills,colored.review.skillValues);
 await reviewPage.evaluate(()=>window.__reviewControl.resolve({status:'completed',persistenceStarted:true}));
 await reviewPage.getByText('Ficha gerada',{exact:true}).waitFor();
 await reviewPage.close();
 console.log('OCR browser/WASM real: imagem, nome/estilo, nível/PP, 26 atributos, habilidades, ímpeto e encerramento aprovados.');
}finally{
 await browser?.close();await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}
