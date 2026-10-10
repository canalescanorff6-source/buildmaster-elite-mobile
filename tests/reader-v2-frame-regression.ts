import * as assert from 'node:assert/strict';
import {detectReaderV2Frame, mapReaderV2ZoneToFrame} from '../src/modules/card-reader-v2/readerV2Frame';
import {READER_V2_DEFAULT_ZONES} from '../src/modules/card-reader-v2/readerV2ZoneProfile';

type Box = {x:number;y:number;w:number;h:number};
function print(panels:Box[], width=1100, height=2000, merged=false) {
 const data=new Uint8ClampedArray(width*height*4);
 const rectangle=(x:number,y:number,w:number,h:number)=>{
  for(let py=Math.round(y);py<Math.round(y+h);py++)for(let px=Math.round(x);px<Math.round(x+w);px++){
   const index=(py*width+px)*4;data[index]=255;data[index+1]=30;data[index+3]=255;
  }
 };
 for(const p of panels)for(const [column,count] of [10,9,7].entries()){
  const badge=p.w*44/1400, pitch=p.h*47.7/1600;
  for(let row=0;row<count;row++)rectangle(p.x+p.w*(424+column*460)/1400-badge/2,p.y+p.h*588/1600+row*pitch-badge/2,badge,merged?pitch:badge);
 }
 return {width,height,data};
}
const expected={x:110,y:440,w:700,h:800};
for(const merged of [false,true]) {
 const frame=detectReaderV2Frame(print([expected],1100,2000,merged));
 assert.ok(frame,'Três colunas de atributos localizam a carta, inclusive badges unidos.');
 for(const key of ['x','y','w','h'] as const)assert.ok(Math.abs(frame[key]*(key==='x'||key==='w'?1100:2000)-expected[key])<9,key);
 const zone=READER_V2_DEFAULT_ZONES[0];const mapped=mapReaderV2ZoneToFrame(zone,frame);
 assert.ok(mapped.y>.2);assert.equal(mapped.key,'playerName');assert.equal(zone.y,5/1600,'Não alterar o preset compartilhado.');
}
assert.equal(detectReaderV2Frame(print([])),undefined,'Uma imagem sem tabela não é perfil EFHub.');
assert.equal(detectReaderV2Frame(print([{x:30,y:100,w:450,h:515},{x:580,y:1050,w:450,h:515}])),undefined,'Dois painéis não podem escolher silenciosamente um jogador.');
const nearFull=detectReaderV2Frame(print([{x:0,y:0,w:700,h:800}],700,800));
assert.deepEqual(nearFull,{x:0,y:0,w:1,h:1},'Manter a geometria dos prints já recortados.');
console.log('Painel: margens, deslocamento, badges unidos, ausência e ambiguidade aprovados.');
