'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { recordSafeRuntimeError } from '@/lib/safeDiagnostics';

type Props = {
  area: string;
  children: ReactNode;
};

type State = { failed: boolean; resetKey: number };

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void recordSafeRuntimeError({
      area: this.props.area,
      code: 'section-boundary',
      message: `${error.message}\n${info.componentStack || ''}`
    });
  }

  private retry = () => {
    this.setState((current) => ({ failed: false, resetKey: current.resetKey + 1 }));
  };

  render() {
    if (this.state.failed) {
      return (
        <section className="section-error-fallback luxury-panel" role="alert">
          <AlertTriangle size={24} />
          <div>
            <strong>Esta área encontrou uma falha isolada</strong>
            <span>O restante do aplicativo continua disponível e seus dados foram preservados.</span>
          </div>
          <button type="button" onClick={this.retry}><RefreshCw size={16} /> Tentar abrir novamente</button>
        </section>
      );
    }
    return <div key={this.state.resetKey} className="section-error-boundary">{this.props.children}</div>;
  }
}
