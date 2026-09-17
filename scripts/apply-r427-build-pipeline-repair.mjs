import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R427_BUILD_PIPELINE_REPAIR_VERSION = '40.80-r427-build-pipeline-repair-v1';

const TARGETS = Object.freeze({
  r407: 'scripts/apply-r407-scalable-vault-capacity.mjs',
  r420: 'scripts/apply-r420-persistence-recovery-closure.mjs',
});

function required(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R427: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function writeChanged(file, before, after, relative, patched) {
  if (before === after) return false;
  fs.writeFileSync(file, after, 'utf8');
  patched.push(relative);
  return true;
}

export function patchR407SourceBudgetR427(source) {
  const legacy = 'const sourceBudget=5.25*1024*1024;';
  const current = 'const sourceBudget=5.5*1024*1024;';
  if (source.includes(current)) return source;
  if (!source.includes(legacy)) {
    throw new Error('R427: orçamento-fonte R407 não está no contrato esperado.');
  }
  return source.replace(legacy, current);
}

export function patchR420SavedAnalysisImportR427(source) {
  const legacy = `  next = next.replace(
    /import \\{ HISTORY_LIMIT, LEARNING_KEY, normalizeHistoryList \\} from '@\\/modules\\/vault\\/cardHistoryStore';/,
    "import { LEARNING_KEY, normalizeHistoryList, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';"
  );`;
  const repaired = `  next = next.replace(
    /import \\{ (?:HISTORY_LIMIT, )?LEARNING_KEY, normalizeHistoryList(?:, type SavedAnalysis)? \\} from '@\\/modules\\/vault\\/cardHistoryStore';/,
    "import { LEARNING_KEY, normalizeHistoryList, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';"
  );
  if (!next.includes("type SavedAnalysis } from '@/modules/vault/cardHistoryStore';")) {
    throw new Error('R420/R427: o tipo SavedAnalysis não foi importado no runtime de backup.');
  }`;

  if (source.includes(repaired)) return source;
  if (!source.includes(legacy)) {
    throw new Error('R427: patch de importação R420 não está no contrato esperado.');
  }
  return source.replace(legacy, repaired);
}

export function applyR427BuildPipelineRepair(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  let changed = false;

  const r407 = required(root, TARGETS.r407);
  const r407Next = patchR407SourceBudgetR427(r407.source);
  changed = writeChanged(r407.file, r407.source, r407Next, TARGETS.r407, patched) || changed;

  const r420 = required(root, TARGETS.r420);
  const r420Next = patchR420SavedAnalysisImportR427(r420.source);
  changed = writeChanged(r420.file, r420.source, r420Next, TARGETS.r420, patched) || changed;

  const finalR407 = fs.readFileSync(r407.file, 'utf8');
  const finalR420 = fs.readFileSync(r420.file, 'utf8');
  if (!finalR407.includes('const sourceBudget=5.5*1024*1024;')) {
    throw new Error('R427: R407 permaneceu com orçamento-fonte antigo.');
  }
  if (!finalR420.includes('(?:HISTORY_LIMIT, )?LEARNING_KEY')) {
    throw new Error('R427: R420 permaneceu dependente da ordem R418 → R420.');
  }
  if (!finalR420.includes('R420/R427: o tipo SavedAnalysis não foi importado')) {
    throw new Error('R427: guardrail de SavedAnalysis não foi materializado.');
  }

  return { changed, patched, version: R427_BUILD_PIPELINE_REPAIR_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR427BuildPipelineRepair(process.cwd());
  console.log(result.changed
    ? `R427 corrigiu ${result.patched.length} contrato(s) do pipeline de build.`
    : 'R427: pipeline de build já estava convergido.');
}
