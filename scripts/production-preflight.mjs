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
const executiveCss = read('src/app/v33-executive.css');
const studioCss = read('src/app/v34-studio.css');
const cleanResponsiveCss = read('src/app/v34-clean-responsive.css');
const identityCss = read('src/app/v35-identity-themes.css');
const solidCss = read('src/app/v35-solid-premium.css');
const revolutionCss = read('src/app/v36-premium-revolution.css');
const professionalCss = read('src/app/v37-professional-intelligence.css');
const layout = read('src/app/layout.tsx');
const rootPage = read('src/app/page.tsx');
const privacyPage = read('src/app/privacidade/page.tsx');
const deletionPage = read('src/app/excluir-conta/page.tsx');
const workflow = read('.github/workflows/build-apk.yml');
const playWorkflow = read('.github/workflows/build-play-store.yml');
const supabaseConfig = read('supabase/config.toml');
const capacitor = read('capacitor.config.ts');
const tsconfig = JSON.parse(read('tsconfig.json'));
const appTsconfig = JSON.parse(read('tsconfig.app.json'));
const cardVisionSource = read('src/components/CardVisionApp.tsx');
const cropCalibrationSource = read('src/modules/card-reader/templateCalibration.ts');

check(version === '38.40.0', 'Versão v38.40 configurada', version);
check(lock.version === version && lock.packages?.['']?.version === version, 'package-lock sincronizado');
check(appUpdates.includes(`'${version}'`), 'Motor de atualização sincronizado');
check(dataSafety.includes(`APP_DATA_VERSION = '${version}'`) && dataSafety.includes('CURRENT_DATA_SCHEMA = 3100'), 'Versão de dados sincronizada sem quebrar o esquema compatível');
check(manifest.name === 'BuildMaster Elite Tático v38.40' && manifest.short_name === 'BuildMaster v38.40', 'Manifesto PWA sincronizado');
check(sw.includes('buildmaster-v38-40-background-ocr-resume-1'), 'Cache PWA v38.40 renovado');
check(!/@import\s+['"]/i.test(css) && !/@import\s+['"]/i.test(executiveCss) && !/@import\s+['"]/i.test(studioCss) && !/@import\s+['"]/i.test(cleanResponsiveCss) && !/@import\s+['"]/i.test(identityCss) && !/@import\s+['"]/i.test(solidCss) && !/@import\s+['"]/i.test(revolutionCss) && !/@import\s+['"]/i.test(professionalCss) && css.includes('.bm-v3000-play-publication') && executiveCss.includes('.bm-v33-sidebar') && studioCss.includes('.bm-v3400-studio') && cleanResponsiveCss.includes('.bm-v3400-clean-responsive') && identityCss.includes('.bm-v3500-identity') && identityCss.includes('visual-midnight-navy') && solidCss.includes('.bm-v3520-solid') && solidCss.includes('.bm-dna-profile-grid') && revolutionCss.includes('.bm-v3600-revolution') && revolutionCss.includes('.bm-v36-mobile-dock') && professionalCss.includes('.bm-v3700-professional') && professionalCss.includes('.professional-scenario-grid'), 'Tema de produção, identidade e temas consolidados');
check(layout.includes('bm-v3000-play-publication') && layout.includes('bm-v3300-executive') && layout.includes('v33-executive.css') && layout.includes('bm-v3400-studio') && layout.includes('v34-studio.css') && layout.includes('bm-v3400-clean-responsive') && layout.includes('v34-clean-responsive.css') && layout.includes('bm-v3500-identity') && layout.includes('v35-identity-themes.css') && layout.includes('bm-v3600-revolution') && layout.includes('v36-premium-revolution.css') && layout.includes('bm-v3700-professional') && layout.includes('v37-professional-intelligence.css'), 'Escopo visual e identidade ativos');
check(rootPage.includes("@/components/AuthGate") && rootPage.includes("@/components/CardVisionApp") && rootPage.includes("@/components/AppShellSafetyBoundaryV3930") && rootPage.includes('<AppShellSafetyBoundaryV3930>') && rootPage.includes('<AuthGate>') && rootPage.includes('<CardVisionApp') && rootPage.includes('</AppShellSafetyBoundaryV3930>') && !/PrivacyPolicyPage|Política de privacidade|public-policy-page/.test(rootPage), 'Rota inicial correta', 'src/app/page.tsx deve abrir AppShellSafetyBoundaryV3930 + AuthGate + CardVisionApp e não pode conter a política de privacidade');
check(/PrivacyPolicyPage|Política de privacidade/.test(privacyPage), 'Rota de privacidade separada');
check(/AccountDeletionPage|Solicitar exclusão da conta/.test(deletionPage), 'Rota de exclusão separada');
check(capacitor.includes("appId: 'com.buildmaster.elitetatico'") && capacitor.includes("webDir: 'out'") && capacitor.includes('webContentsDebuggingEnabled: false'), 'Capacitor configurado para produção');
const apkUsesConsolidatedDoctor = workflow.includes('npm run ci:verify');
for (const command of ['npm run release:preflight', 'npm run quality:routes', 'npm run quality:syntax', 'npm run quality:interactive', 'npm run typecheck', 'npm run test:all']) check(apkUsesConsolidatedDoctor || workflow.includes(command), `Workflow APK executa ${command} diretamente ou pelo diagnóstico consolidado`);
for (const marker of ['assembleRelease', 'ANDROID_SIGNING_BUNDLE', 'ANDROID_KEY_PASSWORD', "'keytool', '-list'", "'keytool', '-certreq'", '--key-pass env:ANDROID_KEY_PASSWORD', 'SHA-256', 'Validar release imutável publicamente', 'BuildMaster-Elite-Tatico-latest.apk', 'MANIFESTO_PRODUCAO_V38.40.sha256', 'SOURCE_SHA', 'NEXT_PUBLIC_BUILDMASTER_BUILD_ID={source_sha}', '/functions/v1/license-session', 'install-background-ocr-plugin.mjs', ':app:compileReleaseJavaWithJavac', 'FOREGROUND_SERVICE_DATA_SYNC', 'android-actions/setup-android@v4', 'compileSdkVersion = 36', 'targetSdkVersion = 36']) check(workflow.includes(marker), `Workflow APK contém ${marker}`);
for (const marker of ['bundleRelease', 'targetSdkVersion = 36', 'GOOGLE_PLAY_UPLOAD_KEY_BUNDLE', 'bundletool.jar validate', 'install-background-ocr-plugin.mjs', ':app:compileReleaseJavaWithJavac']) check(playWorkflow.includes(marker), `Workflow Play contém ${marker}`);

check(exists('src/modules/tactical-studio/metaFormationStudioV3832.ts') && exists('src/modules/tactical-studio/MetaFormationStudioV3832.tsx') && exists('src/modules/tactical-studio/professionalTacticalTemplateV3833.ts') && exists('tests/v38-33-professional-template-regression.mjs') && exists('tests/v38-34-ci-complete-hotfix-regression.mjs') && exists('tests/v38-35-legacy-regressions-hotfix.mjs') && exists('tests/v38-36-deterministic-audit-hotfix.mjs'), 'Gerador Tático Profissional e hotfix v38.36 preservados');
check(String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3833') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3834') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3835') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3836'), 'Bateria de produção preserva v38.33–v38.36');
check(exists('src/lib/automaticCardGameplayProfile.ts') && exists('tests/v38-37-automatic-card-gameplay-regression.ts') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3837'), 'Perfil automático da carta v38.37 integrado');
check(exists('tests/v38-38-legacy-profile-regressions-hotfix.mjs') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3838') && exists('tests/v38-39-legacy-contract-final-hotfix.mjs') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3839') && exists('tests/v38-40-background-ocr-resume-regression.mjs') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3840'), 'Compatibilidade legada v38.38 e correção final v38.40 integradas');
check(exists('src/lib/performanceBuildEngineV3850.ts') && exists('src/components/PowerBuildEngineV3850Panel.tsx') && exists('tests/v38-50-power-build-engine-regression.mjs') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3850'), 'Motor de desempenho real v38.50 integrado');
check(exists('src/lib/structuralPrecisionV3740.ts') && exists('src/components/StructuralPrecisionPanel.tsx') && exists('tests/v37-40-structural-precision-regression.ts'), 'Precisão estrutural v37.40 integrada');
check(String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3740'), 'Bateria de produção inclui v37.40');

check(String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3200') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3300') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3400') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3500') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3510') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3520') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3600') && String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3700') && String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run quality:audit'), 'Bateria atual configurada');
check(new Set(tsconfig.exclude ?? []).has('tests') && new Set(appTsconfig.exclude ?? []).has('tests'), 'Fixtures isoladas fora do typecheck principal');
check(exists('scripts/repair-root-tsconfig.mjs') && String(pkg.scripts?.['preci:verify'] ?? '').includes('types:repair') && String(pkg.scripts?.pretypecheck ?? '').includes('types:repair'), 'Autorreparo preventivo do tsconfig raiz integrado');
check(String(pkg.scripts?.typecheck ?? '').includes('-p tsconfig.app.json') && !(appTsconfig.include ?? []).some((item) => item.includes('tests') || item === '**/*.ts' || item === '**/*.tsx'), 'Typecheck principal restrito ao aplicativo');
check(exists('scripts/check-typecheck-isolation.mjs') && exists('tests/v31-70-typecheck-isolation-regression.mjs'), 'Portão permanente de isolamento TypeScript presente');
check(exists('scripts/check-card-crop-type-safety.mjs') && String(pkg.scripts?.['quality:card-crop-types'] ?? '').includes('check-card-crop-type-safety.mjs'), 'Portão de segurança do recorte presente');
check(exists('scripts/check-generated-native-java.mjs') && String(pkg.scripts?.['quality:native-java'] ?? '').includes('check-generated-native-java.mjs') && String(pkg.scripts?.['test:v3170'] ?? '').includes('quality:native-java'), 'Portão de Java nativo gerado presente');
check(exists('scripts/check-static-export.mjs') && String(pkg.scripts?.['quality:static-export'] ?? '').includes('check-static-export.mjs') && workflow.includes('npm run quality:static-export') && playWorkflow.includes('npm run quality:static-export'), 'Portão de integridade do export estático presente nos dois builds');
check(!/OFFICIAL_ADDITIONAL_SKILL_NAMES[\s\S]*?from ['"]@\/modules\/analysis['"]/.test(cardVisionSource), 'CardVisionApp sem importação ociosa de habilidades');
check(/applyRememberedCardBox<T extends CardCropBox>\(cardBox: T, calibration: OcrTemplateCalibration \| null\): T/.test(cropCalibrationSource) && /return\s*\{\s*\.\.\.cardBox,/.test(cropCalibrationSource), 'Calibração do recorte preserva OcrZone completo');
const skillIdentitySource = read('src/lib/officialSkillIdentity.ts');
const skillIntegritySource = read('src/lib/skillIntegrity.ts');
const pipelineSource = read('src/lib/cardIntelligencePipeline.ts');
const resultWorkspaceSource = read('src/components/result/ResultWorkspace.tsx');
check(skillIdentitySource.includes('filterComplementaryAdditionalSkills') && skillIdentitySource.includes('buildOwnedSkillKeys'), 'Identidade canônica de habilidades presente');
check(skillIntegritySource.includes('enforceComplementarySkillIntegrity') && skillIntegritySource.includes('Habilidades adicionais e Ímpetos foram avaliados em trilhas separadas.'), 'Auditoria final antirrepetição presente');
check(pipelineSource.includes('enforceComplementarySkillIntegrity(supreme)'), 'Filtro antirrepetição executado depois de todos os motores');
check(resultWorkspaceSource.includes('Top 5 por função v31.80'), 'Auditoria de habilidades visível no resultado');
check(String(pkg.scripts?.['test:v3172'] ?? '').includes('v31-72-complementary-skills-regression.ts'), 'Regressão v31.72 integrada à bateria');
check(exists('scripts/repair-critical-routes.mjs') && exists('scripts/templates/critical-routes/root-page.tsx.txt') && exists('tests/v31-72-critical-route-self-healing-regression.mjs'), 'Autorreparo permanente da rota inicial presente');
check(String(pkg.scripts?.['quality:routes'] ?? '').includes('routes:repair') && String(pkg.scripts?.['test:v3172'] ?? '').includes('critical-route-self-healing'), 'Autorreparo de rotas integrado ao CI e à regressão v31.72');
check(exists('scripts/check-app-routes.mjs') && exists('tests/v31-70-root-route-regression.mjs') && exists('tests/v30-00-integrated-production-regression.mjs') && exists('tests/v30-00-play-publication-regression.ts') && exists('tests/v30-00-play-workflow-regression.mjs') && exists('tests/v30-10-world-fusion-regression.ts') && exists('tests/v30-20-local-ai-impeto-regression.ts') && exists('tests/v30-30-detailed-print-intelligence-regression.ts') && exists('tests/v30-40-smart-card-crop-regression.ts') && exists('tests/v30-50-ultra-precision-ocr-regression.ts') && exists('tests/v31-10-unified-intelligence-regression.ts') && exists('tests/v31-10-tactical-planning-regression.ts') && exists('tests/v31-20-premium-interface-regression.mjs') && exists('tests/v31-30-supreme-gameplay-regression.ts') && exists('tests/v31-40-rigid-adaptive-ocr-regression.ts') && exists('tests/v31-50-forensic-scanner-regression.ts') && exists('tests/v31-60-efhub-profile-regression.ts') && exists('tests/v31-70-match-trainer-regression.ts') && exists('tests/v31-70-native-recorder-installer-regression.mjs') && exists('tests/v31-70-typecheck-isolation-regression.mjs') && exists('tests/v31-71-account-recovery-regression.mjs') && exists('tests/v31-72-complementary-skills-regression.ts') && exists('tests/types-v3172/tsconfig.json') && exists('tests/v31-73-account-panel-restoration-regression.mjs') && exists('tests/types-v3173-ui/tsconfig.json') && exists('tests/types-v3173-edge/tsconfig.json') && exists('tests/v31-74-account-create-regression.mjs') && exists('tests/v31-75-dynamic-efhub-layout-regression.ts') && exists('tests/v31-76-recording-export-regression.mjs') && exists('tests/v31-77-video-intelligence-regression.ts') && exists('tests/v31-78-complete-player-skills-regression.ts') && exists('tests/v31-79-canonical-profile-top5-regression.ts') && exists('tests/v31-80-final-scanner-skills-regression.ts') && exists('tests/types-v3180/tsconfig.json') && exists('tests/v31-81-visual-efhub-calibration-regression.ts') && exists('tests/types-v3181/tsconfig.json') && exists('tests/v31-82-crisp-efhub-calibrator-regression.mjs') && exists('tests/v32-00-mega-calibration-regression.ts') && exists('tests/v32-00-v3000-ci-isolation-regression.mjs') && exists('tests/types-v3200/tsconfig.json') && exists('tests/types-v3200-ui/tsconfig.json') && exists('tests/v33-00-executive-redesign-regression.mjs') && exists('src/app/v33-executive.css') && exists('tests/v34-00-studio-clean-regression.mjs') && exists('src/app/v34-studio.css') && exists('tests/v34-00-responsive-clean-regression.mjs') && exists('src/app/v34-clean-responsive.css') && exists('tests/v34-00-identity-themes-profile-regression.mjs') && exists('src/app/v35-identity-themes.css') && exists('src/components/BuildMasterMark.tsx') && exists('src/components/ProfileAvatarEditor.tsx') && exists('src/components/IdentityAppearancePanel.tsx') && exists('src/lib/profileAvatar.ts') && exists('tests/v35-00-official-additional-skills-meta-regression.ts') && exists('HABILIDADES_ADICIONAIS_OFICIAIS_META_V35.00.md') && exists('tests/v35-10-max-gameplay-dual-position-regression.ts') && exists('FICHA_MAXIMA_GAMEPLAY_V35.10.md') && exists('tests/v35-20-gameplay-dna-solid-theme-regression.ts') && exists('PERFIS_GAMEPLAY_TEMA_SOLIDO_V35.20.md') && exists('src/app/v35-solid-premium.css') && exists('src/components/result/GameplayDnaProfilesCard.tsx') && exists('src/lib/gameplayDnaSelection.ts') && exists('tests/types-v3520/tsconfig.json') && exists('tests/types-v3520-ui/tsconfig.json') && exists('tests/v36-00-premium-revolution-regression.mjs') && exists('src/app/v36-premium-revolution.css') && exists('PREMIUM_REVOLUTION_V36.00.md') && exists('tests/v37-00-professional-intelligence-regression.ts') && exists('src/app/v37-professional-intelligence.css') && exists('src/lib/professionalIntelligenceV37.ts') && exists('src/components/result/ProfessionalIntelligenceCenter.tsx') && exists('tests/types-v3700/tsconfig.json') && exists('tests/types-v3700-ui/tsconfig.json') && exists('CENTRAL_PROFISSIONAL_V37.00.md'), 'Regressões atuais presentes');
for (const marker of ['actions/checkout@v5', 'actions/setup-node@v5', 'actions/setup-java@v5']) check(workflow.includes(marker), `Workflow APK atualizado para ${marker}`);
for (const marker of ['actions/checkout@v5', 'actions/setup-node@v5', 'actions/setup-java@v5']) check(playWorkflow.includes(marker), `Workflow Play atualizado para ${marker}`);
for (const marker of ['gradle/actions/setup-gradle@v6', 'actions/upload-artifact@v6']) check(workflow.includes(marker), `Workflow APK atualizado para ${marker}`);
for (const marker of ['android-actions/setup-android@v4', 'actions/upload-artifact@v6']) check(playWorkflow.includes(marker), `Workflow Play atualizado para ${marker}`);
check(playWorkflow.includes('/functions/v1/license-session'), 'Workflow Play valida a Edge Function crítica de licença antes do AAB');
check(playWorkflow.includes('npm run integrity:generate') && playWorkflow.includes('npm run integrity:verify'), 'Workflow Play gera e verifica o manifesto de integridade antes do AAB');
check(/\[functions\.license-session\][\s\S]*?verify_jwt\s*=\s*true/.test(supabaseConfig), 'license-session permanece protegida por JWT de usuário');
check(/\[functions\.admin-users\][\s\S]*?verify_jwt\s*=\s*true/.test(supabaseConfig), 'admin-users permanece protegida por JWT de usuário');
check(/\[functions\.account-deletion-request\][\s\S]*?verify_jwt\s*=\s*false/.test(supabaseConfig), 'Solicitação pública de exclusão aceita chave publishable sem JWT legado');
check(/\[functions\.pro-build-search\][\s\S]*?verify_jwt\s*=\s*false/.test(supabaseConfig), 'Busca Pro aceita chave publishable sem usar API key como Bearer');
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
check(read('src/components/CardVisionApp.tsx').split('\n').length < 4200, 'CardVisionApp abaixo de 4.200 linhas');
check(read('src/lib/analyzer.ts').split('\n').length < 3500, 'Analyzer abaixo de 3.500 linhas');
check(!exists('public/update-manifest.json'), 'Manifesto remoto não empacotado');
for (const file of [
  'public/assets/branding/buildmaster-app-icon.png',
  'public/assets/branding/buildmaster-mark.png',
  'public/assets/branding/buildmaster-splash.webp',
  'resources/android-branding/res/mipmap-anydpi-v26/ic_launcher.xml',
  'resources/android-branding/res/mipmap-anydpi-v33/ic_launcher.xml',
  'resources/android-branding/res/drawable/buildmaster_native_splash.xml',
  'scripts/install-android-branding.mjs',
  'tests/v38-40-branding-regression.mjs'
]) check(exists(file), `Identidade premium pronta para produção: ${file}`);
check(read('.github/workflows/build-apk.yml').includes('install-android-branding.mjs'), 'Workflow APK instala a identidade premium');
check(read('.github/workflows/build-play-store.yml').includes('install-android-branding.mjs'), 'Workflow Play instala a identidade premium');

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
