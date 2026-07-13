import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { buildSquadRotationReport } from '../src/lib/squadRotation';

const positions=['GK','CB','CB','LB','RB','DMF','CMF','AMF','LWF','RWF','CF','GK','CB','LB','RB','DMF','CMF','AMF','SS','CF'] as const;
const results=positions.map((position,index)=>{
  const r=analyzeCard(`Jogador ${index+1}\nPosição ${position}\nNível 30\nPontos de progressão 58\nCONFIRMACAO MANUAL: SIM`,'COMPETITIVE',position,`j${index+1}.png`,{formation:'4-2-1-3',style:'POSSE_DE_BOLA'});
  r.parsed.playerName=`Jogador ${index+1}`;
  r.parsed.internalId=`jogador-${index+1}`;
  return r;
});
const report=buildSquadRotationReport(results,'4-2-1-3','POSSE_DE_BOLA','EMPATANDO','MEDIA');
assert.ok(report);
assert.equal(report!.positionCoverage.length,13);
assert.equal(report!.reserveByStarter.length,11);
assert.equal(report!.plans.length,3);
assert.deepEqual(report!.plans.map(p=>p.id),['A','B','C']);
assert.ok(report!.benchBalance.dimensions.length>=7);
assert.ok(report!.positionCoverage.every(p=>p.score>=0&&p.score<=100));
assert.ok(report!.reserveByStarter.every(p=>p.fit>=0&&p.fit<=100));
assert.ok(report!.plans.every(p=>p.score>=0&&p.score<=100));
console.log('Lote 10 aprovado: cobertura por posição, reserva por titular, banco equilibrado e Planos A/B/C.');
