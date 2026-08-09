'use client';

import { useEffect } from 'react';
import { AlertTriangle, ArrowLeft, RotateCcw, ShieldCheck } from 'lucide-react';
import { clearRecoveryMarkerV3930, clearTransientRuntimeV3930 } from '@/lib/runtimeRecoveryV3930';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Erro recuperável no BuildMaster:', error);
  }, [error]);

  function openSafeMode() {
    clearTransientRuntimeV3930();
    clearRecoveryMarkerV3930();
    window.location.replace('/?recuperacao=manual');
  }

  return (
    <main className="bm-recovery-screen">
      <section className="bm-recovery-card" role="alert">
        <div className="bm-recovery-symbol"><AlertTriangle size={26} /></div>
        <p className="kicker"><ShieldCheck size={14} /> Recuperação protegida</p>
        <h1 style={{ color: '#101827' }}>Esta área não conseguiu abrir</h1>
        <p>Seus jogadores, fichas e arquivos do Cofre foram preservados. Tente novamente ou abra em modo seguro. O app removerá apenas a sessão e os rascunhos temporários; o Cofre e os jogadores salvos não serão apagados.</p>
        <div className="bm-recovery-actions">
          <button type="button" className="primary" onClick={reset}><RotateCcw size={17} /> Tentar novamente</button>
          <button type="button" className="secondary" onClick={() => history.back()}><ArrowLeft size={17} /> Voltar</button>
          <button type="button" className="danger" onClick={openSafeMode}>Abrir em modo seguro</button>
        </div>
        {error.digest && <p style={{ opacity: .6, fontSize: 12, marginTop: 18 }}>Código técnico: {error.digest}</p>}
      </section>
    </main>
  );
}
