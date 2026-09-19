import assert from 'node:assert/strict';
import {
  buildMasterRosterRawTextR436,
  inferTrainingPointsFromLevelR436,
  masterRosterCardReadinessR436,
  masterRosterSearchTextR436,
  shouldMergeMasterRosterCardsR436,
  type MasterRosterPlayerR436
} from '../src/modules/squad-mapping/masterRosterCatalogR436';

const attrs = {
  offensiveAwareness: 92, ballControl: 88, dribbling: 85, tightPossession: 86,
  lowPass: 80, loftedPass: 75, finishing: 94, heading: 86, placeKicking: 78, curl: 82,
  defensiveAwareness: 44, defensiveEngagement: 52, tackling: 45, aggression: 65,
  goalkeeperAwareness: 40, goalkeeperCatching: 40, goalkeeperParrying: 40, goalkeeperReflexes: 40, goalkeeperReach: 40,
  speed: 90, acceleration: 88, kickingPower: 91, jump: 84, physicalContact: 86, balance: 80, stamina: 82
};

const card: MasterRosterPlayerR436 = {
  id: 'cr7-a',
  name: 'Cristiano Ronaldo',
  cardLabel: 'Show Time • 23 Jun 2026',
  cardFingerprint: 'card-r126-cr7-showtime',
  mainPosition: 'CF',
  positions: ['CF', 'SS'],
  playstyle: 'Artilheiro',
  offensivePlaystyle: 'Artilheiro',
  defensivePlaystyle: null,
  overall: 107,
  level: 32,
  trainingPointsTotal: null,
  attributes: attrs,
  skills: ['Chute de primeira', 'Cabeçada'],
  impetos: ['Finalização +3'],
  profileCoverage: 96
};

assert.equal(inferTrainingPointsFromLevelR436(32), 62, 'Nível 32 deve gerar 62 PP automaticamente.');
assert.equal(inferTrainingPointsFromLevelR436(1), null, 'Nível sem PP válido não pode inventar orçamento.');

const ready = masterRosterCardReadinessR436(card);
assert.equal(ready.status, 'complete');
assert.equal(ready.canGenerate, true);
assert.equal(ready.trainingPointsTotal, 62);
assert.equal(ready.attributeCount, 26);

const identityOnly = masterRosterCardReadinessR436({ ...card, id: 'cr7-b', cardLabel: 'Epic', level: null, trainingPointsTotal: null, attributes: {}, skills: [], profileCoverage: 0 });
assert.equal(identityOnly.status, 'identity-only');
assert.equal(identityOnly.canGenerate, false);
assert.ok(identityOnly.missing.includes('atributos completos'));
const partial = masterRosterCardReadinessR436({ ...card, id: 'cr7-b2', cardLabel: 'Epic parcial', attributes: {}, skills: [], profileCoverage: 30 });
assert.equal(partial.status, 'partial');
assert.throws(() => buildMasterRosterRawTextR436({ ...card, attributes: {} }), /dados completos/i, 'Carta incompleta não pode gerar ficha silenciosamente.');

const text = buildMasterRosterRawTextR436(card);
for (const fragment of [
  'CONFIRMAÇÃO MANUAL: SIM',
  'NOME DO JOGADOR: Cristiano Ronaldo',
  'POSIÇÃO PRINCIPAL: CF',
  'ESTILO DE JOGO OFENSIVO: Artilheiro',
  'NÍVEL MÁXIMO: 32',
  'PONTOS TOTAIS: 62',
  'HABILIDADES JÁ POSSUI: Chute de primeira, Cabeçada',
  'ÍMPETOS: Finalização +3',
  'Talento ofensivo: 92',
  'Resistência: 82'
]) assert.ok(text.includes(fragment), `Texto mestre precisa conter: ${fragment}`);

const search = masterRosterSearchTextR436(card);
assert.match(search, /cristiano ronaldo/);
assert.match(search, /show time/);
assert.match(search, /artilheiro/);
assert.match(search, /card r126 cr7 showtime/);


assert.equal(shouldMergeMasterRosterCardsR436(
  { ...card, id: 'cover-a', cardFingerprint: 'map-evidence-same', sourceHash: 'hash-a', identityStatus: 'provisional', attributes: {}, skills: [], profileCoverage: 30 },
  { ...card, id: 'cover-b', cardFingerprint: 'map-evidence-same', sourceHash: 'hash-b', identityStatus: 'provisional', attributes: {}, skills: [], profileCoverage: 30 }
), false, 'Duas capas parciais diferentes do mesmo jogador não podem ser fundidas só por fingerprint provisório.');
assert.equal(shouldMergeMasterRosterCardsR436(
  { ...card, sourceHash: 'same-hash', identityStatus: 'provisional' },
  { ...card, sourceHash: 'same-hash', identityStatus: 'provisional' }
), true, 'O mesmo arquivo reimportado deve atualizar a carta existente.');
assert.equal(shouldMergeMasterRosterCardsR436(
  { ...card, cardFingerprint: 'card-r126-same', identityStatus: 'canonical' },
  { ...card, cardFingerprint: 'card-r126-same', identityStatus: 'canonical' }
), true, 'Identidade canônica igual deve continuar mesclando leituras da mesma carta.');

const sameNameOtherCard = masterRosterSearchTextR436({ ...card, id: 'cr7-c', cardLabel: 'Epic Portugal', cardFingerprint: 'card-r126-cr7-epic' });
assert.notEqual(search, sameNameOtherCard, 'Duas cartas do mesmo jogador precisam continuar distinguíveis por versão/fingerprint.');

console.log('R436 runtime aprovado: banco mestre distingue versões, deriva PP e só gera ficha com dados completos.');
