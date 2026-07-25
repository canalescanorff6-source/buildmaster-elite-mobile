import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import type { TacticalSequenceProject } from './tacticalStudio2Engine';

export const TACTICAL_SEQUENCE_STORAGE_KEY = 'buildmaster_tactical_sequence_projects_v2950';
const MAX_PROJECTS = 20;

function isProject(value: unknown): value is TacticalSequenceProject {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as TacticalSequenceProject).frames));
}

export function readTacticalSequenceProjects(): TacticalSequenceProject[] {
  const raw = readAccountStorage(TACTICAL_SEQUENCE_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isProject).slice(0, MAX_PROJECTS) : [];
  } catch {
    return [];
  }
}

export function replaceTacticalSequenceProjects(value: unknown): TacticalSequenceProject[] {
  const normalized = Array.isArray(value) ? value.filter(isProject).slice(0, MAX_PROJECTS) : [];
  writeAccountStorage(TACTICAL_SEQUENCE_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function saveTacticalSequenceProjects(projects: TacticalSequenceProject[]): TacticalSequenceProject[] {
  return replaceTacticalSequenceProjects(projects);
}
