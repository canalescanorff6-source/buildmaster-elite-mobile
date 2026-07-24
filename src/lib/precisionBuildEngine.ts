import type { AnalysisResult, PositionCode, TrainingKey, TrainingPlan } from './analyzer';
import { TRAINING_LABELS } from './trainingEngine';

export type DataConfidenceItem = {
  key: 'identity' | 'position' | 'playstyle' | 'level' | 'points' | 'skills';
  label: string;
  score: number;
  status: 'confirmado' | 'provável' | 'revisar';
  note: string;
};

export type UtilityBandItem = {
  training: TrainingKey;
  label: string;
  current: number;
  functionalMin: number;
  competitiveTarget: number;
  usefulCeiling: number;
  band: 'deficiência' | 'funcional' | 'competitiva' | 'luxo' | 'excesso';
  recommendation: string;
};

export type PrecisionProposal = {
  id: 'recommended' | 'aggressive' | 'safe' | 'competitive' | 'offensive' | 'balanced';
  title: string;
  subtitle: string;
  training: TrainingPlan;
  pointsUsed: number;
  score: number;
  identityScore: number;
  positionScore: number;
  efficiencyScore: number;
  strengths: string[];
  limitations: string[];
  why: string;
};

export type TrainingPlanComparison = {
  valid: boolean;
  pointsUsed: number;
  pointsRemaining: number;
  score: number;
  scoreDifference: number;
  gains: string[];
  losses: string[];
  verdict: string;
};

export type MatchFeedbackKey =
  | 'heavy'
  | 'slowPass'
  | 'poorFinishing'
  | 'lostDuels'
  | 'tiredEarly'
  | 'slowTurn'
  | 'goodMarking'
  | 'outOfPosition';

export type FeedbackCorrection = {
  score: number;
  verdict: string;
  suggestedChanges: Array<{ training: TrainingKey; direction: 'up' | 'down' | 'keep'; amount: number; reason: string }>;
  safeguards: string[];
};

export type PrecisionBuildReport = {
  identitySignature: string;
  identityLabel: string;
  selectedPosition: { code: PositionCode; label: string; reason: string };
  recommendedPositions: Array<{ code: PositionCode; label: string; score: number; note: string }>;
  officialPlaystyle: string | null;
  realFunction: string;
  exactBudget: boolean;
  strictValidation: Array<{ label: string; ok: boolean; note: string }>;
  confidence: DataConfidenceItem[];
  utilityBands: UtilityBandItem[];
  proposals: PrecisionProposal[];
  skillSynergies: Array<{ name: string; status: string; score: number; note: string }>;
  explanation: string[];
};

const TRAINING_KEYS: TrainingKey[] = ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending','gk1','gk2','gk3'];

export function trainingLevelCost(level: number): number {
  if (level <= 0) return 0;
  return Math.ceil(level / 4);
}

export function trainingGroupCost(level: number): number {
  let cost = 0;
  for (let current = 1; current <= Math.max(0, Math.round(level)); current += 1) cost += trainingLevelCost(current);
  return cost;
}

