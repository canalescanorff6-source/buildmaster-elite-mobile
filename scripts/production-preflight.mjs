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
const minor = version.split('.').slice(0, 2).join('.');
const appUpdates = read('src/lib/appUpdates.ts');
const dataSafety = read('src/lib/dataSafety.ts');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');
const globals = read('src/app/globals.css').trim();
const layout = read('src/app/layout.tsx');
const workflow = read('.github/workflows/build-apk.yml');
const capacitor = read('capacitor.config.ts');
const tsconfig = JSON.parse(read('tsconfig.json'));
const typecheckExcludes = new Set(tsconfig.exclude ?? []);

check(/^30\.00\.\d+$/.test(version), 'Versão v30.00 configurada', version);
check(lock.version === version && lock.packages?.['']?.version === version, 'package-lock sincronizado com a versão');
check(appUpdates.includes(`'${version}'`), 'Motor de atualização usa a versão final');
check(dataSafety.includes(`APP_DATA_VERSION = '${version}'`) && dataSafety.includes('CURRENT_DATA_SCHEMA = 3000'), 'Esquema de dados final configurado');
check(manifest.name === `BuildMaster Elite Tático v${minor}` && manifest.short_name === `BuildMaster v${minor}`, 'Manifesto PWA usa identidade final');
check(sw.includes(`buildmaster-v${minor.replace('.', '-')}`), 'Cache PWA renovado');
check(globals.endsWith('@import "./design-system-v3000-play-publication.css";'), 'CSS v30.00 carregado por último');
check(layout.includes('bm-v2920-production') && layout.includes('bm-v2930-intelligence') && layout.includes('bm-v2940-player-lab') && layout.includes('bm-v2950-tactical-opponent') && layout.includes('bm-v2960-anti-delay-coach') && layout.includes('bm-v2970-premium-observability') && layout.includes('bm-v2980-community-commercial') && layout.includes('bm-v3000-play-publication'), 'Escopos visual de produção, inteligência e laboratório ativos');
check(capacitor.includes("appId: 'com.buildmaster.elitetatico'") && capacitor.includes("webDir: 'out'") && capacitor.includes('webContentsDebuggingEnabled: false'), 'Capacitor configurado para produção');
check(workflow.includes(`Gerar APK v${minor}`), 'Workflow acompanha a versão final');
for (const command of ['npm run release:preflight', 'npm run quality:syntax', 'npm run quality:interactive', 'npm run typecheck', 'npm run test:all']) check(workflow.includes(command), `Workflow executa ${command}`);
for (const marker of ['assembleRelease', 'ANDROID_SIGNING_BUNDLE', 'SHA-256', 'Validar release imutável publicamente', 'BuildMaster-Elite-Tatico-latest.apk']) check(workflow.includes(marker), `Workflow contém etapa ${marker}`);
check(exists('src/lib/productionReadiness.ts') && exists('src/modules/quality/ProductionReadinessCenter.tsx'), 'Central de prontidão de produção presente');
check(exists('tests/v29-20-production-readiness-engine-regression.cjs') && exists('tests/v29-20-ui-production-regression.mjs'), 'Regressões finais presentes');
check(pkg.scripts?.['test:all']?.startsWith('npm run test:v3000 && npm run test:v2980'), 'Bateria geral começa pela regressão v30.00');
check(typecheckExcludes.has('tests/types-v2910') && typecheckExcludes.has('tests/types-v2920') && typecheckExcludes.has('tests/types-v2930') && typecheckExcludes.has('tests/types-v2940') && typecheckExcludes.has('tests/types-v2950') && typecheckExcludes.has('tests/types-v2960') && typecheckExcludes.has('tests/types-v2970') && typecheckExcludes.has('tests/types-v2980') && typecheckExcludes.has('tests/types-v3000'), 'Fixtures isoladas não contaminam o typecheck principal');
check(exists('tests/v29-20-typecheck-isolation-regression.mjs') && exists('tests/v29-30-typescript-boundary-regression.mjs'), 'Regressões de isolamento do TypeScript presentes');
check(exists('src/modules/architecture/moduleRegistry.ts') && exists('src/modules/architecture/appOptions.ts'), 'Arquitetura 2.0 modular presente');
check(exists('src/modules/card-reader/ocrVisionEngine.ts') && exists('src/modules/card-reader/OcrVisionCenter.tsx'), 'OCR Vision 2.0 presente');
check(exists('src/modules/rules/officialRuleRegistry.ts') && exists('src/modules/rules/OfficialRulesCenter.tsx'), 'Base oficial versionada presente');
check(exists('src/modules/players/advancedPlayerLaboratory.ts') && exists('src/modules/players/AdvancedPlayerLab.tsx'), 'Laboratório avançado de jogadores presente');
check(exists('tests/v29-40-rules-player-lab-regression.ts') && exists('tests/v29-40-integrated-ui-regression.mjs'), 'Regressões próprias da v29.40 presentes');
check(exists('src/modules/tactical-studio/tacticalStudio2Engine.ts') && exists('src/modules/tactical-studio/TacticalStudio2SequencePanel.tsx'), 'Estúdio Tático 2.0 presente');
check(exists('src/modules/opponents/opponentMatchAssistant.ts') && exists('src/modules/opponents/OpponentMatchAssistantPanel.tsx'), 'Assistente de adversário v29.50 presente');
check(exists('tests/v29-50-tactical-opponent-regression.ts') && exists('tests/v29-50-integrated-ui-regression.mjs'), 'Regressões próprias da v29.50 presentes');
check(exists('src/modules/performance/antiDelayEngine.ts') && exists('src/modules/performance/AntiDelayCenter.tsx'), 'Central anti-delay v29.60 presente');
check(exists('src/modules/coaching/smartCoachEngine.ts') && exists('src/modules/coaching/SmartCoachCenter.tsx'), 'Treinador inteligente v29.60 presente');
check(exists('tests/v29-60-anti-delay-smart-coach-regression.ts') && exists('tests/v29-60-integrated-ui-regression.mjs'), 'Regressões próprias da v29.60 presentes');
check(exists('src/modules/experience/premiumExperience2.ts') && exists('src/modules/experience/PremiumExperience2Center.tsx'), 'Experiência Premium 2.0 v29.70 presente');
check(exists('src/modules/observability/observabilityEngine.ts') && exists('src/modules/observability/ObservabilitySupportCenter.tsx'), 'Observabilidade e suporte v29.70 presentes');
check(exists('tests/v29-70-premium-observability-regression.ts') && exists('tests/v29-70-integrated-ui-regression.mjs'), 'Regressões próprias da v29.70 presentes');
check(exists('src/modules/community/communitySharing.ts') && exists('src/modules/community/CommunitySharingCenter.tsx'), 'Compartilhamento e comunidade v29.80 presentes');
check(exists('src/modules/commercial/commercialization.ts') && exists('src/modules/commercial/CommercializationCenter.tsx'), 'Comercialização e LGPD v29.80 presentes');
check(exists('supabase/migrations/202607250001_blocks25_27_community_commercial.sql'), 'Migração Supabase v29.80 presente');
check(exists('tests/v29-80-community-commercial-regression.ts') && exists('tests/v29-80-integrated-ui-regression.mjs'), 'Regressões próprias da v29.80 presentes');


