import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
const pre = read('scripts/production-preflight.mjs');
const a = read('tests/v40-10-progress-experience-regression.mjs');
const b = read('tests/v40-20-progress-experience-regression.mjs');
assert.ok(pre.includes("version === '40.80.0'"));
assert.ok(pre.includes("buildmaster-v40-80-edge-stack-1"));
assert.ok(pre.includes("split('\\n').length < 5000"));
for (const source of [a,b]) {
  assert.ok(source.includes("assert.equal(pkg.version, '40.80.0')"));
  assert.ok(source.includes("buildmaster-v40-80-edge-stack-1"));
  assert.ok(source.includes("40.80.0-edge-stack-runtime-1"));
  assert.ok(source.includes("app.split('\\n').length <= 5000"));
}
console.log('r37 aprovada: último preflight e regressões v40.10/v40.20 sincronizados com v40.80.');
