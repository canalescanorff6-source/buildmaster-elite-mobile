'use client';

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react';
import {
  cleanRecoveryQueryV3930,
  clearRecoveryMarkerV3930,
  clearTransientRuntimeV3930
} from '@/lib/runtimeRecoveryV3930';
import {
  activateStartupSafeModeV3840,
  markStartupStableV3840,
  startupLastErrorV3840
} from '@/lib/startupResilienceV3840';

type Props = { children: ReactNode };
type State = { failed: boolean; message: string; attempt: number; exhausted: boolean };

const MAX_IN_PROCESS_RECOVERY_ATTEMPTS = 2;

export class AppShellSafetyBoundaryV3930 extends Component<Props, State> {
  state: State = { failed: false, message: '', attempt: 0, exhausted: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { failed: true, message: error?.message || 'Falha de compatibilidade da sessão.' };
  }

  componentDidMount() {
    cleanRecoveryQueryV3930();
    if (this.state.failed) return;
    window.setTimeout(() => {
      if (!this.state.failed) markStartupStableV3840();
    }, 1500);
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Recuperação v39.30 capturou uma falha no shell:', error, info);
    const recoveryCount = activateStartupSafeModeV3840(error);
    clearTransientRuntimeV3930();

    if (this.state.attempt < MAX_IN_PROCESS_RECOVERY_ATTEMPTS) {
      window.setTimeout(() => {
        this.setState((current) => ({
          failed: false,
          exhausted: false,
          message: '',
          attempt: current.attempt + 1
        }));
      }, recoveryCount > 1 ? 40 : 0);
      return;
    }

    this.setState({ exhausted: true });
  }

  private recover = () => {
    activateStartupSafeModeV3840(this.state.message || startupLastErrorV3840());
    clearTransientRuntimeV3930();
    clearRecoveryMarkerV3930();
    this.setState((current) => ({
      failed: false,
      exhausted: false,
      message: '',
      attempt: current.attempt + 1
    }));
  };

  render() {
    if (!this.state.failed) {
      return <div key={`buildmaster-shell-${this.state.attempt}`} style={{ display: 'contents' }}>{this.props.children}</div>;
    }

    if (!this.state.exhausted && this.state.attempt < MAX_IN_PROCESS_RECOVERY_ATTEMPTS) {
      return (
        <main className="bm-recovery-screen" aria-live="polite">
          <section className="bm-recovery-card">
            <div className="bm-recovery-symbol"><ShieldCheck size={26} /></div>
            <p className="kicker">Abertura protegida</p>
            <h1 style={{ color: '#101827' }}>Preparando o modo compatível</h1>
            <p>O aplicativo está ignorando somente a sessão temporária que falhou. O Cofre e os jogadores permanecem intactos.</p>
          </section>
        </main>
      );
    }

    return (
      <main className="bm-recovery-screen">
        <section className="bm-recovery-card" role="alert">
          <div className="bm-recovery-symbol"><AlertTriangle size={26} /></div>
          <p className="kicker"><ShieldCheck size={14} /> Modo básico protegido</p>
          <h1 style={{ color: '#101827' }}>A interface principal foi isolada</h1>
          <p>Os dados permanentes não foram apagados. Toque abaixo para remontar o aplicativo sem restaurar sessão, leitura pendente ou diagnóstico pesado.</p>
          <div className="bm-recovery-actions">
            <button type="button" className="primary" onClick={this.recover}><RotateCcw size={17} /> Abrir o aplicativo limpo</button>
          </div>
          {this.state.message && <small className="bm-recovery-diagnostic">Detalhe técnico: {this.state.message}</small>}
        </section>
      </main>
    );
  }
}

// Compatibilidade documental: o fluxo antigo usava window.location.replace e criava um ciclo de recarregamento.
