import { PLAYSTYLE_OPTIONS, type PositionCode } from '@/lib/analyzerDomain';
import type { OcrZone, OcrZoneKey } from '@/lib/ocr';
import type { PremiumZoneReading } from '@/lib/premiumReading';
import type { PrintQualityReport } from '@/lib/validation';
import { looksLikeCompleteProfile, readDetailedPrint, type DetailedPrintReading } from './detailedPrintReader';
import { EFHUB_CARD_ART_ZONE, EFHUB_PROFILE_ZONES, isLikelyEfhubProfileGeometry, looksLikeEfhubProfileText } from './efhubProfile';
import { buildEfhubLayoutPlan, mapEfhubMacroZones, mapEfhubOcrZones, type EfhubLayoutAudit } from './efhubLayoutGeometry';
import { HIGH_PRECISION_OCR_VERSION, precisionAccuracyEstimate, precisionBlockingReasons, textSimilarity } from './highPrecisionOcr';

export type SinglePrintTemplate = 'classic' | 'tall' | 'landscape' | 'detailed-profile';
export type SinglePrintContentBounds = { x: number; y: number; w: number; h: number };
export type LayoutAnchorReport = { bounds: SinglePrintContentBounds; confidence: number; topInset: number; bottomInset: number; leftInset: number; rightInset: number; efhubLayout?: EfhubLayoutAudit; displayZones?: OcrZone[] };
export type EvidenceStatus = 'confirmed' | 'review' | 'missing';

export type FieldCandidate = {
  value: string;
  numericValue?: number;
  score: number;
  reason: string;
  sourceKey: OcrZoneKey | 'full';
  sourceLabel: string;
  sourceText: string;
  originPreview: string | null;
};

export type SingleFieldEvidence = {
  key: 'playerName' | 'position' | 'playstyle' | 'overall' | 'level' | 'points' | 'cardType' | 'specialSkill' | 'attributes' | 'skills';
  label: string;
  value: string | null;
  numericValue?: number | null;
  confidence: number;
  status: EvidenceStatus;
  reason: string;
  sourceLabel: string;
  sourceText: string;
  originPreview: string | null;
  alternatives: FieldCandidate[];
};

export type PreviousScanComparison = {
  found: boolean;
  sameIdentity: boolean;
  differences: string[];
  previousAt?: string;
};

export type SinglePrintZoneBox = { key: OcrZoneKey; label: string; x: number; y: number; w: number; h: number; status: EvidenceStatus };

export type SinglePrintSession = {
  id: string;
  imageHash: string;
  template: SinglePrintTemplate;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  layoutBounds?: SinglePrintContentBounds;
  layoutConfidence?: number;
  layoutAudit?: EfhubLayoutAudit;
  zoneBoxes?: SinglePrintZoneBox[];
  canonicalized?: boolean;
  canonicalWidth?: number;
  canonicalHeight?: number;
  canonicalPreview?: string | null;
  fields: SingleFieldEvidence[];
  mergedConfidence: number;
  blockingFields: string[];
  warnings: string[];
  canonicalText: string;
  comparison: PreviousScanComparison | null;
  detailedReading: DetailedPrintReading;
  scanQuality?: PrintQualityReport | null;
  precisionAudit: {
    version: string;
    estimatedAccuracy: number;
    nearPerfectReady: boolean;
    totalPasses: number;
    confirmedFields: number;
    reviewFields: number;
    blockingReasons: string[];
  };
  createdAt: string;
};

export type StoredSinglePrintScan = Pick<SinglePrintSession, 'id' | 'imageHash' | 'template' | 'width' | 'height' | 'createdAt'> & {
  identityKey: string;
  fields: Array<Pick<SingleFieldEvidence, 'key' | 'value' | 'numericValue' | 'confidence' | 'status'>>;
};

const POSITION_ALIASES: Record<string, PositionCode> = {
  GK: 'GK', GOL: 'GK', GO: 'GK',
  CB: 'CB', ZAG: 'CB',
  LB: 'LB', LE: 'LB',
  RB: 'RB', LD: 'RB',
  DMF: 'DMF', VOL: 'DMF',
  CMF: 'CMF', MLG: 'CMF', MC: 'CMF',
  LMF: 'LMF', MLE: 'LMF',
  RMF: 'RMF', MLD: 'RMF',
  AMF: 'AMF', MAT: 'AMF',
  LWF: 'LWF', PE: 'LWF',
  RWF: 'RWF', PD: 'RWF',
  SS: 'SS', SA: 'SS',
  CF: 'CF', CA: 'CF'
};

function zone(key: OcrZoneKey, label: string, x: number, y: number, w: number, h: number): OcrZone {
  return { key, label, x, y, w, h, enabled: true };
}

const CLASSIC_ZONES: OcrZone[] = [
  zone('name', 'Nome do jogador', 0.01, 0.00, 0.40, 0.075),
  zone('playstyle', 'Estilo de jogo', 0.01, 0.045, 0.44, 0.075),
  zone('overall', 'GER da carta', 0.045, 0.07, 0.16, 0.15),
  zone('mainPosition', 'Posição da carta', 0.04, 0.16, 0.22, 0.10),
  zone('cardType', 'Tipo da carta', 0.22, 0.075, 0.30, 0.11),
  zone('level', 'Nível máximo', 0.69, 0.00, 0.30, 0.12),
  zone('points', 'Pontos de progresso', 0.67, 0.105, 0.32, 0.13),
  zone('specialSkill', 'Habilidade especial', 0.43, 0.16, 0.55, 0.12),
  zone('positionGrid', 'Posições jogáveis', 0.66, 0.05, 0.33, 0.27),
  zone('attributes', 'Atributos visíveis', 0.01, 0.31, 0.98, 0.40),
  zone('progression', 'Progressão visível', 0.01, 0.68, 0.98, 0.19),
  zone('autoTraining', 'Ficha automática', 0.01, 0.54, 0.98, 0.33),
  zone('skills', 'Habilidades visíveis', 0.01, 0.87, 0.98, 0.12)
];

const TALL_ZONES: OcrZone[] = [
  zone('name', 'Nome do jogador', 0.02, 0.015, 0.62, 0.055),
  zone('playstyle', 'Estilo de jogo', 0.02, 0.065, 0.62, 0.055),
  zone('overall', 'GER da carta', 0.04, 0.12, 0.24, 0.13),
  zone('mainPosition', 'Posição da carta', 0.04, 0.225, 0.30, 0.075),
  zone('cardType', 'Tipo da carta', 0.30, 0.12, 0.34, 0.10),
  zone('level', 'Nível máximo', 0.63, 0.02, 0.35, 0.08),
  zone('points', 'Pontos de progresso', 0.62, 0.10, 0.36, 0.10),
  zone('specialSkill', 'Habilidade especial', 0.38, 0.21, 0.60, 0.09),
  zone('positionGrid', 'Posições jogáveis', 0.61, 0.19, 0.37, 0.20),
  zone('attributes', 'Atributos visíveis', 0.02, 0.36, 0.96, 0.31),
  zone('progression', 'Progressão visível', 0.02, 0.65, 0.96, 0.19),
  zone('autoTraining', 'Ficha automática', 0.02, 0.52, 0.96, 0.32),
  zone('skills', 'Habilidades visíveis', 0.02, 0.84, 0.96, 0.15)
];

