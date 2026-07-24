import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const globals = read('src/app/globals.css');
const matchLab = read('src/modules/matches/MatchLaboratory.tsx');
const panel = read('src/modules/training/TrainingEvolutionCenter.tsx');
const engine = read('src/modules/training/trainingEvolutionEngine.ts');
const app = read('src/components/CardVisionApp.tsx');
const css = read('src/app/design-system-v2880-training.css');
const workflow = read('.github/workflows/build-apk.yml');

assert.equal(pkg.version, '29.10.0');
assert.equal(lock.version, '29.10.0');
assert.equal(lock.packages[''].version, '29.10.0');
assert.match(pkg.scripts['test:all'], /^(?:npm run test:v2910 && )?npm run test:v2900 && npm run test:v2880 && npm run test:v2870/);
assert.match(pkg.scripts['test:v2880'], /v28-80-training-evolution-engine-regression\.ts/);
assert.match(pkg.scripts['test:v2880'], /v28-80-training-evolution-ui-regression\.mjs/);
assert.match(workflow, /Gerar APK v29\.10/);

for (const file of [
  'src/modules/training/trainingEvolutionEngine.ts',
  'src/modules/training/TrainingEvolutionCenter.tsx',
  'src/app/design-system-v2880-training.css',
  'tests/v28-80-training-evolution-engine-regression.ts',
  'tests/v28-80-training-evolution-ui-regression.mjs'
]) assert.equal(exists(file), true, `${file} ausente`);

assert.match(engine, /TRAINING_EVOLUTION_VERSION = '28\.80\.0'/);
assert.match(engine, /TRAINING_DRILLS_V2880/);
assert.match(engine, /buildDailyTrainingPlan/);
assert.match(engine, /buildWeeklyTrainingPlan/);
assert.match(engine, /analyzeTrainingEvolution/);
assert.match(engine, /buildPostTrainingAnalysis/);
assert.match(engine, /buildRankedPreparation/);
assert.match(engine, /migrateLegacyTrainingSessions/);
assert.doesNotMatch(engine, /fetch\(/);

for (const label of ['Hoje', 'Semana', 'Executar', 'Evolução', 'Ranqueada']) assert.match(panel, new RegExp(label));
for (const label of ['Ataque', 'Defesa', 'Posse de bola', 'Contra-ataque']) assert.match(engine, new RegExp(label));
assert.match(panel, /Cronômetro ativo/);
assert.match(panel, /Registro rápido/);
assert.match(panel, /Erros mais repetidos/);
assert.match(panel, /Prontidão competitiva/);
assert.match(panel, /buildmaster:training-evolution-updated/);
assert.match(panel, /LEGACY_GUIDED_KEY/);
assert.match(panel, /LEGACY_CARD_KEY/);

assert.match(matchLab, /TrainingEvolutionCenter/);
assert.match(matchLab, /type MatchTab = 'competitivo'/);
assert.match(matchLab, /Treinos e evolução/);
assert.match(app, /teamStyle=\{teamStyle\}/);
assert.match(globals, /design-system-v2880-training\.css/);
assert.match(globals.trim(), /design-system-v2910-admin-update\.css";$/);
assert.match(css, /\.training-evolution-v2880/);
assert.match(css, /\.training-execution-layout/);
assert.match(css, /\.ranked-readiness-card/);
assert.match(css, /@media \(max-width: 560px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /min-height:\s*44px/);

console.log('v28.80 training evolution UI regression: ok');
