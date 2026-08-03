import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const nativeCache = read('src/components/RegisterServiceWorker.tsx');
const serviceWorker = read('public/sw.js');
const v33 = read('tests/v33-00-executive-redesign-regression.mjs');
const v3771 = read('tests/v37-71-ci-hotfix-regression.mjs');
const doctor = read('scripts/ci-doctor.mjs');
const pkg = JSON.parse(read('package.json'));

assert.match(app, /nativeSkills: Array\.from\(new Set\(canonicalizeSkillList\(\[/,
  'O inventário completo precisa manter deduplicação explícita e normalização canônica.');

// O teste antigo mantinha uma expressão fixa e chegou a montar o sufixo
// 38.39 como "38-39", rejeitando o esquema real 38.39.0. O contrato agora é
// derivado da versão do pacote, evitando que um novo hotfix quebre a CI.
const [major, minor] = pkg.version.split('.');
const escapedVersion = `${major}\\.${minor}\\.0`;
const escapedCacheVersion = `${major}-${minor}`;
assert.match(nativeCache, new RegExp(`NATIVE_CACHE_SCHEMA = '${escapedVersion}-[^']+-1'`),
  'O esquema nativo precisa corresponder à versão atual do pacote.');
assert.match(serviceWorker, new RegExp(`CACHE_NAME = 'buildmaster-v${escapedCacheVersion}-[^']+-1'`),
  'O service worker precisa corresponder à versão atual do pacote.');

assert.match(v33, /assert\.match\(cache, \/NATIVE_CACHE_SCHEMA/,
  'A regressão v33 precisa preservar a validação do cache nativo.');
assert.match(v3771, /NATIVE_CACHE_SCHEMA = '\(\?:37\|38\)/,
  'A regressão v37.71 precisa aceitar o formato versionado atual sem depender de um sufixo específico.');
assert.ok(doctor.includes('Regressões v38.31'), 'O diagnóstico consolidado precisa executar a v38.31.');
assert.equal(pkg.scripts['test:v3831'], 'node tests/v38-31-ci-regression-hotfix.mjs');

console.log('v38.31 aprovado: contratos legados, cache atual e deduplicação canônica permanecem compatíveis com a versão real do pacote.');
