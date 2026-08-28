import assert from 'node:assert/strict';
import fs from 'node:fs';

const panel=fs.readFileSync('src/components/UnifiedPerformanceV3920Panel.tsx','utf8');
const css=fs.readFileSync('src/app/v39-unified-performance.css','utf8');
assert.match(panel,/Clean Slate • r123/);
assert.match(panel,/Confiança da ficha/);
assert.match(panel,/Saturação dos pontos/);
assert.match(panel,/Laboratório competitivo A\/B/);
assert.match(panel,/decisionConfidence\.score/);
assert.match(panel,/saturationProfile/);
assert.match(panel,/competitiveLab\.arms/);
assert.match(panel,/somente leitura/);
assert.match(css,/\.r123-confidence-grid/);
assert.match(css,/\.r123-saturation-list/);
assert.match(css,/\.r123-lab-arms/);
console.log('r123 UI aprovada: confiança, saturação e A/B visíveis sem criar nova autoridade.');
