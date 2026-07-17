import type { OcrZone, OcrZoneKey } from './ocr';
import type { PremiumEnhancementMode, PremiumZoneReading } from './premiumReading';
import type { PrintQualityReport } from './validation';

export type CardScreenType = 'overview' | 'attributes' | 'skills' | 'progression' | 'positions' | 'unknown';
export type CaptureRequirement = 'required' | 'recommended' | 'optional';

export type TotalCardCaptureInput = {
  id: string;
  declaredType: Exclude<CardScreenType, 'unknown'>;
  label: string;
  requirement: CaptureRequirement;
  file: File;
  preview: string;
  quality: PrintQualityReport | null;
};

export type CaptureIdentity = {
  playerName: string | null;
  position: string | null;
  overall: number | null;
  level: number | null;
  cardType: string | null;
};

export type CaptureReadingAudit = {
  id: string;
  label: string;
  declaredType: Exclude<CardScreenType, 'unknown'>;
  detectedType: CardScreenType;
  confidence: number;
  text: string;
  quality: PrintQualityReport | null;
  identity: CaptureIdentity;
  warnings: string[];
  readings: PremiumZoneReading[];
};

export type TotalReadingSession = {
  captures: CaptureReadingAudit[];
  coverage: Array<{ type: Exclude<CardScreenType, 'unknown'>; label: string; present: boolean; required: boolean }>;
  missingCriticalScreens: string[];
  mismatchRisk: 'none' | 'review' | 'block';
  mismatchReasons: string[];
  mergedConfidence: number;
  criticalFields: Array<{ key: string; label: string; status: 'confirmed' | 'review' | 'missing'; reason: string }>;
};

export const TOTAL_CAPTURE_SLOTS: Array<{
  type: Exclude<CardScreenType, 'unknown'>;
  label: string;
  description: string;
  requirement: CaptureRequirement;
}> = [
  { type: 'overview', label: 'Visão geral', description: 'Nome, carta, posição, estilo, nível e GER.', requirement: 'required' },
  { type: 'attributes', label: 'Atributos', description: 'Lista completa de atributos do jogador.', requirement: 'required' },
  { type: 'skills', label: 'Habilidades', description: 'Habilidades nativas e especial da carta.', requirement: 'recommended' },
  { type: 'progression', label: 'Progressão e pontos', description: 'Pontos disponíveis, nível e distribuição atual.', requirement: 'required' },
  { type: 'positions', label: 'Posições jogáveis', description: 'Mapa de posições e afinidades da carta.', requirement: 'optional' }
];

const genericIdentityZones: OcrZone[] = [
  { key: 'name', label: 'Nome do jogador', x: 0.00, y: 0.00, w: 0.58, h: 0.12, enabled: true },
  { key: 'overall', label: 'GER da carta', x: 0.00, y: 0.06, w: 0.28, h: 0.28, enabled: true },
  { key: 'mainPosition', label: 'Posição da carta', x: 0.00, y: 0.08, w: 0.38, h: 0.30, enabled: true },
  { key: 'playstyle', label: 'Estilo de jogo', x: 0.00, y: 0.00, w: 0.70, h: 0.22, enabled: true },
  { key: 'level', label: 'Nível da carta', x: 0.45, y: 0.00, w: 0.55, h: 0.30, enabled: true },
  { key: 'cardType', label: 'Tipo da carta', x: 0.00, y: 0.00, w: 1.00, h: 0.25, enabled: true }
];

