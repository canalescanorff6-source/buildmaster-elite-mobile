import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { applyR418Fix2HistoricalCapacityContracts } = await import(pathToFileURL(path.resolve('scripts/apply-r418-fix2-historical-contracts.mjs')).href);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-r418-fix2-'));
const write = (relative, source) => {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source, 'utf8');
};
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const oldR407 = 'for(const source of [lifecycle,actions,cloud])assert.match(source,/HISTORY_LIMIT/);';
write('scripts/apply-r407-scalable-vault-capacity.mjs', `const testSource=\`x\\n${oldR407}\\ny\`;`);
write('tests/v40-80-r407-unbounded-vault-capacity-regression.mjs', `${oldR407}\n`);
write('tests/v39-50-total-squad-library-integration-regression.mjs', `if (source.includes("map(sanitizePlayer)") && source.includes("SQUAD_MAPPING_STORAGE_KEY")) {\n  assert.ok(source.includes("slice(0, 500)"));\n}\n`);

assert.match(read('scripts/apply-r407-scalable-vault-capacity.mjs'), /assert\.match\(source,\/HISTORY_LIMIT\/\)/, 'RED: gerador R407 precisa começar com contrato obsoleto.');
assert.match(read('tests/v39-50-total-squad-library-integration-regression.mjs'), /slice\(0, 500\)/, 'RED: v39.50 precisa começar exigindo teto de 500.');

const first = applyR418Fix2HistoricalCapacityContracts(root);
assert.equal(first.changed, true);
assert.equal(first.patched.length, 3);
for (const relative of ['scripts/apply-r407-scalable-vault-capacity.mjs','tests/v40-80-r407-unbounded-vault-capacity-regression.mjs']) {
  assert.doesNotMatch(read(relative), /assert\.match\(source,\/HISTORY_LIMIT\/\)/);
  assert.ok(read(relative).includes('assert.doesNotMatch(source,'));
}
const v3950 = read('tests/v39-50-total-squad-library-integration-regression.mjs');
assert.doesNotMatch(v3950, /assert\.ok\(source\.includes\("slice\(0, 500\)"\)\)/);
assert.match(v3950, /source\\\.players/);
assert.match(v3950, /source\\\.trials/);

const second = applyR418Fix2HistoricalCapacityContracts(root);
assert.equal(second.changed, false, 'R418-fix2 precisa ser idempotente.');
console.log('R418-fix2 aprovado: contratos históricos não exigem mais tetos removidos pela R418.');
