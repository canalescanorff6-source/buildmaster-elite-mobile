import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const controller = fs.readFileSync('src/modules/backup/useCardVisionBackupControllerR162.ts', 'utf8');
const runtime = fs.readFileSync('src/modules/backup/cardVisionBackupRuntimeR162.ts', 'utf8');

assert.match(app, /useCardVisionBackupControllerR162/, 'CardVisionApp deve delegar Backup/Sync ao controlador R162.');
assert.ok(app.split(/\r?\n/).length <= 3500, 'R162 deve manter CardVisionApp abaixo de 3.500 linhas.');

for (const legacyAction of [
  'async function exportFullBackup',
  'async function syncFullCloudBackup',
  'async function pullAndMergeFullCloudBackup',
  'async function importFullBackup',
  'async function restoreBackupSnapshot',
]) {
  assert.ok(!app.includes(legacyAction), `CardVisionApp não deve voltar a possuir ${legacyAction}.`);
}

const forbiddenControllerRuntimeImports = [
  '@/lib/backupCrypto',
  '@/lib/accountAuth',
  '@/lib/secureStorage',
  '@/modules/backup/backupSectionCollectorR141',
  '@/modules/backup/backupSnapshotRepositoryR141',
  '@/modules/vault/vaultPersistenceCoordinatorR140',
  '@/modules/vault/vaultCloudQueueR128',
];
for (const target of forbiddenControllerRuntimeImports) {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.doesNotMatch(
    controller,
    new RegExp(`^\\s*import\\s+(?!type\\b)[^\\n]+from ['\"]${escaped}['\"]`, 'm'),
    `Controlador R162 não pode carregar ${target} estaticamente.`
  );
}

assert.match(controller, /import\('\.\/cardVisionBackupRuntimeR162'\)/, 'Runtime pesado de backup deve ser carregado por import dinâmico.');
assert.doesNotMatch(controller, /^\s*import\s+(?!type\b)[^\n]+cardVisionBackupRuntimeR162/m, 'Runtime R162 não pode voltar a import estático.');
assert.match(controller, /if \(!backupSettingsActive\) return;[\s\S]*readCardVisionBackupBootstrapR162/, 'Bootstrap pesado deve acontecer somente quando Backup estiver ativo.');

assert.match(runtime, /CARDVISION_BACKUP_RUNTIME_R162_VERSION/, 'Runtime R162 precisa de versão explícita.');
assert.match(runtime, /commitCriticalVaultRestoreR140/, 'Restauração crítica R140 deve permanecer autoridade única.');
assert.match(runtime, /runSerializedVaultCloudMutationR128/, 'Fila serializada R128 deve continuar protegendo sync cloud.');
assert.match(runtime, /runGuardedVaultActionR154/, 'Guard R154 deve continuar envolvendo ações de nuvem.');
assert.match(runtime, /createBackupSnapshot\(current, 'Antes de/, 'Operações destrutivas devem preservar snapshot anterior.');
assert.match(runtime, /session:\s*false/, 'Restauração padrão deve continuar sem sessão ativa.');
assert.match(runtime, /persistAndAdoptVaultHistoryR140/, 'Importação do Cofre deve continuar usando writer canônico R140.');
assert.doesNotMatch(app, /commitCriticalVaultRestoreR140|runSerializedVaultCloudMutationR128/, 'CardVisionApp não pode duplicar writers/transações do runtime.');

console.log('R162 aprovada: Backup/Sync saiu do monólito e o runtime pesado ficou sob demanda sem duplicar writers R140/R128/R154.');
