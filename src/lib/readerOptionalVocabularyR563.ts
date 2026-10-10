/**
 * OCR-only vocabulary adapter. The Reader V2 must not import game-domain
 * catalogues directly (R542 architecture boundary).
 * Values are read-only labels used to identify candidates for manual review.
 */
import { RECOGNIZABLE_IMPETO_NAMES } from './officialImpetoCatalog';

export const READER_V2_BOOSTER_NAMES_R563 = RECOGNIZABLE_IMPETO_NAMES;
