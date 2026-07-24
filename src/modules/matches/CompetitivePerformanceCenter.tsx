'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, Download, FileText, Plus, RotateCcw, ShieldCheck, Target, Trash2, TrendingUp, Trophy } from 'lucide-react';
import type { TacticalFormation, TacticalStyle } from '@/lib/analyzerDomain';
import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';
import {
  buildAutomaticCorrectionPlan,
  buildCompetitiveMonthlyReport,
  compareCompetitivePeriods,
  COMPETITIVE_MATCH_STORAGE_KEY,
  COMPETITIVE_OPPONENT_LABELS,
  createCompetitiveMatchRecord,
  matchOutcome,
  summarizeCompetitiveMatches,
  type CompetitiveMatchRecord,
  type OpponentProfile
} from './competitivePerformanceEngine';

type Tab = 'dashboard' | 'register' | 'compare' | 'report';

const FORMATIONS: TacticalFormation[] = ['4-2-2-2','4-3-3','4-1-2-3','4-2-1-3','4-2-3-1','4-3-1-2','4-1-3-2','4-4-2','4-1-4-1','3-2-4-1','3-4-3','3-5-2','5-3-2','5-2-3'];
const STYLES: Array<{ value: TacticalStyle; label: string }> = [
  { value: 'POSSE_DE_BOLA', label: 'Posse de bola' },
  { value: 'CONTRA_ATAQUE', label: 'Contra-ataque normal' },
  { value: 'CONTRA_ATAQUE_RAPIDO', label: 'Contra-ataque rápido' }
];

