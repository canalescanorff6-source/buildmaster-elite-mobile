import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const posterPanel = read('src/components/TacticalPosterStudioPanel.tsx');
const budget = read('scripts/check-bundle-budget.mjs');
const rootPage = read('src/app/page.tsx');
const audit = read('scripts/audit-project.mjs');
const doctor = read('scripts/ci-doctor.mjs');
const sw = read('public/sw.js');
const nativeCache = read('src/components/RegisterServiceWorker.tsx');

assert.ok(/^38\.(?:34|35|36|37|38)\.0$/.test(pkg.version), `Versão compatível esperada: ${pkg.version}`);
assert.ok(String(pkg.scripts['test:all']).includes('npm run test:v3834'));
assert.equal(pkg.scripts['test:v3834'], 'node tests/v38-34-ci-complete-hotfix-regression.mjs');

for (const prop of ['brandTitle?: string', 'brandSubtitle?: string', 'defaultPalette?: TacticalPosterPalette', 'defaultFocus?: string']) {
  assert.ok(posterPanel.includes(prop), `Contrato compatível ausente: ${prop}`);
}
assert.match(posterPanel, /createInitialState\(formation, style, managerName, \{ brandTitle, brandSubtitle, defaultPalette, defaultFocus \}\)/);
assert.match(posterPanel, /palette: defaults\.defaultPalette \?\? 'ouro'/);
assert.match(posterPanel, /title: defaults\.brandTitle\?\.trim\(\) \|\|/);

assert.match(budget, /sourceTs: 4 \* 1024 \* 1024/);
assert.match(budget, /singleSourceTs: 400 \* 1024/);
assert.match(budget, /Módulo TypeScript excedeu/);

assert.match(rootPage, /AuthGate/);
assert.match(rootPage, /CardVisionApp/);
assert.doesNotMatch(rootPage, /PrivacyPolicyPage|Política de privacidade|public-policy-page/);
assert.ok(audit.includes("pkg.version === '38.38.0'"));
assert.ok(audit.includes("buildmaster-v38-38-legacy-profile-regressions-1"));
assert.ok(doctor.includes('Regressões v38.34'));
assert.ok(sw.includes('buildmaster-v38-38-legacy-profile-regressions-1'));
assert.ok(nativeCache.includes('38.38.0-legacy-profile-regressions-1'));

console.log('v38.34 preservada na v38.38: orçamento protegido, rota inicial restaurada e contrato do gerador compatível com o Estúdio Marques.');
