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
const workflow = read('.github/workflows/build-apk.yml');
const playWorkflow = read('.github/workflows/build-play-store.yml');
const capacitor = read('capacitor.config.ts');
const tsconfig = JSON.parse(read('tsconfig.json'));

check(version === '30.50.0', 'Versão v30.50 configurada', version);
check(lock.version === version && lock.packages?.['']?.version === version, 'package-lock sincronizado');
check(appUpdates.includes(`'${version}'`), 'Motor de atualização sincronizado');
check(dataSafety.includes(`APP_DATA_VERSION = '${version}'`) && dataSafety.includes('CURRENT_DATA_SCHEMA = 3000'), 'Esquema de dados sincronizado');
check(manifest.name === 'BuildMaster Elite Tático v30.50' && manifest.short_name === 'BuildMaster v30.50', 'Manifesto PWA sincronizado');
check(sw.includes('buildmaster-v30-50'), 'Cache PWA renovado');
check(!/@import\s+['"]/i.test(css) && css.includes('.bm-v3000-play-publication'), 'Tema de produção consolidado');
check(layout.includes('bm-v3000-play-publication'), 'Escopo visual v30 ativo');
check(rootPage.includes('AuthGate') && rootPage.includes('CardVisionApp'), 'Rota inicial correta');
check(capacitor.includes("appId: 'com.buildmaster.elitetatico'") && capacitor.includes("webDir: 'out'") && capacitor.includes('webContentsDebuggingEnabled: false'), 'Capacitor configurado para produção');
for (const command of ['npm run release:preflight', 'npm run quality:syntax', 'npm run quality:interactive', 'npm run typecheck', 'npm run test:all']) check(workflow.includes(command), `Workflow APK executa ${command}`);
for (const marker of ['assembleRelease', 'ANDROID_SIGNING_BUNDLE', 'SHA-256', 'Validar release imutável publicamente', 'BuildMaster-Elite-Tatico-latest.apk']) check(workflow.includes(marker), `Workflow APK contém ${marker}`);
for (const marker of ['bundleRelease', 'targetSdkVersion = 36', 'GOOGLE_PLAY_UPLOAD_KEY_BUNDLE', 'bundletool.jar validate']) check(playWorkflow.includes(marker), `Workflow Play contém ${marker}`);
check(pkg.scripts?.['test:all'] === 'npm run test:v3000 && npm run test:v3010 && npm run test:v3020 && npm run test:v3030 && npm run test:v3040 && npm run test:v3050 && npm run quality:audit', 'Bateria atual configurada');
check(new Set(tsconfig.exclude ?? []).has('tests/types-v3000'), 'Fixtures isoladas fora do typecheck principal');
check(exists('tests/v30-00-integrated-production-regression.mjs') && exists('tests/v30-00-play-publication-regression.ts') && exists('tests/v30-00-play-workflow-regression.mjs') && exists('tests/v30-10-world-fusion-regression.ts') && exists('tests/v30-20-local-ai-impeto-regression.ts') && exists('tests/v30-30-detailed-print-intelligence-regression.ts') && exists('tests/v30-40-smart-card-crop-regression.ts') && exists('tests/v30-50-ultra-precision-ocr-regression.ts'), 'Regressões atuais presentes');
check(!exists('MANIFESTO_ARQUIVOS_V29.10.sha256') && !exists('MANIFESTO_PRODUCAO_V29.20.sha256') && !exists('MANIFESTO_PRODUCAO_V29.30.sha256'), 'Manifestos antigos removidos');
for (const file of [
  'src/lib/productionReadiness.ts',
  'src/modules/quality/ProductionReadinessCenter.tsx',
  'src/modules/card-reader/ocrVisionEngine.ts',
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
  'src/modules/card-reader/highPrecisionOcr.ts'
  ,'src/modules/card-reader/imageProcessing.ts'
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
