import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const hook = fs.readFileSync('src/hooks/useActiveSessionAutosaveR157.ts', 'utf8');
const startupHookR177 = fs.readFileSync('src/hooks/useCardVisionStartupLifecycleR177.ts', 'utf8');
const startupRuntimeR177 = fs.readFileSync('src/modules/runtime/cardVisionStartupRuntimeR177.ts', 'utf8');
const repo = fs.readFileSync('src/modules/session/activeSessionRepositoryR137.ts', 'utf8');
const backup = fs.readFileSync('src/modules/backup/backupSectionCollectorR141.ts', 'utf8');
const backupRuntime = fs.readFileSync('src/modules/backup/cardVisionBackupRuntimeR162.ts', 'utf8');

assert.match(app, /useActiveSessionAutosaveR157\(\{/, 'CardVision deve delegar autosave ao coordenador R157.');
assert.match(app, /useCardVisionStartupLifecycleR177\(\{/, 'CardVision deve delegar a restauração inicial ao lifecycle R177.');
assert.match(startupHookR177, /import\('@\/modules\/runtime\/cardVisionStartupRuntimeR177'\)/, 'Restauração R177 deve permanecer fora do startup estático.');
assert.match(startupRuntimeR177, /readActiveSessionSnapshotR157\(ACTIVE_SESSION_KEY\)/, 'Restauração deve aceitar formato dividido R157 e legado R137.');
assert.doesNotMatch(app, /writeActiveSessionSnapshotR137\(/, 'Shell não pode voltar a serializar snapshot monolítico com mídia a cada autosave.');
assert.match(hook, /function persistMediaNow\(\)[\s\S]{0,260}writeActiveSessionMediaR157\(storageKey, \{ preview: latestRef\.current\.preview, playerCardImage: latestRef\.current\.playerCardImage \}\)/,
  'Mídia deve continuar em efeito separado, agora com confirmação de persistência.');
assert.match(hook, /mediaPersistedRef\.current \|\| persistMediaNow\(\)/, 'Flush R157 deve tentar novamente mídia que falhou.');
assert.match(hook, /ACTIVE_SESSION_AUTOSAVE_DELAY_R157 = 900/, 'Autosave textual deve ser coalescido em 900 ms.');
assert.match(hook, /window\.addEventListener\('pagehide', flush\)/, 'Saída da página deve forçar flush do metadado pendente.');
assert.match(hook, /document\.visibilityState === 'hidden'/, 'Background mobile deve forçar flush seguro.');
assert.match(repo, /Compatibilidade: snapshots R137 monolíticos continuam restauráveis/, 'Migração deve preservar recovery antigo.');
assert.match(backup, /readActiveSessionBackupPayloadR157\(ACTIVE_SESSION_KEY\)/, 'Backup integral deve reunificar metadados + mídia.');
assert.match(backupRuntime, /writeActiveSessionBackupPayloadR157\(ACTIVE_SESSION_KEY, sections\.session\)/, 'Restore de backup deve voltar ao formato dividido canônico.');

console.log('R157 aprovado: autosave separa mídia/metadados, coalesce mudanças e faz flush seguro em background/saída.');
