import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const panel = fs.readFileSync('src/components/PrecisionBuildPanel.tsx', 'utf8');
const engine = fs.readFileSync('src/modules/builds/advancedBuildIntelligence.ts', 'utf8');
const index = fs.readFileSync('src/modules/builds/index.ts', 'utf8');
const precision = fs.readFileSync('src/lib/precisionBuildEngine.ts', 'utf8');
const css = fs.readFileSync('src/app/legacy-compat/part-07.css', 'utf8');
const manifest = JSON.parse(fs.readFileSync('public/manifest.webmanifest', 'utf8'));
const sw = fs.readFileSync('public/sw.js', 'utf8');

assert.equal(pkg.version, '29.10.0');
assert.equal(lock.version, '29.10.0');
assert.equal(lock.packages[''].version, '29.10.0');
assert.match(pkg.scripts['test:v2860'], /v28-60-advanced-build-intelligence-regression\.ts/);
assert.match(pkg.scripts['test:v2860'], /v28-60-advanced-build-ui-regression\.mjs/);
assert.match(pkg.scripts['test:all'], /^(?:npm run test:v2910 && )?(?:npm run test:v2900 && )?(?:npm run test:v2880 && )?(?:npm run test:v2870 && )?npm run test:v2860 && npm run test:v2850/);

assert.match(engine, /ADVANCED_BUILD_INTELLIGENCE_VERSION = '28\.60\.0'/);
assert.match(engine, /Ficha competitiva/);
assert.match(engine, /Ficha ofensiva/);
assert.match(engine, /Ficha equilibrada/);
assert.match(engine, /pointJustifications/);
assert.match(engine, /creatorSnapshot/);
assert.match(engine, /matchLearningSnapshot/);
assert.match(engine, /A posição escolhida pelo usuário nunca é trocada automaticamente/);
assert.match(index, /advancedBuildIntelligence/);
assert.match(precision, /'competitive' \| 'offensive' \| 'balanced'/);

for (const label of ['Resumo', '3 perfis', 'Inteligência', 'Ajustar', 'Pós-jogo', 'Auditoria']) {
  assert.ok(panel.includes(label), `A etapa “${label}” precisa existir no painel.`);
}
assert.match(panel, /buildAdvancedBuildIntelligence/);
assert.match(panel, /Consenso de criadores/);
assert.match(panel, /Aprendizado com partidas/);
assert.match(panel, /Justificativa ponto por ponto/);
assert.match(panel, /Testar esta função no laboratório/);
assert.match(panel, /Habilidades especiais/);

for (const className of ['advanced-role-grid', 'advanced-point-list', 'advanced-alert-list', 'advanced-intelligence-columns', 'advanced-mini-metrics']) {
  assert.ok(css.includes(`.${className}`), `CSS do Bloco 7 ausente: ${className}`);
}
assert.match(css, /@media \(max-width: 720px\)/);
assert.equal(manifest.name, 'BuildMaster Elite Tático v29.10');
assert.match(sw, /buildmaster-v29-10/);

console.log('v28.60 advanced build UI regression: ok');