export function trainingPlanPoints(plan: TrainingPlan): number {
  return TRAINING_KEYS.reduce((sum, key) => sum + trainingGroupCost(Number(plan[key] ?? 0)), 0);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function statusForConfidence(score: number): DataConfidenceItem['status'] {
  return score >= 90 ? 'confirmado' : score >= 72 ? 'provável' : 'revisar';
}

function fieldConfidence(result: AnalysisResult): DataConfidenceItem[] {
  const card = result.parsed;
  const lockedPosition = card.evidence?.positionLocked || card.manualConfirmed;
  const lockedStyle = card.evidence?.playstyleLocked || card.manualConfirmed;
  const hasLevel = Number.isFinite(Number(card.level)) && Number(card.level) > 0;
  const pointsConfirmed = card.trainingPointSource !== 'FALLBACK' && result.trainingPointsTotal > 0;
  const skillCount = card.nativeSkills.length + card.specialSkills.length;
  const data: Array<Omit<DataConfidenceItem, 'status'>> = [
    {
      key: 'identity', label: 'Identidade da carta',
      score: clamp(card.manualConfirmed ? 100 : Math.max(card.confidence, card.playerName ? 82 : 45)),
      note: `${card.playerName || 'Nome pendente'} • ${card.cardType || 'tipo não informado'} • ID ${card.internalId.slice(0, 10)}`
    },
    {
      key: 'position', label: 'Posição original',
      score: clamp(lockedPosition ? 100 : card.positions.length > 0 ? 88 : 58),
      note: lockedPosition ? 'Posição confirmada e travada.' : 'Revise antes de finalizar se o print não estiver nítido.'
    },
    {
      key: 'playstyle', label: 'Estilo de jogo',
      score: clamp(lockedStyle && card.playstyle ? 100 : card.playstyle ? 82 : 42),
      note: card.playstyle ? `Estilo oficial preservado: ${card.playstyle}.` : 'Estilo ainda não confirmado; o motor não inventa um nome.'
    },
    {
      key: 'level', label: 'Nível máximo',
      score: clamp(hasLevel ? (card.manualConfirmed ? 100 : 90) : 45),
      note: hasLevel ? `Nível ${card.level} considerado no orçamento.` : 'Nível não confirmado.'
    },
    {
      key: 'points', label: 'Pontos disponíveis',
      score: clamp(pointsConfirmed ? (card.trainingPointSource === 'MANUAL' ? 100 : 92) : 48),
      note: `${result.trainingPointsTotal} pontos • fonte ${card.trainingPointSource ?? 'não identificada'}.`
    },
    {
      key: 'skills', label: 'Habilidades existentes',
      score: clamp(skillCount >= 8 ? 96 : skillCount >= 4 ? 84 : skillCount > 0 ? 72 : 45),
      note: `${skillCount} habilidade(s) confirmada(s) para evitar repetição e medir sinergia.`
    }
  ];
  return data.map((item) => ({ ...item, status: statusForConfidence(item.score) }));
}

function utilityBands(result: AnalysisResult): UtilityBandItem[] {
  const goals = result.cardDna?.individualGoals ?? [];
  if (goals.length) {
    return goals.map((goal) => {
      const current = Math.round(goal.current);
      const min = Math.round(goal.functionalMin);
      const ideal = Math.round(goal.personalizedIdeal);
      const ceiling = Math.round(goal.recommendedCeiling);
      let band: UtilityBandItem['band'] = 'funcional';
      if (current < min) band = 'deficiência';
      else if (current < ideal) band = 'funcional';
      else if (current <= ceiling) band = 'competitiva';
      else if (current <= ceiling + 4) band = 'luxo';
      else band = 'excesso';
      const recommendation = band === 'deficiência'
        ? `Corrigir até pelo menos ${min}; abaixo disso a função perde consistência.`
        : band === 'funcional'
          ? `Já cumpre a função, mas ainda há retorno até a faixa ${ideal}.`
          : band === 'competitiva'
            ? `Faixa de melhor retorno para esta carta e posição.`
            : band === 'luxo'
              ? `Retorno pequeno; só investir se o restante da ficha estiver completo.`
              : `Evite novos pontos: o custo supera o ganho prático.`;
      return { training: goal.training, label: goal.label, current, functionalMin: min, competitiveTarget: ideal, usefulCeiling: ceiling, band, recommendation };
    });
  }

  return TRAINING_KEYS
    .filter((key) => result.bestPosition.code === 'GK' ? key.startsWith('gk') || key === 'lowerBodyStrength' || key === 'aerialStrength' : !key.startsWith('gk'))
    .map((key) => {
      const current = Number(result.training[key] ?? 0);
      return {
        training: key, label: TRAINING_LABELS[key], current,
        functionalMin: Math.max(0, current - 1), competitiveTarget: current + 1, usefulCeiling: current + 3,
        band: 'competitiva' as const,
        recommendation: 'Faixa calculada pela distribuição recomendada atual.'
      };
    });
}

function proposalFromVariant(result: AnalysisResult, id: PrecisionProposal['id'], index: number, title: string, subtitle: string): PrecisionProposal {
  const variant = result.buildVariants[index] ?? result.buildVariants[0];
  const plan = variant?.training ?? result.training;
  const pointsUsed = trainingPlanPoints(plan);
  const selectedScore = result.positionScores.find((item) => item.code === result.bestPosition.code)?.score ?? result.bestPosition.score;
  const identityScore = clamp(result.cardDna?.antiClone.identityContribution ?? result.playerIdentity?.individualityScore ?? 82);
  const score = clamp(variant?.qualityScore ?? (88 - index * 2));
  const efficiencyScore = clamp(variant?.efficiencyScore ?? result.advancedOptimizer?.efficiencyScore ?? 84);
  return {
    id, title, subtitle, training: plan, pointsUsed, score, identityScore,
    positionScore: clamp(selectedScore), efficiencyScore,
    strengths: (variant?.highlights ?? result.strengths).slice(0, 4),
    limitations: (variant?.risks ?? result.weaknesses).slice(0, 3),
    why: variant?.verdict ?? variant?.note ?? 'Distribuição criada para preservar a identidade da carta e cumprir a posição escolhida.'
  };
}

function strictValidation(result: AnalysisResult) {
  const selectedIsGoalkeeper = result.bestPosition.code === 'GK';
  const gkPoints = Number(result.training.gk1 ?? 0) + Number(result.training.gk2 ?? 0) + Number(result.training.gk3 ?? 0);
  const linePoints = Number(result.training.shooting ?? 0) + Number(result.training.passing ?? 0) + Number(result.training.dribbling ?? 0) + Number(result.training.defending ?? 0);
  const exact = result.trainingPointsUsed === result.trainingPointsTotal && result.trainingPointsRemaining === 0;
  return [
    { label: 'Orçamento exato', ok: exact, note: exact ? `${result.trainingPointsUsed}/${result.trainingPointsTotal}, sem sobra.` : `${result.trainingPointsRemaining} ponto(s) precisam de revisão.` },
    { label: 'Posição escolhida preservada', ok: result.advancedOptimizer?.positionPreserved !== false, note: `${result.bestPosition.label} continua sendo a posição da ficha.` },
    { label: 'Grupos de goleiro coerentes', ok: selectedIsGoalkeeper ? gkPoints > 0 : gkPoints === 0, note: selectedIsGoalkeeper ? 'Treinos de goleiro ativos.' : 'Nenhum ponto de goleiro em jogador de linha.' },
    { label: 'Grupos de linha coerentes', ok: selectedIsGoalkeeper ? linePoints === 0 : true, note: selectedIsGoalkeeper ? 'Sem investimento indevido em finalização/passe/drible/defesa de linha.' : 'Distribuição compatível com jogador de linha.' },
    { label: 'Estilo sem nome inventado', ok: result.advancedTacticalFunction?.status === 'oficial_confirmado' || !result.parsed.playstyle, note: result.parsed.playstyle ?? 'Estilo não confirmado — nenhuma nomenclatura foi criada.' },
    { label: 'Identidade individual ativa', ok: Boolean(result.cardDna || result.playerIdentity), note: result.cardDna?.identityLabel ?? result.playerIdentity?.profileLabel ?? 'Relatório individual disponível.' }
  ];
}

export function buildPrecisionBuildReport(result: AnalysisResult): PrecisionBuildReport {
  const card = result.parsed;
  const confidence = fieldConfidence(result);
  const proposals = [
    proposalFromVariant(result, 'recommended', 0, 'Ficha recomendada', 'Melhor equilíbrio entre identidade, posição e eficiência.'),
    proposalFromVariant(result, 'aggressive', 1, 'Ficha agressiva', 'Amplia o diferencial natural e a principal arma da carta.'),
    proposalFromVariant(result, 'safe', 2, 'Ficha segura', 'Corrige fraquezas críticas e reduz oscilações em campo.')
  ];
  const positionAlternatives = result.positionScores.slice(0, 3).map((position, index) => ({
    code: position.code, label: position.label, score: position.score,
    note: index === 0 ? 'Posição usada na ficha principal.' : index === 1 ? 'Melhor alternativa estimada; só muda se você escolher.' : 'Opção secundária para outro contexto tático.'
  }));
  const skillSynergies = (result.cardDna?.skillSynergies ?? []).slice(0, 8).map((item) => ({
    name: item.name, status: item.status, score: item.activationScore,
    note: `${item.recommendation}${item.wasteRisk ? ` Risco: ${item.wasteRisk}` : ''}`
  }));
  const exactBudget = result.trainingPointsUsed === result.trainingPointsTotal && result.trainingPointsRemaining === 0;
  return {
    identitySignature: result.cardDna?.versionSignature ?? result.playerIdentity?.signature ?? card.internalId,
    identityLabel: result.cardDna?.identityLabel ?? result.playerIdentity?.profileLabel ?? `${card.playerName} • ${card.cardType}`,
    selectedPosition: {
      code: result.bestPosition.code,
      label: result.bestPosition.label,
      reason: `A posição escolhida continua soberana. A ficha foi calibrada como ${result.teamMap?.functionLabel ?? result.buildName}.`
    },
    recommendedPositions: positionAlternatives,
    officialPlaystyle: card.playstyle ?? null,
    realFunction: result.teamMap?.functionLabel ?? result.buildName,
    exactBudget,
    strictValidation: strictValidation(result),
    confidence,
    utilityBands: utilityBands(result),
    proposals,
    skillSynergies,
    explanation: [
      ...(result.recommendationExplanation ?? []).slice(0, 4),
      `A identidade usa nome, tipo da carta, posição original, estilo, nível, atributos, habilidades e orçamento de ${result.trainingPointsTotal} pontos.`,
      'A avaliação prioriza ações reais em campo e retorno marginal; GER alto não é objetivo isolado.',
      'A recomendação de outra posição nunca altera automaticamente a posição escolhida pelo usuário.'
    ]
  };
}

function importanceWeights(result: AnalysisResult): Record<TrainingKey, number> {
  const weights = Object.fromEntries(TRAINING_KEYS.map((key) => [key, 0.25])) as Record<TrainingKey, number>;
  for (const goal of result.cardDna?.individualGoals ?? []) {
    weights[goal.training] = goal.priority === 'especializar' ? 1.35 : goal.priority === 'corrigir' ? 1.25 : goal.priority === 'proteger' ? 1.05 : 0.55;
  }
  if (result.bestPosition.code === 'GK') {
    for (const key of ['gk1','gk2','gk3'] as TrainingKey[]) weights[key] = Math.max(weights[key], 1.3);
  }
  return weights;
}

export function compareTrainingPlan(result: AnalysisResult, customPlan: TrainingPlan): TrainingPlanComparison {
  const pointsUsed = trainingPlanPoints(customPlan);
  const pointsRemaining = result.trainingPointsTotal - pointsUsed;
  const validGroups = result.bestPosition.code === 'GK'
    ? Number(customPlan.shooting ?? 0) + Number(customPlan.passing ?? 0) + Number(customPlan.dribbling ?? 0) + Number(customPlan.defending ?? 0) === 0
    : Number(customPlan.gk1 ?? 0) + Number(customPlan.gk2 ?? 0) + Number(customPlan.gk3 ?? 0) === 0;
  const valid = pointsRemaining === 0 && validGroups;
  const weights = importanceWeights(result);
  const base = result.training;
  let weightedDelta = 0;
  const gains: string[] = [];
  const losses: string[] = [];
  for (const key of TRAINING_KEYS) {
    const difference = Number(customPlan[key] ?? 0) - Number(base[key] ?? 0);
    if (!difference) continue;
    weightedDelta += difference * weights[key];
    const text = `${TRAINING_LABELS[key]} ${difference > 0 ? '+' : ''}${difference}`;
    if (difference > 0) gains.push(text);
    else losses.push(text);
  }
  const baseScore = result.buildVariants[0]?.qualityScore ?? 90;
  const budgetPenalty = Math.abs(pointsRemaining) * 1.8;
  const invalidPenalty = validGroups ? 0 : 18;
  const score = clamp(baseScore + weightedDelta * 1.15 - budgetPenalty - invalidPenalty, 1, 99);
  const scoreDifference = score - baseScore;
  const verdict = !validGroups
    ? 'A distribuição usa grupos incompatíveis com a posição e não pode ser finalizada.'
    : pointsRemaining > 0
      ? `Ainda restam ${pointsRemaining} ponto(s) de orçamento.`
      : pointsRemaining < 0
        ? `A distribuição excede o orçamento em ${Math.abs(pointsRemaining)} ponto(s).`
        : scoreDifference >= 2
          ? 'Sua alteração pode melhorar a especialização, mas confirme os riscos mostrados abaixo.'
          : scoreDifference >= -2
            ? 'Sua alteração mantém rendimento semelhante, com troca de prioridades.'
            : 'A alteração reduz o rendimento estimado para a função escolhida.';
  return { valid, pointsUsed, pointsRemaining, score, scoreDifference, gains, losses, verdict };
}

const FEEDBACK_RULES: Record<MatchFeedbackKey, Array<{ training: TrainingKey; direction: 'up' | 'down' | 'keep'; amount: number; reason: string }>> = {
  heavy: [
    { training:'dexterity', direction:'up', amount:1, reason:'Aceleração e equilíbrio ajudam a resposta curta.' },
    { training:'aerialStrength', direction:'down', amount:1, reason:'Evite físico excessivo quando não for central para a função.' }
  ],
  slowPass: [{ training:'passing', direction:'up', amount:1, reason:'Melhora a velocidade e segurança da circulação.' }],
  poorFinishing: [{ training:'shooting', direction:'up', amount:1, reason:'Aumenta a consistência das finalizações usadas em partida.' }],
  lostDuels: [
    { training:'lowerBodyStrength', direction:'up', amount:1, reason:'Aumenta sustentação e potência nos duelos.' },
    { training:'aerialStrength', direction:'up', amount:1, reason:'Ajuda contato, impulsão e disputa aérea.' }
  ],
  tiredEarly: [{ training:'lowerBodyStrength', direction:'up', amount:1, reason:'A resistência precisa de correção funcional.' }],
  slowTurn: [{ training:'dribbling', direction:'up', amount:1, reason:'Controle e condução firme ajudam o giro.' }],
  goodMarking: [{ training:'defending', direction:'keep', amount:0, reason:'A defesa já entregou resultado; preserve essa faixa.' }],
  outOfPosition: [{ training:'defending', direction:'up', amount:1, reason:'Consciência e dedicação ajudam a manter a estrutura.' }]
};

export function buildFeedbackCorrection(result: AnalysisResult, feedback: MatchFeedbackKey[]): FeedbackCorrection {
  const merged = new Map<TrainingKey, { training: TrainingKey; direction: 'up' | 'down' | 'keep'; amount: number; reason: string }>();
  for (const key of feedback) {
    for (const item of FEEDBACK_RULES[key]) {
      const current = merged.get(item.training);
      if (!current || item.direction === 'keep' || item.amount > current.amount) merged.set(item.training, item);
    }
  }
  const changes = Array.from(merged.values()).filter((item) => result.bestPosition.code === 'GK' ? !['shooting','passing','dribbling','defending'].includes(item.training) || item.direction === 'keep' : !item.training.startsWith('gk'));
  const score = clamp(55 + feedback.length * 8 + Math.min(18, (result.cardDna?.antiClone.individualityScore ?? 75) / 5));
  return {
    score,
    verdict: feedback.length
      ? 'Correção sugerida sem sobrescrever a ficha original. Gere uma variante e compare após mais partidas.'
      : 'Selecione o que aconteceu em campo para receber uma correção controlada.',
    suggestedChanges: changes,
    safeguards: [
      'A ficha original permanece salva e não é alterada automaticamente.',
      'Uma única partida não basta para sacrificar a identidade da carta.',
      'Toda variante precisa continuar usando exatamente o orçamento disponível.'
    ]
  };
}
