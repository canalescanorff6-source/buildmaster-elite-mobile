'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Award, BarChart3, Brain, CalendarDays, CheckCircle2, Download, Save, Target, Trophy } from 'lucide-react';
import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';
import type { TacticalStyle } from '@/lib/analyzerDomain';
import type { TeamDiagnosis } from '@/modules/core/centralIntelligence';
import { COMPETITIVE_MATCH_STORAGE_KEY, type CompetitiveMatchRecord } from '@/modules/matches/competitivePerformanceEngine';
import { ANTI_DELAY_LINK_STORAGE_KEY, ANTI_DELAY_STORAGE_KEY, summarizeAntiDelayHistory, type AntiDelayMatchLink, type AntiDelaySample } from '@/modules/performance/antiDelayEngine';
import { TRAINING_EVOLUTION_STORAGE_KEY, type TrainingSessionRecord, areaLabel, getTrainingDrill } from '@/modules/training/trainingEvolutionEngine';
import {
  buildSmartCoachReport,
  createSmartCoachReview,
  normalizeSmartCoachPreferences,
  SMART_COACH_PREFERENCES_KEY,
  SMART_COACH_REVIEW_STORAGE_KEY,
  smartCoachReportText,
  type CoachGoal,
  type SmartCoachPreferences,
  type SmartCoachReview
} from './smartCoachEngine';

type Tab = 'resumo' | 'plano' | 'evolucao' | 'revisao';

const GOAL_LABELS: Record<CoachGoal, string> = {
  'subir-divisao': 'Subir de divisão',
  'reduzir-erros': 'Reduzir erros',
  'melhorar-posse': 'Melhorar posse',
  'defender-melhor': 'Defender melhor',
  'finalizar-melhor': 'Finalizar melhor',
  equilibrado: 'Evolução equilibrada'
};

