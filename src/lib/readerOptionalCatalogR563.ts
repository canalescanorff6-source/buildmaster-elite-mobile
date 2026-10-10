import { RECOGNIZABLE_IMPETO_NAMES } from './officialImpetoCatalog';

/**
 * R563: canonical booster name matching isolated from Reader V2.
 * These are evidence candidates only, never owned/confirmed boosters.
 */
export function recognizeReaderOptionalBoostersR563(normalizedText: string): string[] {
  const normalize = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const padded = ` ${normalize(normalizedText)} `;
  return RECOGNIZABLE_IMPETO_NAMES.filter(
    (name) => padded.includes(` ${normalize(name)} `),
  );
}
