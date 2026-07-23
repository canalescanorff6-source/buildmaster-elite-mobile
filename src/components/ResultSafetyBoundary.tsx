'use client';

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

export type ResultSafetyBoundaryProps = { children: ReactNode; onRecover: () => void };
type ResultSafetyBoundaryState = { failed: boolean };

export class ResultSafetyBoundary extends Component<ResultSafetyBoundaryProps, ResultSafetyBoundaryState> {
  state: ResultSafetyBoundaryState = { failed: false };

  static getDerivedStateFromError(): ResultSafetyBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Falha isolada na tela da ficha:', error, info);
  }

  private recover = () => {
    this.setState({ failed: false });
    this.props.onRecover();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <article className="luxury-panel wide-card" role="alert">
        <p className="kicker">Recuperação segura da ficha</p>
        <h3>A ficha foi preservada, mas um painel apresentou dados incompatíveis.</h3>
        <p className="panel-note">O Cofre não foi apagado. Volte para a revisão, confirme os dados e gere novamente com o formato atual.</p>
        <button type="button" className="elite-button" onClick={this.recover}>Revisar e gerar novamente</button>
      </article>
    );
  }
}
