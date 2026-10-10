import * as assert from 'node:assert/strict';
import {deriveReaderCanonicalEvidenceR549} from '../src/lib/readerCanonicalEvidenceR549';
import {buildReaderV2ReviewDraft,readerV2ReviewRawText} from '../src/modules/card-reader-v2/readerV2Review';
import {inspectReaderV2OptionalFieldsR563,safeReaderV2NumericTokensR563,splitReaderV2SkillsR563} from '../src/modules/card-reader-v2/readerV2OptionalCaptureR563';
import {readReaderV2Zones} from '../src/modules/card-reader-v2/readerV2Zones';
import {mapLegacyCalibrationToReaderV2} from '../src/modules/card-reader-v2/readerV2ZoneProfile';

async function main() {
 const skillText='Habilidades nativas\nPasse de primeira\nHabilidades Adicionais:\nToque duplo\nChute de primeira';
 const split=splitReaderV2SkillsR563(skillText);
 assert.match(split.native,/Passe de primeira/);
 assert.doesNotMatch(split.native,/Toque duplo/);
 const canon=deriveReaderCanonicalEvidenceR549([{key:'skills',value:skillText}]);
 assert.deepEqual(canon.skillValues,['Passe de primeira']);
 const optional=inspectReaderV2OptionalFieldsR563([
   {key:'skills',label:'Habilidades',source:'zones',value:skillText,confidence:93},
   {key:'impeto',label:'Ímpetos',source:'zones',value:'Instinto artilheiro +4\nFisicalidade +3',confidence:91}
 ]);
 assert.deepEqual(optional.additionalSkills.candidates,['Toque duplo','Chute de primeira']);
 assert.equal(optional.additionalSkills.status,'REVISAR');
 assert.deepEqual(optional.boosters.candidates,['Instinto artilheiro','Fisicalidade']);
 assert.equal(optional.boosters.status,'REVISAR');
 assert.deepEqual(inspectReaderV2OptionalFieldsR563([{key:'skills',label:'Habilidades',source:'zones',value:'Habilidades Adicionais\nToque duplo',confidence:20}]).additionalSkills.candidates,[]);
 assert.equal(inspectReaderV2OptionalFieldsR563([{key:'skills',label:'Habilidades',source:'zones',value:'Toque duplo',confidence:98}]).additionalSkills.status,'PENDENTE');
 assert.equal(inspectReaderV2OptionalFieldsR563([{key:'skills',label:'Habilidades',source:'zones',value:'Habilidades Adicionais\nToque duplo\n%????',confidence:95}]).additionalSkills.status,'PENDENTE');
 assert.deepEqual(safeReaderV2NumericTokensR563('88 90 9O 8? 98% 70'),[88,90,70]);
 assert.deepEqual(safeReaderV2NumericTokensR563('0 111 75 101'),[75,101]);
 assert.equal(mapLegacyCalibrationToReaderV2([{key:'habilidadesAdicionais',x:.1,y:.7,w:.6,h:.2}])[0]?.key,'additionalSkills');
 assert.deepEqual(inspectReaderV2OptionalFieldsR563([{key:'additionalSkills',label:'Habilidades Adicionais',source:'zones',value:'Toque duplo\nChute de primeira',confidence:94}]).additionalSkills.candidates,['Toque duplo','Chute de primeira']);
 const zones=[
  {key:'skills',label:'Habilidades',x:.01,y:.7,w:.9,h:.2,enabled:true},
  {key:'impeto',label:'Ímpeto',x:.05,y:.4,w:.8,h:.1,enabled:true}
 ];
 const evidence=await readReaderV2Zones({zones,imageSession:{withCrop:async(z:any,fn:any)=>fn({key:z.key})},
  workerSession:{recognize:async(_image:any,key:string)=>key==='impeto'?
   {key,value:'',confidence:0,source:'zones' as const,label:key,error:'ruído de leitura'}:
   {key,value:skillText,confidence:95,source:'zones' as const,label:key}}});
 assert.ok(evidence.uncertainKeys.includes('impeto'));
 const draft=buildReaderV2ReviewDraft(evidence,null);
 assert.deepEqual(draft.optionalCaptureR563?.additionalSkills.candidates,['Toque duplo','Chute de primeira']);
 assert.equal(draft.optionalCaptureR563?.boosters.status,'PENDENTE');
 const exported=readerV2ReviewRawText(draft);
 assert.doesNotMatch(exported,/Habilidades Adicionais:/i,'Additional OCR cannot silently become analyzer-owned data');
 assert.doesNotMatch(exported,/Toque duplo/,'No auto ownership of extra skills');
 assert.ok(draft.uncertainKeys.includes('additionalSkills'),'OCR candidates require slot-level review');
 const weakBoosters=buildReaderV2ReviewDraft({...evidence,fields:[{key:'impeto',label:'Ímpetos',value:'Passe +2',confidence:8,source:'zones'}]},null);
 assert.doesNotMatch(readerV2ReviewRawText(weakBoosters),/ÍMPETO: Passe/,'Weak booster must not be passed to analyzer');
 const old=deriveReaderCanonicalEvidenceR549([{key:'skills',value:'Passe de primeira\nChute de primeira'}]);
 assert.deepEqual(old.skillValues,['Passe de primeira','Chute de primeira']);
 console.log('R563 GREEN — optional OCR evidence, numeric noise, pending recovery and legacy skills.');
}
void main().catch(error=>{console.error(error);process.exitCode=1});
