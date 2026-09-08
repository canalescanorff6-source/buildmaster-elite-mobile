import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const settingsR190 = fs.readFileSync('src/components/settings/CardVisionSettingsWorkspaceR190.tsx', 'utf8');
const chromeR185 = fs.readFileSync('src/components/CardVisionAppChromeR185.tsx', 'utf8');
const integratedUi = `${app}\n${settingsR190}\n${chromeR185}`;
const lazy = [
  fs.readFileSync('src/components/lazy/AppLazyPanels.tsx', 'utf8'),
  fs.readFileSync('src/components/lazy/CardVisionLazyPanelsR174.tsx', 'utf8'),
].join('\n');
const preload = fs.readFileSync('src/components/lazy/AppPanelPreloadR174.ts', 'utf8');

const lazyTargets = [
  ['@/components/AppCommandPalette', 'AppCommandPalette'],
  ['@/components/PremiumMenuScreen', 'PremiumMenuScreen'],
  ['@/components/PremiumSearchScreen', 'PremiumSearchScreen'],
  ['@/components/PremiumSettingsOverview', 'PremiumSettingsOverview'],
  ['@/components/IdentityAppearancePanel', 'IdentityAppearancePanel'],
  ['@/components/RefinementCenterPanel', 'RefinementCenterPanel'],
];

for (const [directImport, exportName] of lazyTargets) {
  const escaped = directImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.doesNotMatch(app, new RegExp(`^import(?!\\s+type)[^\\n]+from ['\"]${escaped}['\"]`, 'm'), `R159 não pode reintroduzir import estático de ${directImport}.`);
  assert.ok(lazy.includes(`import('${directImport}')`), `R159 deve carregar ${directImport} dinamicamente.`);
  assert.match(integratedUi, new RegExp(`<${exportName}\\b`), `${exportName} deve continuar disponível na UI, inclusive via fronteira R190.`);
}

assert.match(chromeR185, /\{onboardingOpen && !showSplash && <SectionErrorBoundary area="primeiro-uso"><FirstUseOnboarding\s+open\b/, 'Onboarding deve ser montado apenas quando realmente aberto na fronteira Chrome atual.');
assert.match(app, /\{commandPaletteOpen && <AppCommandPalette open\b/, 'Paleta de comandos deve ser montada apenas quando realmente aberta.');
assert.doesNotMatch(app, /<FirstUseOnboarding\s+open=\{onboardingOpen && !showSplash\}/, 'R159 não deve montar Onboarding fechado apenas para retornar null internamente.');
assert.doesNotMatch(app, /<AppCommandPalette open=\{commandPaletteOpen\}/, 'R159 não deve montar a Paleta fechada apenas para retornar null internamente.');
assert.match(preload, /ajustes:\s*\[[\s\S]*PremiumSettingsOverview[\s\S]*IdentityAppearancePanel[\s\S]*RefinementCenterPanel/, 'Superfícies de ajustes devem participar do preload adaptativo quando a área Ajustes estiver ativa.');

console.log('R159 aprovada: overlays fechados não montam chunks e menu/busca/ajustes ocasionais estão fora da árvore inicial.');
