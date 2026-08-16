import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyCardVisionLineBudgetR22 } from '../scripts/apply-cardvision-line-budget-r22.mjs';

const root = mkdtempSync(join(tmpdir(), 'bm-r22-'));
mkdirSync(join(root, 'src/components'), { recursive: true });

const lines = ["'use client';", "// A Central de Backup é informativa e nunca pode impedir a abertura do app."];
while (lines.length < 4200) {
  lines.push(lines.length % 11 === 0 ? '' : `const x${lines.length} = ${lines.length};`);
}
writeFileSync(join(root, 'src/components/CardVisionApp.tsx'), lines.join('\n'));

const result = applyCardVisionLineBudgetR22(root);
assert.ok(result.afterLines < 4200);
const output = readFileSync(join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
assert.ok(output.includes('BM_CARDVISION_LINE_BUDGET_R22'));
assert.ok(output.includes("'use client';"));
assert.ok(output.includes('const x100'));
console.log(`r22 aprovado: ${result.beforeLines} -> ${result.afterLines} linhas.`);
