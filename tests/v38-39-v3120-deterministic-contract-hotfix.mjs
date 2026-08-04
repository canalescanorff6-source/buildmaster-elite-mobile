import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
const pkg = JSON.parse(read('package.json'));
const premiumTest = read('tests/v31-20-premium-interface-regression.mjs');
const tacticalTest = read('tests/v31-20-tactical-context-restored-regression.mjs');

assert.match(pkg.version, /^38\.(?:39|40)\.0$/);
assert.ok(pkg.scripts['test:v3120'], 'O script test:v3120 precisa existir.');
assert.doesNotMatch(
  pkg.scripts['test:v3120'],
  /typecheck:v3110/,
  'A regressão v31.20 não deve repetir o typecheck já executado no grupo v31.10.'
);
assert.match(pkg.scripts['test:v3120'], /v31-20-premium-interface-regression\.mjs/);
assert.match(pkg.scripts['test:v3120'], /v31-20-tactical-context-restored-regression\.mjs/);
assert.match(pkg.scripts['test:v3839'], /v38-39-v3120-deterministic-contract-hotfix\.mjs/);
assert.match(premiumTest, /fileURLToPath\(import\.meta\.url\)/, 'O teste premium deve resolver a raiz independentemente do cwd.');
assert.match(tacticalTest, /fileURLToPath\(import\.meta\.url\)/, 'O teste tático deve resolver a raiz independentemente do cwd.');
assert.match(tacticalTest, /Automático pela carta\|Perfil da carta/, 'O teste tático deve proteger o perfil automático atual.');

console.log('v38.39 hotfix aprovado: regressão v31.20 determinística, sem typecheck duplicado e alinhada ao perfil automático pela carta.');
