import * as assert from 'node:assert/strict';
import {recoverReaderV2Identity} from '../src/modules/card-reader-v2/readerV2IdentityRecovery';
import {READER_V2_DEFAULT_ZONES} from '../src/modules/card-reader-v2/readerV2ZoneProfile';
import type {ReaderV2FieldEvidence} from '../src/modules/card-reader-v2/readerV2Types';
const field=(key:string,value:string,confidence=95):ReaderV2FieldEvidence=>({key,label:key,value,confidence,source:'zones'});
async function main(){
 const fields=[field('playerName','Cafu'),field('mainPosition','BB'),field('level','31 anos'),field('physicalModel','Comprimento da perna\nTamanho da cintura')],uncertain=['mainPosition','level'];
 await recoverReaderV2Identity(fields,uncertain,READER_V2_DEFAULT_ZONES,async zone=>({...field(zone.key,zone.key==='level'?'37':'RB',85),label:zone.label}));
 assert.equal(fields.find(f=>f.key==='mainPosition')?.value,'RB');assert.equal(fields.find(f=>f.key==='level')?.value,'37');assert.deepEqual(uncertain,[]);
 const unsupported=[field('physicalModel','Comprimento da perna'),field('playerName','Cafu')];let reads=0;
 await recoverReaderV2Identity(unsupported,['level'],READER_V2_DEFAULT_ZONES,async zone=>{reads++;return field(zone.key,'37');});assert.equal(reads,0);
 const invalid=[field('physicalModel','Comprimento da perna\nTamanho da cintura'),field('playerName','Cafu')],pending=['mainPosition','level'];
 await recoverReaderV2Identity(invalid,pending,READER_V2_DEFAULT_ZONES,async zone=>field(zone.key,zone.key==='level'?'999':'BB',99));
 assert.deepEqual(pending,['mainPosition','level']);assert.equal(invalid.find(f=>f.key==='level'),undefined);
}
void main().then(()=>console.log('Identidade: layout verificado e recuperação semanticamente válida aprovados.')).catch(cause=>{console.error(cause);process.exitCode=1;});
