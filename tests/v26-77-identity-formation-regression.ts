import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { buildPrecisionBuildReport, compareTrainingPlan, trainingPlanPoints } from '../src/lib/precisionBuildEngine';
import { FORMATION_BLUEPRINTS, FORMATION_ROLE_CATALOG, buildFormationLineup, getFormationBlueprint, scorePlayerForFormationSlot } from '../src/lib/formationRoleEngine';
import { readLegacyCssBundle } from './helpers/readLegacyCssBundle';

const striker = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Centroavante Teste
TIPO DA CARTA: Épico
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
NÍVEL: 30
PONTOS TOTAIS: 62
Talento ofensivo: 90
Finalização: 91
Força do chute: 88
Aceleração: 86
Velocidade: 83
Controle de bola: 82
Contato físico: 79
HABILIDADES: Finalização acrobática, Chute de primeira
[FIM AJUSTES]
`, 'COMPETITIVE', 'CF', null, { formation:'4-2-2-2', style:'CONTRA_ATAQUE_RAPIDO' });

const report = buildPrecisionBuildReport(striker);
assert.equal(report.selectedPosition.code, 'CF');
assert.equal(report.proposals.length, 3);
assert.ok(report.confidence.some((item) => item.key === 'position' && item.score >= 90));
assert.ok(report.strictValidation.some((item) => item.label === 'Posição escolhida preservada' && item.ok));
assert.equal(report.proposals[0].pointsUsed, trainingPlanPoints(report.proposals[0].training));
assert.ok(report.explanation.some((item) => /GER alto|GER/.test(item)));

const comparison = compareTrainingPlan(striker, striker.training);
assert.equal(comparison.pointsUsed, striker.trainingPointsUsed);
assert.ok(comparison.score >= 1 && comparison.score <= 99);

assert.ok(FORMATION_BLUEPRINTS.length >= 15, 'Catálogo precisa incluir formações do app e extras.');
const fourTwoTwoTwo = getFormationBlueprint('4-2-2-2');
assert.equal(fourTwoTwoTwo.slots.length, 11);
assert.ok(fourTwoTwoTwo.slots.some((slot) => slot.label === 'CA E' && slot.primaryRoles.includes('artilheiro') && slot.complementaryRoles.includes('atacante-pivo')));
assert.equal(FORMATION_ROLE_CATALOG['artilheiro'].officialName, 'Artilheiro');
assert.equal(FORMATION_ROLE_CATALOG['primeiro-volante'].officialName, '1º Volante');

const strikerSlot = fourTwoTwoTwo.slots.find((slot) => slot.id === 'cf2');
assert.ok(strikerSlot);
const fit = scorePlayerForFormationSlot(striker, strikerSlot!);
assert.ok(fit.positionFit >= 90);
assert.ok(fit.score >= 60);

const lineup = buildFormationLineup([striker], fourTwoTwoTwo);
assert.equal(lineup.length, 11);
assert.ok(lineup.some((item) => item.player?.parsed.playerName.startsWith('Centroavante Teste')));

const app = fs.readFileSync('src/components/CardVisionApp.tsx','utf8');
const css = [readLegacyCssBundle(), fs.readFileSync('src/app/globals.css', 'utf8'), fs.readFileSync('src/app/design-system-v2710.css', 'utf8')].join('\n');
assert.match(app, /PrecisionBuildPanel/);
assert.match(app, /FormationRoleLabPanel/);
assert.match(app, /teamCenterView === 'formacoes'/);
assert.match(css, /v26\.77 — Motor de ficha por identidade real/);
assert.match(css, /v26\.77 — Laboratório de formações e funções/);

console.log('✓ v26.77: identidade real, três fichas, comparação, feedback e laboratório de formações aprovados.');