const LANDSCAPE_ZONES: OcrZone[] = [
  zone('name', 'Nome do jogador', 0.02, 0.02, 0.32, 0.10),
  zone('playstyle', 'Estilo de jogo', 0.02, 0.10, 0.33, 0.10),
  zone('overall', 'GER da carta', 0.04, 0.20, 0.12, 0.25),
  zone('mainPosition', 'Posição da carta', 0.13, 0.26, 0.16, 0.16),
  zone('cardType', 'Tipo da carta', 0.18, 0.18, 0.20, 0.18),
  zone('level', 'Nível máximo', 0.78, 0.02, 0.20, 0.15),
  zone('points', 'Pontos de progresso', 0.77, 0.16, 0.21, 0.18),
  zone('specialSkill', 'Habilidade especial', 0.38, 0.03, 0.38, 0.16),
  zone('positionGrid', 'Posições jogáveis', 0.74, 0.28, 0.24, 0.35),
  zone('attributes', 'Atributos visíveis', 0.36, 0.18, 0.39, 0.70),
  zone('progression', 'Progressão visível', 0.36, 0.58, 0.61, 0.36),
  zone('autoTraining', 'Ficha automática', 0.36, 0.35, 0.61, 0.55),
  zone('skills', 'Habilidades visíveis', 0.02, 0.76, 0.32, 0.20)
];


const DETAILED_PROFILE_ZONES: OcrZone[] = EFHUB_PROFILE_ZONES;

export function detectSinglePrintTemplate(width: number, height: number): SinglePrintTemplate {
  if (isLikelyEfhubProfileGeometry(width, height)) return 'detailed-profile';
  if (width > height) return 'landscape';
  const ratio = width / Math.max(1, height);
  return ratio < 0.62 ? 'tall' : 'classic';
}

export function getAdaptiveSinglePrintZones(width: number, height: number): { template: SinglePrintTemplate; zones: OcrZone[] } {
  const template = detectSinglePrintTemplate(width, height);
  const zones = template === 'tall' ? TALL_ZONES : template === 'landscape' ? LANDSCAPE_ZONES : template === 'detailed-profile' ? DETAILED_PROFILE_ZONES : CLASSIC_ZONES;
  return { template, zones: zones.map((item) => ({ ...item })) };
}

export function refineSinglePrintGeometryFromText(
  input: { width: number; height: number; template: SinglePrintTemplate; zones: OcrZone[]; cardArtZone: OcrZone; anchorReport: LayoutAnchorReport },
  text: string
) {
  if (!looksLikeEfhubProfileText(text) && !looksLikeCompleteProfile(text)) return input;
  const plan = buildEfhubLayoutPlan(input.width, input.height, input.anchorReport.bounds, text);
  const zones = mapEfhubOcrZones(plan);
  const cardArtZone = zones.find((item) => item.key === 'cardType') ?? mapEfhubOcrZones(plan)[0] ?? input.cardArtZone;
  return {
    ...input,
    template: 'detailed-profile' as const,
    zones,
    cardArtZone,
    anchorReport: {
      ...input.anchorReport,
      confidence: Math.max(input.anchorReport.confidence, plan.audit.confidence),
      efhubLayout: plan.audit,
      displayZones: mapEfhubMacroZones(plan)
    }
  };
}

export function getCardArtZone(template: SinglePrintTemplate): OcrZone {
  if (template === 'detailed-profile') return { ...EFHUB_CARD_ART_ZONE };
  if (template === 'landscape') return zone('cardType', 'Arte da carta', 0.015, 0.16, 0.32, 0.58);
  if (template === 'tall') return zone('cardType', 'Arte da carta', 0.02, 0.10, 0.58, 0.27);
  return zone('cardType', 'Arte da carta', 0.015, 0.065, 0.57, 0.27);
}

export function ocrKindForZone(key: OcrZoneKey): 'general' | 'name' | 'numeric' | 'position' | 'style' | 'attributes' | 'skills' {
  if (key === 'level' || key === 'overall' || key === 'points') return 'numeric';
  if (key === 'name') return 'name';
  if (key === 'identityMeta') return 'general';
  if (key === 'mainPosition') return 'position';
  if (key === 'playstyle' || key === 'cardType' || key === 'specialSkill' || key === 'condition' || key === 'manager' || key === 'impetos') return 'style';
  if (key === 'attributes' || key === 'progression' || key === 'autoTraining' || key === 'physicalModel') return 'attributes';
  if (key === 'skills') return 'skills';
  return 'general';
}

