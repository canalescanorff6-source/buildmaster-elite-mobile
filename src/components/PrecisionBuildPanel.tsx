'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, BadgeCheck, BrainCircuit, CheckCircle2, Gauge, RotateCcw, Save, ShieldCheck, SlidersHorizontal, Sparkles, Target, TriangleAlert } from 'lucide-react';
import type { AnalysisResult, TrainingKey, TrainingPlan } from '@/lib/analyzer';
import { TRAINING_LABELS } from '@/lib/trainingEngine';
import {
  buildFeedbackCorrection,
  buildPrecisionBuildReport,
  compareTrainingPlan,
  trainingPlanPoints,
  type MatchFeedbackKey
} from '@/lib/precisionBuildEngine';

const KEYS: TrainingKey[] = ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending','gk1','gk2','gk3'];
const FEEDBACK: Array<{ key: MatchFeedbackKey; label: string }> = [
  { key:'heavy', label:'Jogador pesado' },
  { key:'slowPass', label:'Passe lento' },
  { key:'poorFinishing', label:'Finalizou mal' },
  { key:'lostDuels', label:'Perdeu divididas' },
  { key:'tiredEarly', label:'Cansou cedo' },
  { key:'slowTurn', label:'Girou devagar' },
  { key:'goodMarking', label:'Marcou bem' },
  { key:'outOfPosition', label:'Ficou fora de posição' }
];

function clonePlan(plan: TrainingPlan): TrainingPlan {
  return { ...plan };
}

