'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleStop, Clock3, Download, Film, Gauge, HardDrive, Import, LoaderCircle, Pause, Pencil, Play, RotateCcw, Share2, ShieldCheck, Smartphone, Trash2, Video, Wifi } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { safeStorageGet, safeStorageSet } from '@/lib/safeLocalStorage';
import type { TacticalStyle } from '@/lib/analyzer';
import type { TeamDiagnosis } from '@/modules/core/centralIntelligence';
import {
  deleteMatchRecording,
  getMatchRecorderCapabilities,
  getMatchRecorderStatus,
  getMatchRecorderStorageInfo,
  listMatchRecordings,
  renameMatchRecording,
  listenToMatchRecorder,
  restoreMatchRecorderOrientation,
  saveMatchRecordingToGallery,
  shareMatchRecording,
  startMatchRecording,
  stopMatchRecording,
  type MatchRecorderCapabilities,
  type MatchRecordingDescriptor,
  type MatchRecordingQuality,
  type MatchRecorderStatus,
  type MatchRecorderStorageInfo
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
  MATCH_EVENT_CATALOG,
  buildMatchTrainerEvolution,
  getVisibleMatchMarkers,
  getConfirmedMatchMarkers,
  isAttackEvent,
  isDefenseEvent,
  type MatchEventKind,
  type MatchEventMarker,
  type MatchPhase,
  type MatchTrainerSession
} from './matchTrainerEngine';

const QUALITY_LABELS: Record<MatchRecordingQuality, { title: string; detail: string }> = {
  economy: { title: 'Econômico', detail: '540p • 24 FPS • menor aquecimento' },
  balanced: { title: 'Equilibrado', detail: '720p • 30 FPS • recomendado' },
  detailed: { title: 'Detalhado', detail: '1080p • 30 FPS • maior consumo' }
};

const MARKER_ACTIONS: Array<{ kind: MatchEventKind; label: string }> = [
  { kind: 'pass-error', label: 'Passe forçado' },
  { kind: 'dangerous-turnover', label: 'Perda perigosa' },
  { kind: 'forced-shot', label: 'Chute precipitado' },
  { kind: 'delayed-pass', label: 'Passe atrasado' },
  { kind: 'pressured-receiver', label: 'Passe em pressionado' },
  { kind: 'late-release', label: 'Demorou a soltar' },
  { kind: 'unbalanced-shot', label: 'Chute desequilibrado' },
  { kind: 'predictable-attack', label: 'Ataque previsível' },
  { kind: 'lost-counterattack', label: 'Perdeu contra-ataque' },
  { kind: 'marking-error', label: 'Erro de marcação' },
  { kind: 'cursor-error', label: 'Troca atrasada' },
  { kind: 'defender-out-of-line', label: 'Zagueiro fora da linha' },
  { kind: 'late-recomposition', label: 'Recomposição atrasada' },
  { kind: 'pressing-error', label: 'Pressão errada' },
  { kind: 'wrong-double-mark', label: 'Marcação dupla perigosa' },
  { kind: 'premature-tackle', label: 'Bote precipitado' },
  { kind: 'fullback-corridor-open', label: 'Corredor lateral aberto' },
  { kind: 'double-defender', label: 'Dois na mesma bola' },
  { kind: 'central-corridor-open', label: 'Centro desprotegido' },
  { kind: 'game-management', label: 'Gestão da vantagem' },
  { kind: 'good-transition', label: 'Boa transição' },
  { kind: 'good-build-up', label: 'Boa construção' },
  { kind: 'goal-for', label: 'Gol marcado' },
  { kind: 'goal-against', label: 'Gol sofrido' },
  { kind: 'possible-delay', label: 'Possível atraso' },
  { kind: 'note', label: 'Observação' }
];

type AnalysisTab = 'resumo' | 'momentos' | 'ataque' | 'defesa' | 'comandos' | 'tatica' | 'treino' | 'evolucao';

const PHASE_OPTIONS: Array<{ value: MatchPhase; label: string }> = [
  { value: 'unknown', label: 'Fase automática' },
  { value: 'build-up', label: 'Saída/construção' },
  { value: 'attack', label: 'Ataque/finalização' },
  { value: 'defensive-transition', label: 'Transição defensiva' },
  { value: 'defense', label: 'Defesa organizada' },
  { value: 'set-piece', label: 'Bola parada' },
  { value: 'game-management', label: 'Gestão da partida' }
];

