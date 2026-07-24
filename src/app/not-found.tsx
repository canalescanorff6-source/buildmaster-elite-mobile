import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="bm-recovery-screen">
      <section className="bm-recovery-card">
        <div className="bm-recovery-symbol" style={{ background: 'linear-gradient(145deg,#356fd1,#173e7e)' }}><Compass size={26} /></div>
        <p className="kicker">BuildMaster Pro</p>
        <h1>Esta área não existe</h1>
        <p>O endereço informado não faz parte do aplicativo. Seus dados não foram alterados.</p>
        <div className="bm-recovery-actions"><a className="primary" href="/"><ArrowLeft size={17} /> Voltar ao início</a></div>
      </section>
    </main>
  );
}
