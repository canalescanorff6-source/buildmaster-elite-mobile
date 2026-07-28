import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const pkg = JSON.parse(read('package.json'));
const failures = [];
const warnings = [];
const passes = [];
const check = (condition, label, detail = '') => condition ? passes.push(label) : failures.push(detail ? `${label}: ${detail}` : label);

function walk(directory) {
  const base = path.join(root, directory);
  if (!fs.existsSync(base)) return [];
  const result = [];
  const stack = [base];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (['node_modules', '.next', 'out', 'android', '.git'].includes(entry.name)) continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else result.push(target);
    }
  }
  return result;
}

const sourceFiles = walk('src');
const typedSourceFiles = sourceFiles.filter((file) => /\.(?:ts|tsx)$/.test(file));
const cssFiles = sourceFiles.filter((file) => file.endsWith('.css'));
const workflowApk = read('.github/workflows/build-apk.yml');
const workflowPlay = read('.github/workflows/build-play-store.yml');
const appUpdates = read('src/lib/appUpdates.ts');
const dataSafety = read('src/lib/dataSafety.ts');
const globals = read('src/app/globals.css');
const rootPage = read('src/app/page.tsx');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');

check(pkg.version === '31.75.0', 'Versão atual configurada', pkg.version);
check(appUpdates.includes("'31.75.0'"), 'Motor de atualização sincronizado');
check(dataSafety.includes("APP_DATA_VERSION = '31.75.0'") && dataSafety.includes('CURRENT_DATA_SCHEMA = 3000'), 'Esquema de dados sincronizado');
check(manifest.name === 'BuildMaster Elite Tático v31.75', 'Manifesto PWA sincronizado');
check(sw.includes('buildmaster-v31-75'), 'Cache PWA sincronizado');
check(rootPage.includes('AuthGate') && rootPage.includes('CardVisionApp') && !rootPage.includes('Política de privacidade'), 'Rota inicial abre autenticação e aplicativo');
check(!/PrivacyPolicyPage|public-policy-page/.test(rootPage), 'Rota raiz sem conteúdo da política pública');
for (const marker of ['actions/checkout@v5', 'actions/setup-node@v5', 'actions/setup-java@v5']) check(workflowApk.includes(marker), `Workflow APK usa ${marker}`);
for (const marker of ['actions/checkout@v5', 'actions/setup-node@v5', 'actions/setup-java@v5']) check(workflowPlay.includes(marker), `Workflow Play usa ${marker}`);
for (const marker of ['gradle/actions/setup-gradle@v6', 'actions/upload-artifact@v6']) check(workflowApk.includes(marker), `Workflow APK usa ${marker}`);
for (const marker of ['android-actions/setup-android@v4', 'actions/upload-artifact@v6']) check(workflowPlay.includes(marker), `Workflow Play usa ${marker}`);
check(cssFiles.length === 1 && path.basename(cssFiles[0]) === 'globals.css', 'Tema consolidado em um único CSS', cssFiles.map((file) => path.relative(root, file)).join(', '));
check(!/@import\s+['"]/i.test(globals), 'CSS sem cadeia antiga de imports');
for (const marker of ['.bm-v3000-play-publication', 'prefers-reduced-motion: reduce', ':focus-visible', '@media (max-width: 640px)']) {
  check(globals.includes(marker), `Tema contém ${marker}`);
}

for (const file of [
  'src/components/CardVisionApp.tsx',
  'src/components/AuthGate.tsx',
  'src/components/PrecisionBuildPanel.tsx',
  'src/modules/builds/advancedBuildIntelligence.ts',
  'src/modules/card-reader/ocrVisionEngine.ts',
  'src/modules/card-reader/forensicConsensus.ts',
  'src/modules/card-reader/templateCalibration.ts',
  'src/modules/administration/AdministrationSecurityCenter.tsx',
  'src/modules/backup/CloudSyncCenter.tsx',
  'src/modules/publication/PlayStorePublicationCenter.tsx',
  'src/modules/performance/AntiDelayCenter.tsx',
  'src/modules/training/TrainingEvolutionCenter.tsx',
  'supabase/functions/account-deletion-request/index.ts',
  'supabase/functions/play-integrity-verify/index.ts',
  'supabase/functions/pro-build-search/index.ts',
  'supabase/migrations/202607260001_v3010_world_pro_registry.sql',
  'src/lib/worldProRegistry.ts',
  'src/lib/competitiveBuildFusion.ts',
  'src/lib/localAiEngine.ts',
  'src/modules/card-reader/cardArtCrop.ts',
  'src/modules/card-reader/highPrecisionOcr.ts',
  'src/modules/card-reader/imageProcessing.ts',
  'src/lib/skillIntelligenceV31.ts',
  'src/lib/unifiedCardIntelligence.ts',
  'src/components/result/UnifiedIntelligenceCard.tsx',
  'tests/types-v3100/tsconfig.json',
  'tests/types-v3110/tsconfig.json',
  'tests/types-v3110-ui/tsconfig.json',
  'src/lib/tacticalPlanningEngine.ts',
  'src/lib/supremeGameplayEngine.ts',
  'src/components/result/SupremeGameplayCard.tsx',
  'tests/types-v3130/tsconfig.json',
  'tests/types-v3130-ui/tsconfig.json',
  'src/modules/card-reader/adaptiveZoneSearch.ts',
  'src/modules/card-reader/learnedOcrLexicon.ts',
  'tests/types-v3140/tsconfig.json',
  'tests/types-v3140-ui/tsconfig.json',
  'tests/types-v3150/tsconfig.json',
  'tests/types-v3150-ui/tsconfig.json',
  'src/lib/officialSkillIdentity.ts',
  'src/lib/skillIntegrity.ts',
  'tests/v31-72-complementary-skills-regression.ts',
  'tests/types-v3172/tsconfig.json'
]) check(exists(file), `Arquivo essencial presente: ${file}`);

check(pkg.scripts?.['test:all'] === 'npm run test:v3000 && npm run test:v3010 && npm run test:v3020 && npm run test:v3030 && npm run test:v3040 && npm run test:v3050 && npm run test:v3100 && npm run test:v3110 && npm run test:v3120 && npm run test:v3130 && npm run test:v3140 && npm run test:v3150 && npm run test:v3160 && npm run test:v3170 && npm run test:v3171 && npm run test:v3172 && npm run test:v3173 && npm run test:v3174 && npm run test:v3175 && npm run quality:audit', 'Bateria de testes limpa e atual');
check((workflowApk.includes('npm run test:all') || workflowApk.includes('npm run ci:verify')) && (workflowPlay.includes('npm run test:all') || workflowPlay.includes('npm run ci:verify')), 'Workflows usam a bateria atual diretamente ou pelo diagnóstico consolidado');
check(exists('tests/v30-00-integrated-production-regression.mjs') && exists('tests/v30-00-play-publication-regression.ts') && exists('tests/v30-00-play-workflow-regression.mjs') && exists('tests/v30-10-world-fusion-regression.ts') && exists('tests/v30-20-local-ai-impeto-regression.ts') && exists('tests/v30-30-detailed-print-intelligence-regression.ts') && exists('tests/v30-40-smart-card-crop-regression.ts') && exists('tests/v30-50-ultra-precision-ocr-regression.ts') && exists('tests/v31-10-unified-intelligence-regression.ts') && exists('tests/v31-10-tactical-planning-regression.ts') && exists('tests/v31-30-supreme-gameplay-regression.ts') && exists('tests/v31-40-rigid-adaptive-ocr-regression.ts') && exists('tests/v31-50-forensic-scanner-regression.ts') && exists('tests/v31-60-efhub-profile-regression.ts') && exists('tests/v31-70-match-trainer-regression.ts') && exists('tests/v31-70-native-recorder-installer-regression.mjs') && exists('tests/v31-71-account-recovery-regression.mjs') && exists('tests/v31-72-complementary-skills-regression.ts') && exists('tests/v31-73-account-panel-restoration-regression.mjs') && exists('tests/types-v3173-ui/tsconfig.json') && exists('tests/types-v3173-edge/tsconfig.json') && exists('supabase/migrations/202607280002_restore_account_creation_v3173.sql'), 'Regressões atuais presentes');
const skillIdentitySource = read('src/lib/officialSkillIdentity.ts');
const skillIntegritySource = read('src/lib/skillIntegrity.ts');
const pipelineSource = read('src/lib/cardIntelligencePipeline.ts');
check(skillIdentitySource.includes('filterComplementaryAdditionalSkills') && skillIdentitySource.includes('canonicalSkillName'), 'Filtro canônico de habilidades presente');
check(skillIntegritySource.includes('enforceComplementarySkillIntegrity') && pipelineSource.includes('enforceComplementarySkillIntegrity(supreme)'), 'Integridade antirrepetição aplicada ao resultado final');
check(String(pkg.scripts?.['test:v3172'] ?? '').includes('typecheck:v3172'), 'Teste e typecheck v31.72 configurados');
check(exists('scripts/repair-critical-routes.mjs') && exists('scripts/templates/critical-routes/root-page.tsx.txt') && exists('tests/v31-72-critical-route-self-healing-regression.mjs'), 'Autorreparo permanente da rota inicial presente');
check(String(pkg.scripts?.['quality:routes'] ?? '').includes('routes:repair') && String(pkg.scripts?.['test:v3172'] ?? '').includes('critical-route-self-healing'), 'Autorreparo de rotas integrado ao CI e à regressão v31.72');
check(!exists('MANIFESTO_ARQUIVOS_V29.10.sha256') && !exists('MANIFESTO_PRODUCAO_V29.20.sha256') && !exists('MANIFESTO_PRODUCAO_V29.30.sha256'), 'Manifestos antigos removidos');

// Confere imports internos e alcançabilidade do código da aplicação.
const sourceMap = new Map(typedSourceFiles.map((file) => [path.relative(root, file).replaceAll(path.sep, '/'), file]));
const importPattern = /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
const graph = new Map([...sourceMap.keys()].map((file) => [file, new Set()]));
function resolveImport(fromFile, specifier) {
  let base;
  if (specifier.startsWith('@/')) base = path.join(root, 'src', specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(path.join(root, fromFile)), specifier);
  else return null;
  const candidates = path.extname(base) ? [base] : ['.ts', '.tsx', '.js', '.jsx'].map((ext) => `${base}${ext}`).concat([path.join(base, 'index.ts'), path.join(base, 'index.tsx')]);
  const found = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  return found ? path.relative(root, found).replaceAll(path.sep, '/') : null;
}
for (const [relative, absolute] of sourceMap) {
  const text = fs.readFileSync(absolute, 'utf8');
  for (const match of text.matchAll(importPattern)) {
    const specifier = match[1] || match[2];
    const resolved = resolveImport(relative, specifier);
    if (resolved) graph.get(relative).add(resolved);
    else if (specifier.startsWith('.') || specifier.startsWith('@/')) failures.push(`Import interno não resolvido: ${relative} -> ${specifier}`);
  }
}
const entries = [...sourceMap.keys()].filter((file) => file.startsWith('src/app/') && ['page.tsx','layout.tsx','error.tsx','global-error.tsx','loading.tsx','not-found.tsx'].includes(path.basename(file)));
if (sourceMap.has('middleware.ts')) entries.push('middleware.ts');
const reachable = new Set();
const stack = [...entries];
while (stack.length) {
  const current = stack.pop();
  if (reachable.has(current)) continue;
  reachable.add(current);
  for (const dependency of graph.get(current) || []) stack.push(dependency);
}
const orphans = [...sourceMap.keys()].filter((file) => !reachable.has(file));
check(orphans.length === 0, 'Nenhum módulo TypeScript órfão', orphans.join(', '));

const forbiddenExtensions = new Set(['.apk', '.aab', '.jks', '.keystore', '.p12', '.pfx']);
const projectFiles = [...walk('src'), ...walk('scripts'), ...walk('public'), ...walk('supabase'), ...walk('.github')];
const forbiddenFiles = projectFiles.filter((file) => forbiddenExtensions.has(path.extname(file).toLowerCase()));
check(forbiddenFiles.length === 0, 'Nenhum APK, AAB ou chave privada incluído', forbiddenFiles.map((file) => path.relative(root, file)).join(', '));

const textFiles = projectFiles.filter((file) => /\.(?:ts|tsx|js|mjs|cjs|json|yml|yaml|css|md|txt)$/i.test(file));
const privateKeyHits = textFiles.filter((file) => /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(fs.readFileSync(file, 'utf8')));
check(privateKeyHits.length === 0, 'Nenhuma chave privada textual incluída', privateKeyHits.map((file) => path.relative(root, file)).join(', '));

const directStorage = typedSourceFiles.flatMap((file) => fs.readFileSync(file, 'utf8').split('\n').map((line, index) => ({ file, line, index: index + 1 })))
  .filter((item) => item.line.includes('localStorage.') && !item.file.endsWith('safeLocalStorage.ts'));
check(directStorage.length === 0, 'Acesso direto ao localStorage centralizado', directStorage.slice(0, 8).map((item) => `${path.relative(root, item.file)}:${item.index}`).join(', '));

const explicitAnyHits = typedSourceFiles.flatMap((file) => fs.readFileSync(file, 'utf8').split('\n').map((line, index) => ({ file, line, index: index + 1 })))
  .filter((item) => /(?:\bas any\b|:\s*any\b|<any>)/.test(item.line));
check(explicitAnyHits.length === 0, 'Tipos explícitos any removidos', explicitAnyHits.slice(0, 8).map((item) => `${path.relative(root, item.file)}:${item.index}`).join(', '));

for (const file of typedSourceFiles) {
  const lines = fs.readFileSync(file, 'utf8').split('\n').length;
  if (lines > 3000) warnings.push(`${path.relative(root, file)} possui ${lines} linhas e merece divisão futura.`);
}

console.log(`\nAUDITORIA DO PROJETO LIMPO v${pkg.version}`);
console.log(`✓ ${passes.length} verificações aprovadas`);
for (const warning of warnings) console.warn(`⚠ ${warning}`);
if (failures.length) {
  console.error(`\n✗ ${failures.length} falha(s)`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log('Auditoria do projeto limpo aprovada.');
