import { extractCanonicalSkillsFromText, normalizeSkillIdentity } from '../../lib/officialSkillIdentity';
import { READER_V2_BOOSTER_NAMES_R563 } from '../../lib/readerOptionalVocabularyR563';
import type { ReaderV2FieldEvidence } from './readerV2Types';

/** R563: OCR candidates are not proof of possession. Never persist them as confirmed slots. */
export type ReaderV2OptionalCaptureR563 = {
  additionalSkills: { candidates: string[]; status: 'PENDENTE' | 'REVISAR'; reason: string };
  boosters: { candidates: string[]; status: 'PENDENTE' | 'REVISAR'; reason: string };
};

export function normalizeReaderV2OptionalTextR563(text: string): string {
  return String(text ?? '').normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n').replace(/[^\S\n]+/g, ' ').trim();
}

/** Reject 8?, 9O, 6|, percentages, overflows and partial badges; do not "fix" glyphs into digits. */
export function safeReaderV2NumericTokensR563(text: string): number[] {
  return normalizeReaderV2OptionalTextR563(text).split(/[\s,;]+/)
    .filter(token => /^\d{1,3}$/.test(token))
    .map(Number).filter(value => Number.isInteger(value) && value >= 1 && value <= 110);
}

const ADDITIONAL_HEADING = /^\s*(?:habilidades?\s+adicionais?|habilidades?\s+extras?|additional\s+skills?|extra\s+skills?)\s*[:\-–]?\s*(.*)$/i;
const OTHER_HEADING = /^\s*(?:habilidades?\s+(?:j[aá]\s+possui|nativas?|especiais?)|(?:booster|boosters|[íi]mpetos?))\s*[:\-–]?\s*$/i;

/** Only a dedicated, explicit section separates additional skills from native skills. */
export function splitReaderV2SkillsR563(text: string): { native: string; additional: string; explicitlyLabeled: boolean } {
  const lines = normalizeReaderV2OptionalTextR563(text).split('\n');
  const native: string[] = [];
  const additional: string[] = [];
  let inAdditional = false;
  let explicitlyLabeled = false;
  for (const line of lines) {
    const heading = line.match(ADDITIONAL_HEADING);
    if (heading) { inAdditional = true; explicitlyLabeled = true; if (heading[1]?.trim()) additional.push(heading[1].trim()); continue; }
    if (OTHER_HEADING.test(line)) { inAdditional = false; continue; }
    (inAdditional ? additional : native).push(line);
  }
  return { native: native.join('\n'), additional: additional.join('\n'), explicitlyLabeled };
}

export function strictlyNamedReaderV2AdditionalSkillsR563(text: string): string[] | null {
  const lines = text.split('\n').map(line => line.replace(/^\s*(?:[1-5][.)-]|[-•*])\s*/, '').trim()).filter(Boolean);
  if (!lines.length || lines.length > 5) return null;
  const names: string[] = [];
  for (const line of lines) {
    // Multiple aliases/skills glued together must be rechecked manually.
    const matches = extractCanonicalSkillsFromText(line);
    if (matches.length !== 1 || normalizeSkillIdentity(line) !== normalizeSkillIdentity(matches[0])) return null;
    if (names.includes(matches[0])) return null;
    names.push(matches[0]);
  }
  return names;
}

export function inspectReaderV2OptionalFieldsR563(fields: ReaderV2FieldEvidence[]): ReaderV2OptionalCaptureR563 {
  const skillFields = fields.filter(field => field.key === 'skills' || field.key === 'additionalSkills');
  const additionalSections = skillFields.map(field => {
    const section = splitReaderV2SkillsR563(field.value);
    return {field, section: field.key === 'additionalSkills' && !section.explicitlyLabeled
      ? {native:'',additional:field.value,explicitlyLabeled:true} : section};
  })
    .filter(({ section }) => section.explicitlyLabeled);
  let additionalSkills: ReaderV2OptionalCaptureR563['additionalSkills'] = {
    candidates: [], status:'PENDENTE', reason: 'Habilidades adicionais sem seção legível e delimitada. Confirmar manualmente.'
  };
  if (additionalSections.length) {
    const names = additionalSections.flatMap(({field,section}) =>
      !field.error && field.confidence >= 65 ? (strictlyNamedReaderV2AdditionalSkillsR563(section.additional) ?? []) : []);
    const valid = additionalSections.every(({field,section}) => !field.error && field.confidence >= 65 && strictlyNamedReaderV2AdditionalSkillsR563(section.additional)?.length)
      && names.length <= 5 && new Set(names).size === names.length;
    additionalSkills = valid
      ? {candidates:names,status:'REVISAR',reason:'Candidatas obtidas de seção explícita; exigem confirmação humana antes de salvar.'}
      : {candidates:[],status:'PENDENTE',reason:'Seção de habilidades adicionais incompleta, ambígua ou de baixa confiança.'};
  }

  const booster = fields.find(field => field.key === 'impeto');
  const simplified = (value:string) => normalizeReaderV2OptionalTextR563(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const boosterText = ` ${simplified(booster?.value ?? '')} `;
  const names = booster && !booster.error && booster.confidence >= 65
    ? READER_V2_BOOSTER_NAMES_R563.filter(name => boosterText.includes(` ${simplified(name)} `))
       .sort((left,right) => boosterText.indexOf(` ${simplified(left)} `) - boosterText.indexOf(` ${simplified(right)} `)) : [];
  const validBoosters = booster && !booster.error && booster.confidence >= 65 && names.length >= 1 && names.length <= 2;
  const boosters: ReaderV2OptionalCaptureR563['boosters'] = validBoosters
    ? {candidates:names,status:'REVISAR',reason:'Ímpetos reconhecidos no recorte; confirmar slots e valores manualmente.'}
    : {candidates:[],status:'PENDENTE',reason:'Ímpetos não comprovados neste print. Não preencher slots automaticamente.'};
  return { additionalSkills, boosters };
}
