import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R424_FIX3_CI_CONVERGENCE_VERSION = '40.80-r424-fix3-ci-convergence-v1';

const TARGETS = Object.freeze({
  r407: 'scripts/apply-r407-scalable-vault-capacity.mjs',
  v3170Isolation: 'tests/v31-70-typecheck-isolation-regression.mjs',
  r133: 'tests/v40-80-r133-structured-evidence-boundary-regression.ts',
});

function required(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R424-fix3: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function writeChanged(target, before, after, relative, patched) {
  if (before === after) return false;
  fs.writeFileSync(target, after, 'utf8');
  if (!patched.includes(relative)) patched.push(relative);
  return true;
}

function patchR407(source) {
  let next = source;
  const oldInvariant = "[startup.includes('export const HISTORY_LIMIT_R200 = Infinity;'),'HISTORY_LIMIT_R200 ilimitado']";
  const newInvariant = "[/export const HISTORY_LIMIT_R200 = (?:Infinity|Number\\.MAX_SAFE_INTEGER);/.test(startup),'HISTORY_LIMIT_R200 ilimitado']";
  if (next.includes(oldInvariant)) next = next.replace(oldInvariant, newInvariant);
  else if (!next.includes(newInvariant)) throw new Error('R424-fix3: invariante R407/R200 não encontrado.');

  const oldTest = "assert.match(startup,/export const HISTORY_LIMIT_R200 = Infinity;/);";
  const newTest = "assert.match(startup,/export const HISTORY_LIMIT_R200 = (?:Infinity|Number\\.MAX_SAFE_INTEGER);/);";
  if (next.includes(oldTest)) next = next.replace(oldTest, newTest);
  else if (!next.includes(newTest)) throw new Error('R424-fix3: regressão gerada R407/R200 não encontrada.');
  return next;
}

function patchV3170Isolation(source) {
  const legacy = `const analyzerStub = lucideStub;\nassert.match(analyzerStub, /declare module '@\\/lib\\/analyzer'/);`;
  const semantic = `const uiConfig = JSON.parse(fs.readFileSync('tests/types-v3170-ui/tsconfig.json', 'utf8'));\nassert.deepEqual(uiConfig.compilerOptions?.paths?.['@/lib/analyzer'], ['tests/types-v3170-ui/analyzer-stub.ts']);\nconst analyzerStub = fs.readFileSync('tests/types-v3170-ui/analyzer-stub.ts', 'utf8');\nassert.match(analyzerStub, /TacticalStyle/);\nassert.match(analyzerStub, /ATTRIBUTE_INPUTS/);`;
  if (source.includes(legacy)) return source.replace(legacy, semantic);
  if (source.includes("paths?.['@/lib/analyzer']") && source.includes("analyzer-stub.ts")) return source;
  throw new Error('R424-fix3: contrato v31.70 de analyzer stub inesperado.');
}

function patchR133(source) {
  const legacy = `const absurdPointsFields = fieldsConfirmed.map((field) => field.key === 'points' ? { ...field, value: '2', numericValue: 2 } : field);\nconst absurdPointsSession = { ...sessionConfirmed, fields: absurdPointsFields } as SinglePrintSession;\nconst absurdText = buildProductionOcrEvidenceTextR133(absurdPointsSession, confirmedZones);\nassert.doesNotMatch(absurdText, /PONTOS TOTAIS:\\s*2\\b/i, '2/2 confirmado pela zona ainda é implausível como orçamento de jogador e deve ficar fora');`;
  const current = `const lowPositivePointsFields = fieldsConfirmed.map((field) => field.key === 'points' ? { ...field, value: '2', numericValue: 2 } : field);\nconst lowPositivePointsSession = { ...sessionConfirmed, fields: lowPositivePointsFields } as SinglePrintSession;\nconst lowPositiveText = buildProductionOcrEvidenceTextR133(lowPositivePointsSession, confirmedZones);\nassert.match(lowPositiveText, /PONTOS TOTAIS:\\s*2\\b/i, 'R419 permite PP positivo explicitamente confirmado; nenhum piso artificial pode apagar a evidência');\nassert.doesNotMatch(lowPositiveText, /PROGRESSÃO AUTOMÁTICA LIDA/i, 'progressão de 60 PP não pode ser anexada a orçamento explícito de 2 PP');`;
  if (source.includes(legacy)) return source.replace(legacy, current);
  if (source.includes('lowPositivePointsFields') && source.includes('nenhum piso artificial')) return source;
  throw new Error('R424-fix3: contrato R133 de PP baixo positivo inesperado.');
}

export function applyR424Fix3CiConvergence(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  let changed = false;

  const r407 = required(root, TARGETS.r407);
  changed = writeChanged(r407.file, r407.source, patchR407(r407.source), TARGETS.r407, patched) || changed;

  const v3170 = required(root, TARGETS.v3170Isolation);
  changed = writeChanged(v3170.file, v3170.source, patchV3170Isolation(v3170.source), TARGETS.v3170Isolation, patched) || changed;

  const r133 = required(root, TARGETS.r133);
  changed = writeChanged(r133.file, r133.source, patchR133(r133.source), TARGETS.r133, patched) || changed;

  const finalR407 = fs.readFileSync(r407.file, 'utf8');
  const finalV3170 = fs.readFileSync(v3170.file, 'utf8');
  const finalR133 = fs.readFileSync(r133.file, 'utf8');
  if (!finalR407.includes('(?:Infinity|Number\\.MAX_SAFE_INTEGER)')) throw new Error('R424-fix3: R407 ainda não aceita R420 sem teto.');
  if (!finalV3170.includes("tests/types-v3170-ui/analyzer-stub.ts")) throw new Error('R424-fix3: v31.70 ainda depende de ambient module removido.');
  if (!finalR133.includes('lowPositivePointsFields')) throw new Error('R424-fix3: R133 ainda mantém piso artificial de PP.');

  return { changed, patched, version: R424_FIX3_CI_CONVERGENCE_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR424Fix3CiConvergence(process.cwd());
  console.log(result.changed
    ? `R424-fix3 convergiu ${result.patched.length} contrato(s) de CI.`
    : 'R424-fix3: contratos de CI já estavam convergidos.');
}
