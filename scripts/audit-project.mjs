import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const pkg = JSON.parse(read('package.json'));
const expectedVersion = pkg.version;
const expectedMinor = expectedVersion.split('.').slice(0, 2).join('.');
const failures = [];
const warnings = [];
const passes = [];

function check(condition, label, detail = '') {
  if (condition) passes.push(label);
  else failures.push(detail ? `${label}: ${detail}` : label);
}

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
const testFiles = walk('tests');
const workflow = read('.github/workflows/build-apk.yml');
const appUpdates = read('src/lib/appUpdates.ts');
const nativeInstaller = read('scripts/install-android-security-plugin.mjs');
const globals = read('src/app/globals.css');
const layout = read('src/app/layout.tsx');
const manifest = read('public/manifest.webmanifest');
const sw = read('public/sw.js');

check(/^29\.10\.\d+$/.test(expectedVersion), 'Versão de auditoria v29.10 configurada', `encontrada ${expectedVersion}`);
check(appUpdates.includes(`'${expectedVersion}'`), 'Motor de atualização usa a versão do pacote');
check(layout.includes('APP_RELEASE_VERSION'), 'Metadados da interface usam versão centralizada');
check(manifest.includes(`v${expectedMinor}`), 'Manifesto PWA acompanha a versão atual');
check(sw.includes(expectedMinor.replace('.', '-')), 'Cache do service worker foi renovado');
check(globals.includes('design-system-v2729.css') && globals.includes('tactical-poster-v2733.css'), 'Camada final de design, acessibilidade e Estúdio Tático carregada');
check(exists('src/components/SectionErrorBoundary.tsx'), 'Isolamento de falhas por módulo presente');
check(exists('src/components/PanelLoadingFallback.tsx'), 'Fallback de carregamento por módulo presente');
check(exists('src/components/PremiumQualityLayer.tsx') && exists('src/components/PremiumQualityCenter.tsx'), 'Camada final de qualidade e auditoria local presente');
check(exists('src/lib/appQualityV2840.ts'), 'Motor adaptativo de qualidade presente');
check(exists('src/lib/performanceScheduler.ts') && exists('src/components/lazy/AppLazyPanels.tsx'), 'Agendador e registro de carregamento modular presentes');
check(exists('src/components/result/ResultWorkspace.tsx') && exists('src/modules/squad/TeamFullMapPanel.tsx'), 'Telas pesadas extraídas do componente central');
check(exists('src/modules/builds/trainingOptimizer.ts') && exists('src/modules/vault/cardHistoryStore.ts'), 'Motores de ficha e Cofre separados');
check(exists('src/modules/builds/advancedBuildIntelligence.ts'), 'Motor de inteligência avançada das fichas presente');
check(read('src/modules/builds/advancedBuildIntelligence.ts').includes("ADVANCED_BUILD_INTELLIGENCE_VERSION = '28.60.0'"), 'Motor de fichas identificado como v28.60');
check(read('src/components/PrecisionBuildPanel.tsx').includes('buildAdvancedBuildIntelligence'), 'Painel de fichas integrado ao motor avançado');
check(read('src/app/legacy-compat/part-07.css').includes('v28.60 — Bloco 7'), 'Interface responsiva do Bloco 7 presente');
check(exists('tests/v28-60-advanced-build-intelligence-regression.ts') && exists('tests/v28-60-advanced-build-ui-regression.mjs'), 'Regressões do Bloco 7 presentes');
check(globals.trim().endsWith('@import "./design-system-v2910-admin-update.css";'), 'Camada dos Blocos 12 e 13 carregada por último');
check(exists('src/modules/training/trainingEvolutionEngine.ts') && read('src/modules/training/trainingEvolutionEngine.ts').includes("TRAINING_EVOLUTION_VERSION = '28.80.0'"), 'Motor de treinos e evolução v28.80 presente');
check(exists('src/modules/training/TrainingEvolutionCenter.tsx'), 'Central de Treinos e Evolução presente');
check(exists('tests/v28-80-training-evolution-engine-regression.ts') && exists('tests/v28-80-training-evolution-ui-regression.mjs'), 'Regressões do Bloco 9 presentes');
check(exists('src/modules/matches/competitivePerformanceEngine.ts') && exists('src/modules/matches/CompetitivePerformanceCenter.tsx'), 'Motor e painel competitivo do Bloco 10 presentes');
check(exists('src/modules/backup/syncBackupEngine.ts') && exists('src/modules/backup/CloudSyncCenter.tsx'), 'Motor e central de nuvem do Bloco 11 presentes');
check(exists('tests/v29-00-competitive-performance-engine-regression.cjs') && exists('tests/v29-00-cloud-sync-engine-regression.cjs') && exists('tests/v29-00-integrated-ui-regression.mjs'), 'Regressões integradas da v29.00 presentes');
check(exists('src/modules/administration/AdministrationSecurityCenter.tsx') && exists('src/modules/updates/DefinitiveUpdateCenter.tsx'), 'Centrais dos Blocos 12 e 13 presentes');
check(exists('supabase/migrations/202607240001_blocks12_13_admin_update.sql'), 'Migração administrativa e de governança presente');
check(read('supabase/functions/admin-users/index.ts').includes("jwtClaims(token).aal !== 'aal2'") && read('supabase/functions/admin-users/index.ts').includes("require_device_proof: true"), 'MFA e prova do aparelho são obrigatórios no servidor');
check(appUpdates.includes('rolloutPercentage') && appUpdates.includes('rollbackFromVersion') && appUpdates.includes('DEFAULT_UPDATE_BETA_URL'), 'Motor de atualização suporta beta, rollout, pausa e rollback');
check(read('src/lib/updateChannel.ts').includes("preferredChannel: 'stable' | 'beta'") && read('src/modules/updates/updateGovernance.ts').includes('release-history.json'), 'Canais e histórico de publicação estão integrados');
check(workflow.includes('rollout_percentage:') && workflow.includes('rollback_from_version:') && workflow.includes('buildmaster-update-beta'), 'Workflow possui rollout, beta e rollback');
check(exists('tests/v29-10-admin-security-regression.mjs') && exists('tests/v29-10-update-governance-regression.cjs') && exists('tests/v29-10-integrated-ui-regression.mjs'), 'Regressões próprias da v29.10 presentes');
check(read('src/lib/dataSafety.ts').includes("APP_DATA_VERSION = '29.10.0'") && read('src/lib/dataSafety.ts').includes("'performance'"), 'Backup v29.10 preserva desempenho, treinos e partidas');
check(exists('src/lib/professionalSquadEngine.ts') && read('src/lib/professionalSquadEngine.ts').includes("PROFESSIONAL_SQUAD_VERSION = '28.70.0'"), 'Motor profissional do elenco v28.70 presente');
check(exists('src/modules/squad/ProfessionalSquadPanel.tsx') && read('src/modules/squad/TeamFullMapPanel.tsx').includes('ProfessionalSquadPanel'), 'Central profissional integrada ao Meu Time');
check(exists('tests/v28-70-professional-squad-engine-regression.ts') && exists('tests/v28-70-professional-squad-ui-regression.mjs'), 'Regressões do Bloco 8 presentes');
check(exists('src/lib/safeLocalStorage.ts'), 'Armazenamento local protegido presente');
check(exists('src/lib/updateRouteHealth.ts'), 'Memória de saúde das rotas do atualizador presente');
check(nativeInstaller.includes('AtomicBoolean'), 'Atualizador bloqueia downloads concorrentes');
check(nativeInstaller.includes('DownloadManager') && nativeInstaller.includes('downloadWithSystemManager'), 'DownloadManager do Android é o transporte principal');
check(nativeInstaller.includes('downloadWithHttpStream'), 'Transporte HTTP permanece como reserva');
check(nativeInstaller.includes("Accept-Encoding",) && nativeInstaller.includes('identity'), 'Download do APK força bytes sem compressão intermediária');
check(nativeInstaller.includes('maxAttempts'), 'Tentativas nativas limitadas por rota');
check(nativeInstaller.includes('SHA-256'), 'APK é validado por SHA-256');
check(nativeInstaller.includes('signaturesCompatible'), 'Assinatura do APK é verificada');
check(workflow.includes(`Gerar APK v${expectedMinor}`), 'Workflow de APK acompanha a versão atual');
check(workflow.includes('permissions:\n  contents: write'), 'Workflow possui permissão de publicação');
check(workflow.includes('npm run quality:audit'), 'Auditoria automática executa no GitHub Actions');
check(workflow.includes('BuildMaster-Elite-Tatico-latest.apk'), 'Ponte para APKs antigos continua publicada');
check(workflow.includes('Validar release imutável publicamente'), 'Release pública é conferida antes da ativação');
check(workflow.includes("'mirrors'") && workflow.includes('immutable_url'), 'Manifestos publicam rota imutável e espelhos oficiais');
check(exists('src/lib/tacticalPoster.ts') && exists('src/components/TacticalPosterStudioPanel.tsx'), 'Estúdio Tático Local presente');
check(!exists('public/update-manifest.json'), 'Manifesto de produção não está empacotado dentro do APK');

