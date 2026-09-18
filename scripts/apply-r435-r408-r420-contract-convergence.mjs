import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R435_R408_R420_CONVERGENCE_VERSION = '40.80-r435-r408-r420-semantic-unbounded-v1';

const TARGET = 'scripts/apply-r408-unlimited-fichas-pp-integrity.mjs';
const MARKER = 'R435_R408_R420_SEMANTIC_UNBOUNDED';

function replaceOnceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R435: contrato inesperado em ${label}; ocorrências=${count}.`);
  return source.replace(from, to);
}

export function patchR408GeneratorR435(source) {
  let next = source;

  const legacyFn = `function forceUnboundedStartupConstant(source) {\n  return source.replace(/export const HISTORY_LIMIT_R200 = (?:200|Infinity|Number\\.POSITIVE_INFINITY);/, 'export const HISTORY_LIMIT_R200 = Infinity;');\n}`;
  const canonicalFn = `function forceUnboundedStartupConstant(source) {\n  return source.replace(\n    /export const HISTORY_LIMIT_R200\\s*=\\s*(?:200|Infinity|Number\\.POSITIVE_INFINITY|Number\\.MAX_SAFE_INTEGER);(?:[^\\n]*)?/,\n    'export const HISTORY_LIMIT_R200 = Number.MAX_SAFE_INTEGER; // R420: símbolo legado sem teto lógico.'\n  );\n}`;
  next = replaceOnceRequired(next, legacyFn, canonicalFn, 'normalizador R200 do gerador R408');

  const legacyImports = `const budget=read('src/modules/builds/pointBudget.ts');\\nconst optimizer=read('src/modules/builds/trainingOptimizer.ts');`;
  const canonicalImports = `const budget=read('src/modules/builds/pointBudget.ts');\\nconst core=read('src/lib/trainingPlanCore.ts');\\nconst optimizer=read('src/modules/builds/trainingOptimizer.ts');`;
  next = replaceOnceRequired(next, legacyImports, canonicalImports, 'autoridade canônica de custo no teste gerado R408');

  const legacyStartupAssertion = `assert.match(startup,/export const HISTORY_LIMIT_R200 = Infinity;/);`;
  const canonicalStartupAssertion = `assert.match(startup,/export const HISTORY_LIMIT_R200 = Number\\.MAX_SAFE_INTEGER;/); // ${MARKER}`;
  next = replaceOnceRequired(next, legacyStartupAssertion, canonicalStartupAssertion, 'semântica ilimitada R408/R420');

  const legacyPp = `assert.match(budget,/usedProgressionPoints/);\\nassert.match(budget,/trainingPointsTotal|allocatablePotential|calculateAllocatablePotential/);`;
  const canonicalPp = `assert.match(budget,/MAX_PLAYER_TRAINING_BUDGET\\\\s*=\\\\s*140/);\\nassert.match(budget,/normalizePlayerTrainingBudget/);\\nassert.match(core,/export function trainingPlanTotalCost\\\\(plan: TrainingPlan\\\\): number/);\\nassert.match(core,/TRAINING_KEYS\\\\.reduce\\\\(\\\\(sum, key\\\\) => sum \\\\+ trainingTotalCost\\\\(plan\\\\[key\\\\] \\\\?\\\\? 0\\\\), 0\\\\)/);\\nassert.match(optimizer,/trainingPlanTotalCost/);\\nassert.match(optimizer,/parsed\\\\.trainingPointsTotal/);\\nassert.doesNotMatch(core,/HISTORY_LIMIT|cardHistory/);`;
  next = replaceOnceRequired(next, legacyPp, canonicalPp, 'contrato de PP do teste gerado R408');

  return next;
}

export function auditR435R408R420(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const file = path.resolve(root, TARGET);
  const issues = [];
  if (!fs.existsSync(file)) {
    issues.push(`${TARGET}: arquivo ausente.`);
    return { ok: false, issues, version: R435_R408_R420_CONVERGENCE_VERSION };
  }
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes(MARKER)) issues.push('gerador R408 não marca o contrato semântico R435.');
  if (!source.includes("HISTORY_LIMIT_R200 = Number.MAX_SAFE_INTEGER; // R420: símbolo legado sem teto lógico.")) {
    issues.push('gerador R408 não converge o símbolo R200 para Number.MAX_SAFE_INTEGER.');
  }
  if (source.includes('assert.match(startup,/export const HISTORY_LIMIT_R200 = Infinity;/);')) {
    issues.push('teste gerado R408 ainda exige Infinity literalmente.');
  }
  if (!source.includes("const core=read('src/lib/trainingPlanCore.ts');\\n")) issues.push('teste gerado R408 não lê a autoridade canônica de custo.');
  for (const marker of ['MAX_PLAYER_TRAINING_BUDGET', 'normalizePlayerTrainingBudget', 'trainingPlanTotalCost', 'parsed\\\\.trainingPointsTotal']) {
    if (!source.includes(marker)) issues.push(`teste gerado R408 perdeu contrato moderno de PP: ${marker}`);
  }
  return { ok: issues.length === 0, issues, version: R435_R408_R420_CONVERGENCE_VERSION };
}

export function applyR435R408R420ContractConvergence(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const file = path.resolve(root, TARGET);
  if (!fs.existsSync(file)) throw new Error(`R435: arquivo obrigatório ausente: ${TARGET}`);
  const source = fs.readFileSync(file, 'utf8');
  const next = patchR408GeneratorR435(source);
  const changed = next !== source;
  if (changed) fs.writeFileSync(file, next, 'utf8');
  const audit = auditR435R408R420(root);
  if (!audit.ok) throw new Error(`R435: contrato R408/R420 ainda divergente — ${audit.issues.join(' | ')}`);
  return { changed, patched: changed ? [TARGET] : [], audit, version: R435_R408_R420_CONVERGENCE_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR435R408R420ContractConvergence(process.cwd());
  console.log(result.changed
    ? 'R435 convergiu o gerador R408 ao contrato semântico ilimitado R420 e à autoridade moderna de PP.'
    : 'R435: gerador R408 já está convergido ao contrato semântico R420/PP.');
}
