import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const root = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
const app = JSON.parse(fs.readFileSync('tsconfig.app.json', 'utf8'));

assert.match(pkg.scripts.typecheck, /-p\s+tsconfig\.app\.json/);
assert.equal(new Set(root.exclude || []).has('tests'), true);
assert.equal(new Set(app.exclude || []).has('tests'), true);
assert.equal((root.include || []).some((item) => item === '**/*.ts' || item.startsWith('tests')), false);
assert.equal((app.include || []).some((item) => item === '**/*.ts' || item.startsWith('tests')), false);

const uiStub = fs.readFileSync('tests/types-v3110-ui/stubs.d.ts', 'utf8');
assert.match(uiStub, /declare module 'react'/);
assert.match(uiStub, /declare module 'lucide-react'/);

console.log('Isolamento do typecheck global aprovado: o aplicativo não carrega fixtures de React, Lucide ou módulos internos.');
