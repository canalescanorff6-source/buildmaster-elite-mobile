'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Database, WifiOff, X } from 'lucide-react';
import { STORAGE_FAILURE_EVENT, type StorageFailure } from '@/lib/safeLocalStorage';
import { recordSafeRuntimeError } from '@/lib/safeDiagnostics';

type RuntimeAlert =
  | { kind: 'offline'; message: string }
  | { kind: 'storage'; message: string; detail: string };

export function AppRuntimeStatus() {
  const [offline, setOffline] = useState(false);
  const [storageAlert, setStorageAlert] = useState<RuntimeAlert | null>(null);

  useEffect(() => {
    const updateNetwork = () => setOffline(!navigator.onLine);
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

    updateNetwork();
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    window.addEventListener(STORAGE_FAILURE_EVENT, onStorageFailure);
    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
      window.removeEventListener(STORAGE_FAILURE_EVENT, onStorageFailure);
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  const alert: RuntimeAlert | null = offline
    ? { kind: 'offline', message: 'Sem internet. Fichas locais continuam disponíveis; login em nuvem e atualização aguardam reconexão.' }
    : storageAlert;

  if (!alert) return null;
  return (
    <aside className={`app-runtime-status runtime-${alert.kind}`} role="status" aria-live="polite">
      {alert.kind === 'offline' ? <WifiOff size={18} /> : <Database size={18} />}
      <div>
        <strong>{alert.kind === 'offline' ? 'Modo offline' : 'Armazenamento com atenção'}</strong>
        <span>{alert.message}</span>
        {'detail' in alert && <small>{alert.detail}</small>}
      </div>
      {alert.kind === 'storage' && (
        <button type="button" onClick={() => setStorageAlert(null)} aria-label="Fechar aviso"><X size={16} /></button>
      )}
      {alert.kind === 'offline' && <AlertTriangle size={16} aria-hidden="true" />}
    </aside>
  );
}
