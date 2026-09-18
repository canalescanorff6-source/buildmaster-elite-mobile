import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R434_R200_STARTUP_BUDGET_CONVERGENCE_VERSION = '40.80-r434-r200-startup-budget-convergence-v1';
export const R434_R200_STARTUP_BUDGET_BYTES = 650_000;

const TARGETS = Object.freeze({
  checker: 'scripts/check-cardvision-static-closure-r200.mjs',
  regression: 'tests/v40-80-r200-mobile-startup-runtime-boundary-regression.mjs',
});

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R434: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

export function patchR200StartupBudgetCheckerR434(source) {
  const current = 'const MAX_SOURCE_BYTES_R200 = 650_000;';
  if (source.includes(current)) return source;
  const legacy = 'const MAX_SOURCE_BYTES_R200 = 640_000;';
  const occurrences = source.split(legacy).length - 1;
  if (occurrences !== 1) {
    throw new Error(`R434: contrato de bytes R200 inesperado; ocorrências do baseline 640_000=${occurrences}.`);
  }
  return source.replace(legacy, current);
}

export function patchR200RegressionR434(source) {
  if (source.includes('R434_STARTUP_BUDGET_CONVERGENCE')) return source;
  const anchor = "const pro = read('src/lib/globalProBenchmarkV3900.ts');\n";
  const occurrences = source.split(anchor).length - 1;
  if (occurrences !== 1) throw new Error(`R434: âncora do teste R200 inesperada; ocorrências=${occurrences}.`);
  const block = `${anchor}\n// R434_STARTUP_BUDGET_CONVERGENCE: o helper de evidência R419 é parte legítima da closure.\nconst r200ClosureCheck = read('scripts/check-cardvision-static-closure-r200.mjs');\nassert.match(r200ClosureCheck, /const MAX_SOURCE_BYTES_R200 = 650_000;/, 'R434: teto absoluto R200 deve ser 650.000 B.');\nassert.match(r200ClosureCheck, /const MAX_MODULES_R200 = 90;/, 'R434: teto de módulos R200 não pode ser ampliado.');\nassert.match(r200ClosureCheck, /sourceBytes > Math\\.floor\\(r199Bytes \\* 0\\.30\\)/, 'R434: redução mínima de 70% vs R199 precisa continuar ativa.');\nassert.match(r200ClosureCheck, /lib\\/analyzer\\.ts[\\s\\S]*modules\\/vault\\/cardHistoryStore\\.ts/, 'R434: módulos pesados continuam explicitamente proibidos no startup.');\n`;
  return source.replace(anchor, block);
}

export function auditR434R200StartupBudget(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const issues = [];
  let checker = '';
  let regression = '';
  try { checker = readRequired(root, TARGETS.checker).source; } catch (error) { issues.push(String(error?.message || error)); }
  try { regression = readRequired(root, TARGETS.regression).source; } catch (error) { issues.push(String(error?.message || error)); }

  if (!checker.includes('const MAX_SOURCE_BYTES_R200 = 650_000;')) issues.push('R200 não usa o teto absoluto convergido de 650.000 B.');
  if (checker.includes('const MAX_SOURCE_BYTES_R200 = 640_000;')) issues.push('R200 ainda contém o teto legado de 640.000 B.');
  if (!checker.includes('const MAX_MODULES_R200 = 90;')) issues.push('R200 perdeu o teto de 90 módulos.');
  if (!checker.includes('sourceBytes > Math.floor(r199Bytes * 0.30)')) issues.push('R200 perdeu a redução mínima de 70% vs R199.');
  for (const marker of ['lib/analyzer.ts', 'modules/vault/cardHistoryStore.ts', 'components/vault/CardVisionVaultWorkspaceR191.tsx']) {
    if (!checker.includes(marker)) issues.push(`R200 perdeu módulo proibido: ${marker}`);
  }
  if (!regression.includes('R434_STARTUP_BUDGET_CONVERGENCE')) issues.push('Regressão R200 não valida a convergência R434.');
  if (!regression.includes('MAX_SOURCE_BYTES_R200 = 650_000')) issues.push('Regressão R200 não fixa o teto de 650.000 B.');
  if (!regression.includes('MAX_MODULES_R200 = 90')) issues.push('Regressão R200 não preserva o teto de módulos.');

  return {
    version: R434_R200_STARTUP_BUDGET_CONVERGENCE_VERSION,
    ok: issues.length === 0,
    issues,
    startupBudgetBytes: R434_R200_STARTUP_BUDGET_BYTES,
  };
}

export function applyR434R200StartupBudgetConvergence(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  let changed = false;

  const checker = readRequired(root, TARGETS.checker);
  const checkerNext = patchR200StartupBudgetCheckerR434(checker.source);
  if (checkerNext !== checker.source) {
    fs.writeFileSync(checker.file, checkerNext, 'utf8');
    patched.push(TARGETS.checker);
    changed = true;
  }

  const regression = readRequired(root, TARGETS.regression);
  const regressionNext = patchR200RegressionR434(regression.source);
  if (regressionNext !== regression.source) {
    fs.writeFileSync(regression.file, regressionNext, 'utf8');
    patched.push(TARGETS.regression);
    changed = true;
  }

  const audit = auditR434R200StartupBudget(root);
  if (!audit.ok) throw new Error(`R434: contrato R200 ainda divergente — ${audit.issues.join(' | ')}`);
  return { changed, patched, audit, version: R434_R200_STARTUP_BUDGET_CONVERGENCE_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR434R200StartupBudgetConvergence(process.cwd());
  console.log(result.changed
    ? `R434 convergiu ${result.patched.length} contrato(s) R200; teto absoluto=${R434_R200_STARTUP_BUDGET_BYTES} B, guardrails relativos preservados.`
    : `R434: contrato R200 já convergido em ${R434_R200_STARTUP_BUDGET_BYTES} B com guardrails relativos preservados.`);
}
