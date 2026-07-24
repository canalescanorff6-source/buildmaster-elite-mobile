'use client';

import { useEffect } from 'react';
import { AlertTriangle, ArrowLeft, RotateCcw, ShieldCheck } from 'lucide-react';
import { safeStorageRemove } from '@/lib/safeLocalStorage';

const ACTIVE_SESSION_KEY = 'buildmaster_active_session_v24_29_regras_atualizaveis';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Erro recuperável no BuildMaster:', error);
  }, [error]);

  function clearCurrentSession() {
    safeStorageRemove(ACTIVE_SESSION_KEY);
    window.location.href = '/';
  }

  return (
    <main className="bm-recovery-screen">
      <section className="bm-recovery-card" role="alert">
        <div className="bm-recovery-symbol"><AlertTriangle size={26} /></div>
        <p className="kicker"><ShieldCheck size={14} /> Recuperação protegida</p>
        <h1>Esta área não conseguiu abrir</h1>
        <p>Seus jogadores, fichas e arquivos do Cofre foram preservados. Tente recarregar esta área ou volte para a tela anterior. Limpe a sessão somente se o erro continuar.</p>
        <div className="bm-recovery-actions">
          <button type="button" className="primary" onClick={reset}><RotateCcw size={17} /> Tentar novamente</button>
          <button type="button" className="secondary" onClick={() => history.back()}><ArrowLeft size={17} /> Voltar</button>
          <button type="button" className="danger" onClick={clearCurrentSession}>Limpar somente a sessão</button>
        </div>
        {error.digest && <p style={{ opacity: .6, fontSize: 12, marginTop: 18 }}>Código técnico: {error.digest}</p>}
      </section>
    </main>
  );
}
