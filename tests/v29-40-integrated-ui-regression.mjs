import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const globals = read('src/app/globals.css').trim();
const layout = read('src/app/layout.tsx');
const players = read('src/modules/players/PlayerLaboratory.tsx');
const lab = read('src/modules/players/AdvancedPlayerLab.tsx');
const engine = read('src/modules/players/advancedPlayerLaboratory.ts');
const rules = read('src/modules/rules/officialRuleRegistry.ts');
const rulesUi = read('src/modules/rules/OfficialRulesCenter.tsx');
const workflow = read('.github/workflows/build-apk.yml');
const cardApp = read('src/components/CardVisionApp.tsx');

assert.equal(pkg.version, '30.00.0');
assert.equal(lock.version, '30.00.0');
assert.equal(lock.packages[''].version, '30.00.0');
assert.ok(pkg.scripts['test:all'].startsWith('npm run test:v3000 && npm run test:v2980 && npm run test:v2970 && npm run test:v2960 && npm run test:v2950 && npm run test:v2940 && npm run test:v2930') && pkg.scripts['test:all'].includes('npm run test:v2940'));
assert.ok(globals.endsWith('@import "./design-system-v3000-play-publication.css";'));
assert.match(layout, /bm-v2940-player-lab/);
assert.match(players, /<AdvancedPlayerLab player=\{selected\}/);
assert.match(lab, /Laboratório avançado de jogadores/);
assert.match(lab, /Histórico de versões/);
assert.match(lab, /Modelos favoritos/);
assert.match(lab, /Radar tático/);
assert.match(engine, /competitive.*balanced.*offensive.*personalized/s);
assert.match(engine, /posição escolhida pelo usuário nunca é alterada/i);
assert.match(rules, /OFFICIAL_RULE_SCHEMA = 2/);
assert.match(rules, /reviewOfficialRulePack/);
assert.match(rules, /bloqueio de downgrade|downgrade acidental/i);
assert.match(rulesUi, /Prévia do pacote/);
assert.match(rulesUi, /Confirmação explícita|Quero ativar este pacote/);
assert.match(rulesUi, /Auditoria/);
assert.match(cardApp, /activateOfficialRulePack\(officialPack, \{ confirmed: true, reason: 'Restauração confirmada pelo usuário/);
assert.match(workflow, /v30\.00/);
assert.match(workflow, /MANIFESTO_PRODUCAO_V30\.00\.sha256/);
for (const file of [
  'src/modules/players/advancedPlayerLaboratory.ts',
  'src/modules/players/AdvancedPlayerLab.tsx',
  'src/app/design-system-v2940-rules-player-lab.css',
  'tests/v29-40-rules-player-lab-regression.ts'
]) assert.ok(fs.existsSync(file), `${file} ausente`);
console.log('v29.40 integrated UI regression: OK');
