import * as assert from 'node:assert/strict';
import {renderCardCropPreview} from '../src/modules/card-reader/cardArtCrop';
import { openReaderV2ImageSession } from '../src/modules/card-reader-v2/readerV2ImageSession';
async function main(){
  const original={document:globalThis.document,Image:globalThis.Image,bitmap:globalThis.createImageBitmap};
  let revoked=0;
  const revoke=URL.revokeObjectURL; URL.revokeObjectURL=()=>{revoked++;};
  Object.assign(globalThis,{document:{createElement:()=>({width:1,height:1,toDataURL:()=> 'data:image/jpeg;base64,cover',getContext:()=>({drawImage:()=>{}})})},createImageBitmap:undefined,Image:class{width=600;height=800;onload:(()=>void)|null=null;onerror=null;set src(value:string){if(value)queueMicrotask(()=>this.onload?.());}}});
  try{const session=await openReaderV2ImageSession(new Blob(['image'],{type:'image/png'}));assert.equal(session.width,600);session.close();assert.equal(revoked,2,'Liberar tanto a imagem de fallback quanto a prévia.');
    assert.equal(await renderCardCropPreview(new Blob(['image'],{type:'image/png'}),{x:0,y:0,w:1,h:1}),'data:image/jpeg;base64,cover','A capa deve usar a mesma alternativa HTML do OCR.');
    Object.assign(globalThis,{createImageBitmap:async()=>{throw new Error('unsupported')}});
    const rejected=await openReaderV2ImageSession(new Blob(['image'],{type:'image/png'}),{maxSourceDimension:320});assert.equal(rejected.height,320);rejected.close();}
  finally{Object.assign(globalThis,{document:original.document,Image:original.Image,createImageBitmap:original.bitmap});URL.revokeObjectURL=revoke;}
}
void main().catch(error=>{console.error(error);process.exitCode=1;});
