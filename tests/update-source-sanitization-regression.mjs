import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sanitizeUpdateSource } from '../scripts/sanitize-update-source.mjs';

const root = join(tmpdir(), `buildmaster-update-sanitize-${process.pid}-${Date.now()}`);
mkdirSync(join(root, 'public'), { recursive: true });
mkdirSync(join(root, 'out'), { recursive: true });
mkdirSync(join(root, 'android/app/src/main/assets/public'), { recursive: true });
writeFileSync(join(root, 'public/update-manifest.json'), '{"placeholder":true}');
writeFileSync(join(root, 'public/update-manifest.example.json'), '{"example":true}');
writeFileSync(join(root, 'out/update-manifest.json'), '{"generated":true}');
writeFileSync(join(root, 'android/app/src/main/assets/public/update-manifest.json'), '{"copied":true}');

const removed = sanitizeUpdateSource(root);
assert.deepEqual(removed.sort(), [
  'android/app/src/main/assets/public/update-manifest.json',
  'out/update-manifest.json',
  'public/update-manifest.json'
].sort());
assert.equal(existsSync(join(root, 'public/update-manifest.json')), false);
assert.equal(existsSync(join(root, 'out/update-manifest.json')), false);
assert.equal(existsSync(join(root, 'android/app/src/main/assets/public/update-manifest.json')), false);
assert.equal(existsSync(join(root, 'public/update-manifest.example.json')), true);

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
assert.equal(pkg.scripts['sanitize:update-source'], 'node scripts/sanitize-update-source.mjs');
assert.match(pkg.scripts['pretest:all'], /sanitize:update-source/);
assert.match(pkg.scripts['pretypecheck'], /sanitize:update-source/);
assert.match(pkg.scripts['preapk:build-web'], /sanitize:update-source/);

const workflow = readFileSync('.github/workflows/build-apk.yml', 'utf8');
const sanitizeIndex = workflow.indexOf('Remover manifesto local antigo antes dos testes');
const testsIndex = workflow.indexOf('Rodar testes do motor');
assert.ok(sanitizeIndex >= 0, 'O workflow precisa limpar o manifesto antigo.');
assert.ok(testsIndex > sanitizeIndex, 'A limpeza precisa acontecer antes dos testes.');
assert.match(workflow, /node scripts\/sanitize-update-source\.mjs/);

rmSync(root, { recursive: true, force: true });
console.log('✓ Manifesto placeholder antigo é removido antes dos testes e nunca entra no APK.');
