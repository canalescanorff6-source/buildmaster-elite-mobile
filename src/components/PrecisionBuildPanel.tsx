'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  ListChecks,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TriangleAlert,
  Users
} from 'lucide-react';
import type { AnalysisResult, TrainingKey, TrainingPlan } from '@/lib/analyzer';
import { TRAINING_LABELS } from '@/lib/trainingEngine';
import {
  buildFeedbackCorrection,
  buildPrecisionBuildReport,
  compareTrainingPlan,
  trainingPlanPoints,
  type MatchFeedbackKey
} from '@/lib/precisionBuildEngine';
import {
  buildAdvancedBuildIntelligence,
  type TacticalRoleEvaluation
} from '@/modules/builds/advancedBuildIntelligence';
import { safeStorageSetJson } from '@/lib/safeLocalStorage';
import { readAccountStorage } from '@/lib/accountStorage';
import {
  CREATOR_BUILD_RESEARCH_EVENT
} from '@/lib/creatorBuildResearch';
import {
  MATCH_VALIDATION_STORAGE_KEY,
  cardFingerprint,
  type MatchValidationRecord
} from '@/lib/appEvolution';
import type { MatchFeedback } from '@/lib/realMatchCalibration';
import { CALIBRATION_STORAGE_KEY } from '@/modules/matches/calibrationStorage';

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

type FichaWorkspaceView = 'resumo' | 'propostas' | 'inteligencia' | 'ajustar' | 'pos-jogo' | 'auditoria';
type ProposalId = 'competitive' | 'offensive' | 'balanced';

const WORKSPACE_VIEWS: Array<{ id: FichaWorkspaceView; label: string; hint: string }> = [
  { id: 'resumo', label: 'Resumo', hint: 'Ficha indicada' },
  { id: 'propostas', label: '3 perfis', hint: 'Comparar caminhos' },
  { id: 'inteligencia', label: 'Inteligência', hint: 'Função e aprendizado' },
  { id: 'ajustar', label: 'Ajustar', hint: 'Teste personalizado' },
  { id: 'pos-jogo', label: 'Pós-jogo', hint: 'Corrigir sensações' },
  { id: 'auditoria', label: 'Auditoria', hint: 'Confiança e regras' }
];

function clonePlan(plan: TrainingPlan): TrainingPlan {
  return { ...plan };
}

function loadMatchRecords(result: AnalysisResult): MatchValidationRecord[] {
  try {
    const parsed = JSON.parse(readAccountStorage(MATCH_VALIDATION_STORAGE_KEY) || '[]') as MatchValidationRecord[];
    if (!Array.isArray(parsed)) return [];
    const fingerprint = cardFingerprint(result);
    return parsed.filter((record) => record.cardFingerprint === fingerprint && record.targetPosition === result.bestPosition.code);
  } catch {
    return [];
  }
}

function loadCalibrationFeedbacks(result: AnalysisResult): MatchFeedback[] {
  try {
    const parsed = JSON.parse(readAccountStorage(CALIBRATION_STORAGE_KEY) || '{}') as Record<string, MatchFeedback[]>;
    const storageId = `${result.parsed.internalId}:${result.bestPosition.code}`;
    return Array.isArray(parsed[storageId]) ? parsed[storageId] : [];
  } catch {
    return [];
  }
}

