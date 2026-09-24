import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyR427BuildPipelineRepair, patchR407SourceBudgetR427 } from '../scripts/apply-r427-build-pipeline-repair.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-r427-'));
fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });

fs.writeFileSync(
  path.join(root, 'scripts/apply-r407-scalable-vault-capacity.mjs'),
  `export function x(){\n const sourceBudget=5.25*1024*1024;\n const ceiling=sourceBudget-100_000;\n return ceiling;\n}\n`,
);

fs.writeFileSync(
  path.join(root, 'scripts/apply-r420-persistence-recovery-closure.mjs'),
  `function patchBackup(source) {\n  let next = source;\n  next = next.replace(\n    /import \\{ HISTORY_LIMIT, LEARNING_KEY, normalizeHistoryList \\} from '@\\/modules\\/vault\\/cardHistoryStore';/,\n    \"import { LEARNING_KEY, normalizeHistoryList, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';\"\n  );\n  return next;\n}\n`,
);

const first = applyR427BuildPipelineRepair(root);
assert.equal(first.changed, true);
assert.deepEqual(first.patched.sort(), [
  'scripts/apply-r407-scalable-vault-capacity.mjs',
  'scripts/apply-r420-persistence-recovery-closure.mjs',
].sort());

const r407 = fs.readFileSync(path.join(root, 'scripts/apply-r407-scalable-vault-capacity.mjs'), 'utf8');
const r420 = fs.readFileSync(path.join(root, 'scripts/apply-r420-persistence-recovery-closure.mjs'), 'utf8');
assert.match(r407, /sourceBudget=5\.625\*1024\*1024/);
assert.doesNotMatch(r407, /sourceBudget=5\.25\*1024\*1024/);
assert.match(r420, /\(\?:HISTORY_LIMIT, \)\?LEARNING_KEY/);
assert.match(r420, /R420\/R427: o tipo SavedAnalysis não foi importado/);

const importPattern = /import \{ (?:HISTORY_LIMIT, )?LEARNING_KEY, normalizeHistoryList(?:, type SavedAnalysis)? \} from '@\/modules\/vault\/cardHistoryStore';/;
assert.match("import { HISTORY_LIMIT, LEARNING_KEY, normalizeHistoryList } from '@/modules/vault/cardHistoryStore';", importPattern);
assert.match("import { LEARNING_KEY, normalizeHistoryList } from '@/modules/vault/cardHistoryStore';", importPattern);
assert.match("import { LEARNING_KEY, normalizeHistoryList, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';", importPattern);

const second = applyR427BuildPipelineRepair(root);
assert.equal(second.changed, false, 'R427 deve ser idempotente');
const canonicalR407 = "const sourceBudget=R443_GLOBAL_SOURCE_BUDGET_BYTES; const ceiling=R443_SOURCE_CHECKPOINT_BYTES;";
assert.equal(patchR407SourceBudgetR427(canonicalR407), canonicalR407, 'R427 deve aceitar o orçamento canônico R443 sem reescrever.');
assert.deepEqual(second.patched, []);

console.log('R427 aprovada: orçamento R407 convergido em 5,625 MiB e R420 importa SavedAnalysis mesmo após R418 remover HISTORY_LIMIT.');
