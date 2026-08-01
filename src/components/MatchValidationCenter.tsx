'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Activity, CheckCircle2, History, Save, Target, Trash2 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';
import {
  MATCH_PROBLEM_TAGS,
  MATCH_VALIDATION_STORAGE_KEY,
  cardFingerprint,
  createMatchValidationRecord,
  summarizeMatchValidation,
  type MatchConnectionState,
  type MatchPerformanceMetrics,
  type MatchValidationMode,
  type MatchValidationRating,
  type MatchValidationRecord
} from '@/lib/appEvolution';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { buildMatchEvidenceLoop } from '@/lib/professionalIntelligenceV37';

const RATING_OPTIONS: MatchValidationRating[] = [1, 2, 3, 4, 5];

function loadRecords(): MatchValidationRecord[] {
  try {
    const parsed = JSON.parse(readAccountStorage(MATCH_VALIDATION_STORAGE_KEY) || '[]') as MatchValidationRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function RatingField({ label, value, onChange }: { label: string; value: MatchValidationRating; onChange: (value: MatchValidationRating) => void }) {
  return <label className="match-rating-field"><span>{label}</span><div>{RATING_OPTIONS.map((rating) => <button type="button" key={rating} className={value === rating ? 'selected' : ''} onClick={() => onChange(rating)}>{rating}</button>)}</div></label>;
}

function MetricField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="match-metric-field"><span>{label}</span><input type="number" min={0} max={99} value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Math.max(0, Math.min(99, Number(event.target.value) || 0)))}/></label>;
}

const EMPTY_METRICS: MatchPerformanceMetrics = {
  goals: 0,
  assists: 0,
  passErrors: 0,
  tackles: 0,
  interceptions: 0,
  ballLosses: 0,
  dribblesCompleted: 0,
  shots: 0
};

