'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Brain, CheckCircle2, Clock3, Download, History, Pause, Play, Plus, RotateCcw, ShieldCheck, Target, Trophy, Users, Video, Wifi } from 'lucide-react';
import type { IntegratedPlayerRecord, MatchScenarioPlan, TeamDiagnosis } from '@/modules/core/centralIntelligence';
import type { TacticalStyle } from '@/lib/analyzer';
import { TrainingEvolutionCenter } from '@/modules/training/TrainingEvolutionCenter';
import { CompetitivePerformanceCenter } from './CompetitivePerformanceCenter';
import { MatchTrainerCenter } from './MatchTrainerCenter';
import { AntiDelayCenter } from '@/modules/performance/AntiDelayCenter';
import { SmartCoachCenter } from '@/modules/coaching/SmartCoachCenter';
import type { MatchValidationRecord } from '@/lib/appEvolution';
import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';
import { PremiumScreenHero } from '@/components/PremiumScreenPrimitives';
import { OBSERVABILITY_EVENT, readFeatureFlags, type FeatureFlagState } from '@/modules/observability/observabilityEngine';
import { buildGameplayCalibrationBridgeR516 } from '@/modules/analysis/gameplayCalibrationBridgeR516';
import { buildRealMatchCalibrationEvidenceR518, type RealMatchCalibrationContextR518 } from '@/modules/analysis/realMatchCalibrationEvidenceR518';
import { buildBuildOutcomeCalibrationR460 } from './buildOutcomeCalibrationR460';

type MatchTab = 'gravar' | 'competitivo' | 'anti-delay' | 'treinador' | 'treinar' | 'planejar' | 'executar' | 'analisar';
type TrainingLog = { id: string; at: string; error: string; repetitions: number; seconds: number };
const TRAINING_LOG_KEY = 'buildmaster_guided_training_logs_v2739';
const WEEKLY_GOAL_KEY = 'buildmaster_weekly_training_goal_v2739';
const ERROR_OPTIONS = ['Passe precipitado', 'Demora para soltar a bola', 'Marcação atrasada', 'Finalização forçada', 'Perdeu a compactação', 'Troca de jogador errada'];
const R518_STATUS_LABELS = {
  INSUFFICIENT_EVIDENCE: 'Evidência insuficiente',
  COLLECTING: 'Coletando evidência',
  READY_FOR_REVIEW: 'Pronto para revisão',
  READY_FOR_R510_PROMOTION: 'Gate de promoção atingido',
  BLOCKED: 'Bloqueado',
} as const;
const R518_REQUIREMENT_LABELS: Record<string, string> = {
  REAL_MATCH_EVIDENCE_REQUIRED: 'Partidas reais e contextos completos',
  PERSISTED_REAL_EVIDENCE_REQUIRED: 'Evidência persistida no R137',
  GLOBAL_MATCH_VOLUME: '24 partidas reais',
  GLOBAL_SESSION_DIVERSITY: '6 sessões distintas',
  GLOBAL_CONTEXT_DIVERSITY: '3 contextos prontos',
  GLOBAL_PRIMITIVE_FAMILY_COVERAGE: '3 famílias de ações',
  GLOBAL_FUNCTION_POSITION_DIVERSITY: '3 combinações posição/função',
};

function requirementLabelR518(id: string) {
  return R518_REQUIREMENT_LABELS[id] ?? id.replace(/_/g, ' ').toLowerCase();
}

