import type { PremiumZoneReading } from '@/lib/premiumReading';
import { textSimilarity } from './highPrecisionOcr';
import { extractCanonicalSkillsFromText, skillIdentityKey } from '@/lib/officialSkillIdentity';

export const FORENSIC_CONSENSUS_VERSION = '31.82-official-skill-consensus-1';

export type ForensicConsensusAudit = {
  version: string;
  attributeRows: number;
  skillRows: number;
  rejectedNoiseRows: number;
  mergedFields: Array<'attributes' | 'skills'>;
};

const ATTRIBUTE_ALIASES: Array<{ label: string; aliases: string[] }> = [
  { label: 'Talento ofensivo', aliases: ['talento ofensivo', 'consciencia ofensiva', 'consciência ofensiva'] },
  { label: 'Controle de bola', aliases: ['controle de bola'] },
  { label: 'Drible', aliases: ['drible'] },
  { label: 'Condução firme', aliases: ['conducao firme', 'condução firme', 'posse de bola apertada', 'dominio apertado', 'domínio apertado'] },
  { label: 'Passe rasteiro', aliases: ['passe rasteiro'] },
  { label: 'Passe alto', aliases: ['passe alto'] },
  { label: 'Finalização', aliases: ['finalizacao', 'finalização'] },
  { label: 'Cabeceio', aliases: ['cabeceio', 'cabeçada', 'cabecada'] },
  { label: 'Bola parada', aliases: ['bola parada', 'cobranca de falta', 'cobrança de falta'] },
  { label: 'Curva', aliases: ['curva', 'efeito'] },
  { label: 'Talento defensivo', aliases: ['talento defensivo', 'consciencia defensiva', 'consciência defensiva'] },
  { label: 'Desarme', aliases: ['desarme'] },
  { label: 'Agressividade', aliases: ['agressividade'] },
  { label: 'Dedicação defensiva', aliases: ['dedicacao defensiva', 'dedicação defensiva', 'engajamento defensivo'] },
  { label: 'Consciência do goleiro', aliases: ['consciencia do goleiro', 'consciência do goleiro'] },
  { label: 'Agarrar', aliases: ['agarrar'] },
  { label: 'Espalmar', aliases: ['espalmar'] },
  { label: 'Reflexos do goleiro', aliases: ['reflexos do goleiro', 'reflexo do goleiro'] },
  { label: 'Alcance do goleiro', aliases: ['alcance do goleiro'] },
  { label: 'Velocidade', aliases: ['velocidade'] },
  { label: 'Aceleração', aliases: ['aceleracao', 'aceleração'] },
  { label: 'Força do chute', aliases: ['forca do chute', 'força do chute', 'potencia do chute', 'potência do chute'] },
  { label: 'Impulsão', aliases: ['impulsao', 'impulsão'] },
  { label: 'Contato físico', aliases: ['contato fisico', 'contato físico'] },
  { label: 'Equilíbrio', aliases: ['equilibrio', 'equilíbrio'] },
  { label: 'Resistência', aliases: ['resistencia', 'resistência'] }
];



