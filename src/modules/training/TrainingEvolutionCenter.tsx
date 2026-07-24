'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Crosshair,
  Download,
  Dumbbell,
  Flame,
  Gauge,
  History,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy
} from 'lucide-react';
import type { TacticalStyle } from '@/lib/analyzer';
import type { MatchValidationRecord } from '@/lib/appEvolution';
import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';
import type { TeamDiagnosis } from '@/modules/core/centralIntelligence';
import {
  DEFAULT_TRAINING_GOALS,
  TRAINING_DRILLS_V2880,
  TRAINING_ERROR_CATALOG,
  TRAINING_EVOLUTION_STORAGE_KEY,
  TRAINING_GOALS_STORAGE_KEY,
  analyzeTrainingEvolution,
  areaLabel,
  buildDailyTrainingPlan,
  buildPostTrainingAnalysis,
  buildRankedPreparation,
  buildWeeklyTrainingPlan,
  createTrainingSession,
  getTrainingDrill,
  mergeTrainingSessions,
  migrateLegacyTrainingSessions,
  normalizeTrainingGoals,
  type TrainingArea,
  type TrainingGoals,
  type TrainingMode,
  type TrainingPeriod,
  type TrainingSessionRecord
} from './trainingEvolutionEngine';

type TrainingView = 'hoje' | 'semana' | 'executar' | 'evolucao' | 'ranqueada';

const LEGACY_GUIDED_KEY = 'buildmaster_guided_training_logs_v2739';
const LEGACY_CARD_KEY = 'buildmaster_training_logs_v25_69';
const AREA_ORDER: TrainingArea[] = ['ataque', 'defesa', 'posse', 'contra-ataque'];
const AREA_ICONS = { ataque: Crosshair, defesa: ShieldCheck, posse: Sparkles, 'contra-ataque': Flame } as const;

function formatClock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
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

function startOfWeek(now = new Date()) {
  const start = new Date(now);
  const weekday = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - weekday);
  return start;
}

