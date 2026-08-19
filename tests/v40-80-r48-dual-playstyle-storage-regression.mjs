import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/lib/dualPlaystyleRegistryV4080R47.ts', 'utf8');

assert.ok(source.includes('safeStorageGetJson'));
assert.ok(source.includes('safeStorageSetJson'));
assert.ok(source.includes('40.80-r48-dual-playstyle-registry-central-storage'));
assert.ok(!source.includes('localStorage.'));
assert.ok(!source.includes('window.localStorage'));

console.log('r48 aprovada: catálogo vivo de estilos duplos usa storage centralizado sem acesso direto ao localStorage.');
