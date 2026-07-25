import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const globals = read('src/app/globals.css').trim();
const layout = read('src/app/layout.tsx');
const app = read('src/components/CardVisionApp.tsx');
const matchLab = read('src/modules/matches/MatchLaboratory.tsx');
const studio = read('src/components/TacticalPosterStudioPanel.tsx');
const team = read('src/modules/squad/TeamFullMapPanel.tsx');
const resultWorkspace = read('src/components/result/ResultWorkspace.tsx');
const dataSafety = read('src/lib/dataSafety.ts');

assert.equal(pkg.version, '30.00.0');
assert.equal(lock.version, '30.00.0');
assert.equal(lock.packages[''].version, '30.00.0');
assert.ok(pkg.scripts['test:all'].startsWith('npm run test:v3000 && npm run test:v2980 && npm run test:v2970 && npm run test:v2960 && npm run test:v2950 && npm run test:v2940 && npm run test:v2930') && pkg.scripts['test:all'].includes('npm run test:v2970'));
assert.match(dataSafety, /CURRENT_DATA_SCHEMA = 3000/);
assert.ok(globals.endsWith('@import "./design-system-v3000-play-publication.css";'));
assert.match(layout, /PremiumExperience2Bootstrap/);
assert.match(layout, /ObservabilityBootstrap/);
for (const file of [
  'src/modules/experience/premiumExperience2.ts',
  'src/modules/experience/PremiumExperience2Center.tsx',
  'src/modules/observability/observabilityEngine.ts',
  'src/modules/observability/ObservabilitySupportCenter.tsx',
  'src/modules/observability/useObservabilityFeatureFlag.ts',
  'src/app/design-system-v2970-premium-observability.css'
]) assert.ok(fs.existsSync(file), `${file} ausente`);
assert.match(app, /settingsView === 'experiencia'/);
assert.match(app, /settingsView === 'suporte'/);
assert.match(app, /premiumExperience2: exportPremiumExperience2State\(\)/);
assert.match(app, /observability: exportObservabilityState\(\)/);
assert.match(matchLab, /featureFlags\.antiDelay/);
assert.match(matchLab, /featureFlags\.smartCoach/);
assert.match(app, /useObservabilityFeatureFlag\('ocrVision2'\)/);
assert.match(studio, /useObservabilityFeatureFlag\('tacticalStudio2'\)/);
assert.match(team, /useObservabilityFeatureFlag\('opponentAssistant'\)/);
assert.match(resultWorkspace, /useObservabilityFeatureFlag\('community'\)/);
assert.equal(JSON.parse(read('public/manifest.webmanifest')).name, 'BuildMaster Elite Tático v30.00');
console.log('v29.70 integrated UI regression: OK');
