import assert from 'node:assert/strict';
import type { ParsedCard } from '../src/lib/analyzerDomain';
import { optimizeFinalAdditionalSkillSetR457 } from '../src/lib/finalAdditionalSkillSetR457';

const parsed = {
  playerName: 'R506 Test',
  mainPosition: 'AMF',
  confidence: 96,
  attributes: {
    lowPass: 82,
    ballControl: 82,
    tightPossession: 82,
    offensiveAwareness: 80,
    dribbling: 82,
    balance: 80,
  },
  nativeSkills: [],
  additionalSkills: [],
  specialSkills: [],
} as unknown as ParsedCard;

const common = {
  label: 'ação de teste',
  frequency: 90,
  contribution: 70,
};

const passReady = optimizeFinalAdditionalSkillSetR457(parsed, [
  { id: 'short_creation', ...common, projectedScore: 95 },
  { id: 'close_control', ...common, projectedScore: 25 },
], 'AMF');

const dribbleReady = optimizeFinalAdditionalSkillSetR457(parsed, [
  { id: 'short_creation', ...common, projectedScore: 25 },
  { id: 'close_control', ...common, projectedScore: 95 },
], 'AMF');

const legacy = optimizeFinalAdditionalSkillSetR457(parsed, [
  { id: 'short_creation', ...common },
  { id: 'close_control', ...common },
], 'AMF');

const scoreOf = (result: typeof passReady, skill: string) =>
  result.individualScores.find((item) => item.name === skill)?.score ?? -1;

assert.equal(passReady.actionStateSource, 'PROJECTED_POST_BUILD_ACTIONS',
  'R506: Top 5 precisa declarar que consumiu o estado de ações pós-build.');
assert.equal(dribbleReady.actionStateSource, 'PROJECTED_POST_BUILD_ACTIONS',
  'R506: toda avaliação com projectedScore completo deve ser pós-build.');
assert.equal(legacy.actionStateSource, 'LEGACY_ACTION_FALLBACK',
  'R506: fallback sem projectedScore deve permanecer explícito, nunca fingir pós-build.');

assert.ok(
  scoreOf(passReady, 'Passe de primeira') > scoreOf(dribbleReady, 'Passe de primeira'),
  'R506: Passe de primeira deve ganhar relevância quando a ficha final sustenta melhor criação curta.',
);
assert.ok(
  scoreOf(dribbleReady, 'Controle com a sola') > scoreOf(passReady, 'Controle com a sola'),
  'R506: Controle com a sola deve ganhar relevância quando a ficha final sustenta melhor controle sob pressão.',
);

for (const result of [passReady, dribbleReady]) {
  assert.equal(result.finalSkills.length, 5, 'R506: conjunto final deve continuar com cinco skills quando o pool permitir.');
  assert.equal(new Set(result.finalSkills).size, result.finalSkills.length, 'R506: Top 5 não pode duplicar habilidades.');
  assert.equal(result.officialOnly, true, 'R506: estado pós-build não pode introduzir skill fora do catálogo oficial.');
  assert.equal(result.nativeSpecialDuplicatesBlocked, true, 'R506: skills nativas/especiais continuam bloqueadas do Top 5 adicional.');
  assert.equal(result.deterministic, true, 'R506: decisão pós-build precisa continuar determinística.');
}

const repeat = optimizeFinalAdditionalSkillSetR457(parsed, [
  { id: 'short_creation', ...common, projectedScore: 95 },
  { id: 'close_control', ...common, projectedScore: 25 },
], 'AMF');
assert.deepEqual(repeat.finalSkills, passReady.finalSkills, 'R506: mesma entrada pós-build deve produzir o mesmo Top 5.');
assert.deepEqual(repeat.individualScores, passReady.individualScores, 'R506: scores pós-build precisam ser determinísticos.');

console.log('R506 aprovado: Top 5 consome ações pós-build explicitamente, preserva catálogo, DNA operacional e determinismo.');
