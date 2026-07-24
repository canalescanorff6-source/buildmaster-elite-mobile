'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, Download, History, Pause, Play, Plus, RotateCcw, ShieldCheck, Target, Trophy, Users } from 'lucide-react';
import type { IntegratedPlayerRecord, MatchScenarioPlan, TeamDiagnosis } from '@/modules/core/centralIntelligence';
import type { TacticalStyle } from '@/lib/analyzer';
import { TrainingEvolutionCenter } from '@/modules/training/TrainingEvolutionCenter';
import { CompetitivePerformanceCenter } from './CompetitivePerformanceCenter';
import type { MatchValidationRecord } from '@/lib/appEvolution';
import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';
import { PremiumScreenHero } from '@/components/PremiumScreenPrimitives';

type MatchTab = 'competitivo' | 'treinar' | 'planejar' | 'executar' | 'analisar';
type TrainingLog = { id: string; at: string; error: string; repetitions: number; seconds: number };
const TRAINING_LOG_KEY = 'buildmaster_guided_training_logs_v2739';
const WEEKLY_GOAL_KEY = 'buildmaster_weekly_training_goal_v2739';
const ERROR_OPTIONS = ['Passe precipitado', 'Demora para soltar a bola', 'Marcação atrasada', 'Finalização forçada', 'Perdeu a compactação', 'Troca de jogador errada'];

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
  const current = plans.find((plan) => plan.id === activePlan) ?? plans[0];
  const validationQueue = useMemo(() => players.filter((player) => player.status === 'completo').sort((a, b) => a.matchCount - b.matchCount || b.efficiency - a.efficiency).slice(0, 6), [players]);
  const recent = useMemo(() => [...records].sort((a, b) => b.playedAt.localeCompare(a.playedAt)).slice(0, 8), [records]);
  const weekStart = useMemo(() => { const now = new Date(); const day = (now.getDay() + 6) % 7; now.setHours(0,0,0,0); now.setDate(now.getDate() - day); return now; }, []);
  const weeklySessions = useMemo(() => logs.filter((item) => new Date(item.at) >= weekStart).length, [logs, weekStart]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

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
    setTab('analisar');
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
      title="Treine com método, prepare a partida e valide o que funciona em campo."
      description="Use planos diários e semanais, registre repetições e erros, acompanhe a evolução por período e entre nas ranqueadas com uma preparação objetiva."
      badge={`${weeklySessions}/${weeklyGoal} sessões na semana`}
      actions={<><button type="button" className="elite-button" onClick={onOpenTeam}><Users size={17}/> Rever meu time</button><button type="button" onClick={exportWeeklyPlan}><Download size={17}/> Exportar semana</button></>}
      metrics={[
        { label: 'Prontidão', value: team.globalScore, hint: `formação ${team.formation}`, tone: team.globalScore >= 80 ? 'positive' : 'warning' },
        { label: 'Partidas', value: records.length, hint: 'registros reais', tone: 'accent' },
        { label: 'Testes pendentes', value: validationQueue.length, hint: 'fichas na fila', tone: validationQueue.length ? 'warning' : 'positive' },
        { label: 'Treinos locais', value: logs.length, hint: 'sessões salvas' }
      ]}
    />

    <nav className="refined-match-tabs luxury-panel" aria-label="Etapas de treino e partida"><button type="button" className={tab === 'competitivo' ? 'active' : ''} onClick={() => setTab('competitivo')}><BarChart3 size={17}/> Desempenho competitivo</button><button type="button" className={tab === 'treinar' ? 'active' : ''} onClick={() => setTab('treinar')}><Trophy size={17}/> Treinos e evolução</button><button type="button" className={tab === 'planejar' ? 'active' : ''} onClick={() => setTab('planejar')}><Target size={17}/> Planejar partida</button><button type="button" className={tab === 'executar' ? 'active' : ''} onClick={() => setTab('executar')}><Play size={17}/> Treino guiado antigo</button><button type="button" className={tab === 'analisar' ? 'active' : ''} onClick={() => setTab('analisar')}><History size={17}/> Histórico</button>{tab !== 'treinar' && <div className="refined-week-goal"><span>Meta semanal antiga</span><select value={weeklyGoal} onChange={(event) => changeGoal(Number(event.target.value))}>{[2,3,4,5,6,7].map((value) => <option key={value} value={value}>{value} sessões</option>)}</select><strong>{weeklySessions}/{weeklyGoal}</strong></div>}</nav>

    {tab === 'competitivo' && <CompetitivePerformanceCenter formation={team.formation} teamStyle={teamStyle} />}

    {tab === 'treinar' && <TrainingEvolutionCenter team={team} records={records} teamStyle={teamStyle} />}

    {tab === 'planejar' && <>
      <nav className="v27-scenario-tabs luxury-panel" aria-label="Cenários de partida">{plans.map((plan) => <button type="button" key={plan.id} className={activePlan === plan.id ? 'active' : ''} onClick={() => setActivePlan(plan.id)}>{plan.label}</button>)}</nav>
      <div className="v27-match-grid"><article className="v27-scenario-card luxury-panel"><div className="v27-panel-heading"><div><p className="kicker"><ShieldCheck size={14}/> Plano de jogo</p><h3>{current.label}</h3></div><span>{team.formation}</span></div><div className="v27-scenario-focus"><strong>Objetivo</strong><span>{current.objective}</span></div><div className="v27-scenario-sections"><div><strong>Ajuste da formação</strong><span>{current.formationAdvice}</span></div><div><strong>Perfil de jogador</strong><span>{current.playerProfile}</span></div><div><strong>Substituições</strong>{current.substitutions.map((item) => <span key={item}><CheckCircle2 size={14}/>{item}</span>)}</div><div><strong>Riscos</strong>{current.risks.map((item) => <span key={item}><Clock3 size={14}/>{item}</span>)}</div></div><button type="button" className="elite-button" onClick={() => setTab('executar')}><Play size={17}/> Iniciar treino guiado</button></article><aside className="v27-validation-queue luxury-panel"><div className="v27-panel-heading"><div><p className="kicker"><Trophy size={14}/> Próximos testes</p><h3>Fichas que precisam de partidas</h3></div><span>{validationQueue.length}</span></div><div className="v27-player-list validation-list">{validationQueue.map((player) => <button type="button" key={player.id} onClick={() => onValidatePlayer(player.id)}><div><strong>{player.name}</strong><span>{player.targetPosition} • {player.buildName}</span></div><small>{player.matchCount} jogo(s)</small></button>)}{!validationQueue.length && <div className="v27-empty"><CheckCircle2 size={25}/><strong>Nenhuma ficha aguardando teste</strong><span>Adicione novas cartas ou revise o histórico.</span></div>}</div></aside></div>
    </>}

    {tab === 'executar' && <section className="refined-training-execution luxury-panel">
      <div className="refined-training-clock"><Clock3 size={28}/><strong>{String(Math.floor(seconds / 60)).padStart(2,'0')}:{String(seconds % 60).padStart(2,'0')}</strong><span>{running ? 'Treino em andamento' : 'Pronto para iniciar'}</span></div>
      <div className="refined-training-controls"><button type="button" className="elite-button" onClick={() => setRunning((value) => !value)}>{running ? <Pause size={18}/> : <Play size={18}/>} {running ? 'Pausar' : 'Iniciar'}</button><button type="button" onClick={() => setRepetitions((value) => value + 1)}><Plus size={18}/> Registrar repetição <strong>{repetitions}</strong></button><button type="button" onClick={() => { setRunning(false); setSeconds(0); setRepetitions(0); }}><RotateCcw size={18}/> Reiniciar</button></div>
      <div className="refined-error-pad"><div><strong>Erros observados</strong><span>Marque com um toque durante o treino.</span></div>{ERROR_OPTIONS.map((error) => <button type="button" key={error} className={selectedErrors.includes(error) ? 'active' : ''} aria-pressed={selectedErrors.includes(error)} onClick={() => toggleError(error)}>{selectedErrors.includes(error) && <CheckCircle2 size={15}/>} {error}</button>)}</div>
      <button type="button" className="elite-button refined-finish-training" onClick={saveTrainingLog} disabled={!seconds && !repetitions && !selectedErrors.length}><CheckCircle2 size={18}/> Concluir e analisar</button>
    </section>}

    {tab === 'analisar' && <div className="refined-analysis-grid"><article className="v27-match-history luxury-panel"><div className="v27-panel-heading"><div><p className="kicker"><History size={14}/> Pós-jogo integrado</p><h3>Partidas recentes</h3></div><span>{records.length} total</span></div><div className="v27-history-table">{recent.map((record) => <div key={record.id}><strong>{record.playerName}</strong><span>{new Date(record.playedAt).toLocaleDateString('pt-BR')} • {record.minutes} min</span><span>Nota {record.overallRating}/5</span><small>{record.tags.join(' • ') || 'Sem problema marcado'}</small></div>)}{!recent.length && <div className="v27-empty"><History size={25}/><strong>Sem partidas registradas</strong><span>Abra uma ficha na fila e registre o primeiro teste.</span></div>}</div></article><article className="luxury-panel refined-training-log"><div className="v27-panel-heading"><div><p className="kicker"><Clock3 size={14}/> Sessões locais</p><h3>Evolução por repetição</h3></div><span>{logs.length}</span></div>{logs.slice(0,12).map((item) => <div key={item.id}><strong>{new Date(item.at).toLocaleDateString('pt-BR')}</strong><span>{item.repetitions} repetições • {Math.round(item.seconds / 60)} min</span><small>{item.error}</small></div>)}{!logs.length && <div className="v27-empty"><Clock3 size={25}/><strong>Nenhuma sessão concluída</strong><span>Use a guia Executar para registrar o primeiro treino.</span></div>}</article></div>}
  </section>;
}
