import { createZoneOriginPreview, type OcrZone, type OcrZoneKey } from '@/lib/ocr';
import type { PremiumEnhancementMode, PremiumZoneReading } from '@/lib/premiumReading';
import { recognizeWithOcrWorker, type OcrFieldKind } from '@/lib/ocrWorkerManager';
import { cropImage, expandOcrRegion, type ImageEnhancement } from './imageProcessing';
import { adaptiveZoneVariants } from './adaptiveZoneSearch';
import { extractCanonicalSkillsFromText } from '@/lib/officialSkillIdentity';

export const HIGH_PRECISION_OCR_VERSION = '32.00-visual-calibration-strict-skills-1';

export type PrecisionPass = {
  enhancement: ImageEnhancement;
  kind: OcrFieldKind;
  expanded?: boolean;
};

export type PrecisionZoneOptions = {
  imageHash: string;
  template: string;
  targetWidth: number;
  readingMode: 'balanced' | 'precision' | 'fast';
  knownPlayerNames?: string[];
  labelPrefix?: string;
};

type ScoredPass = {
  text: string;
  rawText: string;
  confidence: number;
  enhancement: PremiumEnhancementMode;
  kind: OcrFieldKind;
  normalized: string;
  structureScore: number;
  lexiconMatch?: string;
  regionId: string;
  regionLabel: string;
  regionPriority: number;
};

const NAME_BLOCKLIST = [
  'detalhes do jogador', 'modelo de jogador', 'nivel', 'nível', 'overall', 'ger', 'atributos',
  'habilidades', 'posição', 'posicao', 'estilo de jogo', 'pior pé', 'condição física',
  'resistência', 'manager', 'técnico', 'tecnico', 'peso', 'idade', 'altura', 'carta',
  'talento ofensivo', 'talento defensivo', 'finalização', 'finalizacao', 'velocidade',
  'aceleração', 'aceleracao', 'passe rasteiro', 'passe alto', 'controle de bola'
];

const POSITION_TOKENS = new Set([
  'GK', 'GOL', 'CB', 'ZAG', 'LB', 'LE', 'RB', 'LD', 'DMF', 'VOL', 'CMF', 'MLG',
  'LMF', 'RMF', 'AMF', 'MAT', 'LWF', 'PE', 'RWF', 'PD', 'SS', 'SA', 'CF', 'CA'
]);

