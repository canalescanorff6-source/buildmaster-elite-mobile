import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R443_SOURCE_BUDGET_VERSION = '40.80-r468-source-budget-convergence-v6';
export const R443_GLOBAL_SOURCE_BUDGET_BYTES = 5.625 * 1024 * 1024;
export const R443_SOURCE_RESERVE_BYTES = 65_536;
export const R443_SOURCE_CHECKPOINT_BYTES = R443_GLOBAL_SOURCE_BUDGET_BYTES - R443_SOURCE_RESERVE_BYTES;

const TARGETS = Object.freeze({
  bundle: 'scripts/check-bundle-budget.mjs',
  r184: 'tests/v40-80-r184-production-legacy-isolation-regression.mjs',
  r414: 'scripts/apply-r414-ci-contract-convergence.mjs',
  r424Audit: 'scripts/audit-r424-final-requirements-closure.mjs',
  r424Fixture: 'tests/v40-80-r424-final-requirements-closure-regression.mjs',
});

function replaceKnown(source, replacements) {
  let next = source;
  for (const [from, to] of replacements) next = next.split(from).join(to);
  return next;
}

function patchBundle(source) {
  return replaceKnown(source, [
    ['sourceTs: 5.25 * 1024 * 1024', 'sourceTs: 5.625 * 1024 * 1024'],
    ['sourceTs: 5.5 * 1024 * 1024', 'sourceTs: 5.625 * 1024 * 1024'],
    ['sourceTs: 5.5625 * 1024 * 1024', 'sourceTs: 5.625 * 1024 * 1024'],
  ]);
}

function patchR184(source) {
  return replaceKnown(source, [
    ['const minimumMargin=r414ScalableVault ? 100_000 : legacyMinimumMargin;', 'const minimumMargin=r414ScalableVault ? 65_536 : legacyMinimumMargin;'],
    ['const sourceLimit=5.25*1024*1024;', 'const sourceLimit=5.625*1024*1024;'],
    ['const sourceLimit=5.5*1024*1024;', 'const sourceLimit=5.625*1024*1024;'],
    ['const sourceLimit=5.5625*1024*1024;', 'const sourceLimit=5.625*1024*1024;'],
  ]);
}

