import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');
const analyzerPath = 'src/lib/analyzer.ts';
const catalogPath = 'src/modules/analysis/analyzerCatalog.ts';
const positionCorePath = 'src/modules/analysis/analyzerPositionCoreR142.ts';
const analyzer = read(analyzerPath);
const catalog = read(catalogPath);
const positionCore = read(positionCorePath);
const pkg = JSON.parse(read('package.json'));
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');

const analyzerBytes = fs.statSync(analyzerPath).size;
const analyzerLines = analyzer.split(/\r?\n/).length;
assert.ok(analyzerBytes <= 110_000, `R193: analyzer.ts voltou a ${analyzerBytes} bytes.`);
assert.ok(analyzerLines <= 1_250, `R193: analyzer.ts voltou a ${analyzerLines} linhas.`);

assert.match(analyzer, /SPECIAL_SKILL_ANALYSIS_META/, 'R193: analyzer deve consumir a fonte única de metadados especiais.');
assert.doesNotMatch(analyzer, /const DNA_SPECIAL_SKILL_RULES/, 'R193: regras DNA especiais não podem voltar a duplicar o catálogo.');
assert.doesNotMatch(analyzer, /const special: Record<string, Partial<Record<TrainingKey, number>>>/, 'R193: pesos especiais não podem voltar a uma segunda tabela paralela.');
assert.doesNotMatch(analyzer, /function emptyTrainingWeights\(/, 'R193: plano zero duplicado deve continuar removido.');
assert.doesNotMatch(analyzer, /function nextTrainingPointCost\(/, 'R193: custo do próximo nível deve usar trainingLevelCost canônico.');
assert.doesNotMatch(analyzer, /function clampDecimal\(/, 'R193: clampDecimal local duplicado não pode voltar ao analyzer.');
assert.doesNotMatch(analyzer, /function avg\(/, 'R193: média local duplicada não pode voltar ao analyzer.');
assert.match(analyzer, /TRAINING_KEYS/, 'R193: chaves de treino devem vir do contrato canônico.');
assert.match(analyzer, /trainingLevelCost\(level\+1\)/, 'R193: retorno marginal deve reutilizar o custo canônico.');
assert.match(analyzer, /genericPositionTemplateCard/, 'R193: template genérico anticlone precisa permanecer deduplicado.');

assert.match(catalog, /export const SPECIAL_SKILL_ANALYSIS_META/, 'R193: catálogo perdeu a fonte única de metadados especiais.');
assert.match(catalog, /SPECIAL_SKILL_ANALYSIS_ROWS/, 'R193: catálogo precisa manter os metadados especiais declarativos.');
for (const helper of ['export function clamp(', 'export function clampDecimal(', 'export function avg(']) {
  assert.ok(positionCore.includes(helper), `R193: núcleo posicional não expõe ${helper}.`);
}

const walk = (root) => {
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
};
const sourceBytes = walk('src').reduce((sum, file) => sum + fs.statSync(file).size, 0);
assert.ok(sourceBytes <= 5_344_000, `R193: redução líquida foi perdida; src TS/TSX voltou a ${sourceBytes} bytes.`);

assert.equal(
  crypto.createHash('sha256').update(r119).digest('hex'),
  '765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96',
  'R193: R119 não pode mudar durante deduplicação do analyzer.',
);
assert.ok(/npm run test:r193(?: && npm run test:r194)?(?: && npm run test:r195)?(?: && npm run test:r196)?(?: && npm run test:r197)?(?: && npm run test:r198)?(?: && npm run test:r199)?(?: && npm run test:r200)?$/.test(String(pkg.scripts?.['test:v4080'] ?? '')), 'R193: cadeia v40.80 deve manter R193 antes do gate seguinte.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R193: test:all deve continuar fechando pela bateria v40.80.');

console.log(`R193 estrutural aprovada: analyzer=${analyzerLines} linhas/${analyzerBytes} B; src=${sourceBytes} B; metadados especiais unificados e R119 intacto.`);
