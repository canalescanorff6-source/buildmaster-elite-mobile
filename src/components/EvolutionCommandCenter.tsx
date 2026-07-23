'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Bell, CheckCircle2, ClipboardCheck, Clock3, Download, Gauge, ListChecks, MonitorSmartphone, Plus, Rocket, ShieldCheck, SlidersHorizontal, Sparkles, Target, Trash2, Wand2, Zap } from 'lucide-react';
import {
  buildEvolutionNotifications,
  buildEvolutionScore,
  buildMaintenanceChecklist,
  createEvolutionGoal,
  deleteEvolutionGoal,
  detectAdaptiveExperienceProfile,
  dismissEvolutionNotification,
  exportEvolutionReport,
  readEvolutionGoals,
  readFocusLogs,
  resetDismissedEvolutionNotifications,
  saveFocusLog,
  toggleEvolutionGoal,
  type AdaptiveExperienceProfile,
  type EvolutionGoal,
  type EvolutionInput,
  type EvolutionTarget
} from '@/lib/appEvolutionV2740';
import { AppHealthDiagnosticsPanel } from './AppHealthDiagnosticsPanel';
import { ExperienceOptimizationPanel } from './ExperienceOptimizationPanel';
import { GuidedWorkflowPanel } from './GuidedWorkflowPanel';

export type EvolutionCommandCenterProps = EvolutionInput & {
  appVersion: string;
  onOpenTarget: (target: EvolutionTarget) => void;
  onApplyAdaptiveProfile?: (profile: AdaptiveExperienceProfile) => void;
};

type EvolutionTab = 'overview' | 'inbox' | 'goals' | 'focus' | 'workflows' | 'experience' | 'device' | 'maintenance' | 'diagnostics';

const GOAL_TEMPLATES: Array<Pick<EvolutionGoal, 'title' | 'detail' | 'target'>> = [
  { title: 'Revisar minhas fichas pendentes', detail: 'Conferir leitura, posição, estilo e soma de pontos.', target: 'vault' },
  { title: 'Validar uma ficha em partida', detail: 'Registrar desempenho real e os erros observados.', target: 'matches' },
  { title: 'Organizar meu time principal', detail: 'Revisar setores, banco, formação e planos alternativos.', target: 'team' },
  { title: 'Atualizar o backup', detail: 'Proteger fichas, imagens, formações e configurações.', target: 'backup' }
];

