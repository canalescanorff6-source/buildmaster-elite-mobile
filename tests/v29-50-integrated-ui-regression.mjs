import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const globals = read('src/app/globals.css').trim();
const layout = read('src/app/layout.tsx');
const studio = read('src/components/TacticalPosterStudioPanel.tsx');
const sequenceUi = read('src/modules/tactical-studio/TacticalStudio2SequencePanel.tsx');
const team = read('src/modules/squad/TeamFullMapPanel.tsx');
const opponentUi = read('src/modules/opponents/OpponentMatchAssistantPanel.tsx');
const opponentEngine = read('src/modules/opponents/opponentMatchAssistant.ts');
const cardApp = read('src/components/CardVisionApp.tsx');
const workflow = read('.github/workflows/build-apk.yml');
assert.equal(pkg.version, '30.00.0');
assert.equal(lock.version, '30.00.0');
assert.equal(lock.packages[''].version, '30.00.0');
assert.ok(pkg.scripts['test:all'].startsWith('npm run test:v3000 && npm run test:v2980 && npm run test:v2970 && npm run test:v2960 && npm run test:v2950 && npm run test:v2940 && npm run test:v2930') && pkg.scripts['test:all'].includes('npm run test:v2950'));
assert.ok(globals.endsWith('@import "./design-system-v3000-play-publication.css";'));
assert.match(layout, /bm-v2950-tactical-opponent/);
assert.match(studio, /TacticalStudio2SequencePanel/);
assert.match(sequenceUi, /Sequências, movimentos e fases do jogo/);
assert.match(sequenceUi, /Reproduzir/);
assert.match(sequenceUi, /Linha do tempo/);
assert.match(sequenceUi, /onPointerDown/);
assert.match(team, /OpponentMatchAssistantPanel/);
assert.match(opponentUi, /Assistente de adversário e plano de partida/);
assert.match(opponentUi, /Plano A/);
assert.match(opponentUi, /Checklist completo/);
assert.match(opponentEngine, /Nenhuma escalação/);
assert.match(cardApp, /readTacticalSequenceProjects/);
assert.match(cardApp, /replaceTacticalSequenceProjects/);
assert.match(cardApp, /readOpponentMatchPlans/);
assert.match(cardApp, /replaceOpponentMatchPlans/);
assert.match(workflow, /v30\.00/);
assert.match(workflow, /MANIFESTO_PRODUCAO_V30\.00\.sha256/);
for (const file of [
  'src/modules/tactical-studio/tacticalStudio2Engine.ts',
  'src/modules/tactical-studio/TacticalStudio2SequencePanel.tsx',
  'src/modules/tactical-studio/tacticalStudio2Storage.ts',
  'src/modules/opponents/opponentMatchAssistant.ts',
  'src/modules/opponents/OpponentMatchAssistantPanel.tsx',
  'src/modules/opponents/opponentPlanStorage.ts',
  'src/app/design-system-v2950-tactical-opponent.css'
]) assert.ok(fs.existsSync(file), `${file} ausente`);
console.log('v29.50 integrated UI regression: OK');
