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
const executiveCss = read('src/app/v33-executive.css');
const studioCss = read('src/app/v34-studio.css');
const cleanResponsiveCss = read('src/app/v34-clean-responsive.css');
const identityCss = read('src/app/v35-identity-themes.css');
const solidCss = read('src/app/v35-solid-premium.css');
const revolutionCss = read('src/app/v36-premium-revolution.css');
const professionalCss = read('src/app/v37-professional-intelligence.css');
const rootPage = read('src/app/page.tsx');
const rootPageTemplate = read('scripts/templates/critical-routes/root-page.tsx.txt');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');
const v3840Runner = read('scripts/run-v3840-tests.mjs');

check(pkg.version === '40.10.0', 'Versão atual configurada', pkg.version);
check(appUpdates.includes("'40.10.0'"), 'Motor de atualização sincronizado');
check(dataSafety.includes("APP_DATA_VERSION = '40.10.0'") && dataSafety.includes('CURRENT_DATA_SCHEMA = 3100'), 'Versão de dados sincronizada e esquema compatível');
check(manifest.name === 'BuildMaster Elite Tático v40.10', 'Manifesto PWA sincronizado');
check(sw.includes('buildmaster-v40-10-progress-1'), 'Cache PWA sincronizado');
for (const file of [
  'public/assets/branding/buildmaster-app-icon.png',
  'public/assets/branding/buildmaster-mark.png',
  'public/assets/branding/buildmaster-splash.webp',
  'resources/branding/buildmaster-app-icon-1024.png',
  'resources/android-branding/res/mipmap-anydpi-v26/ic_launcher.xml',
  'resources/android-branding/res/mipmap-anydpi-v33/ic_launcher.xml',
  'resources/android-branding/res/drawable/buildmaster_native_splash.xml',
  'scripts/install-android-branding.mjs',
  'tests/v38-40-branding-regression.mjs'
]) check(exists(file), `Identidade premium presente: ${file}`);
check(workflowApk.includes('install-android-branding.mjs') && workflowPlay.includes('install-android-branding.mjs'), 'Identidade Android integrada aos dois workflows');
check(String(pkg.scripts?.['test:v3840'] ?? '') === 'node scripts/run-v3840-tests.mjs' && v3840Runner.includes('v38-40-branding-regression.mjs'), 'Regressão da identidade premium integrada à v38.40');
check(exists('src/lib/performanceBuildEngineV3850.ts') && exists('src/components/PowerBuildEngineV3850Panel.tsx') && exists('tests/v38-50-power-build-engine-regression.mjs'), 'Motor funcional v38.50 integrado');
check(String(pkg.scripts?.['test:v3850'] ?? '').includes('v38-50-power-build-engine-regression.mjs') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3850'), 'Regressão v38.50 integrada à bateria geral');
check(rootPage.includes('AppShellSafetyBoundaryV3930') && rootPage.includes('AuthGate') && rootPage.includes('CardVisionApp') && !rootPage.includes('Política de privacidade'), 'Rota inicial abre proteção de runtime, autenticação e aplicativo');
check(!/PrivacyPolicyPage|public-policy-page/.test(rootPage), 'Rota raiz sem conteúdo da política pública');
check(rootPage.trim() === rootPageTemplate.trim(), 'Rota raiz persistida exatamente no template canônico, sem depender do autorreparo do CI');
for (const marker of ['actions/checkout@v5', 'actions/setup-node@v5', 'actions/setup-java@v5']) check(workflowApk.includes(marker), `Workflow APK usa ${marker}`);
for (const marker of ['actions/checkout@v5', 'actions/setup-node@v5', 'actions/setup-java@v5']) check(workflowPlay.includes(marker), `Workflow Play usa ${marker}`);
for (const marker of ['gradle/actions/setup-gradle@v6', 'actions/upload-artifact@v6']) check(workflowApk.includes(marker), `Workflow APK usa ${marker}`);
for (const marker of ['android-actions/setup-android@v4', 'actions/upload-artifact@v6']) check(workflowPlay.includes(marker), `Workflow Play usa ${marker}`);
check(cssFiles.some((file) => path.basename(file) === 'globals.css') && cssFiles.some((file) => path.basename(file) === 'v33-executive.css') && cssFiles.some((file) => path.basename(file) === 'v34-studio.css') && cssFiles.some((file) => path.basename(file) === 'v34-clean-responsive.css') && cssFiles.some((file) => path.basename(file) === 'v35-identity-themes.css') && cssFiles.some((file) => path.basename(file) === 'v35-solid-premium.css') && cssFiles.some((file) => path.basename(file) === 'v36-premium-revolution.css') && cssFiles.some((file) => path.basename(file) === 'v37-professional-intelligence.css'), 'Tema base, camada Executive e identidade presentes', cssFiles.map((file) => path.relative(root, file)).join(', '));
check(!/@import\s+['"]/i.test(globals) && !/@import\s+['"]/i.test(executiveCss) && !/@import\s+['"]/i.test(studioCss) && !/@import\s+['"]/i.test(cleanResponsiveCss) && !/@import\s+['"]/i.test(identityCss) && !/@import\s+['"]/i.test(solidCss) && !/@import\s+['"]/i.test(revolutionCss) && !/@import\s+['"]/i.test(professionalCss), 'CSS sem cadeia antiga de imports');
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
  'src/lib/calibrationV32.ts',
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
  'tests/types-v3172/tsconfig.json',
  'src/app/v35-identity-themes.css',
  'src/components/BuildMasterMark.tsx',
  'src/components/ProfileAvatarEditor.tsx',
  'src/lib/profileAvatar.ts',
  'tests/v34-00-identity-themes-profile-regression.mjs',
  'tests/v35-00-official-additional-skills-meta-regression.ts',
  'HABILIDADES_ADICIONAIS_OFICIAIS_META_V35.00.md',
  'src/app/v35-solid-premium.css',
  'src/components/result/GameplayDnaProfilesCard.tsx',
  'src/lib/gameplayDnaSelection.ts',
  'tests/v35-20-gameplay-dna-solid-theme-regression.ts',
  'PERFIS_GAMEPLAY_TEMA_SOLIDO_V35.20.md',
  'src/app/v36-premium-revolution.css',
  'tests/v36-00-premium-revolution-regression.mjs',
  'PREMIUM_REVOLUTION_V36.00.md',
  'src/app/v37-professional-intelligence.css',
  'src/lib/professionalIntelligenceV37.ts',
  'src/components/result/ProfessionalIntelligenceCenter.tsx',
  'tests/v37-00-professional-intelligence-regression.ts',
  'tests/types-v3700/tsconfig.json',
  'tests/types-v3700-ui/tsconfig.json',
  'CENTRAL_PROFISSIONAL_V37.00.md'
]) check(exists(file), `Arquivo essencial presente: ${file}`);


for (const file of [
  'src/lib/structuralPrecisionV3740.ts',
  'src/components/StructuralPrecisionPanel.tsx',
  'tests/v37-40-structural-precision-regression.ts',
  'tests/types-v3740/tsconfig.json',
  'tests/types-v3740-ui/tsconfig.json',
  'PRECISAO_ESTRUTURAL_V37.40.md'
]) check(exists(file), `Precisão estrutural v37.40 presente: ${file}`);
check(String(pkg.scripts?.['test:v3740'] ?? '').includes('v37-40-structural-precision-regression.ts'), 'Regressão v37.40 configurada');
check(String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3740'), 'Bateria geral inclui v37.40');

check(String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3200') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3300') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3400') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3500') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3510') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3520') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3600') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3700') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run quality:audit') && String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4010'), 'Bateria de testes limpa e atual');
check((workflowApk.includes('npm run test:all') || workflowApk.includes('npm run ci:verify')) && (workflowPlay.includes('npm run test:all') || workflowPlay.includes('npm run ci:verify')), 'Workflows usam a bateria atual diretamente ou pelo diagnóstico consolidado');
check(exists('tests/v30-00-integrated-production-regression.mjs') && exists('tests/v30-00-play-publication-regression.ts') && exists('tests/v30-00-play-workflow-regression.mjs') && exists('tests/v30-10-world-fusion-regression.ts') && exists('tests/v30-20-local-ai-impeto-regression.ts') && exists('tests/v30-30-detailed-print-intelligence-regression.ts') && exists('tests/v30-40-smart-card-crop-regression.ts') && exists('tests/v30-50-ultra-precision-ocr-regression.ts') && exists('tests/v31-10-unified-intelligence-regression.ts') && exists('tests/v31-10-tactical-planning-regression.ts') && exists('tests/v31-30-supreme-gameplay-regression.ts') && exists('tests/v31-40-rigid-adaptive-ocr-regression.ts') && exists('tests/v31-50-forensic-scanner-regression.ts') && exists('tests/v31-60-efhub-profile-regression.ts') && exists('tests/v31-70-match-trainer-regression.ts') && exists('tests/v31-70-native-recorder-installer-regression.mjs') && exists('tests/v31-71-account-recovery-regression.mjs') && exists('tests/v31-72-complementary-skills-regression.ts') && exists('tests/v31-73-account-panel-restoration-regression.mjs') && exists('tests/types-v3173-ui/tsconfig.json') && exists('tests/types-v3173-edge/tsconfig.json') && exists('supabase/migrations/202607280002_restore_account_creation_v3173.sql') && exists('tests/v31-76-recording-export-regression.mjs') && exists('tests/v31-77-video-intelligence-regression.ts') && exists('tests/v31-78-complete-player-skills-regression.ts') && exists('tests/v31-79-canonical-profile-top5-regression.ts') && exists('tests/v31-80-final-scanner-skills-regression.ts') && exists('tests/types-v3180/tsconfig.json') && exists('tests/v31-81-visual-efhub-calibration-regression.ts') && exists('tests/types-v3181/tsconfig.json') && exists('tests/v31-82-crisp-efhub-calibrator-regression.mjs') && exists('tests/v32-00-mega-calibration-regression.ts') && exists('tests/v32-00-v3000-ci-isolation-regression.mjs') && exists('tests/types-v3200/tsconfig.json') && exists('tests/types-v3200-ui/tsconfig.json') && exists('tests/v33-00-executive-redesign-regression.mjs') && exists('src/app/v33-executive.css') && exists('tests/v34-00-studio-clean-regression.mjs') && exists('src/app/v34-studio.css') && exists('tests/v34-00-responsive-clean-regression.mjs') && exists('src/app/v34-clean-responsive.css') && exists('tests/v34-00-identity-themes-profile-regression.mjs') && exists('src/app/v35-identity-themes.css') && exists('tests/v35-00-official-additional-skills-meta-regression.ts') && exists('HABILIDADES_ADICIONAIS_OFICIAIS_META_V35.00.md') && exists('tests/v35-10-max-gameplay-dual-position-regression.ts') && exists('FICHA_MAXIMA_GAMEPLAY_V35.10.md') && exists('tests/v35-20-gameplay-dna-solid-theme-regression.ts') && exists('PERFIS_GAMEPLAY_TEMA_SOLIDO_V35.20.md') && exists('src/app/v35-solid-premium.css') && exists('src/components/result/GameplayDnaProfilesCard.tsx') && exists('src/lib/gameplayDnaSelection.ts') && exists('tests/types-v3520/tsconfig.json') && exists('tests/types-v3520-ui/tsconfig.json') && exists('tests/v36-00-premium-revolution-regression.mjs') && exists('src/app/v36-premium-revolution.css') && exists('PREMIUM_REVOLUTION_V36.00.md') && exists('tests/v37-00-professional-intelligence-regression.ts') && exists('src/app/v37-professional-intelligence.css') && exists('src/lib/professionalIntelligenceV37.ts') && exists('src/components/result/ProfessionalIntelligenceCenter.tsx') && exists('tests/types-v3700/tsconfig.json') && exists('tests/types-v3700-ui/tsconfig.json') && exists('CENTRAL_PROFISSIONAL_V37.00.md'), 'Regressões atuais presentes');
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
const unresolvedImports = new Map();
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
    else if (specifier.startsWith('.') || specifier.startsWith('@/')) {
      const current = unresolvedImports.get(relative) || [];
      current.push(specifier);
      unresolvedImports.set(relative, current);
    }
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
check(entries.length > 0 && reachable.size >= entries.length, 'Grafo de módulos ativos construído');
const orphans = [...sourceMap.keys()].filter((file) => !reachable.has(file));
if (orphans.length) warnings.push(`${orphans.length} módulo(s) não alcançável(is) foram ignorados pela auditoria ativa: ${orphans.slice(0, 8).join(', ')}${orphans.length > 8 ? ', ...' : ''}`);
for (const [relative, specifiers] of unresolvedImports) {
  if (reachable.has(relative)) {
    for (const specifier of specifiers) failures.push(`Import interno ativo não resolvido: ${relative} -> ${specifier}`);
  } else {
    warnings.push(`Import não resolvido em módulo inativo ignorado: ${relative} -> ${specifiers.join(', ')}`);
  }
}
const reachableTypedSourceFiles = [...reachable]
  .map((file) => sourceMap.get(file))
  .filter(Boolean);

