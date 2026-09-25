import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const menu = read('src/components/PremiumMenuScreen.tsx');
const app = read('src/components/CardVisionApp.tsx');
const settings = read('src/components/settings/CardVisionSettingsWorkspaceR190.tsx');
const preload = read('src/components/lazy/AppPanelPreloadR174.ts');
const lazy = read('src/components/lazy/CardVisionLazyPanelsR174.tsx');

const menuType = menu.match(/type MenuTarget = ([^;]+);/)?.[1] ?? '';
for (const target of ['mapping', 'accounts', 'backup', 'updates', 'support', 'search']) {
  assert.ok(!menuType.includes(`'${target}'`), `R473: MenuTarget voltou a carregar destino morto ${target}.`);
}
assert.doesNotMatch(menu, /favoriteCount:\s*number|level\?:\s*number/, 'R473: props antigas de gamificação/favoritos voltaram ao Menu.');
assert.doesNotMatch(app, /favoriteCount=\{/, 'R473: shell voltou a calcular favoritos apenas para o Menu.');
assert.doesNotMatch(app, /target === '(?:mapping|accounts|backup|updates|support|search)'/, 'R473: handlers mortos voltaram ao Menu.');

for (const view of ['evolucao', 'experiencia', 'comunidade', 'comercial']) {
  assert.doesNotMatch(settings, new RegExp(`settingsView === ['"]${view}['"]`), `R473: view aposentada voltou a ser renderizada: ${view}.`);
}
assert.match(app, /retiredViews:[^=]*= \['evolucao', 'experiencia', 'comunidade', 'comercial'\]/, 'R473: estados antigos precisam continuar redirecionados com segurança.');

for (const target of [
  '@/components/EvolutionCommandCenter',
  '@/components/ArchitectureHealthPanel',
  '@/components/PremiumQualityCenter',
  '@/components/EliteEvolutionPanels',
  '@/modules/quality/ProductionReadinessCenter',
  '@/modules/rules/OfficialRulesCenter',
  '@/modules/experience/PremiumExperience2Center',
  '@/modules/observability/ObservabilitySupportCenter',
  '@/modules/community/CommunitySharingCenter',
  '@/modules/commercial/CommercializationCenter',
  '@/modules/publication/PlayStorePublicationCenter',
]) {
  assert.ok(!preload.includes(`import('${target}')`), `R473: preload normal voltou a antecipar ${target}.`);
}

for (const target of [
  '@/components/PremiumSettingsOverview',
  '@/components/IdentityAppearancePanel',
  '@/components/RefinementCenterPanel',
  '@/components/UpdateCenterPanel',
  '@/modules/backup/CloudSyncCenter',
]) {
  assert.ok(preload.includes(`import('${target}')`), `R473: preload essencial perdeu ${target}.`);
}

for (const target of [
  '@/components/ArchitectureHealthPanel',
  '@/modules/observability/ObservabilitySupportCenter',
  '@/modules/publication/PlayStorePublicationCenter',
]) {
  assert.ok(lazy.includes(`import('${target}')`), `R473: ferramenta avançada deixou de existir no registro lazy: ${target}.`);
}

for (const retired of [
  '@/components/EvolutionCommandCenter',
  '@/modules/experience/PremiumExperience2Center',
  '@/modules/community/CommunitySharingCenter',
  '@/modules/commercial/CommercializationCenter',
]) {
  assert.ok(!lazy.includes(`import('${retired}')`), `R473: registro lazy voltou a declarar superfície aposentada ${retired}.`);
}

for (const retiredFile of [
  'src/components/EvolutionCommandCenter.tsx',
  'src/modules/experience/PremiumExperience2Center.tsx',
  'src/modules/community/CommunitySharingCenter.tsx',
  'src/modules/commercial/CommercializationCenter.tsx',
]) {
  assert.ok(!fs.existsSync(retiredFile), `R473: arquivo de UI aposentado voltou ao source: ${retiredFile}.`);
}

assert.ok(fs.statSync('src/components/CardVisionApp.tsx').size <= 112_000, 'R473: CardVisionApp perdeu novamente a margem de limpeza.');
assert.ok(fs.statSync('src/components/lazy/AppPanelPreloadR174.ts').size < 5_000, 'R473: catálogo de preload voltou a crescer demais.');

console.log('R473 aprovada: Menu, Ajustes e preload permanecem limpos; ferramentas avançadas continuam lazy e disponíveis sob demanda.');
