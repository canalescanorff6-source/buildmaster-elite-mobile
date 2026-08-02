'use client';

import { CheckCircle2, Database, Gauge, Layers3, ShieldCheck, Sparkles, Target } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzerDomain';
import { TRAINING_LABELS } from '@/lib/trainingEngine';

function trainingSummary(plan: AnalysisResult['training']) {
  return Object.entries(plan)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${TRAINING_LABELS[key as keyof typeof TRAINING_LABELS]} +${value}`)
    .join(' • ');
}

export function AdvancedMotorV3750Panel({ result }: { result: AnalysisResult }) {
  const analysis = result.advancedMotorV3750;
  if (!analysis) return null;

  return (
    <div className="advanced-motor-v3750">
      <article className="luxury-panel wide-card advanced-motor-hero">
        <div className="section-title-row">
          <div><p className="kicker"><Sparkles size={15}/> Motor Avançado v37.50</p><h3>Ficha, habilidades e Ímpeto calculados em conjunto</h3></div>
          <span>{analysis.confidence}% confiança</span>
        </div>
        <div className="advanced-motor-winner">
          <div><Target size={22}/><span>Função otimizada</span><strong>{analysis.role.roleLabel}</strong><small>{analysis.role.functionScore}/100</small></div>
          <div><Layers3 size={22}/><span>Ficha vencedora</span><strong>{analysis.winner.buildTitle}</strong><small>{analysis.winner.buildScore}/100</small></div>
          <div><Gauge size={22}/><span>Ímpeto vencedor</span><strong>{analysis.winner.boosterName}</strong><small>{analysis.winner.boosterSynergy}/100 sinergia</small></div>
          <div><ShieldCheck size={22}/><span>Nota conjunta</span><strong>{analysis.winner.overallScore}/100</strong><small>sem avaliação isolada</small></div>
        </div>
        <p className="panel-note">{analysis.winner.reason}</p>
        <div className="chip-cloud">{analysis.role.reasons.map((item) => <span key={item}>{item}</span>)}</div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Database size={15}/> Fichas alternativas</p><h3>{analysis.alternatives.length} distribuições exatas por função</h3></div><span>3–5 opções</span></div>
        <div className="advanced-build-grid">
          {analysis.alternatives.map((item, index) => (
            <section key={item.id} className={item.id === analysis.winner.buildId ? 'is-winner' : ''}>
              <header><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><small>{item.strategy}</small></div><em>{item.overallScore}/100</em></header>
              <p>{trainingSummary(item.training)}</p>
              <div className="advanced-score-row"><span>Função <b>{item.roleFit}</b></span><span>Eficiência <b>{item.efficiency}</b></span><span>Equilíbrio <b>{item.balance}</b></span></div>
              <small>{item.pointsUsed}/{result.trainingPointsTotal} pontos • {item.exactBudget ? 'orçamento exato' : 'revisar orçamento'}</small>
              <ul>{item.strengths.map((text) => <li key={text}>{text}</li>)}</ul>
              <footer>{item.tradeOffs.join(' ')}</footer>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Layers3 size={15}/> Conjuntos de cinco habilidades</p><h3>Comparação do pacote completo, não de habilidades isoladas</h3></div><span>{analysis.skillSets.length} conjuntos</span></div>
        <div className="advanced-skill-set-grid">
          {analysis.skillSets.map((set) => (
            <section key={set.id} className={set.linkedBuildId === analysis.winner.buildId ? 'is-winner' : ''}>
              <header><strong>{set.title}</strong><em>{set.overallScore}/100</em></header>
              <ol>{set.skills.map((skill) => <li key={skill}><CheckCircle2 size={14}/>{skill}</li>)}</ol>
              <div className="advanced-score-row"><span>Cobertura <b>{set.coverageScore}</b></span><span>Sinergia <b>{set.synergyScore}</b></span><span>Função <b>{set.roleFit}</b></span></div>
              {set.redundancyPenalty > 0 && <small>Penalidade de redundância: -{set.redundancyPenalty}</small>}
              {set.warnings.map((warning) => <p key={warning} className="panel-note">{warning}</p>)}
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Layers3 size={15}/> Grafo de habilidades</p><h3>Complementos e redundâncias detectados</h3></div><span>{analysis.skillGraph.nodes.length} nós • {analysis.skillGraph.edges.length} relações</span></div>
        <div className="advanced-skill-graph">
          <div className="advanced-graph-nodes">
            {analysis.skillGraph.nodes.map((node) => <span key={node.id} className={node.essentialForRole ? 'essential' : ''}><strong>{node.name}</strong><small>{node.category} • {node.score}/100 • {node.appearsInSets} conjunto(s)</small></span>)}
          </div>
          <div className="advanced-graph-edges">
            {analysis.skillGraph.edges.slice(0, 12).map((edge) => {
              const from = analysis.skillGraph.nodes.find((node) => node.id === edge.from)?.name ?? edge.from;
              const to = analysis.skillGraph.nodes.find((node) => node.id === edge.to)?.name ?? edge.to;
              return <p key={`${edge.from}-${edge.to}`} className={`relation-${edge.relation}`}><strong>{from} ↔ {to}</strong><span>{edge.relation} • {edge.weight}/100</span><small>{edge.reason}</small></p>;
            })}
          </div>
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Gauge size={15}/> Ficha + Booster</p><h3>Ranking conjunto das melhores combinações</h3></div><span>Top {Math.min(analysis.jointOptions.length, 8)}</span></div>
        <div className="advanced-joint-list">
          {analysis.jointOptions.slice(0, 8).map((item) => (
            <section key={`${item.buildId}-${item.boosterName}`} className={item.rank === 1 ? 'is-winner' : ''}>
              <span>{item.rank}</span>
              <div><strong>{item.buildTitle} + {item.boosterName}</strong><small>{item.reason}</small><em>{item.skills.join(' • ')}</em></div>
              <aside><b>{item.overallScore}</b><small>nota final</small><span>Booster {item.boosterScore} • Sinergia {item.boosterSynergy}</span>{item.saturationPenalty > 0 && <span>Desperdício -{item.saturationPenalty}</span>}</aside>
            </section>
          ))}
        </div>
        <ul className="clean-list">{analysis.safeguards.map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
    </div>
  );
}