const forbiddenExtensions = new Set(['.apk', '.aab', '.jks', '.keystore', '.p12', '.pfx']);
const projectFiles = [...walk('src'), ...walk('scripts'), ...walk('public'), ...walk('supabase'), ...walk('.github')];
const forbiddenFiles = projectFiles.filter((file) => forbiddenExtensions.has(path.extname(file).toLowerCase()));
check(forbiddenFiles.length === 0, 'Nenhum APK, AAB ou chave privada incluído', forbiddenFiles.map((file) => path.relative(root, file)).join(', '));

const textFiles = projectFiles.filter((file) => /\.(?:ts|tsx|js|mjs|cjs|json|yml|yaml|css|md|txt)$/i.test(file));
const privateKeyHits = textFiles.filter((file) => /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(fs.readFileSync(file, 'utf8')));
check(privateKeyHits.length === 0, 'Nenhuma chave privada textual incluída', privateKeyHits.map((file) => path.relative(root, file)).join(', '));

const directStorage = reachableTypedSourceFiles.flatMap((file) => fs.readFileSync(file, 'utf8').split('\n').map((line, index) => ({ file, line, index: index + 1 })))
  .filter((item) => item.line.includes('localStorage.') && !item.file.endsWith('safeLocalStorage.ts'));
check(directStorage.length === 0, 'Acesso direto ao localStorage centralizado nos módulos ativos', directStorage.slice(0, 8).map((item) => `${path.relative(root, item.file)}:${item.index}`).join(', '));

