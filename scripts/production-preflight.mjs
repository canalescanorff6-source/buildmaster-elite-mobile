import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const failures = [];
const warnings = [];
const passes = [];
const check = (condition, label, detail = '') => condition ? passes.push(label) : failures.push(detail ? `${label}: ${detail}` : label);

function walk(directory) {
  if (!exists(directory)) return [];
  const result = [];
  const stack = [directory];
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

const version = pkg.version;
const appUpdates = read('src/lib/appUpdates.ts');
const dataSafety = read('src/lib/dataSafety.ts');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');
const css = read('src/app/globals.css');
const layout = read('src/app/layout.tsx');
const rootPage = read('src/app/page.tsx');
const privacyPage = read('src/app/privacidade/page.tsx');
const deletionPage = read('src/app/excluir-conta/page.tsx');
const workflow = read('.github/workflows/build-apk.yml');
const playWorkflow = read('.github/workflows/build-play-store.yml');
const capacitor = read('capacitor.config.ts');
const tsconfig = JSON.parse(read('tsconfig.json'));
const appTsconfig = JSON.parse(read('tsconfig.app.json'));
const cardVisionSource = read('src/components/CardVisionApp.tsx');
const cropCalibrationSource = read('src/modules/card-reader/templateCalibration.ts');

check(version === '31.76.0', 'Versão v31.76 configurada', version);
check(lock.version === version && lock.packages?.['']?.version === version, 'package-lock sincronizado');
check(appUpdates.includes(`'${version}'`), 'Motor de atualização sincronizado');
check(dataSafety.includes(`APP_DATA_VERSION = '${version}'`) && dataSafety.includes('CURRENT_DATA_SCHEMA = 3000'), 'Esquema de dados sincronizado');
check(manifest.name === 'BuildMaster Elite Tático v31.76' && manifest.short_name === 'BuildMaster v31.76', 'Manifesto PWA sincronizado');
check(sw.includes('buildmaster-v31-76'), 'Cache PWA renovado');
check(!/@import\s+['"]/i.test(css) && css.includes('.bm-v3000-play-publication'), 'Tema de produção consolidado');
check(layout.includes('bm-v3000-play-publication'), 'Escopo visual v30 ativo');
check(rootPage.includes("@/components/AuthGate") && rootPage.includes("@/components/CardVisionApp") && rootPage.includes('<AuthGate>') && rootPage.includes('<CardVisionApp') && !/PrivacyPolicyPage|Política de privacidade|public-policy-page/.test(rootPage), 'Rota inicial correta', 'src/app/page.tsx deve abrir AuthGate + CardVisionApp e não pode conter a política de privacidade');
check(/PrivacyPolicyPage|Política de privacidade/.test(privacyPage), 'Rota de privacidade separada');
check(/AccountDeletionPage|Solicitar exclusão da conta/.test(deletionPage), 'Rota de exclusão separada');
check(capacitor.includes("appId: 'com.buildmaster.elitetatico'") && capacitor.includes("webDir: 'out'") && capacitor.includes('webContentsDebuggingEnabled: false'), 'Capacitor configurado para produção');
const apkUsesConsolidatedDoctor = workflow.includes('npm run ci:verify');
for (const command of ['npm run release:preflight', 'npm run quality:routes', 'npm run quality:syntax', 'npm run quality:interactive', 'npm run typecheck', 'npm run test:all']) check(apkUsesConsolidatedDoctor || workflow.includes(command), `Workflow APK executa ${command} diretamente ou pelo diagnóstico consolidado`);
for (const marker of ['assembleRelease', 'ANDROID_SIGNING_BUNDLE', 'SHA-256', 'Validar release imutável publicamente', 'BuildMaster-Elite-Tatico-latest.apk']) check(workflow.includes(marker), `Workflow APK contém ${marker}`);
for (const marker of ['bundleRelease', 'targetSdkVersion = 36', 'GOOGLE_PLAY_UPLOAD_KEY_BUNDLE', 'bundletool.jar validate']) check(playWorkflow.includes(marker), `Workflow Play contém ${marker}`);
check(pkg.scripts?.['test:all'] === 'npm run test:v3000 && npm run test:v3010 && npm run test:v3020 && npm run test:v3030 && npm run test:v3040 && npm run test:v3050 && npm run test:v3100 && npm run test:v3110 && npm run test:v3120 && npm run test:v3130 && npm run test:v3140 && npm run test:v3150 && npm run test:v3160 && npm run test:v3170 && npm run test:v3171 && npm run test:v3172 && npm run test:v3173 && npm run test:v3174 && npm run test:v3175 && npm run test:v3176 && npm run quality:audit', 'Bateria atual configurada');
check(new Set(tsconfig.exclude ?? []).has('tests') && new Set(appTsconfig.exclude ?? []).has('tests'), 'Fixtures isoladas fora do typecheck principal');
check(String(pkg.scripts?.typecheck ?? '').includes('-p tsconfig.app.json') && !(appTsconfig.include ?? []).some((item) => item.includes('tests') || item === '**/*.ts' || item === '**/*.tsx'), 'Typecheck principal restrito ao aplicativo');
check(exists('scripts/check-typecheck-isolation.mjs') && exists('tests/v31-70-typecheck-isolation-regression.mjs'), 'Portão permanente de isolamento TypeScript presente');
check(exists('scripts/check-card-crop-type-safety.mjs') && String(pkg.scripts?.['quality:card-crop-types'] ?? '').includes('check-card-crop-type-safety.mjs'), 'Portão de segurança do recorte presente');
check(exists('scripts/check-generated-native-java.mjs') && String(pkg.scripts?.['quality:native-java'] ?? '').includes('check-generated-native-java.mjs') && String(pkg.scripts?.['test:v3170'] ?? '').includes('quality:native-java'), 'Portão de Java nativo gerado presente');
check(!/OFFICIAL_ADDITIONAL_SKILL_NAMES[\s\S]*?from ['"]@\/modules\/analysis['"]/.test(cardVisionSource), 'CardVisionApp sem importação ociosa de habilidades');
check(/applyRememberedCardBox<T extends CardCropBox>\(cardBox: T, calibration: OcrTemplateCalibration \| null\): T/.test(cropCalibrationSource) && /return\s*\{\s*\.\.\.cardBox,/.test(cropCalibrationSource), 'Calibração do recorte preserva OcrZone completo');
const skillIdentitySource = read('src/lib/officialSkillIdentity.ts');
const skillIntegritySource = read('src/lib/skillIntegrity.ts');
const pipelineSource = read('src/lib/cardIntelligencePipeline.ts');
const resultWorkspaceSource = read('src/components/result/ResultWorkspace.tsx');
check(skillIdentitySource.includes('filterComplementaryAdditionalSkills') && skillIdentitySource.includes('buildOwnedSkillKeys'), 'Identidade canônica de habilidades presente');
check(skillIntegritySource.includes('enforceComplementarySkillIntegrity') && skillIntegritySource.includes('Habilidades adicionais e Ímpetos foram avaliados em trilhas separadas.'), 'Auditoria final antirrepetição presente');
check(pipelineSource.includes('enforceComplementarySkillIntegrity(supreme)'), 'Filtro antirrepetição executado depois de todos os motores');
check(resultWorkspaceSource.includes('Filtro antirrepetição v31.72'), 'Auditoria de habilidades visível no resultado');
check(String(pkg.scripts?.['test:v3172'] ?? '').includes('v31-72-complementary-skills-regression.ts'), 'Regressão v31.72 integrada à bateria');
check(exists('scripts/repair-critical-routes.mjs') && exists('scripts/templates/critical-routes/root-page.tsx.txt') && exists('tests/v31-72-critical-route-self-healing-regression.mjs'), 'Autorreparo permanente da rota inicial presente');
check(String(pkg.scripts?.['quality:routes'] ?? '').includes('routes:repair') && String(pkg.scripts?.['test:v3172'] ?? '').includes('critical-route-self-healing'), 'Autorreparo de rotas integrado ao CI e à regressão v31.72');
check(exists('scripts/check-app-routes.mjs') && exists('tests/v31-70-root-route-regression.mjs') && exists('tests/v30-00-integrated-production-regression.mjs') && exists('tests/v30-00-play-publication-regression.ts') && exists('tests/v30-00-play-workflow-regression.mjs') && exists('tests/v30-10-world-fusion-regression.ts') && exists('tests/v30-20-local-ai-impeto-regression.ts') && exists('tests/v30-30-detailed-print-intelligence-regression.ts') && exists('tests/v30-40-smart-card-crop-regression.ts') && exists('tests/v30-50-ultra-precision-ocr-regression.ts') && exists('tests/v31-10-unified-intelligence-regression.ts') && exists('tests/v31-10-tactical-planning-regression.ts') && exists('tests/v31-20-premium-interface-regression.mjs') && exists('tests/v31-30-supreme-gameplay-regression.ts') && exists('tests/v31-40-rigid-adaptive-ocr-regression.ts') && exists('tests/v31-50-forensic-scanner-regression.ts') && exists('tests/v31-60-efhub-profile-regression.ts') && exists('tests/v31-70-match-trainer-regression.ts') && exists('tests/v31-70-native-recorder-installer-regression.mjs') && exists('tests/v31-70-typecheck-isolation-regression.mjs') && exists('tests/v31-71-account-recovery-regression.mjs') && exists('tests/v31-72-complementary-skills-regression.ts') && exists('tests/types-v3172/tsconfig.json') && exists('tests/v31-73-account-panel-restoration-regression.mjs') && exists('tests/types-v3173-ui/tsconfig.json') && exists('tests/types-v3173-edge/tsconfig.json') && exists('tests/v31-74-account-create-regression.mjs') && exists('tests/v31-75-dynamic-efhub-layout-regression.ts') && exists('tests/v31-76-recording-export-regression.mjs'), 'Regressões atuais presentes');
for (const marker of ['actions/checkout@v5', 'actions/setup-node@v5', 'actions/setup-java@v5']) check(workflow.includes(marker), `Workflow APK atualizado para ${marker}`);
for (const marker of ['actions/checkout@v5', 'actions/setup-node@v5', 'actions/setup-java@v5']) check(playWorkflow.includes(marker), `Workflow Play atualizado para ${marker}`);
for (const marker of ['gradle/actions/setup-gradle@v6', 'actions/upload-artifact@v6']) check(workflow.includes(marker), `Workflow APK atualizado para ${marker}`);
for (const marker of ['android-actions/setup-android@v4', 'actions/upload-artifact@v6']) check(playWorkflow.includes(marker), `Workflow Play atualizado para ${marker}`);
check(!exists('MANIFESTO_ARQUIVOS_V29.10.sha256') && !exists('MANIFESTO_PRODUCAO_V29.20.sha256') && !exists('MANIFESTO_PRODUCAO_V29.30.sha256'), 'Manifestos antigos removidos');
for (const file of [
  'src/lib/productionReadiness.ts',
  'src/modules/quality/ProductionReadinessCenter.tsx',
  'src/modules/card-reader/ocrVisionEngine.ts',
  'src/modules/card-reader/forensicConsensus.ts',
  'src/modules/card-reader/templateCalibration.ts',
  'src/modules/card-reader/efhubProfile.ts',
  'src/modules/rules/officialRuleRegistry.ts',
  'src/modules/tactical-studio/tacticalStudio2Engine.ts',
  'src/modules/opponents/opponentMatchAssistant.ts',
  'src/modules/performance/antiDelayEngine.ts',
  'src/modules/coaching/smartCoachEngine.ts',
  'src/modules/experience/premiumExperience2.ts',
  'src/modules/observability/observabilityEngine.ts',
  'src/modules/community/communitySharing.ts',
  'src/modules/commercial/commercialization.ts',
  'src/modules/publication/playStorePublication.ts',
  'scripts/install-play-store-bridge.mjs',
  'scripts/publish-play-store.mjs',
  'src/app/privacidade/page.tsx',
  'src/app/excluir-conta/page.tsx',
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
  'tests/types-v3160/tsconfig.json',
  'tests/types-v3160-ui/tsconfig.json',
  'src/modules/matches/matchRecorderBridge.ts',
  'src/modules/matches/matchTrainerEngine.ts',
  'src/modules/matches/MatchTrainerCenter.tsx',
  'scripts/install-match-recorder-plugin.mjs',
  'tests/types-v3170/tsconfig.json',
  'tests/types-v3170-ui/tsconfig.json',
  'src/lib/officialSkillIdentity.ts',
  'src/lib/skillIntegrity.ts',
  'tests/v31-72-complementary-skills-regression.ts',
  'tests/types-v3172/tsconfig.json',
  'tests/v31-73-account-panel-restoration-regression.mjs',
  'tests/types-v3173-ui/tsconfig.json',
  'tests/types-v3173-edge/tsconfig.json',
  'supabase/migrations/202607280002_restore_account_creation_v3173.sql'
]) check(exists(file), `Componente de produção presente: ${file}`);
check(read('src/components/CardVisionApp.tsx').split('\n').length < 4000, 'CardVisionApp abaixo de 4.000 linhas');
check(read('src/lib/analyzer.ts').split('\n').length < 3500, 'Analyzer abaixo de 3.500 linhas');
check(!exists('public/update-manifest.json'), 'Manifesto remoto não empacotado');

const allFiles = [...walk('src'), ...walk('scripts'), ...walk('public'), ...walk('supabase'), ...walk('.github')];
const forbiddenExtensions = new Set(['.apk', '.aab', '.jks', '.keystore', '.p12', '.pfx']);
const forbidden = allFiles.filter((file) => forbiddenExtensions.has(path.extname(file).toLowerCase()));
check(forbidden.length === 0, 'Nenhum APK, AAB ou chave privada incluído', forbidden.join(', '));
const privateKeyHits = allFiles.filter((file) => /\.(?:ts|tsx|js|mjs|cjs|json|yml|yaml|css|md|txt)$/i.test(file)).filter((file) => /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(read(file)));
check(privateKeyHits.length === 0, 'Nenhuma chave privada textual incluída', privateKeyHits.join(', '));

const sourceBytes = walk('src').reduce((sum, file) => sum + fs.statSync(file).size, 0);
if (sourceBytes > 5 * 1024 * 1024) warnings.push(`Código-fonte possui ${(sourceBytes / 1024 / 1024).toFixed(2)} MB.`);
for (const file of ['src/components/CardVisionApp.tsx', 'src/lib/analyzer.ts']) {
  const lines = read(file).split('\n').length;
  if (lines > 2500) warnings.push(`${file} permanece grande (${lines} linhas).`);
}

const fingerprint = crypto.createHash('sha256').update(JSON.stringify({ version, files: allFiles.length, sourceBytes })).digest('hex').slice(0, 16);
console.log(`\nPRÉ-VOO DO PROJETO LIMPO v${version}`);
console.log(`✓ ${passes.length} verificações aprovadas • assinatura lógica ${fingerprint}`);
for (const warning of warnings) console.warn(`⚠ ${warning}`);
if (failures.length) {
  console.error(`\n✗ ${failures.length} falha(s) bloqueante(s)`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log('Pré-voo do projeto limpo aprovado.');