const STYLE_TOKENS = [
  'artilheiro', 'homem de área', 'homem de area', 'pivô', 'pivo', 'armador criativo',
  'infiltração', 'infiltracao', 'orquestrador', 'destruidor', 'lateral defensivo',
  'lateral ofensivo', 'clássico 10', 'classico 10', 'primeiro volante', '1º volante',
  'defensor criativo', 'goleiro ofensivo', 'goleiro defensivo', 'ala produtivo'
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeOcrText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[|¦]/g, 'I')
    .replace(/[“”„]/g, '"')
    .replace(/[’`´]/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

function comparable(value: string) {
  return normalizeOcrText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(value: string) {
  return comparable(value).replace(/\s+/g, '');
}

function levenshtein(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array<number>(right.length + 1);
  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }
  return previous[right.length];
}

export function textSimilarity(left: string, right: string) {
  const a = compact(left);
  const b = compact(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const distance = levenshtein(a, b);
  return clamp(1 - distance / Math.max(a.length, b.length), 0, 1);
}

function titleCaseName(value: string) {
  const particles = new Set(['da', 'de', 'do', 'das', 'dos', 'del', 'della', 'di', 'van', 'von', 'le', 'la']);
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => index > 0 && particles.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/\bD'([a-zà-ÿ])/g, (_, letter: string) => `D'${letter.toUpperCase()}`)
    .replace(/\bO'([a-zà-ÿ])/g, (_, letter: string) => `O'${letter.toUpperCase()}`);
}

function nameLineCandidates(text: string) {
  const lines = normalizeOcrText(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const candidates: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine
      .replace(/^(?:nome(?:\s+do\s+jogador)?|jogador)\s*[:=.-]?\s*/i, '')
      .replace(/^[^A-Za-zÀ-ÿ]+|[^A-Za-zÀ-ÿ.' -]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const norm = comparable(line);
    const words = line.split(/\s+/).filter(Boolean);
    const letters = (line.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
    const letterRatio = letters / Math.max(1, line.length);
    if (line.length < 3 || line.length > 52 || words.length > 6 || letterRatio < 0.68) continue;
    if (/\d/.test(line)) continue;
    if (NAME_BLOCKLIST.some((blocked) => norm.includes(comparable(blocked)))) continue;
    if (STYLE_TOKENS.some((style) => norm === comparable(style))) continue;
    if (words.length === 1 && POSITION_TOKENS.has(words[0].toUpperCase())) continue;
    candidates.push(titleCaseName(line));
  }
  if (!candidates.length) {
    const inline = normalizeOcrText(text)
      .replace(/^(?:nome(?:\s+do\s+jogador)?|jogador)\s*[:=.-]?\s*/i, '')
      .replace(/[^A-Za-zÀ-ÿ.' -]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (inline.length >= 3 && inline.length <= 52) candidates.push(titleCaseName(inline));
  }
  return Array.from(new Set(candidates));
}

function nearestKnownName(value: string, knownNames: string[]) {
  let best: { name: string; similarity: number } | null = null;
  for (const name of knownNames) {
    if (!name.trim()) continue;
    const similarity = textSimilarity(value, name);
    if (!best || similarity > best.similarity) best = { name, similarity };
  }
  if (!best) return null;
  const threshold = Math.min(compact(value).length, compact(best.name).length) <= 8 ? 0.94 : 0.90;
  return best.similarity >= threshold ? best : null;
}

function repairNumericText(text: string) {
  return normalizeOcrText(text)
    .replace(/(?<=\d)[Oo](?=\d|\b)/g, '0')
    .replace(/\b[Oo](?=\d)/g, '0')
    .replace(/(?<=\d)[Il](?=\d|\b)/g, '1')
    .replace(/(?<=\d)[Ss](?=\d|\b)/g, '5')
    .replace(/(?<=\d)[Bb](?=\d|\b)/g, '8');
}

function repairByZone(text: string, key: OcrZoneKey, knownNames: string[]) {
  const normalized = normalizeOcrText(text);
  if (key === 'overall' || key === 'level' || key === 'points') return repairNumericText(normalized);
  if (key === 'name') {
    const candidates = nameLineCandidates(normalized);
    if (!candidates.length) return normalized;
    const best = candidates[0];
    const lexicon = nearestKnownName(best, knownNames);
    return lexicon ? lexicon.name : best;
  }
  if (key === 'skills') {
    // O texto bruto nunca chega ao resultado como nome de habilidade. A
    // extração separa duas cápsulas coladas e devolve somente nomes oficiais.
    return extractCanonicalSkillsFromText(normalized).join('\n');
  }
  return normalized
    .replace(/Talen[tl]o\s+ofens[ií]vo/gi, 'Talento ofensivo')
    .replace(/Talen[tl]o\s+defens[ií]vo/gi, 'Talento defensivo')
    .replace(/Finaliza[cç][aã]0/gi, 'Finalização')
    .replace(/Acelera[cç][aã]0/gi, 'Aceleração')
    .replace(/Resist[eê]ncia\s+a\s+les[aã]0/gi, 'Resistência à lesão')
    .replace(/Condi[cç][aã]0\s+f[ií]sica/gi, 'Condição física');
}

function structureScore(key: OcrZoneKey, text: string) {
  const clean = normalizeOcrText(text);
  if (!clean) return -30;
  if (key === 'name') {
    const candidates = nameLineCandidates(clean);
    if (!candidates.length) return -28;
    const candidate = candidates[0];
    const words = candidate.split(/\s+/).length;
    return 12 + (words >= 2 && words <= 4 ? 10 : 4) + Math.min(8, candidate.length / 5);
  }
  if (key === 'overall') {
    const values = Array.from(clean.matchAll(/\b(\d{2,3})\b/g)).map((match) => Number(match[1]));
    return values.some((value) => value >= 40 && value <= 120) ? 18 : -20;
  }
  if (key === 'level') {
    const values = Array.from(clean.matchAll(/\b(\d{1,2})\b/g)).map((match) => Number(match[1]));
    return values.some((value) => value >= 1 && value <= 99) ? 17 : -18;
  }
  if (key === 'points') {
    const values = Array.from(clean.matchAll(/\b(\d{1,3})\b/g)).map((match) => Number(match[1]));
    return values.some((value) => value >= 0 && value <= 200) ? 17 : -18;
  }
  if (key === 'mainPosition') {
    const tokens = clean.toUpperCase().split(/\s+/);
    return tokens.some((token) => POSITION_TOKENS.has(token)) ? 18 : -14;
  }
  if (key === 'attributes' || key === 'positionGrid' || key === 'physicalModel') {
    const numericRows = clean.split(/\r?\n/).filter((line) => /\d{1,3}(?:[,.]\d+)?/.test(line)).length;
    return Math.min(24, numericRows * 2.2);
  }
  if (key === 'skills') {
    const official = extractCanonicalSkillsFromText(clean);
    return official.length ? Math.min(28, 10 + official.length * 6) : -26;
  }
  return Math.min(14, clean.length / 25);
}

function passPlan(key: OcrZoneKey, mode: 'balanced' | 'precision' | 'fast'): PrecisionPass[] {
  if (mode !== 'precision') {
    if (key === 'name') return [
      { enhancement: 'contrast', kind: 'name' },
      { enhancement: 'sharp', kind: 'name' }
    ];
    if (key === 'overall' || key === 'level' || key === 'points') return [
      { enhancement: 'contrast', kind: 'numeric' },
      { enhancement: 'binary', kind: 'numeric' }
    ];
    return [
      { enhancement: 'contrast', kind: key === 'attributes' ? 'table' : key === 'skills' ? 'skills' : 'general' },
      { enhancement: 'sharp', kind: key === 'attributes' ? 'table' : key === 'skills' ? 'skills' : 'general' }
    ];
  }

  if (key === 'name') return [
    { enhancement: 'color', kind: 'name' },
    { enhancement: 'contrast', kind: 'name' },
    { enhancement: 'sharp', kind: 'name' },
    { enhancement: 'binary', kind: 'name' },
    { enhancement: 'contrast', kind: 'nameSparse', expanded: true }
  ];
  if (key === 'overall' || key === 'level' || key === 'points') return [
    { enhancement: 'contrast', kind: 'numeric' },
    { enhancement: 'sharp', kind: 'numeric' },
    { enhancement: 'binary', kind: 'numeric' },
    { enhancement: 'inverted', kind: 'numeric' }
  ];
  if (key === 'mainPosition') return [
    { enhancement: 'color', kind: 'position' },
    { enhancement: 'contrast', kind: 'position' },
    { enhancement: 'binary', kind: 'position' }
  ];
  if (key === 'attributes' || key === 'positionGrid' || key === 'physicalModel' || key === 'progression' || key === 'autoTraining') return [
    { enhancement: 'color', kind: 'table' },
    { enhancement: 'contrast', kind: 'table' },
    { enhancement: 'sharp', kind: 'table' },
    { enhancement: 'binary', kind: 'table' },
    { enhancement: 'contrast', kind: 'tableSparse', expanded: true }
  ];
  if (key === 'skills') return [
    { enhancement: 'color', kind: 'skills' },
    { enhancement: 'contrast', kind: 'skills' },
    { enhancement: 'sharp', kind: 'skills' }
  ];
  if (key === 'impetos') return [
    { enhancement: 'color', kind: 'style' },
    { enhancement: 'contrast', kind: 'style' },
    { enhancement: 'sharp', kind: 'style' }
  ];
  return [
    { enhancement: 'color', kind: key === 'playstyle' ? 'style' : 'general' },
    { enhancement: 'contrast', kind: key === 'playstyle' ? 'style' : 'general' },
    { enhancement: 'sharp', kind: key === 'playstyle' ? 'style' : 'general' }
  ];
}

function clusterPasses(key: OcrZoneKey, passes: ScoredPass[]) {
  const clusters: ScoredPass[][] = [];
  for (const pass of passes.filter((item) => item.text.trim())) {
    let cluster = clusters.find((items) => {
      const representative = items[0];
      const threshold = key === 'name' ? 0.82 : key === 'attributes' || key === 'skills' || key === 'physicalModel' ? 0.72 : 0.92;
      return textSimilarity(representative.text, pass.text) >= threshold;
    });
    if (!cluster) {
      cluster = [];
      clusters.push(cluster);
    }
    cluster.push(pass);
  }
  return clusters;
}

function selectBestPass(key: OcrZoneKey, passes: ScoredPass[]) {
  const clusters = clusterPasses(key, passes);
  const ranked = clusters.map((cluster) => {
    const averageConfidence = cluster.reduce((sum, pass) => sum + pass.confidence, 0) / cluster.length;
    const averageStructure = cluster.reduce((sum, pass) => sum + pass.structureScore, 0) / cluster.length;
    const uniqueModes = new Set(cluster.map((pass) => pass.enhancement)).size;
    const uniqueRegions = new Set(cluster.map((pass) => pass.regionId)).size;
    const agreementBonus = Math.min(27, Math.max(0, (uniqueModes - 1) * 6 + (uniqueRegions - 1) * 5));
    const lexiconBonus = cluster.some((pass) => pass.lexiconMatch) ? 8 : 0;
    const regionBonus = Math.max(0, Math.min(5, (cluster.reduce((sum, pass) => sum + pass.regionPriority, 0) / cluster.length - 88) / 2));
    const score = clamp(averageConfidence * 0.73 + averageStructure + agreementBonus + lexiconBonus + regionBonus);
    const representative = [...cluster].sort((left, right) => (right.confidence + right.structureScore + right.regionPriority / 10) - (left.confidence + left.structureScore + left.regionPriority / 10))[0];
    return { cluster, representative, score, uniqueModes, uniqueRegions };
  }).sort((left, right) => right.score - left.score);
  return ranked[0] ?? null;
}

function requiredAgreement(key: OcrZoneKey) {
  if (key === 'name') return 2;
  if (key === 'overall' || key === 'level' || key === 'points' || key === 'mainPosition') return 2;
  return 1;
}

export async function recognizeZoneWithHighPrecision(
  file: File | Blob,
  zone: OcrZone,
  options: PrecisionZoneOptions
): Promise<PremiumZoneReading> {
  const knownNames = Array.from(new Set((options.knownPlayerNames ?? []).map((name) => name.trim()).filter(Boolean)));
  const plans = passPlan(zone.key, options.readingMode);
  const variants = adaptiveZoneVariants(zone, options.readingMode);
  const zoneSignature = `${zone.key}:${zone.label}:${zone.x.toFixed(5)}:${zone.y.toFixed(5)}:${zone.w.toFixed(5)}:${zone.h.toFixed(5)}`;
  const originPreview = await createZoneOriginPreview(file, zone).catch(() => null);
  const scoredPasses: ScoredPass[] = [];
  const tasks = variants.flatMap((variant, variantIndex) => {
    const selectedPlans = variantIndex === 0
      ? plans
      : variantIndex === 1
        ? plans.slice(0, Math.min(2, plans.length))
        : plans.slice(0, 1);
    return selectedPlans.map((plan) => ({ variant, plan }));
  });

  for (let index = 0; index < tasks.length; index += 1) {
    const { variant, plan } = tasks[index];
    const baseRegion = plan.expanded ? expandOcrRegion(variant.zone, zone.key === 'name' ? 0.06 : 0.025, zone.key === 'name' ? 0.025 : 0.015) : variant.zone;
    const effectiveTargetWidth = zone.key === 'skills' ? Math.max(options.targetWidth, 2200) : options.targetWidth;
    const image = await cropImage(file, baseRegion, effectiveTargetWidth, plan.enhancement);
    const recognition = await recognizeWithOcrWorker(image, {
      label: `${options.labelPrefix ? `${options.labelPrefix} • ` : ''}${zone.label} • ${variant.label} • ${plan.enhancement} ${index + 1}/${tasks.length}`,
      kind: plan.kind,
      cacheKey: `${HIGH_PRECISION_OCR_VERSION}:${options.imageHash}:${options.template}:${zoneSignature}:${variant.id}:${plan.enhancement}:${plan.kind}:${plan.expanded ? 'expanded' : 'exact'}`
    });
    const repaired = repairByZone(recognition.text, zone.key, knownNames);
    const nameCandidate = zone.key === 'name' ? nameLineCandidates(repaired)[0] : undefined;
    const lexicon = zone.key === 'name' && nameCandidate ? nearestKnownName(nameCandidate, knownNames) : null;
    const text = lexicon?.name ?? repaired;
    scoredPasses.push({
      text,
      rawText: recognition.text,
      confidence: recognition.confidence,
      enhancement: plan.enhancement,
      kind: plan.kind,
      normalized: comparable(text),
      structureScore: structureScore(zone.key, text),
      regionId: variant.id,
      regionLabel: variant.label,
      regionPriority: variant.priority,
      ...(lexicon ? { lexiconMatch: lexicon.name } : {})
    });

    if (scoredPasses.length >= 3) {
      const interim = selectBestPass(zone.key, scoredPasses);
      const critical = zone.key === 'name' || zone.key === 'overall' || zone.key === 'level' || zone.key === 'points' || zone.key === 'mainPosition' || zone.key === 'playstyle';
      const enoughPasses = zone.key === 'name' ? scoredPasses.length >= 5 : true;
      const targetScore = zone.key === 'name' ? 95 : critical ? 93 : 89;
      const regionAgreement = interim?.uniqueRegions ?? 0;
      if (interim && enoughPasses && interim.uniqueModes >= 2 && regionAgreement >= (zone.key === 'name' ? 2 : 1) && interim.cluster.length >= 2 && interim.score >= targetScore) break;
    }
  }

  const selection = selectBestPass(zone.key, scoredPasses);
  const representative = selection?.representative ?? scoredPasses[0];
  let text = representative?.text ?? '';
  const uniqueAgreement = selection?.uniqueModes ?? 0;
  const regionAgreement = selection?.uniqueRegions ?? 0;
  const required = requiredAgreement(zone.key);
  const finalConfidence = selection ? Math.round(selection.score) : 0;
  const disagreement = selection && scoredPasses.length > selection.cluster.length;
  const strictConfirmed = Boolean(text.trim())
    && finalConfidence >= (zone.key === 'name' ? 92 : zone.key === 'overall' || zone.key === 'level' || zone.key === 'points' ? 90 : 86)
    && uniqueAgreement >= required
    && regionAgreement >= (zone.key === 'name' ? 2 : 1)
    && !(zone.key === 'name' && disagreement && selection.cluster.length === 1);
  const conflictingName = zone.key === 'name' && Boolean(selection) && (selection?.cluster.length ?? 0) < 2 && scoredPasses.filter((pass) => pass.text.trim()).length >= 2;
  if (conflictingName && !representative?.lexiconMatch) text = '';
  const status = strictConfirmed ? 'confirmed' as const : text.trim() ? 'review' as const : 'unread' as const;
  const consistency = scoredPasses.length
    ? Math.round(((selection?.cluster.length ?? 0) / scoredPasses.length) * 100)
    : 0;
  const notes: string[] = [];
  notes.push(`${scoredPasses.length} passagem(ns) local(is) comparadas; ${uniqueAgreement} tratamento(s) e ${regionAgreement} enquadramento(s) concordaram.`);
  if (representative?.lexiconMatch) notes.push(`Nome conciliado com histórico confirmado: ${representative.lexiconMatch}.`);
  if (!strictConfirmed && zone.key === 'name') notes.push(text ? 'Nome mantido para revisão porque a meta de consenso quase total não foi atingida.' : 'Nome não foi preenchido automaticamente: os recortes divergiram e o app preferiu bloquear a inventar outro jogador.');
  if (disagreement) notes.push('Foram detectadas leituras divergentes; o app escolheu o grupo com maior consenso e preservou as alternativas.');

  return {
    id: `${options.imageHash}-${zoneSignature.replace(/[^a-z0-9]+/gi, '-')}-precision`,
    sourceId: options.imageHash,
    sourceLabel: options.labelPrefix || 'Print único',
    screenType: options.template,
    key: zone.key,
    label: zone.label,
    text,
    confidence: finalConfidence,
    status,
    originPreview,
    enhancement: representative?.enhancement ?? 'contrast',
    passCount: scoredPasses.length,
    consistency,
    agreement: uniqueAgreement,
    precisionVersion: HIGH_PRECISION_OCR_VERSION,
    validationNotes: notes,
    alternatives: scoredPasses
      .filter((pass) => pass !== representative && pass.text.trim())
      .sort((left, right) => (right.confidence + right.structureScore) - (left.confidence + left.structureScore))
      .slice(0, 5)
      .map((pass) => ({ text: pass.text, confidence: clamp(Math.round(pass.confidence + pass.structureScore / 3)), enhancement: pass.enhancement })),
    rawPasses: scoredPasses.map((pass) => ({ text: pass.rawText, confidence: pass.confidence, enhancement: pass.enhancement, kind: `${pass.kind}:${pass.regionId}` }))
  };
}

export function precisionAccuracyEstimate(readings: PremiumZoneReading[]) {
  const critical = readings.filter((reading) => ['name', 'overall', 'mainPosition', 'playstyle', 'level', 'points'].includes(reading.key));
  const all = readings.filter((reading) => reading.text.trim());
  const weighted = [...critical.map((reading) => ({ reading, weight: 2.4 })), ...all.filter((reading) => !critical.includes(reading)).map((reading) => ({ reading, weight: 1 }))];
  if (!weighted.length) return 0;
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const score = weighted.reduce((sum, item) => {
    const agreement = item.reading.agreement ?? 1;
    const consistency = item.reading.consistency ?? 0;
    const statusPenalty = item.reading.status === 'confirmed' ? 0 : item.reading.status === 'review' ? 13 : 35;
    const local = clamp(item.reading.confidence * 0.72 + consistency * 0.2 + Math.min(8, agreement * 2) - statusPenalty);
    return sum + local * item.weight;
  }, 0) / totalWeight;
  return Math.round(clamp(score));
}

export function precisionBlockingReasons(readings: PremiumZoneReading[]) {
  const reasons: string[] = [];
  const get = (key: OcrZoneKey) => readings.filter((reading) => reading.key === key).sort((a, b) => b.confidence - a.confidence)[0];
  const name = get('name');
  if (!name?.text.trim()) reasons.push('Nome não encontrado.');
  else if (name.status !== 'confirmed' || name.confidence < 92 || (name.agreement ?? 0) < 2) reasons.push('Nome sem consenso suficiente entre as passagens locais.');
  for (const [key, label] of [['mainPosition', 'Posição'], ['playstyle', 'Estilo'], ['level', 'Nível']] as const) {
    const reading = get(key);
    if (!reading?.text.trim()) reasons.push(`${label} não encontrado.`);
    else if (reading.status !== 'confirmed') reasons.push(`${label} precisa de confirmação.`);
  }
  return reasons;
}
