import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const layout = read('src/app/layout.tsx');
const css = read('src/app/v34-studio.css');
const navigation = read('src/components/RefinedNavigation.tsx');
const app = read('src/components/CardVisionApp.tsx');
const auth = read('src/components/AuthGate.tsx');
const cache = read('src/components/RegisterServiceWorker.tsx');
const team = read('src/modules/squad/IntegratedTeamLab.tsx');
const matches = read('src/modules/matches/MatchLaboratory.tsx');
const formations = read('src/components/FormationRoleLabPanel.tsx');
const players = read('src/modules/players/PlayerLaboratory.tsx');

assert.ok(Number(pkg.version.split('.')[0]) >= 34, `Versão esperada 34 ou superior, recebida ${pkg.version}`);
assert.match(manifest.name, /^BuildMaster Elite Tático v(?:34|3[5-9]|[4-9]\d)\./);
assert.ok(['#07111f', '#050a12'].includes(manifest.theme_color));
assert.match(layout, /v34-studio\.css/);
assert.match(layout, /bm-v3400-studio/);

for (const marker of [
  '--v34-bg: #07111f',
  '--v34-surface: #0f1d2e',
  '--v34-text: #f5f7fb',
  '.bm-v3400-studio .bm-v33-sidebar',
  '.bm-v3400-studio .bm-v34-team-workspace',
  '.bm-v3400-studio .global-update-notice',
  '.bm-v3400-studio .efhub-calibration-canvas>img',
  '.app-runtime-status.runtime-offline',
  '@media (max-width: 520px)'
]) assert.ok(css.includes(marker), `Camada Studio Premium incompleta: ${marker}`);
assert.doesNotMatch(css, /--v34-bg:\s*#eef2f7/);
assert.doesNotMatch(css, /background:\s*#fff\s*!important/);

assert.doesNotMatch(navigation, /bm-v33-player-workflow/);
assert.doesNotMatch(navigation, /FLUXO DE FICHAS/);
assert.match(navigation, /Abrir ficha atual/);
assert.match(navigation, /onWorkspaceChange\('visao-geral'\)/);
assert.match(navigation, /aria-current=\{item\.active \? 'page'/);
assert.match(navigation, /(?:Studio Premium · v34\.00|Performance Suite · v36\.00|Professional Suite · v(?:37\.00|38\.(?:3[2-9]|40)|40\.00))/);

for (const source of [team, matches, formations]) {
  assert.match(source, /function selectTab/);
  assert.match(source, /scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/);
  assert.match(source, /className="bm34-tab-panel"/);
  assert.match(source, /role="tabpanel"/);
}
assert.match(team, /role="tablist"/);
assert.match(matches, /role="tablist"/);
assert.match(formations, /role="tablist"/);
assert.match(players, /role="tablist"/);
assert.match(players, /aria-selected=\{category === 'todos'\}/);

assert.match(app, /safeIntegratedPlayers/);
assert.match(app, /safeTeamDiagnosis/);
assert.match(app, /safeCentralDashboard/);
assert.match(app, /central-player-normalization/);
assert.match(app, /team-diagnosis/);
assert.match(app, /mainSection === 'time'/);
assert.match(app, /bm-v34-team-advanced/);
assert.match(app, /setTeamAdvancedOpen\(true\)/);
assert.match(app, /!\['inicio', 'jogadores', 'mapeamento', 'partidas', 'time', 'menu', 'buscar'\]\.includes\(mainSection\)/);

assert.doesNotMatch(auth, /offlineBannerExpanded/);
assert.doesNotMatch(auth, /offline-license-banner/);
assert.doesNotMatch(auth, /offline-license-toggle/);
assert.doesNotMatch(auth, /offline-license-retry/);
assert.match(cache, /(?:34\.00\.0-touch-scroll-menu-5|35\.00\.0-official-skills-meta-2)/);

console.log('v34.00 Studio Premium aprovado: tema unificado, menu lateral, guias com painel visível, avisos compactos e módulos protegidos.');
