import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const doctor = fs.readFileSync('scripts/ci-doctor.mjs', 'utf8');
const budget = fs.readFileSync('scripts/check-bundle-budget.mjs', 'utf8');
const apk = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const play = fs.readFileSync('.github/workflows/build-play-store.yml', 'utf8');

assert.ok(pkg.scripts['types:repair']);
assert.ok(pkg.scripts['quality:root-tsconfig']);
assert.ok(pkg.scripts['quality:dependencies']);
assert.ok(pkg.scripts['quality:version-guards']);
assert.ok(pkg.scripts['quality:ci-contract']);
assert.match(doctor, /Configuração TypeScript raiz/);
assert.match(apk, /npm run types:repair && npm run quality:root-tsconfig/);
assert.match(play, /npm run types:repair && npm run quality:root-tsconfig/);
assert.match(doctor, /Compatibilidade das dependências/);
assert.match(doctor, /Orçamento do código-fonte/);
assert.match(doctor, /Guardas de versão das regressões/);
assert.match(budget, /sourceTs:\s*(?:3\.5|4|4\.5)\s*\*\s*1024\s*\*\s*1024/);
const sourceBudgetMatch = budget.match(/sourceTs:\s*(3\.5|4|4\.5)\s*\*\s*1024\s*\*\s*1024/);
assert.ok(sourceBudgetMatch && Number(sourceBudgetMatch[1]) <= 4.5, 'O teto TypeScript não pode ultrapassar 4,5 MiB sem modularização.');
assert.match(apk, /npm run quality:bundle-built/);
assert.match(play, /npm run quality:bundle-built/);
assert.ok(apk.indexOf('npm run ci:verify') < apk.indexOf('npm run apk:build-web'));
assert.ok(play.indexOf('npm run ci:verify') < play.indexOf('npm run apk:build-web'));
console.log('v31.82 proteção preventiva do GitHub Actions e geração do APK aprovada.');
