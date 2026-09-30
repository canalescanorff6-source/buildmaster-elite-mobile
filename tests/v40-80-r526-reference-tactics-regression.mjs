import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const studio = read('src/modules/tactical-studio/MetaFormationStudioV3832.tsx');
const css = read('src/app/v44-buildmaster-reference.css');

for (const marker of [
  'bm-r526-tactics',
  'bm-r526-tactical-guide',
]) assert.ok(app.includes(marker), `R526: workspace sem hook ${marker}`);

for (const marker of [
  'bm-r526-meta-studio',
  'bm-r526-tactical-header',
  'bm-r526-tactical-modes',
  'bm-r526-tactical-config',
  'bm-r526-tactical-recommendations',
  'bm-r526-tactical-pitch',
  'bm-r526-tactical-export',
  'bm-r526-tactical-validation',
  'bm-r526-tactical-lineup',
  'bm-r526-tactical-explanation',
  'bm-r526-tactical-saved',
]) assert.ok(studio.includes(marker), `R526: estúdio sem hook ${marker}`);

for (const selector of [
  '.bm-r526-tactics',
  '.bm-r526-tactical-guide',
  '.bm-r526-meta-studio',
  '.bm-r526-tactical-header',
  '.bm-r526-tactical-modes',
  '.bm-r526-tactical-config',
  '.bm-r526-tactical-recommendations',
  '.bm-r526-tactical-pitch',
  '.bm-r526-tactical-export',
  '.bm-r526-tactical-validation',
  '.bm-r526-tactical-lineup',
  '.bm-r526-tactical-explanation',
  '.bm-r526-tactical-saved',
]) assert.ok(css.includes(selector), `R526: CSS não cobre ${selector}`);

assert.match(studio, /recommendMetaFormations\(style, objective, mode === 'inteligente' \? answers : \{\}\)/,
  'R526: recomendação deve continuar vindo do engine existente.');
assert.match(studio, /validateMetaFormation\(formation, project\.assignments, project\.objective\)/,
  'R526: validação deve continuar vindo do engine existente.');
assert.match(studio, /scorePlayerForMetaSlot\(player, selectedSlot, selectedAssignment\.style\)/,
  'R526: encaixe de jogador/slot deve continuar vindo do engine existente.');
assert.match(studio, /renderProfessionalMetaFormationSvg\(project, exportFormat\)/,
  'R526: preview/export deve continuar usando o template profissional existente.');

for (const forbidden of [
  'tacticalDirectorEngineR500',
  'jointOptimizerR512',
  'engineCertificationR517',
]) {
  assert.ok(!studio.includes(`from '@/modules/tactical-director/${forbidden}'`) && !studio.includes(`from '@/modules/analysis/${forbidden}'`),
    `R526: UI tática não deve criar nova autoridade importando ${forbidden}`);
}

console.log('R526 aprovada: Táticas ganham hierarquia premium sem criar segundo motor ou alterar decisões existentes.');
