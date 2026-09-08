import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const workspacePath = 'src/components/result/ResultWorkspace.tsx';
const advancedPath = 'src/components/result/ResultAdvancedWorkspaceR192.tsx';
const workspace = read(workspacePath);
const advanced = read(advancedPath);
const pkg = JSON.parse(read('package.json'));
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');

const workspaceLines = workspace.split(/\r?\n/).length;
const workspaceBytes = fs.statSync(workspacePath).size;
const advancedBytes = fs.statSync(advancedPath).size;
assert.ok(workspaceLines <= 1450, `R192: ResultWorkspace voltou a ${workspaceLines} linhas.`);
assert.ok(workspaceBytes <= 101_000, `R192: ResultWorkspace voltou a ${workspaceBytes} bytes.`);
assert.ok(advancedBytes <= 26_000, `R192: fronteira avançada cresceu para ${advancedBytes} bytes.`);

assert.match(workspace, /const ResultAdvancedWorkspaceR192 = dynamic\(/, 'R192: workspace principal deve adquirir a superfície avançada via dynamic.');
assert.match(workspace, /import\('@\/components\/result\/ResultAdvancedWorkspaceR192'\)/, 'R192: fronteira avançada precisa permanecer em import dinâmico.');
assert.match(workspace, /advancedSurfaceActiveR192 && <ResultAdvancedWorkspaceR192/, 'R192: chunk avançado só deve montar quando uma aba técnica estiver ativa.');

for (const moved of [
  'buildReliabilityCenter',
  'compareBuildVariants',
  'detectInconsistencies',
  'getMergedCorrectionsForResult',
  '<ContinuousUpdateV3770Panel',
  '<VerifiedCardRegistryPanel',
  '<MatchValidationCenter',
  '<GlobalProLabV3900Panel',
  '<CreatorBuildResearchPanel',
]) {
  assert.ok(!workspace.includes(moved), `R192: lógica avançada voltou ao ResultWorkspace: ${moved}`);
  assert.ok(advanced.includes(moved), `R192: fronteira avançada perdeu ${moved}`);
}

for (const requiredTab of ['leitura', 'confianca', 'comparar', 'partidas', 'motor', 'comunidade', 'proglobal', 'fontes', 'calibracao', 'treino', 'correcao', 'regras', 'validacao', 'posicoes', 'dados']) {
  assert.ok(advanced.includes(`tab === '${requiredTab}'`), `R192: aba avançada ausente: ${requiredTab}`);
}

for (const forbidden of ['createProductionAnalysisR138', 'runCanonicalVaultMutationR153', 'commitVaultHistoryR140', 'localStorage.setItem', 'indexedDB.open']) {
  assert.ok(!advanced.includes(forbidden), `R192: fronteira visual adquiriu autoridade proibida: ${forbidden}`);
}

assert.equal(
  crypto.createHash('sha256').update(r119).digest('hex'),
  '736e631a4aa930bfadf07c81c3330132459ddbaf613531cd4cfc610eacaa1fb5',
  'R192: R119 não pode mudar durante modularização do Resultado.',
);
assert.match(String(pkg.scripts?.['test:v4080'] ?? ''), /npm run test:r192(?: && npm run test:r193)?(?: && npm run test:r194)?(?: && npm run test:r195)?(?: && npm run test:r196)?(?: && npm run test:r197)?(?: && npm run test:r198)?(?: && npm run test:r199)?(?: && npm run test:r200)?$/, 'R192: cadeia v40.80 deve preservar R192 antes do gate seguinte.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R192: test:all deve continuar fechando pela bateria v40.80.');

console.log(`R192 aprovada: ResultWorkspace=${workspaceLines} linhas/${workspaceBytes} B; avançado=${advancedBytes} B lazy e R119 intacto.`);
