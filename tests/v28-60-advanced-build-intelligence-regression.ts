import assert from 'node:assert/strict';
import { analyzeCard, type PositionCode } from '../src/lib/analyzer';
import { cardFingerprint, type MatchValidationRecord } from '../src/lib/appEvolution';
import type { CreatorBuildSource } from '../src/lib/creatorBuildResearch';
import type { MatchFeedback } from '../src/lib/realMatchCalibration';
import { trainingPlanPoints } from '../src/lib/precisionBuildEngine';
import {
  ADVANCED_BUILD_INTELLIGENCE_VERSION,
  buildAdvancedBuildIntelligence
} from '../src/modules/builds/advancedBuildIntelligence';

const result = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Atacante Inteligente Bloco 7
TIPO DA CARTA: Epic
HABILIDADE ESPECIAL: Phenomenal Finishing
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 62
Talento ofensivo: 91
Controle de bola: 86
Drible: 84
Condução firme: 83
Passe rasteiro: 77
Passe alto: 72
Finalização: 92
Cabeçada: 82
Velocidade: 86
Aceleração: 89
Força do chute: 90
Salto: 81
Contato físico: 84
Equilíbrio: 82
Resistência: 85
HABILIDADES: Finalização acrobática, Chute de primeira, Cabeçada
[FIM AJUSTES]
`, 'COMPETITIVE', 'CF', 'bloco7-card.png', {
  formation: '4-3-3',
  style: 'POSSE_DE_BOLA'
});

const creatorBase: CreatorBuildSource = {
  id: 'creator-b7-1',
  platform: 'YOUTUBE',
  authority: 'PRO_PLAYER',
  device: 'MOBILE',
  url: 'https://www.youtube.com/watch?v=bloco7test1',
  title: 'Ficha competitiva testada',
  channel: 'Pro Mobile Test',
  country: 'Brasil',
  publishedAt: '2026-07-20',
  reviewedAt: '2026-07-24',
  testedInMatches: true,
  targetPosition: result.bestPosition.code,
  playstyle: result.parsed.playstyle ?? '',
  card: {
    playerName: result.parsed.playerName,
    cardType: result.parsed.cardType,
    specialTag: result.parsed.specialTag ?? '',
    mainPosition: result.parsed.mainPosition,
    maxOverall: result.parsed.maxOverall,
    trainingPointsTotal: result.trainingPointsTotal
  },
  training: { ...result.training },
  notes: 'Fonte exata usada apenas no teste de consenso.'
};

const creatorSources: CreatorBuildSource[] = [
  creatorBase,
  {
    ...creatorBase,
    id: 'creator-b7-2',
    authority: 'TOP_RANK',
    platform: 'TIKTOK',
    url: 'https://www.tiktok.com/@buildmaster/video/2860002',
    training: { ...result.training, shooting: Math.min(16, result.training.shooting + 1) }
  },
  {
    ...creatorBase,
    id: 'creator-b7-3',
    authority: 'CRIADOR',
    url: 'https://www.youtube.com/watch?v=bloco7test3',
    training: { ...result.training, dexterity: Math.min(16, result.training.dexterity + 1) }
  }
];

const fingerprint = cardFingerprint(result);
const matches: MatchValidationRecord[] = [1, 2, 3, 4].map((index) => ({
  id: `match-b7-${index}`,
  cardFingerprint: fingerprint,
  playerName: result.parsed.playerName,
  targetPosition: result.bestPosition.code,
  formation: '4-3-3',
  teamStyle: 'POSSE_DE_BOLA',
  buildName: result.buildName,
  buildSignature: `build-b7-${index}`,
  playedAt: `2026-07-${20 + index}T20:00:00.000Z`,
  minutes: 90,
  overallRating: index === 4 ? 4 : 3,
  passing: 3,
  movement: 4,
  finishing: index === 1 ? 2 : 3,
  defending: 3,
  physical: 4,
  stamina: 4,
  tags: index <= 3 ? ['Errou finalizações', 'Passe lento'] : ['Criou boas linhas de passe'],
  note: 'Registro controlado do teste do Bloco 7.'
}));

const feedbacks: MatchFeedback[] = [
  { finishedPoorly: true, missedPasses: true, rating: 3 },
  { finishedPoorly: true, missedPasses: true, rating: 3 },
  { finishedPoorly: true, rating: 4 },
  { workedWell: true, rating: 4 }
];

const initial = buildAdvancedBuildIntelligence(result, {
  creatorSources,
  matchRecords: matches,
  calibrationFeedbacks: feedbacks
});

assert.equal(ADVANCED_BUILD_INTELLIGENCE_VERSION, '28.60.0');
assert.equal(initial.version, '28.60.0');
assert.equal(initial.selectedPosition.code, 'CF');
assert.equal(initial.selectedPosition.preserved, true);
assert.deepEqual(initial.profileComparison.map((profile) => profile.id), ['competitive', 'offensive', 'balanced']);
assert.equal(initial.profileComparison.length, 3);
for (const profile of initial.profileComparison) {
  assert.equal(trainingPlanPoints(profile.training), result.trainingPointsTotal, `${profile.id} precisa usar o orçamento exato.`);
  assert.ok(profile.why.length > 10);
}

assert.equal(initial.tacticalRoles.length, 3);
for (const role of initial.tacticalRoles) {
  assert.equal(role.exactBudget, true, `${role.label} precisa fechar o orçamento.`);
  assert.equal(role.pointsUsed, result.trainingPointsTotal);
  assert.ok(role.gains.length > 0);
  assert.ok(role.tradeOffs.length > 0);
}

const alternateRole = initial.tacticalRoles.find((role) => role.id !== initial.selectedRole.id);
assert.ok(alternateRole);
const changedRole = buildAdvancedBuildIntelligence(result, {
  selectedRoleId: alternateRole!.id,
  creatorSources,
  matchRecords: matches,
  calibrationFeedbacks: feedbacks
});
assert.equal(changedRole.selectedRole.id, alternateRole!.id);
assert.equal(changedRole.selectedRole.recommended, true);

assert.ok(initial.pointJustifications.length >= 4);
assert.ok(initial.pointJustifications.every((item) => item.reason.length > 15 && item.stopRule.length > 15));
assert.ok(initial.pointJustifications.every((item) => item.totalCost > 0));
assert.ok(initial.creatorConsensus.sourceCount >= 2);
assert.ok(initial.creatorConsensus.exactCardCount >= 2);
assert.ok(initial.creatorConsensus.confidence > 0);
assert.ok(initial.creatorConsensus.differences.length > 0);
assert.equal(initial.matchLearning.sampleCount, 4);
assert.equal(initial.matchLearning.confidence, 'média');
assert.ok(initial.matchLearning.repeatedProblems.some((item) => item.tag === 'Errou finalizações'));
assert.ok(initial.matchLearning.learnedPriorities.some((item) => item.training === 'shooting'));
assert.ok(initial.identity.fingerprint.length > 8);
assert.ok(initial.identity.uniquenessScore >= 1 && initial.identity.uniquenessScore <= 100);
assert.ok(initial.skillActivation.length > 0);
assert.ok(initial.safeguards.some((item) => item.includes('posição escolhida')));
assert.ok(initial.safeguards.some((item) => item.includes('não sobrescrevem')));


const stressPositions: PositionCode[] = ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'LWF', 'RWF', 'SS', 'CF'];
for (const position of stressPositions) {
  const stressResult = analyzeCard(`
