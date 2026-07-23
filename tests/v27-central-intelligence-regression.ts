import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { createMatchValidationRecord } from '../src/lib/appEvolution';
import {
  CENTRAL_SCHEMA_VERSION,
  answerCentralAssistant,
  buildCentralDashboard,
  buildIntegratedPlayers,
  buildMatchScenarioPlans,
  buildTeamDiagnosis,
  createCentralMigrationReport
} from '../src/modules/core/centralIntelligence';
import { CENTRAL_INDEX_STORAGE_KEY, buildCentralEntityIndex } from '../src/modules/core/centralRepository';
import { BUILDMASTER_V27_MODULES } from '../src/modules/core/moduleRegistry';
import { readLegacyCssBundle } from './helpers/readLegacyCssBundle';

const striker = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Atacante Central V27
TIPO DA CARTA: Épico
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
NÍVEL: 30
PONTOS TOTAIS: 62
Talento ofensivo: 90
Finalização: 91
Força do chute: 88
Aceleração: 86
Velocidade: 84
Controle de bola: 82
Contato físico: 78
HABILIDADES: Chute de primeira, Finalização acrobática
[FIM AJUSTES]
`, 'COMPETITIVE', 'CF', null, { formation: '4-2-2-2', style: 'CONTRA_ATAQUE_RAPIDO' });

const midfielder = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Volante Central V27
TIPO DA CARTA: Épico
POSIÇÃO PRINCIPAL: DMF
ESTILO DE JOGO: Primeiro volante
NÍVEL: 30
PONTOS TOTAIS: 62
Passe rasteiro: 82
Passe alto: 79
Controle de bola: 78
Talento defensivo: 90
Dedicação defensiva: 89
Desarme: 88
Agressividade: 86
Contato físico: 85
Resistência: 88
HABILIDADES: Interceptação, Bloqueador, Marcação individual
[FIM AJUSTES]
`, 'COMPETITIVE', 'DMF', null, { formation: '4-2-2-2', style: 'CONTRA_ATAQUE_RAPIDO' });

const match = createMatchValidationRecord(midfielder, {
  minutes: 90,
  overallRating: 4,
  passing: 4,
  movement: 3,
  finishing: 2,
  defending: 5,
  physical: 4,
  stamina: 4,
  tags: ['Marcou bem'],
  note: 'Teste integrado v27'
});

const players = buildIntegratedPlayers([
  { id: 'striker', updatedAt: new Date().toISOString(), favorite: true, status: 'completo', result: striker },
  { id: 'midfielder', updatedAt: new Date().toISOString(), status: 'completo', result: midfielder }
], [match]);
assert.equal(players.length, 2);
assert.equal(players.find((player) => player.id === 'midfielder')?.matchCount, 1);
assert.ok(players.every((player) => player.bestFormations.length >= 1));
assert.ok(players.every((player) => player.efficiency >= 0 && player.efficiency <= 100));

const team = buildTeamDiagnosis(players, '4-2-2-2', 'CONTRA_ATAQUE_RAPIDO');
assert.equal(team.formation, '4-2-2-2');
assert.equal(team.totalSlots, 11);
assert.equal(team.lineup.length, 11);
assert.ok(team.globalScore >= 0 && team.globalScore <= 100);
assert.ok(team.recommendations.length >= 1);
assert.ok(Array.isArray(team.benchSuggestions));
assert.equal(team.pairingNotes.length, 3);

const dashboard = buildCentralDashboard(players, [match], team);
assert.equal(dashboard.players, 2);
assert.equal(dashboard.matchRecords, 1);
assert.ok(dashboard.recommendations.length >= 1);
assert.equal(dashboard.latestPlayer?.id, 'striker');

const plans = buildMatchScenarioPlans(team);
assert.deepEqual(plans.map((plan) => plan.id), ['protect', 'control', 'chase']);
assert.ok(plans.every((plan) => plan.substitutions.length >= 3));

const assistant = answerCentralAssistant('Quem é meu melhor VOL?', players, team);
assert.match(assistant, /Volante Central V/);
const formationAnswer = answerCentralAssistant('Como está minha formação?', players, team);
assert.match(formationAnswer, /4-2-2-2/);
const buildAnswer = answerCentralAssistant('Qual ficha combina melhor com a 4-2-2-2?', players, team);
assert.match(buildAnswer, /4-2-2-2/);
const offensiveAnswer = answerCentralAssistant('Meu time está muito ofensivo?', players, team);
assert.match(offensiveAnswer, /prontidão|desequilíbrio/i);
const secondHalfAnswer = answerCentralAssistant('Quem entra no segundo tempo?', players, team);
assert.ok(secondHalfAnswer.length > 20);

const centralIndex = buildCentralEntityIndex(players, team, [match]);
assert.equal(centralIndex.schemaVersion, 27);
assert.equal(centralIndex.players.length, 2);
assert.equal(centralIndex.matches.length, 1);
assert.ok(CENTRAL_INDEX_STORAGE_KEY.includes('central_entity_index'));
assert.equal(BUILDMASTER_V27_MODULES.length, 13);
assert.ok(BUILDMASTER_V27_MODULES.filter((module) => module.lazy).length >= 10);

const migration = createCentralMigrationReport(['history', 'matches']);
assert.equal(migration.schemaVersion, CENTRAL_SCHEMA_VERSION);
assert.match(migration.note, /não destrutiva/i);

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const css = [readLegacyCssBundle(), fs.readFileSync('src/app/globals.css', 'utf8'), fs.readFileSync('src/app/design-system-v2710.css', 'utf8')].join('\n');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string };
assert.equal(pkg.version, '27.38.0');
assert.match(app, /IntegratedHomePanel/);
assert.match(app, /PlayerLaboratory/);
assert.match(app, /dynamic\(\(\) => import\('@\/modules\/players\/PlayerLaboratory'\)/);
assert.match(app, /IntegratedTeamLab/);
assert.match(app, /MatchLaboratory/);
assert.match(app, /BuildMasterAssistant/);
assert.match(app, /CENTRAL_MIGRATION_STORAGE_KEY/);
assert.match(app, /CENTRAL_INDEX_STORAGE_KEY/);
assert.match(css, /v27\.00 — Central Inteligente Integrada/);
assert.match(css, /v27-assistant-panel/);
assert.match(css, /v27-quick-action-grid/);
assert.match(css, /v27-team-support-grid/);

console.log('✓ v27.29: central integrada, jogadores, time, partidas, assistente e migração não destrutiva aprovados.');
