import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { applyR424Fix3CiConvergence } = await import(pathToFileURL(path.resolve('scripts/apply-r424-fix3-ci-convergence.mjs')).href);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-r424fix3-'));
const write = (relative, content) => { const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };

write('scripts/apply-r407-scalable-vault-capacity.mjs', `const invariants=[[startup.includes('export const HISTORY_LIMIT_R200 = Infinity;'),'HISTORY_LIMIT_R200 ilimitado']];\nconst testSource=\`assert.match(startup,/export const HISTORY_LIMIT_R200 = Infinity;/);\`;`);
write('tests/v31-70-typecheck-isolation-regression.mjs', `import fs from 'node:fs'; import assert from 'node:assert/strict'; const lucideStub=''; const analyzerStub = lucideStub;\nassert.match(analyzerStub, /declare module '@\\/lib\\/analyzer'/);`);
write('tests/v40-80-r133-structured-evidence-boundary-regression.ts', `const absurdPointsFields = fieldsConfirmed.map((field) => field.key === 'points' ? { ...field, value: '2', numericValue: 2 } : field);\nconst absurdPointsSession = { ...sessionConfirmed, fields: absurdPointsFields } as SinglePrintSession;\nconst absurdText = buildProductionOcrEvidenceTextR133(absurdPointsSession, confirmedZones);\nassert.doesNotMatch(absurdText, /PONTOS TOTAIS:\\s*2\\b/i, '2/2 confirmado pela zona ainda é implausível como orçamento de jogador e deve ficar fora');`);

const before407 = fs.readFileSync(path.join(root, 'scripts/apply-r407-scalable-vault-capacity.mjs'), 'utf8');
assert.doesNotMatch(before407, /Number\\\.MAX_SAFE_INTEGER/, 'RED: contrato antigo não reconhece R420');

const first = applyR424Fix3CiConvergence(root);
assert.equal(first.changed, true);
assert.deepEqual(new Set(first.patched), new Set([
  'scripts/apply-r407-scalable-vault-capacity.mjs',
  'tests/v31-70-typecheck-isolation-regression.mjs',
  'tests/v40-80-r133-structured-evidence-boundary-regression.ts',
]));
const r407 = fs.readFileSync(path.join(root, 'scripts/apply-r407-scalable-vault-capacity.mjs'), 'utf8');
const v3170 = fs.readFileSync(path.join(root, 'tests/v31-70-typecheck-isolation-regression.mjs'), 'utf8');
const r133 = fs.readFileSync(path.join(root, 'tests/v40-80-r133-structured-evidence-boundary-regression.ts'), 'utf8');
assert.match(r407, /Infinity\|Number\\\.MAX_SAFE_INTEGER/);
assert.match(v3170, /analyzer-stub\.ts/);
assert.doesNotMatch(v3170, /declare module '@\\\/lib\\\/analyzer'/);
assert.match(r133, /assert\.match\(lowPositiveText/);
assert.match(r133, /assert\.doesNotMatch\(lowPositiveText, \/PROGRESSÃO AUTOMÁTICA LIDA/);
const second = applyR424Fix3CiConvergence(root);
assert.equal(second.changed, false, 'segunda execução deve ser idempotente');

const brokenRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-r424fix3-broken-'));
const brokenWrite = (relative, content) => { const file = path.join(brokenRoot, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
brokenWrite('scripts/apply-r407-scalable-vault-capacity.mjs', `const invariants=[[startup.includes('export const HISTORY_LIMIT_R200 = 500;'),'HISTORY_LIMIT_R200 ilimitado']];\nconst testSource=\`assert.match(startup,/export const HISTORY_LIMIT_R200 = 500;/);\`;`);
brokenWrite('tests/v31-70-typecheck-isolation-regression.mjs', v3170);
brokenWrite('tests/v40-80-r133-structured-evidence-boundary-regression.ts', r133);
assert.throws(() => applyR424Fix3CiConvergence(brokenRoot), /R407\/R200/, 'teto desconhecido deve falhar fechado');

console.log('R424-fix3 aprovada: R407 aceita unbounded R420, v31.70 usa path mapping e R133 aceita PP positivo explícito sem progressão incoerente.');