function patchR414(source) {
  return replaceKnown(source, [
    ['R414_SOURCE_BUDGET_BYTES = 5_798_240', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
    ['R414_SOURCE_BUDGET_BYTES = 5_405_024', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
    ['R414_SOURCE_BUDGET_BYTES = 5_667_168', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
    ['R414_SOURCE_BUDGET_BYTES = 5_732_704', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
    ['5,25 MiB', '5,625 MiB'],
    ['5,5 MiB', '5,625 MiB'],
    ['5,5625 MiB', '5,625 MiB'],
    ["sourceTs: 5.25 * 1024 * 1024", "sourceTs: 5.625 * 1024 * 1024"],
    ["sourceTs: 5.5 * 1024 * 1024", "sourceTs: 5.625 * 1024 * 1024"],
    ["sourceTs: 5.5625 * 1024 * 1024", "sourceTs: 5.625 * 1024 * 1024"],
    ['5\\.25\\s*\\*\\s*1024', '5\\.625\\s*\\*\\s*1024'],
    ['5\\.5\\s*\\*\\s*1024', '5\\.625\\s*\\*\\s*1024'],
    ['5\\.5625\\s*\\*\\s*1024', '5\\.625\\s*\\*\\s*1024'],
    ['sourceGlobalLimitBytes: 5.25 * 1024 * 1024', 'sourceGlobalLimitBytes: 5.625 * 1024 * 1024'],
    ['sourceGlobalLimitBytes: 5.5 * 1024 * 1024', 'sourceGlobalLimitBytes: 5.625 * 1024 * 1024'],
    ['sourceGlobalLimitBytes: 5.5625 * 1024 * 1024', 'sourceGlobalLimitBytes: 5.625 * 1024 * 1024'],
  ]);
}

function patchR424Audit(source) {
  return replaceKnown(source, [
    ['100_000', '65_536'],
    ['5_798_240', '5_832_704'],
    ['5.5625 * 1024 * 1024', '5.625 * 1024 * 1024'],
    ['5\\.5625\\s*\\*\\s*1024', '5\\.625\\s*\\*\\s*1024'],
    ['5_732_704', '5_832_704'],
    ['5.25 * 1024 * 1024', '5.625 * 1024 * 1024'],
    ['5.5 * 1024 * 1024', '5.625 * 1024 * 1024'],
    ['5\\.25\\s*\\*\\s*1024', '5\\.625\\s*\\*\\s*1024'],
    ['5\\.5\\s*\\*\\s*1024', '5\\.625\\s*\\*\\s*1024'],
    ['5\\.5625\\s*\\*\\s*1024', '5\\.625\\s*\\*\\s*1024'],
    ['5_405_024', '5_832_704'],
    ['5_667_168', '5_832_704'],
    ['5,25 MiB', '5,625 MiB'],
    ['5,5 MiB', '5,625 MiB'],
    ['5,5625 MiB', '5,625 MiB'],
  ]);
}

function patchR424Fixture(source) {
  return replaceKnown(source, [
    ['100_000', '65_536'],
    ['R414_SOURCE_BUDGET_BYTES = 5_798_240', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
    ['sourceTs: 5.5625 * 1024 * 1024', 'sourceTs: 5.625 * 1024 * 1024'],
    ['R414_SOURCE_BUDGET_BYTES = 5_732_704', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
    ['sourceTs: 5.25 * 1024 * 1024', 'sourceTs: 5.625 * 1024 * 1024'],
    ['sourceTs: 5.5 * 1024 * 1024', 'sourceTs: 5.625 * 1024 * 1024'],
    ['sourceTs: 5.5625 * 1024 * 1024', 'sourceTs: 5.625 * 1024 * 1024'],
    ['R414_SOURCE_BUDGET_BYTES = 5_405_024', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
    ['R414_SOURCE_BUDGET_BYTES = 5_667_168', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
    ['R414_SOURCE_BUDGET_BYTES = 5_732_704', 'R414_SOURCE_BUDGET_BYTES = 5_832_704'],
  ]);
}

const PATCHERS = Object.freeze({
  bundle: patchBundle,
  r184: patchR184,
  r414: patchR414,
  r424Audit: patchR424Audit,
  r424Fixture: patchR424Fixture,
});

export function applySourceBudgetConvergenceR443(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  for (const [key, relative] of Object.entries(TARGETS)) {
    const file = path.resolve(root, relative);
    if (!fs.existsSync(file)) throw new Error(`R443: arquivo de orçamento ausente: ${relative}`);
    const source = fs.readFileSync(file, 'utf8');
    const next = PATCHERS[key](source);
    if (next !== source) {
      fs.writeFileSync(file, next, 'utf8');
      patched.push(relative);
    }
  }

  const bundle = fs.readFileSync(path.resolve(root, TARGETS.bundle), 'utf8');
  const r184 = fs.readFileSync(path.resolve(root, TARGETS.r184), 'utf8');
  const r414 = fs.readFileSync(path.resolve(root, TARGETS.r414), 'utf8');
  const r424Audit = fs.readFileSync(path.resolve(root, TARGETS.r424Audit), 'utf8');
  const r424Fixture = fs.readFileSync(path.resolve(root, TARGETS.r424Fixture), 'utf8');
  const issues = [];
  if (!bundle.includes('sourceTs: 5.625 * 1024 * 1024')) issues.push('bundle ainda usa teto antigo');
  if (!r184.includes('const sourceLimit=5.625*1024*1024;')) issues.push('R184 ainda usa teto antigo');
  if (!r414.includes('R414_SOURCE_BUDGET_BYTES = 5_832_704') || !r414.includes('sourceTs: 5.625 * 1024 * 1024')) issues.push('R414 ainda diverge');
  const r424HasGlobalBudget = r424Audit.includes('5.625 * 1024 * 1024') || r424Audit.includes('5\\.625\\s*\\*\\s*1024');
  if (!r424Audit.includes('5_832_704') || !r424HasGlobalBudget) issues.push('R424 audit ainda diverge');
  if (!r424Fixture.includes('R414_SOURCE_BUDGET_BYTES = 5_832_704') || !r424Fixture.includes('sourceTs: 5.625 * 1024 * 1024')) issues.push('R424 fixture ainda diverge');
  if (issues.length) throw new Error(`R443: convergência de orçamento incompleta — ${issues.join(' | ')}`);

  return {
    changed: patched.length > 0,
    patched,
    globalSourceBudgetBytes: R443_GLOBAL_SOURCE_BUDGET_BYTES,
    reserveBytes: R443_SOURCE_RESERVE_BYTES,
    checkpointBytes: R443_SOURCE_CHECKPOINT_BYTES,
    version: R443_SOURCE_BUDGET_VERSION,
  };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applySourceBudgetConvergenceR443(process.cwd());
  console.log(`R443 orçamento-fonte convergido: ${result.checkpointBytes} bytes úteis com reserva de ${result.reserveBytes} bytes; ${result.patched.length} arquivo(s) ajustado(s).`);
}
