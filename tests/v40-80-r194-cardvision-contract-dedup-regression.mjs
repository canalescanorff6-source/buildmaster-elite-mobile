import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');
const appPath = 'src/components/CardVisionApp.tsx';
const app = read(appPath);
const easy = read('src/lib/easyExperience.ts');
const navigation = read('src/lib/appNavigationR127.ts');
const analyzerDomain = read('src/lib/analyzerDomain.ts');
const analyzer = read('src/lib/analyzer.ts');
const result = read('src/components/result/ResultWorkspace.tsx');
const resultAdvanced = read('src/components/result/ResultAdvancedWorkspaceR192.tsx');
const teamOptimizer = read('src/lib/teamOptimizer.ts');
const teamMap = read('src/modules/squad/TeamFullMapPanel.tsx');
const pkg = JSON.parse(read('package.json'));
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');

const appBytes = fs.statSync(appPath).size;
const appLines = app.split(/\r?\n/).length;
assert.ok(appBytes <= 111_000, `R194: CardVisionApp voltou a ${appBytes} bytes.`);
assert.ok(appLines <= 1_680, `R194: CardVisionApp voltou a ${appLines} linhas.`);

for (const contract of ['AppTheme', 'AccentTheme', 'TextScale', 'DensityMode', 'MotionPreference', 'PerformanceMode']) {
  assert.match(easy, new RegExp(`export type ${contract} = EasyUiPreferences\\[`), `R194: ${contract} deve derivar de EasyUiPreferences.`);
}
assert.match(navigation, /export type CardVisionVaultView =/, 'R194: view do Cofre precisa de contrato canônico.');
assert.match(navigation, /export type CardVisionSettingsView =/, 'R194: view de Ajustes precisa de contrato canônico.');
assert.doesNotMatch(app, /type AppTheme = 'dark'/, 'R194: CardVisionApp não pode recriar contrato de tema.');
assert.doesNotMatch(app, /type VaultView = 'jogadores'/, 'R194: CardVisionApp não pode recriar view do Cofre.');
assert.doesNotMatch(app, /type SettingsView = 'visao-geral'/, 'R194: CardVisionApp não pode recriar view de Ajustes.');

assert.match(analyzerDomain, /export const TACTICAL_STYLE_NAME:/, 'R194: nomes táticos precisam de fonte única no domínio.');
for (const [source, label] of [[analyzer, 'analyzer'], [result, 'ResultWorkspace'], [teamOptimizer, 'teamOptimizer'], [teamMap, 'TeamFullMapPanel']]) {
  assert.match(source, /TACTICAL_STYLE_NAME/, `R194: ${label} deve consumir nomes táticos canônicos.`);
  assert.doesNotMatch(source, /AUTO: 'Automático inteligente'[\s\S]{0,260}POSSE_DE_BOLA: 'Posse de bola'[\s\S]{0,260}CONTRA_ATAQUE_RAPIDO: 'Contra-ataque rápido'/, `R194: ${label} voltou a manter tabela tática paralela.`);
}
assert.match(teamOptimizer, /POSITION_PT\[/, 'R194: teamOptimizer deve reutilizar POSITION_PT.');
assert.doesNotMatch(teamOptimizer, /const positionPt: Record<PositionCode, string>/, 'R194: teamOptimizer voltou a duplicar posições PT.');
assert.match(result, /POSITION_PT\[code as PositionCode\]/, 'R194: ResultWorkspace deve reutilizar POSITION_PT.');
assert.match(resultAdvanced, /POSITION_PT\[code as PositionCode\]/, 'R194: resultado avançado deve reutilizar POSITION_PT.');

assert.doesNotMatch(app, /safeViewComputationR130|recordPremiumRecentActivity|readVaultTrash,|CARD_REGISTRY_STORAGE_KEY|MATCH_VALIDATION_STORAGE_KEY/, 'R194: imports históricos mortos voltaram ao shell.');
assert.match(app, /const openSettingsView = \(view: CardVisionSettingsView\)/, 'R194: navegação repetida de Ajustes deve permanecer consolidada.');
assert.doesNotMatch(app, /const creationConfigurationReady|const creationStage =/, 'R194: estágios derivados redundantes não podem voltar.');

function walk(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (/\.(?:ts|tsx)$/.test(target)) files.push(target);
    }
  }
  return files;
}
const sourceBytes = walk('src').reduce((sum, file) => sum + fs.statSync(file).size, 0);
const r200Boundary = fs.existsSync('src/modules/vault/cardHistoryStartupModelR200.ts');
assert.ok(sourceBytes <= (r200Boundary ? 5_341_000 : 5_340_500), `R194: redução líquida foi perdida; src voltou a ${sourceBytes} bytes.`);

assert.equal(
  crypto.createHash('sha256').update(r119).digest('hex'),
  '736e631a4aa930bfadf07c81c3330132459ddbaf613531cd4cfc610eacaa1fb5',
  'R194: R119 não pode mudar durante deduplicação de contratos/UI.',
);
const v4080 = String(pkg.scripts?.['test:v4080'] ?? '');
assert.ok(/npm run test:r193 && npm run test:r194(?: && npm run test:r195)?(?: && npm run test:r196)?(?: && npm run test:r197)?(?: && npm run test:r198)?(?: && npm run test:r199)?(?: && npm run test:r200)?$/.test(v4080), 'R194: cadeia v40.80 deve preservar R193 -> R194 antes do gate seguinte.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R194: test:all deve continuar fechando pela bateria v40.80.');

console.log(`R194 aprovada: CardVisionApp=${appLines} linhas/${appBytes} B; src=${sourceBytes} B; contratos de UI/tática deduplicados e R119 intacto.`);
