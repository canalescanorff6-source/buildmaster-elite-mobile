import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const legacyReactStub = fs.readFileSync('tests/types-v3110-ui/stubs.d.ts', 'utf8');

const calls = [...app.matchAll(/recordSafeRuntimeError\(([^\n]*)/g)].map((match) => match[1]);
assert.ok(calls.length >= 8, 'O projeto deve manter os registros seguros de diagnóstico.');
assert.equal(
  calls.filter((call) => /^\s*['"`]/.test(call)).length,
  0,
  'recordSafeRuntimeError deve receber um objeto { area, code, message }, nunca dois argumentos posicionais.'
);
assert.match(legacyReactStub, /export function useRef<T>\(initialValue: T\)/, 'O typecheck legado v31.10 precisa declarar useRef para componentes modernos.');

console.log('v34.00 hotfix TypeScript aprovado: diagnósticos usam contrato tipado e o stub legado reconhece useRef.');
