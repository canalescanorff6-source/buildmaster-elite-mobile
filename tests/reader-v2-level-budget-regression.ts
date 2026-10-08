import * as assert from 'node:assert/strict';
import { buildReaderV2ReviewDraft } from '../src/modules/card-reader-v2/readerV2Review';
import type { ReaderV2Evidence } from '../src/modules/card-reader-v2/readerV2Types';

const evidence: ReaderV2Evidence = { mode:'automatic',rawText:'Cafu',uncertainKeys:[],fields:[
  {key:'playerName',label:'Nome',value:'Cafu',confidence:96,source:'automatic'},
  {key:'level',label:'Nível máximo',value:'37',confidence:96,source:'automatic'},
  {key:'mainPosition',label:'Posição na carta',value:'RB',confidence:96,source:'automatic'},
] };
const review=buildReaderV2ReviewDraft(evidence,null);
assert.equal(review.level,'37');
assert.equal(review.points,'72','O orçamento ausente no print deve ser calculado a partir do nível máximo verificado.');
assert.equal(review.mainPosition,'RB');
assert.ok(!review.uncertainKeys.includes('points'));
assert.equal(review.pointsSource,'level','Os72 pontos são calculados, não lidos do print.');
const explicit=buildReaderV2ReviewDraft({...evidence,fields:[...evidence.fields,{key:'points',label:'Pontos',value:'70',confidence:96,source:'automatic'}]},null);
assert.equal(explicit.points,'70','Um orçamento explicitamente lido deve prevalecer sobre o cálculo.');
assert.ok(explicit.uncertainKeys.includes('points'),'Divergência precisa continuar visível.');
assert.equal(explicit.pointsSource,'print');
const lowConfidence=buildReaderV2ReviewDraft({...evidence,uncertainKeys:['level']},null);
assert.equal(lowConfidence.points,'','Não calcular orçamento de um nível incerto.');
const conflict=buildReaderV2ReviewDraft({...evidence,fields:[...evidence.fields,{key:'identityMeta',label:'Bio',value:'Nível máximo: 31',confidence:96,source:'automatic'}]},null);
assert.equal(conflict.points,'','Idades e níveis conflitantes não podem produzir orçamento automático.');
for (const field of [
  {key:'level',label:'Nível máximo',value:'37',confidence:10,source:'automatic'},
  {key:'level',label:'Nível máximo',value:'37',confidence:96,source:'automatic',error:'OCR interrompido'},
  {key:'level',label:'Nível atual',value:'37',confidence:96,source:'automatic'},
  {key:'level',label:'Nível',value:'3',confidence:96,source:'automatic'},
  {key:'level',label:'Nível máximo',value:'999',confidence:96,source:'automatic'},
] as ReaderV2Evidence['fields']) {
  assert.equal(buildReaderV2ReviewDraft({...evidence,fields:[evidence.fields[0],field,evidence.fields[2]]},null).points,'','Não calcular orçamento de evidência sem nível máximo confiável.');
}
const explicitZero=buildReaderV2ReviewDraft({...evidence,fields:[...evidence.fields,{key:'points',label:'Pontos',value:'0',confidence:96,source:'automatic'}]},null);
assert.equal(explicitZero.points,'0','Preservar um orçamento zero explicitamente impresso.');
assert.equal(explicitZero.pointsSource,'print');
const fraction=buildReaderV2ReviewDraft({...evidence,fields:[evidence.fields[0],{key:'level',label:'Nível',value:'3/37',confidence:96,source:'automatic'}]},null);
assert.equal(fraction.level,'37');assert.equal(fraction.points,'72');
const failedPoints=buildReaderV2ReviewDraft({...evidence,fields:[...evidence.fields,{key:'points',label:'Pontos',value:'??',confidence:10,source:'automatic',error:'Falha na leitura dos pontos'}],uncertainKeys:['points']},null);
assert.equal(failedPoints.points,'72');assert.equal(failedPoints.pointsSource,'level');
assert.ok(failedPoints.uncertainKeys.includes('points'),'Um orçamento calculado não apaga a falha na leitura de um orçamento impresso.');
const weakNumber=buildReaderV2ReviewDraft({...evidence,fields:[
  evidence.fields[0],{key:'level',label:'Nível máximo',value:'37',confidence:50,source:'automatic'},
  {key:'identityMeta',label:'Bio',value:'Nível máximo: ilegível',confidence:96,source:'automatic'},
]},null);
assert.equal(weakNumber.points,'','A confiança do rótulo não pode autorizar um número fraco de outro campo.');
console.log('Orçamento automático: nível verificado, pontos explícitos e conflitos aprovados.');
