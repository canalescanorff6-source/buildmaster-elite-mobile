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

check(pkg.version === '30.40.0', 'Versão atual configurada', pkg.version);
check(appUpdates.includes("'30.40.0'"), 'Motor de atualização sincronizado');
check(dataSafety.includes("APP_DATA_VERSION = '30.40.0'") && dataSafety.includes('CURRENT_DATA_SCHEMA = 3000'), 'Esquema de dados sincronizado');
check(manifest.name === 'BuildMaster Elite Tático v30.40', 'Manifesto PWA sincronizado');
check(sw.includes('buildmaster-v30-40'), 'Cache PWA sincronizado');
check(rootPage.includes('AuthGate') && rootPage.includes('CardVisionApp') && !rootPage.includes('Política de privacidade'), 'Rota inicial abre autenticação e aplicativo');
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
  'src/modules/card-reader/cardArtCrop.ts'
]) check(exists(file), `Arquivo essencial presente: ${file}`);

check(pkg.scripts?.['test:all'] === 'npm run test:v3000 && npm run test:v3010 && npm run test:v3020 && npm run test:v3030 && npm run test:v3040 && npm run quality:audit', 'Bateria de testes limpa e atual');
check(workflowApk.includes('npm run test:all') && workflowPlay.includes('npm run test:all'), 'Workflows usam a bateria atual');
check(exists('tests/v30-00-integrated-production-regression.mjs') && exists('tests/v30-00-play-publication-regression.ts') && exists('tests/v30-00-play-workflow-regression.mjs') && exists('tests/v30-10-world-fusion-regression.ts') && exists('tests/v30-20-local-ai-impeto-regression.ts') && exists('tests/v30-30-detailed-print-intelligence-regression.ts') && exists('tests/v30-40-smart-card-crop-regression.ts'), 'Regressões atuais presentes');
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
