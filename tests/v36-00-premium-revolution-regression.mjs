import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const layout = read('src/app/layout.tsx');
const css = read('src/app/v36-premium-revolution.css');
const navigation = read('src/components/RefinedNavigation.tsx');
const home = read('src/modules/core/IntegratedHomePanel.tsx');
const mark = read('src/components/BuildMasterMark.tsx');
const cache = read('src/components/RegisterServiceWorker.tsx');

assert.ok(Number(pkg.version.split('.')[0]) >= 37, `A Revolução Premium deve permanecer ativa na versão atual: ${pkg.version}`);
assert.match(pkg.name, /v37-00-inteligencia-profissional/);
assert.match(manifest.name, /v(?:37\.00|38\.32)/);
assert.equal(manifest.theme_color, '#050a12');
assert.ok(layout.lastIndexOf("import './v36-premium-revolution.css'") > layout.lastIndexOf("import './v35-solid-premium.css'"), 'A Revolução Premium precisa ser a última camada visual.');
assert.match(layout, /bm-v3600-revolution/);

for (const marker of [
  '--v36-sidebar-width: 264px',
  '.bm-v3600-revolution .bm-v36-command-deck',
  '.bm-v3600-revolution .bm-v36-mobile-dock',
  '.bm-v3600-revolution .bm-v36-feature-grid',
  '.bm-v3600-revolution .bm-v36-dashboard-grid',
  'backdrop-filter: none !important',
  '@media (max-width: 920px)',
  '@media (max-width: 620px)'
]) assert.ok(css.includes(marker), `Design System v36 incompleto: ${marker}`);

assert.match(navigation, /bm-v36-mobile-dock/);
assert.match(navigation, /Professional Suite · v(?:37\.00|38\.32)/);
assert.match(navigation, /className="create"/);
assert.match(navigation, /bm-v36-trigger-label/);
assert.match(home, /Desempenho real\. Sem perseguir overall\./);
assert.match(home, /A ficha mais forte para a carta e para a posição que você escolher\./);
assert.match(home, /bm-v36-command-deck/);
assert.match(home, /bm-v36-metrics/);
assert.match(home, /Perfis de Gameplay/);
assert.match(mark, /escudo de desempenho/);
assert.match(mark, /<path d="M32 4 54 12v17/);
assert.match(cache, /37\.00\.0-professional-intelligence-1/);

console.log('v36.00 Premium Revolution aprovado: nova home, Design System sólido, navegação executiva e dock móvel.');
