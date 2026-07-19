export default function NotFound() {
  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section className="luxury-panel" style={{ width: 'min(560px, 100%)', padding: 24 }}>
        <p className="kicker">BuildMaster Elite Tático</p>
        <h1>Área não encontrada</h1>
        <p>Esta rota não existe no aplicativo. Volte para a tela inicial sem apagar seus dados.</p>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', padding: '11px 16px', borderRadius: 12 }}>Voltar ao início</a>
      </section>
    </main>
  );
}
