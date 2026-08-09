import assert from 'node:assert/strict';
import { FORMATION_BLUEPRINTS, type FormationSlot } from '../src/lib/formationRoleEngine';
import {
  DEFAULT_MAPPING_PREFERENCES,
  buildFormationResult,
  createMappingCardFingerprint,
  mergeMappingPlayer,
  scoreMappingPlayerForSlot,
  type SquadMappingPlayer
} from '../src/modules/squad-mapping/squadMappingEngine';
import type { AttributeKey, PositionCode } from '../src/modules/analysis';

const now = '2026-08-08T00:00:00.000Z';
const completeAttributes: Partial<Record<AttributeKey, number>> = {
  offensiveAwareness: 79,
  ballControl: 84,
  dribbling: 80,
  tightPossession: 84,
  lowPass: 86,
  loftedPass: 81,
  finishing: 76,
  heading: 76,
  placeKicking: 70,
  curl: 75,
  defensiveAwareness: 84,
  defensiveEngagement: 86,
  tackling: 85,
  aggression: 84,
  goalkeeperAwareness: 88,
  goalkeeperCatching: 86,
  goalkeeperParrying: 87,
  goalkeeperReflexes: 89,
  goalkeeperReach: 87,
  speed: 84,
  acceleration: 84,
  kickingPower: 83,
  jump: 84,
  physicalContact: 84,
  balance: 82,
  stamina: 88
};

function player(id: string, mainPosition: PositionCode, patch: Partial<SquadMappingPlayer> = {}): SquadMappingPlayer {
  const draft: SquadMappingPlayer = {
    id,
    name: `Jogador ${id}`,
    cardLabel: `Carta completa ${id}`,
    cardFingerprint: '',
    mainPosition,
    positions: [mainPosition],
    trainedPositions: [],
    playstyle: mainPosition === 'DMF' ? 'Primeiro volante' : mainPosition === 'CB' ? 'Defensor criativo' : 'Orquestrador',
    overall: 99,
    confidence: 96,
    status: 'pronto',
    portrait: null,
    sourceFileName: `${id}.jpg`,
    sourceHash: `hash-${id}`,
    imageRef: `squad-mapping:image:hash-${id}`,
    imageBytes: 145_000,
    imageStored: true,
    attributes: { ...completeAttributes },
    positionRatings: { [mainPosition]: 100 },
    skills: ['Passe de primeira', 'Interceptação', 'Bloqueador', 'Espírito guerreiro'],
    impetos: ['Duelo +3'],
    height: mainPosition === 'CB' ? 188 : 178,
    weight: 78,
    age: 27,
    level: 35,
    physicalModel: { 'Raio de cobertura das pernas': 166.2 },
    profileCoverage: 96,
    linkedHistoryId: null,
    locked: false,
    excluded: false,
    note: '',
    createdAt: now,
    updatedAt: now,
    ...patch
  };
  draft.cardFingerprint = createMappingCardFingerprint(draft);
  return draft;
}

function slot(formationId: string, position: PositionCode): FormationSlot {
  const formation = FORMATION_BLUEPRINTS.find((item) => item.id === formationId);
  assert.ok(formation, `Formação ${formationId} deve existir.`);
  const found = formation.slots.find((item) => item.position === position);
  assert.ok(found, `${formationId} deve possuir ${position}.`);
  return found;
}

const davids = player('davids', 'DMF', {
  name: 'Edgar Davids',
  cardLabel: 'Epic Netherlands • nível 33',
  positions: ['DMF', 'CMF'],
  playstyle: 'O destruidor',
  overall: 88,
  attributes: {
    defensiveAwareness: 77,
    defensiveEngagement: 83,
    tackling: 82,
    aggression: 83,
    speed: 79,
    acceleration: 83,
    physicalContact: 82,
    jump: 78,
    heading: 65,
    lowPass: 80,
    stamina: 83,
    balance: 76
  },
  positionRatings: { DMF: 88, CMF: 88, CB: 88, LB: 89 },
  skills: ['Marcação individual', 'Volta para marcar', 'Interceptação', 'Espírito guerreiro', 'Bloqueador', 'Carrinho', 'Esticada de Perna', 'Sombra veloz'],
  height: 168,
  weight: 69,
  level: 33,
  profileCoverage: 94
});

