import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { buildReliabilityCenter, compareBuildVariants, comparePlayers, detectInconsistencies } from '../src/lib/confidenceComparison';

const base = `
NOME DO JOGADOR: Jogador Teste
POSIÇÃO PRINCIPAL: VOL
ESTILO DE JOGO: O destruidor
NÍVEL: 31
PONTOS DE PROGRESSO: 60
CONFIRMAÇÃO MANUAL: SIM
Talento defensivo 82
Dedicação defensiva 84
Desarme 85
Agressividade 86
Velocidade 78
Aceleração 75
Contato físico 83
Resistência 88
Passe rasteiro 74
Passe alto 72
`;
const a = analyzeCard(base, 'COMPETITIVE', 'CB', null, { formation:'4-2-3-1', style:'CONTRA_ATAQUE_RAPIDO' });
const b = analyzeCard(base.replace('Jogador Teste','Jogador Dois').replace('Velocidade 78','Velocidade 84'), 'COMPETITIVE', 'CB', null, { formation:'4-2-3-1', style:'CONTRA_ATAQUE_RAPIDO' });
const reliability = buildReliabilityCenter(a);
assert.ok(reliability.score >= 0 && reliability.score <= 100);
assert.ok(reliability.items.some((x) => /posição escolhida/i.test(x.field)));
const inconsistencies = detectInconsistencies(a);
assert.equal(inconsistencies.canGenerate, true);
const builds = compareBuildVariants(a);
assert.ok(builds.rows.length >= 5);
assert.ok(builds.winner.length > 0);
const players = comparePlayers([{id:'a',result:a},{id:'b',result:b}], 'CB');
assert.equal(players.ranking.length, 2);
assert.equal(players.targetPosition, 'CB');
assert.ok(players.ranking[0].score >= players.ranking[1].score);
console.log('Lote 6 aprovado:', reliability.score, inconsistencies.status, builds.winner, players.winner);
