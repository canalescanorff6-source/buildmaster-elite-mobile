import { createStableId } from '@/lib/stableId';
import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';
import type { MatchRecordingDescriptor, MatchRecordingQuality } from './matchRecorderBridge';

export const MATCH_TRAINER_VERSION = '31.72.0';
export const MATCH_TRAINER_STORAGE_KEY = 'buildmaster_match_trainer_sessions_v3170';

export type MatchEventKind = 'pass-error' | 'dangerous-turnover' | 'marking-error' | 'cursor-error' | 'forced-shot' | 'good-play' | 'possible-delay' | 'goal-for' | 'goal-against' | 'note';
export type MatchEventSource = 'manual' | 'automatic';

export type MatchEventMarker = {
  id: string;
  atMs: number;
  kind: MatchEventKind;
  source: MatchEventSource;
  confidence: number;
  title: string;
  detail: string;
  playerId?: string | null;
};

export type MatchVideoSample = {
  atMs: number;
  motion: number;
  brightness: number;
  greenShare: number;
  edgeEnergy: number;
};

export type MatchVideoAnalysis = {
  engineVersion: string;
  analyzedAt: string;
  durationMs: number;
  width: number;
  height: number;
  sampleIntervalMs: number;
  sampleCount: number;
  qualityScore: number;
  confidence: 'low' | 'medium' | 'high';
  motionAverage: number;
  possibleFreezeCount: number;
  highMotionMoments: number[];
  lowMotionMoments: number[];
  samples: MatchVideoSample[];
  automaticMarkers: MatchEventMarker[];
  safeguards: string[];
};

export type MatchTrainerSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  source: 'native-recording' | 'imported-video';
  videoPath?: string;
  fileName: string;
  fileSizeBytes: number;
  recording?: MatchRecordingDescriptor | null;
  quality: MatchRecordingQuality | 'imported';
  formation: string;
  teamStyle: string;
  manager: string;
  connectionRating: 1 | 2 | 3 | 4 | 5;
  notes: string;
  analysis?: MatchVideoAnalysis | null;
  markers: MatchEventMarker[];
  status: 'recorded' | 'analyzing' | 'review' | 'completed' | 'failed';
};

export type MatchTrainerSummary = {
  totalMarkers: number;
  passErrors: number;
  dangerousTurnovers: number;
  markingErrors: number;
  cursorErrors: number;
  forcedShots: number;
  possibleDelay: number;
  goodPlays: number;
  primaryProblem: MatchEventKind | null;
  verdict: string;
  priorities: string[];
  matchRules: string[];
};

