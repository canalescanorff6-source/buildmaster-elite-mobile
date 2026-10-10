import * as assert from 'node:assert/strict';
import {readReaderV2Zones} from '../src/modules/card-reader-v2/readerV2Zones';
import {READER_V2_DEFAULT_ZONES} from '../src/modules/card-reader-v2/readerV2ZoneProfile';
import {mapReaderV2ZoneToFrame} from '../src/modules/card-reader-v2/readerV2Frame';
import type {ReaderV2Zone} from '../src/modules/card-reader-v2/readerV2Types';

const frame={x:.12,y:.22,w:.76,h:.42};
const automatic=READER_V2_DEFAULT_ZONES.map(zone=>mapReaderV2ZoneToFrame(zone,frame));
async function read(zones:ReaderV2Zone[]) {
 const crops:ReaderV2Zone[]=[];
 await readReaderV2Zones({zones,imageSession:{frame,withCrop:async(zone,operation)=>{crops.push(zone);return operation({} as HTMLCanvasElement)}},workerSession:{recognize:async(_crop,key)=>({key,label:key,value:'',confidence:0,source:'zones'})}});
 return crops;
}
async function main(){
 const stale=await read(READER_V2_DEFAULT_ZONES);
 assert.deepEqual(stale.find(zone=>zone.key==='playerName'),automatic[0],'Calibração padrão aplicada a uma captura maior deve seguir o painel encontrado.');
 const custom=automatic.map(zone=>zone.key==='playerName'?{...zone,w:zone.w*.8}:zone);
 const valid=await read(custom);
 assert.deepEqual(valid.find(zone=>zone.key==='playerName'),custom[0],'Calibração explícita válida conserva seu recorte personalizado.');
 const partial=await read([READER_V2_DEFAULT_ZONES[0]]);
 assert.deepEqual(partial[0],READER_V2_DEFAULT_ZONES[0],'Uma leitura parcial explícita não vira uma leitura automática completa.');
 console.log('Calibração: recuperar geometria antiga e preservar seleção explícita válida.');
}
void main().catch(error=>{console.error(error);process.exitCode=1});
