import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const navigation = read('src/components/RefinedNavigation.tsx');
const app = read('src/components/CardVisionApp.tsx');
const team = read('src/modules/core/centralIntelligence.ts');
const squad = read('src/lib/professionalSquadEngine.ts');
const cache = read('src/components/RegisterServiceWorker.tsx');
const layout = read('src/app/layout.tsx');
const css = read('src/app/v33-executive.css');
const pkg = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('public/manifest.webmanifest'));

assert.ok(Number(pkg.version.split('.')[0]) >= 33, `Versão visual precisa ser v33 ou superior: ${pkg.version}`);
assert.match(manifest.name, /BuildMaster Elite Tático v(?:33|3[4-9]|[4-9]\d)\./);
assert.match(layout, /v33-executive\.css/);
assert.match(layout, /bm-v3300-executive/);

assert.match(navigation, /bm-v33-drawer-trigger/);
assert.match(navigation, /bm-v33-drawer-backdrop/);
assert.match(navigation, /bm-v33-sidebar/);
assert.doesNotMatch(navigation, /bm-simple-mobile-nav/);
assert.match(navigation, /onWorkspaceChange\('visao-geral'\)/, 'Jogadores precisa abrir diretamente o banco de jogadores.');
assert.match(navigation, /Meu Time/);
assert.match(navigation, /aria-expanded=\{drawerOpen\}/);

assert.match(app, /openMainSection\(sectionForNavigation\(group, 'visao-geral'\)\)/, 'A entrada principal não pode reutilizar uma subaba antiga.');
assert.match(app, /(?:EXECUTIVE_THEME_MIGRATION_KEY|STUDIO_THEME_MIGRATION_KEY|IDENTITY_THEME_MIGRATION_KEY)/);
assert.ok(/setAppTheme\((?:executiveMigrated|studioMigrated) \? ui\.appTheme : '(?:light|dark)'\)/.test(app) || /setAppTheme\(selectedPreset === 'pearl-executive' \? 'light' : 'dark'\)/.test(app), 'A migração visual precisa escolher um tema com contraste definido.');
assert.doesNotMatch(team, /lineScores\.at\(/, 'Meu Time precisa ser compatível com WebViews Android sem Array.at.');
assert.doesNotMatch(squad, /lineScores\.at\(/, 'O diagnóstico profissional precisa ser compatível com WebViews Android antigos.');

assert.match(cache, /NATIVE_CACHE_SCHEMA = '(?:33\.00\.0-studio-clean-2|34\.00\.0-[^']+|35\.(?:00|10|20)\.0-[^']+|36\.00\.0-[^']+|37\.(?:00|40|50|60|70|80|90)\.0-[^']+|38\.(?:00|10|20|30|31)\.0-[^']+)'/);
assert.match(cache, /currentSchema !== NATIVE_CACHE_SCHEMA/);
assert.match(cache, /safeStorageSet\(NATIVE_CACHE_SCHEMA_KEY/);

for (const marker of [
  '--v33-bg',
  '.bm-v33-sidebar',
  '.bm-v33-drawer',
  '.bm-v3300-executive .bm32-team-screen',
  '.bm-v3300-executive .player-laboratory',
  '@media (max-width: 920px)'
]) assert.ok(css.includes(marker), `Camada visual v33 incompleta: ${marker}`);

assert.match(css, /\.bm-v3300-executive \.smart-quick-dock \{ display: none !important; \}/);
assert.match(css, /backdrop-filter: none !important/);

console.log('v33.00 Executive aprovado: navegação lateral, rotas Jogadores/Meu Time, cache pós-atualização e tema completo validados.');
