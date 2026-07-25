import assert from 'node:assert/strict';
import fs from 'node:fs';

const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
for (const fixtureDirectory of ['tests/types-v2910', 'tests/types-v2920', 'tests/types-v2930', 'tests/types-v2940']) {
  assert.ok((tsconfig.exclude ?? []).includes(fixtureDirectory), `${fixtureDirectory} precisa ficar fora do typecheck principal`);
}
const registry = fs.readFileSync('src/modules/rules/officialRuleRegistry.ts', 'utf8');
assert.match(registry, /export type \{ LocalCardRule \}/);
assert.match(registry, /JSON\.stringify\(value\) \?\? 'null'/);
const facade = fs.readFileSync('src/modules/analysis/index.ts', 'utf8');
assert.match(facade, /export \{[\s\S]*analyzeCard,[\s\S]*parseCard/);
console.log('v29.30 TypeScript boundaries: OK');
