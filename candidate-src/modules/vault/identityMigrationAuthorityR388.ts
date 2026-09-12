export const IDENTITY_MIGRATION_AUTHORITY_R388_VERSION = '40.80-r388-identity-migration-authority-v1' as const;

export type LegacyFieldSourceR388 =
  | 'current_authority'
  | 'manual_confirmed'
  | 'original_raw_text'
  | 'catalog_exact_identity'
  | 'derived'
  | 'compatibility_fallback'
  | 'unknown';

export type LegacyFieldR388<T> = {
  value: T | null | undefined;
  source: LegacyFieldSourceR388;
};

export type LegacyIdentityFieldsR388 = {
  playerName?: LegacyFieldR388<string>;
  originalPosition?: LegacyFieldR388<string>;
  playstyle?: LegacyFieldR388<string>;
  trainingBudget?: LegacyFieldR388<number>;
};

export type MigrationAuthorityStampR388 = {
  version?: string | null;
  evaluated?: boolean | null;
};

export type IdentityMigrationInputR388 = {
  rawText?: string | null;
  fields?: LegacyIdentityFieldsR388 | null;
  legacyCardIdentity?: string | null;
  currentCardIdentity?: string | null;
  legacySaveKey?: string | null;
  currentSaveKey?: string | null;
  authorityStamp?: MigrationAuthorityStampR388 | null;
  currentAuthorityVersion: string;
};

export type QuarantinedLegacyFieldR388 = {
  field: keyof LegacyIdentityFieldsR388;
  value: string | number;
  source: LegacyFieldSourceR388;
  reason: 'legacy-structured-value-not-parser-evidence';
};

export type IdentityLineageR388 = {
  canonicalCardIdentity: string | null;
  cardIdentityAliases: string[];
  canonicalSaveKey: string | null;
  saveKeyAliases: string[];
};

export type IdentityMigrationDecisionR388 = {
  parserText: string;
  parserTextSource: 'ORIGINAL_RAW_TEXT' | 'NONE';
  syntheticRecoveryTextAllowed: false;
  requiresReauthorization: boolean;
  stampCurrent: boolean;
  quarantinedFields: QuarantinedLegacyFieldR388[];
  reviewValues: Partial<Record<keyof LegacyIdentityFieldsR388, string | number>>;
  lineage: IdentityLineageR388;
  blockers: string[];
};

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(cleanString).filter(Boolean)));
}

function stampIsCurrent(input: IdentityMigrationInputR388) {
  return input.authorityStamp?.evaluated === true
    && typeof input.authorityStamp.version === 'string'
    && input.authorityStamp.version === input.currentAuthorityVersion;
}

function fieldValue(field: LegacyFieldR388<string | number> | undefined) {
  if (!field) return null;
  if (typeof field.value === 'string') {
    const value = field.value.trim();
    return value ? value : null;
  }
  if (typeof field.value === 'number' && Number.isFinite(field.value)) return field.value;
  return null;
}

function buildQuarantine(fields: LegacyIdentityFieldsR388 | null | undefined, stampCurrent: boolean) {
  const quarantinedFields: QuarantinedLegacyFieldR388[] = [];
  const reviewValues: Partial<Record<keyof LegacyIdentityFieldsR388, string | number>> = {};
  for (const key of ['playerName', 'originalPosition', 'playstyle', 'trainingBudget'] as const) {
    const field = fields?.[key] as LegacyFieldR388<string | number> | undefined;
    const value = fieldValue(field);
    if (value === null || !field) continue;
    reviewValues[key] = value;
    // A current signed authority value is already current state; every other structured
    // value is historical metadata only. It may be shown for review but cannot be
    // serialized back into OCR text or promoted to parser evidence.
    if (!(stampCurrent && field.source === 'current_authority')) {
      quarantinedFields.push({
        field: key,
        value,
        source: field.source,
        reason: 'legacy-structured-value-not-parser-evidence'
      });
    }
  }
  return { quarantinedFields, reviewValues };
}

