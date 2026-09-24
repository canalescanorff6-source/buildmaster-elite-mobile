import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { R443_GLOBAL_SOURCE_BUDGET_BYTES, R443_SOURCE_RESERVE_BYTES, R443_SOURCE_CHECKPOINT_BYTES } from './apply-r443-source-budget-convergence.mjs';

export const R432_SOURCE_BUDGET_CONVERGENCE_VERSION = '40.80-r468-r432-source-budget-convergence-v5';
export const R432_GLOBAL_SOURCE_BUDGET_BYTES = R443_GLOBAL_SOURCE_BUDGET_BYTES;
export const R432_SOURCE_RESERVE_BYTES = R443_SOURCE_RESERVE_BYTES;
export const R432_SOURCE_CHECKPOINT_BYTES = R443_SOURCE_CHECKPOINT_BYTES;

const TARGETS = Object.freeze({
  bundle: 'scripts/check-bundle-budget.mjs',
  r407: 'scripts/apply-r407-scalable-vault-capacity.mjs',
  r184: 'tests/v40-80-r184-production-legacy-isolation-regression.mjs',
  r414: 'scripts/apply-r414-ci-contract-convergence.mjs',
  r424Audit: 'scripts/audit-r424-final-requirements-closure.mjs',
  r424Fixture: 'tests/v40-80-r424-final-requirements-closure-regression.mjs',
});

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R432: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function replaceAllKnown(source, replacements) {
  let next = source;
  for (const [from, to] of replacements) next = next.split(from).join(to);
  return next;
}

function patchBundle(source) {
  return replaceAllKnown(source, [
    ['sourceTs: 5.25 * 1024 * 1024', 'sourceTs: 5.625 * 1024 * 1024'],
    ['sourceTs: 5.5 * 1024 * 1024', 'sourceTs: 5.625 * 1024 * 1024'],
  ]);
}

function patchR407(source) {
  return replaceAllKnown(source, [
    ['const sourceBudget=5.25*1024*1024;', 'const sourceBudget=5.625*1024*1024;'],
    ['const sourceBudget=5.5*1024*1024;', 'const sourceBudget=5.625*1024*1024;'],
    ['const sourceBudget=5.5625*1024*1024;', 'const sourceBudget=5.625*1024*1024;'],
  ]);
}

function patchR184(source) {
  return replaceAllKnown(source, [
    ['const sourceLimit=5.25*1024*1024;', 'const sourceLimit=5.625*1024*1024;'],
    ['const sourceLimit=5.5*1024*1024;', 'const sourceLimit=5.625*1024*1024;'],
  ]);
}

