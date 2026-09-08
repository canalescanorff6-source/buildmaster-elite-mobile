import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');
const appPath = 'src/components/CardVisionApp.tsx';
const settingsPath = 'src/components/settings/CardVisionSettingsWorkspaceR190.tsx';
const analyzerPath = 'src/lib/analyzer.ts';
const app = read(appPath);
const settings = read(settingsPath);
const analyzer = read(analyzerPath);
const pkg = JSON.parse(read('package.json'));
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');

const appBytes = fs.statSync(appPath).size;
const appLines = app.split(/\r?\n/).length;
const analyzerBytes = fs.statSync(analyzerPath).size;
assert.ok(appBytes <= 108_000, `R195: CardVisionApp voltou a ${appBytes} bytes.`);
assert.ok(appLines <= 1_620, `R195: CardVisionApp voltou a ${appLines} linhas.`);
assert.ok(analyzerBytes <= 109_500, `R195: analyzer voltou a ${analyzerBytes} bytes.`);

assert.match(app, /const vaultActionsR185 = useCardVisionVaultActionsR185\(/, 'R195: objeto canônico de ações do Cofre deve ser preservado.');
assert.match(app, /actions=\{vaultActionsR185\}/, 'R195: Cofre deve receber o objeto canônico R185 sem reempacotar dezenas de handlers.');
assert.doesNotMatch(app, /actions=\{\{[\s\S]{0,900}createVaultFolder[\s\S]{0,900}permanentlyDeleteHistoryItem/, 'R195: shell não pode voltar a reconstruir o pacote de ações do Cofre.');
assert.match(app, /const backupControllerR162 = useCardVisionBackupControllerR162\(/, 'R195: controller de backup precisa permanecer identificável.');
assert.match(app, /backup=\{backupControllerR162\}/, 'R195: Ajustes deve consumir o controller canônico R162.');
assert.match(settings, /\}\s*= backup;/, 'R195: workspace de Ajustes deve ler backup pela fronteira R162 recebida.');
assert.match(app, /experience=\{experienceControllerR178\}/, 'R195: Ajustes deve consumir o controller de experiência R178 sem props achatadas.');
assert.match(settings, /\}\s*= experience;/, 'R195: workspace de Ajustes deve ler a fronteira de experiência recebida.');

const familyStart = analyzer.indexOf('function automaticPositionFamilyCompatible');
const familyEnd = analyzer.indexOf('function chooseGameplaySelectedPosition', familyStart);
const familyBlock = analyzer.slice(familyStart, familyEnd);
assert.match(analyzer, /const AUTO_POSITION_FAMILIES = \{/, 'R195: famílias automáticas devem ser cacheadas no escopo do módulo.');
assert.doesNotMatch(familyBlock, /new Set<PositionCode>/, 'R195: hot path não pode voltar a alocar Sets a cada chamada.');

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
const r2004Boundary = fs.existsSync('R200_4_HISTORICAL_REQUIREMENTS_CONVERGENCE.md');
assert.ok(sourceBytes <= (r2004Boundary ? 5_360_000 : r200Boundary ? 5_341_000 : 5_337_000), `R195: redução líquida perdida; src voltou a ${sourceBytes} bytes.`);
assert.equal(
  crypto.createHash('sha256').update(r119).digest('hex'),
  '736e631a4aa930bfadf07c81c3330132459ddbaf613531cd4cfc610eacaa1fb5',
  'R195: R119 não pode mudar durante otimização de controllers/hot path.',
);
const v4080 = String(pkg.scripts?.['test:v4080'] ?? '');
assert.ok(/npm run test:r194 && npm run test:r195(?: && npm run test:r196)?(?: && npm run test:r197)?(?: && npm run test:r198)?(?: && npm run test:r199)?(?: && npm run test:r200)?$/.test(v4080), 'R195: cadeia v40.80 deve preservar R194 -> R195 antes de revisões posteriores.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R195: test:all deve continuar fechando pela bateria v40.80.');

console.log(`R195 aprovada: CardVisionApp=${appLines} linhas/${appBytes} B; analyzer=${analyzerBytes} B; src=${sourceBytes} B; controllers canônicos e hot path preservados.`);
