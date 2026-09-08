import fs from 'node:fs';
import assert from 'node:assert/strict';

const sourceFiles = [
  'src/components/CardVisionApp.tsx',
  'src/components/AppRuntimeStatus.tsx',
  'src/components/SectionErrorBoundary.tsx',
  'src/hooks/useCardVisionCentralWorkspaceR175.ts',
  'src/modules/core/centralSafeViewR130.ts',
  'src/modules/card-reader/readerAnalysisRuntimeR163.ts',
  'src/modules/card-reader/readerInteractionRuntimeR164.ts',
  'src/modules/card-reader/cardVisionReaderActionsR187.ts',
  'src/modules/backup/cardVisionBackupRuntimeR162.ts',
];
const app = sourceFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const legacyReactStub = fs.readFileSync('tests/types-v3110-ui/stubs.d.ts', 'utf8');

const calls = [...app.matchAll(/recordSafeRuntimeError\(([^\n]*)/g)].map((match) => match[1]);
assert.ok(calls.length >= 8, 'O projeto modular deve manter os registros seguros de diagnóstico nas autoridades atuais.');
assert.equal(
  calls.filter((call) => /^\s*['"`]/.test(call)).length,
  0,
  'recordSafeRuntimeError deve receber um objeto { area, code, message }, nunca dois argumentos posicionais.'
);
assert.match(legacyReactStub, /export function useRef<T>\(initialValue: T\)/, 'O typecheck legado v31.10 precisa declarar useRef para componentes modernos.');

console.log('v34.00 hotfix TypeScript aprovado: diagnósticos usam contrato tipado e o stub legado reconhece useRef.');
