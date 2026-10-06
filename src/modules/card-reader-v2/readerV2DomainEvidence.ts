import { extractCanonicalSkillsFromText } from '../../lib/officialSkillIdentity';
import {
  RECOGNIZABLE_IMPETO_NAMES,
  type RecognizableImpetoName,
} from '../../lib/officialImpetoCatalog';

export type ReaderV2ImpetoName = RecognizableImpetoName | 'Sem Ímpeto';

function normalizeReaderIdentity(value: string | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsPhrase(text: string, phrase: string) {
  if (!text || !phrase) return false;
  return (` ${text} `).includes(` ${phrase} `);
}

export function extractReaderV2SkillNames(value: string | null | undefined) {
  const skills = extractCanonicalSkillsFromText(value);
  return skills.length ? skills : [];
}

export function extractReaderV2ImpetoName(value: string | null | undefined): ReaderV2ImpetoName | null {
  const normalized = normalizeReaderIdentity(value);
  if (!normalized) return null;

  if (/\bsem\s+(?:impeto|booster|reforco)\b/.test(normalized)) return 'Sem Ímpeto';

  const matches = RECOGNIZABLE_IMPETO_NAMES.filter((name) =>
    containsPhrase(normalized, normalizeReaderIdentity(name))
  );

  // Mais de um nome plausível no mesmo crop é ambíguo: exige conferência.
  return matches.length === 1 ? matches[0] : null;
}
