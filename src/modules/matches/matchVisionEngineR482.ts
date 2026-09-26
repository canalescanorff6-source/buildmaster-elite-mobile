import type { TacticalStyle } from '@/lib/analyzer';
import type { TeamDiagnosis } from '@/modules/core/centralIntelligence';
import {
  getConfirmedMatchMarkers,
  getVisibleMatchMarkers,
  isAttackEvent,
  isDefenseEvent,
  type MatchEventKind,
  type MatchEventMarker,
  type MatchPhase,
  type MatchTrainerSession
} from './matchTrainerEngine';

export const MATCH_VISION_R482_VERSION = '40.80-r482-match-vision-v1';

export type MatchVisionTimelineSegmentR482 = {
  index: number;
  startMs: number;
  endMs: number;
  label: string;
  dominantPhase: MatchPhase;
  intensity: number;
  confirmedEvents: number;
  positiveEvents: number;
  riskEvents: number;
  attackEvents: number;
  defenseEvents: number;
  transitionEvents: number;
};

export type MatchVisionCriticalWindowR482 = {
  id: string;
  centerMs: number;
  startMs: number;
  endMs: number;
  score: number;
  phase: MatchPhase;
  title: string;
  reason: string;
  markerKinds: MatchEventKind[];
  confirmedEvents: number;
};

export type MatchVisionPatternR482 = {
  kind: MatchEventKind;
  label: string;
  occurrences: number;
  impact: number;
  moments: number[];
  phase: MatchPhase;
};

export type MatchVisionSnapshotR482 = {
  version: string;
  mode: 'READ_ONLY_MATCH_VISION';
  confidence: number;
  configuredContext: {
    formation: string;
    teamStyle: TacticalStyle;
  };
  evidence: {
    durationMs: number;
    videoAnalyzed: boolean;
    videoQualityScore: number;
    confirmedMarkers: number;
    suggestedMarkers: number;
    reviewedCoverage: number;
    sampleCount: number;
  };
  timeline: MatchVisionTimelineSegmentR482[];
  criticalWindows: MatchVisionCriticalWindowR482[];
  recurringPatterns: MatchVisionPatternR482[];
  phaseBalance: Array<{
    phase: MatchPhase;
    label: string;
    confirmedEvents: number;
    share: number;
  }>;
  styleObservation: string;
  connectionGuardrail: string;
  strengths: string[];
  risks: string[];
  authority: {
    readOnly: true;
    canConfirmMarkersAutomatically: false;
    canWriteTraining: false;
    canWriteSkills: false;
    canWriteImpetus: false;
    canOverrideR128: false;
  };
  guardrails: string[];
};

type MatchVisionInputR482 = {
  session: MatchTrainerSession;
  team: TeamDiagnosis;
  teamStyle: TacticalStyle;
};

const POSITIVE_KINDS = new Set<MatchEventKind>([
  'good-transition',
  'good-build-up',
  'good-play',
  'goal-for',
  'interception'
]);

const TRANSITION_KINDS = new Set<MatchEventKind>([
  'dangerous-turnover',
  'late-recomposition',
  'good-transition',
  'lost-counterattack',
  'second-ball-failure'
]);

const PHASE_ORDER: MatchPhase[] = [
  'build-up',
  'attack',
  'defensive-transition',
  'defense',
  'set-piece',
  'game-management',
  'unknown'
];

const PHASE_LABELS: Record<MatchPhase, string> = {
  'build-up': 'Construção',
  attack: 'Ataque',
  'defensive-transition': 'Transição defensiva',
  defense: 'Defesa',
  'set-piece': 'Bola parada',
  'game-management': 'Gestão',
  unknown: 'Não confirmado'
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function severityWeight(marker: MatchEventMarker) {
  if (marker.severity === 'critical') return 5;
  if (marker.severity === 'high') return 4;
  if (marker.severity === 'medium') return 3;
  if (marker.severity === 'low') return 2;
  if (marker.severity === 'positive') return 1;
  return 2;
}

function normalizedPhase(marker: MatchEventMarker): MatchPhase {
  if (marker.phase && PHASE_ORDER.includes(marker.phase)) return marker.phase;
  if (isAttackEvent(marker.kind)) return 'attack';
  if (isDefenseEvent(marker.kind)) return 'defense';
  if (TRANSITION_KINDS.has(marker.kind)) return 'defensive-transition';
  return 'unknown';
}

function markerLabel(kind: MatchEventKind) {
  return kind
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('pt-BR'));
}

