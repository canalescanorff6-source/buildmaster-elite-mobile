import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const stripComments = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const auth = read('src/components/AuthGate.tsx');
const card = read('src/components/CardVisionApp.tsx');
const boundary = read('src/components/AppShellSafetyBoundaryV3930.tsx');
const routeError = read('src/app/error.tsx');
const globalError = read('src/app/global-error.tsx');
const page = read('src/app/page.tsx');
const loginPage = read('src/app/login/page.tsx');
const cache = read('src/lib/nativeWebCacheRecoveryV3840.ts');
const register = read('src/components/RegisterServiceWorker.tsx');
const resilience = read('src/lib/startupResilienceV3840.ts');
const history = read('src/modules/vault/cardHistoryStore.ts');
const nativeVault = read('src/lib/nativeVaultStorage.ts');
const nativeInstaller = read('scripts/install-native-vault-storage-plugin.mjs');
const featureFlag = read('src/modules/observability/useObservabilityFeatureFlag.ts');

assert.match(auth, /const \[ready, setReady\] = useState\(false\)/, 'AuthGate deve hidratar com estado determinístico.');
assert.match(auth, /function readCachedSnapshot\(\)/, 'Snapshot da conta deve ser lido somente depois da montagem.');
assert.match(auth, /Promise\.race\(\[/, 'Restauração de licença precisa ter timeout.');
assert.match(auth, /if \(cached && mounted\)[\s\S]*setReady\(true\)/, 'Sessão local válida deve abrir sem esperar a rede.');
assert.ok(auth.indexOf('safeStorageGet(FIRST_SECURE_BOOT_KEY)') > auth.indexOf('useEffect(() => {'), 'Storage da conta não pode ser lido no render inicial.');

assert.match(page, /<AppShellSafetyBoundaryV3930>/, 'A rota principal deve estar protegida.');
assert.match(loginPage, /<AppShellSafetyBoundaryV3930>/, 'A rota /login também deve estar protegida.');
assert.match(boundary, /activateStartupSafeModeV3840/, 'Boundary deve ativar modo seguro de sessão.');
assert.match(boundary, /key=\{`buildmaster-shell-\$\{this\.state\.attempt\}`\}/, 'Recuperação deve remontar em processo.');
assert.doesNotMatch(stripComments(boundary), /window\.location\.(?:replace|reload)\s*\(/, 'Boundary não pode recarregar o WebView.');

assert.match(card, /const \[startupGate, setStartupGate\] = useState\(\{ ready: false, safeMode: false \}\)/, 'App precisa de portão de startup hidratável.');
assert.match(card, /if \(!startupGateReady\) return/, 'Efeitos persistentes devem aguardar o portão de startup.');
assert.match(card, /loadHistoryStoreForStartup\(\)/, 'Cofre deve usar carregamento limitado na abertura.');
assert.match(card, /nativeDeferredBytes === 0/, 'Cofre nativo adiado não pode ser sobrescrito por fallback vazio.');
assert.match(card, /const renderHistory = useMemo\([\s\S]*normalizeHistoryList\(history\)/, 'Dados renderizados devem ser normalizados.');
assert.match(card, /if \(!sessionHydrated \|\| startupSafeMode\) return;[\s\S]*const hasWork/, 'Autosave não pode apagar sessão antes da hidratação.');
assert.match(card, /const \[vaultTrash, setVaultTrash\] = useState<VaultTrashItem<SavedAnalysis>\[]>\(\[\]\)/, 'Lixeira não deve ser lida no render inicial.');
assert.match(card, /const \[mainSection, setMainSection\] = useState<MainSection>\('inicio'\)/, 'Rota inicial deve ser determinística.');
assert.match(card, /safeViewComputation\('history-render-sanitizer'/, 'Falhas de dados devem ser isoladas por área.');

assert.match(history, /STARTUP_NATIVE_HISTORY_MAX_BYTES = 32 \* 1024 \* 1024/, 'Leitura nativa deve ter limite de startup.');
assert.match(history, /nativeVaultInfo\(storageKey\)/, 'Tamanho deve ser consultado antes da leitura.');
assert.match(history, /onNativeDeferred/, 'Arquivo grande deve ser adiado, não apagado.');
assert.match(nativeVault, /read\(options: \{ key: string; maxBytes\?: number \}\)/, 'Bridge nativa deve aceitar limite de leitura.');
assert.ok(nativeInstaller.indexOf('target.length() > maxBytes') < nativeInstaller.indexOf('new ByteArrayOutputStream'), 'Java deve bloquear arquivo grande antes de alocar memória.');
assert.match(nativeInstaller, /String key = call\.getString\("key"\)/, 'Info nativa deve aceitar chave específica.');

assert.match(resilience, /window\.sessionStorage/, 'Modo seguro deve existir somente na sessão.');
assert.match(resilience, /clearTransientRuntimeV3930/, 'Modo seguro deve limpar apenas dados temporários.');
assert.doesNotMatch(stripComments(resilience), /localStorage\.clear\s*\(|removeAccountStorage\s*\(/, 'Modo seguro não pode apagar Cofre ou preferências permanentes.');

assert.doesNotMatch(stripComments(routeError), /window\.location\.(?:replace|reload)\s*\(/, 'Erro de rota não pode reiniciar o WebView.');
assert.doesNotMatch(stripComments(globalError), /window\.location\.(?:replace|reload)\s*\(/, 'Erro global não pode reiniciar o WebView.');
assert.match(routeError, /activateStartupSafeModeV3840\(error\)/, 'Erro de rota deve ativar modo seguro antes do reset.');
assert.match(globalError, /activateStartupSafeModeV3840\(error\)/, 'Erro global deve ativar modo seguro antes do reset.');
assert.doesNotMatch(stripComments(cache), /window\.location\.(?:replace|reload)\s*\(/, 'Limpeza de cache JavaScript não pode provocar segundo reload.');
assert.match(cache, /40\.10\.0-progress-runtime-1/, 'Schema de cache precisa invalidar builds antigos.');
assert.match(register, /refreshNativeWebRuntimeOnceV3840\('new-build'\)/, 'Registro deve manter a limpeza por build.');
assert.match(featureFlag, /const \[enabled, setEnabled\] = useState\(false\)/, 'Feature flag deve hidratar de forma determinística.');

console.log('v38.40 fail-open aprovada: hidratação determinística, login não bloqueante, Cofre limitado, modo seguro em processo e nenhum ciclo de reload.');
