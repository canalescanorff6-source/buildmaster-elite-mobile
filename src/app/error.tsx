'use client';

import { useEffect } from 'react';

const ACTIVE_SESSION_KEY = 'buildmaster_active_session_v24_29_regras_atualizaveis';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Erro recuperável no BuildMaster:', error);
  }, [error]);

  function clearCurrentSession() {
    try { localStorage.removeItem(ACTIVE_SESSION_KEY); } catch {}
    window.location.href = '/';
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#07110e', color: '#f8fafc' }}>
      <section style={{ width: 'min(560px, 100%)', padding: 24, borderRadius: 20, border: '1px solid rgba(52,211,153,.28)', background: 'rgba(15,23,42,.94)' }}>
        <p style={{ color: '#34d399', fontWeight: 800, margin: 0 }}>BuildMaster Elite Tático</p>
        <h1 style={{ margin: '10px 0 8px' }}>Não foi possível abrir esta tela</h1>
        <p style={{ opacity: .82, lineHeight: 1.6 }}>Seus jogadores e fichas salvos no Cofre foram preservados. Tente novamente. Caso o erro volte, limpe somente a sessão atual para abrir o aplicativo sem repetir os dados que causaram a falha.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
          <button type="button" onClick={reset} style={{ border: 0, borderRadius: 12, padding: '12px 18px', fontWeight: 800, background: '#34d399', color: '#052e22' }}>Tentar novamente</button>
          <button type="button" onClick={() => history.back()} style={{ borderRadius: 12, padding: '12px 18px', fontWeight: 800, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff' }}>Voltar</button>
          <button type="button" onClick={clearCurrentSession} style={{ borderRadius: 12, padding: '12px 18px', fontWeight: 800, border: '1px solid rgba(248,113,113,.45)', background: 'rgba(127,29,29,.22)', color: '#fecaca' }}>Limpar somente a sessão atual</button>
        </div>
        {error.digest && <p style={{ opacity: .55, fontSize: 12, marginTop: 16 }}>Código técnico: {error.digest}</p>}
      </section>
    </main>
  );
}
