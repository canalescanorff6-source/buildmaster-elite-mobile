import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyR429R154SemanticConvergenceRepair, patchR154SemanticConvergenceR429 } from '../scripts/apply-r429-r154-semantic-convergence-repair.mjs';

const legacy = "assert.match(routeRepair,/const stableIds = \\\[\\.\\.\\.new Set\\(ids\\)\\]\\.filter\\(Boolean\\)\\.sort\\(\\);/);";
const repaired = patchR154SemanticConvergenceR429(`before\n${legacy}\nafter\n`);
assert.doesNotMatch(repaired, /assert\.match\(routeRepair,\/const stableIds/);
for (const marker of [
  'R424_FIX2_SEMANTIC_R417_CONVERGENCE',
  'assert.match(routeRepair,/batchHistoryR417/);',
  'assert.match(routeRepair,/batchRemoveHistoryR417/);',
  'assert.doesNotMatch(routeRepair,/stableIds/);',
]) assert.ok(repaired.includes(marker), `marcador ausente: ${marker}`);

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-r429-'));
fs.mkdirSync(path.join(root, 'tests'), { recursive: true });
const target = path.join(root, 'tests/v40-80-r154-vault-action-feedback-source-regression.mjs');
fs.writeFileSync(target, `assert.match(routeRepair,/export function hasConvergedR417/); ${legacy} assert.match(routeRepair,/applyR418UnboundedCapacity/);`, 'utf8');

const first = applyR429R154SemanticConvergenceRepair(root);
assert.equal(first.changed, true);
assert.deepEqual(first.patched, ['tests/v40-80-r154-vault-action-feedback-source-regression.mjs']);
const fixed = fs.readFileSync(target, 'utf8');
assert.match(fixed, /R424_FIX2_SEMANTIC_R417_CONVERGENCE/);
assert.match(fixed, /batchHistoryR417/);
assert.match(fixed, /batchRemoveHistoryR417/);
assert.match(fixed, /doesNotMatch\(routeRepair,\/stableIds\//);

const second = applyR429R154SemanticConvergenceRepair(root);
assert.equal(second.changed, false, 'R429 deve ser idempotente');
assert.deepEqual(second.patched, []);

const canonicalRouteRepair = `
export function hasConvergedR417(projectRoot = process.cwd()) {
  // R424_FIX2_SEMANTIC_R417_CONVERGENCE: detalhes internos de implementação não definem a autoridade R417.
  return (
    sourceHas(projectRoot, 'src/hooks/useCardVisionVaultActionsR185.ts', ['batchHistoryR417', "action === 'delete'"]) &&
    sourceHas(projectRoot, 'src/modules/vault/vaultHistoryMutationsR129.ts', ['batchRemoveHistoryR417'])
  );
}`;
assert.match(canonicalRouteRepair,/R424_FIX2_SEMANTIC_R417_CONVERGENCE/);
assert.match(canonicalRouteRepair,/batchHistoryR417/);
assert.match(canonicalRouteRepair,/batchRemoveHistoryR417/);
assert.doesNotMatch(canonicalRouteRepair,/stableIds/);

console.log('R429 aprovada: R154 valida a autoridade R417 pela convergência semântica R424-fix2, não por detalhe interno stableIds.');
