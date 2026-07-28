'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleStop, Clock3, Download, Film, Gauge, Import, LoaderCircle, Play, RotateCcw, ShieldCheck, Smartphone, Trash2, Video, Wifi } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import type { TacticalStyle } from '@/lib/analyzer';
import type { TeamDiagnosis } from '@/modules/core/centralIntelligence';
import {
  deleteMatchRecording,
  getMatchRecorderCapabilities,
  getMatchRecorderStatus,
  listMatchRecordings,
  listenToMatchRecorder,
  restoreMatchRecorderOrientation,
  startMatchRecording,
  stopMatchRecording,
  type MatchRecorderCapabilities,
  type MatchRecordingDescriptor,
  type MatchRecordingQuality,
  type MatchRecorderStatus
} from './matchRecorderBridge';
import {
  analyzeMatchVideo,
  createMatchMarker,
  createMatchTrainerSession,
  deleteMatchTrainerSession,
  exportMatchTrainerReport,
  readMatchTrainerSessions,
  summarizeMatchTrainerSession,
  upsertMatchTrainerSession,
  type MatchEventKind,
  type MatchTrainerSession
} from './matchTrainerEngine';

const QUALITY_LABELS: Record<MatchRecordingQuality, { title: string; detail: string }> = {
  economy: { title: 'Econômico', detail: '540p • 24 FPS • menor aquecimento' },
  balanced: { title: 'Equilibrado', detail: '720p • 30 FPS • recomendado' },
  detailed: { title: 'Detalhado', detail: '1080p • 30 FPS • maior consumo' }
};

const MARKER_ACTIONS: Array<{ kind: MatchEventKind; label: string }> = [
  { kind: 'pass-error', label: 'Erro de passe' },
  { kind: 'dangerous-turnover', label: 'Perda perigosa' },
  { kind: 'marking-error', label: 'Erro de marcação' },
  { kind: 'cursor-error', label: 'Troca de cursor' },
  { kind: 'forced-shot', label: 'Chute forçado' },
  { kind: 'possible-delay', label: 'Possível delay' },
  { kind: 'good-play', label: 'Boa jogada' },
  { kind: 'goal-for', label: 'Gol marcado' },
  { kind: 'goal-against', label: 'Gol sofrido' }
];