const cbSlot = slot('4-2-2-2', 'CB');
const davidsAsCb = scoreMappingPlayerForSlot(davids, cbSlot, DEFAULT_MAPPING_PREFERENCES, new Map());
assert.equal(davidsAsCb.adaptationMode, 'intelligent', 'Um VOL destruidor com perfil defensivo completo deve poder ser adaptado inteligentemente a ZAG.');
assert.ok(davidsAsCb.adaptationFit >= 70, 'A adaptação deve ser sustentada por atributos, estilo, físico e habilidades.');
assert.ok(davidsAsCb.reasons.some((reason) => reason.includes('Adaptação inteligente')), 'A escolha deve explicar a adaptação, não escondê-la.');

const davidsHighOverall = { ...davids, overall: 110 };
const scoreHighOverall = scoreMappingPlayerForSlot(davidsHighOverall, cbSlot, DEFAULT_MAPPING_PREFERENCES, new Map());
assert.equal(scoreHighOverall.score, davidsAsCb.score, 'Overall não pode mudar a seleção nem a nota funcional.');
assert.equal(scoreHighOverall.adaptationFit, davidsAsCb.adaptationFit, 'Overall não pode modificar a adaptação.');

const fingerprintA = createMappingCardFingerprint(davids);
const fingerprintB = createMappingCardFingerprint({ ...davids, overall: 110, sourceHash: 'outro-hash' });
const fingerprintC = createMappingCardFingerprint({ ...davids, attributes: { ...davids.attributes, tackling: 84 } });
assert.equal(fingerprintA, fingerprintB, 'Fonte do arquivo e overall não devem fragmentar a mesma carta.');
assert.notEqual(fingerprintA, fingerprintC, 'Mudança real de atributos deve distinguir outra versão/leitura da carta.');

const formation = FORMATION_BLUEPRINTS.find((item) => item.id === '4-2-2-2');
assert.ok(formation);
const naturalPlayers = formation.slots.map((formationSlot, index) => player(`natural-${index}`, formationSlot.position, {
  playstyle: formationSlot.position === 'DMF' ? (index % 2 ? 'Orquestrador' : 'Primeiro volante') : formationSlot.position === 'CB' ? (index % 2 ? 'O destruidor' : 'Defensor criativo') : undefined
}));
const roster = [...naturalPlayers, davids];
const first = buildFormationResult(formation, roster, DEFAULT_MAPPING_PREFERENCES, {}, new Map());
const second = buildFormationResult(formation, roster, DEFAULT_MAPPING_PREFERENCES, {}, new Map());
const firstIds = first.lineup.map((pick) => pick.player?.id ?? 'vazio');
const secondIds = second.lineup.map((pick) => pick.player?.id ?? 'vazio');
assert.deepEqual(firstIds, secondIds, 'O mesmo banco deve gerar a mesma escalação sem sorteio.');
assert.equal(new Set(firstIds.filter((id) => id !== 'vazio')).size, firstIds.filter((id) => id !== 'vazio').length, 'Um jogador não pode ocupar duas posições ao mesmo tempo.');
assert.equal(first.lineup.filter((pick) => pick.player).length, formation.slots.length, 'O motor deve preencher os onze postos quando o elenco oferece cobertura.');

const duplicate = { ...davids, id: 'davids-nova-leitura', sourceFileName: 'davids-2.jpg', imageBytes: 155_000, skills: [...davids.skills, 'Passe em profundidade'] };
const merged = mergeMappingPlayer([davids], duplicate);
assert.equal(merged.action, 'updated');
assert.equal(merged.players.length, 1, 'A mesma carta não deve ser duplicada ao ler outro print.');
assert.ok(merged.player.skills.includes('Passe em profundidade'), 'A nova leitura deve enriquecer o perfil existente.');
assert.equal(merged.player.id, davids.id, 'A identidade persistente da carta deve ser preservada.');

console.log(`v39.50 aprovada: ${FORMATION_BLUEPRINTS.length} formações, adaptação ${davidsAsCb.adaptationMode} ${davidsAsCb.adaptationFit}/100, escalação determinística e banco visual persistente.`);
