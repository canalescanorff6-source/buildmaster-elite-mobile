import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { MatchValidationRecord } from '../src/lib/appStartupContractsR200';
import { listMatchEvidenceContextsR568, evaluateMatchEvidenceR568 } from '../src/lib/matchEvidenceLabR568';

const record = (arm:'A'|'B', index:number, override:Record<string,unknown>={}): MatchValidationRecord => ({
  id:arm+index,
  sessionIdR462:'match-session-'+arm+index,
  cardFingerprint:'fingerprint-edition-1',
  playerName:'Jogador Teste',
  targetPosition:'DMF', formation:'4-2-2-2', teamStyle:'POSSE_DE_BOLA',
  buildName:'Ficha',buildSignature:arm==='A'?'build-1':'build-2',testedBuildId:arm==='A'?'build-1':'build-2',
  playedAt:new Date(Date.UTC(2026,8,1,index,0)).toISOString(),
  minutes:90,overallRating:4,passing:4,movement:4,finishing:3,defending:4,physical:3,stamina:4,
  tags:[],note:'',experimentArm:arm,mode:'ranked',connection:'stable',controlStyle:'quick-pass',
  gameVersion:'6.0.0',gameSeason:'2027',usageFunction:'primeiro-volante',
  observedMetricKeysR468:['interceptions'],metrics:{goals:0,assists:0,passErrors:0,
    tackles:0,interceptions:arm==='A'?1:2,ballLosses:0,dribblesCompleted:0,shots:0},...override
});
const records=[...Array.from({length:5},(_,i)=>record('A',i)),...Array.from({length:5},(_,i)=>record('B',i))];
const original=JSON.stringify(records);
const groups=listMatchEvidenceContextsR568(records);
assert.equal(groups.length,1);
assert.equal(groups[0].armA,5);
assert.equal(groups[0].armB,5);
const noAuto=evaluateMatchEvidenceR568({records,contextKey:null,metric:'interceptions'});
assert.equal(noAuto.status,'CONTEXTO_NAO_SELECIONADO','never automatically choose a winning cohort');
const valid=evaluateMatchEvidenceR568({records,contextKey:groups[0].key,metric:'interceptions'});
assert.equal(valid.status,'DESCRITIVO');
assert.equal(valid.arms[0].observedPer90,1);
assert.equal(valid.arms[1].observedPer90,2);
assert.equal(valid.comparison?.deltaBminusA,1);
assert.equal(valid.winner,null);
assert.equal(valid.canCalibrate,false);
assert.equal(JSON.stringify(records),original,'no mutation');

const omitted=evaluateMatchEvidenceR568({records:records.map(r=>({...r,observedMetricKeysR468:[]})),
  contextKey:groups[0].key,metric:'interceptions'});
assert.equal(omitted.status,'PENDENTE');
assert.equal(omitted.arms[0].samples,0,'zero-value fields without evidence must not be treated as measured');

const oneMissing=evaluateMatchEvidenceR568({records:records.slice(1),contextKey:groups[0].key,metric:'interceptions'});
assert.equal(oneMissing.status,'PENDENTE');
const crossSeason=records.map((r,i)=>i===0?{...r,gameVersion:'7.0.0'}:r);
assert.equal(listMatchEvidenceContextsR568(crossSeason).length,2,'patches never mix');
const mixedBuild=evaluateMatchEvidenceR568({
  records:records.map((r,i)=>i===0?{...r,testedBuildId:'third-build'}:r),
  contextKey:groups[0].key,metric:'interceptions',
});
assert.equal(mixedBuild.status,'PENDENTE','mixed builds in one arm are not causal evidence');
const dupSession=evaluateMatchEvidenceR568({
  records:records.map((r,i)=>i===0?{...r,sessionIdR462:records[1].sessionIdR462}:r),
  contextKey:groups[0].key,metric:'interceptions'
});
assert.equal(dupSession.status,'PENDENTE','duplicate session cannot increase sample size');
const missingVersion=records.map((r,i)=>i===0?{...r,gameVersion:undefined}:r);
assert.equal(listMatchEvidenceContextsR568(missingVersion).reduce((sum,g)=>sum+g.records,0),9);

const ui=readFileSync('src/components/MatchEvidenceLabR568.tsx','utf8');
const panel=readFileSync('src/components/MatchValidationCenter.tsx','utf8');
assert.match(ui,/não declara vencedor/,'UI must explicitly explain that no winner is inferred.');
assert.match(ui,/listMatchEvidenceContextsR568/);
assert.match(panel,/<MatchEvidenceLabR568 records=\{currentRecords\}/);
console.log('R568 GREEN: context isolation, evidence, sample gates, duplicate sessions and no invented winner');
