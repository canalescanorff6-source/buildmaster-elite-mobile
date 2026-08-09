'use client';

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react';
import {
  cleanRecoveryQueryV3930,
  clearRecoveryMarkerV3930,
  clearTransientRuntimeV3930,
  V3930_RECOVERY_MARKER
} from '@/lib/runtimeRecoveryV3930';

type Props = { children: ReactNode };
type State = { failed: boolean; message: string };

export class AppShellSafetyBoundaryV3930 extends Component<Props, State> {
  state: State = { failed: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { failed: true, message: error?.message || 'Falha de compatibilidade da sessão.' };
  }

  componentDidMount() {
    cleanRecoveryQueryV3930();
    if (this.state.failed) return;
    window.setTimeout(() => {
      if (!this.state.failed) clearRecoveryMarkerV3930();
    }, 1500);
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Recuperação v39.30 capturou uma falha no shell:', error, info);
    try {
      if (sessionStorage.getItem(V3930_RECOVERY_MARKER) !== '1') {
        sessionStorage.setItem(V3930_RECOVERY_MARKER, '1');
        clearTransientRuntimeV3930();
        window.location.replace('/?recuperacao=v3930');
      }
    } catch {}
  }

  private recover = () => {
    clearTransientRuntimeV3930();
    clearRecoveryMarkerV3930();
    window.location.replace('/?recuperacao=manual');
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="bm-recovery-screen">
      <section className="bm-recovery-card" role="alert">
        <div className="bm-recovery-symbol"><AlertTriangle size={26} /></div>
        <p className="kicker"><ShieldCheck size={14} /> Recuperação automática v39.30</p>
        <h1 style={{ color: '#101827' }}>O app isolou uma sessão incompatível</h1>
        <p>O Cofre, os jogadores salvos, as receitas e os backups continuam preservados. Somente o rascunho temporário será limpo para o aplicativo abrir normalmente.</p>
        <button type="button" className="primary" onClick={this.recover}><RotateCcw size={17} /> Abrir em modo seguro</button>
        <small>{this.state.message}</small>
      </section>
    </main>;
  }
}
