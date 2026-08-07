'use client';

import {
  Activity,
  BarChart3,
  CheckCircle2,
  FlaskConical,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  TimerReset,
  TrendingUp,
  Zap
} from 'lucide-react';
import type { AnalysisResult, TrainingPlan } from '@/lib/analyzerDomain';
import { TRAINING_LABELS } from '@/lib/trainingEngine';

function trainingSummary(plan: TrainingPlan) {
  return Object.entries(plan)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${TRAINING_LABELS[key as keyof typeof TRAINING_LABELS]} +${value}`)
    .join(' • ');
}

function phaseLabel(id: string) {
  const labels: Record<string, string> = {
    BUILDUP: 'Saída de bola',
    CENTRAL_PROGRESSION: 'Progressão central',
    FINAL_THIRD: 'Terço final',
    DEFENSIVE_TRANSITION: 'Transição defensiva',
    SETTLED_DEFENCE: 'Defesa organizada',
    LATE_MATCH: 'Minutos finais'
  };
  return labels[id] ?? id;
}

function opponentLabel(id: string) {
  const labels: Record<string, string> = {
    LOW_BLOCK: 'Bloco baixo',
    HIGH_PRESS: 'Pressão alta',
    FAST_COUNTER: 'Contra-ataque veloz',
    PHYSICAL_COMPACT: 'Físico e compacto',
    POSSESSION_CONTROL: 'Controle por posse',
    BALANCED_META: 'Competitivo equilibrado'
  };
  return labels[id] ?? id;
}

export function SupremePerformanceV3870Panel({ result }: { result: AnalysisResult }) {
  const analysis = result.supremeV3870;
  if (!analysis) return null;
  const weakestPhase = [...analysis.winner.phaseScores].sort((left, right) => left.score - right.score)[0];
  const weakestOpponent = [...analysis.winner.opponentScores].sort((left, right) => left.score - right.score)[0];

  return (
    <div className="advanced-motor-v3750 max-match-v3860 supreme-performance-v3870">
      <article className="luxury-panel wide-card advanced-motor-hero">
        <div className="section-title-row">
          <div>
            <p className="kicker"><Zap size={15}/> Motor Supremo v38.70</p>
            <h3>Otimização robusta, Pareto e estresse competitivo</h3>
          </div>
          <span>{analysis.confidence}% confiança</span>
        </div>
        <div className="advanced-motor-winner">
          <div><Target size={22}/><span>Ficha suprema</span><strong>{analysis.winner.supremeScore}/100</strong><small>sem overall no cálculo</small></div>
          <div><ShieldCheck size={22}/><span>Faixa conservadora</span><strong>{analysis.winner.robustness.conservative}/100</strong><small>risco de leitura incluído</small></div>
          <div><Layers3 size={22}/><span>Pior fase</span><strong>{analysis.winner.worstPhase}/100</strong><small>{weakestPhase.label}</small></div>
          <div><Swords size={22}/><span>Pior confronto</span><strong>{analysis.winner.worstOpponent}/100</strong><small>{weakestOpponent.label}</small></div>
        </div>
        <p className="panel-note">{analysis.summary}</p>
        <div className="data-grid">
          <div><span>Microfunção</span><strong>{analysis.microRole}</strong></div>
          <div><span>Rodadas de busca</span><strong>{analysis.searchRounds}</strong></div>
          <div><span>Candidatas geradas</span><strong>{analysis.candidatesGenerated}</strong></div>
          <div><span>Candidatas únicas</span><strong>{analysis.candidatesEvaluated}</strong></div>
          <div><span>Fases testadas</span><strong>{analysis.phasesTested}</strong></div>
          <div><span>Adversários testados</span><strong>{analysis.opponentsTested}</strong></div>
        </div>
        <details className="panel-details">
          <summary>Ver as {analysis.improvements.length} proteções e refinamentos ativos</summary>
          <div className="chip-cloud">{analysis.improvements.map((item, index) => <span key={item}>{String(index + 1).padStart(2, '0')} · {item}</span>)}</div>
        </details>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Activity size={15}/> Fases da partida</p><h3>Rendimento medido do início aos minutos finais</h3></div><span>Média {analysis.winner.phaseAverage}/100</span></div>
        <div className="advanced-build-grid">
          {analysis.winner.phaseScores.map((item) => (
            <section key={item.id} className={item.id === weakestPhase.id ? 'is-winner' : ''}>
              <header><div><strong>{item.label}</strong><small>Peso {item.weight.toFixed(2)}</small></div><em>{item.score}/100</em></header>
              <p>Limitador: {item.limitingAction}</p>
              <small>Decisivos: {item.decisiveAttributes.join(' • ')}</small>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Swords size={15}/> Matriz de adversários</p><h3>Seis comportamentos que a ficha precisa enfrentar</h3></div><span>Média {analysis.winner.opponentAverage}/100</span></div>
        <div className="advanced-build-grid">
          {analysis.winner.opponentScores.map((item) => (
            <section key={item.id} className={item.id === weakestOpponent.id ? 'is-winner' : ''}>
              <header><div><strong>{item.label}</strong><small>Peso {item.weight.toFixed(2)}</small></div><em>{item.score}/100</em></header>
              <p>{item.reason}</p>
              <small>Fase mais protegida: {phaseLabel(item.protectedPhase)}</small>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Gauge size={15}/> Ficha vencedora</p><h3>Distribuição aplicada depois da convergência</h3></div><span>{analysis.winner.pointsUsed}/{result.trainingPointsTotal} pontos</span></div>
        <p className="panel-note">{trainingSummary(analysis.winner.training)}</p>
        <div className="data-grid">
          <div><span>Sinergia de atributos</span><strong>{analysis.winner.attributeSynergy}/100</strong></div>
          <div><span>Equilíbrio de gargalos</span><strong>{analysis.winner.bottleneckBalance}/100</strong></div>
          <div><span>Cobertura de gatilhos</span><strong>{analysis.winner.triggerCoverage}/100</strong></div>
          <div><span>Eficiência de pontos</span><strong>{analysis.winner.dimensions.pointEfficiency}/100</strong></div>
          <div><span>Esperado</span><strong>{analysis.winner.robustness.expected}/100</strong></div>
          <div><span>Otimista controlado</span><strong>{analysis.winner.robustness.optimistic}/100</strong></div>
          <div><span>Largura de incerteza</span><strong>{analysis.winner.robustness.uncertaintyWidth}</strong></div>
          <div><span>Penalidade OCR</span><strong>{analysis.winner.robustness.ocrRiskPenalty}</strong></div>
        </div>
        <div className="advanced-build-grid">
          {analysis.finalists.map((item, index) => (
            <section key={`${item.id}-${index}`} className={index === 0 ? 'is-winner' : ''}>
              <header><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><small>{item.source}</small></div><em>{item.supremeScore}/100</em></header>
              <p>{trainingSummary(item.training)}</p>
              <div className="advanced-score-row"><span>Conservadora <b>{item.robustness.conservative}</b></span><span>Pior fase <b>{item.worstPhase}</b></span><span>Pior rival <b>{item.worstOpponent}</b></span></div>
              <footer>Pareto {item.paretoRank} • {item.dominated ? 'dominada' : 'fronteira eficiente'}</footer>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><BarChart3 size={15}/> Fronteira de Pareto</p><h3>Fichas que sobrevivem a vários objetivos simultâneos</h3></div><span>{analysis.paretoFrontier.filter((item) => !item.dominated).length} eficientes</span></div>
        <div className="advanced-joint-list">
          {analysis.paretoFrontier.map((item, index) => (
            <section key={`${item.candidateId}-${index}`} className={!item.dominated ? 'is-winner' : ''}>
              <span>{item.rank}</span>
              <div><strong>{item.title}</strong><small>{item.reason}</small><em>Fases {item.phaseAverage} • Rivais {item.opponentAverage} • Conservadora {item.conservativeScore}</em></div>
              <aside><b>{item.worstPhase}/{item.worstOpponent}</b><small>piores casos</small><span>Eficiência {item.pointEfficiency}</span></aside>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><TrendingUp size={15}/> Valor marginal</p><h3>O que proteger, reforçar ou parar de investir</h3></div><span>{analysis.marginalValues.length} grupos</span></div>
        <div className="advanced-build-grid">
          {analysis.marginalValues.map((item) => (
            <section key={item.training} className={item.verdict === 'proteger' ? 'is-winner' : ''}>
              <header><div><strong>{item.label} +{item.currentLevel}</strong><small>{item.verdict}</small></div><em>{item.gain > 0 ? '+' : ''}{item.gain}</em></header>
              <p>{item.reason}</p>
              <small>Perda se retirar: {item.lossIfRemoved} • custo do próximo nível: {item.nextPointCost}</small>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Sparkles size={15}/> Gatilhos do Top 5</p><h3>Habilidades avaliadas por uso provável e cobertura</h3></div><span>{analysis.skillTriggerMatrix.length} habilidades</span></div>
        <div className="advanced-skill-set-grid">
          {analysis.skillTriggerMatrix.map((item, index) => (
            <section key={item.skill} className={index < 3 ? 'is-winner' : ''}>
              <header><strong>{item.skill}</strong><em>{item.triggerRate}/100</em></header>
              <p>{item.reason}</p>
              <div className="advanced-score-row"><span>Dependência <b>{item.dependencyScore}</b></span><span>Fases <b>{item.phaseCoverage.length}</b></span><span>Rivais <b>{item.opponentCoverage.length}</b></span></div>
              <small>{item.phaseCoverage.map(phaseLabel).join(' • ')}</small>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><ShieldCheck size={15}/> Ímpeto sob estresse</p><h3>Escolha recalculada contra os elos mais fracos</h3></div><span>Top {analysis.impetoStressTests.length}</span></div>
        <div className="advanced-joint-list">
          {analysis.impetoStressTests.map((item, index) => (
            <section key={`${item.name}-${index}`} className={index === 0 ? 'is-winner' : ''}>
              <span>{index + 1}</span>
              <div><strong>{item.name}</strong><small>{item.reason}</small><em>{item.verdict} • saturação {item.saturationRisk}</em></div>
              <aside><b>{item.score}</b><small>nota robusta</small><span>Fase +{item.worstPhaseGain} • Rival +{item.worstOpponentGain}</span></aside>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><TimerReset size={15}/> Fichas adaptativas</p><h3>Principal aplicada e três alternativas situacionais</h3></div><span>{analysis.adaptiveVariants.length} opções</span></div>
        <div className="advanced-build-grid">
          {analysis.adaptiveVariants.map((item, index) => (
            <section key={item.id} className={index === 0 ? 'is-winner' : ''}>
              <header><div><strong>{item.label}</strong><small>{index === 0 ? 'aplicada' : 'alternativa'}</small></div><em>{item.score}/100</em></header>
              <p>{trainingSummary(item.training)}</p>
              <small>{item.purpose} Melhor fase: {phaseLabel(item.bestPhase)}. Melhor confronto: {opponentLabel(item.bestOpponent)}.</small>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><FlaskConical size={15}/> Validação real A/B</p><h3>Como comprovar que a ficha melhorou dentro da partida</h3></div><span>{analysis.decision}</span></div>
        <ul className="clean-list">{analysis.validationProtocol.map((item, index) => <li key={item}><CheckCircle2 size={14}/><span><b>{index + 1}.</b> {item}</span></li>)}</ul>
        <div className="panel-note"><strong>Proteções finais</strong></div>
        <ul className="clean-list">{analysis.guardrails.map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
    </div>
  );
}
