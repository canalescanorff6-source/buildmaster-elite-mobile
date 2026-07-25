'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Crosshair, Save, ShieldCheck, Target, Trophy } from 'lucide-react';
import type { AnalysisResult, TacticalFormation, TacticalStyle } from '@/lib/analyzer';
import type { OpponentProfile, OpponentStrength } from '@/lib/opponentAnalysis';
import { readOpponentMatchPlans, replaceOpponentMatchPlans } from './opponentPlanStorage';
import { buildOpponentMatchAssistant, type LiveMatchState, type OpponentPlanId } from './opponentMatchAssistant';

type Props = { results: AnalysisResult[]; ownFormation: TacticalFormation; ownStyle: TacticalStyle; opponentProfile: OpponentProfile; opponentFormation: TacticalFormation; opponentStrength: OpponentStrength };
export function OpponentMatchAssistantPanel(props: Props) {
  const [state, setState] = useState<LiveMatchState>('pre-match');
  const [minute, setMinute] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<OpponentPlanId | null>(null);
  const [message, setMessage] = useState('');
  const report = useMemo(() => buildOpponentMatchAssistant(props.results, props.ownFormation, props.ownStyle, { profile: props.opponentProfile, formation: props.opponentFormation, strength: props.opponentStrength }, state, minute), [minute, props.opponentFormation, props.opponentProfile, props.opponentStrength, props.ownFormation, props.ownStyle, props.results, state]);
  if (!report) return null;
  const activePlan = selectedPlan || report.activePlan;
  const plan = report.plans.find((item) => item.id === activePlan) || report.plans[0];

  function savePlan(): void {
    const current = readOpponentMatchPlans();
    replaceOpponentMatchPlans([{ id: `${Date.now()}`, createdAt: new Date().toISOString(), opponent: { profile: props.opponentProfile, formation: props.opponentFormation, strength: props.opponentStrength }, plan, report }, ...current]);
    setMessage('Plano salvo para revisão depois da partida.');
  }

  return <section className="bm2950-opponent-assistant" aria-labelledby="bm2950-opponent-title">
    <div className="bm2950-section-heading"><div><p className="kicker"><Crosshair size={15}/> Bloco 21</p><h3 id="bm2950-opponent-title">Assistente de adversário e plano de partida</h3><span>Plano A/B/C, gatilhos, marcações e mudanças conforme placar e minuto.</span></div><strong>{report.confidence}/100</strong></div>
    <div className="bm2950-live-controls">
      <label><span>Situação</span><select value={state} onChange={(event) => { setState(event.target.value as LiveMatchState); setSelectedPlan(null); }}><option value="pre-match">Pré-jogo</option><option value="drawing">Empatando</option><option value="winning">Vencendo</option><option value="losing">Perdendo</option></select></label>
      <label><span>Minuto</span><input type="range" min={0} max={120} value={minute} onChange={(event) => { setMinute(Number(event.target.value)); setSelectedPlan(null); }}/><b>{minute}&apos;</b></label>
      <button type="button" onClick={savePlan}><Save size={16}/> Salvar plano</button>
    </div>
    <div className="bm2950-headline"><Trophy size={18}/><span>{report.headline}</span></div>
    <nav className="bm2950-plan-tabs" aria-label="Planos contra o adversário">{report.plans.map((item) => <button type="button" key={item.id} className={item.id === activePlan ? 'active' : ''} onClick={() => setSelectedPlan(item.id)}><b>Plano {item.id}</b><span>{item.title.replace(/^Plano [ABC] — /, '')}</span><small>{item.formation} • risco {item.risk}</small></button>)}</nav>
    <div className="bm2950-plan-detail">
      <div className="bm2950-plan-title"><div><Target size={18}/><strong>{plan.title}</strong></div><span>{plan.formation} • {plan.style}</span></div><p>{plan.purpose}</p>
      <div className="bm2950-plan-columns">
        <article><strong><CheckCircle2 size={16}/> Instruções</strong>{plan.instructions.map((item) => <span key={item}>{item}</span>)}</article>
        <article><strong><Crosshair size={16}/> Marcações</strong>{plan.marking.map((item) => <span key={item}>{item}</span>)}</article>
        <article><strong><Clock3 size={16}/> Trocas e gatilhos</strong>{plan.substitutions.map((item) => <span key={item}>{item}</span>)}{plan.triggers.map((item) => <small key={item}>{item}</small>)}</article>
      </div>
    </div>
    <details className="bm2950-match-checklist"><summary>Checklist completo antes, intervalo e depois</summary><div><article><strong>Antes da partida</strong>{report.preMatchChecklist.map((item) => <span key={item}>{item}</span>)}</article><article><strong>Primeiros 15 minutos</strong>{report.first15Minutes.map((item) => <span key={item}>{item}</span>)}</article><article><strong>Intervalo</strong>{report.halftimeQuestions.map((item) => <span key={item}>{item}</span>)}</article><article><strong>Pós-jogo</strong>{report.postMatchQuestions.map((item) => <span key={item}>{item}</span>)}</article></div></details>
    <div className="bm2950-locks"><ShieldCheck size={18}/><div>{report.locks.map((item) => <span key={item}>{item}</span>)}</div></div>
    {message && <p className="bm2950-message" role="status">{message}</p>}
  </section>;
}
