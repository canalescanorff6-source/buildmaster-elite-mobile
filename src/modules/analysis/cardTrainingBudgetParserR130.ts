import { inferPointsFromCardLevel, parseCardLevelFromText } from '../builds/pointBudget';
import {
  MAX_AUTO_TRAINING_BUDGET,
  MIN_AUTO_TRAINING_BUDGET,
  SAFE_DEFAULT_TRAINING_BUDGET,
  normalizeTrainingBudget
} from '../builds/trainingOptimizer';
import { normalize } from '../analysis/analyzerTextUtilsR130';

/** R130 — leitura do orçamento da carta. Não decide distribuição de build. */
type TrainingPointCandidate = { used: number | null; total: number; source: string };

function parseLevel(text: string): number | null {
  return parseCardLevelFromText(text);
}

function collectTrainingPointCandidates(text: string): TrainingPointCandidate[] {
  const compact = normalize(text).replace(/\r?\n/g, ' ');
  const candidates: TrainingPointCandidate[] = [];

  const directPatterns = [
    /(?:pontos|points)\s*(?:usados|used|da\s*ficha|ficha)?\s*[:\-]?\s*(\d{1,3})\s*[\/\\]\s*(\d{1,3})/gi,
    /(?:training\s*points|progression\s*points)\s*[:\-]?\s*(\d{1,3})\s*[\/\\]\s*(\d{1,3})/gi
  ];

  for (const pattern of directPatterns) {
    for (const match of compact.matchAll(pattern)) {
      const used = Number(match[1]);
      const total = Number(match[2]);
      if (Number.isFinite(total)) candidates.push({ used: Number.isFinite(used) ? used : null, total, source: 'OCR_RATIO' });
    }
  }

  const totalPatterns = [
    /(?:pontos|points)\s*(?:totais|total|dispon[ií]veis|da\s*ficha|ficha)?\s*[:\-]?\s*(\d{1,3})/gi,
    /(?:training\s*points|progression\s*points)\s*[:\-]?\s*(\d{1,3})/gi
  ];

  for (const pattern of totalPatterns) {
    for (const match of compact.matchAll(pattern)) {
      const total = Number(match[1]);
      if (Number.isFinite(total)) candidates.push({ used: null, total, source: 'OCR_TOTAL' });
    }
  }

  return candidates;
}

function parseTrainingPoints(text: string, inferredPoints: number | null): { used: number | null; total: number | null; ignoredReason?: string } {
  const candidates = collectTrainingPointCandidates(text);
  if (!candidates.length) return { used: null, total: null };

  // Correção definitiva do 2/2: nenhum valor abaixo de 20 é orçamento real de ficha.
  // Esses números pequenos quase sempre vêm de boosters, estrelas, ícones ou OCR quebrado.
  const hardMinimum = MIN_AUTO_TRAINING_BUDGET;
  const hardMaximum = MAX_AUTO_TRAINING_BUDGET;
  const valid = candidates
    .filter((candidate) => candidate.total >= hardMinimum && candidate.total <= hardMaximum)
    .filter((candidate) => {
      if (!inferredPoints || inferredPoints < hardMinimum) return true;
      const minimumPlausible = Math.max(hardMinimum, Math.floor(inferredPoints * 0.55));
      const maximumPlausible = Math.ceil(inferredPoints * 1.45);
      return candidate.total >= minimumPlausible && candidate.total <= maximumPlausible;
    })
    .sort((a, b) => b.total - a.total);

  if (!valid.length) {
    const first = candidates[0];
    return {
      used: null,
      total: null,
      ignoredReason: `Pontos OCR ${first.used ?? first.total}/${first.total} descartados; valor inválido para ficha de jogador.`
    };
  }

  const selected = valid[0];
  const safeUsed = Number.isFinite(selected.used ?? NaN) && selected.used !== null && selected.used >= 0 && selected.used <= selected.total
    ? selected.used
    : null;
  return { used: safeUsed, total: selected.total };
}

function inferTrainingPointsFromLevel(level?: number | null): number | null {
  return inferPointsFromCardLevel(level);
}

type ManualBudgetOverride = { total: number; sourceText: string } | null;

function manualBlockScope(text: string): { scope: string; explicitBlock: boolean } {
  const match = text.match(/\[AJUSTES MANUAIS\]([\s\S]*?)\[FIM AJUSTES\]/i);
  if (match?.[1]) return { scope: match[1], explicitBlock: true };
  // Fora do bloco manual, somente uma declaração literalmente marcada como
  // orçamento manual pode ter prioridade. Nível/pontos comuns pertencem ao print.
  const explicitBudget = text.match(/(?:^|\n)\s*(?:or[cç]amento\s*(?:manual|de\s*pontos\s*manual)|pontos\s*manuais)\s*[:=\-]?\s*\d{1,3}/i)?.[0] ?? '';
  return { scope: explicitBudget, explicitBlock: false };
}

