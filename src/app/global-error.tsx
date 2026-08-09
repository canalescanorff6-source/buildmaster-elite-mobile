'use client';

import { AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react';
import { clearRecoveryMarkerV3930, clearTransientRuntimeV3930 } from '@/lib/runtimeRecoveryV3930';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  function recover() {
    clearTransientRuntimeV3930();
    clearRecoveryMarkerV3930();
    window.location.replace('/?recuperacao=global');
  }
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#e9eef5', color: '#12203a', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: 'radial-gradient(circle at 15% 10%, rgba(53,111,209,.16), transparent 30%), radial-gradient(circle at 85% 85%, rgba(199,155,69,.13), transparent 32%), #e9eef5' }}>
          <section style={{ width: 'min(620px,100%)', padding: 32, borderRadius: 28, border: '1px solid rgba(78,108,153,.2)', background: 'rgba(250,252,255,.94)', boxShadow: '0 30px 90px rgba(11,25,49,.19)' }}>
            <div style={{ width: 54, height: 54, display: 'grid', placeItems: 'center', borderRadius: 18, color: '#fff', background: 'linear-gradient(145deg,#d14a5c,#9f263c)', boxShadow: '0 14px 34px rgba(159,38,60,.25)' }}><AlertTriangle size={26} /></div>
            <p style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '18px 0 6px', color: '#356fd1', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}><ShieldCheck size={14} /> Recuperação segura v39.30</p>
            <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(25px,4vw,36px)', letterSpacing: '-.035em', color: '#101827' }}>O aplicativo encontrou uma falha inesperada</h1>
            <p style={{ color: '#5e6f8b', lineHeight: 1.65 }}>O Cofre, jogadores e backups permanecem salvos. A recuperação remove somente a sessão e os rascunhos temporários incompatíveis com a atualização.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
              <button type="button" onClick={reset} style={{ minHeight: 46, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 14, border: 0, color: '#fff', background: 'linear-gradient(135deg,#1f4f96,#3c79d7)', fontWeight: 900 }}><RotateCcw size={17} /> Tentar novamente</button>
              <button type="button" onClick={recover} style={{ minHeight: 46, padding: '11px 16px', borderRadius: 14, border: '1px solid rgba(190,52,71,.26)', color: '#a2263a', background: 'rgba(209,74,92,.08)', fontWeight: 900 }}>Abrir em modo seguro</button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
