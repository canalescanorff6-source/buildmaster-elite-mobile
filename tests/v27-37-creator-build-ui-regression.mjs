import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const panel = fs.readFileSync('src/components/CreatorBuildResearchPanel.tsx', 'utf8');
const engine = fs.readFileSync('src/lib/creatorBuildResearch.ts', 'utf8');
const styles = fs.readFileSync('src/app/creator-build-research-v2737.css', 'utf8');
const globals = fs.readFileSync('src/app/globals.css', 'utf8');

assert.match(app, /CreatorBuildResearchPanel/);
assert.match(app, /value: 'fontes'/);
assert.match(app, /tab === 'fontes'/);
assert.match(app, /creatorBuildResearch: exportCreatorBuildResearch\(\)/);
assert.match(app, /importCreatorBuildResearch\(evolution\.creatorBuildResearch\)/);
assert.match(panel, /Pesquisar no YouTube/);
assert.match(panel, /Pesquisar no TikTok/);
assert.match(panel, /Comparador de progressão por carta exata/);
assert.match(panel, /CREATOR_TRAINING_KEYS\.map/);
assert.match(panel, /Ler print do vídeo/);
assert.match(panel, /recognizeWithOcrWorker/);
assert.match(engine, /buildCreatorBuildConsensus/);
assert.match(engine, /scoreCreatorSourceForResult/);
assert.match(engine, /trainingTotalCost/);
assert.match(engine, /parseCreatorTrainingText/);
assert.match(engine, /tag\/edição especial diferente/);
assert.match(styles, /creator-comparison-table/);
assert.match(globals, /creator-build-research-v2737\.css/);

console.log('✓ UI de pesquisa de fichas, carta exata, backup, comparação e estilos integrados.');