function parseManualTrainingBudget(text: string): ManualBudgetOverride {
  const manual = manualBlockScope(text);
  const scope = normalize(manual.scope).replace(/\r?\n/g, ' ');
  if (!scope) return null;
  const totalPatterns = [
    /(?:pontos\s*(?:totais|total|dispon[ií]veis|de\s*progresso|progressao|progressão)|progression\s*points|training\s*points)\s*[:=\-]?\s*(\d{1,3})/i,
    /(?:or[cç]amento\s*(?:manual|de\s*pontos))\s*[:=\-]?\s*(\d{1,3})/i
  ];
  for (const pattern of totalPatterns) {
    const match = scope.match(pattern);
    if (!match?.[1]) continue;
    const total = Number(match[1]);
    if (Number.isFinite(total) && total >= MIN_AUTO_TRAINING_BUDGET && total <= MAX_AUTO_TRAINING_BUDGET) {
      return { total: Math.round(total), sourceText: `pontos informados manualmente: ${Math.round(total)}` };
    }
  }

  const levelMatch = manual.explicitBlock
    ? scope.match(/(?:n[ií]vel|nivel|level)(?:\s*(?:m[aá]ximo|max|maximo))?\s*[:=\-]?\s*(\d{1,3})/i)
    : null;
  if (levelMatch?.[1]) {
    const level = Number(levelMatch[1]);
    const inferred = inferTrainingPointsFromLevel(level);
    if (inferred && inferred >= MIN_AUTO_TRAINING_BUDGET && inferred <= MAX_AUTO_TRAINING_BUDGET) {
      return { total: inferred, sourceText: `nível máximo manual ${level}: ${inferred} pontos` };
    }
  }

  return null;
}

function resolveTrainingPointBudget(
  parsedPoints: { used: number | null; total: number | null; ignoredReason?: string },
  inferredPoints: number | null,
  trainingAllocationPoints: number | null,
  manualBudget: ManualBudgetOverride
): { used: number; total: number; source: 'MANUAL' | 'TRAINING_READ' | 'OCR' | 'LEVEL_INFERRED' | 'FALLBACK'; warning?: string } {
  // Prioridade máxima: o que o usuário digitou na Auditoria Elite.
  // Se o usuário informou nível máximo ou pontos de progresso, o app deve recalcular a ficha por esse orçamento,
  // mesmo que o OCR tenha lido uma ficha automática diferente no print.
  if (manualBudget && manualBudget.total >= MIN_AUTO_TRAINING_BUDGET && manualBudget.total <= MAX_AUTO_TRAINING_BUDGET) {
    return { used: manualBudget.total, total: manualBudget.total, source: 'MANUAL', warning: parsedPoints.ignoredReason };
  }

  // Regra v6 local: se o print trouxe a ficha automática já distribuída, o app soma o custo real dela.
  // Esse é o orçamento mais confiável porque usa os próprios níveis de treino visíveis no print.
  if (trainingAllocationPoints && trainingAllocationPoints >= MIN_AUTO_TRAINING_BUDGET && trainingAllocationPoints <= MAX_AUTO_TRAINING_BUDGET) {
    return {
      used: trainingAllocationPoints,
      total: trainingAllocationPoints,
      source: 'TRAINING_READ',
      warning: parsedPoints.ignoredReason
    };
  }

  if (inferredPoints && inferredPoints >= MIN_AUTO_TRAINING_BUDGET && inferredPoints <= MAX_AUTO_TRAINING_BUDGET) {
    return {
      used: inferredPoints,
      total: inferredPoints,
      source: 'LEVEL_INFERRED',
      warning: parsedPoints.ignoredReason
    };
  }

  // OCR de pontos diretos fica como terceira opção. Nunca aceita 2/2, 116/116 ou número fora do teto.
  if (parsedPoints.total && parsedPoints.total >= MIN_AUTO_TRAINING_BUDGET && parsedPoints.total <= MAX_AUTO_TRAINING_BUDGET) {
    const safeTotal = normalizeTrainingBudget(parsedPoints.total);
    const safeUsed = parsedPoints.used !== null && Number.isFinite(parsedPoints.used) && parsedPoints.used >= MIN_AUTO_TRAINING_BUDGET && parsedPoints.used <= safeTotal
      ? parsedPoints.used
      : safeTotal;
    return { used: safeUsed, total: safeTotal, source: 'OCR', warning: parsedPoints.ignoredReason };
  }

  return {
    used: SAFE_DEFAULT_TRAINING_BUDGET,
    total: SAFE_DEFAULT_TRAINING_BUDGET,
    source: 'FALLBACK',
    warning: parsedPoints.ignoredReason ?? 'Não encontrei plano distribuído nem nível máximo com segurança; usando orçamento competitivo padrão de 64 pontos.'
  };
}

export function parseCardTrainingBudgetR130(text: string, trainingAllocationPoints: number | null) {
  const level = parseLevel(text);
  const inferredPoints = inferTrainingPointsFromLevel(level);
  const parsedPoints = parseTrainingPoints(text, inferredPoints);
  const manualBudget = parseManualTrainingBudget(text);
  const pointBudget = resolveTrainingPointBudget(parsedPoints, inferredPoints, trainingAllocationPoints, manualBudget);
  return { level, pointBudget };
}
