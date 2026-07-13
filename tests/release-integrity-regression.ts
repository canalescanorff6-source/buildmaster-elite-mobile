import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const manifest = fs.readFileSync('public/manifest.webmanifest', 'utf8');
const sw = fs.readFileSync('public/sw.js', 'utf8');

assert.equal(pkg.version, '25.80.0');
assert.equal(lock.version, pkg.version);
assert.equal(lock.packages[''].version, pkg.version);
for (const content of [workflow, layout, manifest]) assert.match(content, /25\.80/);
assert.match(sw, /25-80/);
assert.doesNotMatch(workflow, /v25\.77|v25\.72/);
assert.doesNotMatch(layout, /v24\.80|v24\.34/);
assert.doesNotMatch(manifest, /v24\.34/);
assert.doesNotMatch(sw, /v24-34/);
assert.ok(fs.existsSync('src/app/error.tsx'));
assert.ok(fs.existsSync('src/app/global-error.tsx'));
console.log('release integrity regression: ok');
