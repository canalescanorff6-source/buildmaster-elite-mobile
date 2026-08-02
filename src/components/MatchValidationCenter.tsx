'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, History, Save, Target, Trash2 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';
import { MATCH_PROBLEM_TAGS, MATCH_VALIDATION_STORAGE_KEY, cardFingerprint, createMatchValidationRecord, summarizeMatchValidation, type MatchValidationRating, type MatchValidationRecord } from '@/lib/appEvolution';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';

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

  useEffect(() => setRecords(loadRecords()), []);
  const fingerprint = cardFingerprint(result);
  const currentRecords = useMemo(() => records.filter((record) => record.cardFingerprint === fingerprint), [records, fingerprint]);
  const summary = useMemo(() => summarizeMatchValidation(currentRecords), [currentRecords]);

  const persist = (next: MatchValidationRecord[]) => {
    const safe = next.slice(0, 1000);
    setRecords(safe);
    writeAccountStorage(MATCH_VALIDATION_STORAGE_KEY, JSON.stringify(safe));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('buildmaster:match-validation-updated', { detail: { total: safe.length } }));
  };

  const save = () => {
    const record = createMatchValidationRecord(result, { minutes: Math.max(1, Math.min(130, minutes)), overallRating, passing, movement, finishing, defending, physical, stamina, tags, note: note.trim() });
    persist([record, ...records]);
    setTags([]);
    setNote('');
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
      {(summary.strongestAreas.length > 0 || summary.weakestAreas.length > 0) && <div className="match-area-summary"><div><strong>Melhores áreas</strong>{summary.strongestAreas.map((item) => <span key={item}>{item}</span>)}</div><div><strong>Áreas para observar</strong>{summary.weakestAreas.map((item) => <span key={item}>{item}</span>)}</div></div>}
      {summary.repeatedProblems.length > 0 && <div className="match-repeated-problems"><strong>Padrões repetidos</strong>{summary.repeatedProblems.slice(0, 5).map((item) => <span key={item.tag}>{item.tag} • {item.count} vezes</span>)}</div>}
    </article>

    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker"><Save size={14}/> Registrar nova partida</p><h3>Avalie somente o que você realmente percebeu</h3></div><span>1 = ruim • 5 = ótimo</span></div>
      <label className="match-minutes-field"><span>Minutos usados</span><input type="number" min={1} max={130} value={minutes} onChange={(event) => setMinutes(Number(event.target.value) || 1)}/></label>
      <div className="match-rating-grid">
        <RatingField label="Avaliação geral" value={overallRating} onChange={setOverallRating}/>
        <RatingField label="Passe" value={passing} onChange={setPassing}/>
        <RatingField label="Movimentação" value={movement} onChange={setMovement}/>
        <RatingField label="Finalização" value={finishing} onChange={setFinishing}/>
        <RatingField label="Defesa" value={defending} onChange={setDefending}/>
        <RatingField label="Físico" value={physical} onChange={setPhysical}/>
        <RatingField label="Resistência" value={stamina} onChange={setStamina}/>
      </div>
      <div className="match-tag-picker"><span>O que aconteceu?</span><div>{MATCH_PROBLEM_TAGS.map((tag) => <button type="button" key={tag} className={tags.includes(tag) ? 'selected' : ''} onClick={() => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])}>{tag}</button>)}</div></div>
      <label className="match-note-field"><span>Observação opcional</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ex.: jogou como VOL pela esquerda contra pressão alta"/></label>
      <div className="match-validation-actions"><button type="button" className="elite-button" onClick={save}><Save size={16}/> Salvar avaliação</button>{currentRecords.length > 0 && <button type="button" onClick={reset}><Trash2 size={16}/> Limpar histórico desta carta</button>}</div>
      {message && <p className="inline-status-message" role="status">{message}</p>}
    </article>

    {currentRecords.length > 0 && <article className="luxury-panel wide-card"><div className="section-title-row"><div><p className="kicker"><History size={14}/> Histórico recente</p><h3>Últimas avaliações desta carta</h3></div><span>{currentRecords.length}</span></div><div className="match-history-list">{currentRecords.slice(0, 8).map((record) => <div key={record.id}><strong>{new Date(record.playedAt).toLocaleDateString('pt-BR')} • nota {record.overallRating}/5</strong><span>{record.minutes} min • {record.buildName}</span><small>{record.tags.join(' • ') || 'Sem ocorrência marcada'}</small>{record.note && <em>{record.note}</em>}</div>)}</div></article>}
  </div>;
}
