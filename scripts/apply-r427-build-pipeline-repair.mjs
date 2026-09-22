import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R427_BUILD_PIPELINE_REPAIR_VERSION = '40.80-r468-r427-forward-compatible-v4';

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

export function auditR427BuildPipelineContracts(sourceR407, sourceR420) {
  const r407Ok = sourceR407.includes('const sourceBudget=5.625*1024*1024;');
  const r420HasSavedAnalysisReplacement = sourceR420.includes(
    "type SavedAnalysis } from '@/modules/vault/cardHistoryStore';"
  );
  const r420OrderIndependent = (
    sourceR420.includes("(?:HISTORY_LIMIT, )?LEARNING_KEY")
    || sourceR420.includes("[^}]*\\bLEARNING_KEY\\b[^}]*\\bnormalizeHistoryList\\b[^}]*")
  );
  return {
    ok: r407Ok && r420HasSavedAnalysisReplacement && r420OrderIndependent,
    r407Ok,
    r420HasSavedAnalysisReplacement,
    r420OrderIndependent,
  };
}

export function patchR407SourceBudgetR427(source) {
  const legacy = 'const sourceBudget=5.25*1024*1024;';
  const previous = 'const sourceBudget=5.5*1024*1024;';
  const previousR432 = 'const sourceBudget=5.5625*1024*1024;';
  const current = 'const sourceBudget=5.625*1024*1024;';
  if (source.includes(current)) return source;
  if (source.includes(previousR432)) return source.replace(previousR432, current);
  if (source.includes(previous)) return source.replace(previous, current);
  if (source.includes(legacy)) return source.replace(legacy, current);
  throw new Error('R427: orçamento-fonte R407 não está no contrato esperado.');
}

export function patchR420SavedAnalysisImportR427(source) {
  const canonical = `  next = next.replace(
    /import \\{[^}]*\\bLEARNING_KEY\\b[^}]*\\bnormalizeHistoryList\\b[^}]*\\} from '@\\/modules\\/vault\\/cardHistoryStore';/,
    "import { LEARNING_KEY, normalizeHistoryList, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';"
  );
  if (!next.includes("type SavedAnalysis } from '@/modules/vault/cardHistoryStore';")) {
    throw new Error('R420/R427: o tipo SavedAnalysis não foi importado no runtime de backup.');
  }`;

  if (source.includes(canonical)) return source;

  const r449Generic = `  next = next.replace(
    /import \\{[^}]*\\bLEARNING_KEY\\b[^}]*\\bnormalizeHistoryList\\b[^}]*\\} from '@\\/modules\\/vault\\/cardHistoryStore';/,
    "import { LEARNING_KEY, normalizeHistoryList, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';"
  );`;
  if (source.includes(r449Generic)) return source.replace(r449Generic, canonical);

  const previousR427 = `  next = next.replace(
    /import \\{ (?:HISTORY_LIMIT, )?LEARNING_KEY, normalizeHistoryList(?:, type SavedAnalysis)? \\} from '@\\/modules\\/vault\\/cardHistoryStore';/,
    "import { LEARNING_KEY, normalizeHistoryList, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';"
  );
  if (!next.includes("type SavedAnalysis } from '@/modules/vault/cardHistoryStore';")) {
    throw new Error('R420/R427: o tipo SavedAnalysis não foi importado no runtime de backup.');
  }`;
  if (source.includes(previousR427)) return source.replace(previousR427, canonical);

  const legacy = `  next = next.replace(
    /import \\{ HISTORY_LIMIT, LEARNING_KEY, normalizeHistoryList \\} from '@\\/modules\\/vault\\/cardHistoryStore';/,
    "import { LEARNING_KEY, normalizeHistoryList, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';"
  );`;
  if (source.includes(legacy)) return source.replace(legacy, canonical);

  // Forward compatibility: if a newer release already provides the same semantic
  // replacement with an order-independent matcher, keep it and only add the guardrail.
  const semantic = auditR427BuildPipelineContracts('const sourceBudget=5.625*1024*1024;', source);
  if (semantic.r420HasSavedAnalysisReplacement && semantic.r420OrderIndependent) {
    if (source.includes("R420/R427: o tipo SavedAnalysis não foi importado")) return source;
    const replacementMarker = `    "import { LEARNING_KEY, normalizeHistoryList, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';"\n  );`;
    const count = source.split(replacementMarker).length - 1;
    if (count === 1) {
      return source.replace(
        replacementMarker,
        `${replacementMarker}\n  if (!next.includes("type SavedAnalysis } from '@/modules/vault/cardHistoryStore';")) {\n    throw new Error('R420/R427: o tipo SavedAnalysis não foi importado no runtime de backup.');\n  }`
      );
    }
  }

  throw new Error('R427: patch de importação R420 não está no contrato esperado.');
}

export function applyR427BuildPipelineRepair(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  let changed = false;

  const r407 = required(root, TARGETS.r407);
  const r420 = required(root, TARGETS.r420);
  const beforeAudit = auditR427BuildPipelineContracts(r407.source, r420.source);
  if (beforeAudit.ok) {
    return { changed: false, patched, version: R427_BUILD_PIPELINE_REPAIR_VERSION, audit: beforeAudit };
  }

  const r407Next = patchR407SourceBudgetR427(r407.source);
  changed = writeChanged(r407.file, r407.source, r407Next, TARGETS.r407, patched) || changed;

  const r420Next = patchR420SavedAnalysisImportR427(r420.source);
  changed = writeChanged(r420.file, r420.source, r420Next, TARGETS.r420, patched) || changed;

  const finalR407 = fs.readFileSync(r407.file, 'utf8');
  const finalR420 = fs.readFileSync(r420.file, 'utf8');
  const audit = auditR427BuildPipelineContracts(finalR407, finalR420);
  if (!audit.ok) {
    const missing = [];
    if (!audit.r407Ok) missing.push('R407 5,625 MiB');
    if (!audit.r420HasSavedAnalysisReplacement) missing.push('R420 SavedAnalysis');
    if (!audit.r420OrderIndependent) missing.push('R420 matcher order-independent');
    throw new Error(`R427: pipeline permaneceu divergente — ${missing.join(', ')}`);
  }

  return { changed, patched, version: R427_BUILD_PIPELINE_REPAIR_VERSION, audit };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR427BuildPipelineRepair(process.cwd());
  console.log(result.changed
    ? `R427/R450 corrigiu ${result.patched.length} contrato(s) do pipeline de build.`
    : 'R427/R450: pipeline já estava semanticamente convergido.');
}
