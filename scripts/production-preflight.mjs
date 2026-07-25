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

check(/^29\.20\.\d+$/.test(version), 'Versão final v29.20 configurada', version);
check(lock.version === version && lock.packages?.['']?.version === version, 'package-lock sincronizado com a versão');
check(appUpdates.includes(`'${version}'`), 'Motor de atualização usa a versão final');
check(dataSafety.includes(`APP_DATA_VERSION = '${version}'`) && dataSafety.includes('CURRENT_DATA_SCHEMA = 2920'), 'Esquema de dados final configurado');
check(manifest.name === `BuildMaster Elite Tático v${minor}` && manifest.short_name === `BuildMaster v${minor}`, 'Manifesto PWA usa identidade final');
check(sw.includes(`buildmaster-v${minor.replace('.', '-')}`), 'Cache PWA renovado');
check(globals.endsWith('@import "./design-system-v2920-production.css";'), 'CSS final carregado por último');
check(layout.includes('bm-v2920-production'), 'Escopo visual final ativo');
check(capacitor.includes("appId: 'com.buildmaster.elitetatico'") && capacitor.includes("webDir: 'out'") && capacitor.includes('webContentsDebuggingEnabled: false'), 'Capacitor configurado para produção');
check(workflow.includes(`Gerar APK v${minor}`), 'Workflow acompanha a versão final');
for (const command of ['npm run release:preflight', 'npm run quality:syntax', 'npm run quality:interactive', 'npm run test:v2920', 'npm run typecheck', 'npm run test:all']) check(workflow.includes(command), `Workflow executa ${command}`);
for (const marker of ['assembleRelease', 'ANDROID_SIGNING_BUNDLE', 'SHA-256', 'Validar release imutável publicamente', 'BuildMaster-Elite-Tatico-latest.apk']) check(workflow.includes(marker), `Workflow contém etapa ${marker}`);
check(exists('src/lib/productionReadiness.ts') && exists('src/modules/quality/ProductionReadinessCenter.tsx'), 'Central de prontidão de produção presente');
check(exists('tests/v29-20-production-readiness-engine-regression.cjs') && exists('tests/v29-20-ui-production-regression.mjs'), 'Regressões finais presentes');
check(typecheckExcludes.has('tests/types-v2910') && typecheckExcludes.has('tests/types-v2920'), 'Fixtures isoladas não contaminam o typecheck principal');
check(exists('tests/v29-20-typecheck-isolation-regression.mjs'), 'Regressão de isolamento do TypeScript presente');
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
