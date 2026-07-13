import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
assert.match(source, /if \(!isRenderableAnalysisResult\(safeResult\)\)/);
assert.match(source, /const repaired = next\.filter\(\(item\) => isRenderableAnalysisResult\(item\.result\)\)/);
assert.match(source, /if \(!result \|\| !isRenderableAnalysisResult\(result\)\) return;/);
assert.match(source, /migracao-segura-cofre/);
console.log('runtime cofre regression: ok');