export function PrecisionBuildPanel({ result }: { result: AnalysisResult }) {
  const report = useMemo(() => buildPrecisionBuildReport(result), [result]);
  const [customPlan, setCustomPlan] = useState<TrainingPlan>(() => clonePlan(result.training));
  const [feedback, setFeedback] = useState<MatchFeedbackKey[]>([]);
  const [savedMessage, setSavedMessage] = useState('');
  const comparison = useMemo(() => compareTrainingPlan(result, customPlan), [result, customPlan]);
  const feedbackCorrection = useMemo(() => buildFeedbackCorrection(result, feedback), [result, feedback]);
  const activeKeys = KEYS.filter((key) => result.bestPosition.code === 'GK'
    ? key.startsWith('gk') || key === 'lowerBodyStrength' || key === 'aerialStrength'
    : !key.startsWith('gk'));

  useEffect(() => {
    setCustomPlan(clonePlan(result.training));
    setFeedback([]);
    setSavedMessage('');
  }, [result.parsed.internalId, result.bestPosition.code, result.trainingPointsTotal]);

  function changeTraining(key: TrainingKey, value: number) {
    setCustomPlan((current) => ({ ...current, [key]: Math.max(0, Math.min(16, Math.round(value))) }));
  }

  function toggleFeedback(key: MatchFeedbackKey) {
    setFeedback((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  function saveExperiment() {
    try {
      const storageKey = `buildmaster_precision_experiment_${result.parsed.internalId}_${result.bestPosition.code}`;
      localStorage.setItem(storageKey, JSON.stringify({
        savedAt: new Date().toISOString(),
        plan: customPlan,
        comparison,
        feedback,
        correction: feedbackCorrection
      }));
      setSavedMessage('Variante salva como teste. A ficha recomendada original foi preservada.');
    } catch {
      setSavedMessage('Não foi possível salvar a variante neste aparelho.');
    }
  }

  return (
    <section className="precision-build-shell">
      <article className="precision-build-hero luxury-panel">
        <div>
          <p className="kicker"><Sparkles size={15}/> v26.77 • Motor por identidade real</p>
          <h3>{report.identityLabel}</h3>
          <p>Ficha individual para <b>{report.selectedPosition.label}</b>, estilo <b>{report.officialPlaystyle ?? 'não confirmado'}</b> e função <b>{report.realFunction}</b>.</p>
          <div className="precision-build-tags">
            <span><BadgeCheck size={14}/> ID {report.identitySignature.slice(0, 14)}</span>
            <span><Target size={14}/> Posição soberana</span>
            <span><Gauge size={14}/> {result.trainingPointsUsed}/{result.trainingPointsTotal} pontos</span>
          </div>
        </div>
        <div className={`precision-budget-seal ${report.exactBudget ? 'ok' : 'warn'}`}>
          {report.exactBudget ? <CheckCircle2 size={28}/> : <TriangleAlert size={28}/>} 
          <strong>{report.exactBudget ? 'Orçamento exato' : 'Revisar pontos'}</strong>
          <span>{result.trainingPointsRemaining} restante(s)</span>
        </div>
      </article>

      <div className="precision-confidence-grid">
        {report.confidence.map((item) => (
          <article key={item.key} className={`precision-confidence-card status-${item.status}`}>
            <div><span>{item.label}</span><strong>{item.score}%</strong></div>
            <i><b style={{ width: `${item.score}%` }}/></i>
            <small>{item.note}</small>
          </article>
        ))}
      </div>

      <article className="luxury-panel precision-position-card">
        <div className="section-title-row"><div><p className="kicker"><Target size={14}/> Posição, estilo e função</p><h3>A escolha do usuário não é alterada</h3></div><span>{report.selectedPosition.label}</span></div>
        <p className="panel-note">{report.selectedPosition.reason}</p>
        <div className="precision-position-options">
          {report.recommendedPositions.map((position, index) => (
            <div key={position.code} className={index === 0 ? 'selected' : ''}>
              <span>{index === 0 ? 'Ficha principal' : index === 1 ? 'Melhor alternativa' : 'Alternativa secundária'}</span>
              <strong>{position.label}</strong>
              <b>{position.score}/100</b>
              <small>{position.note}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="luxury-panel precision-proposals-card">
        <div className="section-title-row"><div><p className="kicker"><BrainCircuit size={14}/> Três propostas completas</p><h3>Escolha rendimento, especialização ou segurança</h3></div><span>pontos exatos</span></div>
        <div className="precision-proposal-grid">
          {report.proposals.map((proposal) => (
            <div key={proposal.id} className={`precision-proposal proposal-${proposal.id}`}>
              <div className="precision-proposal-head"><span>{proposal.subtitle}</span><strong>{proposal.title}</strong><b>{proposal.score}/100</b></div>
              <div className="precision-proposal-metrics">
                <span>Identidade <b>{proposal.identityScore}</b></span>
                <span>Posição <b>{proposal.positionScore}</b></span>
                <span>Eficiência <b>{proposal.efficiencyScore}</b></span>
              </div>
              <div className="precision-plan-row">
                {activeKeys.filter((key) => Number(proposal.training[key] ?? 0) > 0).map((key) => <span key={key}>{TRAINING_LABELS[key]} <b>+{proposal.training[key]}</b></span>)}
              </div>
              <p>{proposal.why}</p>
              <details><summary>Ver ganhos e limitações</summary><div>{proposal.strengths.map((item) => <span key={item}>✓ {item}</span>)}{proposal.limitations.map((item) => <span key={item}>⚠ {item}</span>)}</div></details>
            </div>
          ))}
        </div>
      </article>

      <article className="luxury-panel precision-utility-card">
        <div className="section-title-row"><div><p className="kicker"><Activity size={14}/> Retorno marginal</p><h3>Faixas úteis por grupo de treino</h3></div><span>sem perseguir GER</span></div>
        <div className="precision-utility-list">
          {report.utilityBands.map((item) => (
            <div key={item.training} className={`utility-band-${item.band}`}>
              <div><strong>{item.label}</strong><span>{item.band}</span></div>
              <b>{item.current}</b>
              <small>Mínimo {item.functionalMin} • alvo {item.competitiveTarget} • teto {item.usefulCeiling}</small>
              <p>{item.recommendation}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="luxury-panel precision-skill-card">
        <div className="section-title-row"><div><p className="kicker"><ShieldCheck size={14}/> Habilidades e sinergias</p><h3>A habilidade precisa ser aproveitada em campo</h3></div><span>{report.skillSynergies.length} analisada(s)</span></div>
        {report.skillSynergies.length ? <div className="precision-synergy-grid">{report.skillSynergies.map((item) => <div key={item.name}><strong>{item.name}</strong><span>{item.status}</span><b>{item.score}/100</b><small>{item.note}</small></div>)}</div> : <p className="panel-note">Nenhuma habilidade especial foi confirmada para análise profunda. O motor mantém somente nomes oficiais conhecidos.</p>}
      </article>

      <article className="luxury-panel precision-custom-card">
        <div className="section-title-row"><div><p className="kicker"><SlidersHorizontal size={14}/> Comparador personalizado</p><h3>Teste mudanças sem destruir a ficha original</h3></div><span>{trainingPlanPoints(customPlan)}/{result.trainingPointsTotal}</span></div>
        <div className="precision-custom-grid">
          {activeKeys.map((key) => (
            <label key={key}>
              <span>{TRAINING_LABELS[key]}</span>
              <div><button type="button" onClick={() => changeTraining(key, Number(customPlan[key] ?? 0) - 1)}>-</button><input type="number" min={0} max={16} value={customPlan[key] ?? 0} onChange={(event) => changeTraining(key, Number(event.target.value))}/><button type="button" onClick={() => changeTraining(key, Number(customPlan[key] ?? 0) + 1)}>+</button></div>
            </label>
          ))}
        </div>
        <div className={`precision-comparison-verdict ${comparison.valid ? 'valid' : 'invalid'}`}>
          <div><strong>Sua variante: {comparison.score}/100</strong><span>{comparison.scoreDifference >= 0 ? '+' : ''}{comparison.scoreDifference} em relação à recomendada</span></div>
          <p>{comparison.verdict}</p>
          <div className="precision-change-columns"><span>{comparison.gains.length ? `Ganhos: ${comparison.gains.join(' • ')}` : 'Sem aumentos'}</span><span>{comparison.losses.length ? `Reduções: ${comparison.losses.join(' • ')}` : 'Sem reduções'}</span></div>
        </div>
        <div className="precision-custom-actions"><button type="button" onClick={() => setCustomPlan(clonePlan(result.training))}><RotateCcw size={16}/> Voltar à recomendada</button><button type="button" className="elite-button" onClick={saveExperiment} disabled={!comparison.valid}><Save size={16}/> Salvar como teste</button></div>
        {savedMessage && <p className="panel-note">{savedMessage}</p>}
      </article>

      <article className="luxury-panel precision-feedback-card">
        <div className="section-title-row"><div><p className="kicker"><BrainCircuit size={14}/> Feedback de partidas</p><h3>Correção personalizada sem sobrescrever</h3></div><span>confiança {feedbackCorrection.score}%</span></div>
        <div className="precision-feedback-chips">{FEEDBACK.map((item) => <button type="button" key={item.key} className={feedback.includes(item.key) ? 'active' : ''} onClick={() => toggleFeedback(item.key)}>{item.label}</button>)}</div>
        <p className="panel-note">{feedbackCorrection.verdict}</p>
        <div className="precision-feedback-list">{feedbackCorrection.suggestedChanges.map((item) => <div key={`${item.training}-${item.direction}`}><strong>{TRAINING_LABELS[item.training]}</strong><span>{item.direction === 'up' ? `Subir até +${item.amount}` : item.direction === 'down' ? `Reduzir até ${item.amount}` : 'Manter'}</span><small>{item.reason}</small></div>)}</div>
        {feedbackCorrection.safeguards.map((item) => <small key={item} className="precision-safeguard">• {item}</small>)}
      </article>

      <article className="luxury-panel precision-validation-card">
        <div className="section-title-row"><div><p className="kicker"><BadgeCheck size={14}/> Validação matemática</p><h3>Nenhuma ficha final com incoerência</h3></div><span>{report.strictValidation.filter((item) => item.ok).length}/{report.strictValidation.length}</span></div>
        <div className="precision-validation-grid">{report.strictValidation.map((item) => <div key={item.label} className={item.ok ? 'ok' : 'warn'}>{item.ok ? <CheckCircle2 size={18}/> : <TriangleAlert size={18}/>}<span><strong>{item.label}</strong><small>{item.note}</small></span></div>)}</div>
        <details className="settings-details-card"><summary>Por que esta ficha foi escolhida</summary><div>{report.explanation.map((item) => <p key={item} className="panel-note">• {item}</p>)}</div></details>
      </article>
    </section>
  );
}
