import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R418_FIX2_HISTORICAL_CONTRACTS_VERSION = '40.80-r418-fix2-historical-capacity-contracts-v1';

const FILES = {
  r407Generator: 'scripts/apply-r407-scalable-vault-capacity.mjs',
  r407Test: 'tests/v40-80-r407-unbounded-vault-capacity-regression.mjs',
  v3950Test: 'tests/v39-50-total-squad-library-integration-regression.mjs',
};

const OLD_R407_ASSERTION = 'for(const source of [lifecycle,actions,cloud])assert.match(source,/HISTORY_LIMIT/);';
const NEW_R407_TEST_ASSERTION = 'for(const source of [lifecycle,actions,cloud])assert.doesNotMatch(source,/\\.slice\\(0,\\s*HISTORY_LIMIT\\)/);';
const NEW_R407_GENERATOR_ASSERTION = 'for(const source of [lifecycle,actions,cloud])assert.doesNotMatch(source,/\\\\.slice\\\\(0,\\\\s*HISTORY_LIMIT\\\\)/);';

const OLD_V3950_BLOCK = `if (source.includes("map(sanitizePlayer)") && source.includes("SQUAD_MAPPING_STORAGE_KEY")) {
  assert.ok(source.includes("slice(0, 500)"));
}`;
const NEW_V3950_BLOCK = `if (source.includes("map(sanitizePlayer)") && source.includes("SQUAD_MAPPING_STORAGE_KEY")) {
  assert.doesNotMatch(source, /source\\.players[\\s\\S]{0,200}\\.slice\\(0,\\s*500\\)/);
  assert.doesNotMatch(source, /source\\.trials[\\s\\S]{0,200}\\.slice\\(0,\\s*100\\)/);
}`;

function patchRequiredText(file, oldText, newText, label) {
  if (!fs.existsSync(file)) throw new Error(`R418-fix2: arquivo obrigatório ausente: ${label}`);
  const source = fs.readFileSync(file, 'utf8');
  if (source.includes(newText)) return { changed: false, source };
  const count = source.split(oldText).length - 1;
  if (count !== 1) throw new Error(`R418-fix2: contrato histórico inesperado em ${label}; ocorrências=${count}`);
  const next = source.replace(oldText, newText);
  fs.writeFileSync(file, next, 'utf8');
  return { changed: true, source: next };
}

function validateConverged(root) {
  const generator = fs.readFileSync(path.resolve(root, FILES.r407Generator), 'utf8');
  const r407 = fs.readFileSync(path.resolve(root, FILES.r407Test), 'utf8');
  const v3950 = fs.readFileSync(path.resolve(root, FILES.v3950Test), 'utf8');

  if (generator.includes(OLD_R407_ASSERTION) || r407.includes(OLD_R407_ASSERTION)) {
    throw new Error('R418-fix2: R407 ainda exige HISTORY_LIMIT nas superfícies do Cofre.');
  }
  if (!generator.includes(NEW_R407_GENERATOR_ASSERTION) || !r407.includes(NEW_R407_TEST_ASSERTION)) {
    throw new Error('R418-fix2: R407 não protege a ausência de poda por HISTORY_LIMIT.');
  }
  if (v3950.includes('assert.ok(source.includes("slice(0, 500)"))')) {
    throw new Error('R418-fix2: v39.50 ainda exige teto artificial de 500 jogadores.');
  }
  if (!v3950.includes('assert.doesNotMatch(source, /source\\.players') || !v3950.includes('assert.doesNotMatch(source, /source\\.trials')) {
    throw new Error('R418-fix2: v39.50 não protege o contrato sem teto de jogadores/testes.');
  }
}

export function applyR418Fix2HistoricalCapacityContracts(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];

  const generator = patchRequiredText(
    path.resolve(root, FILES.r407Generator),
    OLD_R407_ASSERTION,
    NEW_R407_GENERATOR_ASSERTION,
    FILES.r407Generator,
  );
  if (generator.changed) patched.push(FILES.r407Generator);

  const r407 = patchRequiredText(
    path.resolve(root, FILES.r407Test),
    OLD_R407_ASSERTION,
    NEW_R407_TEST_ASSERTION,
    FILES.r407Test,
  );
  if (r407.changed) patched.push(FILES.r407Test);

  const v3950 = patchRequiredText(
    path.resolve(root, FILES.v3950Test),
    OLD_V3950_BLOCK,
    NEW_V3950_BLOCK,
    FILES.v3950Test,
  );
  if (v3950.changed) patched.push(FILES.v3950Test);

  validateConverged(root);
  return { changed: patched.length > 0, patched };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR418Fix2HistoricalCapacityContracts(process.cwd());
  console.log(result.changed
    ? `R418-fix2: contratos históricos de capacidade convergidos (${result.patched.length} arquivo(s)).`
    : 'R418-fix2: contratos históricos de capacidade já estavam convergidos.');
}
