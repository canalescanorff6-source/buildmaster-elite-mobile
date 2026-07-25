import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const engine = fs.readFileSync('src/lib/professionalSquadEngine.ts', 'utf8');
const panel = fs.readFileSync('src/modules/squad/ProfessionalSquadPanel.tsx', 'utf8');
const teamPanel = fs.readFileSync('src/modules/squad/TeamFullMapPanel.tsx', 'utf8');
const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const css = fs.readFileSync('src/app/design-system-v2870-squad.css', 'utf8');
const globals = fs.readFileSync('src/app/globals.css', 'utf8');
const manifest = JSON.parse(fs.readFileSync('public/manifest.webmanifest', 'utf8'));
const sw = fs.readFileSync('public/sw.js', 'utf8');

assert.equal(pkg.version, '30.00.0');
assert.equal(lock.version, '30.00.0');
assert.equal(lock.packages[''].version, '30.00.0');
assert.match(pkg.scripts['test:v2870'], /v28-70-professional-squad-engine-regression\.ts/);
assert.match(pkg.scripts['test:v2870'], /v28-70-professional-squad-ui-regression\.mjs/);
assert.ok(pkg.scripts['test:all'].startsWith('npm run test:v3000 && npm run test:v2980 && npm run test:v2970 && npm run test:v2960 && npm run test:v2950 && npm run test:v2940 && npm run test:v2930') && pkg.scripts['test:all'].includes('npm run test:v2870'));

assert.match(engine, /PROFESSIONAL_SQUAD_VERSION = '28\.70\.0'/);
for (const token of ['formationRanking', 'benchUnits', 'scenarios', 'plans', 'opponentPlans', 'repeatedFunctions']) {
  assert.ok(engine.includes(token), `Motor profissional precisa conter ${token}.`);
}
for (const label of ['Formações', 'Setores', 'Banco e trocas', 'Planos A/B/C', 'Adversários']) {
  assert.ok(panel.includes(label), `A Central Profissional precisa da área ${label}.`);
}
assert.match(panel, /Usar esta formação/);
assert.match(panel, /Aplicar formação do plano/);
assert.match(teamPanel, /ProfessionalSquadPanel/);
assert.match(teamPanel, /teamCenterView === 'profissional'/);
assert.match(app, /aplicada pela Central Profissional/);
assert.match(globals, /design-system-v2870-squad\.css/);
for (const className of ['professional-squad-shell', 'professional-formation-grid', 'professional-sector-grid', 'professional-bench-grid', 'professional-plan-grid', 'professional-opponent-grid']) {
  assert.ok(css.includes(`.${className}`), `CSS ausente: ${className}`);
}
assert.match(css, /@media \(max-width: 680px\)/);
assert.equal(manifest.name, 'BuildMaster Elite Tático v30.00');
assert.match(sw, /buildmaster-v30-00/);

console.log('v28.70 professional squad UI regression: ok');
