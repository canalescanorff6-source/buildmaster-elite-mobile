'use client';

import { useEffect, useState } from 'react';
import { Database, X } from 'lucide-react';
import { STORAGE_FAILURE_EVENT, type StorageFailure } from '@/lib/safeLocalStorage';
import { recordSafeRuntimeError } from '@/lib/safeDiagnostics';

type RuntimeAlert = { kind: 'storage'; message: string; detail: string };

export function AppRuntimeStatus() {
  const [storageAlert, setStorageAlert] = useState<RuntimeAlert | null>(null);

  useEffect(() => {
    const onStorageFailure = (event: Event) => {
      const detail = (event as CustomEvent<StorageFailure>).detail;
      setStorageAlert({
        kind: 'storage',
        message: 'O aparelho bloqueou ou ficou sem espaço para salvar uma preferência.',
        detail: `${detail.operation} • ${detail.key}`
      });
    };
    const onWindowError = (event: ErrorEvent) => {
      void recordSafeRuntimeError({ area: 'window', code: 'unhandled-error', message: event.message || 'Erro global sem mensagem.' });
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || 'Promise rejeitada sem mensagem.');
      void recordSafeRuntimeError({ area: 'window', code: 'unhandled-rejection', message: reason });
    };

    window.addEventListener(STORAGE_FAILURE_EVENT, onStorageFailure);
    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener(STORAGE_FAILURE_EVENT, onStorageFailure);
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  if (!storageAlert) return null;
  return (
    <aside className="app-runtime-status runtime-storage" role="status" aria-live="polite">
      <Database size={18} />
      <div>
        <strong>Armazenamento com atenção</strong>
        <span>{storageAlert.message}</span>
        <small>{storageAlert.detail}</small>
      </div>
      <button type="button" onClick={() => setStorageAlert(null)} aria-label="Fechar aviso"><X size={16} /></button>
    </aside>
  );
}
