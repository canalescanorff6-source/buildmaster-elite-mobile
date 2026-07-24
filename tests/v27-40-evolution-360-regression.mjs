import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const app = read('src/components/CardVisionApp.tsx');
const globals = read('src/app/globals.css');
const css = read('src/app/design-system-v2740-evolution.css');
const engine = read('src/lib/appEvolutionV2740.ts');
const center = read('src/components/EvolutionCommandCenter.tsx');
const hub = read('src/components/EvolutionNotificationHub.tsx');
const dock = read('src/components/SmartQuickDock.tsx');
const experience = read('src/lib/appExperienceV2740.ts');
const experiencePanel = read('src/components/ExperienceOptimizationPanel.tsx');
const workflows = read('src/components/GuidedWorkflowPanel.tsx');
const diagnostics = read('src/components/AppHealthDiagnosticsPanel.tsx');
const layout = read('src/app/layout.tsx');

assert.equal(pkg.version, '29.10.0');
assert.equal(lock.version, '29.10.0');
assert.equal(lock.packages[''].version, '29.10.0');
assert.match(pkg.scripts['test:all'], /^(?:npm run test:v2910 && )?(?:npm run test:v2900 && )?(?:npm run test:v2880 && )?(?:npm run test:v2870 && )?npm run test:v2860 && npm run test:v2850 && npm run test:v2840 && npm run test:v2830 && npm run test:v2820 && npm run test:v2810 && npm run test:v2800 && npm run test:v2740 && npm run test:v2739/);
assert.match(pkg.scripts['test:v2740'], /v27-40-evolution-360-regression\.mjs/);
assert.match(pkg.scripts['test:v2740'], /v27-40-training-core-regression\.ts/);
assert.match(pkg.scripts['test:v2740'], /v27-40-experience-regression\.ts/);
assert.match(globals, /design-system-v2740-evolution\.css/);

for (const file of [
  'src/lib/appEvolutionV2740.ts',
  'src/components/EvolutionCommandCenter.tsx',
  'src/components/EvolutionNotificationHub.tsx',
  'src/components/SmartQuickDock.tsx',
  'src/app/design-system-v2740-evolution.css',
  'src/lib/trainingPlanCore.ts',
  'src/lib/appExperienceV2740.ts',
  'src/components/ExperienceOptimizationPanel.tsx',
  'src/components/GuidedWorkflowPanel.tsx',
  'src/components/AppHealthDiagnosticsPanel.tsx',
  'src/components/ExperiencePreferenceBootstrap.tsx',
  'src/components/ResultSafetyBoundary.tsx'
]) assert.equal(exists(file), true, `${file} ausente`);

assert.match(app, /EvolutionCommandCenter/);
assert.match(app, /ResultSafetyBoundary/);
assert.doesNotMatch(app, /class ResultSafetyBoundary extends Component/);
assert.match(app, /EvolutionNotificationHub/);
assert.match(app, /SmartQuickDock/);
assert.match(app, /settingsView === 'evolucao'/);
assert.match(app, /openEvolutionTarget/);
assert.match(app, /applyAdaptiveExperienceProfile/);
assert.match(app, /Evolução 360/);

assert.match(engine, /buildEvolutionNotifications/);
assert.match(engine, /buildEvolutionScore/);
assert.match(engine, /buildMaintenanceChecklist/);
assert.match(engine, /detectAdaptiveExperienceProfile/);
assert.match(engine, /exportEvolutionReport/);
assert.match(engine, /createEvolutionGoal/);
assert.match(engine, /saveFocusLog/);
assert.match(engine, /safeStorageGetJson/);
assert.match(engine, /safeStorageSetJson/);
assert.match(read('src/lib/analyzer.ts'), /from '\.\/trainingPlanCore'/);
assert.doesNotMatch(engine, /fetch\(/);

for (const label of ['Visão 360', 'Pendências', 'Metas', 'Foco', 'Rotinas', 'Experiência', 'Aparelho', 'Manutenção', 'Diagnóstico']) assert.match(center, new RegExp(label));
assert.match(center, /Aplicar perfil recomendado/);
assert.match(center, /Exportar relatório 360/);
assert.match(center, /Caixa de pendências inteligente/);
assert.match(hub, /Pendências inteligentes/);
assert.match(dock, /Atalhos inteligentes/);
assert.match(experience, /GUIDED_WORKFLOWS/);
assert.match(experience, /inspectAppHealth/);
assert.match(experience, /applyExperiencePreferences/);
assert.doesNotMatch(experience, /fetch\(/);
assert.match(experiencePanel, /Experiência adaptável/);
assert.match(experiencePanel, /Alto contraste/);
assert.match(workflows, /Rotinas guiadas/);
assert.match(experience, /Analisar uma carta nova/);
assert.match(diagnostics, /Diagnóstico local/);
assert.match(diagnostics, /não inclui senha/);
assert.match(layout, /ExperiencePreferenceBootstrap/);

assert.match(css, /\.evolution-360/);
assert.match(css, /\.evolution-notification-hub/);
assert.match(css, /\.smart-quick-dock/);
assert.match(css, /\.experience-optimizer/);
assert.match(css, /\.guided-workflows/);
assert.match(css, /\.app-health-diagnostics/);
assert.match(css, /data-bm-contrast/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /@media \(max-width: 620px\)/);

assert.equal(exists('public/update-manifest.json'), false);
assert.doesNotMatch(app, /NEXT_PUBLIC_BUILDMASTER_LOCAL_ADMIN_PASSWORD/);
assert.doesNotMatch(app, /api\/cloud\/fichas/);

console.log('v28.10 evolution 360 regression: ok');
