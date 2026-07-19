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
import { safeStorageSetJson } from '@/lib/safeLocalStorage';

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

type FichaWorkspaceView = 'resumo' | 'propostas' | 'ajustar' | 'pos-jogo' | 'auditoria';
type ProposalId = 'recommended' | 'aggressive' | 'safe';

const WORKSPACE_VIEWS: Array<{ id: FichaWorkspaceView; label: string; hint: string }> = [
  { id: 'resumo', label: 'Resumo', hint: 'Ficha indicada' },
  { id: 'propostas', label: '3 propostas', hint: 'Comparar caminhos' },
  { id: 'ajustar', label: 'Ajustar', hint: 'Teste personalizado' },
  { id: 'pos-jogo', label: 'Pós-jogo', hint: 'Corrigir sensações' },
  { id: 'auditoria', label: 'Auditoria', hint: 'Confiança e regras' }
];

function clonePlan(plan: TrainingPlan): TrainingPlan {
  return { ...plan };
}

export function PrecisionBuildPanel({ result }: { result: AnalysisResult }) {
  const report = useMemo(() => buildPrecisionBuildReport(result), [result]);
  const [activeView, setActiveView] = useState<FichaWorkspaceView>('resumo');
  const [activeProposalId, setActiveProposalId] = useState<ProposalId>((report.proposals[0]?.id ?? 'recommended') as ProposalId);
  const [customPlan, setCustomPlan] = useState<TrainingPlan>(() => clonePlan(result.training));
  const [feedback, setFeedback] = useState<MatchFeedbackKey[]>([]);
  const [savedMessage, setSavedMessage] = useState('');
  const comparison = useMemo(() => compareTrainingPlan(result, customPlan), [result, customPlan]);
  const feedbackCorrection = useMemo(() => buildFeedbackCorrection(result, feedback), [result, feedback]);
  const activeKeys = KEYS.filter((key) => result.bestPosition.code === 'GK'
    ? key.startsWith('gk') || key === 'lowerBodyStrength' || key === 'aerialStrength'
    : !key.startsWith('gk'));
  const activeProposal = report.proposals.find((proposal) => proposal.id === activeProposalId) ?? report.proposals[0];
  const validationPassed = report.strictValidation.filter((item) => item.ok).length;
  const confidenceAverage = report.confidence.length
    ? Math.round(report.confidence.reduce((total, item) => total + item.score, 0) / report.confidence.length)
    : 0;

  useEffect(() => {
    setCustomPlan(clonePlan(result.training));
    setFeedback([]);
    setSavedMessage('');
    setActiveView('resumo');
    setActiveProposalId((report.proposals[0]?.id ?? 'recommended') as ProposalId);
  }, [result.parsed.internalId, result.bestPosition.code, result.trainingPointsTotal, report.proposals]);

  function changeTraining(key: TrainingKey, value: number) {
    setCustomPlan((current) => ({ ...current, [key]: Math.max(0, Math.min(16, Math.round(value))) }));
  }

  function toggleFeedback(key: MatchFeedbackKey) {
    setFeedback((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  function saveExperiment() {
    const storageKey = `buildmaster_precision_experiment_${result.parsed.internalId}_${result.bestPosition.code}`;
    const saved = safeStorageSetJson(storageKey, {
      savedAt: new Date().toISOString(),
      plan: customPlan,
      comparison,
      feedback,
      correction: feedbackCorrection
    });
    setSavedMessage(saved
      ? 'Variante salva como teste. A ficha recomendada original foi preservada.'
      : 'Não foi possível salvar a variante neste aparelho.');
  }

  function openProposal(id: ProposalId) {
    setActiveProposalId(id);
    setActiveView('resumo');
  }

  return (
    <section className="precision-build-shell ficha-workspace-shell">
      <article className="ficha-workspace-header luxury-panel">
        <div className="ficha-workspace-identity">
          <span className="ficha-workspace-icon"><Sparkles size={22}/></span>
          <div>
            <p className="kicker">Ficha organizada • identidade real</p>
            <h3>{report.identityLabel}</h3>
            <p><b>{report.selectedPosition.label}</b> • {report.officialPlaystyle ?? 'estilo pendente'} • {report.realFunction}</p>
          </div>
        </div>
        <div className="ficha-workspace-status">
          <article className={report.exactBudget ? 'ok' : 'warn'}><Gauge size={17}/><span>Pontos</span><strong>{result.trainingPointsUsed}/{result.trainingPointsTotal}</strong></article>
          <article><Target size={17}/><span>Qualidade</span><strong>{activeProposal?.score ?? 0}/100</strong></article>
          <article><ShieldCheck size={17}/><span>Confiança</span><strong>{confidenceAverage}%</strong></article>
        </div>
      </article>

      <nav className="ficha-workspace-nav luxury-panel" aria-label="Etapas da ficha">
        {WORKSPACE_VIEWS.map((view, index) => (
          <button key={view.id} type="button" className={activeView === view.id ? 'active' : ''} onClick={() => setActiveView(view.id)}>
            <span>{index + 1}</span>
            <div><strong>{view.label}</strong><small>{view.hint}</small></div>
          </button>
        ))}
      </nav>

      {activeView === 'resumo' && activeProposal && (
        <div className="ficha-overview-layout">
          <article className="ficha-recommended-card luxury-panel">
            <div className="ficha-recommended-head">
              <div><p className="kicker"><BadgeCheck size={14}/> Proposta em foco</p><h3>{activeProposal.title}</h3><span>{activeProposal.subtitle}</span></div>
              <strong>{activeProposal.score}<small>/100</small></strong>
            </div>

            <div className="ficha-plan-summary">
              {activeKeys.filter((key) => Number(activeProposal.training[key] ?? 0) > 0).map((key) => (
                <div key={key}><span>{TRAINING_LABELS[key]}</span><strong>+{activeProposal.training[key]}</strong></div>
              ))}
            </div>

            <div className="ficha-reason-box">
              <strong>Por que esta ficha encaixa</strong>
              <p>{activeProposal.why}</p>
              <div>{activeProposal.strengths.slice(0, 3).map((item) => <span key={item}><CheckCircle2 size={14}/> {item}</span>)}</div>
            </div>

            {activeProposal.limitations.length > 0 && (
              <div className="ficha-limit-box"><TriangleAlert size={17}/><div><strong>Limite consciente</strong><span>{activeProposal.limitations[0]}</span></div></div>
            )}
          </article>

          <aside className="ficha-overview-side">
            <article className="luxury-panel ficha-fit-card">
              <div className="section-title-row"><div><p className="kicker"><Target size={14}/> Encaixe principal</p><h3>{report.selectedPosition.label}</h3></div><span>{report.recommendedPositions[0]?.score ?? 0}/100</span></div>
              <p>{report.selectedPosition.reason}</p>
              <div className="ficha-fit-meta"><span>Estilo</span><strong>{report.officialPlaystyle ?? 'Confirmar'}</strong><span>Função</span><strong>{report.realFunction}</strong></div>
            </article>

            <article className="luxury-panel ficha-health-card">
              <div><span>Orçamento</span><strong className={report.exactBudget ? 'ok' : 'warn'}>{report.exactBudget ? 'Exato' : 'Revisar'}</strong></div>
              <div><span>Validações</span><strong>{validationPassed}/{report.strictValidation.length}</strong></div>
              <div><span>Habilidades analisadas</span><strong>{report.skillSynergies.length}</strong></div>
              <small>ID da carta: {report.identitySignature.slice(0, 18)}</small>
            </article>

            <button type="button" className="ficha-next-action" onClick={() => setActiveView('propostas')}>
              <BrainCircuit size={19}/><span><strong>Comparar as 3 propostas</strong><small>Veja o que muda em cada construção</small></span>
            </button>
          </aside>
        </div>
      )}

      {activeView === 'propostas' && (
        <div className="ficha-section-stack">
          <article className="luxury-panel precision-proposals-card ficha-section-card">
            <div className="section-title-row"><div><p className="kicker"><BrainCircuit size={14}/> Três caminhos completos</p><h3>Compare antes de decidir</h3></div><span>todos com pontos exatos</span></div>
            <p className="panel-note">A recomendada busca o melhor conjunto. A agressiva reforça a arma principal. A segura reduz fraquezas.</p>
            <div className="precision-proposal-grid ficha-proposal-grid">
              {report.proposals.map((proposal) => (
                <div key={proposal.id} className={`precision-proposal proposal-${proposal.id} ${activeProposalId === proposal.id ? 'selected' : ''}`}>
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
                  <details><summary>Ganhos e limitações</summary><div>{proposal.strengths.map((item) => <span key={item}>✓ {item}</span>)}{proposal.limitations.map((item) => <span key={item}>⚠ {item}</span>)}</div></details>
                  <button type="button" onClick={() => openProposal(proposal.id as ProposalId)}>{activeProposalId === proposal.id ? 'Proposta em foco' : 'Usar como foco'}</button>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel precision-position-card ficha-section-card">
            <div className="section-title-row"><div><p className="kicker"><Target size={14}/> Posição e alternativas</p><h3>A sua escolha continua soberana</h3></div><span>{report.selectedPosition.label}</span></div>
            <div className="precision-position-options">
              {report.recommendedPositions.map((position, index) => (
                <div key={position.code} className={index === 0 ? 'selected' : ''}>
                  <span>{index === 0 ? 'Ficha principal' : index === 1 ? 'Melhor alternativa' : 'Alternativa secundária'}</span>
                  <strong>{position.label}</strong><b>{position.score}/100</b><small>{position.note}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel precision-utility-card ficha-section-card">
            <div className="section-title-row"><div><p className="kicker"><Activity size={14}/> Retorno dos pontos</p><h3>Onde investir e onde parar</h3></div><span>sem perseguir GER</span></div>
            <div className="precision-utility-list">
              {report.utilityBands.map((item) => (
                <div key={item.training} className={`utility-band-${item.band}`}>
                  <div><strong>{item.label}</strong><span>{item.band}</span></div><b>{item.current}</b>
                  <small>Mínimo {item.functionalMin} • alvo {item.competitiveTarget} • teto {item.usefulCeiling}</small><p>{item.recommendation}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}

      {activeView === 'ajustar' && (
        <article className="luxury-panel precision-custom-card ficha-section-card">
          <div className="section-title-row"><div><p className="kicker"><SlidersHorizontal size={14}/> Laboratório pessoal</p><h3>Teste mudanças sem destruir a ficha original</h3></div><span>{trainingPlanPoints(customPlan)}/{result.trainingPointsTotal}</span></div>
          <p className="panel-note">Altere um grupo por vez. A nota e o diagnóstico são atualizados imediatamente.</p>
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
      )}

      {activeView === 'pos-jogo' && (
        <article className="luxury-panel precision-feedback-card ficha-section-card">
          <div className="section-title-row"><div><p className="kicker"><BrainCircuit size={14}/> Ajuste depois da partida</p><h3>Transforme sensação em correção objetiva</h3></div><span>confiança {feedbackCorrection.score}%</span></div>
          <p className="panel-note">Marque somente o que realmente se repetiu nas partidas. O app sugere; você decide.</p>
          <div className="precision-feedback-chips">{FEEDBACK.map((item) => <button type="button" key={item.key} className={feedback.includes(item.key) ? 'active' : ''} onClick={() => toggleFeedback(item.key)}>{item.label}</button>)}</div>
          <div className="ficha-feedback-verdict"><strong>Diagnóstico atual</strong><p>{feedbackCorrection.verdict}</p></div>
          <div className="precision-feedback-list">{feedbackCorrection.suggestedChanges.map((item) => <div key={`${item.training}-${item.direction}`}><strong>{TRAINING_LABELS[item.training]}</strong><span>{item.direction === 'up' ? `Subir até +${item.amount}` : item.direction === 'down' ? `Reduzir até ${item.amount}` : 'Manter'}</span><small>{item.reason}</small></div>)}</div>
          {feedbackCorrection.safeguards.map((item) => <small key={item} className="precision-safeguard">• {item}</small>)}
        </article>
      )}

      {activeView === 'auditoria' && (
        <div className="ficha-section-stack">
          <article className="luxury-panel ficha-section-card">
            <div className="section-title-row"><div><p className="kicker"><ShieldCheck size={14}/> Confiança dos dados</p><h3>Veja o que está confirmado e o que precisa de atenção</h3></div><span>{confidenceAverage}% média</span></div>
            <div className="precision-confidence-grid">
              {report.confidence.map((item) => (
                <div key={item.key} className={`precision-confidence-card status-${item.status}`}>
                  <div><span>{item.label}</span><strong>{item.score}%</strong></div><i><b style={{ width: `${item.score}%` }}/></i><small>{item.note}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel precision-skill-card ficha-section-card">
            <div className="section-title-row"><div><p className="kicker"><Sparkles size={14}/> Habilidades e sinergias</p><h3>A habilidade precisa funcionar na posição escolhida</h3></div><span>{report.skillSynergies.length} analisada(s)</span></div>
            {report.skillSynergies.length ? <div className="precision-synergy-grid">{report.skillSynergies.map((item) => <div key={item.name}><strong>{item.name}</strong><span>{item.status}</span><b>{item.score}/100</b><small>{item.note}</small></div>)}</div> : <p className="panel-note">Nenhuma habilidade especial foi confirmada para análise profunda. O motor mantém somente nomes oficiais conhecidos.</p>}
          </article>

          <article className="luxury-panel precision-validation-card ficha-section-card">
            <div className="section-title-row"><div><p className="kicker"><BadgeCheck size={14}/> Validação matemática</p><h3>Nenhuma ficha final com incoerência</h3></div><span>{validationPassed}/{report.strictValidation.length}</span></div>
            <div className="precision-validation-grid">{report.strictValidation.map((item) => <div key={item.label} className={item.ok ? 'ok' : 'warn'}>{item.ok ? <CheckCircle2 size={18}/> : <TriangleAlert size={18}/>}<span><strong>{item.label}</strong><small>{item.note}</small></span></div>)}</div>
            <details className="settings-details-card"><summary>Explicação completa da ficha</summary><div>{report.explanation.map((item) => <p key={item} className="panel-note">• {item}</p>)}</div></details>
          </article>
        </div>
      )}
    </section>
  );
}
