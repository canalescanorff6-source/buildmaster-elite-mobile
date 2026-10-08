import * as assert from 'node:assert/strict';
import {readerV2CellNumber} from '../src/modules/card-reader-v2/readerV2NumericCell';
assert.equal(readerV2CellNumber('96\n',86),96);
assert.equal(readerV2CellNumber('102',96),102);
for (const [text,confidence] of [['9',95],['7B',95],['ss',90],['93 77',99],['999',99],['78',0],['',99]] as const) {
  assert.equal(readerV2CellNumber(text,confidence),null,'Nunca completar números truncados ou substituir letras por dígitos.');
}
console.log('Células numéricas: número inteiro, faixa e confiança aprovados.');
import {prepareReaderV2Crop} from '../src/modules/card-reader-v2/readerV2CropPreparation';
const pixels=new Uint8ClampedArray(100*4);
for(let index=0;index<100;index++)pixels.set(index<10?[255,255,255,255]:index<15?[0,0,0,255]:[255,220,0,255],index*4);
const canvas={width:10,height:10,getContext:()=>({getImageData:()=>({data:pixels,width:10,height:10}),putImageData:()=>{}})} as unknown as HTMLCanvasElement;
prepareReaderV2Crop(canvas,'mainPosition');
assert.equal(pixels[10*4],0,'Texto preto em fundo colorido genérico não pode ser apagado por uma máscara de texto branco.');
