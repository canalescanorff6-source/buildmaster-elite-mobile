import assert from 'node:assert/strict';
import { analyzeCard, normalizeObjective } from '../src/lib/analyzer';

assert.equal(normalizeObjective('balanced'), 'COMPETITIVE');
assert.equal(normalizeObjective('POSSE_DE_BOLA'), 'POSSESSION');
assert.equal(normalizeObjective('contra-ataque-rápido'), 'QUICK_COUNTER');
assert.equal(normalizeObjective('valor-antigo-desconhecido'), 'COMPETITIVE');

const text = `NOME DO JOGADOR: Teste legado\nPOSIÇÃO PRINCIPAL: CF\nPONTOS TOTAIS: 60\nFinalização: 80\nVelocidade: 80\nAceleração: 80`;
const result = analyzeCard(text, 'balanced' as any, 'CF', 'legacy', { formation: 'AUTO', style: 'AUTO' });
assert.equal(result.bestPosition.code, 'CF');
assert.ok(result.trainingPointsUsed <= result.trainingPointsTotal);
console.log('runtime ficha legacy regression: ok');