const EVENT_LABELS: Record<MatchEventKind, string> = {
  'pass-error': 'Erro de passe',
  'dangerous-turnover': 'Perda perigosa',
  'marking-error': 'Erro de marcação',
  'cursor-error': 'Troca de cursor',
  'forced-shot': 'Finalização forçada',
  'good-play': 'Boa jogada',
  'possible-delay': 'Possível atraso',
  'goal-for': 'Gol marcado',
  'goal-against': 'Gol sofrido',
  note: 'Observação'
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const round = (value: number, digits = 3) => Number(value.toFixed(digits));

export function readMatchTrainerSessions(): MatchTrainerSession[] {
  const sessions = safeStorageGetJson<MatchTrainerSession[]>(MATCH_TRAINER_STORAGE_KEY, []);
  return Array.isArray(sessions) ? sessions.filter((item) => item && typeof item.id === 'string').slice(0, 80) : [];
}

export function saveMatchTrainerSessions(sessions: MatchTrainerSession[]) {
  safeStorageSetJson(MATCH_TRAINER_STORAGE_KEY, sessions.slice(0, 80));
}

export function upsertMatchTrainerSession(session: MatchTrainerSession) {
  const sessions = readMatchTrainerSessions();
  const next = [session, ...sessions.filter((item) => item.id !== session.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 80);
  saveMatchTrainerSessions(next);
  return next;
}

export function deleteMatchTrainerSession(id: string) {
  const next = readMatchTrainerSessions().filter((item) => item.id !== id);
  saveMatchTrainerSessions(next);
  return next;
}

export function createMatchTrainerSession(input: {
  source: MatchTrainerSession['source'];
  fileName: string;
  fileSizeBytes?: number;
  videoPath?: string;
  recording?: MatchRecordingDescriptor | null;
  quality?: MatchTrainerSession['quality'];
  formation?: string;
  teamStyle?: string;
  manager?: string;
}): MatchTrainerSession {
  const now = new Date().toISOString();
  return {
    id: createStableId('match-video'),
    createdAt: now,
    updatedAt: now,
    title: `Partida ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    source: input.source,
    videoPath: input.videoPath,
    fileName: input.fileName,
    fileSizeBytes: Math.max(0, input.fileSizeBytes || input.recording?.sizeBytes || 0),
    recording: input.recording || null,
    quality: input.quality || input.recording?.quality || 'imported',
    formation: input.formation || 'Não informada',
    teamStyle: input.teamStyle || 'Não informado',
    manager: input.manager || 'Não informado',
    connectionRating: 3,
    notes: '',
    markers: [],
    status: 'recorded'
  };
}

export function createMatchMarker(kind: MatchEventKind, atMs: number, detail = '', source: MatchEventSource = 'manual', confidence = source === 'manual' ? 100 : 60): MatchEventMarker {
  return {
    id: createStableId('match-marker'),
    atMs: Math.max(0, Math.round(atMs)),
    kind,
    source,
    confidence: Math.max(0, Math.min(100, Math.round(confidence))),
    title: EVENT_LABELS[kind],
    detail: detail.trim().slice(0, 500)
  };
}

function waitForEvent(target: EventTarget, success: string, error: string, timeoutMs = 20_000) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => cleanup(new Error(`Tempo esgotado ao aguardar ${success}.`)), timeoutMs);
    const onSuccess = () => cleanup();
    const onError = () => cleanup(new Error(`Não foi possível processar o vídeo (${error}).`));
    function cleanup(failure?: Error) {
      window.clearTimeout(timeout);
      target.removeEventListener(success, onSuccess);
      target.removeEventListener(error, onError);
      if (failure) reject(failure); else resolve();
    }
    target.addEventListener(success, onSuccess, { once: true });
    target.addEventListener(error, onError, { once: true });
  });
}

async function seekVideo(video: HTMLVideoElement, seconds: number) {
  if (Math.abs(video.currentTime - seconds) < .015) return;
  const pending = waitForEvent(video, 'seeked', 'error', 12_000);
  video.currentTime = Math.max(0, Math.min(video.duration || seconds, seconds));
  await pending;
}

function frameMetrics(data: Uint8ClampedArray, previous: Uint8Array | null) {
  const pixels = data.length / 4;
  const gray = new Uint8Array(pixels);
  let brightness = 0;
  let green = 0;
  let motion = 0;
  let edge = 0;
  const width = 96;
  for (let index = 0; index < pixels; index += 1) {
    const offset = index * 4;
    const r = data[offset], g = data[offset + 1], b = data[offset + 2];
    const value = Math.round(r * .299 + g * .587 + b * .114);
    gray[index] = value;
    brightness += value;
    if (g > r * 1.12 && g > b * 1.06 && g > 48) green += 1;
    if (previous) motion += Math.abs(value - previous[index]);
    if (index % width !== 0) edge += Math.abs(value - gray[index - 1]);
  }
  return {
    gray,
    brightness: round(brightness / pixels / 255),
    greenShare: round(green / pixels),
    motion: previous ? round(motion / pixels / 255) : 0,
    edgeEnergy: round(edge / Math.max(1, pixels - Math.ceil(pixels / width)) / 255)
  };
}

export async function analyzeMatchVideo(source: Blob | string, options: { sampleIntervalMs?: number; maxSamples?: number; onProgress?: (progress: number, message: string) => void; signal?: AbortSignal } = {}): Promise<MatchVideoAnalysis> {
  if (typeof document === 'undefined') throw new Error('A análise de vídeo precisa ser executada no aplicativo ou navegador.');
  const objectUrl = source instanceof Blob ? URL.createObjectURL(source) : source;
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  video.src = objectUrl;
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 54;
  const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!context) throw new Error('O aparelho não liberou o processador de imagens do navegador.');
  try {
    await waitForEvent(video, 'loadedmetadata', 'error', 30_000);
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error('O vídeo não possui duração válida.');
    const durationMs = Math.round(video.duration * 1000);
    const requestedInterval = Math.max(750, options.sampleIntervalMs || 2000);
    const maxSamples = Math.max(12, Math.min(300, options.maxSamples || 180));
    const sampleIntervalMs = Math.max(requestedInterval, Math.ceil(durationMs / maxSamples));
    const times: number[] = [];
    for (let atMs = 0; atMs < durationMs; atMs += sampleIntervalMs) times.push(atMs);
    if (times[times.length - 1] < durationMs - 300) times.push(Math.max(0, durationMs - 150));
    const samples: MatchVideoSample[] = [];
    let previous: Uint8Array | null = null;
    for (let index = 0; index < times.length; index += 1) {
      if (options.signal?.aborted) throw new DOMException('Análise cancelada.', 'AbortError');
      const atMs = times[index];
      options.onProgress?.(Math.round(index / Math.max(1, times.length) * 100), `Analisando quadro ${index + 1} de ${times.length}`);
      await seekVideo(video, atMs / 1000);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const metrics = frameMetrics(context.getImageData(0, 0, canvas.width, canvas.height).data, previous);
      previous = metrics.gray;
      samples.push({ atMs, motion: metrics.motion, brightness: metrics.brightness, greenShare: metrics.greenShare, edgeEnergy: metrics.edgeEnergy });
    }
    options.onProgress?.(100, 'Consolidando evidências da partida');
    const motionValues = samples.slice(1).map((sample) => sample.motion);
    const motionAverage = motionValues.length ? motionValues.reduce((sum, value) => sum + value, 0) / motionValues.length : 0;
    const sortedMotion = [...motionValues].sort((a, b) => a - b);
    const highThreshold = sortedMotion[Math.floor(sortedMotion.length * .82)] || motionAverage * 1.4;
    const lowThreshold = Math.min(.018, sortedMotion[Math.floor(sortedMotion.length * .14)] || .008);
    const highMotionMoments = samples.filter((sample) => sample.motion >= highThreshold && sample.greenShare >= .08).map((sample) => sample.atMs).slice(0, 20);
    const lowMotionMoments: number[] = [];
    let lowRun = 0;
    for (const sample of samples) {
      const looksLikeGameplay = sample.greenShare >= .08 || sample.edgeEnergy >= .08;
      if (looksLikeGameplay && sample.motion <= lowThreshold) lowRun += 1;
      else lowRun = 0;
      if (lowRun >= 2) lowMotionMoments.push(sample.atMs);
    }
    const automaticMarkers = lowMotionMoments.slice(0, 12).map((atMs) => createMatchMarker(
      'possible-delay',
      atMs,
      'Pouca alteração visual em quadros consecutivos. Pode ser pausa, bola parada, replay ou possível travamento; revise o trecho antes de confirmar.',
      'automatic',
      45
    ));
    const resolutionScore = clamp((video.videoWidth * video.videoHeight) / (1280 * 720));
    const sampleScore = clamp(samples.length / 45);
    const gameplayShare = samples.filter((sample) => sample.greenShare >= .08 || sample.edgeEnergy >= .08).length / Math.max(1, samples.length);
    const qualityScore = Math.round((resolutionScore * .38 + sampleScore * .26 + gameplayShare * .36) * 100);
    const confidence = qualityScore >= 78 ? 'high' : qualityScore >= 52 ? 'medium' : 'low';
    return {
      engineVersion: MATCH_TRAINER_VERSION,
      analyzedAt: new Date().toISOString(),
      durationMs,
      width: video.videoWidth,
      height: video.videoHeight,
      sampleIntervalMs,
      sampleCount: samples.length,
      qualityScore,
      confidence,
      motionAverage: round(motionAverage),
      possibleFreezeCount: automaticMarkers.length,
      highMotionMoments,
      lowMotionMoments,
      samples,
      automaticMarkers,
      safeguards: [
        'A análise automática não conhece os botões pressionados e não afirma a causa de um lance sem revisão humana.',
        'Momentos de baixa movimentação podem ser replay, pausa ou bola parada; aparecem apenas como possíveis sinais.',
        'Nenhuma ficha é alterada automaticamente a partir do vídeo.',
        'O vídeo permanece local, salvo no aparelho, até o usuário escolher excluir ou compartilhar.'
      ]
    };
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    if (source instanceof Blob) URL.revokeObjectURL(objectUrl);
  }
}

export function summarizeMatchTrainerSession(session: MatchTrainerSession): MatchTrainerSummary {
  const markers = [...(session.analysis?.automaticMarkers || []), ...session.markers];
  const counts = (kind: MatchEventKind) => markers.filter((marker) => marker.kind === kind).length;
  const problems: Array<{ kind: MatchEventKind; count: number }> = ([
    { kind: 'pass-error', count: counts('pass-error') },
    { kind: 'dangerous-turnover', count: counts('dangerous-turnover') },
    { kind: 'marking-error', count: counts('marking-error') },
    { kind: 'cursor-error', count: counts('cursor-error') },
    { kind: 'forced-shot', count: counts('forced-shot') },
    { kind: 'possible-delay', count: counts('possible-delay') }
  ] satisfies Array<{ kind: MatchEventKind; count: number }>).sort((a, b) => b.count - a.count);
  const primaryProblem = problems[0]?.count ? problems[0].kind : null;
  const priorities: string[] = [];
  const matchRules: string[] = [];
  if (counts('pass-error') || counts('dangerous-turnover')) {
    priorities.push('Treinar passe seguro, domínio antes do comando e opção de recuo.');
    matchRules.push('No campo defensivo, faça no máximo um passe vertical por sequência.');
  }
  if (counts('marking-error')) {
    priorities.push('Fechar o centro com o Primeiro Volante e preservar a linha de zaga.');
    matchRules.push('Puxe o VOL antes de retirar um zagueiro da última linha.');
  }
  if (counts('cursor-error')) priorities.push('Treinar troca antecipada de cursor e leitura do receptor adversário.');
  if (counts('forced-shot')) priorities.push('Dominar, levantar a cabeça e comparar passe, condução e chute.');
  if (counts('possible-delay')) matchRules.push('Quando houver atraso, reduza tabelas de primeira e recicle por VOL e zagueiros.');
  if (!priorities.length) priorities.push('Continue marcando eventos em pelo menos três partidas para encontrar um padrão confiável.');
  return {
    totalMarkers: markers.length,
    passErrors: counts('pass-error'),
    dangerousTurnovers: counts('dangerous-turnover'),
    markingErrors: counts('marking-error'),
    cursorErrors: counts('cursor-error'),
    forcedShots: counts('forced-shot'),
    possibleDelay: counts('possible-delay'),
    goodPlays: counts('good-play'),
    primaryProblem,
    verdict: primaryProblem ? `O problema mais repetido nesta revisão foi: ${EVENT_LABELS[primaryProblem]}.` : 'Ainda não há erros confirmados suficientes para concluir o padrão da partida.',
    priorities,
    matchRules
  };
}

export function exportMatchTrainerReport(session: MatchTrainerSession) {
  const summary = summarizeMatchTrainerSession(session);
  const markers = [...(session.analysis?.automaticMarkers || []), ...session.markers].sort((a, b) => a.atMs - b.atMs);
  const formatTime = (ms: number) => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms % 60000 / 1000)).padStart(2, '0')}`;
  return [
    'BUILDMASTER ELITE TÁTICO — TREINADOR DE PARTIDAS v31.72',
    `Partida: ${session.title}`,
    `Arquivo: ${session.fileName}`,
    `Formação: ${session.formation}`,
    `Estilo coletivo: ${session.teamStyle}`,
    `Técnico: ${session.manager}`,
    `Conexão informada: ${session.connectionRating}/5`,
    `Análise: ${session.analysis ? `${session.analysis.qualityScore}% • confiança ${session.analysis.confidence}` : 'não executada'}`,
    '',
    summary.verdict,
    '',
    'PRIORIDADES',
    ...summary.priorities.map((item) => `- ${item}`),
    '',
    'REGRAS PARA A PRÓXIMA PARTIDA',
    ...summary.matchRules.map((item) => `- ${item}`),
    '',
    'LINHA DO TEMPO',
    ...markers.map((marker) => `${formatTime(marker.atMs)} — ${marker.title} — ${marker.detail || 'Sem observação'} — ${marker.source === 'automatic' ? `automático ${marker.confidence}%` : 'confirmado manualmente'}`),
    '',
    'LIMITES DA ANÁLISE',
    ...(session.analysis?.safeguards || ['O vídeo ainda não foi analisado.'])
  ].join('\n');
}
