import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const workspace = read('src/components/result/ResultWorkspace.tsx');
const share = read('src/components/CompactSharePanel.tsx');
const css = read('src/app/v44-buildmaster-reference.css');

for (const marker of [
  'bm-r528-export',
  'bm-r528-export-hero',
  'bm-r528-export-capabilities',
  'bm-r528-export-actions',
  'bm-r528-export-preview',
]) assert.ok(workspace.includes(marker), `R528: Resultado sem hook ${marker}`);

for (const marker of [
  'bm-r528-share-panel',
  'bm-r528-share-preview',
  'bm-r528-share-actions',
  'bm-r528-share-status',
]) assert.ok(share.includes(marker), `R528: compartilhamento sem hook ${marker}`);

for (const selector of [
  '.bm-r528-export',
  '.bm-r528-export-hero',
  '.bm-r528-export-capabilities',
  '.bm-r528-export-actions',
  '.bm-r528-export-preview',
  '.bm-r528-share-panel',
  '.bm-r528-share-preview',
  '.bm-r528-share-actions',
]) assert.ok(css.includes(selector), `R528: CSS não cobre ${selector}`);

assert.match(workspace, /onExportImage=\{onExportImage\}/, 'R528: imagem deve continuar delegada à autoridade existente.');
assert.match(workspace, /onClick=\{onPrintReport\}/, 'R528: PDF deve continuar usando o fluxo de impressão existente.');
assert.match(workspace, /onClick=\{onExportReport\}/, 'R528: HTML deve continuar usando o callback existente.');
assert.match(workspace, /onClick=\{onExportText\}/, 'R528: relatório técnico deve continuar usando o callback existente.');
assert.match(share, /typeof nativeShare === 'function'/, 'R528: compartilhamento deve respeitar Web Share quando disponível.');
assert.match(share, /navigator\.clipboard\.writeText\(text\)/, 'R528: fallback deve continuar usando clipboard.');

for (const forbidden of [
  "from '@/modules/builds/buildReportExport'",
  "from '@/modules/export/clientTextExportR129'",
  "from '@/modules/result/cardVisionResultActionsR188'",
  "from '@/modules/analysis/engineCertificationR517'",
]) assert.ok(!workspace.includes(forbidden), `R528: workspace não deve importar autoridade diretamente: ${forbidden}`);

console.log('R528 aprovada: exportação/compartilhamento premium preserva autoridades reais e fallbacks honestos.');
