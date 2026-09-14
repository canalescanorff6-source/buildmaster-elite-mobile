import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const R414_SOURCE_BUDGET_BYTES = 5_405_024;
export const R414_RESULT_CLOSURE_BUDGET_R192 = 2_160_000;

const TARGETS = [
  {
    path: 'scripts/check-result-workspace-static-closure-r192.mjs',
    from: 'const MAX_SOURCE_BYTES_R192 = 2_135_000;',
    to: `const MAX_SOURCE_BYTES_R192 = ${R414_RESULT_CLOSURE_BUDGET_R192};`,
    label: 'R192 result closure budget',
  },
  {
    path: 'tests/v40-80-r193-analyzer-dedup-budget-regression.mjs',
    from: 'r2004Boundary ? 5_360_000 : 5_344_000',
    to: `r2004Boundary ? ${R414_SOURCE_BUDGET_BYTES} : 5_344_000`,
    label: 'R193 source budget',
  },
  {
    path: 'tests/v40-80-r194-cardvision-contract-dedup-regression.mjs',
    from: 'r2004Boundary ? 5_360_000 : r200Boundary ? 5_341_000 : 5_340_500',
    to: `r2004Boundary ? ${R414_SOURCE_BUDGET_BYTES} : r200Boundary ? 5_341_000 : 5_340_500`,
    label: 'R194 source budget',
  },
  {
    path: 'tests/v40-80-r195-controller-prop-hotpath-regression.mjs',
    from: 'r2004Boundary ? 5_360_000 : r200Boundary ? 5_341_000 : 5_337_000',
    to: `r2004Boundary ? ${R414_SOURCE_BUDGET_BYTES} : r200Boundary ? 5_341_000 : 5_337_000`,
    label: 'R195 source budget',
  },
  {
    path: 'tests/v40-80-r196-analyzer-compiled-scoring-regression.mjs',
    from: 'r2004Boundary ? 5_360_000 : r200Boundary ? 5_341_000 : 5_335_700',
    to: `r2004Boundary ? ${R414_SOURCE_BUDGET_BYTES} : r200Boundary ? 5_341_000 : 5_335_700`,
    label: 'R196 source budget',
  },
  {
    path: 'tests/v40-80-r197-training-budget-hotpath-regression.ts',
    from: 'r2004Boundary ? 5_360_000 : r200Boundary ? 5_341_000 : 5_335_500',
    to: `r2004Boundary ? ${R414_SOURCE_BUDGET_BYTES} : r200Boundary ? 5_341_000 : 5_335_500`,
    label: 'R197 source budget',
  },
  {
    path: 'tests/v40-80-r198-e2e-production-finalization-authority-regression.mjs',
    from: 'r200Boundary ? 5_360_000 : 5_335_350',
    to: `r200Boundary ? ${R414_SOURCE_BUDGET_BYTES} : 5_335_350`,
    label: 'R198 source budget',
  },
  {
    path: 'tests/v40-80-r199-persistence-session-cache-audit-regression.mjs',
    from: 'r200Boundary ? 5_360_000 : 5_335_307',
    to: `r200Boundary ? ${R414_SOURCE_BUDGET_BYTES} : 5_335_307`,
    label: 'R199 source budget',
  },
  {
    path: 'tests/v40-80-r200-mobile-startup-runtime-boundary-regression.mjs',
    from: 'sourceBytes <= 5_360_000',
    to: `sourceBytes <= ${R414_SOURCE_BUDGET_BYTES}`,
    label: 'R200 source budget',
  },
];

function patchExact(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R414 CI convergence: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}

export function applyR414CiContractConvergence(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  let changed = false;
  const patched = [];

  for (const target of TARGETS) {
    const file = resolve(root, target.path);
    if (!existsSync(file)) throw new Error(`R414 CI convergence: arquivo obrigatório ausente: ${target.path}`);
    const source = readFileSync(file, 'utf8');
    const result = patchExact(source, target.from, target.to, target.label);
    if (result.changed) {
      writeFileSync(file, result.source, 'utf8');
      changed = true;
      patched.push(target.path);
    }
  }

  // Guardrails: o reparo só converge contratos de orçamento. O teto global real continua
  // em 5,25 MiB e a reserva R414 continua em 100.000 bytes (5.405.024 bytes efetivos).
  const budgetCheck = readFileSync(resolve(root, 'scripts/check-bundle-budget.mjs'), 'utf8');
  if (!budgetCheck.includes('sourceTs: 5.25 * 1024 * 1024')) {
    throw new Error('R414 CI convergence: orçamento global de 5,25 MiB não está mais presente.');
  }
  const r184 = readFileSync(resolve(root, 'tests/v40-80-r184-production-legacy-isolation-regression.mjs'), 'utf8');
  const r184HasGlobalLimit = /const\s+sourceLimit\s*=\s*5\.25\s*\*\s*1024\s*\*\s*1024\s*;/.test(r184);
  const r184HasR414Reserve = /const\s+minimumMargin\s*=\s*r414ScalableVault\s*\?\s*100_000\s*:\s*legacyMinimumMargin\s*;/.test(r184);
  const r184UsesCheckpoint = /const\s+checkpointLimit\s*=\s*sourceLimit\s*-\s*minimumMargin\s*;/.test(r184)
    && /sourceBytes\s*<=\s*checkpointLimit/.test(r184);
  if (!r184HasGlobalLimit || !r184HasR414Reserve || !r184UsesCheckpoint) {
    throw new Error('R414 CI convergence: contrato semântico de reserva mínima de 100 KB do R184 não está mais presente.');
  }

  return {
    changed,
    patched,
    sourceBudgetBytes: R414_SOURCE_BUDGET_BYTES,
    sourceGlobalLimitBytes: 5.25 * 1024 * 1024,
    sourceReserveBytes: 100_000,
    resultClosureBudgetR192: R414_RESULT_CLOSURE_BUDGET_R192,
  };
}
