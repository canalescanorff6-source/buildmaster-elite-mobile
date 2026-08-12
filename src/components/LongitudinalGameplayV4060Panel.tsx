'use client';

import { CalendarDays, CheckCircle2, ShieldCheck, TrendingUp, TriangleAlert } from 'lucide-react';
import type { LongitudinalGameplayV4060Analysis } from '@/lib/longitudinalGameplayLearningV4060';

export function LongitudinalGameplayV4060Panel({ analysis }: { analysis: LongitudinalGameplayV4060Analysis }) {
  const actionLabel = analysis.action === 'PROMOVER_LONGITUDINAL'
    ? 'Promoção longitudinal'
    : analysis.action === 'SUSPENDER_POR_DRIFT'
      ? 'Aprendizado pausado'
      : analysis.action === 'VALIDAR_LONGITUDINAL'
        ? 'Confirmar em novas sessões'
        : analysis.action === 'MANTER_CAMPEA'
          ? 'Campeã mantida'
          : 'Coletar sessões';

  return <article className="luxury-panel wide-card longitudinal-gameplay-v4060">
    <div className="section-title-row">
      <div><p className="kicker"><CalendarDays size={14}/> Aprendizado Competitivo por Carta • v40.60</p><h3>Uma ficha só aprende quando a vantagem se repete ao longo do tempo</h3></div>
      <span>{actionLabel}</span>
    </div>
    <p>{analysis.verdict}</p>
    <div className="health-score-grid match-summary-grid">
      <article><strong>{analysis.distinctSessions}</strong><span>Sessões</span><small>dias distintos</small></article>
      <article><strong>{analysis.pairedSessions}</strong><span>Pareadas</span><small>líder × campeã</small></article>
      <article><strong>{Math.round(analysis.confidence.score)}</strong><span>Confiança</span><small>{analysis.confidence.level.toLowerCase()}</small></article>
      <article><strong>{analysis.contextsCovered}</strong><span>Contextos</span><small>modos cobertos</small></article>
    </div>

    <div className="position-list">
      {analysis.arms.map((arm) => <div key={arm.id}>
        <strong>{arm.rank}. {arm.label} • longitudinal {Math.round(arm.longitudinalScore)}/100</strong>
        <span>{arm.sessionCount} sessões • consistência {Math.round(arm.consistencyScore)}/100 • estabilidade {Math.round(arm.stableSessionRate)}%</span>
        <em>Pareado: {arm.pairedWins}V/{arm.pairedDraws}E/{arm.pairedLosses}D • taxa {Math.round(arm.pairedWinRate)}% • margem mediana {arm.medianPairedMargin}</em>
      </div>)}
    </div>

    {analysis.driftDetected && <div className="match-validation-verdict professional-evidence-verdict"><TriangleAlert size={20}/><div><strong>Drift detectado</strong><span>{analysis.driftReason}</span></div></div>}
    <div className="match-validation-verdict professional-evidence-verdict"><TrendingUp size={20}/><div><strong>Próxima ação</strong><span>{analysis.nextAction}</span></div></div>

    <details><summary><ShieldCheck size={14}/> Proteções do aprendizado longitudinal</summary><div className="unified-v3920-alerts">{analysis.safeguards.map((item) => <span key={item}><CheckCircle2 size={13}/>{item}</span>)}</div></details>
    <div className="chip-cloud"><span>Campeã: {analysis.currentChampionLabel}</span><span>Líder: {analysis.leaderLabel}</span><span>{analysis.totalMatches} partidas</span><span>{analysis.driftDetected ? 'drift ativo' : 'sem drift crítico'}</span></div>
  </article>;
}