function normalize(value: string) {
  return value
    .normalize('NFKC')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[|¦]/g, 'i')
    .replace(/[^a-z0-9+.' -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanLine(value: string) {
  return value
    .replace(/^[•●▪◦✓✔★☆→>\-–—|\s]+/, '')
    .replace(/[|¦]/g, 'I')
    .replace(/\s+/g, ' ')
    .trim();
}

function candidateTexts(reading: PremiumZoneReading) {
  const items: Array<{ text: string; confidence: number; source: string }> = [];
  if (reading.text.trim()) items.push({ text: reading.text, confidence: reading.confidence, source: 'selected' });
  for (const [index, item] of (reading.alternatives ?? []).entries()) {
    if (item.text.trim()) items.push({ text: item.text, confidence: item.confidence, source: `alternative-${index}` });
  }
  for (const [index, item] of (reading.rawPasses ?? []).entries()) {
    if (item.text.trim()) items.push({ text: item.text, confidence: item.confidence, source: `raw-${index}` });
  }
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${normalize(item.text)}:${item.source.startsWith('raw') ? item.source : 'derived'}`;
    if (!normalize(item.text) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function attributeLabel(raw: string) {
  const value = normalize(raw);
  let best: { label: string; similarity: number } | null = null;
  for (const item of ATTRIBUTE_ALIASES) {
    for (const alias of item.aliases) {
      const aliasNorm = normalize(alias);
      const similarity = value.includes(aliasNorm) || aliasNorm.includes(value)
        ? Math.min(1, 0.86 + Math.min(value.length, aliasNorm.length) / Math.max(value.length, aliasNorm.length) * 0.14)
        : textSimilarity(value, aliasNorm);
      if (!best || similarity > best.similarity) best = { label: item.label, similarity };
    }
  }
  return best && best.similarity >= 0.73 ? best : null;
}

function parseAttributeRows(text: string) {
  const rows: Array<{ label: string; value: number }> = [];
  const lines = text.split(/\r?\n|[|•]/).map(cleanLine).filter(Boolean);
  for (const line of lines) {
    const numericMatches = Array.from(line.matchAll(/\b([4-9]\d|1[01]\d|120)\b/g));
    if (!numericMatches.length) continue;
    const numeric = Number(numericMatches[numericMatches.length - 1][1]);
    if (numeric < 40 || numeric > 120) continue;
    const labelText = line.slice(0, numericMatches[numericMatches.length - 1].index).trim();
    const matched = attributeLabel(labelText);
    if (!matched) continue;
    rows.push({ label: matched.label, value: numeric });
  }
  return rows;
}

function mergeAttributes(reading: PremiumZoneReading) {
  const candidates = candidateTexts(reading);
  const votes = new Map<string, Map<number, { count: number; confidence: number }>>();
  for (const candidate of candidates) {
    const unique = new Map(parseAttributeRows(candidate.text).map((row) => [row.label, row.value]));
    for (const [label, value] of unique) {
      const values = votes.get(label) ?? new Map<number, { count: number; confidence: number }>();
      const current = values.get(value) ?? { count: 0, confidence: 0 };
      values.set(value, { count: current.count + 1, confidence: current.confidence + candidate.confidence });
      votes.set(label, values);
    }
  }
  const order = new Map(ATTRIBUTE_ALIASES.map((item, index) => [item.label, index]));
  const rows = Array.from(votes.entries()).map(([label, values]) => {
    const ranked = Array.from(values.entries()).sort((left, right) => {
      const leftScore = left[1].count * 100 + left[1].confidence;
      const rightScore = right[1].count * 100 + right[1].confidence;
      return rightScore - leftScore;
    });
    const [value, evidence] = ranked[0];
    return { label, value, support: evidence.count, confidence: evidence.confidence / evidence.count };
  }).filter((row) => row.support >= 2 || row.confidence >= 88)
    .sort((left, right) => (order.get(left.label) ?? 999) - (order.get(right.label) ?? 999));
  if (rows.length < 4) return { reading, rowCount: rows.length, rejected: 0, merged: false };
  const averageSupport = rows.reduce((sum, row) => sum + row.support, 0) / rows.length;
  const confidence = Math.min(98, Math.round(reading.confidence * 0.62 + Math.min(100, rows.length * 4.1) * 0.22 + Math.min(100, averageSupport * 35) * 0.16));
  return {
    reading: {
      ...reading,
      text: rows.map((row) => `${row.label}: ${row.value}`).join('\n'),
      confidence,
      status: rows.length >= 10 && averageSupport >= 1.7 ? 'confirmed' as const : reading.status,
      consistency: Math.max(reading.consistency ?? 0, Math.min(100, Math.round(averageSupport * 42))),
      precisionVersion: FORENSIC_CONSENSUS_VERSION,
      validationNotes: [...(reading.validationNotes ?? []), `${rows.length} atributo(s) reconstruído(s) por votação de linha e validação de faixa.`]
    },
    rowCount: rows.length,
    rejected: Math.max(0, candidates.reduce((sum, candidate) => sum + candidate.text.split(/\r?\n/).filter(Boolean).length, 0) - rows.length),
    merged: true
  };
}

function mergeSkills(reading: PremiumZoneReading) {
  const candidates = candidateTexts(reading);
  const votes = new Map<string, { canonical: string; count: number; confidence: number; selected: boolean }>();
  let extractedMentions = 0;
  let rawLineCount = 0;

  for (const candidate of candidates) {
    rawLineCount += candidate.text.split(/\r?\n|[•|;,]/).map(cleanLine).filter(Boolean).length;
    const canonicalSkills = extractCanonicalSkillsFromText(candidate.text);
    const unique = new Map(canonicalSkills.map((skill) => [skillIdentityKey(skill), skill]));
    extractedMentions += unique.size;
    for (const [key, canonical] of unique) {
      const current = votes.get(key) ?? { canonical, count: 0, confidence: 0, selected: false };
      votes.set(key, {
        canonical,
        count: current.count + 1,
        confidence: current.confidence + candidate.confidence,
        selected: current.selected || candidate.source === 'selected'
      });
    }
  }

  const rows = Array.from(votes.values()).map((item) => ({
    ...item,
    averageConfidence: item.confidence / item.count
  })).filter((item) => item.count >= 2 || (item.selected && item.averageConfidence >= 72))
    .sort((left, right) => right.count - left.count || right.averageConfidence - left.averageConfidence || left.canonical.localeCompare(right.canonical, 'pt-BR'));

  if (!rows.length) {
    return {
      reading: {
        ...reading,
        text: '',
        status: 'unread' as const,
        precisionVersion: FORENSIC_CONSENSUS_VERSION,
        validationNotes: [...(reading.validationNotes ?? []), 'Nenhuma habilidade oficial foi confirmada; fragmentos brutos do OCR foram descartados.']
      },
      rowCount: 0,
      rejected: Math.max(rawLineCount, extractedMentions),
      merged: true
    };
  }

  const confidence = Math.min(98, Math.round(reading.confidence * 0.62 + Math.min(100, rows.length * 10) * 0.18 + Math.min(100, rows.reduce((sum, row) => sum + row.count, 0) / rows.length * 36) * 0.20));
  const rejected = Math.max(0, rawLineCount - rows.length);
  return {
    reading: {
      ...reading,
      text: rows.map((row) => row.canonical).join('\n'),
      confidence,
      status: rows.length >= 1 ? 'confirmed' as const : 'unread' as const,
      precisionVersion: FORENSIC_CONSENSUS_VERSION,
      validationNotes: [...(reading.validationNotes ?? []), `${rows.length} habilidade(s) oficial(is) confirmada(s); textos unidos foram separados e ${rejected} ruído(s) descartado(s).`]
    },
    rowCount: rows.length,
    rejected,
    merged: true
  };
}

export function stabilizeForensicReadings(readings: PremiumZoneReading[]): { readings: PremiumZoneReading[]; audit: ForensicConsensusAudit } {
  let attributeRows = 0;
  let skillRows = 0;
  let rejectedNoiseRows = 0;
  const mergedFields: ForensicConsensusAudit['mergedFields'] = [];
  const stabilized = readings.map((reading) => {
    if (reading.key === 'attributes') {
      const result = mergeAttributes(reading);
      attributeRows = Math.max(attributeRows, result.rowCount);
      rejectedNoiseRows += result.rejected;
      if (result.merged) mergedFields.push('attributes');
      return result.reading;
    }
    if (reading.key === 'skills') {
      const result = mergeSkills(reading);
      skillRows = Math.max(skillRows, result.rowCount);
      rejectedNoiseRows += result.rejected;
      if (result.merged) mergedFields.push('skills');
      return result.reading;
    }
    return reading;
  });
  return {
    readings: stabilized,
    audit: {
      version: FORENSIC_CONSENSUS_VERSION,
      attributeRows,
      skillRows,
      rejectedNoiseRows,
      mergedFields: Array.from(new Set(mergedFields))
    }
  };
}
