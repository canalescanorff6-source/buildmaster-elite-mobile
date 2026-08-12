'use client';

import { CheckCircle2, FlaskConical, ShieldCheck, TrendingUp } from 'lucide-react';
import type { RealGameplayValidationV4050Analysis } from '@/lib/realGameplayValidationV4050';

function score(value: number | null) {
  return value == null ? '—' : Math.round(value);
}

export function RealGameplayValidationV4050Panel({ analysis }: { analysis: RealGameplayValidationV4050Analysis }) {
  const actionLabel = analysis.action === 'PROMOVER_ALTERNATIVA' ? 'Alternativa validada' : analysis.action === 'TESTAR_ALTERNATIVA' ? 'Teste dirigido' : analysis.action === 'MANTER' ? 'Manter ficha' : 'Coletar evidência';
  return <article className="luxury-panel wide-card gameplay-validation-v4050">
    <div className="section-title-row"><div><p className="kicker"><FlaskConical size={14}/> Validação Real de Gameplay • v40.50</p><h3>Partidas reais entram como evidência, não como palpite</h3></div><span>{actionLabel}</span></div>
    <p>{analysis.verdict}</p>
    <div className="health-score-grid match-summary-grid">
      <article><strong>{analysis.totalMatches}</strong><span>Partidas</span><small>mesma carta/posição</small></article>
      <article><strong>{analysis.effectiveMatches}</strong><span>Amostra efetiva</span><small>após ponderação</small></article>
      <article><strong>{Math.round(analysis.confidence.score)}</strong><span>Confiança</span><small>{analysis.confidence.level.toLowerCase()}</small></article>
      <article><strong>{analysis.objectiveEvidenceRate}%</strong><span>Evidência objetiva</span><small>métricas preenchidas</small></article>
    </div>
    <div className="position-list">
      {analysis.arms.map((arm) => <div key={arm.id}><strong>{arm.rank}. {arm.label} • {Math.round(arm.posteriorScore)}/100</strong><span>{arm.rawMatches} jogos • amostra efetiva {arm.effectiveMatches} • intervalo {Math.round(arm.lowerBound)}–{Math.round(arm.upperBound)}</span><em>Estável {score(arm.stableScore)} • delay {score(arm.delayedScore)} • ranked {score(arm.rankedScore)} • eventos {score(arm.eventsScore)} • amigos {score(arm.friendsScore)}</em></div>)}
    </div>
    <div className="match-validation-verdict professional-evidence-verdict"><TrendingUp size={20}/><div><strong>Próxima ação</strong><span>{analysis.nextAction}</span></div></div>
    {analysis.learningSignals.length > 0 && <div className="match-repeated-problems"><strong>Sinais recorrentes para a próxima calibração</strong>{analysis.learningSignals.map((item) => <span key={item.group}>{item.label} • {Math.round(item.score)}/100 • {item.evidence}</span>)}</div>}
    <details><summary><ShieldCheck size={14}/> Ver proteções anti-overfitting</summary><div className="unified-v3920-alerts">{analysis.safeguards.map((item) => <span key={item}><CheckCircle2 size={13}/>{item}</span>)}</div></details>
    <div className="chip-cloud"><span>{analysis.stableMatches} estáveis</span><span>{analysis.delayedMatches} com delay</span><span>{analysis.contextsCovered} contextos</span><span>margem {analysis.margin}</span></div>
  </article>;
}
