import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const recovery = read('src/components/MobileScrollRecovery.tsx');
const navigation = read('src/components/RefinedNavigation.tsx');
const context = read('src/components/PremiumContextBar.tsx');
const css = read('src/app/v34-clean-responsive.css');
const cache = read('src/components/RegisterServiceWorker.tsx');
const sw = read('public/sw.js');

// A gaveta lateral não pode mais deixar overflow hidden preso no body.
assert.doesNotMatch(navigation, /document\.body\.style\.overflow\s*=\s*['"]hidden['"]/);
assert.match(app, /<MobileScrollRecovery \/>/);
assert.match(recovery, /const restorePageScroll = \(\) =>/);
assert.match(recovery, /document\.body\.style\.removeProperty\('overflow'\)/);
assert.match(recovery, /document\.documentElement\.style\.removeProperty\('overflow'\)/);
assert.match(recovery, /window\.addEventListener\('pageshow', restorePageScroll\)/);

// A interface móvel permite pan vertical e zoom nativo.
assert.match(css, /touch-action:\s*pan-y pinch-zoom/);
assert.match(css, /-webkit-overflow-scrolling:\s*touch/);
assert.match(css, /overflow-y:\s*visible !important/);

// A lupa do topo foi removida; a busca continua no menu lateral.
assert.doesNotMatch(context, /className="bm-simple-search"/);
assert.doesNotMatch(context, /\bSearch\b/);
assert.match(navigation, /Buscar no aplicativo/);

// O botão Menu fica mais alto sem invadir a área segura do Android.
assert.match(css, /\.bm-v3400-clean-responsive \.bm-v33-drawer-trigger \{[\s\S]*top:\s*max\(2px, env\(safe-area-inset-top\)\) !important/);

// Força descarte único do cache antigo no APK instalado.
assert.match(cache, /34\.00\.0-touch-scroll-menu-5/);
assert.match(sw, /buildmaster-v34-00-touch-scroll-menu-3/);

console.log('v34.00 toque móvel aprovado: rolagem vertical restaurada, lupa superior removida e Menu reposicionado.');
