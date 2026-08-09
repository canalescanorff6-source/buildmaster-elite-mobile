import { accountStorageKey } from '@/lib/accountStorage';
import { runtimeGet, runtimePut } from '@/lib/localDatabase';
import { isNativeVaultStorageAvailable, nativeVaultRead, nativeVaultWrite } from '@/lib/nativeVaultStorage';
import {
  createEmptyMappingState,
  createMappingCardFingerprint,
  DEFAULT_MAPPING_PREFERENCES,
  SQUAD_MAPPING_VERSION,
  type FormationTrial,
  type MappingState,
  type SquadMappingPlayer
} from './squadMappingEngine';

export const SQUAD_MAPPING_STORAGE_KEY = 'buildmaster_squad_mapping_v3840';
const RUNTIME_KEY = 'squad-mapping:state';
const POSITIONS = ['CF','SS','LWF','RWF','LMF','RMF','AMF','CMF','DMF','CB','LB','RB','GK'] as const;
const ATTRIBUTE_KEYS = [
  'offensiveAwareness','ballControl','dribbling','tightPossession','lowPass','loftedPass','finishing','heading','placeKicking','curl',
  'defensiveAwareness','defensiveEngagement','tackling','aggression','goalkeeperAwareness','goalkeeperCatching','goalkeeperParrying',
  'goalkeeperReflexes','goalkeeperReach','speed','acceleration','kickingPower','jump','physicalContact','balance','stamina'
] as const;

function validPosition(value: unknown): value is SquadMappingPlayer['mainPosition'] {
  return POSITIONS.includes(String(value) as SquadMappingPlayer['mainPosition']);
}

function finiteNumber(value: unknown, min: number, max: number): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(min, Math.min(max, numeric)) : null;
}

function sanitizeAttributes(raw: unknown): SquadMappingPlayer['attributes'] {
  if (!raw || typeof raw !== 'object') return {};
  const source = raw as Record<string, unknown>;
  return Object.fromEntries(ATTRIBUTE_KEYS.flatMap((key) => {
    const value = finiteNumber(source[key], 1, 110);
    return value === null ? [] : [[key, value]];
  })) as SquadMappingPlayer['attributes'];
}

function sanitizePositionRatings(raw: unknown): SquadMappingPlayer['positionRatings'] {
  if (!raw || typeof raw !== 'object') return {};
  const source = raw as Record<string, unknown>;
  return Object.fromEntries(POSITIONS.flatMap((position) => {
    const value = finiteNumber(source[position], 1, 120);
    return value === null ? [] : [[position, value]];
  })) as SquadMappingPlayer['positionRatings'];
}

function sanitizeNumberRecord(raw: unknown, limit = 40) {
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(Object.entries(raw as Record<string, unknown>).flatMap(([key, value]) => {
    const numeric = finiteNumber(value, 0, 500);
    return !key || numeric === null ? [] : [[key.slice(0, 80), numeric]];
  }).slice(0, limit));
}

