'use client';

import { Activity, BrainCircuit, Gauge, ShieldCheck, Target } from 'lucide-react';
import type { RealValidationV3760Analysis } from '@/lib/realValidationV3760';
import { formatLearnedWeights } from '@/lib/realValidationV3760';

function scoreTone(score: number) {
  return score >= 76 ? 'strong' : score >= 61 ? 'stable' : 'attention';
}

export function RealValidationV3760Panel({ analysis }: { analysis: RealValidationV3760Analysis }) {
  const weights = formatLearnedWeights(analysis.userLearning.learnedWeights);
  return <>
    <article className="luxury-panel wide-card real-validation-v3760-hero">
      <div className="section-title-row">
        <div><p className="kicker"><Target size={14}/> Validação Real v37.60</p><h3>Partidas, laboratório A/B e aprendizado por usuário</h3></div>
        <span>{analysis.matchAnalysis.samples} partida(s)</span>
      </div>
      <div className="health-score-grid real-validation-summary-grid">
        <article><strong>{analysis.matchAnalysis.score || '—'}</strong><span>Desempenho real</span><small>de 100</small></article>
        <article><strong>{analysis.matchAnalysis.confidence}</strong><span>Confiança</span><small>da amostra</small></article>
        <article><strong>{analysis.matchAnalysis.delay.level}</strong><span>Sensibilidade ao delay</span><small>{analysis.matchAnalysis.delay.sensitivity} ponto(s)</small></article>
        <article><strong>{analysis.userLearning.controlStyleLabel}</strong><span>Estilo aprendido</span><small>{analysis.userLearning.sampleCount} registro(s)</small></article>
      </div>
      <div className="match-validation-verdict"><Activity size={20}/><div><strong>Leitura da ficha em campo</strong><span>{analysis.matchAnalysis.verdict}</span></div></div>
    </article>

    <article className="luxury-panel wide-card real-validation-ab-card">
      <div className="section-title-row"><div><p className="kicker"><Target size={14}/> Laboratório A/B</p><h3>Compare duas combinações sem mudar o restante do contexto</h3></div><span>{analysis.experiment.status}</span></div>
      <div className="real-validation-arm-grid">
        {analysis.experiment.arms.map((arm) => <section key={arm.arm} className={analysis.experiment.winner === arm.arm ? 'winner' : ''}>
          <header><b>Opção {arm.arm}</b>{analysis.experiment.winner === arm.arm && <em>Vencedora provisória</em>}</header>
          <strong>{arm.buildTitle}</strong>
          <span>{arm.boosterName}</span>
          <div><small>Partidas</small><b>{arm.matches}</b></div>
          <div><small>Nota ajustada</small><b>{arm.contextAdjustedScore || '—'}</b></div>
          <div><small>Erros de passe/90</small><b>{arm.passErrorsPer90}</b></div>
          <div><small>Perdas/90</small><b>{arm.ballLossesPer90}</b></div>
        </section>)}
      </div>
      <div className="real-validation-experiment-verdict"><Target size={19}/><div><strong>Confiança {analysis.experiment.confidence}</strong><span>{analysis.experiment.verdict}</span><small>{analysis.experiment.nextAction}</small></div></div>
    </article>

    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker"><Gauge size={14}/> Métricas por posição</p><h3>O que realmente importa para esta função</h3></div><span>{analysis.matchAnalysis.confidence}</span></div>
      <div className="real-validation-position-grid">
        {analysis.matchAnalysis.positionMetrics.map((item) => <div key={item.key} className={scoreTone(item.score)}>
          <header><strong>{item.label}</strong><b>{item.score || '—'}</b></header>
          <i><b style={{ width: `${item.score}%` }}/></i>
          <span>{item.evidence}</span>
        </div>)}
      </div>
    </article>

    <article className="luxury-panel wide-card real-validation-insight-grid">
      <section>
        <div className="section-title-row"><div><p className="kicker"><Gauge size={14}/> Delay e conexão</p><h3>Separar falha técnica de atraso</h3></div><span>{analysis.matchAnalysis.delay.level}</span></div>
        <div className="real-validation-delay-stats">
          <div><strong>{analysis.matchAnalysis.delay.stableScore ?? '—'}</strong><span>Conexão estável</span><small>{analysis.matchAnalysis.delay.stableMatches} partida(s)</small></div>
          <span aria-hidden="true">→</span>
          <div><strong>{analysis.matchAnalysis.delay.delayedScore ?? '—'}</strong><span>Delay alto</span><small>{analysis.matchAnalysis.delay.delayedMatches} partida(s)</small></div>
        </div>
        {analysis.matchAnalysis.delay.evidence.map((item) => <p key={item}>• {item}</p>)}
      </section>
      <section>
        <div className="section-title-row"><div><p className="kicker"><BrainCircuit size={14}/> Aprendizado da conta</p><h3>{analysis.userLearning.controlStyleLabel}</h3></div><span>{analysis.userLearning.confidence}</span></div>
        <p>{analysis.userLearning.summary}</p>
        <div className="chip-cloud">{weights.length ? weights.map((item) => <span key={item}>{item}</span>) : <span>Aguardando mais partidas</span>}</div>
        {analysis.userLearning.tendencies.slice(0, 3).map((item) => <div className="real-validation-tendency" key={item.label}><strong>{item.label}</strong><b>{item.score}</b><span>{item.evidence}</span></div>)}
      </section>
    </article>

    <article className="luxury-panel wide-card real-validation-adjustment-card">
      <div className="section-title-row"><div><p className="kicker"><ShieldCheck size={14}/> Ajuste controlado</p><h3>{analysis.adjustment.recommendedBuildTitle}</h3></div><span>{analysis.adjustment.preferredStrategy}</span></div>
      <p className="panel-note"><b>Ímpeto/Booster:</b> {analysis.adjustment.recommendedBooster}</p>
      <div className="skill-grid">
        <div className="skill-check-card"><strong>Por que esta direção</strong>{analysis.adjustment.reasons.map((item) => <span key={item}>✓ {item}</span>)}</div>
        <div className="skill-check-card muted"><strong>Proteções</strong>{analysis.adjustment.safeguards.map((item) => <span key={item}>• {item}</span>)}</div>
      </div>
    </article>
  </>;
}
