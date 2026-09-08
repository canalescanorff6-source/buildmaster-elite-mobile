import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const hook = fs.readFileSync('src/hooks/useReaderImageMemoryR156.ts', 'utf8');
const total = fs.readFileSync('src/components/TotalCardReaderPanel.tsx', 'utf8');
const team = fs.readFileSync('src/modules/squad/TeamFullMapPanel.tsx', 'utf8');

assert.match(app, /useReaderImageMemoryR156\(\)/, 'CardVision deve centralizar a posse das URLs temporárias.');
assert.doesNotMatch(app, /previewObjectUrlRef|enhancedObjectUrlRef/, 'Refs antigas e espalhadas de object URL não podem voltar ao shell.');
assert.match(hook, /previewLeaseRef\.current\?\.release\(\)/, 'Unmount deve liberar preview temporário.');
assert.match(hook, /enhancedLeaseRef\.current\?\.release\(\)/, 'Unmount deve liberar imagem melhorada temporária.');
assert.match(app, /mainSection === 'leitor' && advancedMode[\s\S]{0,180}releaseEnhanced\(\)/, 'Imagem melhorada deve ser liberada ao sair do laboratório/leitor.');

for (const releaseMarker of [
  'readerImageMemoryR156.releaseAll();',
  'setSelectedFile(null);',
  'setCardCropResult(null);',
  'setQualityReport(null);',
  'setTotalReadingSession(null);',
  'setSinglePrintSession(null);',
]) {
  assert.ok(app.includes(releaseMarker), `Finalização precisa liberar payload transitório: ${releaseMarker}`);
}

assert.match(total, /createImageThumbnail\(validated\.sanitizedBlob, 420\)/,
  'Leitor Total deve usar miniatura limitada em vez de decodificar cada print original na grade.');
assert.doesNotMatch(total, /URL\.createObjectURL\(file\)/,
  'Leitor Total não deve criar preview visual diretamente do arquivo original.');
assert.match(total, /loading="lazy" decoding="async"/,
  'Miniaturas do Leitor Total devem usar decode assíncrono e lazy.');
assert.doesNotMatch(app, /setPreview\(overview\.preview\)/,
  'CardVision não deve substituir o preview original de calibração pela miniatura do Leitor Total.');

assert.match(team, /createImageThumbnail\(validated\.sanitizedBlob, 720\)/,
  'Print do adversário deve ter preview reduzido sem alterar o arquivo usado no OCR.');
assert.doesNotMatch(team, /opponentPrintObjectUrlRef\.current = URL\.createObjectURL\(file\)/,
  'Preview do adversário não deve decodificar o arquivo original inteiro.');

console.log('R156 aprovado: sessão de imagem libera payload pesado e previews múltiplos usam miniaturas limitadas.');