function sanitizePlayer(raw: Partial<SquadMappingPlayer>, index: number): SquadMappingPlayer | null {
  const name = String(raw.name ?? '').trim().slice(0, 80);
  const mainPosition = validPosition(raw.mainPosition) ? raw.mainPosition : null;
  if (!name || !mainPosition) return null;
  const now = new Date().toISOString();
  const positions = Array.isArray(raw.positions) ? raw.positions.filter(validPosition) : [];
  const trainedPositions = Array.isArray(raw.trainedPositions) ? raw.trainedPositions.filter(validPosition) : [];
  const attributes = sanitizeAttributes(raw.attributes);
  const skills = Array.isArray(raw.skills) ? Array.from(new Set(raw.skills.map(String).map((value) => value.trim()).filter(Boolean))).slice(0, 40) : [];
  const player: SquadMappingPlayer = {
    id: String(raw.id || `mapped-${Date.now()}-${index}`),
    name,
    cardLabel: String(raw.cardLabel ?? 'Carta mapeada').trim().slice(0, 100),
    cardFingerprint: String(raw.cardFingerprint ?? '').slice(0, 120),
    mainPosition,
    positions: Array.from(new Set([mainPosition, ...positions])),
    trainedPositions: Array.from(new Set(trainedPositions)),
    playstyle: String(raw.playstyle ?? '').trim().slice(0, 80),
    overall: finiteNumber(raw.overall, 1, 120),
    confidence: Math.max(0, Math.min(100, Math.round(Number(raw.confidence) || 0))),
    status: raw.status === 'pronto' ? 'pronto' : 'revisar',
    portrait: typeof raw.portrait === 'string' && raw.portrait.startsWith('data:image/') ? raw.portrait : null,
    sourceFileName: String(raw.sourceFileName ?? '').slice(0, 160),
    sourceHash: String(raw.sourceHash ?? '').slice(0, 128),
    imageRef: raw.imageRef ? String(raw.imageRef).slice(0, 180) : null,
    imageBytes: Math.max(0, Math.round(Number(raw.imageBytes) || 0)),
    imageStored: Boolean(raw.imageStored || raw.imageRef),
    attributes,
    positionRatings: sanitizePositionRatings(raw.positionRatings),
    skills,
    impetos: Array.isArray(raw.impetos) ? Array.from(new Set(raw.impetos.map(String).map((value) => value.trim()).filter(Boolean))).slice(0, 12) : [],
    height: finiteNumber(raw.height, 130, 230),
    weight: finiteNumber(raw.weight, 35, 180),
    age: finiteNumber(raw.age, 14, 70),
    level: finiteNumber(raw.level, 1, 99),
    physicalModel: sanitizeNumberRecord(raw.physicalModel),
    profileCoverage: Math.max(0, Math.min(100, Math.round(Number(raw.profileCoverage) || 0))),
    linkedHistoryId: raw.linkedHistoryId ? String(raw.linkedHistoryId) : null,
    locked: Boolean(raw.locked),
    excluded: Boolean(raw.excluded),
    note: String(raw.note ?? '').slice(0, 700),
    createdAt: String(raw.createdAt || now),
    updatedAt: String(raw.updatedAt || now)
  };
  if (!player.cardFingerprint) player.cardFingerprint = createMappingCardFingerprint(player);
  return player;
}

function sanitizeTrial(raw: Partial<FormationTrial>, index: number): FormationTrial | null {
  if (!raw.formationId || !raw.formationName) return null;
  const now = new Date().toISOString();
  const targetDays: 7 | 14 | 21 = raw.targetDays === 7 || raw.targetDays === 21 ? raw.targetDays : 14;
  const wins = Math.max(0, Math.round(Number(raw.wins) || 0));
  const draws = Math.max(0, Math.round(Number(raw.draws) || 0));
  const losses = Math.max(0, Math.round(Number(raw.losses) || 0));
  return {
    id: String(raw.id || `trial-${Date.now()}-${index}`),
    formationId: String(raw.formationId),
    formationName: String(raw.formationName).slice(0, 100),
    lineupPlayerIds: Array.isArray(raw.lineupPlayerIds) ? raw.lineupPlayerIds.map(String).slice(0, 30) : [],
    startedAt: String(raw.startedAt || now),
    targetDays,
    matches: Math.max(wins + draws + losses, Math.max(0, Math.round(Number(raw.matches) || 0))),
    wins,
    draws,
    losses,
    note: String(raw.note ?? '').slice(0, 1200),
    status: raw.status === 'concluido' ? 'concluido' : 'ativo',
    updatedAt: String(raw.updatedAt || now)
  };
}

