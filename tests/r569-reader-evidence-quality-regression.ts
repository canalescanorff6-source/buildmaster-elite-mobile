import * as assert from 'node:assert/strict';
import { assessReaderEvidenceQualityR569, benchmarkLabeledReaderCasesR569 } from '../src/lib/readerEvidenceQualityR569';
import { buildReaderV2ReviewDraft } from '../src/modules/card-reader-v2/readerV2Review';
import type { ReaderV2FieldEvidence } from '../src/modules/card-reader-v2/readerV2Types';
const rows=Array.from({length:26},(_,i)=>70+i);
const fields:ReaderV2FieldEvidence[]=[
  {key:'playerName',label:'Nome',value:'Jogador Exemplo',confidence:96,source:'zones'},
  {key:'level',label:'Nível',value:'49',confidence:95,source:'zones'},
  {key:'points',label:'Pontos',value:'96',confidence:95,source:'zones'},
  {key:'mainPosition',label:'Posição',value:'VOL',confidence:96,source:'zones'},
  {key:'attributes',label:'Atributos',value:rows.join(' '),attributeRows:rows,confidence:90,source:'zones'},
];
const draft=buildReaderV2ReviewDraft({
  mode:'zones',rawText:'',fields,uncertainKeys:[],attributeRows:rows,
  attributesExpected:26,attributesRead:26,
},null);
assert.equal(draft.readQualityR569?.manualReviewRequired,true);
assert.equal(draft.readQualityR569?.attributeSlotsRecognized,26);
assert.equal(draft.readQualityR569?.printedPointsObserved,true);
assert.equal(draft.readQualityR569?.status,'COBERTURA_COMPLETA_REVISAO_OBRIGATORIA');

const missing=assessReaderEvidenceQualityR569({
  ...draft,attributeRows:[...rows.slice(0,4),null,...rows.slice(5)],
  pointsSource:'level',
});
assert.equal(missing.status,'INCOMPLETO');
assert.equal(missing.attributeSlotsMissing,1);
assert.equal(missing.printedPointsObserved,false);
assert.ok(missing.issues.some(v=>v.code==='PONTOS_NAO_OBSERVADOS'));
assert.ok(missing.issues.some(v=>v.code==='ATRIBUTOS_PENDENTES'));

const noLayout=assessReaderEvidenceQualityR569({...draft,attributeRows:undefined,
  fields:fields.map(f=>({...f,attributeRows:undefined}))});
assert.equal(noLayout.attributeSlotsRecognized,0);
assert.ok(noLayout.issues.some(v=>v.code==='ATRIBUTOS_SEM_LAYOUT_COMPLETO'));

const lowConfidence=assessReaderEvidenceQualityR569({...draft,
  fields:fields.map(x=>x.key==='level'?{...x,confidence:35}:x)});
assert.ok(lowConfidence.issues.some(v=>v.code==='EVIDENCIA_FRACA_level'));
const none=benchmarkLabeledReaderCasesR569([]);
assert.equal(none.attributeAccuracy,null);
assert.equal(none.status,'SEM_FIXTURES');
const measured=benchmarkLabeledReaderCasesR569([{caseId:'synthetic-test-only',
 expected:{playerName:'Jogador Exemplo',level:'49',points:'96',attributeRows:rows},
 actual:{...draft,attributeRows:rows}}]);
assert.equal(measured.attributeAccuracy,100);
assert.equal(measured.validatedOnRealScreenshots,false);
assert.equal(measured.nameExact,1);
const mismatch=benchmarkLabeledReaderCasesR569([{caseId:'synthetic-mismatch',
 expected:{playerName:'Jogador Exemplo',level:'49',points:'96',attributeRows:rows},
 actual:{...draft,attributeRows:rows.map((v,i)=>i===6?v+1:v)}}]);
assert.equal(mismatch.attributeExact,25);
console.log('R569 GREEN: field-level fail-closed coverage, confidence, explicit points and synthetic benchmark');
