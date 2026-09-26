'use client';

import { Component, type ErrorInfo, type ReactNode, useMemo } from 'react';
import type { AnalysisResult } from '../../lib/analyzer';
import { analysisUsagePositionR138 } from '../../lib/analysisUsagePositionR138';
import { TRAINING_LABELS } from '../../lib/trainingEngine';
import { buildBuildSimulatorR483 } from './buildSimulatorEngineR483';

type BoundaryPropsR483 = { children: ReactNode };
type BoundaryStateR483 = { failed: boolean };

class BuildSimulatorBoundaryR483 extends Component<BoundaryPropsR483, BoundaryStateR483> {
  state: BoundaryStateR483 = { failed: false };

  static getDerivedStateFromError(): BoundaryStateR483 {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // A falha fica isolada neste painel; a ficha oficial continua sendo a fonte de verdade.
  }

  render() {
    if (this.state.failed) {
      return (
        <article className="luxury-panel wide-card" role="alert">
          <p className="kicker">Build Simulator R483</p>
          <strong>Simulador temporariamente indisponível. Sua ficha oficial continua intacta.</strong>
        </article>
      );
    }
    return this.props.children;
  }
}

function BuildSimulatorContentR483({ result }: { result: AnalysisResult }) {
  const targetPosition = analysisUsagePositionR138(result);
  const snapshot = useMemo(
    () => buildBuildSimulatorR483({ result, targetPosition }),
    [result, targetPosition]
  );

  if (snapshot.blockedReason) {
    return (
      <article className="luxury-panel wide-card">
        <div className="section-title-row">
          <div>
            <p className="kicker">Simulador de ficha — R483</p>
            <h3>Somente simulação — não altera sua ficha</h3>
          </div>
          <span>Bloqueado com segurança</span>
        </div>
        <p className="panel-note">{snapshot.blockedReason}</p>
        <p>A ficha oficial permanece intacta e continua sendo a única referência de produção.</p>
      </article>
    );
  }

  return (
    <div className="result-section-grid">
      <article className="luxury-panel wide-card">
        <div className="section-title-row">
          <div>
            <p className="kicker">Simulador de ficha — R483</p>
            <h3>Somente simulação — não altera sua ficha</h3>
          </div>
          <span>{snapshot.variants.length} cenários</span>
        </div>
        <div className="data-grid">
          <div><span>Ficha oficial</span><strong>{snapshot.officialPointsUsed} PP</strong></div>
          <div><span>Orçamento confirmado</span><strong>{snapshot.budget} PP</strong></div>
          <div><span>Posição preservada</span><strong>{targetPosition}</strong></div>
          <div><span>Autoridade</span><strong>Somente leitura</strong></div>
        </div>
        <p className="panel-note">As alternativas abaixo redistribuem somente os mesmos PP já usados pela ficha oficial. Nenhuma delas escreve treino, habilidades, Ímpeto, posição ou resultado oficial.</p>
      </article>

      {snapshot.variants.map((variant) => (
        <article className="luxury-panel wide-card" key={variant.id}>
          <div className="section-title-row">
            <div>
              <p className="kicker">{variant.id === 'official' ? 'Ficha oficial' : 'Cenário comparativo'}</p>
              <h3>{variant.label}</h3>
            </div>
            <span>{variant.pointsUsed}/{snapshot.budget} PP</span>
          </div>

          <div className="data-grid">
            <div><span>PP usados</span><strong>{variant.pointsUsed}</strong></div>
            <div><span>PP disponíveis</span><strong>{variant.pointsAvailable}</strong></div>
            <div><span>Custo válido</span><strong>{variant.validBudget ? 'Sim' : 'Não'}</strong></div>
            <div><span>Score relativo</span><strong>{Math.round(variant.score)}</strong></div>
          </div>

          {variant.deltas.length > 0 && (
            <div className="position-list">
              {variant.deltas.map((delta) => (
                <div key={`${variant.id}-${delta.key}`}>
                  <strong>{TRAINING_LABELS[delta.key]}</strong>
                  <span>{delta.before} → {delta.after}</span>
                  <em>{delta.delta > 0 ? '+' : ''}{delta.delta} nível(is)</em>
                </div>
              ))}
            </div>
          )}

          {variant.strengths.length > 0 && (
            <>
              <p className="kicker">Ganhos desta simulação</p>
              <ul className="clean-list">{variant.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          )}

          {variant.sacrifices.length > 0 && (
            <>
              <p className="kicker">Trade-offs</p>
              <ul className="clean-list">{variant.sacrifices.map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          )}

          <p className="panel-note">{variant.explanation}</p>
        </article>
      ))}
    </div>
  );
}

export function BuildSimulatorPanelR483({ result }: { result: AnalysisResult }) {
  return (
    <BuildSimulatorBoundaryR483>
      <BuildSimulatorContentR483 result={result} />
    </BuildSimulatorBoundaryR483>
  );
}