const forbiddenExtensions = new Set(['.jks', '.keystore', '.p12', '.pfx', '.apk', '.aab']);
const projectFiles = [...walk('src'), ...walk('scripts'), ...walk('public'), ...walk('.github')];
const forbiddenFiles = projectFiles.filter((file) => forbiddenExtensions.has(path.extname(file).toLowerCase()));
check(forbiddenFiles.length === 0, 'Nenhum keystore, APK ou pacote privado incluído no código', forbiddenFiles.map((file) => path.relative(root, file)).join(', '));

const textFiles = projectFiles.filter((file) => /\.(?:ts|tsx|js|mjs|json|yml|yaml|css|html)$/i.test(file));
const privateKeyHits = [];
for (const file of textFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) privateKeyHits.push(path.relative(root, file));
}
check(privateKeyHits.length === 0, 'Nenhuma chave privada textual encontrada', privateKeyHits.join(', '));

const directStorage = sourceFiles
  .filter((file) => /\.(?:ts|tsx)$/.test(file))
  .flatMap((file) => fs.readFileSync(file, 'utf8').split('\n').map((line, index) => ({ file, line, index: index + 1 })))
  .filter((item) => item.line.includes('localStorage.') && !item.file.endsWith('safeLocalStorage.ts'));
check(directStorage.length === 0, 'Acesso direto ao localStorage foi centralizado', directStorage.slice(0, 8).map((item) => `${path.relative(root, item.file)}:${item.index}`).join(', '));

