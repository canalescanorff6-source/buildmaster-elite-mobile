import { extractCanonicalSkillsFromText } from './officialSkillIdentity';
import {
  RECOGNIZABLE_IMPETO_NAMES,
  type RecognizableImpetoName,
} from './officialImpetoCatalog';

export type ReaderCanonicalImpetoNameR549 = RecognizableImpetoName | 'Sem Ímpeto';

type ReaderFieldLikeR549 = {
  key: string;
  value: string;
  error?: string;
};

export type ReaderCanonicalEvidenceR549 = {
  skillValues?: string[];
  impetoName?: ReaderCanonicalImpetoNameR549;
  uncertainKeys: Array<'skills' | 'impeto'>;
};

function normalizeReaderIdentityR549(value: string | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsPhraseR549(text: string, phrase: string) {
  if (!text || !phrase) return false;
  return (` ${text} `).includes(` ${phrase} `);
}

export function extractReaderImpetoNameR549(value: string | null | undefined): ReaderCanonicalImpetoNameR549 | null {
  const normalized = normalizeReaderIdentityR549(value);
  if (!normalized) return null;
  if (/\bsem\s+(?:impeto|booster|reforco)\b/.test(normalized)) return 'Sem Ímpeto';

  const matches = RECOGNIZABLE_IMPETO_NAMES.filter((name) =>
    containsPhraseR549(normalized, normalizeReaderIdentityR549(name))
  );
  return matches.length === 1 ? matches[0] : null;
}

export function deriveReaderCanonicalEvidenceR549(fields: ReaderFieldLikeR549[]): ReaderCanonicalEvidenceR549 {
  const uncertainKeys: Array<'skills' | 'impeto'> = [];

  const skillsField = fields.find((field) => field.key === 'skills');
  const parsedSkills = skillsField && !skillsField.error
    ? extractCanonicalSkillsFromText(skillsField.value)
    : [];
  const skillValues = parsedSkills.length ? parsedSkills : undefined;
  if (skillsField && !skillValues) uncertainKeys.push('skills');

  const impetoField = fields.find((field) => field.key === 'impeto');
  const parsedImpeto = impetoField && !impetoField.error
    ? extractReaderImpetoNameR549(impetoField.value)
    : null;
  const impetoName = parsedImpeto ?? undefined;
  if (impetoField && !impetoName) uncertainKeys.push('impeto');

  return { skillValues, impetoName, uncertainKeys };
}