function buildLineage(input: IdentityMigrationInputR388, stampCurrent: boolean): IdentityLineageR388 {
  const currentCardIdentity = cleanString(input.currentCardIdentity) || null;
  const legacyCardIdentity = cleanString(input.legacyCardIdentity) || null;
  const currentSaveKey = cleanString(input.currentSaveKey) || null;
  const legacySaveKey = cleanString(input.legacySaveKey) || null;

  return {
    // A legacy fingerprint is retained as an alias only. It cannot become canonical
    // merely because it exists; canonical identity requires the current authority stamp.
    canonicalCardIdentity: stampCurrent ? currentCardIdentity : null,
    cardIdentityAliases: uniqueStrings([legacyCardIdentity, currentCardIdentity]),
    canonicalSaveKey: stampCurrent ? currentSaveKey : null,
    saveKeyAliases: uniqueStrings([legacySaveKey, currentSaveKey])
  };
}

/**
 * R388 invariant: migration must never manufacture OCR evidence.
 *
 * - If original raw OCR text exists, pass it through byte-for-byte.
 * - If it does not exist, parserText is empty.
 * - Historical structured values remain review metadata only.
 * - Legacy identity/save keys remain aliases so dedupe can survive reauthorization.
 */
export function evaluateIdentityMigrationR388(input: IdentityMigrationInputR388): IdentityMigrationDecisionR388 {
  const stampCurrent = stampIsCurrent(input);
  const rawText = typeof input.rawText === 'string' ? input.rawText : '';
  const hasOriginalRawText = rawText.trim().length > 0;
  const { quarantinedFields, reviewValues } = buildQuarantine(input.fields, stampCurrent);
  const lineage = buildLineage(input, stampCurrent);
  const blockers: string[] = [];

  if (!stampCurrent) blockers.push('authority-stamp-stale-or-missing');
  if (!lineage.canonicalCardIdentity) blockers.push('canonical-card-identity-missing');
  if (!hasOriginalRawText && quarantinedFields.length) blockers.push('legacy-fields-have-no-original-ocr-evidence');
  if (!hasOriginalRawText) blockers.push('original-raw-text-missing');

  const requiresReauthorization = !stampCurrent
    || !lineage.canonicalCardIdentity
    || quarantinedFields.length > 0;

  return {
    parserText: hasOriginalRawText ? rawText : '',
    parserTextSource: hasOriginalRawText ? 'ORIGINAL_RAW_TEXT' : 'NONE',
    syntheticRecoveryTextAllowed: false,
    requiresReauthorization,
    stampCurrent,
    quarantinedFields,
    reviewValues,
    lineage,
    blockers: Array.from(new Set(blockers))
  };
}

export function sameIntrinsicCardLineageR388(left: IdentityLineageR388, right: IdentityLineageR388) {
  const leftIds = new Set(left.cardIdentityAliases);
  return right.cardIdentityAliases.some((id) => leftIds.has(id));
}

export function sameSavedUsageLineageR388(left: IdentityLineageR388, right: IdentityLineageR388) {
  const leftKeys = new Set(left.saveKeyAliases);
  return right.saveKeyAliases.some((key) => leftKeys.has(key));
}

/**
 * After successful current-authority reauthorization, keep legacy aliases while
 * installing the new canonical keys. This prevents duplicate creation during migration.
 */
export function promoteIdentityLineageR388(
  previous: IdentityLineageR388,
  currentCardIdentity: string,
  currentSaveKey: string
): IdentityLineageR388 {
  const card = cleanString(currentCardIdentity);
  const save = cleanString(currentSaveKey);
  if (!card || !save) throw new Error('R388 promotion requires current canonical identity and save key');
  return {
    canonicalCardIdentity: card,
    cardIdentityAliases: uniqueStrings([...previous.cardIdentityAliases, card]),
    canonicalSaveKey: save,
    saveKeyAliases: uniqueStrings([...previous.saveKeyAliases, save])
  };
}