const typedSourceFiles = sourceFiles.filter((file) => /\.(?:ts|tsx)$/.test(file));
const explicitAnyHits = typedSourceFiles.flatMap((file) => fs.readFileSync(file, 'utf8').split('\n').map((line, index) => ({ file, line, index: index + 1 })))
  .filter((item) => /(?:\bas any\b|:\s*any\b|<any>)/.test(item.line));
check(explicitAnyHits.length === 0, 'Tipos explícitos any foram removidos do código-fonte', explicitAnyHits.slice(0, 8).map((item) => `${path.relative(root, item.file)}:${item.index}`).join(', '));

const unsafeDomHits = typedSourceFiles.flatMap((file) => fs.readFileSync(file, 'utf8').split('\n').map((line, index) => ({ file, line, index: index + 1 })))
  .filter((item) => /dangerouslySetInnerHTML|document\.write|\beval\s*\(|new Function\s*\(/.test(item.line));
check(unsafeDomHits.length === 0, 'Injeções diretas de HTML e execução dinâmica foram removidas', unsafeDomHits.slice(0, 8).map((item) => `${path.relative(root, item.file)}:${item.index}`).join(', '));

const dataSafety = read('src/lib/dataSafety.ts');
check(dataSafety.includes('FORBIDDEN_OBJECT_KEYS') && dataSafety.includes('__proto__'), 'Restauração de backup bloqueia chaves de poluição de protótipo');
check(dataSafety.includes('MAX_BACKUP_NODES') && dataSafety.includes('MAX_STRING_LENGTH'), 'Restauração de backup possui limites contra arquivos abusivos');

const lineStats = sourceFiles
  .filter((file) => /\.(?:ts|tsx|css)$/.test(file))
  .map((file) => ({ file: path.relative(root, file), lines: fs.readFileSync(file, 'utf8').split('\n').length }))
  .sort((a, b) => b.lines - a.lines);
for (const item of lineStats.filter((item) => item.lines > 2500).slice(0, 8)) {
  warnings.push(`${item.file} possui ${item.lines} linhas; dividir em módulos continua recomendado em uma versão maior.`);
}
if (sourceFiles.length < 50) warnings.push(`A contagem de arquivos-fonte parece baixa (${sourceFiles.length}).`);
if (testFiles.length < 50) warnings.push(`A cobertura de regressão parece baixa (${testFiles.length} arquivos).`);

console.log(`\nAUDITORIA AUTOMÁTICA BUILDMASTER v${expectedVersion}`);
console.log(`✓ ${passes.length} verificações aprovadas`);
for (const label of passes) console.log(`  ✓ ${label}`);
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} alertas estruturais`);
  for (const warning of warnings) console.log(`  ⚠ ${warning}`);
}
if (failures.length) {
  console.error(`\n✗ ${failures.length} falhas obrigatórias`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log('\nAuditoria obrigatória aprovada.');
