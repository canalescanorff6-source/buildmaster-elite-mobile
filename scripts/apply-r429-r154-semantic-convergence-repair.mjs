import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R429_R154_SEMANTIC_CONVERGENCE_REPAIR_VERSION = '40.80-r429-r154-semantic-convergence-repair-v1';

const TARGET = 'tests/v40-80-r154-vault-action-feedback-source-regression.mjs';
const LEGACY_ASSERT = "assert.match(routeRepair,/const stableIds = \\\[\\.\\.\\.new Set\\(ids\\)\\]\\.filter\\(Boolean\\)\\.sort\\(\\);/);";
const SEMANTIC_ASSERTS = [
  'assert.match(routeRepair,/R424_FIX2_SEMANTIC_R417_CONVERGENCE/);',
  'assert.match(routeRepair,/batchHistoryR417/);',
  'assert.match(routeRepair,/batchRemoveHistoryR417/);',
  'assert.doesNotMatch(routeRepair,/stableIds/);',
].join(' ');

export function patchR154SemanticConvergenceR429(source) {
  if (source.includes('R424_FIX2_SEMANTIC_R417_CONVERGENCE') && source.includes('assert.doesNotMatch(routeRepair,/stableIds/);')) return source;
  const occurrences = source.split(LEGACY_ASSERT).length - 1;
  if (occurrences !== 1) {
    throw new Error(`R429: contrato legado R154/R424-fix2 inesperado; ocorrências=${occurrences}.`);
  }
  return source.replace(LEGACY_ASSERT, SEMANTIC_ASSERTS);
}

export function applyR429R154SemanticConvergenceRepair(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const file = path.resolve(root, TARGET);
  if (!fs.existsSync(file)) throw new Error(`R429: arquivo obrigatório ausente: ${TARGET}`);

  const before = fs.readFileSync(file, 'utf8');
  const after = patchR154SemanticConvergenceR429(before);
  const changed = after !== before;
  if (changed) fs.writeFileSync(file, after, 'utf8');

  const final = fs.readFileSync(file, 'utf8');
  for (const marker of [
    'R424_FIX2_SEMANTIC_R417_CONVERGENCE',
    'assert.match(routeRepair,/batchHistoryR417/);',
    'assert.match(routeRepair,/batchRemoveHistoryR417/);',
    'assert.doesNotMatch(routeRepair,/stableIds/);',
  ]) {
    if (!final.includes(marker)) throw new Error(`R429: regressão R154 não representa a convergência semântica atual: ${marker}`);
  }
  if (final.includes(LEGACY_ASSERT)) throw new Error('R429: asserção textual antiga de stableIds permaneceu ativa.');

  return { changed, patched: changed ? [TARGET] : [], version: R429_R154_SEMANTIC_CONVERGENCE_REPAIR_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR429R154SemanticConvergenceRepair(process.cwd());
  console.log(result.changed
    ? 'R429 corrigiu a regressão R154 para o contrato semântico R424-fix2.'
    : 'R429: regressão R154/R424-fix2 já estava convergida.');
}