const emptyStatus: MatchRecorderStatus = { state: 'idle', active: false, startedAt: null, elapsedMs: 0 };
const formatDuration = (ms: number) => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms % 60000 / 1000)).padStart(2, '0')}`;

function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function MatchTrainerCenter({ team, teamStyle }: { team: TeamDiagnosis; teamStyle: TacticalStyle }) {
  const [capabilities, setCapabilities] = useState<MatchRecorderCapabilities | null>(null);
  const [recorderStatus, setRecorderStatus] = useState<MatchRecorderStatus>(emptyStatus);
  const [quality, setQuality] = useState<MatchRecordingQuality>('balanced');
  const [sessions, setSessions] = useState<MatchTrainerSession[]>(() => readMatchTrainerSessions());
  const [activeId, setActiveId] = useState<string | null>(() => readMatchTrainerSessions()[0]?.id || null);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [importedUrl, setImportedUrl] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<MatchRecordingDescriptor[]>([]);
  const [message, setMessage] = useState('Escolha gravar no Android ou importar uma gravação já existente.');
  const [busy, setBusy] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [markerNote, setMarkerNote] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastHandledRecordingRef = useRef('');

  const active = useMemo(() => sessions.find((session) => session.id === activeId) || null, [activeId, sessions]);
  const summary = useMemo(() => active ? summarizeMatchTrainerSession(active) : null, [active]);
  const nativeVideoUrl = active?.videoPath ? Capacitor.convertFileSrc(active.videoPath) : null;
  const videoUrl = active?.source === 'imported-video' && importedFile?.name === active.fileName ? importedUrl : nativeVideoUrl;

  function commitSession(session: MatchTrainerSession) {
    const next = upsertMatchTrainerSession({ ...session, updatedAt: new Date().toISOString() });
    setSessions(next);
    setActiveId(session.id);
  }

  function createFromRecording(recording: MatchRecordingDescriptor, options: { focus?: boolean; quiet?: boolean } = {}) {
    if (!recording.path) return null;
    const stored = readMatchTrainerSessions();
    const existing = stored.find((session) => session.recording?.id === recording.id);
    if (existing) {
      setSessions(stored);
      if (options.focus !== false) setActiveId(existing.id);
      return existing;
    }
    if (lastHandledRecordingRef.current === recording.id) return null;
    lastHandledRecordingRef.current = recording.id;
    const created = createMatchTrainerSession({
      source: 'native-recording',
      fileName: recording.fileName,
      fileSizeBytes: recording.sizeBytes,
      videoPath: recording.path,
      recording,
      quality: recording.quality,
      formation: team.formation,
      teamStyle,
      manager: 'Técnico do Meu Time'
    });
    const recordingDate = Number.isFinite(Date.parse(recording.createdAt)) ? recording.createdAt : created.createdAt;
    const session = { ...created, createdAt: recordingDate, updatedAt: recordingDate };
    const next = upsertMatchTrainerSession(session);
    setSessions(next);
    if (options.focus !== false) setActiveId(session.id);
    if (!options.quiet) setMessage('Gravação salva no aparelho. Revise o vídeo, marque os lances e execute a análise local.');
    return session;
  }

  async function waitForRecordingCompletion(timeoutMs = 20_000) {
    const deadline = Date.now() + timeoutMs;
    let status = await getMatchRecorderStatus();
    while (status.active || status.state === 'stopping' || status.state === 'requesting') {
      if (Date.now() >= deadline) throw new Error('O Android demorou para finalizar o vídeo. Aguarde alguns segundos e abra novamente o Treinador de Partidas.');
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      status = await getMatchRecorderStatus();
      setRecorderStatus(status);
    }
    return status;
  }

  useEffect(() => {
    let activeEffect = true;
    let listener: Awaited<ReturnType<typeof listenToMatchRecorder>> = null;
    void (async () => {
      const nextCapabilities = await getMatchRecorderCapabilities();
      if (!activeEffect) return;
      setCapabilities(nextCapabilities);
      if (nextCapabilities.profiles.includes(nextCapabilities.maxRecommendedProfile)) setQuality(nextCapabilities.maxRecommendedProfile);
      try {
        const [status, saved] = await Promise.all([getMatchRecorderStatus(), listMatchRecordings()]);
        if (!activeEffect) return;
        setRecorderStatus(status);
        setRecordings(saved);
        for (const recording of [...saved].reverse()) createFromRecording(recording, { focus: false, quiet: true });
        const restoredSessions = readMatchTrainerSessions();
        setSessions(restoredSessions);
        if (!activeId && restoredSessions[0]) setActiveId(restoredSessions[0].id);
        if (status.last?.state === 'completed') createFromRecording(status.last, { quiet: true });
      } catch {
        // O modo importar vídeo continua funcional mesmo sem ponte nativa.
      }
      listener = await listenToMatchRecorder((status) => {
        if (!activeEffect) return;
        setRecorderStatus(status);
        if (status.last?.state === 'completed') createFromRecording(status.last);
      });
    })();
    return () => {
      activeEffect = false;
      void listener?.remove();
    };
  }, []);

  useEffect(() => {
    if (!recorderStatus.active) return;
    const timer = window.setInterval(() => {
      void getMatchRecorderStatus().then((status) => {
        setRecorderStatus(status);
        if (status.last?.state === 'completed') createFromRecording(status.last);
      }).catch(() => undefined);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recorderStatus.active]);

  useEffect(() => () => {
    if (importedUrl) URL.revokeObjectURL(importedUrl);
    abortRef.current?.abort();
  }, [importedUrl]);

  async function beginRecording() {
    setBusy(true);
    setMessage('O Android abrirá a autorização oficial de captura. Confirme somente a tela do jogo.');
    try {
      const status = await startMatchRecording({ quality, landscape: true, includeMicrophone: false, title: 'Partida eFootball' });
      setRecorderStatus(status);
      setMessage('Gravação ativa. Agora alterne para o eFootball. Para encerrar, use a notificação do BuildMaster ou volte ao app.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível iniciar a gravação.');
    } finally {
      setBusy(false);
    }
  }

  async function finishRecording() {
    setBusy(true);
    setMessage('Finalizando e validando o arquivo de vídeo...');
    try {
      const stopping = await stopMatchRecording();
      setRecorderStatus(stopping);
      const status = await waitForRecordingCompletion();
      setRecorderStatus(status);
      const saved = await listMatchRecordings();
      setRecordings(saved);
      for (const recording of [...saved].reverse()) createFromRecording(recording, { focus: false, quiet: true });
      const completed = status.last || saved[0];
      if (status.state === 'error') throw new Error(status.message || 'O Android não conseguiu gerar um vídeo válido.');
      if (completed?.state === 'completed') createFromRecording(completed);
      else setMessage('Gravação finalizada. O arquivo aparecerá assim que o Android concluir a validação.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível encerrar a gravação corretamente.');
    } finally {
      await restoreMatchRecorderOrientation().catch(() => false);
      setBusy(false);
    }
  }

  function importVideo(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith('video/') && !/\.(mp4|webm|mkv|mov|m4v)$/i.test(file.name)) {
      setMessage('Escolha um arquivo de vídeo válido, preferencialmente MP4.');
      return;
    }
    if (file.size > 1_500_000_000) {
      setMessage('O vídeo ultrapassa 1,5 GB. Recorte a partida antes de importar.');
      return;
    }
    if (importedUrl) URL.revokeObjectURL(importedUrl);
    const url = URL.createObjectURL(file);
    setImportedFile(file);
    setImportedUrl(url);
    const session = createMatchTrainerSession({ source: 'imported-video', fileName: file.name, fileSizeBytes: file.size, quality: 'imported', formation: team.formation, teamStyle, manager: 'Técnico do Meu Time' });
    commitSession(session);
    setMessage('Vídeo importado. Ele fica disponível nesta sessão; execute a análise e marque os eventos importantes.');
  }

  async function runAnalysis() {
    if (!active || !videoUrl) {
      setMessage(active?.source === 'imported-video' ? 'Importe novamente o vídeo para continuar a análise desta sessão.' : 'O arquivo de vídeo não está acessível.');
      return;
    }
    setBusy(true);
    setAnalysisProgress(0);
    setAnalysisMessage('Preparando vídeo');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const analyzing = { ...active, status: 'analyzing' as const, updatedAt: new Date().toISOString() };
    commitSession(analyzing);
    try {
      const source: Blob | string = active.source === 'imported-video' && importedFile?.name === active.fileName ? importedFile : videoUrl;
      const analysisQuality = active.quality === 'imported' ? 'balanced' : active.quality;
      const analysis = await analyzeMatchVideo(source, {
        sampleIntervalMs: analysisQuality === 'economy' ? 2500 : analysisQuality === 'detailed' ? 1250 : 1800,
        maxSamples: analysisQuality === 'economy' ? 120 : analysisQuality === 'detailed' ? 240 : 180,
        onProgress: (progress, detail) => { setAnalysisProgress(progress); setAnalysisMessage(detail); },
        signal: controller.signal
      });
      const completed: MatchTrainerSession = { ...active, analysis, status: 'review', updatedAt: new Date().toISOString() };
      commitSession(completed);
      setMessage(`Análise concluída com qualidade ${analysis.qualityScore}%. Os sinais automáticos precisam ser revisados antes de virar conclusão.`);
    } catch (error) {
      const failed: MatchTrainerSession = { ...active, status: 'failed', updatedAt: new Date().toISOString() };
      commitSession(failed);
      setMessage(error instanceof Error ? error.message : 'A análise local não foi concluída.');
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  function addMarker(kind: MatchEventKind) {
    if (!active) return;
    const atMs = Math.round((videoRef.current?.currentTime || 0) * 1000);
    const marker = createMatchMarker(kind, atMs, markerNote);
    commitSession({ ...active, markers: [...active.markers, marker].sort((a, b) => a.atMs - b.atMs), status: 'review' });
    setMarkerNote('');
    setMessage(`${marker.title} registrado em ${formatDuration(atMs)}.`);
  }

  function removeMarker(id: string) {
    if (!active) return;
    commitSession({ ...active, markers: active.markers.filter((marker) => marker.id !== id) });
  }

  function updateActive(patch: Partial<MatchTrainerSession>) {
    if (!active) return;
    commitSession({ ...active, ...patch });
  }

  function exportReport() {
    if (!active) return;
    downloadText(`buildmaster-partida-${active.createdAt.slice(0, 10)}.txt`, exportMatchTrainerReport(active));
  }

  async function removeSession(session: MatchTrainerSession) {
    if (session.recording?.id) {
      try {
        await deleteMatchRecording(session.recording.id);
        setRecordings(await listMatchRecordings());
      } catch {
        setMessage('O relatório foi removido, mas o Android não confirmou a exclusão do vídeo.');
      }
    }
    const next = deleteMatchTrainerSession(session.id);
    setSessions(next);
    setActiveId(next[0]?.id || null);
  }

  const allMarkers = active ? [...(active.analysis?.automaticMarkers || []), ...active.markers].sort((a, b) => a.atMs - b.atMs) : [];

  return <section className="match-trainer-v3170">
    <div className="match-trainer-intro luxury-panel">
      <div><p className="kicker"><Video size={15}/> v31.70 • Treinador de Partidas</p><h3>Grave, revise e entenda sua gameplay sem interferir no eFootball.</h3><span>O Android grava passivamente. A análise ocorre depois da partida, no aparelho, e nunca controla o jogo nem altera sua ficha automaticamente.</span></div>
      <div className={`match-recorder-state state-${recorderStatus.state}`}><i>{recorderStatus.active ? <LoaderCircle size={22}/> : <ShieldCheck size={22}/>}</i><div><strong>{recorderStatus.active ? 'Gravação ativa' : capabilities?.supported ? 'Android preparado' : 'Modo de importação'}</strong><span>{recorderStatus.active ? formatDuration(recorderStatus.elapsedMs) : capabilities?.reason || 'Pronto para analisar vídeos.'}</span></div></div>
    </div>

    <div className="match-trainer-capture-grid">
      <article className="luxury-panel match-capture-card">
        <div className="v27-panel-heading"><div><p className="kicker"><Smartphone size={14}/> Captura oficial Android</p><h3>Gravar uma partida completa</h3></div><span>{capabilities?.supported ? 'Disponível' : 'APK necessário'}</span></div>
        <div className="match-quality-options" role="radiogroup" aria-label="Qualidade da gravação">{(Object.keys(QUALITY_LABELS) as MatchRecordingQuality[]).map((item) => <label key={item} className={quality === item ? 'active' : ''}><input type="radio" name="recording-quality" value={item} checked={quality === item} disabled={recorderStatus.active || !capabilities?.profiles.includes(item)} onChange={() => setQuality(item)}/><span><strong>{QUALITY_LABELS[item].title}</strong><small>{QUALITY_LABELS[item].detail}</small></span></label>)}</div>
        <div className="match-capture-actions">{recorderStatus.active ? <button type="button" className="danger-button" disabled={busy} onClick={finishRecording}><CircleStop size={18}/> Parar e salvar</button> : <button type="button" className="elite-button" disabled={busy || !capabilities?.supported} onClick={beginRecording}><Video size={18}/> Iniciar gravação</button>}<small>Sem microfone e sem envio automático. O Android pede autorização em toda nova sessão.</small></div>
      </article>

      <article className="luxury-panel match-import-card">
        <div className="v27-panel-heading"><div><p className="kicker"><Import size={14}/> Compatibilidade</p><h3>Importar gravação existente</h3></div><span>Android e navegador</span></div>
        <input ref={fileInputRef} className="sr-only" type="file" accept="video/mp4,video/webm,video/quicktime,video/*" onChange={(event: { target: HTMLInputElement }) => importVideo(event.target.files?.[0] || null)}/>
        <button type="button" className="match-import-drop" onClick={() => fileInputRef.current?.click()}><Film size={30}/><strong>Escolher vídeo da partida</strong><span>MP4 recomendado • limite de 1,5 GB</span></button>
        <div className="match-privacy-note"><ShieldCheck size={18}/><span>O vídeo permanece local. Apenas relatórios e marcações leves entram no histórico do app.</span></div>
      </article>
    </div>

    <div className={`match-trainer-message ${message.includes('não') || message.includes('falha') ? 'warning' : ''}`} role="status" aria-live="polite"><CheckCircle2 size={17}/><span>{message}</span></div>

    <div className="match-trainer-workspace">
      <aside className="luxury-panel match-session-list">
        <div className="v27-panel-heading"><div><p className="kicker"><Clock3 size={14}/> Arquivo local</p><h3>Partidas gravadas</h3></div><span>{sessions.length}</span></div>
        <div>{sessions.map((session) => <button type="button" key={session.id} className={activeId === session.id ? 'active' : ''} onClick={() => setActiveId(session.id)}><span><strong>{session.title}</strong><small>{session.fileName}</small></span><em>{session.analysis ? `${session.analysis.qualityScore}%` : session.status}</em></button>)}{!sessions.length && <div className="v27-empty"><Film size={25}/><strong>Nenhuma partida</strong><span>Inicie uma gravação ou importe um vídeo.</span></div>}</div>
        {recordings.length > 0 && <small className="match-native-count">{recordings.length} vídeo(s) confirmados no armazenamento privado do Android.</small>}
      </aside>

      <section className="luxury-panel match-video-review">
        {!active ? <div className="v27-empty"><Video size={32}/><strong>Escolha uma partida</strong><span>O revisor aparecerá aqui.</span></div> : <>
          <div className="v27-panel-heading"><div><p className="kicker"><Play size={14}/> Revisão pós-partida</p><h3>{active.title}</h3></div><button type="button" className="icon-danger-button" onClick={() => void removeSession(active)} aria-label="Excluir partida"><Trash2 size={18}/></button></div>
          {videoUrl ? <video ref={videoRef} className="match-review-video" src={videoUrl} controls playsInline preload="metadata"/> : <div className="match-video-missing"><AlertTriangle size={23}/><div><strong>Vídeo indisponível nesta sessão</strong><span>{active.source === 'imported-video' ? 'Importe novamente o mesmo arquivo para continuar.' : 'O Android não localizou o arquivo gravado.'}</span></div></div>}
          <div className="match-context-fields"><label>Título<input value={active.title} maxLength={80} onChange={(event: { target: HTMLInputElement }) => updateActive({ title: event.target.value })}/></label><label>Formação<input value={active.formation} maxLength={40} onChange={(event: { target: HTMLInputElement }) => updateActive({ formation: event.target.value })}/></label><label>Estilo coletivo<input value={active.teamStyle} maxLength={50} onChange={(event: { target: HTMLInputElement }) => updateActive({ teamStyle: event.target.value })}/></label><label>Técnico<input value={active.manager} maxLength={60} onChange={(event: { target: HTMLInputElement }) => updateActive({ manager: event.target.value })}/></label><label>Conexão<select value={active.connectionRating} onChange={(event: { target: HTMLSelectElement }) => updateActive({ connectionRating: Number(event.target.value) as 1|2|3|4|5 })}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label></div>
          <div className="match-analysis-actions"><button type="button" className="elite-button" disabled={busy || !videoUrl} onClick={runAnalysis}><Gauge size={18}/>{active.analysis ? 'Analisar novamente' : 'Analisar vídeo'}</button>{busy && <button type="button" onClick={() => abortRef.current?.abort()}><CircleStop size={17}/> Cancelar</button>}<button type="button" disabled={!active.analysis && !active.markers.length} onClick={exportReport}><Download size={17}/> Exportar relatório</button></div>
          {busy && <div className="match-analysis-progress"><div><span>{analysisMessage}</span><strong>{analysisProgress}%</strong></div><i><b style={{ width: `${analysisProgress}%` }}/></i></div>}
          <label className="match-marker-note">Observação do próximo marcador<input value={markerNote} maxLength={180} placeholder="Ex.: forcei o passe porque o comando atrasou" onChange={(event: { target: HTMLInputElement }) => setMarkerNote(event.target.value)}/></label>
          <div className="match-marker-pad">{MARKER_ACTIONS.map((action) => <button type="button" key={action.kind} onClick={() => addMarker(action.kind)} disabled={!videoUrl}>{action.label}</button>)}</div>
        </>}
      </section>
    </div>

    {active && <div className="match-analysis-dashboard">
      <article className="luxury-panel match-analysis-summary">
        <div className="v27-panel-heading"><div><p className="kicker"><Gauge size={14}/> Diagnóstico responsável</p><h3>{summary?.verdict}</h3></div><span>{active.analysis ? `${active.analysis.qualityScore}%` : 'Sem análise'}</span></div>
        <div className="match-summary-metrics"><div><strong>{summary?.passErrors || 0}</strong><span>Passes</span></div><div><strong>{summary?.dangerousTurnovers || 0}</strong><span>Perdas perigosas</span></div><div><strong>{summary?.markingErrors || 0}</strong><span>Marcação</span></div><div><strong>{summary?.cursorErrors || 0}</strong><span>Cursor</span></div><div><strong>{summary?.forcedShots || 0}</strong><span>Finalizações</span></div><div><strong>{summary?.possibleDelay || 0}</strong><span>Sinais de atraso</span></div></div>
        <div className="match-priority-grid"><div><strong>Prioridades</strong>{summary?.priorities.map((item) => <span key={item}><CheckCircle2 size={14}/>{item}</span>)}</div><div><strong>Regras para testar</strong>{summary?.matchRules.length ? summary.matchRules.map((item) => <span key={item}><ShieldCheck size={14}/>{item}</span>) : <span><ShieldCheck size={14}/>Marque eventos em mais partidas antes de alterar sua forma de jogar.</span>}</div></div>
      </article>

      <article className="luxury-panel match-timeline">
        <div className="v27-panel-heading"><div><p className="kicker"><Clock3 size={14}/> Evidências</p><h3>Linha do tempo revisável</h3></div><span>{allMarkers.length}</span></div>
        <div>{allMarkers.map((marker) => <div className="match-timeline-row" key={marker.id}><button type="button" className="match-timeline-jump" onClick={() => { if (videoRef.current) videoRef.current.currentTime = marker.atMs / 1000; }}><time>{formatDuration(marker.atMs)}</time><span><strong>{marker.title}</strong><small>{marker.detail || (marker.source === 'automatic' ? 'Sinal automático pendente de revisão.' : 'Marcado pelo usuário.')}</small></span><em>{marker.source === 'automatic' ? `${marker.confidence}%` : 'confirmado'}</em></button>{marker.source === 'manual' && <button type="button" className="match-timeline-remove" aria-label={`Remover marcador ${marker.title}`} onClick={() => removeMarker(marker.id)}><Trash2 size={14}/></button>}</div>)}{!allMarkers.length && <div className="v27-empty"><Clock3 size={24}/><strong>Nenhum lance marcado</strong><span>Reproduza o vídeo e toque no tipo de evento quando ele acontecer.</span></div>}</div>
      </article>
    </div>}

    <div className="match-trainer-safeguards luxury-panel"><Wifi size={20}/><div><strong>O que o v31.70 consegue afirmar</strong><span>Ele mede mudanças visuais, organiza lances confirmados e encontra padrões entre partidas. Ele não sabe com certeza qual botão foi pressionado, não mede o ping interno do servidor e não chama automaticamente toda pausa de “lag”.</span></div><button type="button" onClick={() => { setMessage('Dica: grave em 720p/30 FPS, marque os eventos durante a revisão e compare pelo menos três partidas com a mesma formação.'); }}><RotateCcw size={16}/> Ver regra de uso</button></div>
  </section>;
}