export function TrainingEvolutionCenter({
  team,
  records,
  teamStyle
}: {
  team: TeamDiagnosis;
  records: MatchValidationRecord[];
  teamStyle: TacticalStyle;
}) {
  const [view, setView] = useState<TrainingView>('hoje');
  const [sessions, setSessions] = useState<TrainingSessionRecord[]>([]);
  const [goals, setGoals] = useState<TrainingGoals>(DEFAULT_TRAINING_GOALS);
  const [period, setPeriod] = useState<TrainingPeriod>(30);
  const [selectedArea, setSelectedArea] = useState<TrainingArea>('posse');
  const [selectedDrillId, setSelectedDrillId] = useState('pos-two-touch');
  const [mode, setMode] = useState<TrainingMode>('desenvolvimento');
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [repetitions, setRepetitions] = useState(0);
  const [successfulRepetitions, setSuccessfulRepetitions] = useState(0);
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [score, setScore] = useState(7);
  const [effort, setEffort] = useState(3);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const startedAtRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    const current = safeStorageGetJson<TrainingSessionRecord[]>(TRAINING_EVOLUTION_STORAGE_KEY, []);
    const guided = safeStorageGetJson<Array<{ id?: string; at?: string; error?: string; repetitions?: number; seconds?: number }>>(LEGACY_GUIDED_KEY, []);
    const cardLogs = safeStorageGetJson<Array<{ at?: string; drillId?: string; score?: number; errors?: string[]; note?: string }>>(LEGACY_CARD_KEY, []);
    const migrated = migrateLegacyTrainingSessions(guided, cardLogs);
    const merged = mergeTrainingSessions(current, migrated);
    setSessions(merged);
    if (merged.length !== current.length) safeStorageSetJson(TRAINING_EVOLUTION_STORAGE_KEY, merged);
    setGoals(normalizeTrainingGoals(safeStorageGetJson<TrainingGoals>(TRAINING_GOALS_STORAGE_KEY, DEFAULT_TRAINING_GOALS)));
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const daily = useMemo(() => buildDailyTrainingPlan({ sessions, matches: records, team, goals, teamStyle }), [sessions, records, team, goals, teamStyle]);
  const weekly = useMemo(() => buildWeeklyTrainingPlan({ sessions, matches: records, team, goals, teamStyle }), [sessions, records, team, goals, teamStyle]);
  const evolution = useMemo(() => analyzeTrainingEvolution(sessions, period), [sessions, period]);
  const ranked = useMemo(() => buildRankedPreparation({ sessions, matches: records, team, goals, teamStyle }), [sessions, records, team, goals, teamStyle]);
  const selectedDrill = useMemo(() => getTrainingDrill(selectedDrillId), [selectedDrillId]);
  const availableErrors = useMemo(() => TRAINING_ERROR_CATALOG.filter((error) => error.areas.includes(selectedArea)), [selectedArea]);
  const latestSession = sessions[0] ?? null;
  const latestPost = useMemo(() => latestSession ? buildPostTrainingAnalysis(latestSession, sessions.slice(1)) : null, [latestSession, sessions]);
  const weekStart = useMemo(() => startOfWeek(), []);
  const weeklySessions = useMemo(() => sessions.filter((session) => new Date(session.completedAt) >= weekStart), [sessions, weekStart]);
  const weeklyMinutes = Math.round(weeklySessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60);
  const weeklyRepetitions = weeklySessions.reduce((sum, session) => sum + session.repetitions, 0);

  function persistGoals(next: TrainingGoals) {
    const normalized = normalizeTrainingGoals(next);
    setGoals(normalized);
    safeStorageSetJson(TRAINING_GOALS_STORAGE_KEY, normalized);
  }

  function startDrill(drillId: string, nextMode: TrainingMode = 'desenvolvimento') {
    const drill = getTrainingDrill(drillId);
    setSelectedArea(drill.area);
    setSelectedDrillId(drill.id);
    setMode(nextMode);
    setSeconds(0);
    setRepetitions(0);
    setSuccessfulRepetitions(0);
    setSelectedErrors([]);
    setScore(7);
    setEffort(3);
    setNote('');
    startedAtRef.current = new Date().toISOString();
    setRunning(false);
    setView('executar');
    setStatus(`Exercício “${drill.title}” preparado.`);
  }

  function changeArea(area: TrainingArea) {
    const first = TRAINING_DRILLS_V2880.find((drill) => drill.area === area);
    setSelectedArea(area);
    if (first) setSelectedDrillId(first.id);
    setSelectedErrors([]);
  }

  function toggleError(id: string) {
    setSelectedErrors((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function resetExecution() {
    setRunning(false);
    setSeconds(0);
    setRepetitions(0);
    setSuccessfulRepetitions(0);
    setSelectedErrors([]);
    setScore(7);
    setEffort(3);
    setNote('');
    startedAtRef.current = new Date().toISOString();
  }

  function finishTraining() {
    const session = createTrainingSession({
      startedAt: startedAtRef.current,
      area: selectedArea,
      drillId: selectedDrillId,
      mode,
      durationSeconds: seconds,
      repetitions,
      successfulRepetitions,
      score,
      effort,
      errorTags: selectedErrors,
      note
    });
    const next = mergeTrainingSessions([session], sessions);
    setSessions(next);
    safeStorageSetJson(TRAINING_EVOLUTION_STORAGE_KEY, next);
    setRunning(false);
    setStatus('Treino salvo. A evolução e a preparação ranqueada foram recalculadas.');
    resetExecution();
    setView('evolucao');
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('buildmaster:training-evolution-updated', { detail: { total: next.length } }));
  }

  function exportEvolution() {
    const lines = [
      'BuildMaster Elite Tático — Treinos e Evolução v28.80',
      `Período: ${period} dias`,
      `Sessões: ${evolution.sessionCount}`,
      `Minutos: ${evolution.totalMinutes}`,
      `Repetições: ${evolution.totalRepetitions}`,
      `Taxa de acerto: ${evolution.successRate}%`,
      `Nota média: ${evolution.averageScore}/10`,
      `Consistência: ${evolution.consistency}/100`,
      `Sequência atual: ${evolution.currentStreak} dia(s)`,
      '',
      'Áreas:',
      ...evolution.areas.map((area) => `${areaLabel(area.area)} — ${area.sessions} sessão(ões), ${area.minutes} min, ${area.successRate}% de acerto, nota ${area.averageScore || 0}/10`),
      '',
      'Erros mais frequentes:',
      ...evolution.topErrors.map((error) => `${error.label} (${error.count}x) — ${error.correction}`),
      '',
      'Recomendações:',
      ...evolution.recommendations.map((recommendation) => `- ${recommendation}`),
      '',
      `Prontidão ranqueada: ${ranked.readinessScore}/100 — ${ranked.label}`,
      ranked.warning
    ];
    downloadText(`buildmaster-evolucao-treinos-${new Date().toISOString().slice(0, 10)}.txt`, lines.join('\n'));
  }

  return <section className="training-evolution-v2880">
    <header className="training-evolution-hero luxury-panel">
      <div className="training-evolution-hero-copy">
        <span className="training-evolution-mark"><Dumbbell size={24}/></span>
        <div><p className="kicker">Bloco 9 • Treinos e Evolução</p><h2>Treine o erro real, acompanhe a evolução e chegue preparado à ranqueada.</h2><span>{daily.reason}</span></div>
      </div>
      <div className="training-readiness-orb" data-level={ranked.label.replace(' ', '-')}><strong>{ranked.readinessScore}</strong><span>Prontidão</span><small>{ranked.label}</small></div>
    </header>

    <nav className="training-evolution-tabs luxury-panel" aria-label="Treinos e evolução">
      <button type="button" className={view === 'hoje' ? 'active' : ''} onClick={() => setView('hoje')}><Target size={17}/> Hoje</button>
      <button type="button" className={view === 'semana' ? 'active' : ''} onClick={() => setView('semana')}><Clock3 size={17}/> Semana</button>
      <button type="button" className={view === 'executar' ? 'active' : ''} onClick={() => setView('executar')}><Play size={17}/> Executar</button>
      <button type="button" className={view === 'evolucao' ? 'active' : ''} onClick={() => setView('evolucao')}><TrendingUp size={17}/> Evolução</button>
      <button type="button" className={view === 'ranqueada' ? 'active' : ''} onClick={() => setView('ranqueada')}><Trophy size={17}/> Ranqueada</button>
    </nav>

    {status && <p className="training-evolution-status" role="status"><CheckCircle2 size={16}/>{status}</p>}

    {view === 'hoje' && <div className="training-evolution-grid">
      <article className="training-today-card luxury-panel training-wide-card">
        <div className="training-panel-heading"><div><p className="kicker"><Target size={14}/> Plano diário</p><h3>{areaLabel(daily.focusArea)} como prioridade</h3></div><span>{daily.targetMinutes} min • {daily.targetRepetitions} repetições</span></div>
        <div className="training-goal-progress-grid">
          <div><strong>{weeklySessions.length}/{goals.weeklySessions}</strong><span>Sessões na semana</span><progress max={goals.weeklySessions} value={weeklySessions.length}/></div>
          <div><strong>{weeklyMinutes} min</strong><span>Tempo acumulado</span><progress max={Math.max(1, goals.dailyMinutes * goals.weeklySessions)} value={weeklyMinutes}/></div>
          <div><strong>{weeklyRepetitions}/{goals.weeklyRepetitions}</strong><span>Repetições</span><progress max={goals.weeklyRepetitions} value={weeklyRepetitions}/></div>
        </div>
      </article>
      {daily.drills.map((drill, index) => {
        const Icon = AREA_ICONS[drill.area];
        return <article className="training-drill-card luxury-panel" key={drill.id}><div className="training-drill-number"><span>{index + 1}</span><Icon size={20}/></div><div><small>{areaLabel(drill.area)} • {drill.durationMinutes} min</small><h3>{drill.title}</h3><p>{drill.objective}</p><div className="training-drill-target"><span>{drill.targetRepetitions} repetições</span><span>{drill.metrics[0]}</span></div></div><button type="button" className="elite-button" onClick={() => startDrill(drill.id)}><Play size={16}/> Começar</button></article>;
      })}
      <article className="training-daily-guidance luxury-panel training-wide-card"><Sparkles size={22}/><div><strong>Regra do dia</strong><span>Não aumente a velocidade enquanto a taxa de acerto estiver abaixo de 70%. Primeiro repita corretamente; depois acelere.</span></div></article>
    </div>}

    {view === 'semana' && <div className="training-evolution-grid">
      <article className="training-goals-card luxury-panel training-wide-card">
        <div className="training-panel-heading"><div><p className="kicker"><Gauge size={14}/> Metas ajustáveis</p><h3>Volume suficiente sem transformar treino em cansaço</h3></div><span>Salvo neste aparelho</span></div>
        <div className="training-goal-form">
          <label><span>Minutos por dia</span><input type="number" min={10} max={90} value={goals.dailyMinutes} onChange={(event) => persistGoals({ ...goals, dailyMinutes: Number(event.target.value) })}/></label>
          <label><span>Sessões por semana</span><select value={goals.weeklySessions} onChange={(event) => persistGoals({ ...goals, weeklySessions: Number(event.target.value) })}>{[2,3,4,5,6,7].map((value) => <option value={value} key={value}>{value} sessões</option>)}</select></label>
          <label><span>Repetições semanais</span><input type="number" min={40} max={700} step={10} value={goals.weeklyRepetitions} onChange={(event) => persistGoals({ ...goals, weeklyRepetitions: Number(event.target.value) })}/></label>
          <label><span>Prioridade</span><select value={goals.focusArea} onChange={(event) => persistGoals({ ...goals, focusArea: event.target.value as TrainingGoals['focusArea'] })}><option value="equilibrado">Equilibrado e adaptativo</option>{AREA_ORDER.map((area) => <option value={area} key={area}>{areaLabel(area)}</option>)}</select></label>
        </div>
      </article>
      <div className="training-week-grid training-wide-card">{weekly.map((day) => <article className={`training-week-day luxury-panel ${day.isRestDay ? 'rest-day' : ''}`} key={day.dayLabel}><div><span>{day.dayLabel}</span><strong>{day.isRestDay ? 'Recuperação' : areaLabel(day.focusArea)}</strong></div><p>{day.objective}</p>{!day.isRestDay && <><small>{day.targetMinutes} min • {day.targetRepetitions} repetições</small><ul>{day.drillIds.map((id) => <li key={id}>{getTrainingDrill(id).title}</li>)}</ul><button type="button" onClick={() => startDrill(day.drillIds[0])}><Play size={15}/> Iniciar primeiro bloco</button></>}<em>{day.review}</em></article>)}</div>
    </div>}

    {view === 'executar' && <div className="training-execution-layout">
      <article className="training-execution-main luxury-panel">
        <div className="training-panel-heading"><div><p className="kicker"><Activity size={14}/> Sessão ativa</p><h3>{selectedDrill.title}</h3></div><select value={mode} onChange={(event) => setMode(event.target.value as TrainingMode)}><option value="desenvolvimento">Desenvolvimento</option><option value="pre-ranqueada">Pré-ranqueada</option></select></div>
        <div className="training-area-selector">{AREA_ORDER.map((area) => { const Icon = AREA_ICONS[area]; return <button type="button" className={selectedArea === area ? 'active' : ''} key={area} onClick={() => changeArea(area)}><Icon size={17}/>{areaLabel(area)}</button>; })}</div>
        <div className="training-drill-selector">{TRAINING_DRILLS_V2880.filter((drill) => drill.area === selectedArea).map((drill) => <button type="button" className={selectedDrillId === drill.id ? 'active' : ''} key={drill.id} onClick={() => setSelectedDrillId(drill.id)}><strong>{drill.title}</strong><span>{drill.durationMinutes} min • {drill.targetRepetitions} repetições</span></button>)}</div>
        <div className="training-live-console">
          <div className="training-live-clock"><Clock3 size={26}/><strong>{formatClock(seconds)}</strong><span>{running ? 'Cronômetro ativo' : 'Pronto para começar'}</span></div>
          <div className="training-live-counters"><button type="button" onClick={() => setRepetitions((value) => value + 1)}><Plus size={18}/><span>Repetições</span><strong>{repetitions}</strong></button><button type="button" onClick={() => { setRepetitions((value) => value + 1); setSuccessfulRepetitions((value) => value + 1); }}><CheckCircle2 size={18}/><span>Acertos</span><strong>{successfulRepetitions}</strong></button></div>
          <div className="training-live-actions"><button type="button" className="elite-button" onClick={() => { if (!running && seconds === 0) startedAtRef.current = new Date().toISOString(); setRunning((value) => !value); }}>{running ? <Pause size={18}/> : <Play size={18}/>} {running ? 'Pausar' : 'Iniciar'}</button><button type="button" onClick={resetExecution}><RotateCcw size={18}/> Reiniciar</button></div>
        </div>
        <div className="training-steps"><strong>Como executar</strong>{selectedDrill.steps.map((step, index) => <span key={step}><b>{index + 1}</b>{step}</span>)}</div>
      </article>
      <aside className="training-execution-side luxury-panel">
        <div className="training-panel-heading"><div><p className="kicker"><Crosshair size={14}/> Registro rápido</p><h3>Erros percebidos</h3></div><span>{selectedErrors.length}</span></div>
        <div className="training-error-pad">{availableErrors.map((error) => <button type="button" className={selectedErrors.includes(error.id) ? 'active' : ''} aria-pressed={selectedErrors.includes(error.id)} key={error.id} onClick={() => toggleError(error.id)}>{selectedErrors.includes(error.id) && <CheckCircle2 size={14}/>} {error.label}</button>)}</div>
        <div className="training-session-review-fields"><label><span>Nota: {score}/10</span><input type="range" min={0} max={10} value={score} onChange={(event) => setScore(Number(event.target.value))}/></label><label><span>Esforço percebido: {effort}/5</span><input type="range" min={1} max={5} value={effort} onChange={(event) => setEffort(Number(event.target.value))}/></label><label><span>Observação</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="O que melhorou e o que ainda precisa ser corrigido?"/></label></div>
        <div className="training-current-correction"><strong>Correção principal</strong><span>{selectedErrors[0] ? TRAINING_ERROR_CATALOG.find((error) => error.id === selectedErrors[0])?.correction : selectedDrill.correction}</span></div>
        <button type="button" className="elite-button training-save-session" onClick={finishTraining} disabled={!seconds && !repetitions}><Save size={17}/> Salvar e analisar</button>
      </aside>
    </div>}

    {view === 'evolucao' && <div className="training-evolution-grid">
      <article className="training-summary-card luxury-panel training-wide-card">
        <div className="training-panel-heading"><div><p className="kicker"><BarChart3 size={14}/> Evolução por período</p><h3>Volume, qualidade e consistência</h3></div><div className="training-period-switch"><button type="button" className={period === 7 ? 'active' : ''} onClick={() => setPeriod(7)}>7 dias</button><button type="button" className={period === 30 ? 'active' : ''} onClick={() => setPeriod(30)}>30 dias</button><button type="button" onClick={exportEvolution}><Download size={15}/> Exportar</button></div></div>
        <div className="training-summary-metrics"><div><strong>{evolution.sessionCount}</strong><span>Sessões</span></div><div><strong>{evolution.totalMinutes}</strong><span>Minutos</span></div><div><strong>{evolution.totalRepetitions}</strong><span>Repetições</span></div><div><strong>{evolution.successRate}%</strong><span>Taxa de acerto</span></div><div><strong>{evolution.averageScore || '—'}</strong><span>Nota média</span></div><div><strong>{evolution.consistency}</strong><span>Consistência</span></div><div><strong>{evolution.currentStreak}</strong><span>Dias seguidos</span></div><div><strong className={`trend-${evolution.trend}`}>{evolution.trend === 'sem base' ? '—' : `${evolution.scoreDelta > 0 ? '+' : ''}${evolution.scoreDelta}`}</strong><span>Variação</span></div></div>
      </article>
      <div className="training-area-evolution training-wide-card">{evolution.areas.map((area) => { const Icon = AREA_ICONS[area.area]; return <article className="luxury-panel" key={area.area}><Icon size={21}/><div><strong>{areaLabel(area.area)}</strong><span>{area.sessions} sessão(ões) • {area.minutes} min</span></div><b>{area.successRate}%</b><small>nota {area.averageScore || 0}/10 • {area.repetitions} repetições</small></article>; })}</div>
      <article className="training-errors-analysis luxury-panel"><div className="training-panel-heading"><div><p className="kicker"><History size={14}/> Padrões reais</p><h3>Erros mais repetidos</h3></div><span>{evolution.topErrors.length}</span></div><div className="training-error-analysis-list">{evolution.topErrors.map((error) => <div key={error.id}><b>{error.count}x</b><span><strong>{error.label}</strong><small>{error.correction}</small></span></div>)}{!evolution.topErrors.length && <p>Nenhum erro recorrente foi registrado neste período.</p>}</div></article>
      <article className="training-recommendations luxury-panel"><div className="training-panel-heading"><div><p className="kicker"><Sparkles size={14}/> Próxima evolução</p><h3>Recomendações adaptadas</h3></div></div>{evolution.recommendations.map((recommendation) => <span key={recommendation}><CheckCircle2 size={15}/>{recommendation}</span>)}{!evolution.recommendations.length && <span><CheckCircle2 size={15}/>Continue registrando sessões para criar recomendações confiáveis.</span>}</article>
      {latestPost && latestSession && <article className="training-post-analysis luxury-panel training-wide-card"><div className="training-post-score"><strong>{latestPost.completionScore}</strong><span>{latestPost.verdict}</span><small>último treino: {getTrainingDrill(latestSession.drillId).title}</small></div><div><strong>O que funcionou</strong>{latestPost.positives.map((item) => <span key={item}><CheckCircle2 size={14}/>{item}</span>)}</div><div><strong>Atenção</strong>{latestPost.attention.map((item) => <span key={item}><Target size={14}/>{item}</span>)}</div><div className="training-next-action"><strong>{latestPost.nextAction}</strong><button type="button" onClick={() => startDrill(getTrainingDrill(latestSession.drillId).id)}>Repetir exercício</button></div></article>}
    </div>}

    {view === 'ranqueada' && <div className="training-evolution-grid">
      <article className="ranked-readiness-card luxury-panel training-wide-card"><div className="ranked-score-large"><Trophy size={29}/><strong>{ranked.readinessScore}</strong><span>Prontidão competitiva</span><small>{ranked.label}</small></div><div><h3>Preparação de {ranked.recommendedDurationMinutes} minutos</h3><p>{ranked.warning}</p><button type="button" className="elite-button" onClick={() => startDrill(ranked.blocks[0].drillId, 'pre-ranqueada')}><Play size={17}/> Iniciar preparação</button></div></article>
      <div className="ranked-preparation-blocks training-wide-card">{ranked.blocks.map((block) => <article className="luxury-panel" key={block.order}><span>{block.order}</span><div><small>{block.minutes} minutos</small><h3>{block.title}</h3><strong>{getTrainingDrill(block.drillId).title}</strong><p>{block.objective}</p></div><button type="button" onClick={() => startDrill(block.drillId, 'pre-ranqueada')}><Play size={15}/> Executar</button></article>)}</div>
      <article className="ranked-checklist luxury-panel training-wide-card"><div className="training-panel-heading"><div><p className="kicker"><Gauge size={14}/> Checklist competitivo</p><h3>Entre na partida somente com uma base estável</h3></div><span>{ranked.checklist.filter((item) => item.passed).length}/{ranked.checklist.length}</span></div>{ranked.checklist.map((item) => <div className={item.passed ? 'passed' : 'pending'} key={item.label}>{item.passed ? <CheckCircle2 size={18}/> : <Target size={18}/>}<span><strong>{item.label}</strong><small>{item.detail}</small></span></div>)}</article>
    </div>}
  </section>;
}
