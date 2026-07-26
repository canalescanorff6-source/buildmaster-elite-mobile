import fs from 'node:fs';
import assert from 'node:assert/strict';

const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
const excluded = new Set(tsconfig.exclude || []);
const isolatedTypeProjects = [
  'tests/types-v3000',
  'tests/types-v3020',
  'tests/types-v3030',
  'tests/types-v3040',
  'tests/types-v3050',
  'tests/types-v3100',
  'tests/types-v3110',
  'tests/types-v3110-ui'
];

for (const directory of isolatedTypeProjects) {
  assert.equal(
    excluded.has(directory),
    true,
    `${directory} precisa ficar fora do typecheck global para não injetar stubs de React/Lucide no aplicativo.`
  );
}

const uiStub = fs.readFileSync('tests/types-v3110-ui/stubs.d.ts', 'utf8');
assert.match(uiStub, /declare module 'react'/);
assert.match(uiStub, /declare module 'lucide-react'/);

console.log('Isolamento do typecheck global aprovado: stubs de testes não contaminam React ou lucide-react.');
