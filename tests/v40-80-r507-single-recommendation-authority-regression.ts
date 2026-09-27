import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { FinalAdditionalSkillSetR457 } from '../src/lib/finalAdditionalSkillSetR457';
import type { FinalImpetoDecisionR457 } from '../src/lib/finalImpetoDecisionR457';
import { projectFinalRecommendationsR507 } from '../src/lib/finalRecommendationAuthorityR507';

const skills = {
  version: '40.80-r506-final-additional-skill-set-v4-post-build-action-state',
  status: 'OPTIMAL_SET_PROVEN',
  position: 'AMF',
  actionStateSource: 'PROJECTED_POST_BUILD_ACTIONS',
  projectedActionCoverage: 100,
  currentSkills: [],
  finalSkills: ['Passe de primeira', 'Passe em profundidade', 'Controle com a sola', 'Super-sub', 'Finalização acrobática'],
  additions: ['Passe de primeira', 'Passe em profundidade', 'Controle com a sola', 'Super-sub', 'Finalização acrobática'],
  removals: [],
  decisions: [],
  individualScores: [],
  currentSetScore: 0,
  finalSetScore: 80,
  estimatedSetGain: 80,
  complementPairs: [],
  candidatePoolSize: 12,
  combinationsTested: 100,
  exactFive: true,
  officialOnly: true,
  roleCompatible: true,
  nativeSpecialDuplicatesBlocked: true,
  deterministic: true,
  modelNote: 'teste',
} as FinalAdditionalSkillSetR457;

const impeto = {
  version: '40.80-r505-final-impeto-post-build-v1',
  current: 'Agilidade',
  currentScore: 61,
  technicalIdeal: 'Passe',
  technicalIdealScore: 82,
  technicalGainOverCurrent: 21,
  action: 'REPLACE_IF_ALLOWED',
  slotStatus: 'OCUPADO',
  candidates: [
    { name: 'Passe', totalScore: 82, functionalFit: 84, positionFit: 90, attributeSupport: 86, confidence: 91, explanation: 'Melhor encaixe funcional pós-build.' },
    { name: 'Agilidade', totalScore: 61, functionalFit: 65, positionFit: 80, attributeSupport: 79, confidence: 78, explanation: 'Ímpeto atual.' },
    { name: 'Chute', totalScore: 58, functionalFit: 60, positionFit: 70, attributeSupport: 77, confidence: 74, explanation: 'Alternativa funcional.' },
  ],
  ambiguity: false,
  attributeSource: 'PROJECTED_POST_BUILD',
  numericAttributeEffectVerified: false,
  effectModel: 'FUNCTIONAL_FIT_ONLY',
  automaticSpendAuthorized: false,
  reason: 'Troca apenas se permitida e escolhida pelo usuário.',
  modelNote: 'teste',
} as FinalImpetoDecisionR457;

const projected = projectFinalRecommendationsR507(skills, impeto);
assert.deepEqual(projected.skills, skills.finalSkills, 'R507: saída pública de skills deve espelhar exatamente R506.');
assert.equal(projected.impeto.current, impeto.current, 'R507: Ímpeto atual deve vir de R505.');
assert.equal(projected.impeto.ideal, impeto.technicalIdeal, 'R507: ideal público deve vir de R505.');
assert.equal(projected.impeto.decision, 'RECOMMEND_NEW', 'R507: ação pública deve ser adaptada da decisão R505.');
assert.equal(projected.impeto.recommendedImpeto, 'Passe', 'R507: recomendação pública deve ser o ideal R505 quando a troca é tecnicamente indicada.');
assert.equal(projected.impeto.recommendations[0]?.name, 'Passe', 'R507: lista pública não pode escolher outro Ímpeto fora da autoridade R505.');
assert.equal(projected.impeto.recommendations.some(item => item.name === 'Agilidade'), false, 'R507: Ímpeto atual não pode ser repetido como recomendação adicional.');
assert.equal(projected.impeto.automaticSpendAuthorized, false, 'R507: projeção pública não pode autorizar gasto automático.');
assert.ok(projected.impeto.recommendations.every(item => item.official === true), 'R507: projeção pública deve marcar somente candidatos da matriz oficial funcional.');

const keep = projectFinalRecommendationsR507(skills, { ...impeto, technicalIdeal: 'Agilidade', technicalIdealScore: 61, technicalGainOverCurrent: 0, action: 'KEEP_CURRENT' });
assert.equal(keep.impeto.decision, 'KEEP_CURRENT');
assert.equal(keep.impeto.recommendedImpeto, null, 'R507: KEEP_CURRENT não pode virar recomendação de gasto/troca.');
assert.deepEqual(keep.impeto.recommendations, [], 'R507: KEEP_CURRENT não deve publicar alternativas como se fossem recomendação final.');

const review = projectFinalRecommendationsR507(skills, { ...impeto, current: null, currentScore: null, action: 'REVIEW_SLOT', slotStatus: 'NAO_CONFIRMADO' });
assert.equal(review.impeto.decision, 'REVIEW_SLOT');
assert.equal(review.impeto.recommendedImpeto, null, 'R507: vaga não confirmada não pode publicar recomendação acionável.');
assert.deepEqual(review.impeto.recommendations, [], 'R507: REVIEW_SLOT deve permanecer fail-closed.');

const blocked = projectFinalRecommendationsR507(skills, impeto, { actionable: false });
assert.equal(blocked.impeto.decision, 'NO_SAFE_IMPETO', 'R507: ficha bloqueada nunca pode publicar ação de Ímpeto.');
assert.equal(blocked.impeto.recommendedImpeto, null, 'R507: ficha bloqueada não pode publicar Ímpeto acionável.');
assert.deepEqual(blocked.impeto.recommendations, [], 'R507: ficha bloqueada deve manter lista acionável vazia.');
assert.deepEqual(blocked.skills, skills.finalSkills, 'R507: bloqueio da ficha não cria uma segunda autoridade de Top 5.');

const repeated = projectFinalRecommendationsR507(skills, impeto);
assert.deepEqual(repeated, projected, 'R507: mesma decisão R505/R506 deve produzir a mesma projeção pública.');

const clean = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts', 'utf8');
assert.match(clean, /projectFinalRecommendationsR507/, 'R507: Clean Slate precisa importar/usar a autoridade pública única.');
assert.match(clean, /recommendedSkills:publicRecommendationsR507\.skills/, 'R507: saída pública READY de skills deve vir de R506 via R507.');
assert.match(clean, /recommendedImpetos:publicRecommendationsR507\.impeto\.recommendations/, 'R507: saída pública READY de Ímpeto deve vir de R505 via R507.');
assert.match(clean, /blockedPublicRecommendationsR507=projectFinalRecommendationsR507\([\s\S]{0,160}actionable:false/, 'R507: caminho bloqueado precisa ser explicitamente não acionável.');
assert.match(clean, /top5:publicRecommendationsR507\.skills/, 'R507: campo estrutural top5 não pode divergir da autoridade R506.');
assert.match(clean, /impetoDecision:publicRecommendationsR507\.impeto\.decision/, 'R507: campo estrutural de Ímpeto não pode divergir da autoridade R505.');
assert.match(clean, /existingImpetoNeverRepeated:publicRecommendationsR507\.impeto\.existingImpetoNeverRepeated/, 'R507: guard público deve ser calculado pela mesma projeção final.');

console.log('R507 aprovado: campos públicos de Top 5 e Ímpeto espelham uma única autoridade pós-build, bloqueios são fail-closed e não há gasto automático.');