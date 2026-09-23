// R418_UNBOUNDED_PERSISTENT_COLLECTIONS: conteúdo do usuário não é descartado por teto artificial de quantidade.
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import type { TacticalSequenceProject } from './tacticalStudio2Engine';

export const TACTICAL_SEQUENCE_STORAGE_KEY = 'buildmaster_tactical_sequence_projects_v2950';
// R418: MAX_TACTICAL_SEQUENCE_PROJECTS permanece exportado só por compatibilidade histórica; não poda projetos.
export const MAX_TACTICAL_SEQUENCE_PROJECTS = 40;

function isProject(value: unknown): value is TacticalSequenceProject {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as TacticalSequenceProject).frames));
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
