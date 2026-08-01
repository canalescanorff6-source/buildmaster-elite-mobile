import type {
  ParsedCard,
  PositionCode,
  PrecisionIssue,
  PrecisionValidation,
  StructuralFieldConfidence,
  StructuralPrecisionAnalysis,
  StructuralSkillInventory,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import { TRAINING_KEYS, trainingPlanCost, trainingPlanTotalCost } from './trainingPlanCore';
import { canonicalizeSkillList, skillIdentityKey } from './officialSkillIdentity';

export const STRUCTURAL_PRECISION_VERSION = '37.40.0' as const;

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function stableHash(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function sourceConfidence(source: ParsedCard['trainingPointSource']) {
  if (source === 'MANUAL') return 100;
  if (source === 'TRAINING_READ') return 96;
  if (source === 'OCR') return 88;
  if (source === 'LEVEL_INFERRED') return 72;
  return 20;
}

function fieldStatus(confidence: number, critical: boolean): StructuralFieldConfidence['status'] {
  if (critical && confidence < 70) return 'blocked';
  if (confidence < 85) return 'review';
  return 'confirmed';
}

function field(
  key: StructuralFieldConfidence['key'],
  label: string,
  value: string,
  confidence: number,
  source: StructuralFieldConfidence['source'],
  critical: boolean,
  reason: string
): StructuralFieldConfidence {
  const score = clamp(confidence);
  return { key, label, value, confidence: score, status: fieldStatus(score, critical), source, critical, reason };
}

function uniqueInventory(parsed: ParsedCard): StructuralSkillInventory {
  const categories = {
    native: canonicalizeSkillList(parsed.nativeSkills ?? []),
    additional: canonicalizeSkillList(parsed.additionalSkills ?? []),
    special: canonicalizeSkillList(parsed.specialSkills ?? [])
  };
  const seen = new Map<string, { name: string; categories: number }>();
  for (const skills of [categories.native, categories.additional, categories.special]) {
    for (const name of skills) {
      const key = skillIdentityKey(name);
      const current = seen.get(key);
      seen.set(key, { name, categories: (current?.categories ?? 0) + 1 });
    }
  }
  const duplicatesRemoved = [...seen.values()].filter((item) => item.categories > 1).map((item) => item.name);
  const specialKeys = new Set(categories.special.map(skillIdentityKey));
  const additionalKeys = new Set(categories.additional.map(skillIdentityKey));
  const native = categories.native.filter((name) => !specialKeys.has(skillIdentityKey(name)) && !additionalKeys.has(skillIdentityKey(name)));
  const additional = categories.additional.filter((name) => !specialKeys.has(skillIdentityKey(name)));
  const slotsUsed = Math.min(5, additional.length);
  return {
    native,
    additional,
    special: categories.special,
    duplicatesRemoved,
    slotsUsed,
    slotsRemaining: Math.max(0, 5 - slotsUsed),
    source: parsed.evidence.skillSource ?? 'none',
    confidence: clamp(parsed.evidence.skillConfidence ?? (seen.size ? 65 : 20))
  };
}

function pointAudit(parsed: ParsedCard, training: TrainingPlan, budget: number, targetPosition: PositionCode) {
  const actualCost = trainingPlanTotalCost(training);
  const remaining = budget - actualCost;
  const invalidGroups: string[] = [];
  for (const key of TRAINING_KEYS) {
    const level = Number(training[key] ?? 0);
    if (!Number.isInteger(level) || level < 0 || level > 16) invalidGroups.push(key);
  }
  if (targetPosition === 'GK') {
    const lineInvestment = (['shooting', 'passing', 'dribbling', 'dexterity', 'defending'] as TrainingKey[])
      .filter((key) => Number(training[key] ?? 0) > 0);
    invalidGroups.push(...lineInvestment.map((key) => `GK:${key}`));
  } else {
    const goalkeeperInvestment = (['gk1', 'gk2', 'gk3'] as TrainingKey[])
      .filter((key) => Number(training[key] ?? 0) > 0);
    invalidGroups.push(...goalkeeperInvestment.map((key) => `LINHA:${key}`));
  }
  const costByGroup = trainingPlanCost(training);
  const signature = TRAINING_KEYS.map((key) => `${key}:${training[key]}:${costByGroup[key]}`).join('|');
  return {
    budget,
    actualCost,
    remaining,
    exact: actualCost === budget && invalidGroups.length === 0,
    source: parsed.trainingPointSource,
    sourceConfidence: sourceConfidence(parsed.trainingPointSource),
    costByGroup,
    invalidGroups: Array.from(new Set(invalidGroups)),
    signature: `points-${stableHash(signature)}`
  };
}

function attributeSignature(parsed: ParsedCard) {
  return Object.entries(parsed.attributes)
    .filter(([, value]) => Number.isFinite(value))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${Math.round(Number(value))}`)
    .join('|');
}

export function buildStructuralPrecisionAnalysis(parsed: ParsedCard, training: TrainingPlan, budget: number, targetPosition: PositionCode = parsed.mainPosition): StructuralPrecisionAnalysis {
  const skills = uniqueInventory(parsed);
  const points = pointAudit(parsed, training, budget, targetPosition);
  const attributeCount = parsed.evidence.attributeCount;
  const manual = parsed.manualConfirmed;

  const fields: StructuralFieldConfidence[] = [
    field('playerName', 'Nome do jogador', parsed.playerName, manual ? 100 : parsed.playerName !== 'Jogador não identificado' ? 92 : 10, manual ? 'manual' : 'ocr', true, 'O nome participa da identidade canônica da versão da carta.'),
    field('cardType', 'Tipo da carta', parsed.cardType || 'Não identificado', manual && parsed.cardType ? 96 : parsed.cardType ? 78 : 35, manual ? 'manual' : parsed.cardType ? 'ocr' : 'fallback', false, 'O tipo ajuda a separar versões diferentes do mesmo jogador.'),
    field('mainPosition', 'Posição registrada', parsed.mainPositionPt, parsed.evidence.positionLocked || manual ? 100 : parsed.evidence.positionRatingsCount >= 2 ? 88 : clamp(parsed.confidence - 8), parsed.evidence.positionLocked || manual ? 'manual' : 'ocr', true, 'A posição registrada não pode ser substituída pela posição escolhida para a ficha.'),
    field('playstyle', 'Estilo de jogo', parsed.playstyle || 'Não identificado', parsed.evidence.playstyleLocked || manual ? 100 : parsed.playstyle ? 84 : 15, parsed.evidence.playstyleLocked || manual ? 'manual' : parsed.playstyle ? 'ocr' : 'fallback', true, 'O estilo altera prioridades de pontos e habilidades.'),
    field('level', 'Nível máximo', Number.isFinite(parsed.level) ? String(parsed.level) : 'Não identificado', manual && Number.isFinite(parsed.level) ? 98 : Number.isFinite(parsed.level) ? 82 : 35, manual && Number.isFinite(parsed.level) ? 'manual' : Number.isFinite(parsed.level) ? 'ocr' : 'fallback', false, 'O nível ajuda a conferir o orçamento de pontos.'),
    field('trainingPoints', 'Pontos disponíveis', String(budget), points.sourceConfidence, parsed.trainingPointSource === 'MANUAL' ? 'manual' : parsed.trainingPointSource === 'LEVEL_INFERRED' ? 'inferred' : parsed.trainingPointSource === 'FALLBACK' ? 'fallback' : 'ocr', true, `Origem do orçamento: ${parsed.trainingPointSource ?? 'FALLBACK'}.`),
    field('attributes', 'Atributos da carta', `${attributeCount} reconhecidos`, manual ? 100 : attributeCount >= 20 ? 96 : attributeCount >= 16 ? 88 : attributeCount >= 12 ? 78 : attributeCount >= 8 ? 64 : 30, manual ? 'manual' : attributeCount ? 'ocr' : 'fallback', true, 'A base de atributos diferencia cartas do mesmo jogador.'),
    field('nativeSkills', 'Habilidades nativas', `${skills.native.length} identificada(s)`, skills.confidence, skills.source === 'explicit' ? 'canonical' : skills.source === 'none' ? 'fallback' : 'ocr', false, 'Habilidades nativas são protegidas contra recomendação duplicada.'),
    field('additionalSkills', 'Habilidades adicionais instaladas', `${skills.additional.length}/5`, skills.source === 'explicit' ? skills.confidence : skills.additional.length ? 72 : 55, skills.source === 'explicit' ? 'canonical' : skills.source === 'none' ? 'fallback' : 'ocr', false, 'As vagas já ocupadas precisam ser consideradas antes do Top 5.'),
    field('specialSkills', 'Habilidades especiais', `${skills.special.length} identificada(s)`, skills.source === 'explicit' ? skills.confidence : skills.special.length ? 78 : 55, skills.source === 'explicit' ? 'canonical' : skills.source === 'none' ? 'fallback' : 'ocr', false, 'Habilidades especiais ficam fora da lista de adicionais comuns.'),
    field('impetos', 'Ímpetos/Boosters', `${parsed.impetos.length} identificado(s)`, parsed.impetos.length ? (manual ? 100 : 78) : 52, manual ? 'manual' : parsed.impetos.length ? 'ocr' : 'fallback', false, 'O ímpeto precisa ser associado à versão correta da carta.')
  ];

  const criticalFields = fields.filter((item) => item.critical);
  const overallConfidence = clamp(fields.reduce((sum, item) => sum + item.confidence, 0) / Math.max(1, fields.length));
  const criticalConfidence = clamp(criticalFields.reduce((sum, item) => sum + item.confidence, 0) / Math.max(1, criticalFields.length));
  const blockReasons = fields.filter((item) => item.status === 'blocked').map((item) => `${item.label}: ${item.reason}`);
  if (!points.exact) blockReasons.push(points.invalidGroups.length ? 'A distribuição possui grupos inválidos para a posição ou níveis fora da faixa.' : `A ficha usa ${points.actualCost}/${points.budget} pontos; o orçamento precisa fechar exatamente.`);
  if (skills.additional.length > 5) blockReasons.push('A carta possui mais de cinco habilidades adicionais classificadas; revise a separação das habilidades.');

  const canonicalPayload = [
    normalize(parsed.playerName),
    normalize(parsed.cardType),
    normalize(parsed.specialTag),
    parsed.mainPosition,
    normalize(parsed.playstyle),
    parsed.level ?? 0,
    budget,
    parsed.overall ?? 0,
    parsed.maxOverall ?? 0,
    attributeSignature(parsed),
    skills.native.map(normalize).sort().join(','),
    skills.additional.map(normalize).sort().join(','),
    skills.special.map(normalize).sort().join(','),
    parsed.impetos.map((item) => `${normalize(item.name)}:${item.value ?? ''}`).sort().join(',')
  ].join('::');
  const canonicalHash = stableHash(canonicalPayload);
  const canonicalConfidence = clamp(criticalConfidence * .72 + overallConfidence * .28);
  const matchStatus = canonicalConfidence >= 90 && !blockReasons.length ? 'confirmed' : canonicalConfidence >= 72 ? 'probable' : 'uncertain';
  const canonicalId = `ef-card-${normalize(parsed.playerName) || 'unknown'}-${canonicalHash}`;
  const versionKey = [normalize(parsed.cardType) || 'unknown-type', parsed.level ?? 'unknown-level', parsed.maxOverall ?? parsed.overall ?? 'unknown-overall', canonicalHash.slice(-6)].join('-');
  const blocked = blockReasons.length > 0;
  const decision = blocked ? 'blocked' : fields.some((item) => item.status === 'review') || matchStatus === 'probable' ? 'review' : 'approved';

  return {
    engineVersion: STRUCTURAL_PRECISION_VERSION,
    canonical: {
      canonicalId,
      fingerprint: `canonical-${canonicalHash}`,
      versionKey,
      matchStatus,
      confidence: canonicalConfidence,
      evidence: [
        `${attributeCount} atributos na assinatura`,
        `${skills.native.length} nativa(s), ${skills.additional.length} adicional(is), ${skills.special.length} especial(is)`,
        `posição registrada ${parsed.mainPositionPt}`,
        parsed.playstyle ? `estilo ${parsed.playstyle}` : 'estilo não confirmado',
        `orçamento ${budget} pontos`
      ]
    },
    fields,
    overallConfidence,
    criticalConfidence,
    decision,
    blocked,
    blockReasons: Array.from(new Set(blockReasons)),
    skillInventory: skills,
    pointAudit: points,
    regressionKey: `reg-${stableHash(`${canonicalId}::${points.signature}`)}`,
    safeguards: [
      'A posição registrada permanece separada da posição escolhida para a ficha.',
      'Habilidades nativas, adicionais e especiais usam listas independentes.',
      'A recomendação não pode reutilizar uma habilidade já instalada.',
      'O custo real é recalculado nível por nível e precisa usar exatamente o orçamento.',
      'Campos críticos abaixo de 70% bloqueiam a ficha final até confirmação.'
    ]
  };
}

export function mergeStructuralValidation(validation: PrecisionValidation, structural: StructuralPrecisionAnalysis): PrecisionValidation {
  const structuralIssues: PrecisionIssue[] = structural.blockReasons.map((message, index) => ({
    severity: 'block',
    code: index === 0 ? 'STRUCTURAL_CARD_UNCERTAIN' : `STRUCTURAL_${index + 1}`,
    message
  }));
  const reviewIssues: PrecisionIssue[] = structural.fields
    .filter((item) => item.status === 'review' && item.critical)
    .map((item) => ({ severity: 'review', code: `FIELD_${item.key.toUpperCase()}`, message: `${item.label} com confiança ${item.confidence}%. ${item.reason}` }));
  const issues = [...validation.issues.filter((item) => item.code !== 'SAFE'), ...structuralIssues, ...reviewIssues];
  const hasBlocking = issues.some((item) => item.severity === 'block');
  const hasReview = issues.some((item) => item.severity === 'review');
  return {
    confirmed: validation.confirmed && !hasBlocking,
    canGenerate: !hasBlocking,
    level: hasBlocking ? 'blocked' : hasReview ? 'review' : 'safe',
    issues: issues.length ? issues : [{ severity: 'ok', code: 'SAFE', message: 'Identidade canônica e orçamento exato aprovados.' }]
  };
}