function downloadText(content: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function EvolutionCommandCenter(props: EvolutionCommandCenterProps) {
  const [tab, setTab] = useState<EvolutionTab>('overview');
  const [dismissedRefresh, setDismissedRefresh] = useState(0);
  const [goals, setGoals] = useState(() => readEvolutionGoals());
  const [customGoal, setCustomGoal] = useState('');
  const [focusLabel, setFocusLabel] = useState('Revisar fichas e organizar o elenco');
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusLogs, setFocusLogs] = useState(() => readFocusLogs());
  const [profile, setProfile] = useState<AdaptiveExperienceProfile | null>(null);

  const input = useMemo<EvolutionInput>(() => ({
    healthScore: props.healthScore,
    playerCount: props.playerCount,
    pendingReviewCount: props.pendingReviewCount,
    incompleteCount: props.incompleteCount,
    lowConfidenceCount: props.lowConfidenceCount,
    matchCount: props.matchCount,
    ocrQueueCount: props.ocrQueueCount,
    trashCount: props.trashCount,
    lastBackupAt: props.lastBackupAt,
    hasCurrentResult: props.hasCurrentResult,
    updateNotice: props.updateNotice
  }), [props.healthScore, props.playerCount, props.pendingReviewCount, props.incompleteCount, props.lowConfidenceCount, props.matchCount, props.ocrQueueCount, props.trashCount, props.lastBackupAt, props.hasCurrentResult, props.updateNotice]);

  const score = useMemo(() => buildEvolutionScore(input), [input]);
  const notifications = useMemo(() => buildEvolutionNotifications(input), [input, dismissedRefresh]);
  const maintenance = useMemo(() => buildMaintenanceChecklist(input), [input]);
  const completedGoals = goals.filter((item) => item.completed).length;

  useEffect(() => {
    setProfile(detectAdaptiveExperienceProfile());
  }, []);

  useEffect(() => {
    if (!focusRunning) return;
    const timer = window.setInterval(() => setFocusSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [focusRunning]);

  function addGoal(template?: Pick<EvolutionGoal, 'title' | 'detail' | 'target'>) {
    const source = template ?? { title: customGoal, detail: 'Meta pessoal criada na Central 360.', target: 'vault' as EvolutionTarget };
    if (!source.title.trim()) return;
    const goal = createEvolutionGoal(source);
    setGoals((current) => [goal, ...current]);
    setCustomGoal('');
  }

  function finishFocus() {
    if (focusSeconds <= 0) return;
    const log = saveFocusLog(focusSeconds, focusLabel);
    setFocusLogs((current) => [log, ...current]);
    setFocusRunning(false);
    setFocusSeconds(0);
  }

  function dismiss(id: string) {
    dismissEvolutionNotification(id);
    setDismissedRefresh((value) => value + 1);
  }

  return <section className="evolution-360 luxury-panel">
    <header className="evolution-360-header">
      <div><p className="kicker"><Rocket size={16}/> Evolução 360</p><h3>Melhore o aplicativo, as fichas e o seu processo de jogo</h3><span>Prioridades, manutenção, metas, foco e adaptação ao aparelho em uma central única.</span></div>
      <div className={`evolution-score score-${score.label.toLowerCase().replace(/\s/g, '-')}`}><strong>{score.score}</strong><span>/100</span><small>{score.label}</small></div>
    </header>

    <nav className="evolution-tabs" aria-label="Guias da Evolução 360">
      <button type="button" className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}><Sparkles size={17}/> Visão 360</button>
      <button type="button" className={tab === 'inbox' ? 'active' : ''} onClick={() => setTab('inbox')}><Bell size={17}/> Pendências <em>{notifications.length}</em></button>
      <button type="button" className={tab === 'goals' ? 'active' : ''} onClick={() => setTab('goals')}><Target size={17}/> Metas</button>
      <button type="button" className={tab === 'focus' ? 'active' : ''} onClick={() => setTab('focus')}><Clock3 size={17}/> Foco</button>
      <button type="button" className={tab === 'workflows' ? 'active' : ''} onClick={() => setTab('workflows')}><ListChecks size={17}/> Rotinas</button>
      <button type="button" className={tab === 'experience' ? 'active' : ''} onClick={() => setTab('experience')}><SlidersHorizontal size={17}/> Experiência</button>
      <button type="button" className={tab === 'device' ? 'active' : ''} onClick={() => setTab('device')}><MonitorSmartphone size={17}/> Aparelho</button>
      <button type="button" className={tab === 'maintenance' ? 'active' : ''} onClick={() => setTab('maintenance')}><ShieldCheck size={17}/> Manutenção</button>
      <button type="button" className={tab === 'diagnostics' ? 'active' : ''} onClick={() => setTab('diagnostics')}><Activity size={17}/> Diagnóstico</button>
    </nav>

    {tab === 'overview' && <div className="evolution-overview-grid">
      <article className="evolution-priority-card"><div><Zap size={22}/><span>Próximas prioridades</span></div>{score.priorities.length ? score.priorities.map((item, index) => <button type="button" key={item} onClick={() => props.onOpenTarget(index === 0 && props.updateNotice ? 'updates' : props.pendingReviewCount ? 'vault' : 'matches')}><b>{index + 1}</b><span>{item}</span></button>) : <p><CheckCircle2 size={18}/> Nenhuma prioridade crítica neste momento.</p>}</article>
      <article className="evolution-strength-card"><div><Activity size={22}/><span>Pontos fortes</span></div>{score.strengths.map((item) => <p key={item}><CheckCircle2 size={16}/>{item}</p>)}{!score.strengths.length && <p>Crie fichas e registre partidas para formar seu histórico.</p>}</article>
      <article className="evolution-metrics-card"><strong>Resumo do uso</strong><div><span>Jogadores<b>{props.playerCount}</b></span><span>Partidas<b>{props.matchCount}</b></span><span>Revisões<b>{props.pendingReviewCount}</b></span><span>Fila OCR<b>{props.ocrQueueCount}</b></span></div></article>
      <article className="evolution-goal-progress"><strong>Metas pessoais</strong><span>{completedGoals} de {goals.length} concluída(s)</span><i><b style={{ width: `${goals.length ? Math.round((completedGoals / goals.length) * 100) : 0}%` }}/></i><button type="button" onClick={() => setTab('goals')}>Organizar metas</button></article>
      <button type="button" className="elite-button evolution-report-button" onClick={() => downloadText(exportEvolutionReport(input, props.appVersion), `buildmaster-evolucao-360-${new Date().toISOString().slice(0, 10)}.txt`)}><Download size={17}/> Exportar relatório 360</button>
    </div>}

    {tab === 'inbox' && <div className="evolution-inbox">
      <div className="evolution-inbox-toolbar"><div><strong>Caixa de pendências inteligente</strong><span>Mostra apenas o que exige sua atenção.</span></div><button type="button" onClick={() => { resetDismissedEvolutionNotifications(); setDismissedRefresh((value) => value + 1); }}>Restaurar avisos ocultos</button></div>
      {notifications.map((item) => <article key={item.id} className={`evolution-notification severity-${item.severity}`}><span>{item.severity === 'success' ? <CheckCircle2 size={21}/> : item.severity === 'critical' ? <ShieldCheck size={21}/> : <Bell size={21}/>}</span><div><strong>{item.title}</strong><p>{item.message}</p>{item.target && <button type="button" onClick={() => props.onOpenTarget(item.target!)}>{item.actionLabel || 'Abrir'}</button>}</div><button type="button" className="evolution-dismiss" aria-label={`Ocultar aviso ${item.title}`} onClick={() => dismiss(item.id)}>×</button></article>)}
      {!notifications.length && <div className="evolution-empty"><CheckCircle2 size={30}/><strong>Nenhuma pendência ativa</strong><span>O aplicativo não encontrou ações urgentes.</span></div>}
    </div>}

    {tab === 'goals' && <div className="evolution-goals">
      <div className="evolution-goal-create"><label>Nova meta<input value={customGoal} onChange={(event) => setCustomGoal(event.target.value)} placeholder="Ex.: revisar meus volantes antes do fim de semana"/></label><button type="button" className="elite-button" disabled={!customGoal.trim()} onClick={() => addGoal()}><Plus size={17}/> Adicionar</button></div>
      <div className="evolution-goal-templates"><strong>Sugestões rápidas</strong>{GOAL_TEMPLATES.map((template) => <button type="button" key={template.title} onClick={() => addGoal(template)}><Wand2 size={16}/>{template.title}</button>)}</div>
      <div className="evolution-goal-list">{goals.map((goal) => <article key={goal.id} className={goal.completed ? 'completed' : ''}><button type="button" className="goal-check" aria-label={`${goal.completed ? 'Reabrir' : 'Concluir'} meta ${goal.title}`} onClick={() => setGoals(toggleEvolutionGoal(goal.id))}>{goal.completed ? <CheckCircle2 size={20}/> : <span/>}</button><button type="button" className="goal-content" onClick={() => props.onOpenTarget(goal.target)}><strong>{goal.title}</strong><span>{goal.detail}</span></button><button type="button" className="goal-delete" aria-label={`Excluir meta ${goal.title}`} onClick={() => setGoals(deleteEvolutionGoal(goal.id))}><Trash2 size={16}/></button></article>)}{!goals.length && <div className="evolution-empty"><Target size={30}/><strong>Nenhuma meta criada</strong><span>Use uma sugestão ou crie sua própria meta.</span></div>}</div>
    </div>}

    {tab === 'focus' && <div className="evolution-focus">
      <article className="focus-timer"><Clock3 size={30}/><strong>{String(Math.floor(focusSeconds / 60)).padStart(2, '0')}:{String(focusSeconds % 60).padStart(2, '0')}</strong><label>Objetivo da sessão<input value={focusLabel} onChange={(event) => setFocusLabel(event.target.value)} maxLength={80}/></label><div><button type="button" className="elite-button" onClick={() => setFocusRunning((value) => !value)}>{focusRunning ? 'Pausar' : 'Iniciar foco'}</button><button type="button" onClick={finishFocus} disabled={!focusSeconds}>Concluir</button><button type="button" onClick={() => { setFocusRunning(false); setFocusSeconds(0); }}>Zerar</button></div></article>
      <article className="focus-history"><strong>Sessões recentes</strong>{focusLogs.slice(0, 10).map((log) => <p key={log.id}><ClipboardCheck size={16}/><span>{log.label}<small>{Math.max(1, Math.round(log.seconds / 60))} min • {new Date(log.finishedAt).toLocaleDateString('pt-BR')}</small></span></p>)}{!focusLogs.length && <span>Nenhuma sessão concluída ainda.</span>}</article>
    </div>}

    {tab === 'workflows' && <GuidedWorkflowPanel onOpenTarget={props.onOpenTarget}/>}

    {tab === 'experience' && <ExperienceOptimizationPanel/>}

    {tab === 'diagnostics' && <AppHealthDiagnosticsPanel appVersion={props.appVersion}/>}

    {tab === 'device' && <div className="evolution-device">
      {profile ? <><div className="device-recommendation"><MonitorSmartphone size={28}/><div><strong>Perfil recomendado para este aparelho</strong><span>Densidade {profile.recommendedDensity === 'compact' ? 'compacta' : 'confortável'} • desempenho {profile.recommendedPerformance === 'economy' ? 'econômico' : 'equilibrado'}</span></div></div><div className="device-signal-grid"><span className={profile.narrowScreen ? 'active' : ''}>Tela estreita</span><span className={profile.lowMemory ? 'active' : ''}>Memória limitada</span><span className={profile.saveData ? 'active' : ''}>Economia de dados</span><span className={profile.reducedMotion ? 'active' : ''}>Menos movimento</span></div><ul>{profile.reason.map((reason) => <li key={reason}>{reason}</li>)}</ul>{props.onApplyAdaptiveProfile && <button type="button" className="elite-button" onClick={() => props.onApplyAdaptiveProfile?.(profile)}><Gauge size={17}/> Aplicar perfil recomendado</button>}</> : <div className="evolution-empty">Detectando o aparelho…</div>}
    </div>}

    {tab === 'maintenance' && <div className="evolution-maintenance">
      <div className="maintenance-heading"><div><ListChecks size={24}/><span><strong>Checklist preventivo</strong><small>Evita perda de dados, leituras incompletas e falhas na atualização.</small></span></div><b>{maintenance.filter((item) => item.completed).length}/{maintenance.length}</b></div>
      {maintenance.map((item) => <button type="button" key={item.id} className={item.completed ? 'completed' : ''} onClick={() => props.onOpenTarget(item.target)}><span>{item.completed ? <CheckCircle2 size={21}/> : <span/>}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><em>{item.completed ? 'OK' : 'Revisar'}</em></button>)}
    </div>}
  </section>;
}
