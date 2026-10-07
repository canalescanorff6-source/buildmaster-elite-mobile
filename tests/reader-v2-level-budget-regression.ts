import * as assert from 'node:assert/strict';
import {buildReaderV2ReviewDraft} from '../src/modules/card-reader-v2/readerV2Review';
import type {ReaderV2Evidence} from '../src/modules/card-reader-v2/readerV2Types';
const evidence:ReaderV2Evidence={mode:'automatic',rawText:'Cafu',uncertainKeys:[],fields:[
 {key:'playerName',label:'Nome',value:'Cafu',confidence:96,source:'automatic'},
 {key:'level',label:'Nível máximo',value:'37',confidence:96,source:'automatic'},
 {key:'mainPosition',label:'Posição na carta',value:'RB',confidence:96,source:'automatic'},
]};
const review=buildReaderV2ReviewDraft(evidence,null);
assert.equal(review.level,'37');assert.equal(review.points,'72');assert.equal(review.pointsSource,'level');assert.equal(review.mainPosition,'RB');
assert.ok(!review.uncertainKeys.includes('points'));
const explicit=buildReaderV2ReviewDraft({...evidence,fields:[...evidence.fields,{key:'points',label:'Pontos',value:'70',confidence:96,source:'automatic'}]},null);
assert.equal(explicit.points,'70');assert.equal(explicit.pointsSource,'print');assert.ok(explicit.uncertainKeys.includes('points'));
assert.equal(buildReaderV2ReviewDraft({...evidence,uncertainKeys:['level']},null).points,'');
assert.equal(buildReaderV2ReviewDraft({...evidence,fields:[...evidence.fields,{key:'identityMeta',label:'Bio',value:'Nível máximo:31',confidence:96,source:'automatic'}]},null).points,'');
for(const field of [
 {key:'level',label:'Nível máximo',value:'37',confidence:10,source:'automatic'},
 {key:'level',label:'Nível máximo',value:'37',confidence:96,source:'automatic',error:'OCR interrompido'},
 {key:'level',label:'Nível atual',value:'37',confidence:96,source:'automatic'},
 {key:'level',label:'Nível',value:'3',confidence:96,source:'automatic'},
 {key:'level',label:'Nível máximo',value:'999',confidence:96,source:'automatic'},
] as ReaderV2Evidence['fields']){
 assert.equal(buildReaderV2ReviewDraft({...evidence,fields:[evidence.fields[0],field,evidence.fields[2]]},null).points,'');
}
const zero=buildReaderV2ReviewDraft({...evidence,fields:[...evidence.fields,{key:'points',label:'Pontos',value:'0',confidence:96,source:'automatic'}]},null);
assert.equal(zero.points,'0');assert.equal(zero.pointsSource,'print');
const fraction=buildReaderV2ReviewDraft({...evidence,fields:[evidence.fields[0],{key:'level',label:'Nível',value:'3/37',confidence:96,source:'automatic'}]},null);
assert.equal(fraction.level,'37');assert.equal(fraction.points,'72');
const currentFraction=buildReaderV2ReviewDraft({...evidence,fields:[evidence.fields[0],{key:'level',label:'Nível atual / máximo',value:'3/37',confidence:96,source:'automatic'}]},null);
assert.equal(currentFraction.points,'72');
const levelOne=buildReaderV2ReviewDraft({...evidence,fields:[evidence.fields[0],{key:'level',label:'Nível máximo',value:'1',confidence:96,source:'automatic'}]},null);
assert.equal(levelOne.points,'0');assert.equal(levelOne.pointsSource,'level');
const failed=buildReaderV2ReviewDraft({...evidence,fields:[...evidence.fields,{key:'points',label:'Pontos',value:'??',confidence:10,source:'automatic',error:'Falha de OCR'}],uncertainKeys:['points']},null);
assert.equal(failed.points,'72');assert.equal(failed.pointsSource,'level');assert.ok(failed.uncertainKeys.includes('points'));
const weak=buildReaderV2ReviewDraft({...evidence,fields:[evidence.fields[0],{key:'level',label:'Nível máximo',value:'37',confidence:50,source:'automatic'},{key:'identityMeta',label:'Bio',value:'Nível máximo: ilegível',confidence:96,source:'automatic'}]},null);
assert.equal(weak.points,'');
console.log('Orçamento: nível máximo verificado, origem calculada e conflitos aprovados.');