CONFIRMAÇÃO MANUAL: SIM
NOME: Teste de orçamento ${position}
POSIÇÃO PRINCIPAL: ${position}
ESTILO DE JOGO: ${position === 'GK' ? 'Goleiro defensivo' : 'Meia versátil'}
PONTOS TOTAIS: 60
Talento ofensivo: 80
Controle de bola: 82
Drible: 80
Condução firme: 81
Passe rasteiro: 84
Passe alto: 82
Finalização: 78
Cabeçada: 80
Talento defensivo: 82
Dedicação defensiva: 82
Desarme: 82
Velocidade: 82
Aceleração: 82
Força do chute: 82
Salto: 82
Contato físico: 82
Equilíbrio: 82
Resistência: 84
Consciência de goleiro: 88
Defesa do goleiro: 88
Alcance do goleiro: 88
Reflexos do goleiro: 88
Cobertura do goleiro: 88
`, position === 'GK' ? 'GOALKEEPER' : 'COMPETITIVE', position);
  const stressReport = buildAdvancedBuildIntelligence(stressResult);
  assert.ok(stressReport.tacticalRoles.every((role) => role.exactBudget), `${position}: todas as funções precisam fechar o orçamento.`);
  assert.ok(stressReport.profileComparison.every((profile) => trainingPlanPoints(profile.training) === stressResult.trainingPointsTotal), `${position}: os três perfis precisam fechar o orçamento.`);
}

console.log('v28.60 advanced build intelligence regression: ok');
