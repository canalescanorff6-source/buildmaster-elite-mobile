import assert from 'node:assert/strict';
import type { AnalysisResult, AttributeKey, PositionCode } from '../src/modules/analysis';
import { FORMATION_BLUEPRINTS } from '../src/lib/formationRoleEngine';
import { cardIdentityFingerprintR126, playerIdentityKeyFromNameR126 } from '../src/lib/cardIdentityFingerprintR126';
import {
  DEFAULT_MAPPING_PREFERENCES,
  buildFormationResult,
  createMappingCardFingerprint,
  mappingPlayerIdentityKeyR127,
  refreshMappingPlayerIdentityR127,
  type SquadMappingPlayer
} from '../src/modules/squad-mapping/squadMappingEngine';
import { findBestHistoryLinkR127 } from '../src/modules/squad-mapping/squadMappingHistoryLinkR127';

import { buildMainNavigationR127, navigationGroupFor, playerWorkspaceFor, sectionForNavigation } from '../src/lib/appNavigationR127';

const now = '2026-09-04T12:00:00.000Z';
const baseAttributes: Partial<Record<AttributeKey, number>> = {
  offensiveAwareness: 78, ballControl: 83, dribbling: 80, tightPossession: 82, lowPass: 84, loftedPass: 82, finishing: 76, heading: 74,
  defensiveAwareness: 80, defensiveEngagement: 82, tackling: 81, aggression: 79, speed: 82, acceleration: 82, kickingPower: 80, jump: 78,
  physicalContact: 80, balance: 80, stamina: 86
};

function mapped(name: string, id: string, position: PositionCode, patch: Partial<SquadMappingPlayer> = {}): SquadMappingPlayer {
  const seed = `seed-${id}`;
  const draft: SquadMappingPlayer = {
    id, name, cardLabel: `Carta ${id}`, cardFingerprint: seed, playerFingerprint: playerIdentityKeyFromNameR126(name, seed), identityStatus: 'provisional',
    mainPosition: position, positions: [position], trainedPositions: [], playstyle: position === 'CB' ? 'Defensor criativo' : position === 'DMF' ? 'Primeiro volante' : position === 'CF' ? 'Artilheiro' : 'Meia versátil',
    overall: 110, confidence: 96, status: 'pronto', portrait: null, sourceFileName: `${id}.png`, sourceHash: `hash-${id}`, imageRef: null, imageBytes: 0, imageStored: false,
    attributes: { ...baseAttributes }, positionRatings: { [position]: 100 }, skills: ['Passe de primeira', 'Interceptação'], impetos: [], height: 180, weight: 78, age: 27, level: 35,
    physicalModel: {}, profileCoverage: 94, linkedHistoryId: null, locked: false, excluded: false, note: '', createdAt: now, updatedAt: now, ...patch
  };
  return refreshMappingPlayerIdentityR127(draft);
}

function analysis(name: string, cardType: string, style: string, attributes: Partial<Record<AttributeKey, number>>, id: string): AnalysisResult {
  const parsed: any = {
    playerName: name, cardType, specialTag: id, country: 'Brasil', mainPosition: 'CMF', mainPositionPt: 'MLG', positions: ['CMF', 'DMF'], positionsPt: ['MLG', 'VOL'], positionRatings: { CMF: 100, DMF: 92 },
    playstyle: style, offensivePlaystyle: style, defensivePlaystyle: 'Básico', dominantFoot: 'Direito', overall: 110, maxOverall: 110, height: 180, weight: 78, age: 27, level: 35,
    trainingPointsTotal: 64, condition: {}, impetos: [], nativeSkills: style === 'Orquestrador' ? ['Passe de primeira'] : ['Interceptação', 'Bloqueador'], additionalSkills: [], specialSkills: [],
    attributes: { ...baseAttributes, ...attributes }, physicalProfile: {}, manualConfirmed: true, evidence: { attributeCount: 20, positionRatingsCount: 2 }, internalId: `${id}-legacy-110`, confidence: 96, warnings: []
  };
  return {
    parsed,
    bestPosition: { code: 'CMF', label: 'MLG', score: 90 },
    positionScores: [{ code: 'CMF', label: 'MLG', score: 90 }, { code: 'DMF', label: 'VOL', score: 86 }],
    trainingPointsTotal: 64, trainingPointsUsed: 64, trainingPointsRemaining: 0, training: {}, trainingCost: {}, recommendedSkills: [], recommendedImpetos: [], buildName: id,
    tacticalProfile: { formation: '4-2-2-2', style: 'POSSE_DE_BOLA' },
    teamMap: { functionLabel: 'Função teste', matchPlan: ['Teste'], sectorScores: { marcacao: 80, cobertura: 80, saidaDeBola: 80, passe: 80, criacao: 80, aceleracao: 80, finalizacao: 80, jogoAereo: 80, fisico: 80 } }
  } as any;
}

