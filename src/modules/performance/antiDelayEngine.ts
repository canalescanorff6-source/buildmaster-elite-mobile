import { createStableId } from '@/lib/stableId';
import type { CompetitiveMatchRecord } from '@/modules/matches/competitivePerformanceEngine';

export const ANTI_DELAY_VERSION = '29.60.0';
export const ANTI_DELAY_STORAGE_KEY = 'buildmaster_anti_delay_samples_v2960';
export const ANTI_DELAY_LINK_STORAGE_KEY = 'buildmaster_anti_delay_match_links_v2960';
export const ANTI_DELAY_PROFILE_STORAGE_KEY = 'buildmaster_anti_delay_profile_v2960';

export type ConnectionKind = 'wifi-5ghz' | 'wifi-2.4ghz' | 'mobile' | 'ethernet' | 'unknown';
export type ThermalLevel = 1 | 2 | 3 | 4 | 5;
export type QualityBand = 'excelente' | 'boa' | 'atenção' | 'ruim' | 'crítica';

export type AntiDelayProfile = {
  deviceLabel: string;
  connectionKind: ConnectionKind;
  preferWifi5Ghz: boolean;
  gameQualityMode: 'desempenho' | 'equilibrado' | 'qualidade';
  targetFps: 30 | 60 | 90 | 120;
  notes: string;
};

export type AntiDelaySample = {
  schemaVersion: 1;
  id: string;
  measuredAt: string;
  deviceLabel: string;
  connectionKind: ConnectionKind;
  pingMs: number;
  jitterMs: number;
  packetLossPct: number;
  downlinkMbps: number | null;
  signalQuality: number;
  batteryPct: number | null;
  batterySaver: boolean;
  memoryFreeGb: number | null;
  thermalLevel: ThermalLevel;
  backgroundLoad: number;
  perceivedDelay: 1 | 2 | 3 | 4 | 5;
  hour: number;
  source: 'http-probe' | 'manual' | 'mixed';
};

export type AntiDelayMatchLink = {
  id: string;
  linkedAt: string;
  sampleId: string;
  matchId: string | null;
  passErrors: number;
  finishingErrors: number;
  defensiveErrors: number;
  turnovers: number;
  result: 'win' | 'draw' | 'loss' | 'unknown';
  perceivedDelay: 1 | 2 | 3 | 4 | 5;
  technicalMistakeShare: number;
  probableDelayShare: number;
};

export type AntiDelayMetric = {
  key: 'latency' | 'jitter' | 'loss' | 'device' | 'thermal' | 'readiness';
  label: string;
  value: number;
  display: string;
  band: QualityBand;
  detail: string;
};

export type AntiDelayDiagnosis = {
  version: string;
  score: number;
  band: QualityBand;
  metrics: AntiDelayMetric[];
  blockers: string[];
  networkActions: string[];
  deviceActions: string[];
  gameActions: string[];
  preMatchChecklist: Array<{ label: string; passed: boolean; detail: string }>;
  confidence: number;
  explanation: string;
};

export type AntiDelayHistorySummary = {
  samples: number;
  averageScore: number;
  bestHours: Array<{ hour: number; label: string; samples: number; score: number }>;
  connectionRanking: Array<{ kind: ConnectionKind; label: string; samples: number; score: number }>;
  delayErrorCorrelation: number | null;
  correlationLabel: string;
  likelyDelayShare: number;
  recommendations: string[];
};

