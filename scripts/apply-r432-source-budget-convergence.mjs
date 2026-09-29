import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { R443_GLOBAL_SOURCE_BUDGET_BYTES, R443_SOURCE_RESERVE_BYTES, R443_SOURCE_CHECKPOINT_BYTES } from './apply-r443-source-budget-convergence.mjs';

export const R432_SOURCE_BUDGET_CONVERGENCE_VERSION = '40.80-r517-r432-source-budget-convergence-v7';
export const R432_GLOBAL_SOURCE_BUDGET_BYTES = R443_GLOBAL_SOURCE_BUDGET_BYTES;
export const R432_SOURCE_RESERVE_BYTES = R443_SOURCE_RESERVE_BYTES;
export const R432_SOURCE_CHECKPOINT_BYTES = R443_SOURCE_CHECKPOINT_BYTES;

const GLOBAL_LITERAL = '5.765625';
const CHECKPOINT_LITERAL = '5_980_160';
const GLOBAL_LABEL = '5,765625 MiB';

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
    ['sourceTs: 5.25 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceTs: 5.5 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceTs: 5.5625 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceTs: 5.625 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceTs: 5.75 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
  ]);
}

function patchR407(source) {
  return replaceAllKnown(source, [
    ['const sourceBudget=5.25*1024*1024;', `const sourceBudget=${GLOBAL_LITERAL}*1024*1024;`],
    ['const sourceBudget=5.5*1024*1024;', `const sourceBudget=${GLOBAL_LITERAL}*1024*1024;`],
    ['const sourceBudget=5.5625*1024*1024;', `const sourceBudget=${GLOBAL_LITERAL}*1024*1024;`],
    ['const sourceBudget=5.625*1024*1024;', `const sourceBudget=${GLOBAL_LITERAL}*1024*1024;`],
    ['const sourceBudget=5.75*1024*1024;', `const sourceBudget=${GLOBAL_LITERAL}*1024*1024;`],
  ]);
}

function patchR184(source) {
  return replaceAllKnown(source, [
    ['const sourceLimit=5.25*1024*1024;', `const sourceLimit=${GLOBAL_LITERAL}*1024*1024;`],
    ['const sourceLimit=5.5*1024*1024;', `const sourceLimit=${GLOBAL_LITERAL}*1024*1024;`],
    ['const sourceLimit=5.5625*1024*1024;', `const sourceLimit=${GLOBAL_LITERAL}*1024*1024;`],
    ['const sourceLimit=5.625*1024*1024;', `const sourceLimit=${GLOBAL_LITERAL}*1024*1024;`],
    ['const sourceLimit=5.75*1024*1024;', `const sourceLimit=${GLOBAL_LITERAL}*1024*1024;`],
  ]);
}

