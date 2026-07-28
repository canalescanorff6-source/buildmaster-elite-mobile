import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const root = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
const app = JSON.parse(fs.readFileSync('tsconfig.app.json', 'utf8'));

assert.match(pkg.scripts.typecheck, /^tsc -p tsconfig\.app\.json /);
for (const config of [root, app]) {
  assert.equal(new Set(config.exclude || []).has('tests'), true);
  assert.equal((config.include || []).some((value) => value.includes('tests') || value === '**/*.ts' || value === '**/*.tsx'), false);
}
const lucideStub = fs.readFileSync('tests/types-v3170-ui/stubs.d.ts', 'utf8');
assert.match(lucideStub, /declare module 'lucide-react'/);
assert.match(lucideStub, /export const Video/);
const analyzerStub = lucideStub;
assert.match(analyzerStub, /declare module '@\/lib\/analyzer'/);

console.log('Regressão v31.70 aprovada: stubs parciais não podem substituir os tipos reais no build principal.');
