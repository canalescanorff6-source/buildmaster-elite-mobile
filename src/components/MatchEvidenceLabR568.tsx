'use client';

import { useMemo, useState } from 'react';
import type { MatchValidationRecord } from '@/lib/appEvolution';
import {
  MATCH_METRICS_R568, evaluateMatchEvidenceR568, listMatchEvidenceContextsR568,
  type MatchMetricR568
} from '@/lib/matchEvidenceLabR568';

/** Read-only. Existing saved match records are not modified or relabeled. */
export function MatchEvidenceLabR568({ records }: { records: readonly MatchValidationRecord[] }) {
  const [contextKey, setContextKey] = useState('');
  const [metric, setMetric] = useState<MatchMetricR568>('interceptions');
  const contexts = useMemo(() => listMatchEvidenceContextsR568(records), [records]);
  const report = useMemo(() => evaluateMatchEvidenceR568({
    records, contextKey: contextKey || null, metric,
  }), [records, contextKey, metric]);
  return (
    <article className="luxury-panel wide-card" aria-label="Laboratório R568 de partidas">
      <div className="section-title-row"><div><p className="kicker">Match Evidence Lab R568</p>
        <h3>Comparar duas fichas com partidas reais</h3></div><span>{report.status}</span></div>
      <p className="panel-note">Comparação somente descritiva. Usa apenas métricas individuais explicitamente registradas,
        na mesma edição da carta, função, formação, estilo, versão do jogo, modalidade e conexão.</p>
      <div className="professional-match-context-grid">
        <label><span>Contexto controlado</span>
          <select aria-label="Contexto experimental R568" value={contextKey} onChange={e => setContextKey(e.target.value)}>
            <option value="">Escolher contexto — não selecionar automaticamente</option>
            {contexts.map(x => <option key={x.key} value={x.key}>
              {x.label} • A {x.armA} / B {x.armB}
            </option>)}
          </select>
        </label>
        <label><span>Métrica individual observada</span>
          <select aria-label="Métrica experimental R568" value={metric}
            onChange={e => setMetric(e.target.value as MatchMetricR568)}>
            {MATCH_METRICS_R568.map(x => <option key={x.key} value={x.key}>{x.label}</option>)}
          </select>
        </label>
      </div>
      <div className="health-score-grid match-summary-grid">
        {report.arms.map(arm => (
          <article key={arm.arm}>
            <strong>{arm.observedPer90 === null ? '—' : arm.observedPer90.toFixed(2)}</strong>
            <span>Ficha {arm.arm} • ações observadas por 90 min</span>
            <small>{arm.samples} partida(s) • {arm.sessions} sessão(ões) • {arm.totalMinutes} min</small>
          </article>
        ))}
      </div>
      {report.comparison ? <p className="panel-note">
        Diferença B − A: <strong>{report.comparison.deltaBminusA > 0 ? '+' : ''}{report.comparison.deltaBminusA}</strong> por 90 min.
        É uma observação, não prova de que uma ficha causa melhor desempenho.
      </p> : <p className="panel-note">Sem comparação conclusiva; mínimo de {report.minimumPerArm} partidas válidas por ficha.</p>}
      <div className="v27-pairing-list">
        {report.warnings.map(warning => <span key={warning}>{warning}</span>)}
      </div>
      <small>O BuildMaster não declara vencedor, não altera pesos dos otimizadores e não
        atribui estatísticas coletivas a jogadores individuais. A ficha final continua sendo sua escolha.</small>
    </article>
  );
}
