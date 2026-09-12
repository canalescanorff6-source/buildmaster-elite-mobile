import {
  cardEvidenceFingerprintR126,
  cardIdentityFingerprintR126,
  playerIdentityFingerprintR126
} from '@/lib/cardIdentityFingerprintR126';
import type { AnalysisResult } from '@/lib/analyzerDomain';

export type { SaveSurfaceResultR396 } from './nativeCrossProcessSaveSurfaceR396';

export const VAULT_IDENTITY_SEAL_R134_VERSION = '40.80-r134-vault-identity-seal-v1' as const;
export const VAULT_EVIDENCE_FINGERPRINT_R134_VERSION = '40.80-r134-vault-evidence-v1' as const;

export type VaultIdentitySealR134 = {
  cardIdentity: string;
  playerIdentity: string;
  evidenceFingerprint: string;
  identitySealVersion: typeof VAULT_IDENTITY_SEAL_R134_VERSION;
};

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function fnv1a(value: string) {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(36);
}

function permanentEvidenceFingerprintR134(result: AnalysisResult) {
  const parsed = result.parsed;
  const physical = Object.entries(parsed.physicalProfile ?? {})
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right, 'en'))
    .map(([key, value]) => `${key}:${normalize(value)}`)
    .join(',');
  const condition = Object.entries(parsed.condition ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right, 'en'))
    .map(([key, value]) => `${key}:${normalize(value)}`)
    .join(',');
  const source = [
    VAULT_EVIDENCE_FINGERPRINT_R134_VERSION,
    cardEvidenceFingerprintR126(parsed),
    normalize(parsed.dominantFoot),
    physical,
    condition,
    parsed.evidence?.impetoSlotStatus ?? '',
    normalize(parsed.evidence?.impetoSlotEvidence)
  ].join('|');
  return `evidence-r134-${fnv1a(source)}`;
}

export function buildVaultIdentitySealR134(result: AnalysisResult): VaultIdentitySealR134 {
  return {
    cardIdentity: cardIdentityFingerprintR126(result.parsed),
    playerIdentity: playerIdentityFingerprintR126(result.parsed),
    evidenceFingerprint: permanentEvidenceFingerprintR134(result),
    identitySealVersion: VAULT_IDENTITY_SEAL_R134_VERSION
  };
}

type IdentityCarrierR134 = {
  result: AnalysisResult;
  cardIdentity?: string;
  playerIdentity?: string;
  evidenceFingerprint?: string;
  identitySealVersion?: string;
};

export function sealSavedAnalysisIdentityR134<T extends IdentityCarrierR134>(item: T): T & VaultIdentitySealR134 {
  return { ...item, ...buildVaultIdentitySealR134(item.result) };
}

export function savedIdentitySealCurrentR134(item: IdentityCarrierR134) {
  const expected = buildVaultIdentitySealR134(item.result);
  return item.identitySealVersion === expected.identitySealVersion
    && item.cardIdentity === expected.cardIdentity
    && item.playerIdentity === expected.playerIdentity
    && item.evidenceFingerprint === expected.evidenceFingerprint;
}