const rawFetchAllowed = new Set(['src/lib/accountAuth.ts', 'src/lib/fetchWithTimeout.ts']);
const rawFetchHits = reachableTypedSourceFiles.flatMap((file) => fs.readFileSync(file, 'utf8').split('\n').map((line, index) => ({ file, line, index: index + 1 })))
  .filter((item) => /\bfetch\s*\(/.test(item.line) && !rawFetchAllowed.has(path.relative(root, item.file).replaceAll(path.sep, '/')));
check(rawFetchHits.length === 0, 'Chamadas fetch ativas possuem prazo explícito', rawFetchHits.slice(0, 8).map((item) => `${path.relative(root, item.file)}:${item.index}`).join(', '));
const accountAuthSource = read('src/lib/accountAuth.ts');
check(accountAuthSource.includes('AbortController') && accountAuthSource.includes('performWebFetch') && accountAuthSource.includes('30_000'), 'Fetch de autenticação mantém AbortController e timeout próprio');

const explicitAnyHits = reachableTypedSourceFiles.flatMap((file) => fs.readFileSync(file, 'utf8').split('\n').map((line, index) => ({ file, line, index: index + 1 })))
  .filter((item) => /(?:\bas any\b|:\s*any\b|<any>)/.test(item.line));
check(explicitAnyHits.length === 0, 'Tipos explícitos any removidos dos módulos ativos', explicitAnyHits.slice(0, 8).map((item) => `${path.relative(root, item.file)}:${item.index}`).join(', '));

for (const file of typedSourceFiles) {
  const lines = fs.readFileSync(file, 'utf8').split('\n').length;
  if (lines > 3000) warnings.push(`${path.relative(root, file)} possui ${lines} linhas e merece divisão futura.`);
}

console.log(`\nAUDITORIA DO PROJETO LIMPO v${pkg.version}`);
console.log(`✓ ${passes.length} verificações aprovadas`);
for (const warning of warnings) console.warn(`⚠ ${warning}`);
if (failures.length) {
  console.error(`\n✗ ${failures.length} falha(s)`);
  for (const failure of failures) {
    console.error(`  ✗ ${failure}`);
    if (process.env.GITHUB_ACTIONS === 'true') console.error(`::error title=Auditoria estrutural::${failure.replaceAll('\n', ' ')}`);
  }
  process.exit(1);
}
console.log('Auditoria do projeto limpo aprovada.');