export type HttpProbeResult = {
  pingMs: number;
  jitterMs: number;
  packetLossPct: number;
  attempts: number;
  successes: number;
  samples: number[];
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const toRating = (value: number): 1 | 2 | 3 | 4 | 5 => clamp(Math.round(value), 1, 5) as 1 | 2 | 3 | 4 | 5;

export const CONNECTION_LABELS: Record<ConnectionKind, string> = {
  'wifi-5ghz': 'Wi‑Fi 5 GHz',
  'wifi-2.4ghz': 'Wi‑Fi 2,4 GHz',
  mobile: 'Rede móvel',
  ethernet: 'Ethernet',
  unknown: 'Não identificada'
};

function bandFor(score: number): QualityBand {
  if (score >= 88) return 'excelente';
  if (score >= 74) return 'boa';
  if (score >= 58) return 'atenção';
  if (score >= 38) return 'ruim';
  return 'crítica';
}

function latencyScore(ms: number) {
  if (ms <= 25) return 100;
  if (ms <= 45) return 92 - (ms - 25) * .6;
  if (ms <= 80) return 80 - (ms - 45) * .8;
  if (ms <= 130) return 52 - (ms - 80) * .55;
  return Math.max(0, 24 - (ms - 130) * .2);
}

function jitterScore(ms: number) {
  if (ms <= 4) return 100;
  if (ms <= 10) return 94 - (ms - 4) * 3;
  if (ms <= 20) return 76 - (ms - 10) * 3.2;
  return Math.max(0, 44 - (ms - 20) * 2);
}

function lossScore(pct: number) {
  if (pct <= .1) return 100;
  if (pct <= 1) return 98 - pct * 14;
  if (pct <= 3) return 84 - (pct - 1) * 18;
  return Math.max(0, 48 - (pct - 3) * 12);
}

function thermalScore(level: ThermalLevel) {
  return ({ 1: 100, 2: 90, 3: 70, 4: 40, 5: 12 } as const)[level];
}

function deviceScore(sample: AntiDelaySample) {
  const battery = sample.batteryPct == null ? 75 : sample.batteryPct < 15 ? 35 : sample.batteryPct < 30 ? 65 : 90;
  const saver = sample.batterySaver ? 52 : 100;
  const memory = sample.memoryFreeGb == null ? 72 : sample.memoryFreeGb >= 3 ? 100 : sample.memoryFreeGb >= 1.5 ? 82 : sample.memoryFreeGb >= .8 ? 58 : 30;
  const background = clamp(110 - sample.backgroundLoad * 18);
  return battery * .18 + saver * .24 + memory * .28 + background * .3;
}

export function createAntiDelaySample(input: Omit<AntiDelaySample, 'schemaVersion' | 'id' | 'measuredAt' | 'hour'> & { id?: string; measuredAt?: string; hour?: number }): AntiDelaySample {
  const measuredAt = input.measuredAt && !Number.isNaN(Date.parse(input.measuredAt)) ? input.measuredAt : new Date().toISOString();
  return {
    schemaVersion: 1,
    id: input.id || createStableId('anti-delay'),
    measuredAt,
    deviceLabel: input.deviceLabel.trim().slice(0, 120) || 'Aparelho atual',
    connectionKind: input.connectionKind,
    pingMs: round(clamp(Number(input.pingMs) || 0, 0, 3000)),
    jitterMs: round(clamp(Number(input.jitterMs) || 0, 0, 1000)),
    packetLossPct: round(clamp(Number(input.packetLossPct) || 0, 0, 100), 2),
    downlinkMbps: input.downlinkMbps == null ? null : round(clamp(Number(input.downlinkMbps) || 0, 0, 10000)),
    signalQuality: Math.round(clamp(Number(input.signalQuality) || 0)),
    batteryPct: input.batteryPct == null ? null : Math.round(clamp(Number(input.batteryPct) || 0)),
    batterySaver: Boolean(input.batterySaver),
    memoryFreeGb: input.memoryFreeGb == null ? null : round(clamp(Number(input.memoryFreeGb) || 0, 0, 128), 2),
    thermalLevel: toRating(input.thermalLevel),
    backgroundLoad: toRating(input.backgroundLoad),
    perceivedDelay: toRating(input.perceivedDelay),
    hour: Number.isInteger(input.hour) ? clamp(Number(input.hour), 0, 23) : new Date(measuredAt).getHours(),
    source: input.source
  };
}

export function diagnoseAntiDelay(sample: AntiDelaySample): AntiDelayDiagnosis {
  const latency = latencyScore(sample.pingMs);
  const jitter = jitterScore(sample.jitterMs);
  const loss = lossScore(sample.packetLossPct);
  const thermal = thermalScore(sample.thermalLevel);
  const device = deviceScore(sample);
  const signal = sample.connectionKind === 'ethernet' ? 100 : sample.signalQuality;
  const readiness = clamp(latency * .28 + jitter * .2 + loss * .2 + thermal * .1 + device * .14 + signal * .08);
  const score = Math.round(readiness);
  const metrics: AntiDelayMetric[] = [
    { key: 'latency', label: 'Latência HTTP', value: round(latency), display: `${sample.pingMs} ms`, band: bandFor(latency), detail: 'Mede o tempo de resposta até um arquivo leve. Não substitui o ping do servidor da partida.' },
    { key: 'jitter', label: 'Jitter', value: round(jitter), display: `${sample.jitterMs} ms`, band: bandFor(jitter), detail: 'Variação entre amostras; valores altos deixam comandos inconsistentes.' },
    { key: 'loss', label: 'Perda estimada', value: round(loss), display: `${sample.packetLossPct}%`, band: bandFor(loss), detail: 'Estimativa por falhas de requisição; não é medição ICMP.' },
    { key: 'device', label: 'Aparelho', value: round(device), display: `${Math.round(device)}/100`, band: bandFor(device), detail: 'Combina bateria, economia, memória e carga em segundo plano.' },
    { key: 'thermal', label: 'Temperatura', value: thermal, display: `${sample.thermalLevel}/5`, band: bandFor(thermal), detail: 'Usa o nível informado ou estimado pelo usuário; navegadores não expõem temperatura real de forma universal.' },
    { key: 'readiness', label: 'Prontidão', value: score, display: `${score}/100`, band: bandFor(score), detail: 'Índice local para comparar condições no mesmo aparelho e rede.' }
  ];
  const blockers: string[] = [];
  if (sample.packetLossPct >= 2) blockers.push('Perda de pacotes alta: evite ranqueada até estabilizar a conexão.');
  if (sample.jitterMs >= 18) blockers.push('Jitter alto: comandos podem chegar em ritmos diferentes.');
  if (sample.pingMs >= 100) blockers.push('Latência alta no teste local. O servidor da partida pode ficar ainda pior.');
  if (sample.thermalLevel >= 4) blockers.push('Aparelho muito quente: há risco de redução automática de desempenho.');
  if (sample.batterySaver) blockers.push('Economia de bateria ativa pode limitar CPU, rede e taxa de atualização.');
  if (sample.memoryFreeGb != null && sample.memoryFreeGb < 1) blockers.push('Pouca memória livre para manter o jogo estável.');
  const networkActions = [
    sample.connectionKind === 'wifi-2.4ghz' ? 'Prefira o Wi‑Fi 5 GHz quando estiver perto do roteador.' : 'Mantenha o aparelho no mesmo ponto da casa usado nos melhores testes.',
    sample.jitterMs > 10 ? 'Pause downloads, streaming e backups de outros aparelhos durante as partidas.' : 'A variação está aceitável; preserve as mesmas condições.',
    sample.packetLossPct > 1 ? 'Reinicie o roteador e repita o teste antes de entrar na ranqueada.' : 'A perda estimada está controlada.',
    'Evite trocar DNS ou servidor esperando eliminar o delay do eFootball; use os testes para comparar condições reais.'
  ];
  const deviceActions = [
    sample.batterySaver ? 'Desative a economia de bateria antes de abrir o jogo.' : 'Mantenha a economia de bateria desligada.',
    sample.thermalLevel >= 3 ? 'Deixe o aparelho esfriar, retire capa grossa e evite carregar durante a partida.' : 'A condição térmica está adequada.',
    sample.backgroundLoad >= 4 ? 'Feche aplicativos pesados e gravação de tela.' : 'A carga em segundo plano está aceitável.',
    sample.memoryFreeGb != null && sample.memoryFreeGb < 1.5 ? 'Libere memória e reinicie o aparelho antes da sessão.' : 'A memória livre não indica bloqueio imediato.'
  ];
  const gameActions = [
    sample.perceivedDelay >= 4 ? 'Use dois toques, reduza passes de primeira e evite trocar jogador repetidamente.' : 'Mantenha o ritmo normal, mas confirme o primeiro toque antes do passe vertical.',
    sample.thermalLevel >= 3 ? 'Priorize qualidade gráfica baixa ou equilibrada e FPS estável.' : 'Priorize estabilidade de FPS em vez de qualidade máxima.',
    'Nos primeiros cinco minutos, teste passe curto, troca de jogador e resposta do sprint antes de acelerar o jogo.'
  ];
  const preMatchChecklist = [
    { label: 'Rede estável', passed: sample.jitterMs < 15 && sample.packetLossPct < 2, detail: `${sample.jitterMs} ms de jitter • ${sample.packetLossPct}% de perda` },
    { label: 'Latência aceitável', passed: sample.pingMs < 90, detail: `${sample.pingMs} ms no teste HTTP` },
    { label: 'Aparelho resfriado', passed: sample.thermalLevel <= 3, detail: `nível térmico ${sample.thermalLevel}/5` },
    { label: 'Sem economia de bateria', passed: !sample.batterySaver, detail: sample.batterySaver ? 'ativa' : 'desativada' },
    { label: 'Carga em segundo plano controlada', passed: sample.backgroundLoad <= 3, detail: `nível ${sample.backgroundLoad}/5` }
  ];
  const knownFields = [sample.downlinkMbps, sample.batteryPct, sample.memoryFreeGb].filter((value) => value != null).length;
  const confidence = Math.round(70 + knownFields * 7 + (sample.source === 'http-probe' ? 9 : sample.source === 'mixed' ? 6 : 0));
  return {
    version: ANTI_DELAY_VERSION,
    score,
    band: bandFor(score),
    metrics,
    blockers,
    networkActions,
    deviceActions,
    gameActions,
    preMatchChecklist,
    confidence: clamp(confidence),
    explanation: 'O índice compara condições locais e não promete reduzir o atraso do servidor. Ele ajuda a identificar quando sua rede ou aparelho provavelmente estão piorando a resposta.'
  };
}

function pearson(xs: number[], ys: number[]) {
  if (xs.length < 3 || xs.length !== ys.length) return null;
  const avgX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const avgY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  let numerator = 0;
  let xSquare = 0;
  let ySquare = 0;
  xs.forEach((x, index) => {
    const dx = x - avgX;
    const dy = ys[index] - avgY;
    numerator += dx * dy;
    xSquare += dx * dx;
    ySquare += dy * dy;
  });
  if (!xSquare || !ySquare) return null;
  return round(numerator / Math.sqrt(xSquare * ySquare), 2);
}

export function classifyMatchMistakes(sample: AntiDelaySample, match: Pick<CompetitiveMatchRecord, 'passErrors' | 'finishingErrors' | 'defensiveErrors' | 'turnovers' | 'connectionQuality'>) {
  const diagnosis = diagnoseAntiDelay(sample);
  const errors = match.passErrors + match.finishingErrors + match.defensiveErrors + match.turnovers;
  const networkRisk = clamp(100 - diagnosis.score + (6 - match.connectionQuality) * 7);
  const probableDelayShare = errors ? clamp(networkRisk * .72 + sample.perceivedDelay * 5, 0, 88) : 0;
  const technicalMistakeShare = 100 - probableDelayShare;
  return { probableDelayShare: Math.round(probableDelayShare), technicalMistakeShare: Math.round(technicalMistakeShare), errors };
}

export function linkSampleToMatch(sample: AntiDelaySample, match: CompetitiveMatchRecord | null): AntiDelayMatchLink {
  const classification = match ? classifyMatchMistakes(sample, match) : { probableDelayShare: Math.round(clamp(100 - diagnoseAntiDelay(sample).score)), technicalMistakeShare: Math.round(clamp(diagnoseAntiDelay(sample).score)), errors: 0 };
  const result = !match ? 'unknown' : match.goalsFor > match.goalsAgainst ? 'win' : match.goalsFor === match.goalsAgainst ? 'draw' : 'loss';
  return {
    id: createStableId('anti-delay-link'),
    linkedAt: new Date().toISOString(),
    sampleId: sample.id,
    matchId: match?.id ?? null,
    passErrors: match?.passErrors ?? 0,
    finishingErrors: match?.finishingErrors ?? 0,
    defensiveErrors: match?.defensiveErrors ?? 0,
    turnovers: match?.turnovers ?? 0,
    result,
    perceivedDelay: sample.perceivedDelay,
    technicalMistakeShare: classification.technicalMistakeShare,
    probableDelayShare: classification.probableDelayShare
  };
}

export function summarizeAntiDelayHistory(samples: AntiDelaySample[], links: AntiDelayMatchLink[] = []): AntiDelayHistorySummary {
  const normalized = samples.map((sample) => ({ sample, diagnosis: diagnoseAntiDelay(sample) }));
  const byHour = new Map<number, Array<{ sample: AntiDelaySample; diagnosis: AntiDelayDiagnosis }>>();
  const byConnection = new Map<ConnectionKind, Array<{ sample: AntiDelaySample; diagnosis: AntiDelayDiagnosis }>>();
  normalized.forEach((entry) => {
    byHour.set(entry.sample.hour, [...(byHour.get(entry.sample.hour) || []), entry]);
    byConnection.set(entry.sample.connectionKind, [...(byConnection.get(entry.sample.connectionKind) || []), entry]);
  });
  const bestHours = [...byHour.entries()].map(([hour, entries]) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00–${String((hour + 1) % 24).padStart(2, '0')}:00`,
    samples: entries.length,
    score: Math.round(entries.reduce((sum, entry) => sum + entry.diagnosis.score, 0) / entries.length)
  })).sort((a, b) => b.score - a.score || b.samples - a.samples).slice(0, 5);
  const connectionRanking = [...byConnection.entries()].map(([kind, entries]) => ({
    kind,
    label: CONNECTION_LABELS[kind],
    samples: entries.length,
    score: Math.round(entries.reduce((sum, entry) => sum + entry.diagnosis.score, 0) / entries.length)
  })).sort((a, b) => b.score - a.score || b.samples - a.samples);
  const linkBySample = new Map(links.map((link) => [link.sampleId, link]));
  const paired = normalized.map((entry) => ({ entry, link: linkBySample.get(entry.sample.id) })).filter((item): item is { entry: typeof normalized[number]; link: AntiDelayMatchLink } => Boolean(item.link));
  const correlation = pearson(paired.map((item) => 100 - item.entry.diagnosis.score), paired.map((item) => item.link.passErrors + item.link.finishingErrors + item.link.defensiveErrors + item.link.turnovers));
  const likelyDelayShare = links.length ? Math.round(links.reduce((sum, link) => sum + link.probableDelayShare, 0) / links.length) : 0;
  const recommendations: string[] = [];
  if (bestHours[0]) recommendations.push(`Seu melhor horário registrado é ${bestHours[0].label}, com índice ${bestHours[0].score}/100.`);
  if (connectionRanking[0]) recommendations.push(`${connectionRanking[0].label} apresenta o melhor resultado médio entre as conexões testadas.`);
  if (correlation != null && correlation >= .45) recommendations.push('Há correlação relevante entre pior condição de rede/aparelho e aumento de erros. Evite ranqueadas quando a prontidão cair.');
  else if (correlation != null && correlation <= .2) recommendations.push('Os dados atuais indicam que muitos erros parecem técnicos, não apenas causados por delay.');
  else recommendations.push('Registre pelo menos três testes ligados a partidas para medir a relação entre delay e erros.');
  return {
    samples: samples.length,
    averageScore: samples.length ? Math.round(normalized.reduce((sum, entry) => sum + entry.diagnosis.score, 0) / samples.length) : 0,
    bestHours,
    connectionRanking,
    delayErrorCorrelation: correlation,
    correlationLabel: correlation == null ? 'sem amostra suficiente' : correlation >= .65 ? 'forte' : correlation >= .35 ? 'moderada' : correlation >= .15 ? 'fraca' : 'não confirmada',
    likelyDelayShare,
    recommendations
  };
}

export function normalizeAntiDelayProfile(input: Partial<AntiDelayProfile> | null | undefined): AntiDelayProfile {
  return {
    deviceLabel: String(input?.deviceLabel || 'Aparelho atual').slice(0, 120),
    connectionKind: input?.connectionKind && input.connectionKind in CONNECTION_LABELS ? input.connectionKind : 'unknown',
    preferWifi5Ghz: input?.preferWifi5Ghz !== false,
    gameQualityMode: input?.gameQualityMode === 'qualidade' || input?.gameQualityMode === 'equilibrado' ? input.gameQualityMode : 'desempenho',
    targetFps: [30, 60, 90, 120].includes(Number(input?.targetFps)) ? Number(input?.targetFps) as AntiDelayProfile['targetFps'] : 60,
    notes: String(input?.notes || '').slice(0, 800)
  };
}

export async function runHttpLatencyProbe(options: { endpoint?: string; attempts?: number; timeoutMs?: number; fetcher?: typeof fetch } = {}): Promise<HttpProbeResult> {
  const endpoint = options.endpoint || '/manifest.webmanifest';
  const attempts = Math.max(3, Math.min(12, Math.round(options.attempts || 6)));
  const timeoutMs = Math.max(800, Math.min(10000, Math.round(options.timeoutMs || 3500)));
  const fetcher = options.fetcher || fetch;
  const samples: number[] = [];
  let successes = 0;
  for (let index = 0; index < attempts; index += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      const joiner = endpoint.includes('?') ? '&' : '?';
      const response = await fetcher(`${endpoint}${joiner}bm_probe=${Date.now()}_${index}`, { method: 'GET', cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      samples.push(round(end - start));
      successes += 1;
    } catch {
      // A falha é contabilizada como perda estimada. Não tentamos mascarar o erro.
    } finally {
      clearTimeout(timeout);
    }
  }
  const pingMs = samples.length ? round(samples.reduce((sum, value) => sum + value, 0) / samples.length) : timeoutMs;
  const jitterMs = samples.length > 1 ? round(samples.slice(1).reduce((sum, value, index) => sum + Math.abs(value - samples[index]), 0) / (samples.length - 1)) : timeoutMs;
  const packetLossPct = round(((attempts - successes) / attempts) * 100, 2);
  return { pingMs, jitterMs, packetLossPct, attempts, successes, samples };
}
