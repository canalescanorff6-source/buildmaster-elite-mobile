import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import {
  buildAdditionalSkillMatrix,
  buildPersonalGameplayLearning,
  buildPositionCompatibilityMatrix,
  buildProfessionalIntelligenceReport,
  buildScenarioGameplayAnalysis
} from '../src/lib/professionalIntelligenceV37';
import type { MatchValidationRecord } from '../src/lib/appEvolution';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const card = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Neymar Profissional V37
POSIÇÃO PRINCIPAL: SS
ESTILO DE JOGO: Armador criativo
OVERALL: 98
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Passe de primeira, Chute de primeira
Talento ofensivo: 88
Controle de bola: 95
Drible: 97
Condução firme: 96
Passe rasteiro: 87
Passe alto: 80
Finalização: 84
Cabeceio: 61
Curva: 88
Velocidade: 88
Aceleração: 95
Força do chute: 82
Salto: 62
Contato físico: 68
Equilíbrio: 96
Resistência: 82
[FIM AJUSTES]`;

const result = applyCompleteCardIntelligence(analyzeCard(card, 'COMPETITIVE', 'AMF', 'v37-neymar.png', {
  formation: '4-2-2-2',
  style: 'POSSE_DE_BOLA',
  gameplayMode: 'UNIVERSAL',
  connectionProfile: 'VARIABLE',
  controlProfile: 'DRIBBLE'
}));

const matches: MatchValidationRecord[] = [
  {
    id: 'm1', cardFingerprint: 'x', playerName: result.parsed.playerName, targetPosition: 'AMF', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', buildName: result.buildName, buildSignature: 'b', playedAt: '2026-07-30T10:00:00.000Z', minutes: 90,
    overallRating: 4, passing: 4, movement: 5, finishing: 3, defending: 2, physical: 3, stamina: 4, tags: ['Criou boas linhas de passe'], note: '', mode: 'ranked', connection: 'variable', gameplayProfileId: 'DRIBBLER', metrics: { goals: 1, assists: 1, passErrors: 3, tackles: 0, interceptions: 1, ballLosses: 5, dribblesCompleted: 8, shots: 3 }
  },
  {
    id: 'm2', cardFingerprint: 'x', playerName: result.parsed.playerName, targetPosition: 'AMF', formation: '4-3-3', teamStyle: 'CONTRA_ATAQUE_RAPIDO', buildName: result.buildName, buildSignature: 'b', playedAt: '2026-07-31T10:00:00.000Z', minutes: 90,
    overallRating: 4, passing: 4, movement: 4, finishing: 3, defending: 2, physical: 3, stamina: 3, tags: ['Jogador pesado'], note: '', mode: 'ranked', connection: 'high_delay', gameplayProfileId: 'CREATOR', secondHalfDrop: true, metrics: { goals: 0, assists: 2, passErrors: 4, tackles: 0, interceptions: 0, ballLosses: 6, dribblesCompleted: 6, shots: 2 }
  },
  {
    id: 'm3', cardFingerprint: 'x', playerName: result.parsed.playerName, targetPosition: 'AMF', formation: '4-1-2-3', teamStyle: 'POSSE_DE_BOLA', buildName: result.buildName, buildSignature: 'b', playedAt: '2026-08-01T10:00:00.000Z', minutes: 90,
    overallRating: 5, passing: 5, movement: 5, finishing: 4, defending: 2, physical: 3, stamina: 4, tags: ['Criou boas linhas de passe'], note: '', mode: 'events', connection: 'stable', gameplayProfileId: 'DRIBBLER', metrics: { goals: 1, assists: 2, passErrors: 2, tackles: 0, interceptions: 0, ballLosses: 3, dribblesCompleted: 9, shots: 4 }
  }
];

const positions = buildPositionCompatibilityMatrix(result);
assert.equal(positions.entries.length, 13);
assert.equal(positions.selected.position, 'AMF');
assert.equal(positions.natural.position, 'SS');
assert.ok(positions.selected.score >= 70);
assert.ok(positions.entries.find((item) => item.position === 'GK')!.score < 30);

const scenarios = buildScenarioGameplayAnalysis(result);
for (const id of ['MAIN', 'ALTERNATIVE', 'EXPERIMENTAL', 'RANKED', 'DELAY', 'POSSESSION', 'QUICK_COUNTER', 'BALANCED']) {
  assert.ok(scenarios.profiles.some((profile) => profile.id === id), `Perfil ${id} ausente.`);
}
for (const profile of scenarios.profiles) {
  assert.equal(trainingPlanTotalCost(profile.training), result.trainingPointsTotal, `${profile.id} precisa usar o orçamento exato.`);
  assert.ok(profile.recommendedSkills.every((skill) => typeof skill === 'string' && skill.length > 0));
}

const skills = buildAdditionalSkillMatrix(result);
assert.ok(skills.topFive.length <= 5);
assert.ok(skills.reserves.length <= 3);
assert.equal(skills.officialOnly, true);
assert.ok(skills.topFive.every((item) => !result.parsed.nativeSkills.includes(item.name)));

const learning = buildPersonalGameplayLearning(matches);
assert.equal(learning.sampleCount, 3);
assert.match(learning.identity, /Drible|Criação|Finalização|Recuperação/);
assert.ok(Object.keys(learning.learnedWeights).length > 0);

const report = buildProfessionalIntelligenceReport(result, { matches, registry: [] });
assert.equal(report.engineVersion, '37.00.0');
assert.equal(report.evidenceLoop.samples, 3);
assert.ok(report.activeCapabilities.length >= 10);
assert.ok(report.nextActions.length >= 3);

const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const css = fs.readFileSync('src/app/v37-professional-intelligence.css', 'utf8');
const matchPanel = fs.readFileSync('src/components/MatchValidationCenter.tsx', 'utf8');
assert.match(workspace, /Análise Pro/);
assert.match(workspace, /ProfessionalIntelligenceCenter/);
assert.match(layout, /v37-professional-intelligence\.css/);
assert.match(layout, /bm-v3700-professional/);
assert.match(css, /professional-scenario-grid/);
assert.match(css, /professional-skill-columns/);
assert.match(matchPanel, /dribblesCompleted/);
assert.match(matchPanel, /secondHalfDrop/);

console.log('v37.00 Central Profissional aprovada: partidas reais, perfis profundos, posições, habilidades, banco e aprendizado pessoal.');
