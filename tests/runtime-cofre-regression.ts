import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
assert.match(source, /export function migrateAnalysisResult/);
assert.match(source, /const migratedResult = migrateAnalysisResult\(entry\?\.result/);
assert.match(source, /function isRenderableAnalysisResult/);
assert.match(source, /if \(!isRenderableAnalysisResult\(nextResult\)\) throw new Error\('Resultado incompleto para renderização'\)/);
assert.match(source, /normalizeHistoryList\(await readIndexedHistory\(\)\)/);
assert.match(source, /Resultados antigos não são reabertos automaticamente no APK/);
console.log('runtime cofre regression: ok');
