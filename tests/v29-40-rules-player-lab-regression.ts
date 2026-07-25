import assert from 'node:assert/strict';
import { analyzeCard } from '@/lib/analyzer';
import { trainingPlanPoints } from '@/lib/precisionBuildEngine';
import {
  ADVANCED_PLAYER_LAB_VERSION,
  buildAdvancedPlayerLaboratory,
  createPlayerLabSnapshot
} from '@/modules/players/advancedPlayerLaboratory';
import {
  EMBEDDED_OFFICIAL_RULE_PACK,
  OFFICIAL_RULE_PACK_VERSION,
  OFFICIAL_RULE_SCHEMA,
  compareOfficialRulePacks,
  officialRuleChecksum,
  reviewOfficialRulePack,
  validateOfficialRulePack
} from '@/modules/rules/officialRuleRegistry';

const result = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Atacante Laboratório
TIPO DA CARTA: Épico
HABILIDADE ESPECIAL: Blitz Curler
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 62
Talento ofensivo: 91
Controle de bola: 86
Drible: 85
Condução firme: 84
Passe rasteiro: 78
Passe alto: 74
Finalização: 92
Cabeçada: 81
Velocidade: 87
Aceleração: 90
Força do chute: 91
Salto: 80
Contato físico: 83
Equilíbrio: 84
Resistência: 85
HABILIDADES: Chute de primeira, Finalização acrobática, Passe de primeira
[FIM AJUSTES]
`, 'COMPETITIVE', 'CF', 'laboratorio-v2940.png', { formation: '4-3-3', style: 'POSSE_DE_BOLA' });

const lab = buildAdvancedPlayerLaboratory(result, { ...result.training, shooting: 16, dribbling: 16 });
assert.equal(ADVANCED_PLAYER_LAB_VERSION, '29.40.0');
assert.ok(lab.playerName.startsWith('Atacante Laboratório'));
assert.equal(lab.profiles.length, 4);
assert.deepEqual(lab.profiles.map((item) => item.id), ['competitive', 'balanced', 'offensive', 'personalized']);
assert.ok(lab.profiles.every((item) => item.pointsUsed <= result.trainingPointsTotal));
assert.ok(lab.profiles.every((item) => trainingPlanPoints(item.training) === item.pointsUsed));
assert.equal(lab.tacticalUse.mainPosition, result.bestPosition.label);
assert.ok(lab.radar.length === 6 && lab.radar.every((axis) => axis.value >= 0 && axis.value <= 100));
assert.ok(lab.tacticalUse.styleFits.length === 3);
assert.ok(lab.safeguards.some((item) => item.includes('posição escolhida')));

const snapshot = createPlayerLabSnapshot({
  result,
  label: 'Ficha ranqueada',
  favorite: true,
  customTraining: lab.profiles[3].training,
  selectedProfiles: ['competitive', 'personalized'],
  rulePackVersion: OFFICIAL_RULE_PACK_VERSION,
  now: '2026-07-25T12:00:00.000Z'
});
assert.equal(snapshot.favorite, true);
assert.equal(snapshot.customPointsUsed, lab.profiles[3].pointsUsed);
assert.deepEqual(snapshot.selectedProfiles, ['competitive', 'personalized']);

assert.equal(OFFICIAL_RULE_SCHEMA, 2);
assert.equal(OFFICIAL_RULE_PACK_VERSION, '2026.07.2');
const embeddedValidation = validateOfficialRulePack(EMBEDDED_OFFICIAL_RULE_PACK);
assert.equal(embeddedValidation.valid, true, embeddedValidation.errors.join(' | '));

const nextBase = {
  ...EMBEDDED_OFFICIAL_RULE_PACK,
  version: '2026.07.3',
  source: 'imported' as const,
  integrity: { algorithm: 'fnv1a-32' as const, trust: 'checksum-only' as const, signature: null },
  changelog: [...EMBEDDED_OFFICIAL_RULE_PACK.changelog, 'Pacote controlado de teste.'],
  checksum: ''
};
const nextPack = { ...nextBase, checksum: officialRuleChecksum(nextBase) };
const review = reviewOfficialRulePack(nextPack, EMBEDDED_OFFICIAL_RULE_PACK);
assert.equal(review.validation.valid, true, review.validation.errors.join(' | '));
assert.equal(review.requiresConfirmation, true);
assert.equal(review.compatible, true);
assert.equal(review.downgrade, false);
assert.equal(review.trust, 'checksum-only');
assert.ok(review.validation.warnings.some((item) => item.includes('não comprova')));

const comparison = compareOfficialRulePacks(EMBEDDED_OFFICIAL_RULE_PACK, nextPack);
assert.equal(comparison.toVersion, '2026.07.3');
assert.deepEqual(comparison.changedCardRules, []);

const downgradeBase = { ...nextPack, version: '2026.06.9', checksum: '' };
const downgrade = { ...downgradeBase, checksum: officialRuleChecksum(downgradeBase) };
const downgradeReview = reviewOfficialRulePack(downgrade, EMBEDDED_OFFICIAL_RULE_PACK);
assert.equal(downgradeReview.validation.valid, false);
assert.ok(downgradeReview.blockers.some((item) => item.includes('rollback')));

const tampered = { ...nextPack, season: 'conteúdo adulterado sem checksum novo' };
assert.equal(validateOfficialRulePack(tampered).valid, false);

console.log('v29.40 reinforced rules + advanced player laboratory: OK');
