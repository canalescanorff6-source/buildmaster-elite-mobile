import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const engine = read('src/modules/squad-mapping/squadMappingEngine.ts');
const center = read('src/modules/squad-mapping/SquadMappingCenter.tsx');
const storage = read('src/modules/squad-mapping/squadMappingStorage.ts');
const app = read('src/components/CardVisionApp.tsx');
const nav = read('src/lib/appNavigationR127.ts');
const repair = read('scripts/repair-root-tsconfig.mjs');

assert.match(engine, /offensivePlaystyle\?: string \| null/);
assert.match(engine, /defensivePlaystyle\?: string \| null/);
assert.match(engine, /trainingPointsTotal\?: number \| null/);
assert.match(engine, /shouldMergeMasterRosterCardsR436/);
assert.match(engine, /existing\.find\(\(player\) => shouldMergeMasterRosterCardsR436\(player, incoming\)\)/);

assert.match(center, /masterRosterCardReadinessR436/);
assert.match(center, /masterRosterSearchTextR436/);
assert.match(center, /onGenerateFicha\?: \(player: SquadMappingPlayer\) => void/);
assert.doesNotMatch(center, /Array\.from\(files\)\.slice\(0,\s*120\)/, 'R436 deve aceitar as 222 imagens sem truncar a seleção em 120.');
assert.match(center, /const selected = Array\.from\(files\);/);
assert.match(center, /Gerar ficha sem OCR/);
assert.match(center, /Ficha direta pronta/);
assert.match(center, /offensivePlaystyle:/);
assert.match(center, /defensivePlaystyle:/);
assert.match(center, /trainingPointsTotal:/);

assert.match(storage, /offensivePlaystyle:/);
assert.match(storage, /defensivePlaystyle:/);
assert.match(storage, /trainingPointsTotal:/);

assert.match(app, /generateFichaFromMasterRosterR436/);
assert.match(app, /buildMasterRosterRawTextR436/);
assert.match(app, /masterRosterCardReadinessR436/);
assert.match(app, /createProductionAnalysisR138/);
assert.match(app, /onGenerateFicha=\{\(player\) => void generateFichaFromMasterRosterR436\(player\)\}/);
assert.match(app, /setManualFields\(\{/);
assert.match(app, /openMainSection\('resultado'\)/);

assert.match(nav, /id: 'mapeamento', label: 'Meu Elenco'/);
assert.match(repair, /applyR436MasterRosterCatalog/);

console.log('R436 integração aprovada: Meu Elenco sem limite 120, variantes preservadas e geração direta sem OCR conectada ao Motor Mestre.');
