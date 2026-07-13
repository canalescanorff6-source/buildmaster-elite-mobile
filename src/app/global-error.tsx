'use client';

const ACTIVE_SESSION_KEY = 'buildmaster_active_session_v24_29_regras_atualizaveis';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  function recover() {
    try { localStorage.removeItem(ACTIVE_SESSION_KEY); } catch {}
    window.location.href = '/';
  }
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#07110e', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <section style={{ width: 'min(560px, 100%)', padding: 24, borderRadius: 20, border: '1px solid rgba(52,211,153,.28)', background: 'rgba(15,23,42,.94)' }}>
            <h1>O aplicativo encontrou uma falha inesperada</h1>
            <p>O Cofre permanece salvo. Tente recarregar; se a falha continuar, remova somente a sessão temporária.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={reset} style={{ padding: '12px 18px', borderRadius: 12, border: 0, fontWeight: 800 }}>Tentar novamente</button>
              <button onClick={recover} style={{ padding: '12px 18px', borderRadius: 12, border: '1px solid #f87171', background: 'transparent', color: '#fff', fontWeight: 800 }}>Recuperar abertura</button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
