import * as assert from 'node:assert/strict';
import { deriveReaderCanonicalEvidenceR549 } from '../src/lib/readerCanonicalEvidenceR549';
import { buildReaderV2ReviewDraft } from '../src/modules/card-reader-v2/readerV2Review';
import { inspectReaderV2OptionalFieldsR563, safeReaderV2NumericTokensR563 } from '../src/modules/card-reader-v2/readerV2OptionalCaptureR563';
const fields=[
 {key:'skills',label:'Habilidades',source:'zones' as const,value:'Passe de primeira\nHabilidades Adicionais:\nToque duplo',confidence:95},
 {key:'impeto',label:'Ímpeto',source:'zones' as const,value:'Instinto artilheiro +4',confidence:90},
];
assert.deepEqual(deriveReaderCanonicalEvidenceR549(fields).skillValues,['Passe de primeira','Toque duplo']);
const extra=inspectReaderV2OptionalFieldsR563(fields);
assert.equal(extra.additionalSkills.status,'REVISAR');
assert.deepEqual(extra.additionalSkills.candidates,['Toque duplo']);
assert.equal(extra.boosters.status,'REVISAR');
assert.equal(inspectReaderV2OptionalFieldsR563([{...fields[0],confidence:20}]).additionalSkills.status,'PENDENTE');
assert.deepEqual(safeReaderV2NumericTokensR563('88 90 9O 8? 98% 70'),[88,90,70]);
const draft=buildReaderV2ReviewDraft({mode:'zones',rawText:'',fields,uncertainKeys:[]},null);
assert.deepEqual(draft.optionalCaptureR563?.additionalSkills.candidates,['Toque duplo']);
console.log('R563 GREEN - optional OCR candidate boundaries');
