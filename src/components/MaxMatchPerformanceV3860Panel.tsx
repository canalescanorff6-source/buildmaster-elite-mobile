'use client';

import { Activity, CheckCircle2, Gauge, ShieldCheck, Sparkles, Target, TimerReset, Zap } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzerDomain';
import { TRAINING_LABELS } from '@/lib/trainingEngine';

function trainingSummary(plan: AnalysisResult['training']) {
  return Object.entries(plan)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${TRAINING_LABELS[key as keyof typeof TRAINING_LABELS]} +${value}`)
    .join(' • ');
}

export function MaxMatchPerformanceV3860Panel({ result }: { result: AnalysisResult }) {
  const analysis = result.maxMatchV3860;
  if (!analysis) return null;
  const weakest = [...analysis.winner.scenarioScores].sort((left, right) => left.score - right.score)[0];

  return (
    <div className="advanced-motor-v3750 max-match-v3860">
      <article className="luxury-panel wide-card advanced-motor-hero">
        <div className="section-title-row">
          <div><p className="kicker"><Zap size={15}/> Motor Máximo Desempenho v38.60</p><h3>Ficha refinada para render dentro da partida</h3></div>
          <span>{analysis.confidence}% confiança</span>
        </div>
        <div className="advanced-motor-winner">
          <div><Target size={22}/><span>Microfunção</span><strong>{analysis.microRole}</strong><small>posição preservada em {result.bestPosition.label}</small></div>
          <div><Gauge size={22}/><span>Desempenho final</span><strong>{analysis.winner.performanceScore}/100</strong><small>overall fora do cálculo</small></div>
          <div><ShieldCheck size={22}/><span>Pior cenário</span><strong>{analysis.winner.worstScenario}/100</strong><small>{weakest.label}</small></div>
          <div><TimerReset size={22}/><span>Consistência</span><strong>{analysis.winner.consistency}/100</strong><small>estabilidade em oito cenários</small></div>
        </div>
        <p className="panel-note">{analysis.summary}</p>
        <div className="chip-cloud">{analysis.improvements.map((item, index) => <span key={item}>{String(index + 1).padStart(2, '0')} · {item}</span>)}</div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Activity size={15}/> Simulação de partida</p><h3>Oito cenários usados para proteger o rendimento real</h3></div><span>Min-max {analysis.winner.minMaxScore}/100</span></div>
        <div className="advanced-build-grid">
          {analysis.winner.scenarioScores.map((item) => (
            <section key={item.id} className={item.id === weakest.id ? 'is-winner' : ''}>
              <header><div><strong>{item.label}</strong><small>Peso {item.weight.toFixed(2)}</small></div><em>{item.score}/100</em></header>
              <p>Gargalo observado: {item.bottleneck}</p>
              <small>Protege: {item.protectedActions.join(' • ')}</small>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Target size={15}/> Ações decisivas</p><h3>A ficha medida pelo que o jogador precisa executar</h3></div><span>{Object.keys(analysis.winner.actionScores).length} ações</span></div>
        <div className="data-grid">
          {Object.entries(analysis.winner.actionScores).map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}/100</strong></div>)}
          <div><span>Resistência final</span><strong>{analysis.winner.fatigueResistance}/100</strong></div>
          <div><span>Duelos</span><strong>{analysis.winner.duelReliability}/100</strong></div>
          <div><span>Espaço curto</span><strong>{analysis.winner.tightSpaceControl}/100</strong></div>
          <div><span>Transição</span><strong>{analysis.winner.transitionImpact}/100</strong></div>
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Gauge size={15}/> Ficha vencedora</p><h3>{analysis.candidatesEvaluated} distribuições comparadas</h3></div><span>{analysis.winner.pointsUsed}/{result.trainingPointsTotal} pontos</span></div>
        <p className="panel-note">{trainingSummary(analysis.winner.training)}</p>
        <div className="advanced-build-grid">
          {analysis.finalists.map((item, index) => (
            <section key={`${item.id}-${index}`} className={index === 0 ? 'is-winner' : ''}>
              <header><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><small>{item.source}</small></div><em>{item.performanceScore}/100</em></header>
              <p>{trainingSummary(item.training)}</p>
              <div className="advanced-score-row"><span>Pior cenário <b>{item.worstScenario}</b></span><span>Consistência <b>{item.consistency}</b></span><span>Eficiência <b>{item.dimensions.pointEfficiency}</b></span></div>
              <ul>{item.strengths.slice(0, 4).map((text) => <li key={text}>{text}</li>)}</ul>
              <footer>{item.tradeOffs.join(' ')}</footer>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Sparkles size={15}/> Pacotes completos de habilidades</p><h3>Top 5 escolhido como conjunto, não por nomes isolados</h3></div><span>{analysis.skillPackages.length} pacotes</span></div>
        <div className="advanced-skill-set-grid">
          {analysis.skillPackages.map((pack, index) => (
            <section key={pack.id} className={index === 0 ? 'is-winner' : ''}>
              <header><strong>{pack.label}</strong><em>{pack.score}/100</em></header>
              <p>{pack.skills.map((skill) => skill.name).join(' • ')}</p>
              <div className="advanced-score-row"><span>Ativação <b>{pack.activationCoverage}</b></span><span>Função <b>{pack.roleCoverage}</b></span><span>Cenários <b>{pack.scenarioFit}</b></span></div>
              <ul>{pack.skills.map((skill) => <li key={skill.name}><CheckCircle2 size={13}/>{skill.name}: {skill.activationFrequency}</li>)}</ul>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><ShieldCheck size={15}/> Ímpeto contra o elo mais fraco</p><h3>Ranking recalculado depois da ficha e do Top 5</h3></div><span>Top {analysis.impetoCombinations.length}</span></div>
        <div className="advanced-joint-list">
          {analysis.impetoCombinations.map((item, index) => (
            <section key={`${item.impeto.name}-${index}`} className={index === 0 ? 'is-winner' : ''}>
              <span>{index + 1}</span>
              <div><strong>{item.impeto.name}</strong><small>{item.reason}</small><em>{item.impeto.supportedGroups.map((key) => TRAINING_LABELS[key]).join(' • ') || 'sem grupo confirmado'}</em></div>
              <aside><b>{item.score}</b><small>nota conjunta</small><span>Ganho no pior cenário: +{item.weakestScenarioGain}</span></aside>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Gauge size={15}/> Bandas funcionais</p><h3>Gargalos e excessos da distribuição final</h3></div><span>{analysis.winner.breakpointScore}/100</span></div>
        <div className="advanced-build-grid">
          {analysis.breakpoints.map((item) => (
            <section key={item.attribute} className={item.status === 'abaixo' ? 'is-winner' : ''}>
              <header><div><strong>{item.label}</strong><small>{item.status}</small></div><em>{item.projected}/{item.targetBand}</em></header>
              <p>{item.impact}</p>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><ShieldCheck size={15}/> Auditoria contrafactual</p><h3>Trocas simples testadas ao redor da vencedora</h3></div><span>{analysis.decision}</span></div>
        <div className="advanced-joint-list">
          {analysis.counterfactuals.map((item, index) => (
            <section key={`${item.change}-${index}`}>
              <span>{index + 1}</span><div><strong>{item.change}</strong><small>{item.verdict}</small></div><aside><b>{item.scoreDelta > 0 ? '+' : ''}{item.scoreDelta}</b><small>diferença</small></aside>
            </section>
          ))}
        </div>
        <ul className="clean-list">{analysis.guardrails.map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
    </div>
  );
}
