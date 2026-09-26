'use client';

import { Component, useMemo, type ErrorInfo, type ReactNode } from 'react';
import type { AnalysisResult, TrainingKey } from '../../lib/analyzer';
import { analysisUsagePositionR138 } from '../../lib/analysisUsagePositionR138';
import { buildBuildSimulatorR483, type BuildSimulatorVariantR483 } from './buildSimulatorEngineR483';

const TRAINING_LABEL_R483: Record<TrainingKey, string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  dexterity: 'Destreza',
  lowerBodyStrength: 'Força pernas',
  aerialStrength: 'Bola aérea',
  defending: 'Defesa',
  gk1: 'Goleiro 1',
  gk2: 'Goleiro 2',
  gk3: 'Goleiro 3',
};

class BuildSimulatorBoundaryR483 extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Boundary local deliberadamente sem persistência: falha do laboratório não toca a ficha oficial.
  }

  render() {
    if (this.state.failed) {
      return (
        <article className="luxury-panel wide-card" role="alert">
          <p className="kicker">Build Simulator R483</p>
          <h3>Simulador temporariamente indisponível. Sua ficha oficial continua intacta.</h3>
        </article>
      );
    }
    return this.props.children;
  }
}

function VariantCardR483({ variant }: { variant: BuildSimulatorVariantR483 }) {
  return (
    <article className="luxury-panel wide-card">
      <div className="section-title-row">
        <div>
          <p className="kicker">{variant.id === 'official' ? 'Ficha oficial' : 'Cenário simulado'}</p>
          <h3>{variant.label}</h3>
        </div>
        <span>{variant.pointsUsed} PP • {variant.pointsAvailable} livres</span>
      </div>
      {variant.deltas.length > 0 && (
        <div className="position-list">
          {variant.deltas.map((delta) => (
            <div key={`${variant.id}-${delta.key}`}>
              <strong>{TRAINING_LABEL_R483[delta.key]}: {delta.before} → {delta.after}</strong>
              <span>{delta.delta > 0 ? '+' : ''}{delta.delta} nível(is)</span>
            </div>
          ))}
        </div>
      )}
      {variant.strengths.length > 0 && <><p className="kicker">Ganhos</p><ul className="clean-list">{variant.strengths.map((item) => <li key={item}>{item}</li>)}</ul></>}
      {variant.sacrifices.length > 0 && <><p className="kicker">Sacrifícios</p><ul className="clean-list">{variant.sacrifices.map((item) => <li key={item}>{item}</li>)}</ul></>}
      <p className="panel-note">{variant.explanation}</p>
    </article>
  );
}

function BuildSimulatorContentR483({ result }: { result: AnalysisResult }) {
  const targetPosition = analysisUsagePositionR138(result);
  const snapshot = useMemo(
    () => buildBuildSimulatorR483({ result, targetPosition }),
    [result, targetPosition],
  );

  return (
    <div className="result-section-grid">
      <article className="luxury-panel wide-card">
        <div className="section-title-row">
          <div>
            <p className="kicker">Simulador de ficha — R483</p>
            <h3>Compare redistribuições antes de decidir qualquer mudança.</h3>
          </div>
          <span>Read-only</span>
        </div>
        <p className="panel-note">Somente simulação — não altera sua ficha. Todas as variantes válidas usam exatamente os mesmos PP da Ficha oficial e não usam GER/Overall como objetivo.</p>
        <div className="data-grid">
          <div><span>Orçamento confirmado</span><strong>{snapshot.budget} PP</strong></div>
          <div><span>Uso oficial</span><strong>{snapshot.officialPointsUsed} PP</strong></div>
          <div><span>Posição preservada</span><strong>{targetPosition}</strong></div>
          <div><span>Autoridade</span><strong>R119 → R126 → R128</strong></div>
        </div>
      </article>

      {snapshot.blockedReason ? (
        <article className="luxury-panel wide-card" role="status">
          <p className="kicker">Simulação bloqueada com segurança</p>
          <h3>{snapshot.blockedReason}</h3>
          <p className="panel-note">A Ficha oficial permanece inalterada.</p>
        </article>
      ) : snapshot.variants.map((variant) => <VariantCardR483 key={variant.id} variant={variant} />)}
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
