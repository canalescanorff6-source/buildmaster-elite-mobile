import assert from 'node:assert/strict';
import fs from 'node:fs';

const panel=fs.readFileSync('src/components/UnifiedPerformanceV3920Panel.tsx','utf8');
const css=fs.readFileSync('src/app/v39-unified-performance.css','utf8');
assert.match(panel,/(?:Produção R126 • Clean Slate R125|Clean Slate • r12[235])/);
assert.match(panel,/Desempenho online/);
assert.match(panel,/Por que esta ficha\?/);
assert.match(panel,/onlinePerformance\.rankedScore/);
assert.match(panel,/identityPreservation/);
assert.match(panel,/pointRationale/);
assert.match(panel,/O nome do jogador não entra no cálculo/);
assert.match(css,/\.r122-online-grid/);
assert.match(css,/\.r122-rationale-list/);
console.log('r122 UI aprovada: objetivo online, DNA e justificativa marginal visíveis sem criar novo motor.');
