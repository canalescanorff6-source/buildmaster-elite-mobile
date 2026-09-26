'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { ExplainableDecisionR489, ExplainableReasonR489 } from './explainableDecisionTypesR489';

type PanelPropsR489 = {
  decision: ExplainableDecisionR489;
  compact?: boolean;
};

type BoundaryPropsR489 = { children: ReactNode };
type BoundaryStateR489 = { failed: boolean };

const EVIDENCE_STATE_LABEL_R489: Record<ExplainableDecisionR489['evidenceState'], string> = {
  FULL: 'Evidência completa',
  PARTIAL: 'Evidência parcial',
  INSUFFICIENT: 'Evidência insuficiente'
};

const REASON_TYPE_LABEL_R489: Record<ExplainableReasonR489['type'], string> = {
  BENEFIT: 'Benefício',
  TRADE_OFF: 'Trade-off',
  RISK: 'Risco',
  CONTRADICTION: 'Contradição'
};

class ExplainableDecisionBoundaryR489 extends Component<BoundaryPropsR489, BoundaryStateR489> {
  state: BoundaryStateR489 = { failed: false };

  static getDerivedStateFromError(): BoundaryStateR489 {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // A explicação é observacional. Uma falha aqui não pode afetar a decisão que a originou.
  }

  render() {
    if (this.state.failed) {
      return (
        <article className="luxury-panel wide-card" role="alert">
          <p className="kicker">Explainable AI R489</p>
          <strong>Explicação temporariamente indisponível.</strong>
          <p className="panel-note">A recomendação original continua intacta e mantém sua autoridade normal.</p>
        </article>
      );
    }
    return this.props.children;
  }
}

function percentR489(value: number): string {
  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(Math.max(0, Math.min(100, normalized)))}%`;
}

function ExplainableDecisionContentR489({ decision, compact = false }: PanelPropsR489) {
  return (
    <article className={`luxury-panel wide-card${compact ? ' compact' : ''}`} aria-label="Explicação da recomendação R489">
      <div className="section-title-row">
        <div>
          <p className="kicker">Explainable AI R489 • somente leitura</p>
          <h3>Por que esta recomendação?</h3>
        </div>
        <span>{decision.decisionConfidence}% confiança</span>
      </div>

      <p className="panel-note">{decision.verdict}</p>

      <div className="data-grid">
        <div><span>Confiança da decisão</span><strong>{decision.decisionConfidence}%</strong></div>
        {decision.performanceConfidence != null && (
          <div><span>Confiança de desempenho</span><strong>{decision.performanceConfidence}%</strong></div>
        )}
        <div><span>Estado da evidência</span><strong>{EVIDENCE_STATE_LABEL_R489[decision.evidenceState]}</strong></div>
        <div><span>Autoridade</span><strong>Somente leitura</strong></div>
      </div>

      {decision.reasons.length > 0 && (
        <div className="v27-recommendation-list compact">
          {decision.reasons.slice(0, 5).map((reason) => (
            <article key={`${reason.rank}-${reason.title}`}>
              <div>
                <strong>#{reason.rank} • {REASON_TYPE_LABEL_R489[reason.type]} • {reason.title}</strong>
                <span>{reason.explanation}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {(decision.benefits.length > 0 || decision.tradeOffs.length > 0 || decision.risks.length > 0) && (
        <div className="v27-pairing-list">
          {decision.benefits.map((item) => <span key={`benefit-${item}`}><b>Benefício:</b> {item}</span>)}
          {decision.tradeOffs.map((item) => <span key={`tradeoff-${item}`}><b>Trade-off:</b> {item}</span>)}
          {decision.risks.map((item) => <span key={`risk-${item}`}><b>Risco:</b> {item}</span>)}
        </div>
      )}

      {decision.counterfactual.available && decision.counterfactual.explanation && (
        <p className="panel-note"><b>Se mudasse o cenário:</b> {decision.counterfactual.explanation}</p>
      )}

      {decision.limitations.length > 0 && (
        <div className="v27-pairing-list">
          {decision.limitations.map((item) => <span key={`limitation-${item}`}><b>Limitação:</b> {item}</span>)}
        </div>
      )}

      <details>
        <summary>Ver evidências</summary>
        <p className="panel-note">Versão da explicação: {decision.version} • Fingerprint: {decision.fingerprint}</p>
        <div className="v27-pairing-list">
          {decision.evidence.map((item) => (
            <span key={item.id}>
              <b>{item.source}</b> • {item.claim}
              <small>
                Confiança nativa {percentR489(item.nativeConfidence)} • relevância {percentR489(item.relevance)} • independência {percentR489(item.independence)} • completude {percentR489(item.completeness)} • fingerprint {item.fingerprint} • versão {decision.version}
              </small>
            </span>
          ))}
          {!decision.evidence.length && <span>Nenhuma evidência material disponível para aprofundar esta explicação.</span>}
        </div>
      </details>
    </article>
  );
}

export function ExplainableDecisionPanelR489({ decision, compact = false }: PanelPropsR489) {
  return (
    <ExplainableDecisionBoundaryR489>
      <ExplainableDecisionContentR489 decision={decision} compact={compact} />
    </ExplainableDecisionBoundaryR489>
  );
}
