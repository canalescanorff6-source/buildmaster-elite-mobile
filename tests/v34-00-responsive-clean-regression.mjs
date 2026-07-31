import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const layout = read('src/app/layout.tsx');
const css = read('src/app/v34-clean-responsive.css');
const app = read('src/components/CardVisionApp.tsx');
const home = read('src/modules/core/IntegratedHomePanel.tsx');
const players = read('src/modules/players/PlayerLaboratory.tsx');
const calibrator = read('src/components/EfhubVisualCalibrator.tsx');
const cache = read('src/components/RegisterServiceWorker.tsx');
const sw = read('public/sw.js');

assert.match(layout, /v34-clean-responsive\.css/);
assert.match(layout, /bm-v3400-clean-responsive/);

for (const marker of [
  'overflow-x: hidden',
  '--bm-clean-page-gap',
  '.bm-v3400-clean-responsive .premium-app',
  'grid-template-columns: repeat(auto-fit',
  '@media (max-width: 920px)',
  '@media (max-width: 620px)',
  '@media (max-width: 390px)',
  '.bm32-player-footer-actions',
  '.efhub-visual-calibrator:not(.is-fullscreen)',
  '.comparison-table',
  'max-height: min(64dvh, 720px)'
]) assert.ok(css.includes(marker), `Camada responsiva incompleta: ${marker}`);

assert.doesNotMatch(calibrator, /window\.innerWidth <= 760\) setFullscreen\(true\)/);
assert.match(calibrator, /Abrir em tela cheia/);
assert.match(cache, /34\.00\.0-touch-scroll-menu-5/);
assert.match(sw, /buildmaster-v34-00-touch-scroll-menu-3/);

assert.match(home, /Seu time em um só lugar\./);
assert.match(home, /Crie uma ficha pelo print\./);
assert.match(home, /Acesso rápido/);
assert.doesNotMatch(home, /Seu time, suas fichas e sua estratégia em um só lugar/);
assert.doesNotMatch(home, /Transforme um print em uma ficha competitiva completa/);

assert.match(players, /placeholder="Buscar\.\.\."/);
assert.match(players, />Filtros<\/span>/);
assert.match(players, /Cofre<\/button>/);
assert.match(players, /Novo<\/button>/);

assert.match(app, /<h2>Carregando<\/h2>/);
assert.match(app, /Ficha por imagem/);
assert.match(app, /Ficha manual/);
assert.match(app, /<h2>Configurações<\/h2>/);
assert.match(app, /<strong>Opções do time<\/strong>/);

console.log('v34.00 Clean Responsive aprovado: enquadramento universal, textos curtos, guias sem corte e tela cheia opcional.');