function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function MatchLaboratory({ team, players, records, plans, teamStyle, onValidatePlayer, onOpenTeam }: { team: TeamDiagnosis; players: IntegratedPlayerRecord[]; records: MatchValidationRecord[]; plans: MatchScenarioPlan[]; teamStyle: TacticalStyle; onValidatePlayer: (id: string) => void; onOpenTeam: () => void }) {
  const [tab, setTab] = useState<MatchTab>('competitivo');
  const [activePlan, setActivePlan] = useState<MatchScenarioPlan['id']>('control');
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [repetitions, setRepetitions] = useState(0);
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [logs, setLogs] = useState<TrainingLog[]>(() => safeStorageGetJson<TrainingLog[]>(TRAINING_LOG_KEY, []));
  const [weeklyGoal, setWeeklyGoal] = useState(() => safeStorageGetJson<number>(WEEKLY_GOAL_KEY, 3));
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagState>(() => readFeatureFlags());
  const panelRef = useRef<HTMLDivElement | null>(null);
  const current = plans.find((plan) => plan.id === activePlan) ?? plans[0];
  const validationQueue = useMemo(() => players.filter((player) => player.status === 'completo').sort((a, b) => a.matchCount - b.matchCount || b.efficiency - a.efficiency).slice(0, 6), [players]);
  const recent = useMemo(() => [...records].sort((a, b) => b.playedAt.localeCompare(a.playedAt)).slice(0, 8), [records]);
  const weekStart = useMemo(() => { const now = new Date(); const day = (now.getDay() + 6) % 7; now.setHours(0,0,0,0); now.setDate(now.getDate() - day); return now; }, []);
  const weeklySessions = useMemo(() => logs.filter((item) => new Date(item.at) >= weekStart).length, [logs, weekStart]);
  const r518Contexts = useMemo<RealMatchCalibrationContextR518[]>(() => players.flatMap((player) => {
    const savedOutcomeR460 = player.result.buildOutcomeCalibrationR460;
    const learningR470 = player.result.intelligentLearningR470;
    const lifecycleR472 = player.result.motorLabLifecycleR472;
    if (!savedOutcomeR460 || !learningR470 || !lifecycleR472) return [];
    const outcomeR460 = buildBuildOutcomeCalibrationR460(player.result, records);
    const bridgeR516 = buildGameplayCalibrationBridgeR516({ outcome: outcomeR460, proposal: learningR470.proposal });
    const generation = outcomeR460.currentGenerationSignatureR464;
    return [{ contextKey: `${outcomeR460.cardFingerprint}:${outcomeR460.position}:${outcomeR460.usageFunction}:${generation}`, outcomeR460, learningR470, lifecycleR472, bridgeR516 }];
  }), [players, records]);
  const r518Readiness = useMemo(() => buildRealMatchCalibrationEvidenceR518({ origin: 'PERSISTED_REAL', records, contexts: r518Contexts }), [records, r518Contexts]);
  const r518Pending = useMemo(() => [...new Set([...r518Readiness.blockers, ...r518Readiness.missingRequirements])].slice(0, 5), [r518Readiness]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    const refreshFlags = () => setFeatureFlags(readFeatureFlags());
    window.addEventListener(OBSERVABILITY_EVENT, refreshFlags);
    return () => window.removeEventListener(OBSERVABILITY_EVENT, refreshFlags);
  }, []);

  useEffect(() => {
    if (tab === 'anti-delay' && !featureFlags.antiDelay) setTab('competitivo');
    if (tab === 'treinador' && !featureFlags.smartCoach) setTab('competitivo');
  }, [featureFlags.antiDelay, featureFlags.smartCoach, tab]);

  function selectTab(next: MatchTab) {
    setTab(next);
    window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function toggleError(error: string) {
    setSelectedErrors((current) => current.includes(error) ? current.filter((item) => item !== error) : [...current, error]);
  }

  function saveTrainingLog() {
    const errorText = selectedErrors.join(' • ') || 'Treino concluído sem erro marcado';
    const entry: TrainingLog = { id: `training-${Date.now()}`, at: new Date().toISOString(), error: errorText, repetitions, seconds };
    const next = [entry, ...logs].slice(0, 120);
    setLogs(next);
    safeStorageSetJson(TRAINING_LOG_KEY, next);
    setRunning(false);
    setSeconds(0);
    setRepetitions(0);
    setSelectedErrors([]);
    selectTab('analisar');
  }

  function changeGoal(value: number) {
    setWeeklyGoal(value);
    safeStorageSetJson(WEEKLY_GOAL_KEY, value);
  }

  function exportWeeklyPlan() {
    const lines = [
      'BuildMaster — Plano semanal',
      `Formação: ${team.formation}`,
      `Meta: ${weeklyGoal} sessões`,
      `Realizadas: ${weeklySessions}`,
      '',
      ...plans.map((plan) => `${plan.label}: ${plan.objective}\n- ${plan.formationAdvice}\n- ${plan.playerProfile}`),
      '',
      'Erros recentes:',
      ...logs.slice(0, 10).map((item) => `${new Date(item.at).toLocaleString('pt-BR')} — ${item.error} — ${item.repetitions} repetições — ${item.seconds}s`)
    ];
    downloadText(`buildmaster-plano-semanal-${new Date().toISOString().slice(0,10)}.txt`, lines.join('\n'));
  }

  return <section className="v27-module v27-match-lab refined-match-lab bm2820-screen bm2820-performance-screen">
    <PremiumScreenHero
      icon={Target}
      eyebrow="Centro de performance"
      title="Treino, partida e evolução em um só lugar."
      description="Escolha uma guia e o app leva você direto ao painel correspondente."
      badge={`${weeklySessions}/${weeklyGoal} sessões na semana`}
      actions={<><button type="button" className="elite-button" onClick={onOpenTeam}><Users size={17}/> Rever meu time</button><button type="button" onClick={exportWeeklyPlan}><Download size={17}/> Exportar semana</button></>}
      metrics={[
        { label: 'Prontidão', value: team.globalScore, hint: `formação ${team.formation}`, tone: team.globalScore >= 80 ? 'positive' : 'warning' },
        { label: 'Partidas', value: records.length, hint: 'registros reais', tone: 'accent' },
        { label: 'Testes pendentes', value: validationQueue.length, hint: 'fichas na fila', tone: validationQueue.length ? 'warning' : 'positive' },
        { label: 'Treinos locais', value: logs.length, hint: 'sessões salvas' }
      ]}
    />

    <article className="v27-scenario-card luxury-panel" aria-label="Evidência real R510 / R518">
      <div className="v27-panel-heading"><div><p className="kicker"><ShieldCheck size={14}/> R137 persistido • R518 read-only</p><h3>Evidência real R510 / R518</h3></div><span>{R518_STATUS_LABELS[r518Readiness.status]}</span></div>
      <div className="v27-scenario-sections">
        <div><strong>Partidas reais</strong><span>{r518Readiness.evidenceSummary.totalRecords}/24 • {r518Readiness.evidenceSummary.distinctSessions}/6 sessões</span></div>
        <div><strong>Contextos avaliáveis</strong><span>{r518Readiness.evidenceSummary.readyContexts}/{r518Readiness.evidenceSummary.totalContexts} prontos</span></div>
        <div><strong>Cobertura funcional</strong><span>{r518Readiness.coverage.functionalContexts.join(' • ') || 'Contextos funcionais ainda não consolidados.'}</span></div>
        <div><strong>Próximos critérios</strong>{r518Pending.length ? r518Pending.map((item) => <span key={item}><Clock3 size={14}/>{requirementLabelR518(item)}</span>) : <span><CheckCircle2 size={14}/> Gates empíricos atendidos; revisão humana ainda é obrigatória.</span>}</div>
      </div>
      <small>Somente leitura • {r518Readiness.authority.canCertifyR510 ? 'Revisão de certificação habilitada' : 'R518 não certifica R510'} • nenhuma calibração é aplicada automaticamente. Autoridade final: R119 → R126 → R128.</small>
    </article>

    <nav className="refined-match-tabs luxury-panel" role="tablist" aria-label="Etapas de treino e partida"><button type="button" role="tab" aria-selected={tab === 'gravar'} className={tab === 'gravar' ? 'active' : ''} onClick={() => selectTab('gravar')}><Video size={17}/> Gravar e analisar</button><button type="button" role="tab" aria-selected={tab === 'competitivo'} className={tab === 'competitivo' ? 'active' : ''} onClick={() => selectTab('competitivo')}><BarChart3 size={17}/> Desempenho competitivo</button>{featureFlags.antiDelay && <button type="button" role="tab" aria-selected={tab === 'anti-delay'} className={tab === 'anti-delay' ? 'active' : ''} onClick={() => selectTab('anti-delay')}><Wifi size={17}/> Central anti-delay</button>}{featureFlags.smartCoach && <button type="button" role="tab" aria-selected={tab === 'treinador'} className={tab === 'treinador' ? 'active' : ''} onClick={() => selectTab('treinador')}><Brain size={17}/> Treinador inteligente</button>}<button type="button" role="tab" aria-selected={tab === 'treinar'} className={tab === 'treinar' ? 'active' : ''} onClick={() => selectTab('treinar')}><Trophy size={17}/> Treinos e evolução</button><button type="button" role="tab" aria-selected={tab === 'planejar'} className={tab === 'planejar' ? 'active' : ''} onClick={() => selectTab('planejar')}><Target size={17}/> Planejar partida</button><button type="button" role="tab" aria-selected={tab === 'executar'} className={tab === 'executar' ? 'active' : ''} onClick={() => selectTab('executar')}><Play size={17}/> Treino guiado</button><button type="button" role="tab" aria-selected={tab === 'analisar'} className={tab === 'analisar' ? 'active' : ''} onClick={() => selectTab('analisar')}><History size={17}/> Histórico</button>{tab !== 'treinar' && <div className="refined-week-goal"><span>Meta semanal</span><select value={weeklyGoal} onChange={(event) => changeGoal(Number(event.target.value))}>{[2,3,4,5,6,7].map((value) => <option key={value} value={value}>{value} sessões</option>)}</select><strong>{weeklySessions}/{weeklyGoal}</strong></div>}</nav>

    <div ref={panelRef} className="bm34-tab-panel" role="tabpanel" aria-live="polite">
    {tab === 'gravar' && <MatchTrainerCenter team={team} teamStyle={teamStyle} />}

    {tab === 'competitivo' && <CompetitivePerformanceCenter formation={team.formation} teamStyle={teamStyle} />}

    {tab === 'anti-delay' && featureFlags.antiDelay && <AntiDelayCenter />}

    {tab === 'treinador' && featureFlags.smartCoach && <SmartCoachCenter team={team} teamStyle={teamStyle} />}

    {tab === 'treinar' && <TrainingEvolutionCenter team={team} records={records} teamStyle={teamStyle} />}

    {tab === 'planejar' && <>
      <nav className="v27-scenario-tabs luxury-panel" aria-label="Cenários de partida">{plans.map((plan) => <button type="button" key={plan.id} className={activePlan === plan.id ? 'active' : ''} onClick={() => setActivePlan(plan.id)}>{plan.label}</button>)}</nav>
      <div className="v27-match-grid"><article className="v27-scenario-card luxury-panel"><div className="v27-panel-heading"><div><p className="kicker"><ShieldCheck size={14}/> Plano de jogo</p><h3>{current.label}</h3></div><span>{team.formation}</span></div><div className="v27-scenario-focus"><strong>Objetivo</strong><span>{current.objective}</span></div><div className="v27-scenario-sections"><div><strong>Ajuste da formação</strong><span>{current.formationAdvice}</span></div><div><strong>Perfil de jogador</strong><span>{current.playerProfile}</span></div><div><strong>Substituições</strong>{current.substitutions.map((item) => <span key={item}><CheckCircle2 size={14}/>{item}</span>)}</div><div><strong>Riscos</strong>{current.risks.map((item) => <span key={item}><Clock3 size={14}/>{item}</span>)}</div></div><button type="button" className="elite-button" onClick={() => selectTab('executar')}><Play size={17}/> Iniciar treino guiado</button></article><aside className="v27-validation-queue luxury-panel"><div className="v27-panel-heading"><div><p className="kicker"><Trophy size={14}/> Próximos testes</p><h3>Fichas que precisam de partidas</h3></div><span>{validationQueue.length}</span></div><div className="v27-player-list validation-list">{validationQueue.map((player) => <button type="button" key={player.id} onClick={() => onValidatePlayer(player.id)}><div><strong>{player.name}</strong><span>{player.targetPosition} • {player.buildName}</span></div><small>{player.matchCount} jogo(s)</small></button>)}{!validationQueue.length && <div className="v27-empty"><CheckCircle2 size={25}/><strong>Nenhuma ficha aguardando teste</strong><span>Adicione novas cartas ou revise o histórico.</span></div>}</div></aside></div>
    </>}

    {tab === 'executar' && <section className="refined-training-execution luxury-panel">
      <div className="refined-training-clock"><Clock3 size={28}/><strong>{String(Math.floor(seconds / 60)).padStart(2,'0')}:{String(seconds % 60).padStart(2,'0')}</strong><span>{running ? 'Treino em andamento' : 'Pronto para iniciar'}</span></div>
      <div className="refined-training-controls"><button type="button" className="elite-button" onClick={() => setRunning((value) => !value)}>{running ? <Pause size={18}/> : <Play size={18}/>} {running ? 'Pausar' : 'Iniciar'}</button><button type="button" onClick={() => setRepetitions((value) => value + 1)}><Plus size={18}/> Registrar repetição <strong>{repetitions}</strong></button><button type="button" onClick={() => { setRunning(false); setSeconds(0); setRepetitions(0); }}><RotateCcw size={18}/> Reiniciar</button></div>
      <div className="refined-error-pad"><div><strong>Erros observados</strong><span>Marque com um toque durante o treino.</span></div>{ERROR_OPTIONS.map((error) => <button type="button" key={error} className={selectedErrors.includes(error) ? 'active' : ''} aria-pressed={selectedErrors.includes(error)} onClick={() => toggleError(error)}>{selectedErrors.includes(error) && <CheckCircle2 size={15}/>} {error}</button>)}</div>
      <button type="button" className="elite-button refined-finish-training" onClick={saveTrainingLog} disabled={!seconds && !repetitions && !selectedErrors.length}><CheckCircle2 size={18}/> Concluir e analisar</button>
    </section>}

    {tab === 'analisar' && <div className="refined-analysis-grid"><article className="v27-match-history luxury-panel"><div className="v27-panel-heading"><div><p className="kicker"><History size={14}/> Pós-jogo integrado</p><h3>Partidas recentes</h3></div><span>{records.length} total</span></div><div className="v27-history-table">{recent.map((record) => <div key={record.id}><strong>{record.playerName}</strong><span>{new Date(record.playedAt).toLocaleDateString('pt-BR')} • {record.minutes} min</span><span>Nota {record.overallRating}/5</span><small>{record.tags.join(' • ') || 'Sem problema marcado'}</small></div>)}{!recent.length && <div className="v27-empty"><History size={25}/><strong>Sem partidas registradas</strong><span>Abra uma ficha na fila e registre o primeiro teste.</span></div>}</div></article><article className="luxury-panel refined-training-log"><div className="v27-panel-heading"><div><p className="kicker"><Clock3 size={14}/> Sessões locais</p><h3>Evolução por repetição</h3></div><span>{logs.length}</span></div>{logs.slice(0,12).map((item) => <div key={item.id}><strong>{new Date(item.at).toLocaleDateString('pt-BR')}</strong><span>{item.repetitions} repetições • {Math.round(item.seconds / 60)} min</span><small>{item.error}</small></div>)}{!logs.length && <div className="v27-empty"><Clock3 size={25}/><strong>Nenhuma sessão concluída</strong><span>Use a guia Executar para registrar o primeiro treino.</span></div>}</article></div>}
    </div>
  </section>;
}