export const SCREEN_ZONE_TEMPLATES: Record<Exclude<CardScreenType, 'unknown'>, OcrZone[]> = {
  overview: [
    ...genericIdentityZones,
    { key: 'specialSkill', label: 'Habilidade especial', x: 0.42, y: 0.18, w: 0.57, h: 0.28, enabled: true },
    { key: 'positionGrid', label: 'Resumo de posições', x: 0.58, y: 0.04, w: 0.41, h: 0.34, enabled: true }
  ],
  attributes: [
    { key: 'name', label: 'Identidade no cabeçalho', x: 0.00, y: 0.00, w: 0.58, h: 0.12, enabled: true },
    { key: 'attributes', label: 'Atributos — parte superior', x: 0.00, y: 0.08, w: 1.00, h: 0.46, enabled: true },
    { key: 'attributes', label: 'Atributos — parte inferior', x: 0.00, y: 0.48, w: 1.00, h: 0.50, enabled: true }
  ],
  skills: [
    { key: 'name', label: 'Identidade no cabeçalho', x: 0.00, y: 0.00, w: 0.58, h: 0.12, enabled: true },
    { key: 'skills', label: 'Habilidades — parte superior', x: 0.00, y: 0.08, w: 1.00, h: 0.43, enabled: true },
    { key: 'skills', label: 'Habilidades — parte inferior', x: 0.00, y: 0.47, w: 1.00, h: 0.51, enabled: true },
    { key: 'specialSkill', label: 'Habilidade especial', x: 0.00, y: 0.04, w: 1.00, h: 0.30, enabled: true }
  ],
  progression: [
    { key: 'name', label: 'Identidade no cabeçalho', x: 0.00, y: 0.00, w: 0.58, h: 0.12, enabled: true },
    { key: 'level', label: 'Nível atual e máximo', x: 0.38, y: 0.00, w: 0.62, h: 0.25, enabled: true },
    { key: 'points', label: 'Pontos disponíveis', x: 0.42, y: 0.00, w: 0.58, h: 0.32, enabled: true },
    { key: 'progression', label: 'Categorias de progressão', x: 0.00, y: 0.20, w: 1.00, h: 0.78, enabled: true },
    { key: 'autoTraining', label: 'Ficha automática atual', x: 0.00, y: 0.18, w: 1.00, h: 0.80, enabled: true }
  ],
  positions: [
    { key: 'name', label: 'Identidade no cabeçalho', x: 0.00, y: 0.00, w: 0.58, h: 0.12, enabled: true },
    { key: 'positionGrid', label: 'Mapa completo de posições', x: 0.22, y: 0.04, w: 0.76, h: 0.92, enabled: true },
    { key: 'mainPosition', label: 'Posição principal', x: 0.00, y: 0.04, w: 0.38, h: 0.35, enabled: true }
  ]
};

function normalized(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s+/-]/g, ' ').replace(/\s+/g, ' ').trim();
}

const SCREEN_KEYWORDS: Record<Exclude<CardScreenType, 'unknown'>, string[]> = {
  overview: ['estilo de jogo', 'nivel maximo', 'detalhes do jogador', 'tipo de carta', 'ger', 'overall'],
  attributes: ['atributos', 'finalizacao', 'passe rasteiro', 'passe alto', 'controle de bola', 'talento defensivo', 'agressividade', 'resistencia'],
  skills: ['habilidades do jogador', 'habilidades', 'toque duplo', 'passe de primeira', 'interceptacao', 'bloqueador', 'marcacao individual'],
  progression: ['progresso do jogador', 'pontos de progresso', 'pontos disponiveis', 'finalizacao', 'passe', 'drible', 'destreza', 'forca das pernas', 'bola aerea', 'defendendo'],
  positions: ['posicoes jogaveis', 'afinidade de posicao', 'posicao jogavel', 'goleiro', 'zagueiro', 'lateral', 'volante', 'meia', 'atacante']
};

