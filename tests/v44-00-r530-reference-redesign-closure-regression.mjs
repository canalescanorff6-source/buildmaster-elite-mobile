import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const layout = read('src/app/layout.tsx');
const referenceCss = read('src/app/v44-buildmaster-reference.css');
const navigation = read('src/lib/appNavigationR127.ts');
const chrome = read('src/components/CardVisionAppChromeR185.tsx');
const home = read('src/modules/core/IntegratedHomePanel.tsx');
const app = read('src/components/CardVisionApp.tsx');
const result = read('src/components/result/ResultWorkspace.tsx');
const tactics = read('src/modules/tactical-studio/MetaFormationStudioV3832.tsx');
const vault = read('src/components/vault/CardVisionVaultWorkspaceR191.tsx');
const share = read('src/components/CompactSharePanel.tsx');
const settings = read('src/components/settings/CardVisionSettingsWorkspaceR190.tsx');
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');
const packageJson = read('package.json');
const prWorkflow = read('.github/workflows/pull-request-validation.yml');
const doctorConfig = read('scripts/ci-doctor-config.mjs');

assert.match(layout, /import '\.\/v44-buildmaster-reference\.css';/, 'R530: camada visual v44 precisa continuar importada.');
assert.match(layout, /bm-r530-final-polish/, 'R530: body precisa manter o marcador final de polimento.');

for (const marker of ['R521', 'R522', 'R523', 'R524', 'R525', 'R526', 'R527', 'R528', 'R529', 'R530']) {
  assert.ok(referenceCss.includes(marker), `R530: etapa ${marker} ausente da camada de referência.`);
}

for (const section of ['inicio', 'jogadores', 'mapeamento', 'time', 'partidas', 'ajustes', 'menu', 'buscar', 'leitor', 'manual', 'resultado', 'cofre']) {
  assert.ok(navigation.includes(`'${section}'`), `R530: superfície canônica ${section} ausente.`);
}

assert.match(chrome, /bm-r521-/);
assert.match(home, /bm-r522-/);
assert.match(app, /bm-r523-/);
assert.match(result, /bm-r524-/);
assert.match(result, /bm-r525-/);
assert.match(tactics, /bm-r526-/);
assert.match(vault, /bm-r527-/);
assert.match(share, /bm-r528-/);
assert.match(settings, /bm-r529-/);

const readOnlyVisualSurfaces = [chrome, home, result, tactics, vault, share, settings];
for (const source of readOnlyVisualSurfaces) {
  for (const forbidden of [
    'cleanSlatePerformance2027V4080R119',
    'createProductionAnalysisR138',
    'rebuildProductionAnalysisR138',
    'applyCleanSlatePerformance2027R119'
  ]) {
    assert.ok(!source.includes(forbidden), `R530: superfície visual importou/chamou writer proibido: ${forbidden}`);
  }
}

assert.equal(
  sha256(r119),
  '02208171c61e6576107ebb3a22a94357755fb07f5b752b20dda78ca12b2ccadb',
  'R530: a autoridade R119 divergiu do rebaseline R551 documentado em 2026-10-09.'
);

assert.match(packageJson, /"test:r530"\s*:/, 'R530: package.json precisa expor npm run test:r530.');
assert.match(prWorkflow, /R530 — fechamento do redesign premium/, 'R530: Pull Request precisa executar o gate final.');
assert.match(prWorkflow, /run:\s*npm run test:r530/, 'R530: Pull Request deve chamar npm run test:r530.');
assert.match(doctorConfig, /test:r530/, 'R530: diagnóstico completo de release precisa executar test:r530.');

console.log('R530 aprovada: redesign R521-R530 fechado, superfícies canônicas preservadas e baseline R550 íntegro.');
