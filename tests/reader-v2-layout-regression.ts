import * as assert from 'node:assert/strict';
import { readReaderV2Automatic } from '../src/modules/card-reader-v2/readerV2Automatic';
import { ATTRIBUTE_INPUTS } from '../src/lib/analyzerDomain';
async function main(){
 for(const [width,height,y] of [[720,1600,.36],[1600,720,.18]]){
  const crops:any[]=[];
  const result=await readReaderV2Automatic({imageSession:{width,height,withCrop:async(zone,operation)=>{crops.push(zone);return operation({} as HTMLCanvasElement)}},workerSession:{recognize:async(_image,key)=>({key,label:key,value:key==='attributes'?ATTRIBUTE_INPUTS.map((item,index)=>`${item.label}: ${60+index}`).join('\n'):'',confidence:95,source:'automatic'})}});
  assert.equal(crops.find(zone=>zone.key==='attributes')?.y,y);
  assert.ok(!crops.some(zone=>zone.key.startsWith('attributes-values-')),'Outro layout não pode usar índices de colunas EFHub.');
  assert.equal(result.attributesRead,26);assert.equal(result.attributeValues?.[25],85);
 }
}
void main().catch(error=>{console.error(error);process.exitCode=1;});
