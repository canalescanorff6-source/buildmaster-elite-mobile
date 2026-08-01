'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Activity, CheckCircle2, History, Save, Target, Trash2 } from 'lucide-react';
import { RealValidationV3760Panel } from '@/components/RealValidationV3760Panel';
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
import { buildRealValidationV3760, REAL_VALIDATION_PROFILE_STORAGE_KEY, type ControlStyleV3760 } from '@/lib/realValidationV3760';

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
  shots: 0,
  saves: 0,
  goalsConceded: 0,
  clearances: 0,
  blocks: 0,
  aerialDuelsWon: 0,
  duelsWon: 0,
  recoveries: 0,
  progressivePasses: 0,
  keyPasses: 0,
  shotsOnTarget: 0,
  runsBehind: 0,
  successfulPressures: 0
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
  const [testedOptionKey, setTestedOptionKey] = useState('');
  const [controlStyle, setControlStyle] = useState<ControlStyleV3760>('mixed');
  const [inputDelayRating, setInputDelayRating] = useState<MatchValidationRating>(3);

  useEffect(() => setRecords(loadRecords()), []);
  const fingerprint = cardFingerprint(result);
  const currentRecords = useMemo(() => records.filter((record) => record.cardFingerprint === fingerprint), [records, fingerprint]);
  const summary = useMemo(() => summarizeMatchValidation(currentRecords), [currentRecords]);
  const evidenceLoop = useMemo(() => buildMatchEvidenceLoop(result, records), [result, records]);
  const realValidation = useMemo(() => buildRealValidationV3760(result, records), [result, records]);
  const testedOptions = useMemo(() => realValidation.experiment.arms.map((arm) => ({ key: `${arm.buildId}::${arm.boosterName}`, arm: arm.arm, buildId: arm.buildId, buildTitle: arm.buildTitle, boosterName: arm.boosterName })), [realValidation.experiment.arms]);
  const effectiveTestedOptionKey = testedOptionKey || testedOptions[0]?.key || '';
  const positionMetricFields = useMemo<Array<{ key: keyof MatchPerformanceMetrics; label: string }>>(() => {
    const position = result.bestPosition.code;
    if (position === 'GK') return [{ key: 'saves', label: 'Defesas' }, { key: 'goalsConceded', label: 'Gols sofridos' }, { key: 'progressivePasses', label: 'Saídas progressivas' }, { key: 'aerialDuelsWon', label: 'Bolas aéreas dominadas' }];
    if (['CB', 'LB', 'RB'].includes(position)) return [{ key: 'clearances', label: 'Cortes' }, { key: 'blocks', label: 'Bloqueios' }, { key: 'aerialDuelsWon', label: 'Duelos aéreos ganhos' }, { key: 'duelsWon', label: 'Duelos vencidos' }];
    if (['DMF', 'CMF', 'LMF', 'RMF', 'AMF'].includes(position)) return [{ key: 'progressivePasses', label: 'Passes progressivos' }, { key: 'keyPasses', label: 'Passes-chave' }, { key: 'recoveries', label: 'Recuperações' }, { key: 'successfulPressures', label: 'Pressões bem-sucedidas' }];
    return [{ key: 'shotsOnTarget', label: 'Chutes no alvo' }, { key: 'runsBehind', label: 'Desmarques em profundidade' }, { key: 'keyPasses', label: 'Passes-chave' }, { key: 'successfulPressures', label: 'Pressões bem-sucedidas' }];
  }, [result.bestPosition.code]);

  const persist = (next: MatchValidationRecord[]) => {
    const safe = next.slice(0, 1000);
    setRecords(safe);
    writeAccountStorage(MATCH_VALIDATION_STORAGE_KEY, JSON.stringify(safe));
    const profile = buildRealValidationV3760(result, safe).userLearning;
    writeAccountStorage(REAL_VALIDATION_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('buildmaster:match-validation-updated', { detail: { total: safe.length, engineVersion: '37.60.0' } }));
  };

  const save = () => {
    const testedOption = testedOptions.find((option) => option.key === effectiveTestedOptionKey) ?? testedOptions[0];
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
      metrics,
      testedBuildId: testedOption?.buildId,
      testedBuildTitle: testedOption?.buildTitle,
      testedBoosterName: testedOption?.boosterName,
      experimentArm: testedOption?.arm ?? 'NONE',
      controlStyle,
      inputDelayRating
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
    <RealValidationV3760Panel analysis={realValidation} />
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
        <label><span>Opção do laboratório A/B</span><select value={effectiveTestedOptionKey} onChange={(event: ChangeEvent<HTMLSelectElement>) => setTestedOptionKey(event.target.value)}>{testedOptions.map((option) => <option key={option.key} value={option.key}>Opção {option.arm} • {option.buildTitle} • {option.boosterName}</option>)}</select></label>
        <label><span>Estilo de controle</span><select value={controlStyle} onChange={(event: ChangeEvent<HTMLSelectElement>) => setControlStyle(event.target.value as ControlStyleV3760)}><option value="quick-pass">Toques e passes rápidos</option><option value="carry-dribble">Condução e drible</option><option value="mixed">Misto e adaptável</option><option value="manual-defense">Defesa e marcação manual</option></select></label>
        <label><span>Delay percebido</span><select value={inputDelayRating} onChange={(event: ChangeEvent<HTMLSelectElement>) => setInputDelayRating(Number(event.target.value) as MatchValidationRating)}>{RATING_OPTIONS.map((rating) => <option key={rating} value={rating}>{rating} — {rating <= 2 ? 'baixo' : rating === 3 ? 'médio' : 'alto'}</option>)}</select></label>
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
        {positionMetricFields.map((field) => <MetricField key={field.key} label={field.label} value={Number(metrics[field.key] || 0)} onChange={(value) => setMetrics((current) => ({ ...current, [field.key]: value }))}/>)}
      </div>
      <label className="professional-second-half-toggle"><input type="checkbox" checked={secondHalfDrop} onChange={(event: ChangeEvent<HTMLInputElement>) => setSecondHalfDrop(event.target.checked)}/><span>O desempenho caiu claramente no segundo tempo</span></label>
      <div className="match-tag-picker"><span>O que aconteceu?</span><div>{MATCH_PROBLEM_TAGS.map((tag) => <button type="button" key={tag} className={tags.includes(tag) ? 'selected' : ''} onClick={() => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])}>{tag}</button>)}</div></div>
      <label className="match-note-field"><span>Observação opcional</span><textarea value={note} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)} placeholder="Ex.: jogou como VOL pela esquerda contra pressão alta"/></label>
      <div className="match-validation-actions"><button type="button" className="elite-button" onClick={save}><Save size={16}/> Salvar avaliação</button>{currentRecords.length > 0 && <button type="button" onClick={reset}><Trash2 size={16}/> Limpar histórico desta carta</button>}</div>
      {message && <p className="inline-status-message" role="status">{message}</p>}
    </article>

    {currentRecords.length > 0 && <article className="luxury-panel wide-card"><div className="section-title-row"><div><p className="kicker"><History size={14}/> Histórico recente</p><h3>Últimas avaliações desta carta</h3></div><span>{currentRecords.length}</span></div><div className="match-history-list">{currentRecords.slice(0, 8).map((record) => <div key={record.id}><strong>{new Date(record.playedAt).toLocaleDateString('pt-BR')} • nota {record.overallRating}/5</strong><span>{record.minutes} min • {record.testedBuildTitle || record.buildName}{record.experimentArm && record.experimentArm !== 'NONE' ? ` • Opção ${record.experimentArm}` : ''}</span><small>{record.testedBoosterName ? `${record.testedBoosterName} • ` : ''}{record.tags.join(' • ') || 'Sem ocorrência marcada'}</small>{record.note && <em>{record.note}</em>}</div>)}</div></article>}
  </div>;
}
