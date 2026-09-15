import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const actions = fs.readFileSync('src/hooks/useCardVisionVaultActionsR185.ts', 'utf8');
const navigation = fs.readFileSync('src/hooks/useCardVisionNavigationControllerR176.ts', 'utf8');
const runtime = fs.readFileSync('src/modules/vault/vaultDeferredRuntimeR169.ts', 'utf8');
const note = fs.readFileSync('src/modules/vault/vaultNoteMutationR169.ts', 'utf8');
const mutations = fs.readFileSync('src/modules/vault/vaultHistoryMutationsR129.ts', 'utf8');

for (const source of [app, actions]) {
  for (const forbidden of ['@/modules/vault/vaultProductionLifecycleR139', '@/modules/vault/vaultHistoryMutationsR129']) {
    const escaped = forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.doesNotMatch(source, new RegExp(`^\\s*import\\s+(?!type\\b)[^\\n]+from ['\"]${escaped}['\"]`, 'm'));
  }
}

assert.match(actions, /from ['"]@\/modules\/vault\/vaultNoteMutationR169['"]/);
assert.match(actions, /loadVaultDeferredRuntimeR169/);
assert.match(actions, /preloadVaultDeferredRuntimeR169/);
assert.match(navigation, /section === 'cofre' \|\| section === 'resultado'\) preloadVaultDeferredRuntimeR169\(\)/);
assert.match(runtime, /runtimePromise/);
assert.match(runtime, /import\(['"]\.\/vaultProductionLifecycleR139['"]\)/);
assert.match(runtime, /import\(['"]\.\/vaultHistoryMutationsR129['"]\)/);
assert.match(mutations, /export \{ updateHistoryNotesR129 \} from ['"]\.\/vaultNoteMutationR169['"]/);
assert.match(note, /export function updateHistoryNotesR129/);

assert.match(actions, /restoreHistory[\s\S]*?loadVaultDeferredRuntimeR169\(\)[\s\S]*?prepareVaultOpenR139[\s\S]*?runCanonicalVaultMutationR153/);
assert.match(actions, /saveCurrentFicha[\s\S]*?loadVaultDeferredRuntimeR169\(\)[\s\S]*?prepareVaultSaveR139[\s\S]*?runCanonicalVaultMutationR153/);
assert.match(actions, /toggleSavedSkill[\s\S]*?loadVaultDeferredRuntimeR169\(\)[\s\S]*?prepareVaultSkillToggleR139[\s\S]*?runCanonicalVaultMutationR153/);
assert.match(actions, /moveHistoryToFolder[\s\S]*?const \{ mutations \} = await loadVaultDeferredRuntimeR169\(\)/);

const hasAutonomousBatchLifecycleR417 = actions.includes('async function batchHistoryR417');
if (hasAutonomousBatchLifecycleR417) {
  assert.doesNotMatch(actions, /async function removeHistoryEntryAfterDelete/);
  assert.match(actions, /batchHistoryR417[\s\S]*?const \{ mutations \} = await loadVaultDeferredRuntimeR169\(\)/);
  assert.match(actions, /moveHistoryItemToTrash\(id: string\)[\s\S]*?batchHistoryR417\('trash', \[id\]\)/);
  assert.match(actions, /permanentlyDeleteHistoryItem\(id: string\)[\s\S]*?batchHistoryR417\('delete', \[id\]\)/);
} else {
  assert.match(actions, /removeHistoryEntryAfterDelete[\s\S]*?const \{ mutations \} = await loadVaultDeferredRuntimeR169\(\)/);
  assert.match(actions, /moveHistoryItemToTrash[\s\S]*?removeHistoryEntryAfterDelete\(item\)/);
  assert.match(actions, /permanentlyDeleteHistoryItem[\s\S]*?removeHistoryEntryAfterDelete\(item\)/);
}

assert.match(actions, /function updateHistoryNotes[\s\S]*?updateHistoryNotesR129\(renderHistory, id, notes\)/);
console.log(`R169 aprovada dentro da boundary R185 (${hasAutonomousBatchLifecycleR417 ? 'R417 autônoma' : 'legacy compatível'}).`);