function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CompetitivePerformanceCenter({ formation, teamStyle }: { formation: TacticalFormation; teamStyle: TacticalStyle }) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [period, setPeriod] = useState(30);
  const [records, setRecords] = useState<CompetitiveMatchRecord[]>(() => safeStorageGetJson<CompetitiveMatchRecord[]>(COMPETITIVE_MATCH_STORAGE_KEY, []));
  const [form, setForm] = useState({
    competition: 'Ranqueada', division: 'Divisão 2', formation: formation === 'AUTO' ? '4-2-2-2' as TacticalFormation : formation,
    teamStyle: teamStyle === 'AUTO' ? 'POSSE_DE_BOLA' as TacticalStyle : teamStyle, manager: '', opponentProfile: 'balanced' as OpponentProfile,
    goalsFor: 0, goalsAgainst: 0, possession: 50, shots: 0, shotsOnTarget: 0, passErrors: 0, finishingErrors: 0,
    defensiveErrors: 0, turnovers: 0, substitutionsImpact: 3, connectionQuality: 3, notes: ''
  });
  const summary = useMemo(() => summarizeCompetitiveMatches(records, period), [records, period]);
  const trends = useMemo(() => compareCompetitivePeriods(records, period), [records, period]);
  const plan = useMemo(() => buildAutomaticCorrectionPlan(summary), [summary]);

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function save() {
    const next = [createCompetitiveMatchRecord(form), ...records].slice(0, 500);
    setRecords(next);
    safeStorageSetJson(COMPETITIVE_MATCH_STORAGE_KEY, next);
    setForm((current) => ({ ...current, goalsFor: 0, goalsAgainst: 0, shots: 0, shotsOnTarget: 0, passErrors: 0, finishingErrors: 0, defensiveErrors: 0, turnovers: 0, notes: '' }));
    window.dispatchEvent(new CustomEvent('buildmaster:competitive-match-updated'));
    setTab('dashboard');
  }
  function remove(id: string) {
    const next = records.filter((item) => item.id !== id);
    setRecords(next);
    safeStorageSetJson(COMPETITIVE_MATCH_STORAGE_KEY, next);
  }

  return <section className="bm2900-performance-center luxury-panel">
    <div className="bm2900-heading"><div><p className="kicker"><Trophy size={15}/> Bloco 10</p><h3>Desempenho competitivo</h3><span>Registre resultados, compare formações e técnicos e receba um plano automático de correção.</span></div><div className="bm2900-period"><span>Período</span><select value={period} onChange={(event) => setPeriod(Number(event.target.value))}><option value={7}>7 dias</option><option value={30}>30 dias</option><option value={90}>90 dias</option><option value={0}>Todo o histórico</option></select></div></div>
    <nav className="bm2900-tabs"><button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}><BarChart3 size={16}/> Painel</button><button className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}><Plus size={16}/> Registrar</button><button className={tab === 'compare' ? 'active' : ''} onClick={() => setTab('compare')}><TrendingUp size={16}/> Comparar</button><button className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}><FileText size={16}/> Relatório</button></nav>

    {tab === 'dashboard' && <>
      <div className="bm2900-metrics"><article><strong>{summary.matches}</strong><span>Partidas</span></article><article><strong>{summary.winRate}%</strong><span>Vitórias</span></article><article><strong>{summary.pointsPerMatch}</strong><span>Pontos/jogo</span></article><article><strong>{summary.goalDifference >= 0 ? '+' : ''}{summary.goalDifference}</strong><span>Saldo</span></article><article><strong>{summary.consistency}</strong><span>Consistência</span></article><article><strong>{summary.connectionAverage}/5</strong><span>Conexão</span></article></div>
      <div className="bm2900-grid"><article><div className="bm2900-card-title"><AlertTriangle size={18}/><div><strong>Mapa de problemas</strong><span>O que mais derruba seu resultado.</span></div></div>{summary.errorMap.length ? summary.errorMap.map((item) => <div className={`bm2900-error severity-${item.severity}`} key={item.key}><div><strong>{item.label}</strong><span>{item.total} no período • {item.share}% dos erros</span></div><b>{item.perMatch}/jogo</b></div>) : <p className="panel-note">Registre partidas para gerar o mapa.</p>}</article><article><div className="bm2900-card-title"><Target size={18}/><div><strong>{plan.title}</strong><span>{plan.successMetric}</span></div></div><p>{plan.diagnosis}</p>{plan.immediateActions.map((item) => <span className="bm2900-check" key={item}><CheckCircle2 size={14}/>{item}</span>)}</article></div>
      <div className="bm2900-grid"><article><div className="bm2900-card-title"><Trophy size={18}/><div><strong>Melhores formações</strong><span>Nota ponderada por resultado, erros e amostra.</span></div></div>{summary.formations.slice(0,4).map((item, index) => <div className="bm2900-ranking" key={item.key}><i>{index + 1}</i><div><strong>{item.label}</strong><span>{item.matches} jogos • {item.winRate}% vitórias</span></div><b>{item.score}</b></div>)}</article><article><div className="bm2900-card-title"><ShieldCheck size={18}/><div><strong>Regras para a próxima partida</strong><span>Aplicação direta do plano.</span></div></div>{plan.matchRules.map((item) => <span className="bm2900-check" key={item}><CheckCircle2 size={14}/>{item}</span>)}</article></div>
    </>}

    {tab === 'register' && <div className="bm2900-form"><div className="bm2900-form-grid"><label>Competição<input value={form.competition} onChange={(e) => update('competition', e.target.value)}/></label><label>Divisão<input value={form.division} onChange={(e) => update('division', e.target.value)}/></label><label>Formação<select value={form.formation} onChange={(e) => update('formation', e.target.value as TacticalFormation)}>{FORMATIONS.map((item) => <option key={item}>{item}</option>)}</select></label><label>Estilo<select value={form.teamStyle} onChange={(e) => update('teamStyle', e.target.value as TacticalStyle)}>{STYLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Técnico<input value={form.manager} onChange={(e) => update('manager', e.target.value)} placeholder="Ex.: Cruyff"/></label><label>Adversário<select value={form.opponentProfile} onChange={(e) => update('opponentProfile', e.target.value as OpponentProfile)}>{Object.entries(COMPETITIVE_OPPONENT_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div><div className="bm2900-score"><label>Seus gols<input type="number" min={0} max={20} value={form.goalsFor} onChange={(e) => update('goalsFor', Number(e.target.value))}/></label><b>×</b><label>Gols sofridos<input type="number" min={0} max={20} value={form.goalsAgainst} onChange={(e) => update('goalsAgainst', Number(e.target.value))}/></label></div><div className="bm2900-form-grid compact">{([['possession','Posse %'],['shots','Chutes'],['shotsOnTarget','No alvo'],['passErrors','Erros de passe'],['finishingErrors','Erros de finalização'],['defensiveErrors','Erros defensivos'],['turnovers','Perdas de bola'],['substitutionsImpact','Impacto das trocas 1–5'],['connectionQuality','Conexão 1–5']] as const).map(([key,label]) => <label key={key}>{label}<input type="number" min={key === 'possession' ? 0 : 0} max={key === 'possession' ? 100 : key.includes('Impact') ? 5 : 99} value={form[key]} onChange={(e) => update(key, Number(e.target.value))}/></label>)}</div><label>Observações<textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="O que funcionou, onde saiu o gol e o que deve mudar?"/></label><button className="elite-button" onClick={save}><Plus size={17}/> Salvar partida</button></div>}

    {tab === 'compare' && <div className="bm2900-grid"><article><div className="bm2900-card-title"><TrendingUp size={18}/><div><strong>Evolução contra o período anterior</strong><span>Melhor, estável ou pior.</span></div></div>{trends.map((item) => <div className={`bm2900-trend ${item.direction}`} key={item.label}><div><strong>{item.label}</strong><span>Antes {item.previous}</span></div><b>{item.delta >= 0 ? '+' : ''}{item.delta}</b></div>)}</article><article><div className="bm2900-card-title"><Trophy size={18}/><div><strong>Técnicos e estilos</strong><span>Desempenho real registrado.</span></div></div>{summary.managers.slice(0,3).map((item) => <div className="bm2900-ranking" key={item.key}><i>{item.matches}</i><div><strong>{item.label}</strong><span>{item.pointsPerMatch} pts/jogo</span></div><b>{item.score}</b></div>)}{summary.styles.slice(0,3).map((item) => <div className="bm2900-ranking" key={item.key}><i>{item.matches}</i><div><strong>{item.label}</strong><span>{item.winRate}% vitórias</span></div><b>{item.score}</b></div>)}</article></div>}

    {tab === 'report' && <><div className="bm2900-report-actions"><button onClick={() => downloadText(`buildmaster-relatorio-competitivo-${new Date().toISOString().slice(0,10)}.txt`, buildCompetitiveMonthlyReport(records))}><Download size={17}/> Exportar relatório mensal</button>{records.length > 0 && <button className="danger" onClick={() => { if (window.confirm('Apagar todo o histórico competitivo deste aparelho?')) { setRecords([]); safeStorageSetJson(COMPETITIVE_MATCH_STORAGE_KEY, []); } }}><RotateCcw size={17}/> Limpar histórico</button>}</div><div className="bm2900-history">{records.slice(0,50).map((record) => { const outcome = matchOutcome(record); return <article key={record.id}><span className={`result-${outcome}`}>{outcome === 'win' ? 'V' : outcome === 'draw' ? 'E' : 'D'}</span><div><strong>{record.goalsFor} × {record.goalsAgainst} • {record.formation}</strong><span>{new Date(record.playedAt).toLocaleString('pt-BR')} • {record.manager} • {record.division}</span><small>{record.passErrors} passes • {record.finishingErrors} finalizações • {record.defensiveErrors} defesas • conexão {record.connectionQuality}/5</small></div><button aria-label="Apagar partida" onClick={() => remove(record.id)}><Trash2 size={16}/></button></article>})}{!records.length && <p className="panel-note">Nenhuma partida competitiva registrada.</p>}</div></>}
  </section>;
}