function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SmartCoachCenter({ team, teamStyle }: { team: TeamDiagnosis; teamStyle: TacticalStyle }) {
  const [tab, setTab] = useState<Tab>('resumo');
  const [trainingSessions] = useState<TrainingSessionRecord[]>(() => safeStorageGetJson<TrainingSessionRecord[]>(TRAINING_EVOLUTION_STORAGE_KEY, []));
  const [matches] = useState<CompetitiveMatchRecord[]>(() => safeStorageGetJson<CompetitiveMatchRecord[]>(COMPETITIVE_MATCH_STORAGE_KEY, []));
  const [delaySamples] = useState<AntiDelaySample[]>(() => safeStorageGetJson<AntiDelaySample[]>(ANTI_DELAY_STORAGE_KEY, []));
  const [delayLinks] = useState<AntiDelayMatchLink[]>(() => safeStorageGetJson<AntiDelayMatchLink[]>(ANTI_DELAY_LINK_STORAGE_KEY, []));
  const [preferences, setPreferences] = useState<SmartCoachPreferences>(() => normalizeSmartCoachPreferences(safeStorageGetJson<Partial<SmartCoachPreferences> | null>(SMART_COACH_PREFERENCES_KEY, { preferredStyle: teamStyle })));
  const [reviews, setReviews] = useState<SmartCoachReview[]>(() => safeStorageGetJson<SmartCoachReview[]>(SMART_COACH_REVIEW_STORAGE_KEY, []));
  const [reviewNote, setReviewNote] = useState('');
  const [commitments, setCommitments] = useState<string[]>([]);
  const delayHistory = useMemo(() => summarizeAntiDelayHistory(delaySamples, delayLinks), [delaySamples, delayLinks]);
  const report = useMemo(() => buildSmartCoachReport({ team, trainingSessions, competitiveMatches: matches, delayHistory, preferences, reviews }), [team, trainingSessions, matches, delayHistory, preferences, reviews]);

  function savePreferences(next: SmartCoachPreferences) {
    const normalized = normalizeSmartCoachPreferences(next);
    setPreferences(normalized);
    safeStorageSetJson(SMART_COACH_PREFERENCES_KEY, normalized);
  }

  function toggleCommitment(value: string) {
    setCommitments((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value].slice(0, 5));
  }

  function saveReview() {
    const nextReview = createSmartCoachReview(report, reviewNote, commitments.length ? commitments : report.topErrors.slice(0, 2).map((error) => error.correction));
    const next = [nextReview, ...reviews.filter((item) => item.weekKey !== nextReview.weekKey)].slice(0, 52);
    setReviews(next);
    safeStorageSetJson(SMART_COACH_REVIEW_STORAGE_KEY, next);
    setReviewNote('');
    setCommitments([]);
    window.dispatchEvent(new CustomEvent('buildmaster:smart-coach-reviewed'));
    setTab('plano');
  }

  return <section className="bm2960-coach luxury-panel">
    <header className="bm2960-heading">
      <div><p className="kicker"><Brain size={15}/> Bloco 23</p><h3>Treinador inteligente</h3><span>Transforma treinos, partidas, elenco e condições de conexão em um plano semanal explicado.</span></div>
      <div className="bm2960-score-chip coach"><Trophy size={18}/><strong>{report.readiness}</strong><span>/100</span></div>
    </header>

    <nav className="bm2960-tabs" aria-label="Treinador inteligente">
      <button type="button" className={tab === 'resumo' ? 'active' : ''} onClick={() => setTab('resumo')}><BarChart3 size={16}/> Resumo</button>
      <button type="button" className={tab === 'plano' ? 'active' : ''} onClick={() => setTab('plano')}><CalendarDays size={16}/> Plano semanal</button>
      <button type="button" className={tab === 'evolucao' ? 'active' : ''} onClick={() => setTab('evolucao')}><Award size={16}/> Evolução</button>
      <button type="button" className={tab === 'revisao' ? 'active' : ''} onClick={() => setTab('revisao')}><CheckCircle2 size={16}/> Revisão</button>
    </nav>

    {tab === 'resumo' && <div className="bm2960-coach-grid">
      <article className="bm2960-coach-summary"><div className="bm2960-card-title"><Target size={18}/><div><strong>Diagnóstico da semana</strong><span>{report.weekKey}</span></div></div><div className="bm2960-coach-kpis"><div><span>Nota semanal</span><strong>{report.weeklyScore}</strong></div><div><span>Prontidão</span><strong>{report.readiness}</strong></div><div><span>Dificuldade</span><strong>{report.difficulty}/5</strong></div></div><p>{report.verdict}</p>{report.needsWeeklyReview && <div className="bm2960-review-alert"><AlertTriangle size={18}/><span>{report.reviewMessage}</span><button type="button" onClick={() => setTab('revisao')}>Revisar agora</button></div>}<div className="bm2960-explanations">{report.explanations.map((item) => <span key={item}>{item}</span>)}</div></article>
      <article><div className="bm2960-card-title"><AlertTriangle size={18}/><strong>Três prioridades</strong></div>{report.topErrors.map((error, index) => <div className="bm2960-error" key={error.key}><b>{index + 1}</b><div><strong>{error.label}</strong><span>{error.evidence}</span><small>{error.correction}</small></div><i>{error.severity}</i></div>)}{!report.topErrors.length && <p className="panel-note">Registre partidas e treinos para identificar prioridades.</p>}</article>
      <article><div className="bm2960-card-title"><Trophy size={18}/><strong>Recomendação competitiva</strong></div>{report.formationRecommendation ? <><div className="bm2960-formation"><strong>{report.formationRecommendation.formation}</strong><span>confiança {report.formationRecommendation.confidence}%</span></div><p>{report.formationRecommendation.reason}</p>{report.formationRecommendation.conditions.map((item) => <span className="bm2960-line" key={item}>{item}</span>)}</> : <p className="panel-note">Sem formação recomendada por falta de amostra.</p>}<div className="bm2960-style"><strong>{report.styleRecommendation.label}</strong><span>{report.styleRecommendation.reason}</span></div></article>
      <article className="bm2960-preferences"><div className="bm2960-card-title"><Brain size={18}/><strong>Objetivo do treinador</strong></div><label>Meta<select value={preferences.goal} onChange={(event) => savePreferences({ ...preferences, goal: event.target.value as CoachGoal })}>{Object.entries(GOAL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Sessões por semana<select value={preferences.sessionsPerWeek} onChange={(event) => savePreferences({ ...preferences, sessionsPerWeek: Number(event.target.value) })}>{[2,3,4,5,6,7].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>Minutos por sessão<input type="number" min={10} max={60} value={preferences.minutesPerSession} onChange={(event) => savePreferences({ ...preferences, minutesPerSession: Number(event.target.value) })}/></label><label>Divisão atual<input value={preferences.currentDivision} onChange={(event) => savePreferences({ ...preferences, currentDivision: event.target.value })}/></label></article>
    </div>}

    {tab === 'plano' && <div className="bm2960-week-plan">{report.plan.map((day) => <article key={day.day} className={`focus-${day.focus}`}><header><strong>{day.day}</strong><span>{day.minutes ? `${day.minutes} min` : 'Recuperação'}</span></header><div><b>{day.focus === 'revisão' || day.focus === 'partida' ? day.focus : areaLabel(day.focus)}</b><span>Dificuldade {day.difficulty}/5</span></div><p>{day.objective}</p>{day.drillIds.map((id) => { const drill = getTrainingDrill(id); return <small key={id}>{drill.title} • {drill.targetRepetitions} repetições</small>; })}<footer><span>Meta: {day.successMetric}</span><span>Regra: {day.matchRule}</span></footer></article>)}<button type="button" onClick={() => downloadText(`buildmaster-treinador-${report.weekKey}.txt`, smartCoachReportText(report))}><Download size={17}/> Exportar plano</button></div>}

    {tab === 'evolucao' && <div className="bm2960-evolution-grid">
      <article><div className="bm2960-card-title"><BarChart3 size={18}/><strong>Treino x partidas</strong></div><p>{report.trainingVsMatch}</p>{report.improvementSignals.map((item) => <span className="bm2960-line" key={item}>{item}</span>)}</article>
      <article><div className="bm2960-card-title"><AlertTriangle size={18}/><strong>Equilíbrio das áreas</strong></div>{report.balanceWarnings.map((item) => <span className="bm2960-line warning" key={item}>{item}</span>)}{!report.balanceWarnings.length && <span className="bm2960-line positive">Distribuição de treinos equilibrada no período.</span>}</article>
      <article><div className="bm2960-card-title"><Award size={18}/><strong>Conquistas</strong></div>{report.achievements.map((achievement) => <div className={achievement.unlocked ? 'bm2960-achievement unlocked' : 'bm2960-achievement'} key={achievement.id}><Award size={18}/><div><strong>{achievement.title}</strong><span>{achievement.detail}</span><progress value={achievement.progress} max={100}/></div><b>{achievement.progress}%</b></div>)}</article>
    </div>}

    {tab === 'revisao' && <div className="bm2960-review-grid">
      <article><div className="bm2960-card-title"><CheckCircle2 size={18}/><div><strong>Revisão semanal</strong><span>{report.reviewMessage}</span></div></div><label>O que você percebeu nesta semana?<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Ex.: passei melhor quando joguei em dois toques, mas ainda puxei o zagueiro cedo."/></label><strong>Compromissos para o próximo ciclo</strong>{report.topErrors.map((error) => <label className="bm2960-commitment" key={error.key}><input type="checkbox" checked={commitments.includes(error.correction)} onChange={() => toggleCommitment(error.correction)}/><span>{error.correction}</span></label>)}<button type="button" className="elite-button" onClick={saveReview}><Save size={17}/> Confirmar revisão</button></article>
      <article><div className="bm2960-card-title"><CalendarDays size={18}/><strong>Histórico de revisões</strong></div>{reviews.map((review) => <div className="bm2960-review-item" key={review.id}><strong>{review.weekKey} • nota {review.score}</strong><span>{new Date(review.reviewedAt).toLocaleString('pt-BR')}</span><p>{review.note || 'Sem observação livre.'}</p>{review.commitments.map((item) => <small key={item}>{item}</small>)}</div>)}{!reviews.length && <p className="panel-note">Nenhuma revisão semanal registrada.</p>}</article>
    </div>}
  </section>;
}
