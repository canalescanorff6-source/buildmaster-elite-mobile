import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const globals = read('src/app/globals.css');
const refinementCss = read('src/app/design-system-v2739-refinement.css');
const app = read('src/components/CardVisionApp.tsx');
const auth = read('src/components/AuthGate.tsx');
const nav = read('src/components/RefinedNavigation.tsx');
const home = read('src/modules/core/IntegratedHomePanel.tsx');
const players = read('src/modules/players/PlayerLaboratory.tsx');
const team = read('src/modules/squad/IntegratedTeamLab.tsx');
const matches = read('src/modules/matches/MatchLaboratory.tsx');
const studio = read('src/components/TacticalPosterStudioPanel.tsx');
const refinement = read('src/components/RefinementCenterPanel.tsx');
const dataTools = read('src/lib/refinementDataTools.ts');
const trash = read('src/lib/vaultTrash.ts');
const updates = read('src/lib/appUpdates.ts');
const dataSafety = read('src/lib/dataSafety.ts');

assert.equal(pkg.version, '27.39.0');
assert.equal(lock.version, '27.39.0');
assert.equal(lock.packages[''].version, '27.39.0');
assert.match(pkg.scripts['test:all'], /^npm run test:v2739 && npm run test:v2738/);
assert.match(globals, /design-system-v2739-refinement\.css/);
assert.match(refinementCss, /--bm-touch:\s*48px/);
assert.match(refinementCss, /:focus-visible/);
assert.match(refinementCss, /prefers-reduced-motion/);
assert.match(refinementCss, /\.refined-primary-nav/);

for (const label of ['Início', 'Jogadores', 'Meu Time', 'Partidas', 'Ajustes']) assert.match(nav, new RegExp(label));
assert.match(nav, /Áreas de Jogadores/);
assert.match(app, /RefinedNavigation/);
assert.match(app, /LiveStatusRegion/);
assert.match(app, /RefinementCenterPanel/);
assert.match(app, /moveToVaultTrash/);
assert.match(app, /exportIncrementalBackup/);
assert.match(app, /structuredClone\(migrated\.envelope\.sections\)/);
assert.match(app, /mergeSelectedHistory/);

assert.match(auth, /CapsLock/);
assert.match(auth, /navigator\.onLine/);
assert.match(auth, /Tentar novamente/);
assert.match(home, /Continue de onde parou/);
assert.match(home, /atalhos/i);
assert.match(players, /Modo de visualização/);
assert.match(players, /possíveis duplicatas/);
assert.match(players, /Mesclar/);
assert.match(team, /Modo jogo/);
assert.match(team, /Comparar formações/);
assert.match(team, /Exportar/);
assert.match(matches, /Planejar/);
assert.match(matches, /Executar/);
assert.match(matches, /Analisar/);
assert.match(matches, /Meta semanal/);
assert.match(matches, /Registrar repetição/);
assert.match(matches, /Exportar semana/);
assert.match(studio, /Desfazer/);
assert.match(studio, /Refazer/);
assert.match(studio, /Mostrar grade/);
assert.match(studio, /Selecionar todos/);
assert.match(studio, /Bloquear seleção/);
assert.match(studio, /preflight/i);
assert.match(refinement, /Relatório mensal/);
assert.match(refinement, /Recursos/);
assert.match(refinement, /role="switch"/);
assert.match(refinement, /Importador inteligente de projetos antigos/);
assert.match(dataTools, /buildMonthlyEvolutionReport/);
assert.match(dataTools, /inspectLegacyProject/);
assert.match(trash, /RETENTION_DAYS\s*=\s*30/);
assert.match(updates, /27\.39\.0/);
assert.match(dataSafety, /APP_DATA_VERSION\s*=\s*'27\.39\.0'/);

for (const file of [
  'src/lib/appRefinement.ts',
  'src/lib/refinementDataTools.ts',
  'src/lib/vaultTrash.ts',
  'src/components/RefinedNavigation.tsx',
  'src/components/RefinementCenterPanel.tsx',
  'src/components/LiveStatusRegion.tsx',
  'src/modules/core/IntegratedHomePanel.tsx',
  'src/modules/players/PlayerLaboratory.tsx',
  'src/modules/squad/IntegratedTeamLab.tsx',
  'src/modules/matches/MatchLaboratory.tsx'
]) assert.equal(exists(file), true, `${file} ausente`);

assert.equal(exists('public/update-manifest.json'), false);
assert.doesNotMatch(app, /NEXT_PUBLIC_BUILDMASTER_LOCAL_ADMIN_PASSWORD/);
assert.doesNotMatch(app, /api\/cloud\/fichas/);

console.log('v27.39 total refinement regression: ok');
