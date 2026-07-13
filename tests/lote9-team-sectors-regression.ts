import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { buildSquadChemistryReport } from '../src/lib/squadChemistry';

const positions = ['GK','CB','CB','LB','RB','DMF','CMF','AMF','LWF','RWF','CF'] as const;
const results = positions.map((position,index)=>analyzeCard(
  `Jogador ${index+1}\nPosição ${position}\nNível 30\nPontos de progressão 58`,
  'COMPETITIVE',
  position,
  `jogador-${index+1}.png`,
  { formation: '4-2-1-3', style: 'POSSE_DE_BOLA' }
));
const report=buildSquadChemistryReport(results,'4-2-1-3','POSSE_DE_BOLA');
assert.ok(report);
assert.equal(report!.corridors.length,3);
assert.equal(report!.lines.length,3);
assert.ok(report!.dependencies.length>=2);
assert.ok(report!.possessionBalance.withBall>=0 && report!.possessionBalance.withBall<=100);
assert.ok(report!.possessionBalance.withoutBall>=0 && report!.possessionBalance.withoutBall<=100);
assert.ok(report!.corridors.every(c=>c.risk>=0&&c.risk<=100));
console.log('Lote 9 aprovado: dependências, corredores, linhas e equilíbrio com/sem bola.');
