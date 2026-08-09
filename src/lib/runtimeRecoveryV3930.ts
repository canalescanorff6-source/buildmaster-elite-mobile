import { safeStorageRemove } from './safeLocalStorage';
import { clearPremiumCreationDraft } from '@/modules/experience/cardVisionPremiumBridge';
import { clearUnifiedCreationDraft } from './unifiedCreationFlowV3790';

export const V3930_RECOVERY_MARKER = 'buildmaster_v3930_auto_recovery_attempted';

const TRANSIENT_KEYS = [
  'buildmaster_active_session_v24_29_regras_atualizaveis',
  'buildmaster_current_scan_v27',
  'buildmaster_scan_checkpoint_v38_40',
  'buildmaster_pending_analysis_v38_40',
  'buildmaster_result_workspace_draft_v38_10'
] as const;

function removeFromSessionStorage(key: string) {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.removeItem(key); } catch {}
}

/**
 * Remove somente estado transitório capaz de quebrar a abertura após uma atualização.
 * Cofre, jogadores, receitas canônicas, elenco mapeado e backups não entram nesta lista.
 */
export function clearTransientRuntimeV3930(): void {
  for (const key of TRANSIENT_KEYS) {
    safeStorageRemove(key);
    removeFromSessionStorage(key);
  }
  try { clearPremiumCreationDraft(); } catch {}
  try { clearUnifiedCreationDraft(); } catch {}
}

export function clearRecoveryMarkerV3930(): void {
  removeFromSessionStorage(V3930_RECOVERY_MARKER);
}

export function cleanRecoveryQueryV3930(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('recuperacao')) return;
    url.searchParams.delete('recuperacao');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {}
}
