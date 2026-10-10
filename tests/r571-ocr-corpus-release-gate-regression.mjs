import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { evaluateOcrCorpusR571 } from '../scripts/evaluate-ocr-golden-corpus-r571.mjs';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'buildmaster-r571-unit-'));
const img=path.join(dir,'mock.png');
try{
  // Only a fixture stub for testing SHA-256 logic. It is NOT a real gameplay screenshot.
  fs.writeFileSync(img,Buffer.from('SYNTHETIC_TEST_IMAGE_STUB'));
  const hash=crypto.createHash('sha256').update(fs.readFileSync(img)).digest('hex');
  const sourceSha='a'.repeat(40), apkSha256='b'.repeat(64);
  const expected={playerName:'Exemplo',level:45,points:88,
    attributeRows:Array.from({length:26},(_,i)=>65+i),
    additionalSkills:['Passe de primeira'],boosters:['Passe']};
  const item={
    caseId:'unit-test-1',sourceKind:'REAL_SCREENSHOT',reviewedByHuman:true,
    imagePath:'mock.png',imageSha256:hash,
    mode:'automatic',deviceModel:'Unit test phone',resolution:'2400x1080',
    cardType:'Épica',outcome:'completed',expected,
    observed:{playerName:'Exemplo',level:45,points:88,pointsSource:'print',
      attributeRows:[...expected.attributeRows],
      additionalSkills:['Passe de primeira'],boosters:['Passe']},
  };
  const manifest={schemaVersion:1,kind:'REAL_DEVICE_OCR_CORPUS',sourceSha,apkSha256,cases:[item]};
  const report=evaluateOcrCorpusR571(manifest,{rootDir:dir});
  assert.equal(report.testedCases,1);
  assert.equal(report.accuracy.attributes,1,'Exact labels exercise benchmark arithmetic.');
  assert.equal(report.accuracy.name,1);
  assert.equal(report.corpusStatus,'REPROVADO_OU_INSUFICIENTE',
    'A single synthetic fixture cannot qualify any release.');
  assert.equal(report.physicalDeviceAccepted,false);
  const strict=evaluateOcrCorpusR571(manifest,{rootDir:dir,strict:true,sourceSha,apkSha256});
  assert.notEqual(strict.corpusStatus,'GATE_DE_ACURACIA_APROVADO');
  const noSHA=evaluateOcrCorpusR571({...manifest,cases:[{...item,imageSha256:'c'.repeat(64)}]}, {rootDir:dir});
  assert.ok(noSHA.structuralErrors.some(v=>/SHA-256 divergente/.test(v)));
  const crossAPK=evaluateOcrCorpusR571(manifest,{rootDir:dir,strict:true,
    sourceSha,apkSha256:'c'.repeat(64)});
  assert.ok(crossAPK.qualityGaps.some(v=>/apkSha256 diferente/.test(v)));
  const crash=evaluateOcrCorpusR571({...manifest,cases:[{...item,outcome:'crash'}]},{rootDir:dir});
  assert.equal(crash.readErrors,1);
  assert.equal(crash.accuracy.attributes,0);
  assert.equal(crash.accuracy.completeCard,0);
  const altered=evaluateOcrCorpusR571({...manifest,cases:[{...item,
    observed:{...item.observed,attributeRows:[...item.observed.attributeRows.slice(0,9),null,
      ...item.observed.attributeRows.slice(10)],pointsSource:'level'}}]},{rootDir:dir});
  assert.equal(altered.accuracy.attributes,0.96154);
  assert.equal(altered.accuracy.points,0);
  assert.equal(altered.accuracy.completeCard,0);
  const missing=evaluateOcrCorpusR571({schemaVersion:1,kind:'REAL_DEVICE_OCR_CORPUS',cases:[]});
  assert.equal(missing.corpusStatus,'SEM_CORPUS_REAL');
  const synthetic=evaluateOcrCorpusR571({...manifest,cases:[{...item,sourceKind:'SYNTHETIC_UNIT_TEST'}]},{rootDir:dir});
  assert.ok(synthetic.structuralErrors.some(v=>/print real/.test(v)));
  const traversed=evaluateOcrCorpusR571({...manifest,cases:[{...item,imagePath:'../outside.png'}]},{rootDir:dir});
  assert.ok(traversed.structuralErrors.some(v=>/fora da pasta/.test(v)));
  const noFile=spawnSync(process.execPath,
    ['scripts/evaluate-ocr-golden-corpus-r571.mjs','--corpus',path.join(dir,'absent.json'),'--strict'],
    {encoding:'utf8'});
  assert.equal(noFile.status,1,'Strict gate must fail closed when real screenshots are missing.');
  console.log('R571 GREEN — quality arithmetic, hash, path, crash, uncertainty, release binding and no fake physical acceptance');
}finally{
  fs.rmSync(dir,{recursive:true,force:true});
}
