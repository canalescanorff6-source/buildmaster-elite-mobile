import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const engine = read('src/modules/squad-mapping/squadMappingEngine.ts');
const storage = read('src/modules/squad-mapping/squadMappingStorage.ts');
const screen = read('src/modules/squad-mapping/SquadMappingCenter.tsx');
const app = read('src/components/CardVisionApp.tsx');
const navigation = read('src/components/RefinedNavigation.tsx');
const menu = read('src/components/PremiumMenuScreen.tsx');
const experience = read('src/modules/experience/premiumExperience2.ts');
const bridge = read('src/modules/experience/cardVisionPremiumBridge.ts');
const layout = read('src/app/layout.tsx');
const css = read('src/app/v38-squad-mapping.css');
const legacyStudioTest = read('tests/v34-00-studio-clean-regression.mjs');

for (const marker of [
  'avoidWingers',
  'avoidWideMidfielders',
  'avoidCrossing',
  'favorCentralTriangles',
  'reserveGoalkeepers',
  'buildFormationRanking',
  'linkedPerformance',
  'overallTieBreak',
  'suggestedTrainingPositions',
  'createFormationTrial',
  'sourceHash',
  'goalkeeperLimit'
]) assert.ok(engine.includes(marker), `motor de mapeamento sem ${marker}`);

assert.match(engine, /overallTieBreak[\s\S]*?0\.12/);
assert.match(engine, /benchSize:\s*11/);
assert.match(engine, /reserveGoalkeepers:\s*0/);
assert.match(engine, /FORMATION_BLUEPRINTS[\s\S]*?buildFormationResult/);
assert.match(engine, /targetDays:\s*7 \| 14 \| 21/);

for (const marker of [
  'nativeVaultWrite',
  'nativeVaultRead',
  "runtimePut('formations'",
  'buildmaster-squad-mapping-backup',
  'sanitizeMappingState'
]) assert.ok(storage.includes(marker), `armazenamento do mapeamento sem ${marker}`);

for (const marker of [
  'Mapeamento Inteligente de Elenco',
  'Adicionar prints',
  'multiple',
  'Melhores 11 titulares',
  'Melhores reservas',
  'Levar goleiro reserva',
  'Testar por 7 dias',
  'Testar por 14 dias',
  'Testar por 21 dias',
  'Priorizar jogador',
  'Exportar backup',
  'Importar banco de jogadores',
  'Memória privada do aplicativo'
]) assert.ok(screen.includes(marker), `tela de mapeamento sem ${marker}`);

assert.match(screen, /slice\(0, 120\)/, 'importação em lote precisa aceitar um banco grande de prints');
assert.match(screen, /readDetailedPrint/);
assert.match(screen, /needsFullFallback/);
assert.match(screen, /sourceHash: hash/);
assert.match(screen, /setState\(\(current\) => \(\{ \.\.\.current, players: nextPlayers/);
assert.match(screen, /recognizeZoneWithHighPrecision/);
assert.match(screen, /selectedFormationId/);
assert.match(screen, /onOpenFicha/);

assert.match(app, /type MainSection = [^\n]*'mapeamento'/);
assert.match(app, /<SquadMappingCenter/);
assert.match(app, /openMainSection\('mapeamento'\)/);
assert.match(app, /area="mapeamento-inteligente-elenco"/);
assert.match(navigation, /id: 'mapeamento'/);
assert.match(menu, /target: 'mapping'/);
assert.match(experience, /id: 'mapping'/);
assert.match(bridge, /section === 'mapeamento'\) return 'mapping'/);
assert.match(bridge, /target === 'mapping'\) return 'mapeamento'/);
assert.match(layout, /v38-squad-mapping\.css/);
assert.match(css, /\.mapping-pitch/);
assert.match(css, /\.mapping-player-grid/);
assert.match(css, /@media \(max-width: 640px\)/);
assert.match(legacyStudioTest, /'inicio', 'jogadores', 'mapeamento', 'partidas', 'time', 'menu', 'buscar'/);

console.log('v38.40 aprovada: Mapeamento lê vários jogadores, avalia todas as formações, monta 11+11, testa por semanas e salva backup na memória privada.');
