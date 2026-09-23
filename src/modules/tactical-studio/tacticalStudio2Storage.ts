// R418_UNBOUNDED_PERSISTENT_COLLECTIONS: conteúdo do usuário não é descartado por teto artificial de quantidade.
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import type { TacticalSequenceProject } from './tacticalStudio2Engine';

export const TACTICAL_SEQUENCE_STORAGE_KEY = 'buildmaster_tactical_sequence_projects_v2950';
// R418: MAX_TACTICAL_SEQUENCE_PROJECTS permanece exportado só por compatibilidade histórica; não poda projetos.
export const MAX_TACTICAL_SEQUENCE_PROJECTS = 40;

function isProject(value: unknown): value is TacticalSequenceProject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const project = value as Partial<TacticalSequenceProject>;
  if (typeof project.id !== 'string' || !project.id.trim()) return false;
  if (typeof project.name !== 'string' || !project.name.trim()) return false;
  if (typeof project.formationId !== 'string' || !project.formationId.trim()) return false;
  if (typeof project.style !== 'string' || !project.style.trim()) return false;
  if (!Array.isArray(project.frames) || project.frames.length < 2 || project.frames.length > 12) return false;
  return project.frames.every((frame) => {
    if (!frame || typeof frame !== 'object' || Array.isArray(frame)) return false;
    if (typeof frame.id !== 'string' || !frame.id.trim()) return false;
    if (typeof frame.title !== 'string' || typeof frame.objective !== 'string') return false;
    if (!Number.isFinite(Number(frame.durationMs)) || Number(frame.durationMs) < 600 || Number(frame.durationMs) > 10000) return false;
    if (!Array.isArray(frame.players) || !Array.isArray(frame.actions)) return false;
    const playersValid = frame.players.every((player) => Boolean(player && typeof player.slotId === 'string' && typeof player.label === 'string' && Number.isFinite(Number(player.x)) && Number.isFinite(Number(player.y))));
    const actionsValid = frame.actions.every((action) => Boolean(action && typeof action.id === 'string' && typeof action.fromSlotId === 'string' && typeof action.toSlotId === 'string' && typeof action.kind === 'string' && typeof action.label === 'string'));
    return playersValid && actionsValid;
  });
}

export function readTacticalSequenceProjects(): TacticalSequenceProject[] {
  const raw = readAccountStorage(TACTICAL_SEQUENCE_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isProject) : [];
  } catch {
    return [];
  }
}

export function replaceTacticalSequenceProjects(value: unknown): TacticalSequenceProject[] {
  const normalized = Array.isArray(value) ? value.filter(isProject) : [];
  writeAccountStorage(TACTICAL_SEQUENCE_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function saveTacticalSequenceProjects(projects: TacticalSequenceProject[]): TacticalSequenceProject[] {
  return replaceTacticalSequenceProjects(projects);
}