function patchR414(source) {
  return replaceAllKnown(source, [
    ['R414_SOURCE_BUDGET_BYTES = 5_405_024', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
    ['R414_SOURCE_BUDGET_BYTES = 5_667_168', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
    ['5,25 MiB', '5,625 MiB'],
    ['5,5 MiB', '5,625 MiB'],
    ["sourceTs: 5.25 * 1024 * 1024", "sourceTs: 5.625 * 1024 * 1024"],
    ["sourceTs: 5.5 * 1024 * 1024", "sourceTs: 5.625 * 1024 * 1024"],
    ['5\\.25\\s*\\*\\s*1024', '5\\.5625\\s*\\*\\s*1024'],
    ['5\\.5\\s*\\*\\s*1024', '5\\.5625\\s*\\*\\s*1024'],
    ['sourceGlobalLimitBytes: 5.25 * 1024 * 1024', 'sourceGlobalLimitBytes: 5.625 * 1024 * 1024'],
    ['sourceGlobalLimitBytes: 5.5 * 1024 * 1024', 'sourceGlobalLimitBytes: 5.625 * 1024 * 1024'],
  ]);
}

function patchR424Audit(source) {
  return replaceAllKnown(source, [
    ['5.25 * 1024 * 1024', '5.625 * 1024 * 1024'],
    ['5.5 * 1024 * 1024', '5.625 * 1024 * 1024'],
    ['5\\.25\\s*\\*\\s*1024', '5\\.5625\\s*\\*\\s*1024'],
    ['5\\.5\\s*\\*\\s*1024', '5\\.5625\\s*\\*\\s*1024'],
    ['5_405_024', '5_832_704'],
    ['5_667_168', '5_832_704'],
    ['5,25 MiB', '5,625 MiB'],
    ['5,5 MiB', '5,625 MiB'],
  ]);
}

function patchR424Fixture(source) {
  return replaceAllKnown(source, [
    ['sourceTs: 5.25 * 1024 * 1024', 'sourceTs: 5.625 * 1024 * 1024'],
    ['sourceTs: 5.5 * 1024 * 1024', 'sourceTs: 5.625 * 1024 * 1024'],
    ['R414_SOURCE_BUDGET_BYTES = 5_405_024', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
    ['R414_SOURCE_BUDGET_BYTES = 5_667_168', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
  ]);
}

const PATCHERS = Object.freeze({
  bundle: patchBundle,
  r407: patchR407,
  r184: patchR184,
  r414: patchR414,
  r424Audit: patchR424Audit,
  r424Fixture: patchR424Fixture,
});

export function auditR432SourceBudgetConvergence(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const issues = [];
  const content = {};
  for (const [key, relative] of Object.entries(TARGETS)) {
    const file = path.resolve(root, relative);
    if (!fs.existsSync(file)) {
      issues.push(`${relative}: arquivo ausente.`);
      content[key] = '';
      continue;
    }
    content[key] = fs.readFileSync(file, 'utf8');
  }

  if (!content.bundle.includes('sourceTs: 5.625 * 1024 * 1024')) issues.push(`${TARGETS.bundle}: teto global não está em 5,625 MiB.`);
  if (!content.r407.includes('const sourceBudget=5.625*1024*1024;') && !(content.r407.includes('const sourceBudget=R443_GLOBAL_SOURCE_BUDGET_BYTES;') && content.r407.includes('R443_SOURCE_CHECKPOINT_BYTES'))) issues.push(`${TARGETS.r407}: R407 não usa a autoridade canônica de 5,625 MiB.`);
  if (!content.r184.includes('const sourceLimit=5.625*1024*1024;')) issues.push(`${TARGETS.r184}: R184 não usa 5,625 MiB.`);
  if (!content.r184.includes('minimumMargin=r414ScalableVault ? 65_536 : legacyMinimumMargin')
      && !/minimumMargin\s*=\s*r414ScalableVault\s*\?\s*65_536\s*:\s*legacyMinimumMargin/.test(content.r184)) {
    issues.push(`${TARGETS.r184}: reserva mínima de 64 KiB ausente.`);
  }
  if (!content.r414.includes('R414_SOURCE_BUDGET_BYTES = 5_832_704')) issues.push(`${TARGETS.r414}: checkpoint R414 não está em 5.832.704 bytes.`);
  if (!content.r414.includes('sourceTs: 5.625 * 1024 * 1024')) issues.push(`${TARGETS.r414}: guardrail global R414 ainda diverge.`);
  if (!content.r424Audit.includes('5_832_704') || !content.r424Audit.includes('5,625 MiB')) issues.push(`${TARGETS.r424Audit}: auditoria R424 ainda valida o baseline antigo.`);
  if (!content.r424Fixture.includes('sourceTs: 5.625 * 1024 * 1024') || !content.r424Fixture.includes('R414_SOURCE_BUDGET_BYTES = 5_832_704')) issues.push(`${TARGETS.r424Fixture}: fixture R424 ainda representa 5,625 MiB.`);

  for (const [key, source] of Object.entries(content)) {
    if (/5\.25\s*\*\s*1024\s*\*\s*1024|5_405_024|5,25 MiB/.test(source)) {
      issues.push(`${TARGETS[key]}: marcador antigo de orçamento ainda presente.`);
    }
  }

  return {
    version: R432_SOURCE_BUDGET_CONVERGENCE_VERSION,
    ok: issues.length === 0,
    issues,
    globalSourceBudgetBytes: R432_GLOBAL_SOURCE_BUDGET_BYTES,
    reserveBytes: R432_SOURCE_RESERVE_BYTES,
    checkpointBytes: R432_SOURCE_CHECKPOINT_BYTES,
  };
}

export function applyR432SourceBudgetConvergence(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  let changed = false;

  for (const [key, relative] of Object.entries(TARGETS)) {
    const { file, source } = readRequired(root, relative);
    const next = PATCHERS[key](source);
    if (next !== source) {
      fs.writeFileSync(file, next, 'utf8');
      patched.push(relative);
      changed = true;
    }
  }

  const audit = auditR432SourceBudgetConvergence(root);
  if (!audit.ok) throw new Error(`R432: orçamento-fonte ainda divergente — ${audit.issues.join(' | ')}`);
  return { changed, patched, audit, version: R432_SOURCE_BUDGET_CONVERGENCE_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR432SourceBudgetConvergence(process.cwd());
  console.log(result.changed
    ? `R432 convergiu ${result.patched.length} contrato(s) de orçamento-fonte em 5,625 MiB com reserva de 64 KiB.`
    : 'R432: orçamento-fonte já estava convergido em 5,625 MiB com reserva de 64 KiB.');
}
