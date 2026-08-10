import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('src/app/globals.css', 'utf8');
const auth = fs.readFileSync('src/components/AuthGate.tsx', 'utf8');
const navigation = fs.readFileSync('src/components/RefinedNavigation.tsx', 'utf8');
const live = fs.readFileSync('src/components/LiveStatusRegion.tsx', 'utf8');
const qualityCenter = fs.readFileSync('src/components/PremiumQualityCenter.tsx', 'utf8');
const qualityLayer = fs.readFileSync('src/components/PremiumQualityLayer.tsx', 'utf8');
const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const cardVisionApp = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const stabilityTheme = fs.readFileSync('src/app/v38-stability-theme.css', 'utf8');

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
assert.doesNotMatch(css, /@import\s+['"]/i, 'O tema deve estar consolidado.');
for (const marker of ['--bm-touch:', ':focus-visible', 'prefers-reduced-motion: reduce', 'min-block-size: 44px', 'forced-colors: active', '@media print', 'data-quality-profile="economy"', '.bm-v3000-play-publication']) {
  assert.ok(css.includes(marker), `Contrato visual ausente: ${marker}`);
}
assert.match(auth, /CapsLock/);
assert.match(auth, /aria-busy=\{loading\}/);
assert.match(auth, /aria-live="polite"/);
assert.match(navigation, /aria-label="Navegação lateral principal"/);
assert.match(navigation, /aria-label="Abrir menu lateral"/);
assert.match(navigation, /aria-modal="true"/);
assert.match(live, /aria-live=\{urgent \? 'assertive' : 'polite'\}/);
assert.match(live, /aria-atomic="true"/);
assert.match(qualityCenter, /auditVisibleInterface/);
assert.match(qualityCenter, /Perfil visual e de desempenho/);
assert.match(qualityLayer, /unhandledrejection/);
assert.match(qualityLayer, /buildmaster:screen-change/);


assert.match(cardVisionApp, /data-theme=\{appTheme\}/, 'O tema ativo precisa ser exposto como data-theme para as proteções globais de contraste.');
assert.ok(layout.indexOf("./v38-stability-theme.css") > layout.indexOf("./v38-reader-speed-contrast.css"), 'A camada de consistência visual precisa ser a última folha de estilo do app.');
for (const marker of [".premium-app[data-theme='dark']", 'color-scheme: dark', '.auth-caps-warning', '.architecture-tier-balanced', '.bm2980-warning']) {
  assert.ok(stabilityTheme.includes(marker), `Proteção visual global ausente: ${marker}`);
}

console.log('Visual e acessibilidade: contraste, toque, foco, movimento reduzido e regiões ao vivo aprovados.');
