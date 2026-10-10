import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { emptyTraining } from '../src/lib/trainingPlanCore';
import { buildFinalDecisionR570 } from '../src/lib/finalDecisionR570';
import { cardIdentityFingerprintR126 } from '../src/lib/cardIdentityFingerprintR126';
import type { AnalysisResult } from '../src/lib/analyzerDomain';

const training={...emptyTraining(),shooting:4};
const card={
  playerName:'Jogador Teste',cardType:'Épica',internalId:'edition-1',mainPosition:'CF',mainPositionPt:'CA',
  attributes:{finishing:90,balance:80},
  nativeSkills:['Chute de primeira'],specialSkills:[],additionalSkills:['Toque duplo'],
  impetos:[{name:'Passe',active:true}],
  manualConfirmed:false,trainingPointSource:'OCR',
  trainingPointsTotal:50,evidence:{attributeCount:2,criticalStateR419:'UNCERTAIN'},
};
const result={
  parsed:card,
  training,trainingPointsTotal:50,trainingPointsUsed:4,trainingPointsRemaining:46,
  buildVariants:[{kind:'safe',training},{kind:'competitive',training:{...training,passing:4}}],
  requestedUsagePosition:'CF',bestPosition:{code:'CF',label:'CA',score:84},
  tacticalProfile:{formation:'4-3-1-2',style:'POSSE_DE_BOLA'},
} as unknown as AnalysisResult;
const initial=JSON.stringify(result);
const report=buildFinalDecisionR570({result,manager:null,matchRecords:[]});
assert.equal(report.canApplyToGame,false);
assert.equal(report.canWriteVault,false);
assert.equal(report.selectedWinnerId,null);
assert.equal(report.status,'PRECISA_REVISAO');
assert.equal(report.budget,null,'OCR points must never be treated as manually verified budget');
assert.equal(report.checks.length,8);
assert.equal(report.checks.find(x=>x.key==='BUILDS')?.status,'REVISAR');
assert.equal(report.checks.find(x=>x.key==='MANAGER')?.status,'REVISAR');
assert.equal(report.checks.find(x=>x.key==='SKILLS')?.status,'REVISAR');
assert.equal(report.checks.find(x=>x.key==='MATCHES')?.status,'REVISAR');
assert.equal(JSON.stringify(result),initial,'Decision must not alter result or vault.');
const over={
  ...result,parsed:{...card,trainingPointsTotal:1,trainingPointSource:'MANUAL',manualConfirmed:true}
} as unknown as AnalysisResult;
const invalid=buildFinalDecisionR570({result:over,manager:null,matchRecords:[]});
assert.equal(invalid.checks.find(x=>x.key==='BUDGET')?.status,'BLOQUEADO');
assert.equal(invalid.status,'BLOQUEADO');
const conflicting={
  ...result,parsed:{...card,evidence:{...card.evidence,criticalStateR419:'CONFLICTING'}}
} as unknown as AnalysisResult;
assert.equal(buildFinalDecisionR570({result:conflicting,manager:null,matchRecords:[]}).status,'BLOQUEADO');
const fingerprint=cardIdentityFingerprintR126(result.parsed);
const same={cardFingerprint:fingerprint,targetPosition:'CF'} as any;
const elsewhere={cardFingerprint:'other-edition',targetPosition:'CF'} as any;
const wrongPosition={cardFingerprint:fingerprint,targetPosition:'DMF'} as any;
const filtered=buildFinalDecisionR570({result,manager:null,matchRecords:[same,elsewhere,wrongPosition]});
assert.equal(filtered.matchCount,1,'Only exact edition and requested position can join the panel.');
const panel=readFileSync('src/components/result/FinalDecisionPanelR570.tsx','utf8');
const parent=readFileSync('src/components/result/ResultEvidencePanelR561.tsx','utf8');
assert.match(panel,/readMatchValidationRepositoryR137/);
assert.match(panel,/navigator\.clipboard\.writeText/);
assert.match(panel,/setExportText\(value\)/);
assert.match(parent,/<FinalDecisionPanelR570 result=\{result\}/);
assert.doesNotMatch(panel,/persistMatchValidationRepositoryR137|writeAccountStorage|localStorage\.setItem/);
console.log('R570 GREEN: no fabricated winner, strict card, budget, slots, evidence and export');