export function PrecisionBuildPanel({ result }: { result: AnalysisResult }) {
  const report = useMemo(() => buildPrecisionBuildReport(result), [result]);
  const [activeView, setActiveView] = useState<FichaWorkspaceView>('resumo');
  const [activeProposalId, setActiveProposalId] = useState<ProposalId>('competitive');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [dataRevision, setDataRevision] = useState(0);
  const [customPlan, setCustomPlan] = useState<TrainingPlan>(() => clonePlan(result.training));
  const [feedback, setFeedback] = useState<MatchFeedbackKey[]>([]);
  const [savedMessage, setSavedMessage] = useState('');

  const intelligence = useMemo(() => buildAdvancedBuildIntelligence(result, {
    selectedRoleId,
    matchRecords: loadMatchRecords(result),
    calibrationFeedbacks: loadCalibrationFeedbacks(result)
  }), [result, selectedRoleId, dataRevision]);

  const comparison = useMemo(() => compareTrainingPlan(result, customPlan), [result, customPlan]);
  const feedbackCorrection = useMemo(() => buildFeedbackCorrection(result, feedback), [result, feedback]);
  const activeKeys = KEYS.filter((key) => result.bestPosition.code === 'GK'
    ? key.startsWith('gk') || key === 'lowerBodyStrength' || key === 'aerialStrength'
    : !key.startsWith('gk'));
  const activeProposal = intelligence.profileComparison.find((proposal) => proposal.id === activeProposalId)
    ?? intelligence.profileComparison[0];
  const selectedRole = intelligence.selectedRole;
  const validationPassed = report.strictValidation.filter((item) => item.ok).length;
  const confidenceAverage = report.confidence.length
    ? Math.round(report.confidence.reduce((total, item) => total + item.score, 0) / report.confidence.length)
    : 0;

  useEffect(() => {
    const refresh = () => setDataRevision((value) => value + 1);
    window.addEventListener(CREATOR_BUILD_RESEARCH_EVENT, refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener(CREATOR_BUILD_RESEARCH_EVENT, refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  useEffect(() => {
    setCustomPlan(clonePlan(result.training));
    setFeedback([]);
    setSavedMessage('');
    setActiveView('resumo');
    setActiveProposalId('competitive');
    setSelectedRoleId(null);
  }, [result.parsed.internalId, result.bestPosition.code, result.trainingPointsTotal]);

  function changeTraining(key: TrainingKey, value: number) {
    setCustomPlan((current) => ({ ...current, [key]: Math.max(0, Math.min(16, Math.round(value))) }));
  }

  function toggleFeedback(key: MatchFeedbackKey) {
    setFeedback((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  function saveExperiment() {
    const storageKey = `buildmaster_precision_experiment_${result.parsed.internalId}_${result.bestPosition.code}`;
    const saved = safeStorageSetJson(storageKey, {
      version: intelligence.version,
      savedAt: new Date().toISOString(),
      selectedProfile: activeProposalId,
      selectedRole: selectedRole.id,
      selectedRoleLabel: selectedRole.label,
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

  function useRolePlan(role: TacticalRoleEvaluation) {
    setSelectedRoleId(role.id);
    setCustomPlan(clonePlan(role.training));
    setActiveView('ajustar');
    setSavedMessage(`Plano da função “${role.label}” carregado no laboratório. Revise antes de salvar.`);
  }

  return (
    <section className="precision-build-shell ficha-workspace-shell">
      <article className="ficha-workspace-header luxury-panel">
        <div className="ficha-workspace-identity">
          <span className="ficha-workspace-icon"><Sparkles size={22}/></span>
          <div>
            <p className="kicker">Bloco 7 • inteligência avançada v{intelligence.version}</p>
            <h3>{report.identityLabel}</h3>
            <p><b>{report.selectedPosition.label}</b> • {report.officialPlaystyle ?? 'estilo pendente'} • {selectedRole.label}</p>
          </div>
        </div>
        <div className="ficha-workspace-status">
          <article className={report.exactBudget ? 'ok' : 'warn'}><Gauge size={17}/><span>Pontos</span><strong>{result.trainingPointsUsed}/{result.trainingPointsTotal}</strong></article>
          <article><Target size={17}/><span>Qualidade</span><strong>{activeProposal?.score ?? 0}/100</strong></article>
          <article><ShieldCheck size={17}/><span>Única</span><strong>{intelligence.identity.uniquenessScore}%</strong></article>
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
              <div><p className="kicker"><BadgeCheck size={14}/> Perfil em foco</p><h3>{activeProposal.title}</h3><span>{activeProposal.subtitle}</span></div>
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
              <div className="section-title-row"><div><p className="kicker"><Target size={14}/> Função tática atual</p><h3>{selectedRole.label}</h3></div><span>{selectedRole.fitScore}/100</span></div>
              <p>{selectedRole.summary}</p>
              <div className="ficha-fit-meta"><span>Posição preservada</span><strong>{intelligence.selectedPosition.preserved ? 'Sim' : 'Revisar'}</strong><span>Risco de clone</span><strong>{intelligence.identity.cloneRisk}</strong></div>
            </article>

            <article className="luxury-panel ficha-health-card">
              <div><span>Orçamento</span><strong className={report.exactBudget ? 'ok' : 'warn'}>{report.exactBudget ? 'Exato' : 'Revisar'}</strong></div>
              <div><span>Partidas aprendidas</span><strong>{intelligence.matchLearning.sampleCount}</strong></div>
              <div><span>Fontes aceitas</span><strong>{intelligence.creatorConsensus.sourceCount}</strong></div>
              <small>ID único: {intelligence.identity.fingerprint.slice(0, 22)}</small>
            </article>

            <button type="button" className="ficha-next-action" onClick={() => setActiveView('inteligencia')}>
              <BrainCircuit size={19}/><span><strong>Abrir inteligência completa</strong><small>Funções, pontos, criadores e partidas</small></span>
            </button>
          </aside>
        </div>
      )}

      {activeView === 'propostas' && (
        <div className="ficha-section-stack">
          <article className="luxury-panel precision-proposals-card ficha-section-card">
            <div className="section-title-row"><div><p className="kicker"><BrainCircuit size={14}/> Três perfis completos</p><h3>Ofensiva, equilibrada e competitiva</h3></div><span>mesmo orçamento real</span></div>
            <p className="panel-note">A competitiva busca o maior rendimento total. A ofensiva amplia a principal arma da carta. A equilibrada reduz oscilações e distribui responsabilidades.</p>
            <div className="precision-proposal-grid ficha-proposal-grid">
              {intelligence.profileComparison.map((proposal) => (
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
                  <button type="button" onClick={() => openProposal(proposal.id as ProposalId)}>{activeProposalId === proposal.id ? 'Perfil em foco' : 'Usar como foco'}</button>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel precision-position-card ficha-section-card">
            <div className="section-title-row"><div><p className="kicker"><Target size={14}/> Análise da posição escolhida</p><h3>A sua escolha continua soberana</h3></div><span>{report.selectedPosition.label}</span></div>
            <p className="panel-note">{intelligence.selectedPosition.explanation}</p>
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

      {activeView === 'inteligencia' && (
        <div className="ficha-section-stack advanced-build-intelligence">
          <article className="luxury-panel ficha-section-card">
            <div className="section-title-row"><div><p className="kicker"><Target size={14}/> Função tática</p><h3>Escolha como esta carta deve trabalhar</h3></div><span>{selectedRole.fitScore}/100</span></div>
            <p className="panel-note">Cada função gera uma distribuição própria com o orçamento exato, sem mudar a posição escolhida.</p>
            <div className="advanced-role-grid">
              {intelligence.tacticalRoles.map((role) => (
                <button type="button" key={role.id} className={role.recommended ? 'selected' : ''} onClick={() => setSelectedRoleId(role.id)}>
                  <span>{role.recommended ? 'Função selecionada' : 'Alternativa tática'}</span>
                  <strong>{role.label}</strong>
                  <b>{role.fitScore}/100</b>
                  <small>{role.summary}</small>
                  <em>{role.exactBudget ? `${role.pointsUsed}/${result.trainingPointsTotal} pontos exatos` : `${role.pointsUsed}/${result.trainingPointsTotal} pontos`}</em>
                </button>
              ))}
            </div>
            <div className="advanced-role-plan">
              <div>{activeKeys.filter((key) => Number(selectedRole.training[key] ?? 0) > 0).map((key) => <span key={key}>{TRAINING_LABELS[key]} <b>+{selectedRole.training[key]}</b></span>)}</div>
              <button type="button" className="elite-button" onClick={() => useRolePlan(selectedRole)}><SlidersHorizontal size={16}/> Testar esta função no laboratório</button>
            </div>
          </article>

          <article className="luxury-panel ficha-section-card">
            <div className="section-title-row"><div><p className="kicker"><ListChecks size={14}/> Justificativa ponto por ponto</p><h3>Por que cada grupo recebeu investimento</h3></div><span>{intelligence.pointJustifications.length} grupos</span></div>
            <div className="advanced-point-list">
              {intelligence.pointJustifications.map((item) => (
                <div key={item.training} className={`risk-${item.wasteRisk}`}>
                  <header><strong>{item.label} +{item.level}</strong><span>{item.totalCost} pts • retorno {item.returnLabel}</span></header>
                  <p>{item.reason}</p>
                  {item.supportedSkills.length > 0 && <small>Habilidades apoiadas: {item.supportedSkills.join(' • ')}</small>}
                  <em>{item.stopRule}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel ficha-section-card">
            <div className="section-title-row"><div><p className="kicker"><TriangleAlert size={14}/> Investimentos de baixo retorno</p><h3>Alertas antes de desperdiçar pontos</h3></div><span>{intelligence.wasteAlerts.length}</span></div>
            {intelligence.wasteAlerts.length > 0
              ? <div className="advanced-alert-list">{intelligence.wasteAlerts.map((item) => <div key={item}><TriangleAlert size={16}/><span>{item}</span></div>)}</div>
              : <p className="panel-note">Nenhum desperdício crítico foi detectado na função selecionada.</p>}
          </article>

          <div className="advanced-intelligence-columns">
            <article className="luxury-panel ficha-section-card">
              <div className="section-title-row"><div><p className="kicker"><Users size={14}/> Consenso de criadores</p><h3>Fontes compatíveis com a carta</h3></div><span>{intelligence.creatorConsensus.confidence}%</span></div>
              <p className="panel-note"><b>{intelligence.creatorConsensus.verdict}</b></p>
              <div className="advanced-mini-metrics">
                <div><span>Fontes aceitas</span><strong>{intelligence.creatorConsensus.sourceCount}</strong></div>
                <div><span>Carta exata</span><strong>{intelligence.creatorConsensus.exactCardCount}</strong></div>
                <div><span>Semelhança</span><strong>{intelligence.creatorConsensus.similarityScore}%</strong></div>
                <div><span>Custo consenso</span><strong>{intelligence.creatorConsensus.totalCost}</strong></div>
              </div>
              {intelligence.creatorConsensus.differences.slice(0, 6).map((item) => <div className="advanced-difference-row" key={item.training}><strong>{item.label}</strong><span>App +{item.appValue} • consenso +{item.consensusValue}</span><small>diferença {item.difference > 0 ? '+' : ''}{item.difference} • concordância {item.agreement}%</small></div>)}
              {intelligence.creatorConsensus.warnings.map((item) => <small className="precision-safeguard" key={item}>• {item}</small>)}
            </article>

            <article className="luxury-panel ficha-section-card">
              <div className="section-title-row"><div><p className="kicker"><BrainCircuit size={14}/> Aprendizado com partidas</p><h3>O histórico real corrige a teoria</h3></div><span>{intelligence.matchLearning.sampleCount} jogo(s)</span></div>
              <p className="panel-note"><b>{intelligence.matchLearning.recommendation}</b></p>
              <div className="advanced-mini-metrics">
                <div><span>Média</span><strong>{intelligence.matchLearning.average || '--'}</strong></div>
                <div><span>Consistência</span><strong>{intelligence.matchLearning.consistency}%</strong></div>
                <div><span>Confiança</span><strong>{intelligence.matchLearning.confidence}</strong></div>
                <div><span>Problemas</span><strong>{intelligence.matchLearning.repeatedProblems.length}</strong></div>
              </div>
              {intelligence.matchLearning.learnedPriorities.map((item) => <div className="advanced-difference-row" key={item.training}><strong>{item.label}</strong><span>Evidência {item.evidence}</span><small>{item.reason}</small></div>)}
              {!intelligence.matchLearning.learnedPriorities.length && <p className="panel-note">Registre três ou mais partidas com a mesma ficha para liberar prioridades aprendidas.</p>}
            </article>
          </div>
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
          <div className="precision-custom-actions"><button type="button" onClick={() => setCustomPlan(clonePlan(result.training))}><RotateCcw size={16}/> Voltar à competitiva</button><button type="button" className="elite-button" onClick={saveExperiment} disabled={!comparison.valid}><Save size={16}/> Salvar como teste</button></div>
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
            <div className="section-title-row"><div><p className="kicker"><Sparkles size={14}/> Habilidades especiais</p><h3>A habilidade precisa funcionar na posição e na função</h3></div><span>{intelligence.skillActivation.length} analisada(s)</span></div>
            {intelligence.skillActivation.length ? <div className="precision-synergy-grid">{intelligence.skillActivation.map((item) => <div key={item.name}><strong>{item.name}</strong><span>{item.status}</span><b>{item.score}/100</b><small>{item.supportedGroups.join(' • ')}</small><small>{item.note}</small></div>)}</div> : <p className="panel-note">Nenhuma habilidade especial foi confirmada para análise profunda. O motor mantém somente nomes oficiais conhecidos.</p>}
          </article>

          <article className="luxury-panel precision-validation-card ficha-section-card">
            <div className="section-title-row"><div><p className="kicker"><BadgeCheck size={14}/> Validação matemática</p><h3>Nenhuma ficha final com incoerência</h3></div><span>{validationPassed}/{report.strictValidation.length}</span></div>
            <div className="precision-validation-grid">{report.strictValidation.map((item) => <div key={item.label} className={item.ok ? 'ok' : 'warn'}>{item.ok ? <CheckCircle2 size={18}/> : <TriangleAlert size={18}/>}<span><strong>{item.label}</strong><small>{item.note}</small></span></div>)}</div>
            <details className="settings-details-card"><summary>Explicação completa da ficha</summary><div>{report.explanation.map((item) => <p key={item} className="panel-note">• {item}</p>)}{intelligence.safeguards.map((item) => <p key={item} className="panel-note">• {item}</p>)}</div></details>
          </article>
        </div>
      )}
    </section>
  );
}
