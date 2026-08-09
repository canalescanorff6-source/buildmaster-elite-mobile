import assert from 'node:assert/strict';
import fs from 'node:fs';

const boundary = fs.readFileSync('src/components/AppShellSafetyBoundaryV3930.tsx', 'utf8');
const recovery = fs.readFileSync('src/lib/runtimeRecoveryV3930.ts', 'utf8');
const page = fs.readFileSync('src/app/page.tsx', 'utf8');
const errorPage = fs.readFileSync('src/app/error.tsx', 'utf8');
const globalError = fs.readFileSync('src/app/global-error.tsx', 'utf8');
const panel = fs.readFileSync('src/components/UnifiedPerformanceV3920Panel.tsx', 'utf8');
const safeStorage = fs.readFileSync('src/lib/safeLocalStorage.ts', 'utf8');
const vaultTrash = fs.readFileSync('src/lib/vaultTrash.ts', 'utf8');

assert.match(page, /AppShellSafetyBoundaryV3930/);
assert.match(page, /<AppShellSafetyBoundaryV3930>[\s\S]*<AuthGate>[\s\S]*<CardVisionApp \/>/);
assert.match(boundary, /clearTransientRuntimeV3930/);
assert.match(boundary, /componentDidMount/);
assert.match(boundary, /if \(this\.state\.failed\) return/);
assert.match(boundary, /setTimeout/);
assert.match(boundary, /window\.location\.replace/);
assert.match(recovery, /buildmaster_active_session_v24_29_regras_atualizaveis/);
assert.match(recovery, /buildmaster_scan_checkpoint_v38_40/);
assert.match(recovery, /clearPremiumCreationDraft/);
assert.match(recovery, /clearUnifiedCreationDraft/);
assert.match(recovery, /Cofre, jogadores, receitas canônicas, elenco mapeado e backups não entram nesta lista/);
assert.doesNotMatch(recovery, /buildmaster_saved_players|buildmaster_vault|buildmaster_squad_mapping/i);
assert.match(errorPage, /Abrir em modo seguro/);
assert.match(errorPage, /Cofre e os jogadores salvos não serão apagados/);
assert.match(globalError, /clearTransientRuntimeV3930/);
assert.match(globalError, /jogadores e backups permanecem salvos/);
assert.match(panel, /safeArray/);
assert.match(panel, /Motor Adaptativo por Carta v39\.30/);
assert.match(safeStorage, /hasCompatibleJsonShape/);
assert.match(safeStorage, /Array\.isArray\(fallback\)/);
assert.match(safeStorage, /Formato JSON incompatível/);
assert.match(vaultTrash, /normalizeVaultTrashItem/);
assert.match(vaultTrash, /safeStorageGetJson<unknown\[\]>/);
assert.match(vaultTrash, /Object\.prototype\.hasOwnProperty\.call\(source, 'payload'\)/);

console.log('v39.30 recuperação de runtime aprovada: shell protegido, JSON legado neutralizado, lixeira saneada e Cofre preservado.');