export function detectCardScreenType(text: string, fileName = ''): { type: CardScreenType; confidence: number; scores: Record<CardScreenType, number> } {
  const source = normalized(`${fileName} ${text}`);
  const scores: Record<CardScreenType, number> = { overview: 0, attributes: 0, skills: 0, progression: 0, positions: 0, unknown: 0 };
  for (const [type, words] of Object.entries(SCREEN_KEYWORDS) as Array<[Exclude<CardScreenType, 'unknown'>, string[]]>) {
    for (const word of words) {
      if (source.includes(normalized(word))) scores[type] += word.includes(' ') ? 3 : 1;
    }
  }
  if (/\b(99|100|101|102|103|104|105|106|107|108|109|110)\b/.test(source)) scores.overview += 1;
  if ((source.match(/\b\d{2,3}\b/g) ?? []).length >= 10) scores.attributes += 4;
  if ((source.match(/\+\s*\d+/g) ?? []).length >= 3) scores.progression += 4;
  const ordered = (Object.entries(scores) as Array<[CardScreenType, number]>).filter(([key]) => key !== 'unknown').sort((a, b) => b[1] - a[1]);
  const [bestType, best] = ordered[0] ?? ['unknown', 0];
  const second = ordered[1]?.[1] ?? 0;
  if (best <= 1) return { type: 'unknown', confidence: 20, scores };
  const confidence = Math.max(35, Math.min(99, Math.round(55 + best * 5 + Math.max(0, best - second) * 4)));
  return { type: bestType, confidence, scores };
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

export function extractCaptureIdentity(text: string): CaptureIdentity {
  const playerName = firstMatch(text, [
    /(?:NOME DO JOGADOR|NOME)\s*[:=\-]\s*([^\n]{2,45})/i,
    /(?:JOGADOR)\s*[:=\-]\s*([^\n]{2,45})/i
  ]);
  const position = firstMatch(text, [
    /(?:POSIÇÃO PRINCIPAL|POSICAO PRINCIPAL|POSIÇÃO|POSICAO)\s*[:=\-]\s*([A-Z]{2,4})/i,
    /\b(GK|CB|LB|RB|DMF|CMF|LMF|RMF|AMF|LWF|RWF|SS|CF|GOL|ZAG|LE|LD|VOL|MLG|MAT|SA|CA)\b/i
  ]);
  const overallRaw = firstMatch(text, [/(?:GER|OVERALL)\s*[:=\-]?\s*(\d{2,3})/i]);
  const levelRaw = firstMatch(text, [/(?:NÍVEL(?: MÁXIMO)?|NIVEL(?: MAXIMO)?)\s*[:=\-]?\s*(\d{1,2})/i]);
  const cardType = firstMatch(text, [/(?:TIPO DA CARTA|TIPO)\s*[:=\-]\s*([^\n]{2,30})/i]);
  return {
    playerName,
    position: position?.toUpperCase() ?? null,
    overall: overallRaw ? Number(overallRaw) : null,
    level: levelRaw ? Number(levelRaw) : null,
    cardType
  };
}

function identityToken(value: string | null) {
  return normalized(value ?? '').replace(/\s/g, '');
}

export function compareCaptureIdentities(captures: Array<{ label: string; identity: CaptureIdentity }>) {
  const reasons: string[] = [];
  let severity = 0;
  const names = captures.map((capture) => ({ label: capture.label, value: identityToken(capture.identity.playerName) })).filter((item) => item.value.length >= 3);
  const positions = captures.map((capture) => ({ label: capture.label, value: identityToken(capture.identity.position) })).filter((item) => item.value);
  const cardTypes = captures.map((capture) => ({ label: capture.label, value: identityToken(capture.identity.cardType) })).filter((item) => item.value.length >= 3);
  const compareValues = (items: Array<{ label: string; value: string }>, field: string, weight: number) => {
    const unique = Array.from(new Set(items.map((item) => item.value)));
    if (unique.length > 1) {
      reasons.push(`${field} divergente entre os prints: ${items.map((item) => `${item.label}=${item.value}`).join(' • ')}`);
      severity += weight;
    }
  };
  compareValues(names, 'Nome', 3);
  compareValues(cardTypes, 'Tipo da carta', 2);
  compareValues(positions, 'Posição', 1);
  return {
    risk: severity >= 3 ? 'block' as const : severity > 0 ? 'review' as const : 'none' as const,
    reasons
  };
}

export function chooseBestZoneReading(readings: PremiumZoneReading[]): PremiumZoneReading {
  const ordered = [...readings].sort((a, b) => {
    const textBonusA = Math.min(20, a.text.trim().length / 18);
    const textBonusB = Math.min(20, b.text.trim().length / 18);
    return (b.confidence + textBonusB) - (a.confidence + textBonusA);
  });
  const best = ordered[0];
  const alternatives = ordered.slice(1).map((item) => ({ text: item.text, confidence: item.confidence, enhancement: item.enhancement }));
  return {
    ...best,
    passCount: readings.length,
    alternatives,
    consistency: readings.length <= 1 ? 100 : Math.max(0, Math.round(100 - Math.abs(readings[0].confidence - readings[1].confidence)))
  };
}

export function buildTotalReadingSession(captures: CaptureReadingAudit[], mergedText: string): TotalReadingSession {
  const mismatch = compareCaptureIdentities(captures);
  const presentTypes = new Set(captures.map((capture) => capture.detectedType === 'unknown' ? capture.declaredType : capture.detectedType));
  const coverage = TOTAL_CAPTURE_SLOTS.map((slot) => ({
    type: slot.type,
    label: slot.label,
    present: presentTypes.has(slot.type),
    required: slot.requirement === 'required'
  }));
  const missingCriticalScreens = coverage.filter((item) => item.required && !item.present).map((item) => item.label);
  const source = normalized(mergedText);
  const hasName = /nome do jogador|\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÀ-ÿ' -]{2,}\b/.test(mergedText);
  const hasPosition = /posi[cç][aã]o|\b(GK|CB|LB|RB|DMF|CMF|LMF|RMF|AMF|LWF|RWF|SS|CF|GOL|ZAG|LE|LD|VOL|MLG|MAT|SA|CA)\b/i.test(mergedText);
  const hasStyle = source.includes('estilo de jogo') || source.includes('orquestrador') || source.includes('primeiro volante') || source.includes('armador criativo') || source.includes('artilheiro');
  const hasPoints = /pontos (?:totais|disponiveis|de progresso)|PONTOS TOTAIS/i.test(mergedText);
  const hasAttributes = (source.match(/finalizacao|passe rasteiro|controle de bola|talento defensivo|resistencia/g) ?? []).length >= 2;
  const hasSkills = source.includes('habilidades') || source.includes('interceptacao') || source.includes('toque duplo');
  const criticalFields: TotalReadingSession['criticalFields'] = [
    { key: 'name', label: 'Nome', status: hasName ? 'confirmed' : 'missing', reason: hasName ? 'Identidade encontrada em pelo menos uma tela.' : 'Nome não encontrado com segurança.' },
    { key: 'position', label: 'Posição principal', status: hasPosition ? 'confirmed' : 'missing', reason: hasPosition ? 'Posição detectada ou disponível para confirmação.' : 'Posição principal precisa ser confirmada.' },
    { key: 'style', label: 'Estilo de jogo', status: hasStyle ? 'confirmed' : 'review', reason: hasStyle ? 'Estilo localizado na leitura combinada.' : 'Estilo não apareceu com clareza; confirme manualmente.' },
    { key: 'points', label: 'Pontos disponíveis', status: hasPoints ? 'confirmed' : 'review', reason: hasPoints ? 'Orçamento encontrado na tela de progressão.' : 'Confirme o total de pontos antes da ficha final.' },
    { key: 'attributes', label: 'Atributos', status: hasAttributes ? 'confirmed' : 'review', reason: hasAttributes ? 'Lista de atributos reconhecida.' : 'Poucos atributos foram reconhecidos.' },
    { key: 'skills', label: 'Habilidades', status: hasSkills ? 'confirmed' : 'review', reason: hasSkills ? 'Tela de habilidades incorporada.' : 'Habilidades não confirmadas; a ficha ainda pode ser feita sem sugerir duplicatas com total segurança.' }
  ];
  const confidenceValues = captures.map((capture) => capture.confidence).filter(Number.isFinite);
  const mergedConfidence = confidenceValues.length ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length) : 0;
  return {
    captures,
    coverage,
    missingCriticalScreens,
    mismatchRisk: mismatch.risk,
    mismatchReasons: mismatch.reasons,
    mergedConfidence,
    criticalFields
  };
}

export function zoneWidthTarget(key: OcrZoneKey) {
  if (key === 'attributes' || key === 'skills' || key === 'progression' || key === 'positionGrid' || key === 'autoTraining') return 2550;
  if (key === 'points' || key === 'level' || key === 'overall') return 2100;
  return 2250;
}

export function enhancementLabel(mode: PremiumEnhancementMode) {
  if (mode === 'sharp') return 'nitidez';
  if (mode === 'contrast') return 'contraste';
  if (mode === 'adaptive') return 'adaptativo';
  return 'original';
}