// 1) A mesma pessoa, em duas cartas diferentes, precisa ocupar no máximo uma vaga no time inteiro.
const formation = FORMATION_BLUEPRINTS.find((item) => item.id === '4-2-2-2')!;
const roster = formation.slots.map((slot, index) => mapped(`Atleta ${index + 1}`, `base-${index + 1}`, slot.position));
const duplicateCard = mapped(roster[5].name, 'duplicate-card', roster[5].mainPosition, {
  cardLabel: 'Show Time alternativo',
  attributes: { ...roster[5].attributes, defensiveAwareness: 99, tackling: 99 },
  skills: [...roster[5].skills, 'Bloqueador'],
  profileCoverage: 100
});
assert.equal(mappingPlayerIdentityKeyR127(roster[5]), mappingPlayerIdentityKeyR127(duplicateCard), 'Duas cartas do mesmo atleta precisam compartilhar identidade de jogador.');
assert.notEqual(roster[5].cardFingerprint, duplicateCard.cardFingerprint, 'As duas leituras/cartas continuam distintas no Mapeamento.');
const team = buildFormationResult(formation, [...roster, duplicateCard], DEFAULT_MAPPING_PREFERENCES, {}, new Map());
const activePlayerKeys = [...team.lineup.flatMap((pick) => pick.player ? [mappingPlayerIdentityKeyR127(pick.player)] : []), ...team.bench.map((pick) => mappingPlayerIdentityKeyR127(pick.player))];
assert.equal(new Set(activePlayerKeys).size, activePlayerKeys.length, 'Titulares + banco não podem conter duas versões do mesmo atleta.');

// 2) Overall não participa nem da assinatura provisória do Mapeamento.
const overallA = createMappingCardFingerprint(mapped('Sem GER', 'ger-a', 'CMF', { overall: 92 }));
const overallB = createMappingCardFingerprint(mapped('Sem GER', 'ger-b', 'CMF', { overall: 119 }));
assert.equal(overallA, overallB, 'Overall/GER não pode fragmentar a identidade provisória do Mapeamento.');

// 3) Ao existir mais de uma carta do mesmo nome no Cofre, o vínculo usa evidência e escolhe a versão correta.
const controlCard = analysis('Alex Teste', 'Epic', 'Orquestrador', { lowPass: 94, loftedPass: 92, defensiveAwareness: 70, tackling: 68 }, 'control');
const destroyerCard = analysis('Alex Teste', 'Show Time', 'Meia versátil', { lowPass: 76, loftedPass: 74, defensiveAwareness: 92, tackling: 94 }, 'destroyer');
assert.notEqual(cardIdentityFingerprintR126(controlCard.parsed), cardIdentityFingerprintR126(destroyerCard.parsed));
const link = findBestHistoryLinkR127({
  name: 'Alex Teste', mainPosition: 'CMF', playstyle: 'Meia versátil',
  attributes: { lowPass: 76, loftedPass: 74, defensiveAwareness: 92, tackling: 94 },
  skills: ['Interceptação', 'Bloqueador'], height: 180, level: 35
}, [{ id: 'history-control', result: controlCard }, { id: 'history-destroyer', result: destroyerCard }]);
assert.ok(link, 'Evidência suficiente deve vincular automaticamente ao Cofre.');
assert.equal(link!.historyId, 'history-destroyer', 'Não pode escolher simplesmente a primeira ficha com o mesmo nome.');
assert.equal(link!.cardFingerprint, cardIdentityFingerprintR126(destroyerCard.parsed));

// 4) Evidência fraca/ambígua não cria vínculo automático perigoso.
const ambiguous = findBestHistoryLinkR127({
  name: 'Alex Teste', mainPosition: 'CMF', playstyle: '', attributes: {}, skills: [], height: null, level: null
}, [{ id: 'history-control', result: controlCard }, { id: 'history-destroyer', result: destroyerCard }]);
assert.equal(ambiguous, null, 'Somente o nome não pode vincular uma carta do Mapeamento ao Cofre.');

// 5) A navegação foi extraída do CardVisionApp sem mudar o contrato visual/funcional.
const nav = buildMainNavigationR127({ historyCount: 17, matchCount: 4, hasResult: false });
assert.equal(nav.find((item) => item.id === 'jogadores')?.hint, '17 salvos');
assert.equal(nav.find((item) => item.id === 'partidas')?.hint, '4 análises');
assert.equal(nav.find((item) => item.id === 'resultado')?.disabled, true);
assert.equal(navigationGroupFor('leitor'), 'jogadores');
assert.equal(playerWorkspaceFor('resultado'), 'resultado');
assert.equal(sectionForNavigation('jogadores', 'cofre'), 'cofre');

console.log('r127 aprovada: Mapeamento usa atleta único, banco sem duplicata, GER fora da identidade e vínculo do Cofre por evidência em vez de nome.');
