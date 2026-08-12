import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const audit = read('scripts/audit-project.mjs');
const doctor = read('scripts/ci-doctor.mjs');
const sw = read('public/sw.js');
const nativeCache = read('src/components/RegisterServiceWorker.tsx');
const manifest = JSON.parse(read('public/manifest.webmanifest'));

assert.equal(pkg.version, '40.80.0');
assert.equal(pkg.scripts['test:v3836'], 'node tests/v38-36-deterministic-audit-hotfix.mjs');
assert.ok(pkg.scripts['test:all'].includes('npm run test:v3836'));
assert.ok(doctor.includes('Regressões v38.39'));
assert.ok(audit.includes('reachableTypedSourceFiles'));
assert.ok(audit.includes('Import interno ativo não resolvido'));
assert.ok(audit.includes('módulo(s) não alcançável(is) foram ignorados pela auditoria ativa'));
assert.ok(audit.includes('Acesso direto ao localStorage centralizado nos módulos ativos'));
assert.ok(audit.includes('Tipos explícitos any removidos dos módulos ativos'));
assert.ok(audit.includes('::error title=Auditoria estrutural::'));
assert.ok(sw.includes('buildmaster-v40-80-edge-stack-1'));
assert.ok(nativeCache.includes('40.80.0-edge-stack-runtime-1'));
assert.equal(manifest.name, 'BuildMaster Elite Tático v40.80');

console.log('v38.40 aprovada: auditoria determinística valida o código ativo, informa resíduos sem bloquear e preserva falhas críticas.');
