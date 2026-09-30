import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const result = read('src/components/result/ResultWorkspace.tsx');
const css = read('src/app/v44-buildmaster-reference.css');

for (const marker of [
  'bm-r525-skills',
  'bm-r525-skill-integrity',
  'bm-r525-skill-progress',
  'bm-r525-skill-top5',
  'bm-r525-skill-alternatives',
  'bm-r525-skill-avoid',
  'bm-r525-impeto',
  'bm-r525-impeto-winner',
  'bm-r525-impeto-alternatives',
  'bm-r525-impeto-avoid',
  'bm-r525-impeto-evidence',
]) assert.ok(result.includes(marker), `R525: Resultado sem hook ${marker}`);

for (const selector of [
  '.bm-r525-skills',
  '.bm-r525-skill-integrity',
  '.bm-r525-skill-progress',
  '.bm-r525-skill-top5',
  '.bm-r525-skill-alternatives',
  '.bm-r525-skill-avoid',
  '.bm-r525-impeto',
  '.bm-r525-impeto-winner',
  '.bm-r525-impeto-alternatives',
  '.bm-r525-impeto-avoid',
  '.bm-r525-impeto-evidence',
]) assert.ok(css.includes(selector), `R525: CSS não cobre ${selector}`);

assert.match(result, /const bestImpeto = canCraftImpeto \? \(recommendedImpetos\.find\(\(item\) => item\.tier === 'ideal'\)/,
  'R525: Ímpeto vencedor deve continuar vindo da recomendação canônica existente.');
assert.match(result, /impetoV4080\?\.slotStatus === 'SEM_VAGA'/,
  'R525: bloqueio por ausência de vaga deve continuar exposto.');
assert.match(result, /result\.skillIntegrity\.recommendedSkills\.length\}\/5 seguras/,
  'R525: integridade do Top 5 deve continuar sendo exibida.');
assert.match(result, /requestOwnedSkillReplacement\(skill\)/,
  'R525: fluxo Já possui? Gerar outra deve ser preservado.');

for (const forbidden of [
  'finalAdditionalSkillSetR457',
  'finalImpetoDecisionR457',
  'jointOptimizerR512',
  'engineCertificationR517',
]) {
  assert.ok(!result.includes(`from '@/lib/${forbidden}'`) && !result.includes(`from '@/modules/analysis/${forbidden}'`),
    `R525: UI não deve importar autoridade ${forbidden}`);
}

console.log('R525 aprovada: Skills + Ímpeto ganham hierarquia premium sem criar nova autoridade ou alterar decisões do motor.');