export function MatchValidationCenter({ result }: { result: AnalysisResult }) {
  const [records, setRecords] = useState<MatchValidationRecord[]>([]);
  const [minutes, setMinutes] = useState(90);
  const [overallRating, setOverallRating] = useState<MatchValidationRating>(3);
  const [passing, setPassing] = useState<MatchValidationRating>(3);
  const [movement, setMovement] = useState<MatchValidationRating>(3);
  const [finishing, setFinishing] = useState<MatchValidationRating>(3);
  const [defending, setDefending] = useState<MatchValidationRating>(3);
  const [physical, setPhysical] = useState<MatchValidationRating>(3);
  const [stamina, setStamina] = useState<MatchValidationRating>(3);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<MatchValidationMode>('ranked');
  const [connection, setConnection] = useState<MatchConnectionState>('stable');
  const [gameplayProfileId, setGameplayProfileId] = useState(result.gameplayDna?.primaryProfileId ?? 'MAIN');
  const [secondHalfDrop, setSecondHalfDrop] = useState(false);
  const [metrics, setMetrics] = useState<MatchPerformanceMetrics>(EMPTY_METRICS);

  useEffect(() => setRecords(loadRecords()), []);
  const fingerprint = cardFingerprint(result);
  const currentRecords = useMemo(() => records.filter((record) => record.cardFingerprint === fingerprint), [records, fingerprint]);
  const summary = useMemo(() => summarizeMatchValidation(currentRecords), [currentRecords]);
  const evidenceLoop = useMemo(() => buildMatchEvidenceLoop(result, records), [result, records]);

  const persist = (next: MatchValidationRecord[]) => {
    const safe = next.slice(0, 1000);
    setRecords(safe);
    writeAccountStorage(MATCH_VALIDATION_STORAGE_KEY, JSON.stringify(safe));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('buildmaster:match-validation-updated', { detail: { total: safe.length } }));
  };

  const save = () => {
    const record = createMatchValidationRecord(result, {
      minutes: Math.max(1, Math.min(130, minutes)),
      overallRating,
      passing,
      movement,
      finishing,
      defending,
      physical,
      stamina,
      tags,
      note: note.trim(),
      mode,
      connection,
      gameplayProfileId,
      secondHalfDrop,
      metrics
    });
    persist([record, ...records]);
    setTags([]);
    setNote('');
    setSecondHalfDrop(false);
    setMetrics(EMPTY_METRICS);
    setMessage(`Partida registrada. Esta ficha agora possui ${currentRecords.length + 1} avaliação(ões).`);
  };

  const reset = () => {
    persist(records.filter((record) => record.cardFingerprint !== fingerprint));
    setMessage('Histórico desta carta removido. A ficha original foi preservada.');
  };

  return <div className="result-section-grid match-validation-center">
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker"><Target size={14}/> Validação em partidas</p><h3>Teste a ficha sem alterar a recomendação original</h3></div><span>{summary.totalMatches} partida(s)</span></div>
      <div className="health-score-grid match-summary-grid">
        <article><strong>{summary.average || '—'}</strong><span>Média geral</span><small>de 5</small></article>
        <article><strong>{summary.consistency || '—'}</strong><span>Consistência</span><small>de 100</small></article>
        <article><strong>{summary.confidence}</strong><span>Confiança</span><small>da amostra</small></article>
        <article><strong>{summary.totalMatches}</strong><span>Partidas</span><small>mesma carta</small></article>
      </div>
      <div className="match-validation-verdict"><CheckCircle2 size={20}/><div><strong>Leitura do histórico</strong><span>{summary.recommendation}</span></div></div>
      <div className="match-validation-verdict professional-evidence-verdict"><Activity size={20}/><div><strong>Ciclo profissional • confiança {evidenceLoop.confidence}</strong><span>{evidenceLoop.verdict}</span>{evidenceLoop.correction && <small>{evidenceLoop.correction}</small>}</div></div>
      {(summary.strongestAreas.length > 0 || summary.weakestAreas.length > 0) && <div className="match-area-summary"><div><strong>Melhores áreas</strong>{summary.strongestAreas.map((item) => <span key={item}>{item}</span>)}</div><div><strong>Áreas para observar</strong>{summary.weakestAreas.map((item) => <span key={item}>{item}</span>)}</div></div>}
      {summary.repeatedProblems.length > 0 && <div className="match-repeated-problems"><strong>Padrões repetidos</strong>{summary.repeatedProblems.slice(0, 5).map((item) => <span key={item.tag}>{item.tag} • {item.count} vezes</span>)}</div>}
      {summary.evidence && <div className="professional-match-evidence-grid"><span><b>{summary.evidence.goals}</b> gols</span><span><b>{summary.evidence.assists}</b> assist.</span><span><b>{summary.evidence.dribblesCompleted}</b> dribles</span><span><b>{summary.evidence.interceptions}</b> intercept.</span><span><b>{summary.evidence.passErrors}</b> erros passe</span><span><b>{summary.evidence.ballLosses}</b> perdas</span></div>}
    </article>

    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker"><Save size={14}/> Registrar nova partida</p><h3>Avalie somente o que você realmente percebeu</h3></div><span>1 = ruim • 5 = ótimo</span></div>
      <div className="professional-match-context-grid">
        <label><span>Modo</span><select value={mode} onChange={(event: ChangeEvent<HTMLSelectElement>) => setMode(event.target.value as MatchValidationMode)}><option value="ranked">Ranqueada</option><option value="events">Eventos</option><option value="friendly">Amistosa</option><option value="offline">Offline</option></select></label>
        <label><span>Conexão</span><select value={connection} onChange={(event: ChangeEvent<HTMLSelectElement>) => setConnection(event.target.value as MatchConnectionState)}><option value="stable">Estável</option><option value="variable">Variável</option><option value="high_delay">Delay alto</option></select></label>
        <label><span>Perfil usado</span><select value={gameplayProfileId} onChange={(event: ChangeEvent<HTMLSelectElement>) => setGameplayProfileId(event.target.value)}>{(result.gameplayDna?.profiles ?? []).map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}{!result.gameplayDna?.profiles.length && <option value="MAIN">Ficha principal</option>}</select></label>
        <label className="match-minutes-field"><span>Minutos usados</span><input type="number" min={1} max={130} value={minutes} onChange={(event: ChangeEvent<HTMLInputElement>) => setMinutes(Number(event.target.value) || 1)}/></label>
      </div>
      <div className="match-rating-grid">
        <RatingField label="Avaliação geral" value={overallRating} onChange={setOverallRating}/>
        <RatingField label="Passe" value={passing} onChange={setPassing}/>
        <RatingField label="Movimentação" value={movement} onChange={setMovement}/>
        <RatingField label="Finalização" value={finishing} onChange={setFinishing}/>
        <RatingField label="Defesa" value={defending} onChange={setDefending}/>
        <RatingField label="Físico" value={physical} onChange={setPhysical}/>
        <RatingField label="Resistência" value={stamina} onChange={setStamina}/>
      </div>
      <div className="section-title-row compact-professional-title"><div><p className="kicker">Evidência objetiva</p><h3>Números da atuação</h3></div><span>opcional</span></div>
      <div className="professional-match-metrics-grid">
        <MetricField label="Gols" value={metrics.goals} onChange={(value) => setMetrics((current) => ({ ...current, goals: value }))}/>
        <MetricField label="Assistências" value={metrics.assists} onChange={(value) => setMetrics((current) => ({ ...current, assists: value }))}/>
        <MetricField label="Erros de passe" value={metrics.passErrors} onChange={(value) => setMetrics((current) => ({ ...current, passErrors: value }))}/>
        <MetricField label="Desarmes" value={metrics.tackles} onChange={(value) => setMetrics((current) => ({ ...current, tackles: value }))}/>
        <MetricField label="Interceptações" value={metrics.interceptions} onChange={(value) => setMetrics((current) => ({ ...current, interceptions: value }))}/>
        <MetricField label="Perdas de bola" value={metrics.ballLosses} onChange={(value) => setMetrics((current) => ({ ...current, ballLosses: value }))}/>
        <MetricField label="Dribles concluídos" value={metrics.dribblesCompleted} onChange={(value) => setMetrics((current) => ({ ...current, dribblesCompleted: value }))}/>
        <MetricField label="Finalizações" value={metrics.shots} onChange={(value) => setMetrics((current) => ({ ...current, shots: value }))}/>
      </div>
      <label className="professional-second-half-toggle"><input type="checkbox" checked={secondHalfDrop} onChange={(event: ChangeEvent<HTMLInputElement>) => setSecondHalfDrop(event.target.checked)}/><span>O desempenho caiu claramente no segundo tempo</span></label>
      <div className="match-tag-picker"><span>O que aconteceu?</span><div>{MATCH_PROBLEM_TAGS.map((tag) => <button type="button" key={tag} className={tags.includes(tag) ? 'selected' : ''} onClick={() => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])}>{tag}</button>)}</div></div>
      <label className="match-note-field"><span>Observação opcional</span><textarea value={note} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)} placeholder="Ex.: jogou como VOL pela esquerda contra pressão alta"/></label>
      <div className="match-validation-actions"><button type="button" className="elite-button" onClick={save}><Save size={16}/> Salvar avaliação</button>{currentRecords.length > 0 && <button type="button" onClick={reset}><Trash2 size={16}/> Limpar histórico desta carta</button>}</div>
      {message && <p className="inline-status-message" role="status">{message}</p>}
    </article>

    {currentRecords.length > 0 && <article className="luxury-panel wide-card"><div className="section-title-row"><div><p className="kicker"><History size={14}/> Histórico recente</p><h3>Últimas avaliações desta carta</h3></div><span>{currentRecords.length}</span></div><div className="match-history-list">{currentRecords.slice(0, 8).map((record) => <div key={record.id}><strong>{new Date(record.playedAt).toLocaleDateString('pt-BR')} • nota {record.overallRating}/5</strong><span>{record.minutes} min • {record.buildName}</span><small>{record.tags.join(' • ') || 'Sem ocorrência marcada'}</small>{record.note && <em>{record.note}</em>}</div>)}</div></article>}
  </div>;
}
