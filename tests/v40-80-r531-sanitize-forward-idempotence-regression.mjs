import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { sanitizeUpdateSource } from '../scripts/sanitize-update-source.mjs';

const tracked = [
  'src/components/CleanVaultV3800.tsx',
  'src/components/vault/CardVisionVaultWorkspaceR191.tsx',
  'src/modules/vault/useProgressiveVaultWorkspaceR413.ts',
  'src/lib/cleanVaultV3800.ts',
];
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const before = new Map(tracked.map((file) => [file, hash(file)]));

const result = sanitizeUpdateSource(process.cwd());
assert.equal(result.modernTree, true, 'R531: sanitizer deve reconhecer a árvore moderna.');
for (const file of tracked) {
  assert.equal(hash(file), before.get(file), `R531: sanitizer não pode reescrever árvore já convergida: ${file}`);
}
console.log('R531 aprovada: sanitizer forward-only é idempotente sobre a árvore moderna pós-R527.');
