import { ATTRIBUTE_INPUTS, type AnalysisResult, type AttributeKey } from '@/lib/analyzerDomain';
import type { PremiumZoneReading } from '@/lib/premiumReading';
import type { DetailedPrintReading, DetailedValue } from './detailedPrintReader';
import type { SinglePrintSession } from './singlePrintPro';
import { mergeOcrTexts } from './imageProcessing';
import { buildReviewHydrationR131 } from './cardReviewWorkflowR131';

export const CARD_OCR_EVIDENCE_BOUNDARY_R132_VERSION = 'r132-ocr-evidence-boundary-1';

function normalize(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const attributeKeyByLabel = new Map<string, AttributeKey>(
  ATTRIBUTE_INPUTS.flatMap((item) => {
    const aliases = item.key === 'heading' ? [item.label, 'Cabeceio'] : [item.label];
    return aliases.map((label) => [normalize(label), item.key] as const);
  })
);

export type AttributeEvidenceR132 = {
  key: AttributeKey;
  label: string;
  value: string;
  numericValue: number | null;
  confidence: number;
  status: DetailedValue['status'];
  source: string;
};

export function attributeEvidenceR132(reading: DetailedPrintReading | null | undefined): AttributeEvidenceR132[] {
  if (!reading) return [];
  const result: AttributeEvidenceR132[] = [];
  for (const item of reading.attributes) {
    const key = attributeKeyByLabel.get(normalize(item.label));
    if (!key) continue;
    result.push({
      key,
      label: ATTRIBUTE_INPUTS.find((candidate) => candidate.key === key)?.label ?? item.label,
      value: String(item.numericValue ?? item.value),
      numericValue: Number.isFinite(item.numericValue) ? Number(item.numericValue) : Number.isFinite(Number(item.value)) ? Number(item.value) : null,
      confidence: item.confidence,
      status: item.status,
      source: item.source
    });
  }
  return result;
}

export function trustedAttributeInputsR132(reading: DetailedPrintReading | null | undefined): Partial<Record<AttributeKey, string>> {
  const trusted: Partial<Record<AttributeKey, string>> = {};
  for (const item of attributeEvidenceR132(reading)) {
    if (item.status !== 'confirmed') continue;
    trusted[item.key] = item.value;
  }
  return trusted;
}

export function reviewAttributeEvidenceR132(reading: DetailedPrintReading | null | undefined) {
  return attributeEvidenceR132(reading).filter((item) => item.status === 'review');
}

function sanitizeCanonicalAttributes(text: string, reading: DetailedPrintReading) {
  const trusted = new Map(
    attributeEvidenceR132(reading)
      .filter((item) => item.status === 'confirmed')
      .map((item) => [item.key, item.value] as const)
  );
  const confirmedSkills = reading.skills.filter((item) => item.status === 'confirmed').map((item) => item.value);

  const lines = String(text || '').split(/\r?\n/);
  const output: string[] = [];
  let skipVisibleSkillPayload = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^HABILIDADES?\s+ESPECIAIS?\s+PROVIS[OÓ]RIAS?\s*:/i.test(line)) continue;
    if (/^HABILIDADES?\s+(?:J[AÁ]\s+POSSUI|VIS[IÍ]VEIS)\s*:/i.test(line)) {
      skipVisibleSkillPayload = /^HABILIDADES?\s+VIS[IÍ]VEIS\s*:\s*$/i.test(line);
      continue;
    }
    if (/^HABILIDADE\s+ESPECIAL\s*:/i.test(line)) continue;
    if (skipVisibleSkillPayload) {
      if (/^[A-ZÀ-Ÿ\[]/i.test(line) && /:/.test(line)) skipVisibleSkillPayload = false;
      else continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const rawLabel = line.slice(0, colonIndex);
      const key = attributeKeyByLabel.get(normalize(rawLabel));
      if (key) {
        const trustedValue = trusted.get(key);
        if (!trustedValue) continue;
        const rawValue = line.slice(colonIndex + 1).match(/-?\d{1,3}/)?.[0] ?? '';
        if (rawValue && Number(rawValue) !== Number(trustedValue)) continue;
        output.push(`${ATTRIBUTE_INPUTS.find((item) => item.key === key)?.label ?? rawLabel}: ${trustedValue}`);
        continue;
      }
    }

    output.push(line);
  }

  if (confirmedSkills.length) output.push(`HABILIDADES JÁ POSSUI: ${confirmedSkills.join(', ')}`);
  return output.join('\n');
}

/**
 * Monta o texto que efetivamente pode entrar no motor. Zonas em review continuam
 * disponíveis na UI, mas não voltam para a análise pelo merge bruto do OCR.
 */
export function buildProductionOcrEvidenceTextR132(
  canonicalText: string,
  reading: DetailedPrintReading,
  zoneResults: PremiumZoneReading[]
) {
  const sanitizedCanonical = sanitizeCanonicalAttributes(canonicalText, reading);
  // Dados de gameplay estruturados não voltam pelo texto bruto da zona.
  // Eles já passaram pelo filtro individual acima; aqui só entram campos
  // escalares confirmados que não possuem granularidade interna.
  const rawMergeAllowed = new Set(['name', 'mainPosition', 'playstyle', 'overall', 'level', 'points', 'cardType']);
  const confirmedZoneText = zoneResults
    .filter((item) => item.status === 'confirmed' && item.text.trim() && rawMergeAllowed.has(String(item.key)))
    .map((item) => `### ${item.label}\n${item.text}`);
  return mergeOcrTexts(sanitizedCanonical, ...confirmedZoneText);
}

/**
 * Em sessão OCR, só atributos individualmente confirmados são hidratados como
 * valores ativos. Os itens em review ficam como candidatos visíveis.
 */
export function buildReviewHydrationR132(nextResult: AnalysisResult, session?: SinglePrintSession | null) {
  const hydration = buildReviewHydrationR131(nextResult, session);
  if (!session) return hydration;
  return {
    ...hydration,
    manualFields: {
      ...hydration.manualFields,
      attributes: trustedAttributeInputsR132(session.detailedReading)
    }
  };
}
