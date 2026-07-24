import assert from 'node:assert/strict';
import fs from 'node:fs';

const refinement = fs.readFileSync('src/app/design-system-v2739-refinement.css', 'utf8');
const rainbow = fs.readFileSync('src/app/design-system-v2738-rainbow.css', 'utf8');
const auth = fs.readFileSync('src/components/AuthGate.tsx', 'utf8');
const navigation = fs.readFileSync('src/components/RefinedNavigation.tsx', 'utf8');
const live = fs.readFileSync('src/components/LiveStatusRegion.tsx', 'utf8');
const quality = fs.readFileSync('src/app/design-system-v2840-quality.css', 'utf8');
const qualityCenter = fs.readFileSync('src/components/PremiumQualityCenter.tsx', 'utf8');
const qualityLayer = fs.readFileSync('src/components/PremiumQualityLayer.tsx', 'utf8');

function luminance(hex) {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(first, second) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

for (const color of ['#1f5ed8', '#5b32b5']) assert.ok(contrast('#ffffff', color) >= 4.5, `${color} não alcança contraste AA com branco.`);
assert.ok(contrast('#46536a', '#cfd7e3') >= 4.5, 'Estado desabilitado não alcança contraste AA.');
assert.match(refinement, /--bm-touch:\s*48px/);
assert.match(refinement, /:focus-visible/);
assert.match(refinement, /prefers-reduced-motion:\s*reduce/);
assert.match(refinement, /\.premium-app \.elite-button[\s\S]*#1f5ed8[\s\S]*#5b32b5/);
assert.match(rainbow, /--v2738-text:\s*#172033/);
assert.match(auth, /CapsLock/);
assert.match(auth, /aria-busy=\{loading\}/);
assert.match(auth, /aria-live="polite"/);
assert.match(navigation, /aria-label="Navegação principal"/);
assert.match(navigation, /aria-label="Navegação inferior"/);
assert.match(live, /aria-live=\{urgent \? 'assertive' : 'polite'\}/);
assert.match(live, /aria-atomic="true"/);
assert.match(quality, /min-block-size:\s*44px/);
assert.match(quality, /forced-colors:\s*active/);
assert.match(quality, /@media print/);
assert.match(quality, /data-quality-profile="economy"/);
assert.match(qualityCenter, /auditVisibleInterface/);
assert.match(qualityCenter, /Perfil visual e de desempenho/);
assert.match(qualityLayer, /unhandledrejection/);
assert.match(qualityLayer, /buildmaster:screen-change/);

console.log('Visual/A11y v29.00: contraste AA das ações, toque, foco, movimento reduzido e regiões ao vivo aprovados.');
