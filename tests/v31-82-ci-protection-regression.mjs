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

const sourceBudgetMatch = budget.match(/sourceTs:\s*(\d+(?:\.\d+)?)\s*\*\s*1024\s*\*\s*1024/);
assert.ok(sourceBudgetMatch, 'O orçamento TypeScript precisa continuar explícito em MiB.');
const sourceBudgetMiB = Number(sourceBudgetMatch[1]);
assert.ok(Number.isFinite(sourceBudgetMiB) && sourceBudgetMiB > 0, 'O orçamento TypeScript precisa ser um valor positivo.');
assert.match(budget, /sourceBytes > limits\.sourceTs/);
assert.match(budget, /largestSource\.size > limits\.singleSourceTs/);
assert.match(budget, /singleSourceTs:\s*\d+(?:\.\d+)?\s*\*\s*1024/);

assert.match(apk, /npm run quality:bundle-built/);
assert.match(play, /npm run quality:bundle-built/);
assert.ok(apk.indexOf('npm run ci:verify') < apk.indexOf('npm run apk:build-web'));
assert.ok(play.indexOf('npm run ci:verify') < play.indexOf('npm run apk:build-web'));
console.log(`v31.82 proteção preventiva aprovada com orçamento TypeScript configurável (${sourceBudgetMiB} MiB).`);
