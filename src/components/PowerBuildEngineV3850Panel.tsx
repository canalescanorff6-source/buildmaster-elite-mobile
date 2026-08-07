'use client';

import { Activity, CheckCircle2, Gauge, ShieldCheck, Sparkles, Target, Zap } from 'lucide-react';
import type { AnalysisResult, PowerBuildScoreDimensions } from '@/lib/analyzerDomain';
import { TRAINING_LABELS } from '@/lib/trainingEngine';

const DIMENSION_LABELS: Record<keyof PowerBuildScoreDimensions, string> = {
  roleExecution: 'Função',
  functionalThresholds: 'Pisos',
  pointEfficiency: 'Eficiência',
  responsiveness: 'Resposta',
  identityPreservation: 'DNA',
  specialSkillActivation: 'Especiais',
  skillCoverage: 'Top 5',
  impetoSynergy: 'Ímpeto',
  onlineRobustness: 'Online',
  antiOverallWaste: 'Antidesperdício',
  exactBudget: 'Orçamento',
  confidenceSafety: 'Segurança'
};

function trainingSummary(plan: AnalysisResult['training']) {
  return Object.entries(plan)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${TRAINING_LABELS[key as keyof typeof TRAINING_LABELS]} +${value}`)
    .join(' • ');
}

export function PowerBuildEngineV3850Panel({ result }: { result: AnalysisResult }) {
  const analysis = result.powerBuildV3850;
  if (!analysis) return null;

  return (
    <div className="advanced-motor-v3750 power-build-v3850">
      <article className="luxury-panel wide-card advanced-motor-hero">
        <div className="section-title-row">
          <div><p className="kicker"><Zap size={15}/> Motor de Desempenho v38.50</p><h3>Ficha poderosa por função, não por overall</h3></div>
          <span>{analysis.confidence}% confiança</span>
        </div>
        <div className="advanced-motor-winner">
          <div><Target size={22}/><span>Ficha vencedora</span><strong>{analysis.winner.title}</strong><small>{analysis.winner.performanceScore}/100 desempenho</small></div>
          <div><Gauge size={22}/><span>Eficiência dos pontos</span><strong>{analysis.winner.dimensions.pointEfficiency}/100</strong><small>{analysis.winner.pointsUsed}/{result.trainingPointsTotal} pontos exatos</small></div>
          <div><Sparkles size={22}/><span>Top 5 funcional</span><strong>{analysis.winner.dimensions.skillCoverage}/100</strong><small>sem repetição e sem habilidade fora da função</small></div>
          <div><ShieldCheck size={22}/><span>Ímpeto final</span><strong>{analysis.impetos[0]?.name ?? 'Revisar'}</strong><small>{analysis.impetos[0]?.performanceScore ?? 0}/100 sinergia final</small></div>
        </div>
        <p className="panel-note">{analysis.summary}</p>
        <div className="chip-cloud">{analysis.improvements.map((item, index) => <span key={item}>{String(index + 1).padStart(2, '0')} · {item}</span>)}</div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Activity size={15}/> Finalistas funcionais</p><h3>{analysis.candidatesEvaluated} fichas comparadas com custo real</h3></div><span>Top {analysis.finalists.length}</span></div>
        <div className="advanced-build-grid">
          {analysis.finalists.map((item, index) => (
            <section key={item.id} className={index === 0 ? 'is-winner' : ''}>
              <header><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><small>{item.source}</small></div><em>{item.performanceScore}/100</em></header>
              <p>{trainingSummary(item.training)}</p>
              <div className="advanced-score-row"><span>Função <b>{item.dimensions.roleExecution}</b></span><span>Eficiência <b>{item.dimensions.pointEfficiency}</b></span><span>DNA <b>{item.dimensions.identityPreservation}</b></span></div>
              <small>{item.thresholdsMet}/{item.thresholdsTotal} pisos • {item.exactBudget ? 'orçamento exato' : 'revisar orçamento'}</small>
              <ul>{item.strengths.map((text) => <li key={text}>{text}</li>)}</ul>
              <footer>{item.tradeOffs.join(' ')}</footer>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Gauge size={15}/> Matriz de desempenho</p><h3>A vencedora medida em 12 dimensões reais</h3></div><span>GER fora da decisão</span></div>
        <div className="data-grid">
          {Object.entries(analysis.winner.dimensions).map(([key, value]) => (
            <div key={key}><span>{DIMENSION_LABELS[key as keyof PowerBuildScoreDimensions]}</span><strong>{value}/100</strong></div>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Sparkles size={15}/> Cinco habilidades definitivas</p><h3>Frequência, cobertura e redundância verificadas</h3></div><span>{analysis.skills.length}/5</span></div>
        <div className="advanced-skill-set-grid">
          {analysis.skills.map((item, index) => (
            <section key={item.name} className={index === 0 ? 'is-winner' : ''}>
              <header><strong>{index + 1}. {item.name}</strong><em>{item.score}/100</em></header>
              <p>{item.gameplayImpact}</p>
              <div className="advanced-score-row"><span>Ativação <b>{item.activationFrequency}</b></span><span>Categoria <b>{item.category}</b></span><span>Redundância <b>-{item.redundancyPenalty}</b></span></div>
              <small>Cobre: {item.coverageRole}</small>
              <ul>{item.reasons.slice(0, 3).map((reason) => <li key={reason}><CheckCircle2 size={13}/>{reason}</li>)}</ul>
            </section>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><ShieldCheck size={15}/> Ímpetos recalculados</p><h3>Escolhidos somente após ficha e habilidades</h3></div><span>Top {Math.min(analysis.impetos.length, 8)}</span></div>
        <div className="advanced-joint-list">
          {analysis.impetos.slice(0, 8).map((item, index) => (
            <section key={item.name} className={index === 0 ? 'is-winner' : ''}>
              <span>{index + 1}</span>
              <div><strong>{item.name}</strong><small>{item.reason}</small><em>{item.supportedGroups.map((key) => TRAINING_LABELS[key]).join(' • ') || 'sem grupo confirmado'}</em></div>
              <aside><b>{item.performanceScore}</b><small>desempenho</small><span>Função {item.roleFit} • Ficha {item.buildSynergy}</span>{item.saturationPenalty > 0 && <span>Saturação -{item.saturationPenalty}</span>}</aside>
            </section>
          ))}
        </div>
        <ul className="clean-list">{analysis.guardrails.map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
    </div>
  );
}
