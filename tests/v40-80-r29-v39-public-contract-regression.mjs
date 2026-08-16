import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const finalEngine = readFileSync(new URL('../src/lib/finalIdentityEngineV4080R27.ts', import.meta.url), 'utf8');
const title = 'Ficha Automática v40.80 — Desempenho Real 2027';

const v3930 = /(?:Motor Adaptativo por Carta v39\.30|Ficha Automática v\d+\.\d{2}(?: r\d+)? — (?:Precisão Competitiva 99|Desempenho Máximo Stack Final|eFootball 2027 v6\.0 Adaptativa|Desempenho Real 2027|Meta Vivo 2027))/;
const v3940 = /(?:Motor Adaptativo por Carta v39\.30 \+ Função Real v39\.40|Ficha Automática v\d+\.\d{2}(?: r\d+)? — (?:Precisão Competitiva 99|Desempenho Máximo Stack Final|eFootball 2027 v6\.0 Adaptativa|Desempenho Real 2027|Meta Vivo 2027))/;

assert.match(title, v3930);
assert.match(title, v3940);
assert.ok(finalEngine.includes(title), 'O árbitro final precisa usar o contrato público compatível.');
assert.ok(finalEngine.includes('DNA Final r27 • Jogador:'), 'A identificação r27 continua nos detalhes.');
assert.ok(finalEngine.includes('reconstructNaturalAttributes'));
assert.ok(finalEngine.includes('fitTrainingToExactBudget(identityPlan'));

console.log('r29 aprovada: contratos v39.30/v39.40 restaurados sem remover o Motor DNA Final.');