export function sanitizeMappingState(raw: unknown): MappingState {
  if (!raw || typeof raw !== 'object') return createEmptyMappingState();
  const source = raw as Partial<MappingState>;
  const players = Array.isArray(source.players) ? source.players.map(sanitizePlayer).filter((item): item is SquadMappingPlayer => Boolean(item)).slice(0, 500) : [];
  const trials = Array.isArray(source.trials) ? source.trials.map(sanitizeTrial).filter((item): item is FormationTrial => Boolean(item)).slice(0, 100) : [];
  const preferences = { ...DEFAULT_MAPPING_PREFERENCES, ...(source.preferences ?? {}) };
  preferences.benchSize = 11;
  preferences.reserveGoalkeepers = preferences.reserveGoalkeepers === 1 ? 1 : 0;
  preferences.allowIntelligentAdaptations = preferences.allowIntelligentAdaptations !== false;
  preferences.prioritizeFullProfiles = preferences.prioritizeFullProfiles !== false;
  preferences.coachStyle = ['POSSE_DE_BOLA', 'CONTRA_ATAQUE', 'CONTRA_ATAQUE_RAPIDO'].includes(preferences.coachStyle) ? preferences.coachStyle : 'POSSE_DE_BOLA';
  const pins = source.pins && typeof source.pins === 'object'
    ? Object.fromEntries(Object.entries(source.pins).filter(([slotId, playerId]) => slotId && typeof playerId === 'string' && players.some((player) => player.id === playerId)))
    : {};
  return { version: SQUAD_MAPPING_VERSION, players, selectedFormationId: String(source.selectedFormationId || 'AUTO'), preferences, pins, trials, updatedAt: String(source.updatedAt || new Date().toISOString()) };
}

function nativeKey() { return accountStorageKey(SQUAD_MAPPING_STORAGE_KEY); }

export async function loadSquadMappingState(): Promise<MappingState> {
  if (isNativeVaultStorageAvailable()) {
    const raw = await nativeVaultRead(nativeKey()).catch(() => null);
    if (raw) {
      try {
        const state = sanitizeMappingState(JSON.parse(raw));
        void runtimePut('formations', RUNTIME_KEY, state).catch(() => undefined);
        return state;
      } catch { /* use database fallback */ }
    }
  }
  return sanitizeMappingState(await runtimeGet<unknown>('formations', RUNTIME_KEY).catch(() => null));
}

export async function saveSquadMappingState(state: MappingState): Promise<{ target: 'native' | 'database'; bytes: number }> {
  const sanitized = sanitizeMappingState({ ...state, updatedAt: new Date().toISOString() });
  const payload = JSON.stringify(sanitized);
  await runtimePut('formations', RUNTIME_KEY, sanitized);
  if (isNativeVaultStorageAvailable()) {
    const result = await nativeVaultWrite(nativeKey(), payload);
    return { target: 'native', bytes: result.bytes };
  }
  return { target: 'database', bytes: new Blob([payload]).size };
}

export function exportSquadMappingBackup(state: MappingState) {
  return JSON.stringify({ kind: 'buildmaster-squad-mapping-backup', version: SQUAD_MAPPING_VERSION, exportedAt: new Date().toISOString(), includesImages: false, state: sanitizeMappingState(state) }, null, 2);
}

export function exportSquadMappingBackupWithImages(state: MappingState, images: Record<string, { dataUrl: string; bytes: number; storedAt: string }>) {
  return JSON.stringify({ kind: 'buildmaster-squad-mapping-backup', version: SQUAD_MAPPING_VERSION, exportedAt: new Date().toISOString(), includesImages: true, state: sanitizeMappingState(state), images }, null, 2);
}

export function importSquadMappingBackupPayload(raw: string): { state: MappingState; images: Record<string, { dataUrl?: string; bytes?: number; storedAt?: string }> } {
  const parsed = JSON.parse(raw) as { kind?: string; state?: unknown; images?: Record<string, { dataUrl?: string; bytes?: number; storedAt?: string }> } | MappingState;
  if ('kind' in parsed && parsed.kind && parsed.kind !== 'buildmaster-squad-mapping-backup') throw new Error('Este arquivo não é um backup de Mapeamento de Elenco.');
  return { state: sanitizeMappingState('state' in parsed ? parsed.state : parsed), images: 'images' in parsed && parsed.images ? parsed.images : {} };
}

export function importSquadMappingBackup(raw: string): MappingState {
  return importSquadMappingBackupPayload(raw).state;
}
