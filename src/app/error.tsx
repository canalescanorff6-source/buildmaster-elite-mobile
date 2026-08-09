'use client';

import { useEffect } from 'react';
import { AlertTriangle, ArrowLeft, RotateCcw, ShieldCheck } from 'lucide-react';
import { CURRENT_BUILD_ID } from '@/lib/appUpdates';
import {
  clearNativeWebCachesV3840,
  markNativeCacheSchemaCurrentV3840,
  refreshNativeWebRuntimeOnceV3840
} from '@/lib/nativeWebCacheRecoveryV3840';
import { clearRecoveryMarkerV3930, clearTransientRuntimeV3930 } from '@/lib/runtimeRecoveryV3930';

const AUTO_RESET_KEY = `buildmaster:route-auto-reset:${CURRENT_BUILD_ID}`;

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    let active = true;
    console.error('Erro recuperável no BuildMaster:', error);

    void (async () => {
      const reloading = await refreshNativeWebRuntimeOnceV3840('route-error');
      if (!active || reloading) return;

      try {
        if (window.sessionStorage.getItem(AUTO_RESET_KEY) === '1') return;
        window.sessionStorage.setItem(AUTO_RESET_KEY, '1');
      } catch {
        // O reset protegido ainda pode ser executado sem sessionStorage.
      }

      clearTransientRuntimeV3930();
      clearRecoveryMarkerV3930();
      reset();
    })();

    return () => {
      active = false;
    };
  }, [error, reset]);

  async function openSafeMode() {
    clearTransientRuntimeV3930();
    clearRecoveryMarkerV3930();
    await clearNativeWebCachesV3840();
    markNativeCacheSchemaCurrentV3840();
    const url = new URL('/', window.location.href);
    url.searchParams.set('recuperacao', 'manual');
    url.searchParams.set('bm_cache_refresh', `${CURRENT_BUILD_ID.slice(0, 12)}-manual-${Date.now()}`);
    window.location.replace(url.toString());
  }

  return (
    <main className="bm-recovery-screen">
      <section className="bm-recovery-card" role="alert">
        <div className="bm-recovery-symbol"><AlertTriangle size={26} /></div>
        <p className="kicker"><ShieldCheck size={14} /> Recuperação protegida</p>
        <h1 style={{ color: '#101827' }}>Esta área não conseguiu abrir</h1>
        <p>O app tentará reparar automaticamente a sessão e o cache da atualização. Seus jogadores, fichas e arquivos foram preservados; o Cofre e os jogadores salvos não serão apagados.</p>
        <div className="bm-recovery-actions">
          <button type="button" className="primary" onClick={reset}><RotateCcw size={17} /> Tentar novamente</button>
          <button type="button" className="secondary" onClick={() => history.back()}><ArrowLeft size={17} /> Voltar</button>
          <button type="button" className="danger" onClick={() => { void openSafeMode(); }}>Abrir em modo seguro</button>
        </div>
        {error.digest && <p style={{ opacity: .6, fontSize: 12, marginTop: 18 }}>Código técnico: {error.digest}</p>}
      </section>
    </main>
  );
}
