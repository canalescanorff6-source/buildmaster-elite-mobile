import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const budgetRegression = read('tests/v31-82-ci-protection-regression.mjs');
const studioRegression = read('tests/v34-00-studio-clean-regression.mjs');
const revolutionRegression = read('tests/v36-00-premium-revolution-regression.mjs');
const cacheRegression = read('tests/v37-71-ci-hotfix-regression.mjs');
const cacheHotfixRegression = read('tests/v38-31-ci-regression-hotfix.mjs');
const audit = read('scripts/audit-project.mjs');
const doctor = read('scripts/ci-doctor.mjs');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');
const nativeCache = read('src/components/RegisterServiceWorker.tsx');

assert.equal(pkg.version, '40.80.0');
assert.equal(pkg.scripts['test:v3835'], 'node tests/v38-35-legacy-regressions-hotfix.mjs');
assert.ok(pkg.scripts['test:all'].includes('npm run test:v3835'));

// A proteção v31.82 não deve congelar um número histórico de MiB.
// Ela precisa validar o orçamento configurado no motor atual e manter os
// guardas que realmente bloqueiam excesso de código.
assert.ok(
  budgetRegression.includes('sourceBudgetMatch = budget.match'),
  'A regressão v31.82 precisa descobrir dinamicamente o orçamento TypeScript.'
);
assert.ok(
  budgetRegression.includes('sourceBudgetMiB = Number(sourceBudgetMatch[1])'),
  'A regressão v31.82 precisa interpretar o orçamento configurado.'
);
assert.ok(
  budgetRegression.includes('orçamento TypeScript precisa continuar explícito em MiB'),
  'A regressão v31.82 precisa exigir um orçamento TypeScript explícito.'
);
assert.ok(
  budgetRegression.includes('sourceBytes > limits'),
  'A regressão v31.82 precisa manter a proteção do total de código-fonte.'
);
assert.ok(
  budgetRegression.includes('largestSource'),
  'A regressão v31.82 precisa manter a proteção de módulo individual.'
);

assert.match(studioRegression, /38\\\.\(\?:3\[2-9\]\|40\)/);
assert.match(revolutionRegression, /38\\\.\(\?:3\[2-9\]\|40\)/);

// O contrato legado não pode depender de um sufixo de cache de uma versão
// anterior. A v37.71 valida o formato atual completo da linha v40 e a v38.31
// deriva a versão real do pacote.
assert.ok(
  cacheRegression.includes('40\\.(?:00|10|20|30|40|50|60|70|80)\\.0'),
  'A regressão v37.71 precisa reconhecer toda a linha v40 até a versão atual.'
);
assert.match(cacheRegression, /contrato de cache sem duplicar a lista/);
assert.doesNotMatch(cacheRegression, /36\\\.0-deterministic-audit/);
assert.match(cacheHotfixRegression, /const \[major, minor\] = pkg\.version\.split\('\.'\)/);
assert.match(cacheHotfixRegression, /escapedCacheVersion/);
assert.doesNotMatch(cacheHotfixRegression, /36-deterministic-audit/);

assert.ok(audit.includes("pkg.version === '40.80.0'"));
assert.ok(audit.includes('buildmaster-v40-80-edge-stack-1'));
assert.ok(doctor.includes('Regressões v38.39'));
assert.equal(manifest.name, 'BuildMaster Elite Tático v40.80');
assert.ok(sw.includes('buildmaster-v40-80-edge-stack-1'));
assert.ok(nativeCache.includes('40.80.0-edge-stack-runtime-1'));
const playNotes = read('play-store/listing/pt-BR/release-notes/40.30.0.txt').trim();
assert.ok(playNotes.length > 0 && playNotes.length <= 500);

console.log('v38.35 preservada na v40.80: orçamento configurável, visual, cache e auditoria protegidos sem teto histórico congelado.');