function patchR414(source) {
  return replaceAllKnown(source, [
    ['R414_SOURCE_BUDGET_BYTES = 5_405_024', `R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT_LITERAL}`],
    ['R414_SOURCE_BUDGET_BYTES = 5_667_168', `R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT_LITERAL}`],
    ['R414_SOURCE_BUDGET_BYTES = 5_732_704', `R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT_LITERAL}`],
    ['R414_SOURCE_BUDGET_BYTES = 5_832_704', `R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT_LITERAL}`],
    ['R414_SOURCE_BUDGET_BYTES = 5_963_776', `R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT_LITERAL}`],
    ['5,25 MiB', GLOBAL_LABEL],
    ['5,5 MiB', GLOBAL_LABEL],
    ['5,5625 MiB', GLOBAL_LABEL],
    ['5,625 MiB', GLOBAL_LABEL],
    ['5,75 MiB', GLOBAL_LABEL],
    ['sourceTs: 5.25 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceTs: 5.5 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceTs: 5.5625 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceTs: 5.625 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceTs: 5.75 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['5\\.25\\s*\\*\\s*1024', '5\\.765625\\s*\\*\\s*1024'],
    ['5\\.5\\s*\\*\\s*1024', '5\\.765625\\s*\\*\\s*1024'],
    ['5\\.5625\\s*\\*\\s*1024', '5\\.765625\\s*\\*\\s*1024'],
    ['5\\.625\\s*\\*\\s*1024', '5\\.765625\\s*\\*\\s*1024'],
    ['5\\.75\\s*\\*\\s*1024', '5\\.765625\\s*\\*\\s*1024'],
    ['sourceGlobalLimitBytes: 5.25 * 1024 * 1024', `sourceGlobalLimitBytes: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceGlobalLimitBytes: 5.5 * 1024 * 1024', `sourceGlobalLimitBytes: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceGlobalLimitBytes: 5.5625 * 1024 * 1024', `sourceGlobalLimitBytes: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceGlobalLimitBytes: 5.625 * 1024 * 1024', `sourceGlobalLimitBytes: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceGlobalLimitBytes: 5.75 * 1024 * 1024', `sourceGlobalLimitBytes: ${GLOBAL_LITERAL} * 1024 * 1024`],
  ]);
}

function patchR424Audit(source) {
  return replaceAllKnown(source, [
    ['5.25 * 1024 * 1024', `${GLOBAL_LITERAL} * 1024 * 1024`],
    ['5.5 * 1024 * 1024', `${GLOBAL_LITERAL} * 1024 * 1024`],
    ['5.5625 * 1024 * 1024', `${GLOBAL_LITERAL} * 1024 * 1024`],
    ['5.625 * 1024 * 1024', `${GLOBAL_LITERAL} * 1024 * 1024`],
    ['5.75 * 1024 * 1024', `${GLOBAL_LITERAL} * 1024 * 1024`],
    ['5\\.25\\s*\\*\\s*1024', '5\\.765625\\s*\\*\\s*1024'],
    ['5\\.5\\s*\\*\\s*1024', '5\\.765625\\s*\\*\\s*1024'],
    ['5\\.5625\\s*\\*\\s*1024', '5\\.765625\\s*\\*\\s*1024'],
    ['5\\.625\\s*\\*\\s*1024', '5\\.765625\\s*\\*\\s*1024'],
    ['5\\.75\\s*\\*\\s*1024', '5\\.765625\\s*\\*\\s*1024'],
    ['5_405_024', CHECKPOINT_LITERAL],
    ['5_667_168', CHECKPOINT_LITERAL],
    ['5_732_704', CHECKPOINT_LITERAL],
    ['5_832_704', CHECKPOINT_LITERAL],
    ['5_963_776', CHECKPOINT_LITERAL],
    ['5,25 MiB', GLOBAL_LABEL],
    ['5,5 MiB', GLOBAL_LABEL],
    ['5,5625 MiB', GLOBAL_LABEL],
    ['5,625 MiB', GLOBAL_LABEL],
    ['5,75 MiB', GLOBAL_LABEL],
  ]);
}

function patchR424Fixture(source) {
  return replaceAllKnown(source, [
    ['sourceTs: 5.25 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceTs: 5.5 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceTs: 5.5625 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceTs: 5.625 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['sourceTs: 5.75 * 1024 * 1024', `sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`],
    ['R414_SOURCE_BUDGET_BYTES = 5_405_024', `R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT_LITERAL}`],
    ['R414_SOURCE_BUDGET_BYTES = 5_667_168', `R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT_LITERAL}`],
    ['R414_SOURCE_BUDGET_BYTES = 5_732_704', `R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT_LITERAL}`],
    ['R414_SOURCE_BUDGET_BYTES = 5_832_704', `R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT_LITERAL}`],
    ['R414_SOURCE_BUDGET_BYTES = 5_963_776', `R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT_LITERAL}`],
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

  if (!content.bundle.includes(`sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`)) issues.push(`${TARGETS.bundle}: teto global não está em ${GLOBAL_LABEL}.`);
  if (!content.r407.includes(`const sourceBudget=${GLOBAL_LITERAL}*1024*1024;`) && !(content.r407.includes('R443_GLOBAL_SOURCE_BUDGET_BYTES') && content.r407.includes('R443_SOURCE_CHECKPOINT_BYTES'))) issues.push(`${TARGETS.r407}: R407 não usa a autoridade canônica R443/R517.`);
  if (!content.r184.includes(`const sourceLimit=${GLOBAL_LITERAL}*1024*1024;`)) issues.push(`${TARGETS.r184}: R184 não usa ${GLOBAL_LABEL}.`);
  if (!content.r184.includes('minimumMargin=r414ScalableVault ? 65_536 : legacyMinimumMargin')
      && !/minimumMargin\s*=\s*r414ScalableVault\s*\?\s*65_536\s*:\s*legacyMinimumMargin/.test(content.r184)) {
    issues.push(`${TARGETS.r184}: reserva mínima de 64 KiB ausente.`);
  }
  if (!content.r414.includes(`R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT_LITERAL}`)) issues.push(`${TARGETS.r414}: checkpoint R414 não está em ${CHECKPOINT_LITERAL.replaceAll('_', '.')} bytes.`);
  if (!content.r414.includes(`sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`)) issues.push(`${TARGETS.r414}: guardrail global R414 ainda diverge.`);
  if (!content.r424Audit.includes(CHECKPOINT_LITERAL) || !content.r424Audit.includes(GLOBAL_LABEL)) issues.push(`${TARGETS.r424Audit}: auditoria R424 ainda valida baseline anterior.`);
  if (!content.r424Fixture.includes(`sourceTs: ${GLOBAL_LITERAL} * 1024 * 1024`) || !content.r424Fixture.includes(`R414_SOURCE_BUDGET_BYTES = ${CHECKPOINT_LITERAL}`)) issues.push(`${TARGETS.r424Fixture}: fixture R424 ainda representa baseline anterior.`);

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
    ? `R432 convergiu ${result.patched.length} contrato(s) de orçamento-fonte em ${GLOBAL_LABEL} com reserva de 64 KiB.`
    : `R432: orçamento-fonte já estava convergido em ${GLOBAL_LABEL} com reserva de 64 KiB.`);
}
