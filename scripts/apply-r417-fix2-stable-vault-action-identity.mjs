import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const R417_FIX2_STABLE_VAULT_ACTION_IDENTITY_VERSION =
  '40.80-r417-fix2-stable-vault-action-identity-v1';

const ACTIONS = 'src/hooks/useCardVisionVaultActionsR185.ts';

function buildStableBatchHistoryR417() {
  return [
    "  async function batchHistoryR417(action: 'archive'|'unarchive'|'trash'|'restore'|'delete', ids: string[]) {",
    "    const stableIds = [...new Set(ids)].filter(Boolean).sort();",
    "    if (!stableIds.length) return;",
    "    if (action === 'delete' && typeof window !== 'undefined' && !window.confirm(`Excluir definitivamente ${stableIds.length} ficha(s)?`)) return;",
    "    const { mutations } = await loadVaultDeferredRuntimeR169();",
    "    const folder = action === 'archive' ? 'arquivados' : action === 'trash' ? 'lixeira' : 'all';",
    "    const mutate = (current: SavedAnalysis[]) => action === 'delete' ? mutations.batchRemoveHistoryR417(current, stableIds) : mutations.batchMoveHistoryFolderR417(current, stableIds, folder, action, `${stableIds.length} ficha(s)`);",
    "    const actionKey = action === 'delete' && stableIds.length === 1",
    "      ? `delete:${stableIds[0]}`",
    "      : `batch:${action}:${stableIds.join('|')}`;",
    "    const committed = await persistAndAdoptVaultHistoryR140(mutate(renderHistory), 'A operação em lote não foi confirmada.', mutate, { key: actionKey, label: `${action} ${stableIds.length} ficha(s)` });",
    "    if (!committed) return;",
    "    if (action === 'delete') { for (const id of stableIds) removeFromVaultTrash(id); setVaultTrash(readVaultTrash<SavedAnalysis>()); }",
    "    void pushCloudHistory(committed, true); setPendingDeleteHistoryId(null); setStatus(`${stableIds.length} ficha(s): ${action}.`);",
    "  }",
  ].join('\n');
}

export function applyR417Fix2StableVaultActionIdentity(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const actionsPath = resolve(root, ACTIONS);

  if (!existsSync(actionsPath)) {
    throw new Error(`R417-fix2: arquivo obrigatório ausente: ${ACTIONS}`);
  }

  const source = readFileSync(actionsPath, 'utf8');
  const stableMarker = "const stableIds = [...new Set(ids)].filter(Boolean).sort();";

  if (source.includes(stableMarker)) {
    if (source.includes('`batch:${action}:${ids.length}`')) {
      throw new Error('R417-fix2: identidade antiga por quantidade coexistindo com a identidade estável.');
    }
    return { changed: false, deferred: false, alreadyStable: true };
  }

  const startMarker = "  async function batchHistoryR417(action: 'archive'|'unarchive'|'trash'|'restore'|'delete', ids: string[]) {";
  const endMarker = "\n\n  async function moveHistoryItemToTrash";

  const start = source.indexOf(startMarker);
  if (start < 0) {
    return { changed: false, deferred: true, alreadyStable: false };
  }

  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end < 0) {
    throw new Error('R417-fix2: fim do batchHistoryR417 não encontrado.');
  }

  const currentBlock = source.slice(start, end);
  const requiredLegacyFragments = [
    "if (!ids.length) return;",
    "mutations.batchRemoveHistoryR417(current, ids)",
    "mutations.batchMoveHistoryFolderR417(current, ids, folder, action, `${ids.length} ficha(s)`)",
    "{ key: `batch:${action}:${ids.length}`, label: `${action} ${ids.length} ficha(s)` }",
    "for (const id of ids)",
  ];

  for (const fragment of requiredLegacyFragments) {
    if (!currentBlock.includes(fragment)) {
      throw new Error(`R417-fix2: contrato legado inesperado no batchHistoryR417: ${fragment}`);
    }
  }

  const replacement = buildStableBatchHistoryR417();
  const next = source.slice(0, start) + replacement + source.slice(end);

  if (!next.includes(stableMarker)) {
    throw new Error('R417-fix2: identidade estável não foi materializada.');
  }
  if (next.includes('`batch:${action}:${ids.length}`')) {
    throw new Error('R417-fix2: identidade antiga por quantidade permaneceu no código.');
  }
  if (!next.includes('`delete:${stableIds[0]}`')) {
    throw new Error('R417-fix2: exclusão individual perdeu a chave semântica por jogador.');
  }
  if (!next.includes("`batch:${action}:${stableIds.join('|')}`")) {
    throw new Error('R417-fix2: lote não usa os IDs reais como identidade.');
  }

  writeFileSync(actionsPath, next, 'utf8');
  return { changed: true, deferred: false, alreadyStable: false };
}

const invoked = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR417Fix2StableVaultActionIdentity();
  console.log(
    result.deferred
      ? 'R417-fix2: aguardando materialização R417.'
      : result.changed
        ? 'R417-fix2: identidade das ações do Cofre estabilizada por IDs.'
        : 'R417-fix2: identidade estável já estava aplicada.',
  );
}