function normalized(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s/+.-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function compact(value: string) {
  return normalized(value).replace(/\s+/g, '');
}

function readingFor(readings: PremiumZoneReading[], key: OcrZoneKey) {
  return readings.filter((reading) => reading.key === key).sort((a, b) => b.confidence - a.confidence);
}

function makeCandidate(reading: PremiumZoneReading, value: string, score: number, reason: string, numericValue?: number): FieldCandidate {
  return {
    value,
    numericValue,
    score: Math.max(0, Math.min(100, Math.round(score))),
    reason,
    sourceKey: reading.key,
    sourceLabel: reading.label,
    sourceText: reading.text,
    originPreview: reading.originPreview
  };
}

function chooseEvidence(
  key: SingleFieldEvidence['key'],
  label: string,
  candidates: FieldCandidate[],
  options: { required?: boolean; reviewBelow?: number; missingReason: string }
): SingleFieldEvidence {
  const ordered = [...candidates].sort((a, b) => b.score - a.score);
  const best = ordered[0];
  if (!best) return {
    key, label, value: null, numericValue: null, confidence: 0, status: 'missing', reason: options.missingReason,
    sourceLabel: 'Nenhuma área', sourceText: '', originPreview: null, alternatives: []
  };
  const threshold = options.reviewBelow ?? 78;
  const closeAlternative = ordered[1] && ordered[1].value !== best.value && Math.abs(best.score - ordered[1].score) <= 8;
  const status: EvidenceStatus = best.score >= threshold && !closeAlternative ? 'confirmed' : 'review';
  return {
    key, label, value: best.value, numericValue: best.numericValue ?? null, confidence: best.score, status,
    reason: closeAlternative ? `${best.reason} Há outro candidato próximo; confirme antes da ficha final.` : best.reason,
    sourceLabel: best.sourceLabel, sourceText: best.sourceText, originPreview: best.originPreview,
    alternatives: ordered.slice(1, 4)
  };
}

function numericMatches(text: string): number[] {
  return Array.from(text.matchAll(/\b(\d{1,3})\b/g)).map((match) => Number(match[1])).filter(Number.isFinite);
}

function extractOverall(readings: PremiumZoneReading[], fullText: string): SingleFieldEvidence {
  const candidates: FieldCandidate[] = [];
  for (const reading of readingFor(readings, 'overall')) {
    const text = normalized(reading.text);
    const explicit = Array.from(text.matchAll(/(?:ger|overall)\s*[:=-]?\s*(\d{2,3})/gi));
    for (const match of explicit) {
      const value = Number(match[1]);
      if (value >= 40 && value <= 120) candidates.push(makeCandidate(reading, String(value), reading.confidence * 0.75 + 24, 'GER lido na área própria e ligado ao rótulo.', value));
    }
    for (const value of numericMatches(text)) {
      if (value >= 40 && value <= 120) candidates.push(makeCandidate(reading, String(value), reading.confidence * 0.76 + (value >= 80 ? 15 : 5), 'Número encontrado dentro do selo/área exclusiva do GER.', value));
    }
  }
  const fallbackReading: PremiumZoneReading = { key: 'full', label: 'Texto completo', text: fullText, confidence: 45, status: 'review', originPreview: null, enhancement: 'original' };
  for (const match of normalized(fullText).matchAll(/(?:ger|overall)\s*[:=-]?\s*(\d{2,3})/gi)) {
    const value = Number(match[1]);
    if (value >= 40 && value <= 120) candidates.push(makeCandidate(fallbackReading, String(value), 62, 'GER encontrado por rótulo explícito no texto completo.', value));
  }
  return chooseEvidence('overall', 'GER', candidates, { missingReason: 'GER não encontrado no selo da carta.', reviewBelow: 76 });
}

function extractLevel(readings: PremiumZoneReading[], fullText: string, overall: number | null, points: number | null): SingleFieldEvidence {
  const candidates: FieldCandidate[] = [];
  const expectedLevel = points !== null && points >= 2 && points <= 196 ? Math.round(points / 2) + 1 : null;
  const coherence = (value: number) => expectedLevel === null ? 0 : Math.abs(value - expectedLevel) <= 2 ? 10 : Math.abs(value - expectedLevel) <= 5 ? 4 : Math.abs(value - expectedLevel) >= 18 ? -10 : 0;
  const levelReadings = readingFor(readings, 'level');
  for (const reading of levelReadings) {
    const text = normalized(reading.text);
    for (const match of text.matchAll(/(?:nivel(?:\s*(?:maximo|max))?|level|lvl|lv)\s*[:=.-]?\s*(\d{1,2})\s*[\/]\s*(\d{1,2})/gi)) {
      const current = Number(match[1]);
      const maximum = Number(match[2]);
      if (maximum >= 1 && maximum <= 99 && current <= maximum) {
        let score = reading.confidence * 0.72 + 30 + coherence(maximum);
        if (overall === maximum) score -= 60;
        candidates.push(makeCandidate(reading, String(maximum), score, 'Nível máximo reconhecido no formato atual/máximo e na área exclusiva.', maximum));
      }
    }
    for (const match of text.matchAll(/(?:nivel(?:\s*(?:maximo|max))?|level|lvl|lv)\s*[:=.-]?\s*(\d{1,2})/gi)) {
      const value = Number(match[1]);
      if (value >= 1 && value <= 99) {
        let score = reading.confidence * 0.72 + 25 + coherence(value);
        if (overall === value) score -= 70;
        if (value >= 80) score -= 24;
        candidates.push(makeCandidate(reading, String(value), score, 'Número ligado ao rótulo de nível dentro da região correta.', value));
      }
    }
    for (const value of numericMatches(text)) {
      if (value < 1 || value > 99) continue;
      let score = reading.confidence * 0.68 + 6 + coherence(value);
      if (value <= 70) score += 6;
      if (value >= 80) score -= 35;
      if (overall === value) score -= 60;
      candidates.push(makeCandidate(reading, String(value), score, 'Candidato numérico encontrado somente na região de nível.', value));
    }
  }
  const fallbackReading: PremiumZoneReading = { key: 'full', label: 'Texto completo', text: fullText, confidence: 48, status: 'review', originPreview: null, enhancement: 'original' };
  for (const match of normalized(fullText).matchAll(/(?:nivel(?:\s*(?:maximo|max))?|level|lvl|lv)\s*[:=.-]?\s*(\d{1,2})(?:\s*[\/]\s*(\d{1,2}))?/gi)) {
    const value = Number(match[2] || match[1]);
    if (value >= 1 && value <= 99 && value !== overall) candidates.push(makeCandidate(fallbackReading, String(value), (value >= 80 ? 38 : 66) + coherence(value), 'Nível encontrado por rótulo explícito no texto completo.', value));
  }
  const unique = new Map<string, FieldCandidate>();
  for (const candidate of candidates) {
    const current = unique.get(candidate.value);
    if (!current || candidate.score > current.score) unique.set(candidate.value, candidate);
  }
  return chooseEvidence('level', 'Nível máximo', Array.from(unique.values()), { missingReason: 'Nível não encontrado com evidência suficiente.', reviewBelow: 80 });
}

function extractPoints(readings: PremiumZoneReading[], fullText: string): SingleFieldEvidence {
  const candidates: FieldCandidate[] = [];
  const sources = readingFor(readings, 'points');
  for (const reading of sources) {
    const text = normalized(reading.text);
    for (const match of text.matchAll(/(?:pontos|points)(?:\s*(?:de progresso|disponiveis|totais|total))?\s*[:=.-]?\s*(\d{1,3})(?:\s*[\/]\s*(\d{1,3}))?/gi)) {
      const value = Number(match[2] || match[1]);
      if (value >= 0 && value <= 200) candidates.push(makeCandidate(reading, String(value), reading.confidence * 0.72 + 26, 'Pontos ligados ao rótulo na área própria.', value));
    }
    for (const value of numericMatches(text)) {
      if (value >= 0 && value <= 200) candidates.push(makeCandidate(reading, String(value), reading.confidence * 0.62 + 8, 'Candidato numérico na região de pontos.', value));
    }
  }
  const fallbackReading: PremiumZoneReading = { key: 'full', label: 'Texto completo', text: fullText, confidence: 45, status: 'review', originPreview: null, enhancement: 'original' };
  for (const match of normalized(fullText).matchAll(/(?:pontos|points)(?:\s*(?:de progresso|disponiveis|totais|total))?\s*[:=.-]?\s*(\d{1,3})(?:\s*[\/]\s*(\d{1,3}))?/gi)) {
    const value = Number(match[2] || match[1]);
    if (value >= 0 && value <= 200) candidates.push(makeCandidate(fallbackReading, String(value), 64, 'Pontos encontrados por rótulo explícito.', value));
  }
  return chooseEvidence('points', 'Pontos disponíveis', candidates, { missingReason: 'Pontos não estavam visíveis ou não foram reconhecidos.', reviewBelow: 78 });
}

function extractPosition(readings: PremiumZoneReading[]): SingleFieldEvidence {
  const candidates: FieldCandidate[] = [];
  for (const reading of [...readingFor(readings, 'mainPosition'), ...readingFor(readings, 'positionGrid')]) {
    const tokens = normalized(reading.text).toUpperCase().split(/\s+/);
    for (const token of tokens) {
      const mapped = POSITION_ALIASES[token];
      if (!mapped) continue;
      const primaryBonus = reading.key === 'mainPosition' ? 26 : 4;
      candidates.push(makeCandidate(reading, mapped, reading.confidence * 0.72 + primaryBonus, reading.key === 'mainPosition' ? 'Código oficial encontrado na área da posição principal.' : 'Posição encontrada na grade; precisa confirmar se é a principal.'));
    }
  }
  return chooseEvidence('position', 'Posição principal', candidates, { missingReason: 'Posição principal não encontrada.', reviewBelow: 78 });
}

function similarity(a: string, b: string) {
  const left = normalized(a);
  const right = normalized(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return Math.min(left.length, right.length) / Math.max(left.length, right.length) * 0.95;
  const leftTokens = new Set(left.split(' '));
  const rightTokens = new Set(right.split(' '));
  const common = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return common / Math.max(leftTokens.size, rightTokens.size);
}

function extractPlaystyle(readings: PremiumZoneReading[]): SingleFieldEvidence {
  const candidates: FieldCandidate[] = [];
  for (const reading of readingFor(readings, 'playstyle')) {
    for (const style of PLAYSTYLE_OPTIONS) {
      const match = similarity(reading.text, style);
      if (match < 0.48) continue;
      candidates.push(makeCandidate(reading, style, reading.confidence * 0.58 + match * 42, match >= 0.85 ? 'Estilo oficial reconhecido na região própria.' : 'Texto semelhante a um estilo oficial; confirme.'));
    }
  }
  return chooseEvidence('playstyle', 'Estilo de jogo', candidates, { missingReason: 'Estilo oficial não encontrado na área visível.', reviewBelow: 80 });
}

const FORBIDDEN_NAME_LINES = ['detalhes do jogador', 'nivel maximo', 'estilo de jogo', 'pontos', 'atributos', 'habilidades', 'overall', 'ger'];

function cleanNameCandidate(value: string) {
  return value
    .replace(/^(?:nome(?:\s+do\s+jogador)?|jogador)\s*[:=.-]?\s*/i, '')
    .replace(/^[^A-Za-zÀ-ÿ]+|[^A-Za-zÀ-ÿ.' -]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPlayerName(readings: PremiumZoneReading[], knownPlayerNames: string[] = []): SingleFieldEvidence {
  const rawCandidates: Array<{ reading: PremiumZoneReading; value: string; confidence: number; reason: string }> = [];
  for (const reading of readingFor(readings, 'name')) {
    const passTexts = [
      { text: reading.text, confidence: reading.confidence, reason: 'Leitura principal do cabeçalho.' },
      ...(reading.alternatives ?? []).map((item) => ({ text: item.text, confidence: item.confidence, reason: `Passagem alternativa ${item.enhancement}.` }))
    ];
    for (const pass of passTexts) {
      const lines = pass.text.split(/\r?\n/).map(cleanNameCandidate).filter(Boolean);
      for (const clean of lines) {
        const norm = normalized(clean);
        const letters = (clean.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
        if (clean.length < 3 || clean.length > 52 || /\d/.test(clean) || letters / Math.max(1, clean.length) < 0.67) continue;
        if (FORBIDDEN_NAME_LINES.some((item) => norm.includes(item))) continue;
        const words = clean.split(/\s+/).length;
        if (words > 6) continue;
        let value = clean;
        let reason = pass.reason;
        const lexicon = knownPlayerNames
          .map((name) => ({ name, similarity: textSimilarity(clean, name) }))
          .sort((left, right) => right.similarity - left.similarity)[0];
        const lexiconThreshold = Math.min(compact(clean).length, compact(lexicon?.name ?? '').length) <= 8 ? 0.94 : 0.90;
        if (lexicon?.similarity >= lexiconThreshold) {
          value = lexicon.name;
          reason = `Nome conciliado com uma identidade já confirmada (${Math.round(lexicon.similarity * 100)}% de similaridade).`;
        }
        rawCandidates.push({ reading, value, confidence: pass.confidence, reason });
      }
    }
  }

  const clusters: Array<Array<typeof rawCandidates[number]>> = [];
  for (const candidate of rawCandidates) {
    let cluster = clusters.find((items) => textSimilarity(items[0].value, candidate.value) >= 0.82);
    if (!cluster) {
      cluster = [];
      clusters.push(cluster);
    }
    cluster.push(candidate);
  }

  const candidates: FieldCandidate[] = clusters.flatMap((cluster) => {
    const representative = [...cluster].sort((left, right) => right.confidence - left.confidence)[0];
    const agreement = new Set(cluster.map((item) => `${item.reading.enhancement}:${normalized(item.value)}`)).size;
    const averageConfidence = cluster.reduce((sum, item) => sum + item.confidence, 0) / cluster.length;
    const exactLexicon = knownPlayerNames.some((name) => normalized(name) === normalized(representative.value));
    // Um único palpite sem histórico confirmado não vira nome automático.
    if (agreement < 2 && !exactLexicon) return [];
    const wordBonus = representative.value.split(/\s+/).length <= 5 ? 10 : 0;
    const agreementBonus = Math.min(24, Math.max(0, (agreement - 1) * 8));
    const lexiconBonus = exactLexicon ? 9 : 0;
    const score = averageConfidence * 0.72 + wordBonus + agreementBonus + lexiconBonus;
    return [makeCandidate(
      representative.reading,
      representative.value,
      score,
      exactLexicon
        ? `${representative.reason} A identidade pertence ao histórico confirmado do usuário.`
        : `${representative.reason} ${agreement} passagens independentes concordaram com este nome.`
    )];
  });

  return chooseEvidence('playerName', 'Nome do jogador', candidates, { missingReason: 'Nome não reconhecido no cabeçalho.', reviewBelow: 92 });
}

function extractFreeText(key: 'cardType' | 'specialSkill', label: string, readings: PremiumZoneReading[], zoneKey: OcrZoneKey): SingleFieldEvidence {
  const candidates: FieldCandidate[] = [];
  for (const reading of readingFor(readings, zoneKey)) {
    const clean = reading.text.replace(/\s+/g, ' ').trim();
    if (clean.length >= 2) candidates.push(makeCandidate(reading, clean.slice(0, 80), reading.confidence * 0.82 + 8, `${label} lido na região dedicada.`));
  }
  return chooseEvidence(key, label, candidates, { missingReason: `${label} não estava visível.`, reviewBelow: 78 });
}

function extractLongText(key: 'attributes' | 'skills', label: string, readings: PremiumZoneReading[], zoneKey: OcrZoneKey): SingleFieldEvidence {
  const candidates: FieldCandidate[] = [];
  for (const reading of readingFor(readings, zoneKey)) {
    const clean = reading.text.trim();
    if (clean.length >= 4) candidates.push(makeCandidate(reading, clean, reading.confidence * 0.85 + Math.min(12, clean.length / 35), `${label} reconhecidos na área visível.`));
  }
  return chooseEvidence(key, label, candidates, { missingReason: `${label} não estavam visíveis ou legíveis.`, reviewBelow: 70 });
}

function identityKey(fields: SingleFieldEvidence[]) {
  const value = (key: SingleFieldEvidence['key']) => fields.find((field) => field.key === key)?.value ?? '';
  return compact(`${value('playerName')}|${value('position')}|${value('overall')}|${value('cardType')}`);
}

export function buildSinglePrintSession(input: {
  imageHash: string;
  template: SinglePrintTemplate;
  width: number;
  height: number;
  readings: PremiumZoneReading[];
  fullText: string;
  previous?: StoredSinglePrintScan | null;
  layoutBounds?: SinglePrintContentBounds;
  layoutConfidence?: number;
  layoutAudit?: EfhubLayoutAudit;
  zones?: OcrZone[];
  displayZones?: OcrZone[];
  knownPlayerNames?: string[];
  learnedSkillNames?: string[];
  qualityReport?: PrintQualityReport | null;
  canonicalized?: boolean;
  canonicalWidth?: number;
  canonicalHeight?: number;
  canonicalPreview?: string | null;
}): SinglePrintSession {
  const knownPlayerNames = input.knownPlayerNames ?? [];
  const learnedSkillNames = input.learnedSkillNames ?? [];
  const detailedReading = readDetailedPrint(input.fullText, input.readings, knownPlayerNames, learnedSkillNames, input.template === 'detailed-profile');
  const overall = extractOverall(input.readings, input.fullText);
  const points = extractPoints(input.readings, input.fullText);
  let fields: SingleFieldEvidence[] = [
    extractPlayerName(input.readings, knownPlayerNames),
    extractPosition(input.readings),
    extractPlaystyle(input.readings),
    overall,
    extractLevel(input.readings, input.fullText, overall.numericValue ?? null, points.numericValue ?? null),
    points,
    extractFreeText('cardType', 'Tipo da carta', input.readings, 'cardType'),
    extractFreeText('specialSkill', 'Habilidade especial', input.readings, 'specialSkill'),
    extractLongText('attributes', 'Atributos', input.readings, 'attributes'),
    extractLongText('skills', 'Habilidades', input.readings, 'skills')
  ];
  const detailedMap: Partial<Record<SingleFieldEvidence['key'], { value: string; numericValue?: number; confidence: number; reason: string }>> = {
    playerName: detailedReading.identity.playerName ? { value: detailedReading.identity.playerName.value, confidence: detailedReading.identity.playerName.confidence, reason: 'Nome confirmado pelo leitor detalhado do perfil completo.' } : undefined,
    position: detailedReading.identity.mainPosition ? { value: detailedReading.identity.mainPosition.value, confidence: detailedReading.identity.mainPosition.confidence, reason: 'Posição cruzada entre selo e grade completa.' } : undefined,
    playstyle: detailedReading.identity.playstyle ? { value: detailedReading.identity.playstyle.value, confidence: detailedReading.identity.playstyle.confidence, reason: 'Estilo reconhecido no cabeçalho do perfil.' } : undefined,
    overall: detailedReading.identity.overall ? { value: detailedReading.identity.overall.value, numericValue: detailedReading.identity.overall.numericValue, confidence: detailedReading.identity.overall.confidence, reason: 'GER cruzado entre selo e posição principal.' } : undefined,
    level: detailedReading.identity.level ? { value: String(detailedReading.identity.level.numericValue ?? detailedReading.identity.level.value), numericValue: detailedReading.identity.level.numericValue, confidence: detailedReading.identity.level.confidence, reason: 'Nível reconhecido no bloco de identidade física.' } : undefined,
    attributes: detailedReading.attributes.length >= 4 ? { value: detailedReading.attributes.map((item) => `${item.label}: ${item.value}`).join('\n'), confidence: Math.min(98, 64 + detailedReading.attributes.length), reason: `${detailedReading.attributes.length} atributos estruturados pelo leitor detalhado.` } : undefined,
    skills: detailedReading.skills.length >= 1 ? { value: detailedReading.skills.map((item) => item.value).join(', '), confidence: Math.min(96, 68 + detailedReading.skills.length * 2), reason: `${detailedReading.skills.length} habilidades reconhecidas na faixa inferior.` } : undefined
  };
  const criticalZoneByField: Partial<Record<SingleFieldEvidence['key'], OcrZoneKey>> = {
    playerName: 'name', position: 'mainPosition', playstyle: 'playstyle', overall: 'overall', level: 'level', points: 'points'
  };
  fields = fields.map((field) => {
    const detailed = detailedMap[field.key];
    if (!detailed || (field.value && field.confidence > detailed.confidence + 4)) return field;
    const criticalZone = criticalZoneByField[field.key];
    const precisionConfirmed = !criticalZone || input.readings.some((reading) => reading.key === criticalZone && reading.status === 'confirmed');
    const confidence = Math.max(field.confidence, detailed.confidence);
    if (!precisionConfirmed) {
      return {
        ...field,
        value: detailed.value,
        numericValue: detailed.numericValue ?? field.numericValue,
        confidence: Math.min(91, confidence),
        status: 'review' as const,
        reason: `${detailed.reason} O valor permanece em revisão porque as passagens locais não chegaram ao consenso exigido.`,
        sourceLabel: 'Perfil EFHub calibrado v32.00',
        sourceText: detailed.value
      };
    }
    return {
      ...field,
      value: detailed.value,
      numericValue: detailed.numericValue ?? field.numericValue,
      confidence,
      status: confidence >= 82 ? 'confirmed' as const : 'review' as const,
      reason: detailed.reason,
      sourceLabel: 'Perfil EFHub calibrado v32.00',
      sourceText: detailed.value
    };
  });
  const required: SingleFieldEvidence['key'][] = ['playerName', 'position', 'playstyle', 'level'];
  const precisionReasons = precisionBlockingReasons(input.readings);
  const efhubGateBlocks = detailedReading.profileAudit.detected
    ? detailedReading.profileAudit.gates.filter((gate) => gate.status !== 'complete').map((gate) => `${gate.label} ${gate.expected === null ? '' : `${gate.recognized}/${gate.expected}`}`.trim())
    : [];
  const layoutBlocks = input.layoutAudit && !input.layoutAudit.complete
    ? input.layoutAudit.missingZones.length
      ? input.layoutAudit.missingZones.map((label) => `Área ausente: ${label}`)
      : ['Enquadramento eFHUB incompatível']
    : [];
  const blockingFields = Array.from(new Set([
    ...fields.filter((field) => required.includes(field.key) && field.status !== 'confirmed').map((field) => field.label),
    ...precisionReasons,
    ...efhubGateBlocks,
    ...layoutBlocks,
    ...(input.qualityReport?.state === 'blocked' ? ['Qualidade do print'] : [])
  ]));
  const confidenceValues = fields.filter((field) => field.value).map((field) => field.confidence);
  const mergedConfidence = confidenceValues.length ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length) : 0;
  const estimatedAccuracy = precisionAccuracyEstimate(input.readings);
  const precisionAudit = {
    version: HIGH_PRECISION_OCR_VERSION,
    estimatedAccuracy,
    nearPerfectReady: estimatedAccuracy >= 96
      && precisionReasons.length === 0
      && (!detailedReading.profileAudit.detected || detailedReading.profileAudit.ready)
      && (!input.layoutAudit || input.layoutAudit.complete),
    totalPasses: input.readings.reduce((sum, reading) => sum + (reading.passCount ?? 1), 0),
    confirmedFields: fields.filter((field) => field.status === 'confirmed').length,
    reviewFields: fields.filter((field) => field.status !== 'confirmed').length,
    blockingReasons: precisionReasons
  };
  const warnings: string[] = [];
  if (input.qualityReport) {
    warnings.push(`Qualidade forense do print: ${input.qualityReport.score}/100 (${input.qualityReport.state}).`);
    warnings.push(...input.qualityReport.issues.map((issue) => issue.message));
  }
  if (input.layoutAudit) {
    warnings.push(`Encaixe dinâmico ${input.layoutAudit.mode}: ${input.layoutAudit.confidence}% de confiança • ${(input.layoutAudit.visibleFraction * 100).toFixed(1)}% do painel visível.`);
    warnings.push(input.layoutAudit.reason);
    if (input.layoutAudit.missingZones.length) warnings.push(`Áreas fora do print: ${input.layoutAudit.missingZones.join(', ')}.`);
  }
  if (!precisionAudit.nearPerfectReady) warnings.push(`Precisão estimada em ${precisionAudit.estimatedAccuracy}%. O app bloqueia dados críticos sem consenso em vez de inventar valores.`);
  else warnings.push(`Leitura ultraprécisa liberada: ${precisionAudit.estimatedAccuracy}% de precisão estimada com consenso multietapas.`);
  const level = fields.find((field) => field.key === 'level');
  if (level?.numericValue && level.numericValue >= 80) warnings.push('Nível muito alto detectado. Confirme: pode ser o GER da carta.');
  if (level?.alternatives.some((item) => item.numericValue === overall.numericValue)) warnings.push('O GER também apareceu entre os candidatos de nível e foi descartado como evidência principal.');
  if (blockingFields.length) warnings.push(`Confirme antes de finalizar: ${blockingFields.join(', ')}.`);
  warnings.push(...detailedReading.warnings);
  if (detailedReading.skillCandidates.length) warnings.push(`Habilidades novas aguardando confirmação: ${detailedReading.skillCandidates.map((item) => item.value).join(', ')}.`);
  if (detailedReading.format === 'complete-profile') warnings.push(`Perfil completo detectado: ${detailedReading.coverage.attributeCount}/26 atributos, ${detailedReading.coverage.positionCount}/13 posições, ${detailedReading.coverage.skillCount} habilidades e ${detailedReading.coverage.physicalCount}/16 medidas físicas.`);
  if (detailedReading.profileAudit.detected) warnings.push(`Leitor eFHUB dinâmico: ${detailedReading.profileAudit.score}/100 • ${detailedReading.profileAudit.ready ? 'todos os portões completos' : `faltam ${detailedReading.profileAudit.missing.join(', ')}`}.`);

  const fieldValue = (key: SingleFieldEvidence['key']) => fields.find((field) => field.key === key)?.value;
  const canonicalLines = [
    detailedReading.canonicalText,
    fieldValue('playerName') ? `NOME DO JOGADOR: ${fieldValue('playerName')}` : '',
    fieldValue('position') ? `POSIÇÃO PRINCIPAL: ${fieldValue('position')}` : '',
    fieldValue('playstyle') ? `ESTILO DE JOGO: ${fieldValue('playstyle')}` : '',
    fieldValue('overall') ? `GER: ${fieldValue('overall')}` : '',
    fieldValue('level') ? `NÍVEL MÁXIMO: ${fieldValue('level')}` : '',
    fieldValue('points') ? `PONTOS TOTAIS: ${fieldValue('points')}` : '',
    fieldValue('cardType') ? `TIPO DA CARTA: ${fieldValue('cardType')}` : '',
    fieldValue('specialSkill') ? `HABILIDADE ESPECIAL: ${fieldValue('specialSkill')}` : '',
    fieldValue('attributes') ? `ATRIBUTOS VISÍVEIS:\n${fieldValue('attributes')}` : '',
    fieldValue('skills') ? `HABILIDADES VISÍVEIS:\n${fieldValue('skills')}` : ''
  ].filter(Boolean);

  const fieldForZone = (key: OcrZoneKey): SingleFieldEvidence | undefined => {
    const map: Partial<Record<OcrZoneKey, SingleFieldEvidence['key']>> = {
      name: 'playerName', mainPosition: 'position', positionGrid: 'position', playstyle: 'playstyle',
      overall: 'overall', level: 'level', points: 'points', cardType: 'cardType', specialSkill: 'specialSkill',
      attributes: 'attributes', progression: 'attributes', autoTraining: 'attributes', physicalModel: 'attributes', skills: 'skills',
      identityMeta: 'level', condition: 'specialSkill', manager: 'specialSkill', impetos: 'specialSkill'
    };
    const fieldKey = map[key];
    return fieldKey ? fields.find((field) => field.key === fieldKey) : undefined;
  };
  const statusRank: Record<EvidenceStatus, number> = { confirmed: 0, review: 1, missing: 2 };
  const combineStatus = (...statuses: Array<EvidenceStatus | undefined>): EvidenceStatus =>
    statuses.filter((item): item is EvidenceStatus => Boolean(item)).sort((left, right) => statusRank[right] - statusRank[left])[0] ?? 'missing';
  const statusForDisplayZone = (item: OcrZone): EvidenceStatus => {
    if (!item.enabled) return 'missing';
    if (item.key === 'name') return combineStatus(fieldForZone('name')?.status, fieldForZone('playstyle')?.status);
    if (item.key === 'cardType') return combineStatus(fieldForZone('cardType')?.status, fieldForZone('mainPosition')?.status, fieldForZone('overall')?.status);
    if (item.key === 'identityMeta') return detailedReading.profileAudit.gates.find((gate) => gate.key === 'identity')?.status === 'complete' ? 'confirmed' : 'review';
    if (item.key === 'positionGrid') return detailedReading.coverage.positionCount === 13 ? 'confirmed' : detailedReading.coverage.positionCount >= 10 ? 'review' : 'missing';
    if (item.key === 'physicalModel') return detailedReading.coverage.physicalCount === 16 ? 'confirmed' : detailedReading.coverage.physicalCount >= 12 ? 'review' : 'missing';
    if (item.key === 'skills') {
      if (detailedReading.skillCandidates.length > 0) return 'review';
      return detailedReading.coverage.skillCount >= 1 ? 'confirmed' : 'missing';
    }
    return fieldForZone(item.key)?.status ?? 'missing';
  };
  const zoneBoxes = (input.displayZones ?? input.zones)?.map((item) => ({
    key: item.key, label: item.label, x: item.x, y: item.y, w: item.w, h: item.h,
    status: statusForDisplayZone(item)
  }));

  let comparison: PreviousScanComparison | null = null;
  if (input.previous) {
    const currentKey = identityKey(fields);
    const previousMap = new Map(input.previous.fields.map((field) => [field.key, field.value ?? String(field.numericValue ?? '')]));
    const differences: string[] = [];
    for (const field of fields.filter((item) => ['level', 'overall', 'position', 'playstyle', 'playerName'].includes(item.key))) {
      const previousValue = previousMap.get(field.key) ?? '';
      const currentValue = field.value ?? String(field.numericValue ?? '');
      if (previousValue && currentValue && normalized(previousValue) !== normalized(currentValue)) differences.push(`${field.label}: antes ${previousValue}, agora ${currentValue}`);
    }
    comparison = {
      found: true,
      sameIdentity: Boolean(currentKey && currentKey === input.previous.identityKey),
      differences,
      previousAt: input.previous.createdAt
    };
  }

  return {
    id: `single-${Date.now()}-${input.imageHash.slice(0, 8)}`,
    imageHash: input.imageHash,
    template: input.template,
    width: input.width,
    height: input.height,
    orientation: input.width > input.height ? 'landscape' : 'portrait',
    layoutBounds: input.layoutBounds,
    layoutConfidence: input.layoutConfidence,
    layoutAudit: input.layoutAudit,
    zoneBoxes,
    canonicalized: Boolean(input.canonicalized),
    canonicalWidth: input.canonicalWidth,
    canonicalHeight: input.canonicalHeight,
    canonicalPreview: input.canonicalPreview ?? null,
    fields,
    mergedConfidence,
    blockingFields,
    warnings,
    canonicalText: `[LEITURA PRINT ÚNICO PRO]\n${canonicalLines.join('\n')}\n[FIM LEITURA PRINT ÚNICO PRO]`,
    comparison,
    detailedReading,
    scanQuality: input.qualityReport ?? null,
    precisionAudit,
    createdAt: new Date().toISOString()
  };
}

export function toStoredSinglePrintScan(session: SinglePrintSession): StoredSinglePrintScan {
  return {
    id: session.id,
    imageHash: session.imageHash,
    template: session.template,
    width: session.width,
    height: session.height,
    createdAt: session.createdAt,
    identityKey: identityKey(session.fields),
    fields: session.fields.map(({ key, value, numericValue, confidence, status }) => ({ key, value, numericValue, confidence, status }))
  };
}

export function fieldByKey(session: SinglePrintSession | null, key: SingleFieldEvidence['key']) {
  return session?.fields.find((field) => field.key === key) ?? null;
}


function transformZoneToBounds(item: OcrZone, bounds: SinglePrintContentBounds): OcrZone {
  return {
    ...item,
    x: Math.max(0, Math.min(1, bounds.x + item.x * bounds.w)),
    y: Math.max(0, Math.min(1, bounds.y + item.y * bounds.h)),
    w: Math.max(0.01, Math.min(1, item.w * bounds.w)),
    h: Math.max(0.01, Math.min(1, item.h * bounds.h))
  };
}

function fullBounds(): SinglePrintContentBounds {
  return { x: 0, y: 0, w: 1, h: 1 };
}

async function detectContentBounds(bitmap: ImageBitmap): Promise<LayoutAnchorReport> {
  if (typeof document === 'undefined') return { bounds: fullBounds(), confidence: 0, topInset: 0, bottomInset: 0, leftInset: 0, rightInset: 0 };
  const sampleWidth = Math.min(260, Math.max(120, bitmap.width));
  const sampleHeight = Math.max(120, Math.round(bitmap.height * (sampleWidth / Math.max(1, bitmap.width))));
  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { bounds: fullBounds(), confidence: 0, topInset: 0, bottomInset: 0, leftInset: 0, rightInset: 0 };
  ctx.drawImage(bitmap, 0, 0, sampleWidth, sampleHeight);
  const { data } = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
  const lum = (x: number, y: number) => {
    const index = (y * sampleWidth + x) * 4;
    return data[index] * .299 + data[index + 1] * .587 + data[index + 2] * .114;
  };
  const rowStats = (y: number) => {
    let sum = 0; let square = 0; let edges = 0; let previous = lum(0, y);
    for (let x = 0; x < sampleWidth; x += 2) {
      const value = lum(x, y);
      sum += value; square += value * value; edges += Math.abs(value - previous); previous = value;
    }
    const count = Math.ceil(sampleWidth / 2);
    const mean = sum / count;
    const variance = Math.max(0, square / count - mean * mean);
    return { mean, activity: Math.sqrt(variance) + edges / count };
  };
  const colStats = (x: number) => {
    let sum = 0; let square = 0; let edges = 0; let previous = lum(x, 0);
    for (let y = 0; y < sampleHeight; y += 2) {
      const value = lum(x, y);
      sum += value; square += value * value; edges += Math.abs(value - previous); previous = value;
    }
    const count = Math.ceil(sampleHeight / 2);
    const mean = sum / count;
    const variance = Math.max(0, square / count - mean * mean);
    return { mean, activity: Math.sqrt(variance) + edges / count };
  };
  const topLimit = Math.floor(sampleHeight * .12);
  const sideLimit = Math.floor(sampleWidth * .08);
  let top = 0; let bottom = sampleHeight - 1; let left = 0; let right = sampleWidth - 1;
  const isBar = (stat: { mean: number; activity: number }) => stat.mean < 72 && stat.activity < 25;
  while (top < topLimit && isBar(rowStats(top))) top += 1;
  while (bottom > sampleHeight - 1 - topLimit && isBar(rowStats(bottom))) bottom -= 1;
  while (left < sideLimit && isBar(colStats(left))) left += 1;
  while (right > sampleWidth - 1 - sideLimit && isBar(colStats(right))) right -= 1;
  const topInset = top / sampleHeight;
  const bottomInset = Math.max(0, (sampleHeight - 1 - bottom) / sampleHeight);
  const leftInset = left / sampleWidth;
  const rightInset = Math.max(0, (sampleWidth - 1 - right) / sampleWidth);
  const removed = topInset + bottomInset + leftInset + rightInset;
  const sane = topInset <= .12 && bottomInset <= .12 && leftInset <= .08 && rightInset <= .08;
  const confidence = sane && removed >= .008 ? Math.min(96, Math.round(45 + removed * 350)) : 0;
  const bounds = confidence ? {
    x: leftInset,
    y: topInset,
    w: Math.max(.75, 1 - leftInset - rightInset),
    h: Math.max(.72, 1 - topInset - bottomInset)
  } : fullBounds();
  return { bounds, confidence, topInset, bottomInset, leftInset, rightInset };
}

export async function inspectSinglePrintGeometry(file: File | Blob): Promise<{ width: number; height: number; template: SinglePrintTemplate; zones: OcrZone[]; cardArtZone: OcrZone; anchorReport: LayoutAnchorReport }> {
  if (typeof createImageBitmap === 'undefined') {
    const adaptive = getAdaptiveSinglePrintZones(1400, 1600);
    const baseAnchor = { bounds: fullBounds(), confidence: 0, topInset: 0, bottomInset: 0, leftInset: 0, rightInset: 0 };
    if (adaptive.template === 'detailed-profile') {
      const plan = buildEfhubLayoutPlan(1400, 1600, baseAnchor.bounds);
      const zones = mapEfhubOcrZones(plan);
      return {
        width: 1400, height: 1600, template: adaptive.template, zones,
        cardArtZone: zones.find((item) => item.key === 'cardType') ?? getCardArtZone(adaptive.template),
        anchorReport: { ...baseAnchor, confidence: plan.audit.confidence, efhubLayout: plan.audit, displayZones: mapEfhubMacroZones(plan) }
      };
    }
    return { width: 1400, height: 1600, template: adaptive.template, zones: adaptive.zones, cardArtZone: getCardArtZone(adaptive.template), anchorReport: baseAnchor };
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const width = bitmap.width;
  const height = bitmap.height;
  const adaptive = getAdaptiveSinglePrintZones(width, height);
  const detectedBounds = await detectContentBounds(bitmap).catch(() => ({ bounds: fullBounds(), confidence: 0, topInset: 0, bottomInset: 0, leftInset: 0, rightInset: 0 }));
  bitmap.close?.();
  if (adaptive.template === 'detailed-profile') {
    const plan = buildEfhubLayoutPlan(width, height, detectedBounds.bounds);
    const zones = mapEfhubOcrZones(plan);
    return {
      width,
      height,
      template: adaptive.template,
      zones,
      cardArtZone: zones.find((item) => item.key === 'cardType') ?? getCardArtZone(adaptive.template),
      anchorReport: {
        ...detectedBounds,
        confidence: Math.max(detectedBounds.confidence, plan.audit.confidence),
        efhubLayout: plan.audit,
        displayZones: mapEfhubMacroZones(plan)
      }
    };
  }
  return {
    width,
    height,
    template: adaptive.template,
    zones: adaptive.zones.map((item) => transformZoneToBounds(item, detectedBounds.bounds)),
    cardArtZone: transformZoneToBounds(getCardArtZone(adaptive.template), detectedBounds.bounds),
    anchorReport: detectedBounds
  };
}

export type StoredOcrCorrection = {
  id: string;
  template: SinglePrintTemplate;
  widthBucket: number;
  heightBucket: number;
  field: SingleFieldEvidence['key'];
  originalValue: string;
  correctedValue: string;
  playerName: string;
  createdAt: string;
};

function bucket(value: number) {
  return Math.round(value / 100) * 100;
}

export function correctionMatches(session: SinglePrintSession, correction: StoredOcrCorrection) {
  const name = fieldByKey(session, 'playerName')?.value ?? '';
  const field = fieldByKey(session, correction.field);
  return correction.template === session.template
    && Math.abs(correction.widthBucket - bucket(session.width)) <= 100
    && Math.abs(correction.heightBucket - bucket(session.height)) <= 100
    && normalized(correction.playerName) === normalized(name)
    && normalized(correction.originalValue) === normalized(field?.value ?? '');
}

export function createCorrectionRecord(session: SinglePrintSession, field: SingleFieldEvidence['key'], correctedValue: string): StoredOcrCorrection | null {
  const current = fieldByKey(session, field);
  const playerName = fieldByKey(session, 'playerName')?.value ?? '';
  if (!current?.value || !correctedValue || normalized(current.value) === normalized(correctedValue) || !playerName) return null;
  return {
    id: `correction-${Date.now()}-${session.imageHash.slice(0, 8)}-${field}`,
    template: session.template,
    widthBucket: bucket(session.width),
    heightBucket: bucket(session.height),
    field,
    originalValue: current.value,
    correctedValue,
    playerName,
    createdAt: new Date().toISOString()
  };
}

function rebuildCanonicalText(fields: SingleFieldEvidence[]) {
  const get = (key: SingleFieldEvidence['key']) => fields.find((field) => field.key === key)?.value;
  return `[LEITURA PRINT ÚNICO PRO]\n${[
    get('playerName') ? `NOME DO JOGADOR: ${get('playerName')}` : '',
    get('position') ? `POSIÇÃO PRINCIPAL: ${get('position')}` : '',
    get('playstyle') ? `ESTILO DE JOGO: ${get('playstyle')}` : '',
    get('overall') ? `GER: ${get('overall')}` : '',
    get('level') ? `NÍVEL MÁXIMO: ${get('level')}` : '',
    get('points') ? `PONTOS TOTAIS: ${get('points')}` : '',
    get('cardType') ? `TIPO DA CARTA: ${get('cardType')}` : '',
    get('specialSkill') ? `HABILIDADE ESPECIAL: ${get('specialSkill')}` : '',
    get('attributes') ? `ATRIBUTOS VISÍVEIS:\n${get('attributes')}` : '',
    get('skills') ? `HABILIDADES VISÍVEIS:\n${get('skills')}` : ''
  ].filter(Boolean).join('\n')}\n[FIM LEITURA PRINT ÚNICO PRO]`;
}

export function applyStoredOcrCorrections(session: SinglePrintSession, corrections: StoredOcrCorrection[]): SinglePrintSession {
  const applicable = corrections.filter((correction) => correctionMatches(session, correction));
  if (!applicable.length) return session;
  const fields = session.fields.map((field) => {
    const correction = applicable.find((item) => item.field === field.key);
    if (!correction) return field;
    const numericValue = /^\d+$/.test(correction.correctedValue) ? Number(correction.correctedValue) : field.numericValue;
    return {
      ...field,
      value: correction.correctedValue,
      numericValue,
      confidence: Math.max(field.confidence, 86),
      status: 'review' as const,
      reason: `Correção anterior encontrada para esta mesma carta/template: ${correction.originalValue} → ${correction.correctedValue}. Confirme novamente.`
    };
  });
  return {
    ...session,
    fields,
    canonicalText: rebuildCanonicalText(fields),
    warnings: [...session.warnings, 'Uma correção anterior desta mesma carta foi reaplicada como sugestão e precisa de confirmação.']
  };
}