const AUTO_SAVE_RECORDINGS_KEY = 'buildmaster_match_recordings_auto_save_v3832';
const COMMAND_EVENT_KINDS = new Set<MatchEventKind>(['command-pass-early', 'command-sprint-excess', 'command-double-tap', 'wrong-double-mark', 'cursor-error']);
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
  const [markerPhase, setMarkerPhase] = useState<MatchPhase>('unknown');
  const [markerPlayer, setMarkerPlayer] = useState('');
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>('resumo');
  const [candidateKinds, setCandidateKinds] = useState<Record<string, MatchEventKind>>({});
  const [videoAction, setVideoAction] = useState<'saving' | 'sharing' | 'renaming' | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => safeStorageGet(AUTO_SAVE_RECORDINGS_KEY) !== '0');
  const [storageInfo, setStorageInfo] = useState<MatchRecorderStorageInfo | null>(null);
  const [markerCommand, setMarkerCommand] = useState<NonNullable<MatchEventMarker['commandEvidence']>['command']>('outro');
  const [markerCommandStatus, setMarkerCommandStatus] = useState<NonNullable<MatchEventMarker['commandEvidence']>['status']>('unconfirmed');
  const [selectedClipMarker, setSelectedClipMarker] = useState<MatchEventMarker | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastHandledRecordingRef = useRef('');
  const exportAttemptsRef = useRef(new Set<string>());
  const clipTimerRef = useRef<number | null>(null);

  const active = useMemo(() => sessions.find((session) => session.id === activeId) || null, [activeId, sessions]);
  const summary = useMemo(() => active ? summarizeMatchTrainerSession(active) : null, [active]);
  const evolution = useMemo(() => buildMatchTrainerEvolution(sessions, activeId), [sessions, activeId]);
  const visibleMarkers = useMemo(() => active ? getVisibleMatchMarkers(active) : [], [active]);
  const confirmedMarkers = useMemo(() => active ? getConfirmedMatchMarkers(active) : [], [active]);
  const candidateMarkers = useMemo(() => visibleMarkers.filter((marker) => marker.reviewStatus === 'suggested'), [visibleMarkers]);
  const attackMarkers = useMemo(() => confirmedMarkers.filter((marker) => isAttackEvent(marker.kind)), [confirmedMarkers]);
  const defenseMarkers = useMemo(() => confirmedMarkers.filter((marker) => isDefenseEvent(marker.kind)), [confirmedMarkers]);
  const commandMarkers = useMemo(() => confirmedMarkers.filter((marker) => marker.commandEvidence || COMMAND_EVENT_KINDS.has(marker.kind)), [confirmedMarkers]);
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
      const refreshed: MatchTrainerSession = {
        ...existing,
        fileName: recording.fileName,
        fileSizeBytes: recording.sizeBytes,
        videoPath: recording.path,
        recording
      };
      const next = upsertMatchTrainerSession(refreshed);
      setSessions(next);
      if (options.focus !== false) setActiveId(refreshed.id);
      return refreshed;
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
    if (!options.quiet) setMessage(recording.uri ? 'Gravação salva na Galeria e pronta para compartilhar. Revise o vídeo e execute a análise.' : 'Gravação concluída no espaço do app. Salvando uma cópia na Galeria...');
    return session;
  }

  async function refreshNativeRecording(id: string, options: { focus?: boolean; quiet?: boolean } = {}) {
    const saved = await listMatchRecordings();
    setRecordings(saved);
    const refreshed = saved.find((item) => item.id === id) || null;
    if (refreshed) createFromRecording(refreshed, options);
    return refreshed;
  }

  async function autoSaveRecording(recording: MatchRecordingDescriptor) {
    if (!autoSaveEnabled) {
      setMessage('Gravação concluída e mantida dentro do BuildMaster. O salvamento automático na Galeria está desativado.');
      return recording;
    }
    if (recording.uri || exportAttemptsRef.current.has(recording.id)) return recording;
    exportAttemptsRef.current.add(recording.id);
    setVideoAction('saving');
    try {
      const result = await saveMatchRecordingToGallery(recording.id);
      const refreshed = await refreshNativeRecording(recording.id, { quiet: true });
      setMessage(`Vídeo salvo na Galeria em ${result.relativePath}. Agora você pode compartilhar ou enviar o arquivo.`);
      return refreshed || { ...recording, uri: result.uri, publicFileName: result.fileName, relativePath: result.relativePath };
    } catch (error) {
      setMessage(`${error instanceof Error ? error.message : 'Não foi possível salvar o vídeo na Galeria.'} A gravação continua segura dentro do BuildMaster; use “Salvar vídeo” para tentar novamente.`);
      return recording;
    } finally {
      setVideoAction(null);
    }
  }

  async function saveActiveRecording() {
    if (!active?.recording?.id) return;
    setVideoAction('saving');
    setMessage('Copiando o vídeo para a Galeria do aparelho...');
    try {
      const result = await saveMatchRecordingToGallery(active.recording.id);
      await refreshNativeRecording(active.recording.id, { quiet: true });
      setMessage(result.reused ? `O vídeo já está salvo em ${result.relativePath}.` : `Vídeo salvo com sucesso em ${result.relativePath}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar o vídeo na Galeria.');
    } finally {
      setVideoAction(null);
    }
  }

  async function shareActiveRecording() {
    if (!active?.recording?.id) return;
    setVideoAction('sharing');
    setMessage('Preparando o vídeo para compartilhamento...');
    try {
      const result = await shareMatchRecording(active.recording.id);
      await refreshNativeRecording(active.recording.id, { quiet: true });
      setMessage(`Vídeo preparado e salvo em ${result.relativePath}. Escolha o aplicativo para compartilhar.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível compartilhar o vídeo.');
    } finally {
      setVideoAction(null);
    }
  }

  async function renameActiveRecording() {
    if (!active?.recording?.id) return;
    const nextTitle = window.prompt('Novo nome da gravação', active.title)?.trim();
    if (!nextTitle || nextTitle === active.title) return;
    setVideoAction('renaming');
    try {
      const result = await renameMatchRecording(active.recording.id, nextTitle);
      const refreshed = await refreshNativeRecording(active.recording.id, { quiet: true });
      updateActive({ title: nextTitle, recording: refreshed || result.recording });
      setMessage('Gravação renomeada. A cópia já exportada para a Galeria não foi apagada nem alterada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível renomear a gravação.');
    } finally {
      setVideoAction(null);
    }
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
      void getMatchRecorderStorageInfo().then((info) => { if (activeEffect) setStorageInfo(info); }).catch(() => undefined);
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
        if (status.last?.state === 'completed') { createFromRecording(status.last, { quiet: true }); void autoSaveRecording(status.last); }
      } catch {
        // O modo importar vídeo continua funcional mesmo sem ponte nativa.
      }
      listener = await listenToMatchRecorder((status) => {
        if (!activeEffect) return;
        setRecorderStatus(status);
        if (status.last?.state === 'completed') { createFromRecording(status.last); void autoSaveRecording(status.last); }
      });
    })();
    return () => {
      activeEffect = false;
      void listener?.remove();
    };
  }, []);

  useEffect(() => {
    safeStorageSet(AUTO_SAVE_RECORDINGS_KEY, autoSaveEnabled ? '1' : '0');
  }, [autoSaveEnabled]);

  useEffect(() => {
    if (!videoAction) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [videoAction]);

  useEffect(() => {
    if (!recorderStatus.active) return;
    const timer = window.setInterval(() => {
      void getMatchRecorderStatus().then((status) => {
        setRecorderStatus(status);
        if (status.last?.state === 'completed') { createFromRecording(status.last); void autoSaveRecording(status.last); }
      }).catch(() => undefined);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recorderStatus.active]);

  useEffect(() => () => {
    if (importedUrl) URL.revokeObjectURL(importedUrl);
    abortRef.current?.abort();
    if (clipTimerRef.current !== null) window.clearInterval(clipTimerRef.current);
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
      if (completed?.state === 'completed') {
        createFromRecording(completed);
        await autoSaveRecording(completed);
      } else setMessage('Gravação finalizada. O arquivo aparecerá assim que o Android concluir a validação.');
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
    const marker = createMatchMarker(kind, atMs, markerNote, 'manual', 100, {
      phase: markerPhase === 'unknown' ? undefined : markerPhase,
      playerId: markerPlayer.trim() || null,
      commandEvidence: markerCommand !== 'outro' || COMMAND_EVENT_KINDS.has(kind) ? { command: markerCommand, status: markerCommandStatus, note: markerCommandStatus === 'observed' ? 'Comando confirmado pelo usuário durante a revisão.' : 'Inferência tática — comando não confirmado diretamente.' } : undefined,
      annotations: isDefenseEvent(kind)
        ? [{ kind: 'wrong-arrow', x1: 52, y1: 62, x2: 52, y2: 38, label: 'movimento errado' }, { kind: 'hold-position', x1: 52, y1: 62, label: 'manter posição' }]
        : isAttackEvent(kind)
          ? [{ kind: 'blocked-line', x1: 34, y1: 58, x2: 66, y2: 42, label: 'linha bloqueada' }, { kind: 'recommended-line', x1: 34, y1: 58, x2: 70, y2: 62, label: 'passe recomendado' }]
          : undefined
    });
    commitSession({ ...active, markers: [...active.markers, marker].sort((a, b) => a.atMs - b.atMs), status: 'review' });
    setMarkerNote('');
    setMarkerPlayer('');
    setMessage(`${marker.title} confirmado em ${formatDuration(atMs)}. O diagnóstico, a consequência e o treino foram atualizados.`);
  }

  function removeMarker(id: string) {
    if (!active) return;
    commitSession({ ...active, markers: active.markers.filter((marker) => marker.id !== id) });
  }

  function confirmCandidate(marker: MatchEventMarker) {
    if (!active) return;
    const kind = candidateKinds[marker.id] || (marker.kind === 'possible-delay' ? 'possible-delay' : 'note');
    const confirmed = createMatchMarker(kind, marker.atMs, markerNote || marker.detail, 'manual', 92, {
      phase: markerPhase === 'unknown' ? marker.phase : markerPhase,
      playerId: markerPlayer.trim() || null,
      relatedMarkerId: marker.id,
      clipStartMs: marker.clipStartMs,
      clipEndMs: marker.clipEndMs,
      commandEvidence: markerCommand !== 'outro' || COMMAND_EVENT_KINDS.has(kind) ? { command: markerCommand, status: markerCommandStatus, note: markerCommandStatus === 'observed' ? 'Comando confirmado pelo usuário.' : 'Inferência tática — comando não confirmado diretamente.' } : undefined
    });
    commitSession({
      ...active,
      markers: [...active.markers, confirmed].sort((a, b) => a.atMs - b.atMs),
      dismissedAutomaticMarkerIds: [...new Set([...(active.dismissedAutomaticMarkerIds || []), marker.id])],
      status: 'review'
    });
    setMarkerNote('');
    setMarkerPlayer('');
    setMessage(`${confirmed.title} confirmado em ${formatDuration(marker.atMs)}. O candidato automático não será contado duas vezes.`);
  }

  function dismissCandidate(marker: MatchEventMarker) {
    if (!active) return;
    commitSession({
      ...active,
      dismissedAutomaticMarkerIds: [...new Set([...(active.dismissedAutomaticMarkerIds || []), marker.id])]
    });
    setMessage(`Momento de ${formatDuration(marker.atMs)} descartado. Ele não entra nas notas nem nas conclusões.`);
  }

  function playMarkerClip(marker: MatchEventMarker, slow = false) {
    setSelectedClipMarker(marker);
    const video = videoRef.current;
    if (!video) return;
    if (clipTimerRef.current !== null) window.clearInterval(clipTimerRef.current);
    const startMs = Math.max(0, marker.clipStartMs ?? marker.atMs - 6000);
    const endMs = Math.max(startMs + 1500, marker.clipEndMs ?? marker.atMs + 6000);
    video.currentTime = startMs / 1000;
    video.playbackRate = slow ? .5 : 1;
    void video.play().catch(() => undefined);
    clipTimerRef.current = window.setInterval(() => {
      if (!video || video.currentTime * 1000 >= endMs || video.ended) {
        video.pause();
        video.playbackRate = 1;
        if (clipTimerRef.current !== null) window.clearInterval(clipTimerRef.current);
        clipTimerRef.current = null;
      }
    }, 180);
  }

  function pauseAtKeyFrame(marker: MatchEventMarker) {
    const video = videoRef.current;
    if (!video) return;
    setSelectedClipMarker(marker);
    video.currentTime = marker.atMs / 1000;
    video.pause();
    video.playbackRate = 1;
    setMessage(`Quadro-chave pausado em ${formatDuration(marker.atMs)}. As marcações mostram a correção sugerida, não uma leitura automática do comando.`);
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
    const hadGalleryCopy = Boolean(session.recording?.uri);
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
    if (hadGalleryCopy) setMessage('Sessão removida do BuildMaster. A cópia salva na Galeria foi preservada.');
  }

  const markerOptions = MATCH_EVENT_CATALOG.filter((item) => item.kind !== 'critical-moment');

  function renderMarkerCard(marker: MatchEventMarker, allowRemove = false) {
    const phase = PHASE_OPTIONS.find((item) => item.value === marker.phase)?.label || 'Fase não confirmada';
    return <article className={`match-insight-card severity-${marker.severity || 'medium'}`} key={marker.id}>
      <div className="match-insight-head">
        <div><span>{formatDuration(marker.atMs)} • {phase}</span><strong>{marker.title}</strong></div>
        <em>{marker.source === 'automatic' ? `${marker.confidence}% candidato` : `${marker.confidence}% confirmado`}</em>
      </div>
      {marker.playerId && <small className="match-player-chip">Jogador/setor: {marker.playerId}</small>}
      {marker.detail && <p className="match-user-note"><b>Sua observação:</b> {marker.detail}</p>}
      {marker.commandEvidence && <p className="match-command-evidence"><b>{marker.commandEvidence.command}</b><span>{marker.commandEvidence.status === 'observed' ? 'Observado e confirmado pelo usuário.' : 'Inferência tática — comando não confirmado diretamente.'}</span></p>}
      <div className="match-insight-body">
        <p><b>O que aconteceu</b><span>{marker.observed}</span></p>
        <p><b>Por que aconteceu</b><span>{marker.why}</span></p>
        <p><b>Consequência</b><span>{marker.consequence}</span></p>
        <p className="positive"><b>Melhor decisão</b><span>{marker.betterDecision}</span></p>
        <p className="positive"><b>Como corrigir</b><span>{marker.correction}</span></p>
      </div>
      <div className="match-insight-actions">
        <button type="button" onClick={() => playMarkerClip(marker)} disabled={!videoUrl}><Play size={15}/> Ver clipe</button>
        <button type="button" onClick={() => playMarkerClip(marker, true)} disabled={!videoUrl}><Play size={15}/> Rever em 0,5x</button>
        <button type="button" onClick={() => pauseAtKeyFrame(marker)} disabled={!videoUrl}><Pause size={15}/> Quadro-chave</button>
        {allowRemove && <button type="button" className="danger-button" onClick={() => removeMarker(marker.id)}><Trash2 size={15}/> Remover</button>}
      </div>
    </article>;
  }

  return <section className="match-trainer-v3170 match-trainer-v3177">
    <div className="match-trainer-intro luxury-panel">
      <div>
        <p className="kicker"><Video size={15}/> v40.20 • Análise de Vídeo Inteligente 2.0</p>
        <h3>Da gravação ao diagnóstico: lance, causa, consequência, correção e treino.</h3>
        <span>O vídeo continua local. O motor encontra momentos para revisão, você confirma o contexto e o BuildMaster transforma as evidências em análise tática organizada.</span>
      </div>
      <div className={`match-recorder-state state-${recorderStatus.state}`}>
        <i>{recorderStatus.active ? <LoaderCircle size={22}/> : <ShieldCheck size={22}/>}</i>
        <div><strong>{recorderStatus.active ? 'Gravação ativa' : capabilities?.supported ? 'Android preparado' : 'Modo de importação'}</strong><span>{recorderStatus.active ? formatDuration(recorderStatus.elapsedMs) : capabilities?.reason || 'Pronto para analisar vídeos.'}</span></div>
      </div>
    </div>

    <div className="match-trainer-capture-grid">
      <article className="luxury-panel match-capture-card">
        <div className="v27-panel-heading"><div><p className="kicker"><Smartphone size={14}/> Captura oficial Android</p><h3>Gravar uma partida completa</h3></div><span>{capabilities?.supported ? 'Disponível' : 'APK necessário'}</span></div>
        <div className="match-quality-options" role="radiogroup" aria-label="Qualidade da gravação">
          {(Object.keys(QUALITY_LABELS) as MatchRecordingQuality[]).map((item) => <label key={item} className={quality === item ? 'active' : ''}>
            <input type="radio" name="recording-quality" value={item} checked={quality === item} disabled={recorderStatus.active || !capabilities?.profiles.includes(item)} onChange={() => setQuality(item)}/>
            <span><strong>{QUALITY_LABELS[item].title}</strong><small>{QUALITY_LABELS[item].detail}</small></span>
          </label>)}
        </div>
        <div className="match-capture-actions">
          {recorderStatus.active
            ? <button type="button" className="danger-button" disabled={busy} onClick={finishRecording}><CircleStop size={18}/> Parar e salvar</button>
            : <button type="button" className="elite-button" disabled={busy || !capabilities?.supported} onClick={beginRecording}><Video size={18}/> Iniciar gravação</button>}
          <small>Sem microfone e sem envio para servidor. O Android pede autorização em toda nova sessão.</small><label className="match-auto-save-toggle"><input type="checkbox" checked={autoSaveEnabled} onChange={(event: { target: HTMLInputElement }) => setAutoSaveEnabled(event.target.checked)}/><span>Salvar automaticamente em Filmes/BuildMaster/Partidas</span></label>{storageInfo?.lowStorage && <p className="match-low-storage"><HardDrive size={16}/> Pouco armazenamento disponível. Libere espaço antes de gravar uma partida longa.</p>}
        </div>
      </article>

      <article className="luxury-panel match-import-card">
        <div className="v27-panel-heading"><div><p className="kicker"><Import size={14}/> Compatibilidade</p><h3>Importar gravação existente</h3></div><span>Android e navegador</span></div>
        <input ref={fileInputRef} className="sr-only" type="file" accept="video/mp4,video/webm,video/quicktime,video/*" onChange={(event: { target: HTMLInputElement }) => importVideo(event.target.files?.[0] || null)}/>
        <button type="button" className="match-import-drop" onClick={() => fileInputRef.current?.click()}><Film size={30}/><strong>Escolher vídeo da partida</strong><span>MP4 recomendado • limite de 1,5 GB</span></button>
        <div className="match-privacy-note"><ShieldCheck size={18}/><span>O vídeo permanece local. O histórico salva apenas dados leves, tempos e diagnósticos.</span></div>
      </article>
    </div>

    <div className={`match-trainer-message ${message.includes('não') || message.includes('falha') ? 'warning' : ''}`} role="status" aria-live="polite"><CheckCircle2 size={17}/><span>{message}</span></div>

    <div className="match-trainer-workspace">
      <aside className="luxury-panel match-session-list">
        <div className="v27-panel-heading"><div><p className="kicker"><Clock3 size={14}/> Arquivo local</p><h3>Minhas gravações</h3></div><span>{sessions.length}</span></div>
        <div>
          {sessions.map((session) => {
            const sessionSummary = summarizeMatchTrainerSession(session);
            return <button type="button" key={session.id} className={activeId === session.id ? 'active' : ''} onClick={() => { setActiveId(session.id); setAnalysisTab('resumo'); }}>
              <span><strong>{session.title}</strong><small>{session.fileName} • {(session.fileSizeBytes / 1048576).toFixed(1)} MB • {new Date(session.createdAt).toLocaleDateString('pt-BR')}</small></span>
              <em>{sessionSummary.overallScore === null ? session.analysis ? `${sessionSummary.candidateMoments} revisar` : session.status : `${sessionSummary.overallScore}/10`}</em>
            </button>;
          })}
          {!sessions.length && <div className="v27-empty"><Film size={25}/><strong>Nenhuma partida</strong><span>Inicie uma gravação ou importe um vídeo.</span></div>}
        </div>
        {recordings.length > 0 && <small className="match-native-count">{recordings.length} vídeo(s) no BuildMaster • {recordings.filter((item) => Boolean(item.uri)).length} salvo(s) na Galeria.</small>}
      </aside>

      <section className="luxury-panel match-video-review">
        {!active ? <div className="v27-empty"><Video size={32}/><strong>Escolha uma partida</strong><span>O revisor aparecerá aqui.</span></div> : <>
          <div className="v27-panel-heading"><div><p className="kicker"><Play size={14}/> Revisão pós-partida</p><h3>{active.title}</h3></div><button type="button" className="icon-danger-button" onClick={() => void removeSession(active)} aria-label="Excluir partida"><Trash2 size={18}/></button></div>
          {videoUrl
            ? <div className="match-video-frame"><video ref={videoRef} className="match-review-video" src={videoUrl} controls playsInline preload="metadata"/>{selectedClipMarker?.annotations?.length ? <svg className="match-video-annotations" viewBox="0 0 100 100" aria-label="Marcações táticas do quadro-chave">{selectedClipMarker.annotations.map((annotation, index) => annotation.kind === 'circle' || annotation.kind === 'open-space' || annotation.kind === 'danger-zone' || annotation.kind === 'hold-position' ? <circle key={index} cx={annotation.x1} cy={annotation.y1} r={annotation.kind === 'danger-zone' ? 12 : 7} className={`annotation-${annotation.kind}`}/> : <line key={index} x1={annotation.x1} y1={annotation.y1} x2={annotation.x2 ?? annotation.x1} y2={annotation.y2 ?? annotation.y1} className={`annotation-${annotation.kind}`}/>)}</svg> : null}</div>
            : <div className="match-video-missing"><AlertTriangle size={23}/><div><strong>Vídeo indisponível nesta sessão</strong><span>{active.source === 'imported-video' ? 'Importe novamente o mesmo arquivo para continuar.' : 'O Android não localizou o arquivo gravado.'}</span></div></div>}

          <div className="match-context-fields">
            <label>Título<input value={active.title} maxLength={80} onChange={(event: { target: HTMLInputElement }) => updateActive({ title: event.target.value })}/></label>
            <label>Formação<input value={active.formation} maxLength={40} onChange={(event: { target: HTMLInputElement }) => updateActive({ formation: event.target.value })}/></label>
            <label>Estilo coletivo<input value={active.teamStyle} maxLength={50} onChange={(event: { target: HTMLInputElement }) => updateActive({ teamStyle: event.target.value })}/></label>
            <label>Técnico<input value={active.manager} maxLength={60} onChange={(event: { target: HTMLInputElement }) => updateActive({ manager: event.target.value })}/></label>
            <label>Conexão<select value={active.connectionRating} onChange={(event: { target: HTMLSelectElement }) => updateActive({ connectionRating: Number(event.target.value) as 1|2|3|4|5 })}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label>
          </div>

          <div className="match-analysis-actions">
            <button type="button" className="elite-button" disabled={busy || !videoUrl || Boolean(videoAction)} onClick={runAnalysis}><Gauge size={18}/>{active.analysis ? 'Refazer varredura' : 'Analisar vídeo'}</button>
            {busy && <button type="button" onClick={() => abortRef.current?.abort()}><CircleStop size={17}/> Cancelar</button>}
            {active.recording?.id && <>
              <button type="button" disabled={busy || Boolean(videoAction)} onClick={saveActiveRecording}><Download size={17}/>{videoAction === 'saving' ? 'Salvando...' : active.recording.uri ? 'Salvo na Galeria' : 'Salvar vídeo'}</button>
              <button type="button" disabled={busy || Boolean(videoAction)} onClick={shareActiveRecording}><Share2 size={17}/>{videoAction === 'sharing' ? 'Preparando...' : 'Compartilhar vídeo'}</button>
              <button type="button" disabled={busy || Boolean(videoAction)} onClick={renameActiveRecording}><Pencil size={17}/>{videoAction === 'renaming' ? 'Renomeando...' : 'Renomear'}</button>
            </>}
            <button type="button" disabled={!active.analysis && !active.markers.length} onClick={exportReport}><Download size={17}/> Exportar análise completa</button>
          </div>
          {active.recording && <div className="match-recording-status-grid"><span><b>Duração</b>{formatDuration(active.recording.durationMs)}</span><span><b>Tamanho</b>{(active.recording.sizeBytes / 1048576).toFixed(1)} MB</span><span><b>Galeria</b>{active.recording.uri ? 'Salvo' : 'Somente no app'}</span><span><b>Análise</b>{active.recording.sizeBytes >= 4096 ? 'Pronto' : 'Arquivo inválido'}</span></div>}
          {busy && <div className="match-analysis-progress"><div><span>{analysisMessage}</span><strong>{analysisProgress}%</strong></div><i><b style={{ width: `${analysisProgress}%` }}/></i></div>}

          <div className="match-guided-marker">
            <div className="v27-panel-heading"><div><p className="kicker"><CheckCircle2 size={14}/> Confirmar lance atual</p><h3>Marcação rápida com contexto</h3></div><span>{formatDuration(Math.round((videoRef.current?.currentTime || 0) * 1000))}</span></div>
            <div className="match-marker-context-grid">
              <label>Fase da jogada<select value={markerPhase} onChange={(event: { target: HTMLSelectElement }) => setMarkerPhase(event.target.value as MatchPhase)}>{PHASE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label>Jogador ou setor<input value={markerPlayer} maxLength={60} placeholder="Ex.: Maldini, Rodri, lado esquerdo" onChange={(event: { target: HTMLInputElement }) => setMarkerPlayer(event.target.value)}/></label>
              <label className="wide">Sua observação<input value={markerNote} maxLength={240} placeholder="Ex.: tirei o zagueiro da linha e abri o corredor central" onChange={(event: { target: HTMLInputElement }) => setMarkerNote(event.target.value)}/></label>
            </div>
            <div className="match-command-context"><label>Comando relacionado<select value={markerCommand} onChange={(event: { target: HTMLSelectElement }) => setMarkerCommand(event.target.value as NonNullable<MatchEventMarker['commandEvidence']>['command'])}><option value="outro">Não informado</option><option value="passe">Passe</option><option value="lançamento">Lançamento</option><option value="chute">Chute</option><option value="corrida">Corrida</option><option value="pressão">Pressão</option><option value="marcação dupla">Marcação dupla</option><option value="troca de jogador">Troca de jogador</option><option value="direção">Direção</option></select></label><label>Nível de evidência<select value={markerCommandStatus} onChange={(event: { target: HTMLSelectElement }) => setMarkerCommandStatus(event.target.value as NonNullable<MatchEventMarker['commandEvidence']>['status'])}><option value="unconfirmed">Não confirmado</option><option value="inferred">Inferência tática</option><option value="observed">Confirmado pelo usuário</option></select></label></div>
            <div className="match-marker-pad">{MARKER_ACTIONS.map((action) => <button type="button" key={action.kind} onClick={() => addMarker(action.kind)} disabled={!videoUrl}>{action.label}</button>)}</div>
            <small className="match-marker-help">Ao confirmar, o app preenche automaticamente o que aconteceu, por que foi perigoso, a consequência, a melhor decisão e um treino relacionado.</small>
          </div>
        </>}
      </section>
    </div>

    {active && <>
      <nav className="match-analysis-tabs luxury-panel" aria-label="Áreas da análise de vídeo">
        {([
          ['resumo', 'Resumo'], ['momentos', `Momentos (${visibleMarkers.length})`], ['ataque', `Ataque (${attackMarkers.length})`], ['defesa', `Defesa (${defenseMarkers.length})`], ['comandos', `Comandos (${commandMarkers.length})`], ['tatica', 'Tática'], ['treino', `Treino (${summary?.trainingPlan.length || 0})`], ['evolucao', 'Evolução']
        ] as Array<[AnalysisTab, string]>).map(([id, label]) => <button type="button" key={id} className={analysisTab === id ? 'active' : ''} onClick={() => setAnalysisTab(id)}>{label}</button>)}
      </nav>

      {analysisTab === 'resumo' && summary && <div className="match-v3177-summary">
        <article className="luxury-panel match-analysis-summary match-score-overview">
          <div className="v27-panel-heading"><div><p className="kicker"><Gauge size={14}/> Diagnóstico da partida</p><h3>{summary.verdict}</h3></div><span>{summary.overallScore === null ? 'Aguardando revisão' : `${summary.overallScore}/10`}</span></div>
          <div className="match-summary-hero">
            <div><strong>{summary.overallScore === null ? '—' : summary.overallScore}</strong><span>nota estimada</span></div>
            <div><strong>{summary.confidenceScore}%</strong><span>confiança do diagnóstico</span></div>
            <div><strong>{summary.confirmedMarkers}</strong><span>lances confirmados</span></div>
            <div><strong>{summary.candidateMoments}</strong><span>candidatos pendentes</span></div>
          </div>
          <p className="match-trust-note"><ShieldCheck size={16}/> A nota só usa lances confirmados. Momentos automáticos pendentes não contam como erro.</p>
        </article>

        <article className="luxury-panel match-area-panel">
          <div className="v27-panel-heading"><div><p className="kicker"><Gauge size={14}/> Notas explicadas</p><h3>Desempenho por área</h3></div><span>{summary.areas.filter((area) => area.score !== null).length}/5 avaliadas</span></div>
          <div className="match-area-grid">{summary.areas.map((area) => <div className={`tone-${area.tone}`} key={area.id}><strong>{area.score === null ? '—' : area.score}</strong><span>{area.label}</span><small>{area.diagnosis}</small><em>{area.evidenceCount} evidência(s)</em></div>)}</div>
        </article>

        <article className="luxury-panel match-top-errors">
          <div className="v27-panel-heading"><div><p className="kicker"><AlertTriangle size={14}/> Prioridades reais</p><h3>Os três erros que mais prejudicaram</h3></div><span>{summary.topProblems.length}</span></div>
          <div className="match-top-error-grid">
            {summary.topProblems.slice(0, 3).map((problem, index) => <article className={`severity-${problem.severity}`} key={problem.kind}>
              <div><b>#{index + 1}</b><span>{problem.occurrences} ocorrência(s) • impacto {problem.impact}</span></div>
              <h4>{problem.title}</h4>
              <p><b>O que aconteceu</b>{problem.observed}</p>
              <p><b>Por que</b>{problem.why}</p>
              <p><b>Consequência</b>{problem.consequence}</p>
              <p className="positive"><b>Melhor decisão</b>{problem.betterDecision}</p>
              <p className="positive"><b>Correção</b>{problem.correction}</p>
              <small>Momentos: {problem.moments.map(formatDuration).join(' • ')}</small>
            </article>)}
            {!summary.topProblems.length && <div className="v27-empty"><CheckCircle2 size={25}/><strong>Nenhum erro confirmado</strong><span>Abra a aba Momentos, assista aos candidatos e classifique os lances importantes.</span></div>}
          </div>
        </article>

        <article className="luxury-panel match-strengths-panel">
          <div className="v27-panel-heading"><div><p className="kicker"><CheckCircle2 size={14}/> Jogadas-modelo</p><h3>O que você deve repetir</h3></div><span>{summary.goodPlays}</span></div>
          <div>{summary.strengths.map((item) => <p key={item}><CheckCircle2 size={16}/><span>{item}</span></p>)}</div>
        </article>
      </div>}

      {analysisTab === 'momentos' && <div className="match-v3177-moments">
        <article className="luxury-panel match-candidate-panel">
          <div className="v27-panel-heading"><div><p className="kicker"><Gauge size={14}/> Varredura visual</p><h3>Momentos sugeridos para revisar</h3></div><span>{candidateMarkers.length}</span></div>
          <p className="panel-note">O motor local encontra trechos intensos ou com pouca mudança visual. Ele não chama esses trechos de erro até você assistir e confirmar.</p>
          <div className="match-candidate-list">
            {candidateMarkers.map((marker) => <article key={marker.id}>
              <div><time>{formatDuration(marker.atMs)}</time><span><strong>{marker.title}</strong><small>{marker.detail}</small></span><em>{marker.confidence}%</em></div>
              <div className="match-candidate-actions">
                <button type="button" onClick={() => playMarkerClip(marker)} disabled={!videoUrl}><Play size={15}/> Ver clipe</button>
                <button type="button" onClick={() => playMarkerClip(marker, true)} disabled={!videoUrl}><Play size={15}/> 0,5x</button>
                <select value={candidateKinds[marker.id] || (marker.kind === 'possible-delay' ? 'possible-delay' : 'note')} onChange={(event: { target: HTMLSelectElement }) => setCandidateKinds((current) => ({ ...current, [marker.id]: event.target.value as MatchEventKind }))}>{markerOptions.map((item) => <option key={item.kind} value={item.kind}>{item.shortLabel}</option>)}</select>
                <button type="button" className="elite-button" onClick={() => confirmCandidate(marker)}><CheckCircle2 size={15}/> Confirmar</button>
                <button type="button" className="danger-button" onClick={() => dismissCandidate(marker)}><Trash2 size={15}/> Descartar</button>
              </div>
            </article>)}
            {!candidateMarkers.length && <div className="v27-empty"><CheckCircle2 size={25}/><strong>Nenhum candidato pendente</strong><span>Todos os momentos sugeridos foram confirmados ou descartados.</span></div>}
          </div>
        </article>

        <article className="luxury-panel match-confirmed-timeline">
          <div className="v27-panel-heading"><div><p className="kicker"><Clock3 size={14}/> Linha do tempo</p><h3>Lances confirmados e explicados</h3></div><span>{confirmedMarkers.length}</span></div>
          <div className="match-insight-list">{confirmedMarkers.map((marker) => renderMarkerCard(marker, marker.source === 'manual'))}{!confirmedMarkers.length && <div className="v27-empty"><Clock3 size={25}/><strong>Nenhum lance confirmado</strong><span>Use a marcação rápida ou confirme os candidatos acima.</span></div>}</div>
        </article>
      </div>}

      {analysisTab === 'ataque' && <article className="luxury-panel match-sector-panel">
        <div className="v27-panel-heading"><div><p className="kicker"><Play size={14}/> Ataque e criação</p><h3>Passes, transições, construção e finalização</h3></div><span>{attackMarkers.length}</span></div>
        <div className="match-insight-list">{attackMarkers.map((marker) => renderMarkerCard(marker, marker.source === 'manual'))}{!attackMarkers.length && <div className="v27-empty"><Play size={25}/><strong>Sem lances ofensivos confirmados</strong><span>Marque passes forçados, chutes, boas construções e gols.</span></div>}</div>
      </article>}

      {analysisTab === 'defesa' && <article className="luxury-panel match-sector-panel">
        <div className="v27-panel-heading"><div><p className="kicker"><ShieldCheck size={14}/> Defesa e recomposição</p><h3>Marcação, cursor, pressão e última linha</h3></div><span>{defenseMarkers.length}</span></div>
        <div className="match-insight-list">{defenseMarkers.map((marker) => renderMarkerCard(marker, marker.source === 'manual'))}{!defenseMarkers.length && <div className="v27-empty"><ShieldCheck size={25}/><strong>Sem lances defensivos confirmados</strong><span>Marque rupturas da linha, pressão errada, recomposição e gols sofridos.</span></div>}</div>
      </article>}

      {analysisTab === 'comandos' && <article className="luxury-panel match-sector-panel">
        <div className="v27-panel-heading"><div><p className="kicker"><Smartphone size={14}/> Comandos e resposta</p><h3>Somente evidências confirmadas ou inferências identificadas</h3></div><span>{commandMarkers.length}</span></div>
        <p className="panel-note">O vídeo não lê botões do controle. Quando não existe confirmação direta, o resultado aparece como “Inferência tática — comando não confirmado diretamente”.</p>
        <div className="match-insight-list">{commandMarkers.map((marker) => renderMarkerCard(marker, marker.source === 'manual'))}{!commandMarkers.length && <div className="v27-empty"><Smartphone size={25}/><strong>Nenhum comando relacionado</strong><span>Confirme o comando percebido durante a revisão de um lance.</span></div>}</div>
      </article>}

      {analysisTab === 'tatica' && summary && <div className="match-tactical-grid">
        <article className="luxury-panel match-tactical-card"><div className="v27-panel-heading"><div><p className="kicker"><ShieldCheck size={14}/> Estrutura</p><h3>{summary.tacticalDiagnosis.configuredShape}</h3></div><span>{summary.tacticalDiagnosis.configuredStyle}</span></div><p>{summary.tacticalDiagnosis.structure}</p></article>
        <article className="luxury-panel match-tactical-card"><div className="v27-panel-heading"><div><p className="kicker"><Gauge size={14}/> Estilo real x configurado</p><h3>Compatibilidade observada</h3></div></div><p>{summary.tacticalDiagnosis.styleFit}</p></article>
        <article className="luxury-panel match-tactical-card"><div className="v27-panel-heading"><div><p className="kicker"><Clock3 size={14}/> Contexto do placar</p><h3>Gestão da partida</h3></div></div><p>{summary.tacticalDiagnosis.gameManagement}</p></article>
        <article className="luxury-panel match-tactical-card"><div className="v27-panel-heading"><div><p className="kicker"><Wifi size={14}/> Separar tática de delay</p><h3>Proteção contra diagnóstico falso</h3></div></div><p>{summary.tacticalDiagnosis.connectionGuardrail}</p></article>
        <article className="luxury-panel match-tactical-recommendations"><div className="v27-panel-heading"><div><p className="kicker"><CheckCircle2 size={14}/> Ajustes recomendados</p><h3>O que testar sem destruir sua formação</h3></div><span>{summary.tacticalDiagnosis.recommendations.length}</span></div><div>{summary.tacticalDiagnosis.recommendations.map((item) => <p key={item}><CheckCircle2 size={16}/><span>{item}</span></p>)}</div></article>
      </div>}

      {analysisTab === 'treino' && summary && <article className="luxury-panel match-training-plan">
        <div className="v27-panel-heading"><div><p className="kicker"><CheckCircle2 size={14}/> Treino criado pelo vídeo</p><h3>Plano personalizado para não repetir os erros</h3></div><span>{summary.trainingPlan.reduce((sum, drill) => sum + drill.estimatedMinutes, 0)} min</span></div>
        <div className="match-drill-grid">{summary.trainingPlan.map((drill, index) => <article className={`severity-${drill.priority}`} key={drill.id}><div><b>Treino {index + 1}</b><span>{drill.estimatedMinutes} min</span></div><h4>{drill.title}</h4><p><b>Objetivo</b>{drill.objective}</p><p><b>Regra</b>{drill.rule}</p><p><b>Repetições</b>{drill.repetitions}</p><p className="positive"><b>Critério de aprovação</b>{drill.successCriteria}</p></article>)}{!summary.trainingPlan.length && <div className="v27-empty"><CheckCircle2 size={25}/><strong>Plano ainda não liberado</strong><span>Confirme pelo menos um erro real para o app criar o primeiro treino.</span></div>}</div>
      </article>}

      {analysisTab === 'evolucao' && <div className="match-evolution-grid">
        <article className="luxury-panel match-evolution-overview"><div className="v27-panel-heading"><div><p className="kicker"><Gauge size={14}/> Comparação entre partidas</p><h3>{evolution.trend}</h3></div><span>{evolution.sessionsAnalyzed} analisada(s)</span></div><div className="match-evolution-metrics">{evolution.metrics.map((metric) => <div className={`direction-${metric.direction}`} key={metric.id}><span>{metric.label}</span><strong>{metric.current === null ? '—' : `${metric.current}${metric.unit}`}</strong><small>{metric.previous === null ? 'Sem comparação anterior' : `Anterior: ${metric.previous}${metric.unit} • ${metric.delta !== null && metric.delta > 0 ? '+' : ''}${metric.delta ?? '—'}`}</small></div>)}</div></article>
        <article className="luxury-panel match-evolution-details"><div className="v27-panel-heading"><div><p className="kicker"><CheckCircle2 size={14}/> Progresso</p><h3>Melhorias confirmadas</h3></div></div>{evolution.improvements.map((item) => <p key={item}><CheckCircle2 size={16}/><span>{item}</span></p>)}</article>
        <article className="luxury-panel match-evolution-details"><div className="v27-panel-heading"><div><p className="kicker"><AlertTriangle size={14}/> Padrão recorrente</p><h3>{evolution.recurringProblem}</h3></div></div>{evolution.warnings.length ? evolution.warnings.map((item) => <p key={item}><AlertTriangle size={16}/><span>{item}</span></p>) : <p><CheckCircle2 size={16}/><span>Nenhum alerta recorrente confirmado.</span></p>}</article>
      </div>}
    </>}

    <div className="match-trainer-safeguards luxury-panel"><Wifi size={20}/><div><strong>O que a v40.20 afirma com responsabilidade</strong><span>Ela encontra momentos visuais, reproduz clipes, organiza evidências confirmadas, explica causa e consequência, gera treino e compara partidas. Ainda não lê com certeza o botão pressionado, não identifica todos os jogadores automaticamente e não chama pausa visual de lag sem confirmação.</span></div><button type="button" onClick={() => setMessage('Regra de ouro: assista ao clipe, confirme o tipo do lance e só depois use a recomendação. Três partidas comparáveis valem mais do que uma conclusão apressada.')}><RotateCcw size={16}/> Ver regra de uso</button></div>
  </section>;
}