function dominantPhase(markers: MatchEventMarker[]): MatchPhase {
  if (!markers.length) return 'unknown';
  const counts = new Map<MatchPhase, number>();
  for (const marker of markers) {
    const phase = normalizedPhase(marker);
    counts.set(phase, (counts.get(phase) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || PHASE_ORDER.indexOf(a[0]) - PHASE_ORDER.indexOf(b[0]))[0]?.[0] ?? 'unknown';
}

function segmentLabel(index: number, total: number) {
  if (index === 0) return 'Início';
  if (index === total - 1) return 'Final';
  if (index < total / 2) return '1ª metade';
  return '2ª metade';
}

function buildTimeline(markers: MatchEventMarker[], durationMs: number): MatchVisionTimelineSegmentR482[] {
  const segmentCount = durationMs >= 60 * 60 * 1000 ? 8 : durationMs >= 25 * 60 * 1000 ? 6 : 4;
  const safeDuration = Math.max(durationMs, 1);
  const segmentMs = safeDuration / segmentCount;
  return Array.from({ length: segmentCount }, (_, index) => {
    const startMs = Math.round(index * segmentMs);
    const endMs = index === segmentCount - 1 ? Math.round(safeDuration) : Math.round((index + 1) * segmentMs);
    const inSegment = markers.filter((marker) => marker.atMs >= startMs && marker.atMs <= endMs);
    const positiveEvents = inSegment.filter((marker) => POSITIVE_KINDS.has(marker.kind)).length;
    const riskEvents = inSegment.filter((marker) => !POSITIVE_KINDS.has(marker.kind)).length;
    const attackEvents = inSegment.filter((marker) => isAttackEvent(marker.kind)).length;
    const defenseEvents = inSegment.filter((marker) => isDefenseEvent(marker.kind)).length;
    const transitionEvents = inSegment.filter((marker) => TRANSITION_KINDS.has(marker.kind)).length;
    const impact = inSegment.reduce((sum, marker) => sum + severityWeight(marker), 0);
    return {
      index,
      startMs,
      endMs,
      label: segmentLabel(index, segmentCount),
      dominantPhase: dominantPhase(inSegment),
      intensity: clamp(Math.min(100, impact * 12 + inSegment.length * 5)),
      confirmedEvents: inSegment.length,
      positiveEvents,
      riskEvents,
      attackEvents,
      defenseEvents,
      transitionEvents
    };
  });
}

function buildCriticalWindows(markers: MatchEventMarker[], durationMs: number): MatchVisionCriticalWindowR482[] {
  const windows = markers
    .filter((marker) => !POSITIVE_KINDS.has(marker.kind))
    .map((marker, index) => {
      const startMs = Math.max(0, marker.clipStartMs ?? marker.atMs - 8000);
      const endMs = Math.min(Math.max(durationMs, marker.atMs + 1), marker.clipEndMs ?? marker.atMs + 10000);
      const nearby = markers.filter((candidate) => Math.abs(candidate.atMs - marker.atMs) <= 15000);
      const score = clamp(severityWeight(marker) * 16 + Math.max(0, nearby.length - 1) * 8 + (marker.repeated ? 10 : 0));
      return {
        id: `vision-window-${index}-${Math.round(marker.atMs)}`,
        centerMs: marker.atMs,
        startMs,
        endMs,
        score,
        phase: normalizedPhase(marker),
        title: marker.title || markerLabel(marker.kind),
        reason: marker.why || marker.detail || 'Janela com evidência confirmada que merece revisão tática.',
        markerKinds: [...new Set(nearby.map((candidate) => candidate.kind))],
        confirmedEvents: nearby.length
      };
    })
    .sort((a, b) => b.score - a.score || a.centerMs - b.centerMs);

  const picked: MatchVisionCriticalWindowR482[] = [];
  for (const window of windows) {
    if (picked.some((current) => Math.abs(current.centerMs - window.centerMs) < 12000)) continue;
    picked.push(window);
    if (picked.length >= 5) break;
  }
  return picked;
}

function buildPatterns(markers: MatchEventMarker[]): MatchVisionPatternR482[] {
  const grouped = new Map<MatchEventKind, MatchEventMarker[]>();
  for (const marker of markers) {
    if (POSITIVE_KINDS.has(marker.kind)) continue;
    const list = grouped.get(marker.kind) ?? [];
    list.push(marker);
    grouped.set(marker.kind, list);
  }
  return [...grouped.entries()]
    .map(([kind, items]) => ({
      kind,
      label: items[0]?.title || markerLabel(kind),
      occurrences: items.length,
      impact: clamp(items.reduce((sum, marker) => sum + severityWeight(marker), 0) * 12),
      moments: items.map((marker) => marker.atMs).sort((a, b) => a - b),
      phase: dominantPhase(items)
    }))
    .sort((a, b) => b.occurrences - a.occurrences || b.impact - a.impact)
    .slice(0, 6);
}

function buildPhaseBalance(markers: MatchEventMarker[]) {
  const total = markers.length;
  return PHASE_ORDER
    .map((phase) => {
      const confirmedEvents = markers.filter((marker) => normalizedPhase(marker) === phase).length;
      return {
        phase,
        label: PHASE_LABELS[phase],
        confirmedEvents,
        share: total ? clamp((confirmedEvents / total) * 100) : 0
      };
    })
    .filter((item) => item.confirmedEvents > 0 || item.phase === 'unknown');
}

function styleObservation(teamStyle: TacticalStyle, markers: MatchEventMarker[], team: TeamDiagnosis) {
  const buildUp = markers.filter((marker) => normalizedPhase(marker) === 'build-up').length;
  const attack = markers.filter((marker) => normalizedPhase(marker) === 'attack').length;
  const transition = markers.filter((marker) => normalizedPhase(marker) === 'defensive-transition').length;
  const passRisks = markers.filter((marker) => ['pass-error', 'pressured-receiver', 'late-release', 'no-triangulation'].includes(marker.kind)).length;
  const positiveBuild = markers.filter((marker) => marker.kind === 'good-build-up').length;

  if (!markers.length) return `Sem lances confirmados suficientes para comparar o comportamento observado com ${team.formation}.`;
  if (teamStyle === 'POSSE_DE_BOLA') {
    if (positiveBuild > passRisks && buildUp > 0) return 'Os lances confirmados mostram sinais compatíveis com circulação e construção; preserve apoios curtos e confirme em mais partidas.';
    return 'A amostra confirmada ainda mostra interrupções na circulação ou pouca evidência de construção segura para validar plenamente o modelo de Posse de Bola.';
  }
  if (teamStyle === 'CONTRA_ATAQUE_RAPIDO' || teamStyle === 'CONTRA_ATAQUE') {
    if (transition + attack >= buildUp) return 'A amostra confirmada concentra mais ações de transição/ataque do que de construção longa, coerente com um modelo vertical, sem implicar previsão de resultado.';
    return 'Os lances confirmados mostram mais construção do que aceleração; vale revisar se a execução está correspondendo ao modelo de contra-ataque configurado.';
  }
  return `A leitura atual usa ${markers.length} lance(s) confirmado(s) para comparar execução e contexto do estilo configurado, sem alterar a tática automaticamente.`;
}

export function buildMatchVisionR482({ session, team, teamStyle }: MatchVisionInputR482): MatchVisionSnapshotR482 {
  const visible = getVisibleMatchMarkers(session);
  const confirmed = getConfirmedMatchMarkers(session);
  const suggestedMarkers = visible.filter((marker) => marker.reviewStatus === 'suggested').length;
  const totalReviewable = confirmed.length + suggestedMarkers;
  const reviewedCoverage = totalReviewable ? clamp((confirmed.length / totalReviewable) * 100) : 0;
  const durationMs = Math.max(
    Number(session.analysis?.durationMs || 0),
    ...confirmed.map((marker) => marker.atMs),
    0
  );
  const videoQualityScore = clamp(Number(session.analysis?.qualityScore || 0));
  const sampleCount = Number(session.analysis?.sampleCount || 0);
  const videoEvidence = session.analysis ? Math.min(100, 35 + videoQualityScore * .45 + Math.min(20, sampleCount / 8)) : 0;
  const confirmedEvidence = Math.min(100, confirmed.length * 11);
  const contextEvidence = team.formation ? 10 : 0;
  const confidence = clamp(
    confirmedEvidence * .48 +
    reviewedCoverage * .22 +
    videoEvidence * .2 +
    contextEvidence
  );

  const timeline = buildTimeline(confirmed, durationMs);
  const criticalWindows = buildCriticalWindows(confirmed, durationMs);
  const recurringPatterns = buildPatterns(confirmed);
  const phaseBalance = buildPhaseBalance(confirmed);
  const strengths = [
    confirmed.filter((marker) => POSITIVE_KINDS.has(marker.kind)).length
      ? `${confirmed.filter((marker) => POSITIVE_KINDS.has(marker.kind)).length} jogada(s) positiva(s) confirmada(s) para repetir.`
      : null,
    reviewedCoverage >= 70 ? `${reviewedCoverage}% dos momentos revisáveis já foram confirmados pelo usuário.` : null,
    timeline.some((segment) => segment.positiveEvents > segment.riskEvents)
      ? 'Existe ao menos um trecho com mais evidências positivas do que riscos confirmados.'
      : null
  ].filter((item): item is string => Boolean(item));

  const risks = [
    recurringPatterns[0]?.occurrences >= 2
      ? `Padrão recorrente: ${recurringPatterns[0].label} apareceu ${recurringPatterns[0].occurrences} vez(es).`
      : null,
    suggestedMarkers > 0 ? `${suggestedMarkers} momento(s) automático(s) ainda aguardam confirmação e não entram como erro.` : null,
    confirmed.length < 3 ? 'Amostra confirmada pequena: use a leitura como hipótese de revisão, não como conclusão definitiva.' : null
  ].filter((item): item is string => Boolean(item));

  const possibleDelayCount = confirmed.filter((marker) => marker.kind === 'possible-delay').length;
  const freezeCount = Number(session.analysis?.possibleFreezeCount || 0);
  const connectionGuardrail = possibleDelayCount || freezeCount
    ? `Há ${possibleDelayCount} marcação(ões) confirmada(s) de possível atraso e ${freezeCount} pausa(s) visual(is) detectada(s). Pausa visual isolada não prova lag; valide junto com sensação de comando e conexão.`
    : 'Nenhuma evidência confirmada suficiente para atribuir problemas táticos à conexão. O Match Vision não chama pausa visual de lag automaticamente.';

  return {
    version: MATCH_VISION_R482_VERSION,
    mode: 'READ_ONLY_MATCH_VISION',
    confidence,
    configuredContext: {
      formation: team.formation,
      teamStyle
    },
    evidence: {
      durationMs,
      videoAnalyzed: Boolean(session.analysis),
      videoQualityScore,
      confirmedMarkers: confirmed.length,
      suggestedMarkers,
      reviewedCoverage,
      sampleCount
    },
    timeline,
    criticalWindows,
    recurringPatterns,
    phaseBalance,
    styleObservation: styleObservation(teamStyle, confirmed, team),
    connectionGuardrail,
    strengths,
    risks,
    authority: {
      readOnly: true,
      canConfirmMarkersAutomatically: false,
      canWriteTraining: false,
      canWriteSkills: false,
      canWriteImpetus: false,
      canOverrideR128: false
    },
    guardrails: [
      'Somente lances confirmados entram nos padrões, fases e janelas críticas; candidatos automáticos permanecem pendentes.',
      'O Match Vision R482 não reconhece com certeza botões, identidade de todos os jogadores ou causa de lag sem confirmação externa.',
      'A camada é observacional: não altera automaticamente formação, escalação, ficha, Top 5 ou Ímpeto.',
      'A autoridade final das cartas permanece R119 → R126 → R128.'
    ]
  };
}
