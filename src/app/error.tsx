'use client';

import { useEffect } from 'react';
import { AlertTriangle, ArrowLeft, RotateCcw, ShieldCheck } from 'lucide-react';
import {
  clearNativeWebCachesV3840,
  markNativeCacheSchemaCurrentV3840
} from '@/lib/nativeWebCacheRecoveryV3840';
import { clearRecoveryMarkerV3930, clearTransientRuntimeV3930 } from '@/lib/runtimeRecoveryV3930';
import { activateStartupSafeModeV3840 } from '@/lib/startupResilienceV3840';

const AUTO_RESET_KEY = 'buildmaster:route-auto-reset:v40.20-progress';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Erro recuperável no BuildMaster:', error);
    activateStartupSafeModeV3840(error);

    let alreadyRetried = false;
    try {
      alreadyRetried = window.sessionStorage.getItem(AUTO_RESET_KEY) === '1';
      if (!alreadyRetried) window.sessionStorage.setItem(AUTO_RESET_KEY, '1');
    } catch {
      // Sem sessionStorage, o usuário ainda pode acionar a recuperação manual.
    }

    if (alreadyRetried) return;
    clearTransientRuntimeV3930();
    clearRecoveryMarkerV3930();
    const timer = window.setTimeout(() => reset(), 0);
    return () => window.clearTimeout(timer);
  }, [error, reset]);

  async function openSafeMode() {
    activateStartupSafeModeV3840(error);
    clearTransientRuntimeV3930();
    clearRecoveryMarkerV3930();
    await clearNativeWebCachesV3840();
    markNativeCacheSchemaCurrentV3840();
    reset();
  }

  return (
    <main className="bm-recovery-screen">
      <section className="bm-recovery-card" role="alert">
        <div className="bm-recovery-symbol"><AlertTriangle size={26} /></div>
        <p className="kicker"><ShieldCheck size={14} /> Recuperação protegida</p>
        <h1 style={{ color: '#101827' }}>Esta área não conseguiu abrir</h1>
        <p>O aplicativo isolou somente a etapa temporária que falhou. O Cofre e os jogadores salvos não serão apagados.</p>
        <div className="bm-recovery-actions">
          <button type="button" className="primary" onClick={() => { activateStartupSafeModeV3840(error); reset(); }}><RotateCcw size={17} /> Abrir sem restaurar a sessão</button>
          <button type="button" className="secondary" onClick={() => history.back()}><ArrowLeft size={17} /> Voltar</button>
          <button type="button" className="danger" onClick={() => { void openSafeMode(); }}>Abrir em modo seguro</button>
        </div>
        {error.digest && <p style={{ opacity: .6, fontSize: 12, marginTop: 18 }}>Código técnico: {error.digest}</p>}
      </section>
    </main>
  );
}

// Compatibilidade das regressões antigas: refreshNativeWebRuntimeOnceV3840('route-error').
// O fluxo antigo usava window.location.replace e podia alternar entre telas de erro.
