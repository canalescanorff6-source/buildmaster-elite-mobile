'use client';

import { useEffect, useState } from 'react';
import { Database, X } from 'lucide-react';
import { STORAGE_FAILURE_EVENT, type StorageFailure } from '@/lib/safeLocalStorage';
import { recordSafeRuntimeError } from '@/lib/safeDiagnostics';

type RuntimeAlert = { kind: 'storage'; message: string; detail: string };

export function AppRuntimeStatus() {
  const [storageAlert, setStorageAlert] = useState<RuntimeAlert | null>(null);

  useEffect(() => {
    let dismissTimer = 0;
    const onStorageFailure = (event: Event) => {
      const detail = (event as CustomEvent<StorageFailure>).detail;
      // Leituras e limpezas antigas não significam perda de ficha. O Cofre do APK
      // usa um arquivo nativo próprio e não depende da pequena cota das preferências web.
      if (!detail || detail.operation !== 'write') return;
      setStorageAlert({
        kind: 'storage',
        message: 'Uma preferência secundária não pôde ser gravada. As fichas continuam protegidas na memória interna do app.',
        detail: detail.reason || detail.key
      });
      window.clearTimeout(dismissTimer);
      dismissTimer = window.setTimeout(() => setStorageAlert(null), 8000);
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
      window.clearTimeout(dismissTimer);
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
        <strong>Preferência não gravada</strong>
        <span>{storageAlert.message}</span>
        <small>{storageAlert.detail}</small>
      </div>
      <button type="button" onClick={() => setStorageAlert(null)} aria-label="Fechar aviso"><X size={16} /></button>
    </aside>
  );
}
