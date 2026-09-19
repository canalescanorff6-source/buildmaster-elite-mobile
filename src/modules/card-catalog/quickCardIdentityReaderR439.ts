import type { PositionCode } from '@/lib/analyzerDomain';
import type { PremiumZoneReading } from '@/lib/premiumReading';
import { fileDigest } from '@/lib/ocrWorkerManager';
import { recognizeZoneWithHighPrecision } from '@/modules/card-reader/highPrecisionOcr';
import { inspectSinglePrintGeometry } from '@/modules/card-reader/singlePrintPro';
import { readDetailedPrint } from '@/modules/card-reader/detailedPrintReader';
import { validateImageFile } from '@/modules/images/imageSafety';
import { createSmartCardPreview } from '@/modules/card-reader/cardArtCrop';
import { extractCardVisualFingerprintR440 } from './cardVisualIdentityR440';
import { parseQuickIdentityHintsR439, type MasterCardIdentityObservationR439 } from './cardIdentityResolverR439';

export const QUICK_CARD_IDENTITY_READER_R439_VERSION = '40.80-r439-quick-card-identity-reader-v1' as const;

const QUICK_KEYS_R439 = new Set(['name', 'playstyle', 'mainPosition', 'overall', 'identityMeta']);
const POSITIONS: PositionCode[] = ['GK','CB','LB','RB','DMF','CMF','LMF','RMF','AMF','LWF','RWF','SS','CF'];

function positionFromText(value: string | null | undefined): PositionCode | null {
  const raw = String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const aliases: Record<string, PositionCode> = { GK:'GK',GOL:'GK',CB:'CB',ZAG:'CB',LB:'LB',LE:'LB',RB:'RB',LD:'RB',DMF:'DMF',VOL:'DMF',CMF:'CMF',MLG:'CMF',LMF:'LMF',RMF:'RMF',AMF:'AMF',MAT:'AMF',LWF:'LWF',RWF:'RWF',SS:'SS',SA:'SS',CF:'CF',CA:'CF' };
  const result = aliases[raw] ?? null;
  return result && POSITIONS.includes(result) ? result : null;
}

export async function readQuickCardIdentityR439(file: File, options?: { sourceHash?: string; knownPlayerNames?: string[] }) {
  const validated = await validateImageFile(file);
  const safeFile = new File([validated.sanitizedBlob], file.name, { type: validated.mime, lastModified: file.lastModified });
  const sourceHash = options?.sourceHash || await fileDigest(safeFile);
  const geometry = await inspectSinglePrintGeometry(safeFile);
  const smartCardR440 = await createSmartCardPreview(safeFile, geometry.cardArtZone).catch(() => null);
  const visualFingerprint = await extractCardVisualFingerprintR440(safeFile, smartCardR440?.box ?? geometry.cardArtZone).catch(() => null);
  const zones = geometry.zones.filter((zone, index, all) => QUICK_KEYS_R439.has(zone.key) && all.findIndex((candidate) => candidate.key === zone.key) === index);
  const readings: PremiumZoneReading[] = [];
  for (const zone of zones) {
    readings.push(await recognizeZoneWithHighPrecision(safeFile, zone, {
      imageHash: sourceHash,
      template: geometry.template,
      targetWidth: Math.max(1100, Math.min(1600, geometry.width)),
      readingMode: 'fast',
      knownPlayerNames: options?.knownPlayerNames ?? [],
      labelPrefix: `R439 identidade rápida • ${file.name}`
    }));
  }
  const compactText = readings.map((reading) => `${reading.label}: ${reading.text}`).join('\n');
  const detailed = readDetailedPrint(compactText, readings, options?.knownPlayerNames ?? [], [], false);
  const hints = parseQuickIdentityHintsR439(`${compactText}\n${detailed.canonicalText ?? ''}`);
  const observation: MasterCardIdentityObservationR439 = {
    sourceHash,
    playerName: detailed.identity.playerName?.value?.trim() || null,
    mainPosition: positionFromText(detailed.identity.mainPosition?.value),
    releaseDate: hints.releaseDate,
    cardType: hints.cardType,
    cardLabel: [hints.cardType, hints.releaseDate].filter(Boolean).join(' • ') || null,
    playstyle: detailed.identity.playstyle?.value?.trim() || null,
    overall: detailed.identity.overall?.numericValue ?? hints.overall,
    level: detailed.identity.level?.numericValue ?? hints.level,
    country: hints.country,
    visualFingerprint,
    rawText: compactText
  };
  const confidences = [detailed.identity.playerName?.confidence, detailed.identity.mainPosition?.confidence, detailed.identity.playstyle?.confidence, detailed.identity.overall?.confidence].filter((value): value is number => typeof value === 'number');
  const confidence = confidences.length ? Math.round(confidences.reduce((sum, value) => sum + value, 0) / confidences.length) : 0;
  return { sourceHash, observation, confidence, compactText, sanitizedBlob: validated.sanitizedBlob };
}
