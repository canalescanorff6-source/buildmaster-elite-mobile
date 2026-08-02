import assert from 'node:assert/strict';
import {
  PREMIUM_CLEAN_RESULT_VERSION,
  buildPremiumCleanCardSvg,
  buildPremiumCleanResultModel,
  buildPremiumCleanShareText
} from '../src/lib/premiumCleanResultV3810';

const result = {
  parsed: {
    playerName: 'Jogador Premium',
    mainPosition: 'CMF',
    mainPositionPt: 'MLG',
    playstyle: 'Meia versátil'
  },
  bestPosition: { code: 'CMF', label: 'MLG', score: 94 },
  buildName: 'Ficha equilíbrio competitivo',
  training: {
    shooting: 2,
    passing: 8,
    dribbling: 6,
    dexterity: 8,
    lowerBodyStrength: 8,
    aerialStrength: 4,
    defending: 6,
    gk1: 0,
    gk2: 0,
    gk3: 0
  },
  trainingCost: {
    shooting: 2,
    passing: 12,
    dribbling: 8,
    dexterity: 12,
    lowerBodyStrength: 12,
    aerialStrength: 4,
    defending: 12,
    gk1: 0,
    gk2: 0,
    gk3: 0
  },
  trainingPointsUsed: 62,
  trainingPointsTotal: 62,
  recommendedSkills: ['Passe de primeira', 'Passe em profundidade', 'Interceptação', 'Bloqueador', 'Marcação individual'],
  recommendedImpetos: [
    { name: 'Agilidade', tier: 'ideal', reason: 'Melhora o perfil de movimentação.', attributes: [], score: 95 },
    { name: 'Passe', tier: 'alternativa', reason: 'Aumenta a criação.', attributes: [], score: 88 }
  ],
  advancedMotorV3750: { winner: { boosterName: 'Agilidade' } },
  usageTips: ['Use como meia central para tabelas curtas e recomposição.'],
  validation: { canGenerate: true }
};

assert.equal(PREMIUM_CLEAN_RESULT_VERSION, '38.10.0');

const model = buildPremiumCleanResultModel(result);
assert.equal(model.playerName, 'Jogador Premium');
assert.equal(model.position, 'MLG');
assert.equal(model.training.length, 7);
assert.equal(model.skills.length, 5);
assert.equal(model.boosterName, 'Agilidade');
assert.equal(model.statusLabel, 'Ficha validada');

const portrait = buildPremiumCleanCardSvg(result, { format: 'portrait' });
assert.match(portrait, /width="1080" height="1350"/);
assert.match(portrait, /5 HABILIDADES/);
assert.match(portrait, /BOOSTER/);
assert.match(portrait, /Agilidade/);
assert.doesNotMatch(portrait, /auditoria|confiança por campo|motor v37/i);

const square = buildPremiumCleanCardSvg(result, { format: 'square', playerImage: 'data:image/png;base64,AA==' });
assert.match(square, /width="1080" height="1080"/);
assert.match(square, /data:image\/png;base64,AA==/);

const share = buildPremiumCleanShareText(result);
assert.match(share, /Jogador Premium — MLG/);
assert.match(share, /Booster: Agilidade/);
assert.equal(share.split('\n').length, 6);

console.log('v38.10 Resultado Premium Clean aprovado: ficha única, cinco habilidades, Booster e exportação vertical/quadrada.');