check(exists('src/modules/publication/playStorePublication.ts') && exists('src/modules/publication/PlayStorePublicationCenter.tsx'), 'Central de publicação Google Play v30.00 presente');
check(exists('src/modules/publication/playIntegrity.ts') && exists('scripts/install-play-store-bridge.mjs'), 'Play Integrity e In-App Updates presentes');
check(exists('.github/workflows/build-play-store.yml') && read('.github/workflows/build-play-store.yml').includes('bundleRelease'), 'Workflow AAB Google Play presente');
check(exists('scripts/publish-play-store.mjs') && exists('scripts/validate-play-store-release.mjs'), 'Publicador e pré-voo Play presentes');
check(exists('src/app/privacidade/page.tsx') && exists('src/app/excluir-conta/page.tsx'), 'Rotas públicas de privacidade e exclusão presentes');
check(exists('supabase/functions/account-deletion-request/index.ts') && exists('supabase/functions/play-integrity-verify/index.ts'), 'Edge Functions de privacidade e integridade presentes');
check(exists('tests/v30-00-play-publication-regression.ts') && exists('tests/v30-00-integrated-production-regression.mjs'), 'Regressões próprias da v30.00 presentes');

check(read('src/components/CardVisionApp.tsx').split('\n').length < 4000, 'CardVisionApp reduzido para menos de 4.000 linhas');
check(read('src/lib/analyzer.ts').split('\n').length < 3500, 'analyzer reduzido para menos de 3.500 linhas');
check(!exists('public/update-manifest.json'), 'Manifesto remoto não foi empacotado no aplicativo');

const allFiles = [...walk('src'), ...walk('scripts'), ...walk('public'), ...walk('supabase'), ...walk('.github')];
const forbiddenExtensions = new Set(['.apk', '.aab', '.jks', '.keystore', '.p12', '.pfx']);
const forbidden = allFiles.filter((file) => forbiddenExtensions.has(path.extname(file).toLowerCase()));
check(forbidden.length === 0, 'Nenhum APK, AAB ou chave privada incluído', forbidden.join(', '));
const privateKeyHits = allFiles.filter((file) => /\.(?:ts|tsx|js|mjs|cjs|json|yml|yaml|css|md|txt)$/i.test(file)).filter((file) => /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(read(file)));
check(privateKeyHits.length === 0, 'Nenhuma chave privada textual incluída', privateKeyHits.join(', '));
const secretHits = allFiles.filter((file) => /\.(?:ts|tsx|js|mjs|cjs|json|yml|yaml)$/i.test(file)).filter((file) => /service_role\s*[:=]\s*["'][A-Za-z0-9._-]{20,}/i.test(read(file)));
check(secretHits.length === 0, 'Nenhuma chave service_role fixa incluída', secretHits.join(', '));

const sourceBytes = walk('src').reduce((sum, file) => sum + fs.statSync(file).size, 0);
if (sourceBytes > 4 * 1024 * 1024) warnings.push(`Código-fonte possui ${(sourceBytes / 1024 / 1024).toFixed(2)} MB; acompanhar o orçamento.`);
for (const file of ['src/components/CardVisionApp.tsx', 'src/lib/analyzer.ts']) {
  const lines = read(file).split('\n').length;
  if (lines > 2500) warnings.push(`${file} permanece grande (${lines} linhas), embora os módulos novos estejam separados.`);
}

const fingerprint = crypto.createHash('sha256').update(JSON.stringify({ version, files: allFiles.length, sourceBytes })).digest('hex').slice(0, 16);
console.log(`\nPRÉ-VOO DE PRODUÇÃO BUILDMASTER v${version}`);
console.log(`✓ ${passes.length} verificações aprovadas • assinatura lógica ${fingerprint}`);
for (const label of passes) console.log(`  ✓ ${label}`);
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} alerta(s) não bloqueante(s)`);
  for (const warning of warnings) console.log(`  ⚠ ${warning}`);
}
if (failures.length) {
  console.error(`\n✗ ${failures.length} falha(s) bloqueante(s)`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log('\nPré-voo de produção aprovado. APK assinado e atualização em Android real continuam obrigatórios antes do rollout total.');
