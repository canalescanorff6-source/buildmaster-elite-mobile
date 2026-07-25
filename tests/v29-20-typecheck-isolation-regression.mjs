import fs from 'node:fs';

const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
const excluded = new Set(tsconfig.exclude ?? []);
const failures = [];

for (const fixtureDirectory of ['tests/types-v2910', 'tests/types-v2920']) {
  if (!excluded.has(fixtureDirectory)) {
    failures.push(`${fixtureDirectory} precisa ficar fora do typecheck principal.`);
  }
}

const advancedBuildTest = fs.readFileSync('tests/v28-60-advanced-build-intelligence-regression.ts', 'utf8');
if (!advancedBuildTest.includes('maxOverall: result.parsed.maxOverall ?? null')) {
  failures.push('O teste do Bloco 7 precisa normalizar maxOverall indefinido para null.');
}

for (const fixture of ['tests/types-v2910/stubs.d.ts', 'tests/types-v2920/stubs.d.ts']) {
  if (!fs.existsSync(fixture)) failures.push(`Fixture isolada ausente: ${fixture}`);
}

if (failures.length) {
  console.error('Falha na regressão de isolamento do TypeScript:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Regressão de isolamento do TypeScript aprovada.');
