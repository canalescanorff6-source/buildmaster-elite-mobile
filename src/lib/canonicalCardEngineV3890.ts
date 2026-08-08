import type {
  AnalysisResult,
  CanonicalCardV3890Analysis,
  TrainingPlan
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { applyCardFirstAiV3880 } from './cardFirstAiEngineV3880';
import { enforceComplementarySkillIntegrity } from './skillIntegrity';
import { applyLocalAiToResult } from './localAiEngine';
import { cardFingerprint } from './appEvolution';
import { emptyTraining, trainingPlanCost, trainingPlanTotalCost } from './trainingPlanCore';

export const CANONICAL_CARD_V3890_VERSION = '38.90.0' as const;

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function stableHash(value: string) {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(16).padStart(8, '0');
}

function trainingSignature(plan: TrainingPlan) {
  return Object.entries(plan)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${Number(value ?? 0)}`)
    .join('|');
}

function canonicalCardId(result: AnalysisResult) {
  return result.structuralPrecision?.canonical.canonicalId ?? cardFingerprint(result);
}

/**
 * Cria um contexto neutro e invariável. A posição escolhida, a formação, o
 * técnico, o perfil de conexão, o nome do arquivo e os resultados de motores
 * anteriores não podem alterar a receita definitiva da mesma carta.
 */
function canonicalInput(result: AnalysisResult): AnalysisResult {
  const naturalPosition = result.parsed.mainPosition;
  return {
    ...result,
    objective: 'COMPETITIVE',
    bestPosition: {
      code: naturalPosition,
      label: POSITION_PT[naturalPosition],
      score: 100
    },
    tacticalProfile: {
      formation: 'AUTO',
      style: 'AUTO',
      gameplayMode: 'UNIVERSAL',
      connectionProfile: 'VARIABLE',
      controlProfile: 'AUTO',
      managerId: null,
      managerName: null,
      managerProficiency: null,
      managerBooster: null
    },
    training: emptyTraining(),
    trainingCost: emptyTraining(),
    trainingPointsUsed: 0,
    trainingPointsRemaining: result.trainingPointsTotal,
    buildVariants: [],
    recommendedSkills: [],
    skillRecommendations: [],
    recommendedImpetos: [],
    recommendationExplanation: [],
    strengths: [],
    weaknesses: [],
    buildName: 'Receita canônica em cálculo',
    note: '',
    teamMap: {
      ...result.teamMap,
      functionLabel: 'Função canônica da carta',
      tacticalIdentity: 'Identidade individual independente da posição',
      coachFit: 'Neutro: técnico não altera a receita',
      idealPartners: [],
      riskAlerts: [],
      matchPlan: []
    },
    competitiveFusion: undefined,
    powerBuildV3850: undefined,
    maxMatchV3860: undefined,
    supremeV3870: undefined,
    cardFirstV3880: undefined,
    canonicalCardV3890: undefined
  };
}

function buildLockedCanonicalResult(result: AnalysisResult) {
  const neutral = canonicalInput(result);
  const cardFirst = applyCardFirstAiV3880(neutral);
  const skillsLocked = enforceComplementarySkillIntegrity(cardFirst);
  const impetosLocked = applyLocalAiToResult(skillsLocked);
  return enforceComplementarySkillIntegrity(impetosLocked);
}

function analysisFromCanonicalResult(result: AnalysisResult, canonical: AnalysisResult): CanonicalCardV3890Analysis {
  const id = canonicalCardId(canonical);
  const skills = [...canonical.recommendedSkills];
  const impetos = canonical.recommendedImpetos.map((item) => ({ ...item }));
  const primaryImpeto = impetos[0]?.name ?? null;
  const signaturePayload = [
    id,
    trainingSignature(canonical.training),
    skills.map(normalize).join(','),
    impetos.map((item) => `${normalize(item.name)}:${Math.round(Number(item.score ?? 0))}`).join(',')
  ].join('::');
  const resultSignature = `canonical-v3890-${stableHash(signaturePayload)}`;
  const cardConfidence = Number(result.structuralPrecision?.canonical.confidence ?? result.parsed.confidence ?? 0);
  const engineConfidence = Number(canonical.cardFirstV3880?.confidence ?? 0);
  const confidence = Math.round(Math.max(0, Math.min(100, cardConfidence * .55 + engineConfidence * .45)));
  const exactBudget = trainingPlanTotalCost(canonical.training) === result.trainingPointsTotal;
  const decision = exactBudget && skills.length > 0 && confidence >= 65 ? 'aprovada' : 'revisar';

  return {
    engineVersion: CANONICAL_CARD_V3890_VERSION,
    philosophy: 'UMA_CARTA_UMA_RECEITA_DEFINITIVA_INDEPENDENTE_DA_POSICAO',
    canonicalCardId: id,
    resultSignature,
    canonicalPosition: canonical.parsed.mainPosition,
    canonicalPositionLabel: POSITION_PT[canonical.parsed.mainPosition],
    selectedPosition: result.bestPosition.code,
    selectedPositionLabel: result.bestPosition.label,
    positionAffectsOutput: false,
    training: canonical.training,
    skills,
    impetos,
    primaryImpeto,
    deterministicChecks: [
      'A mesma identidade canônica gera a mesma distribuição de pontos.',
      'A mesma identidade canônica gera a mesma lista e ordem de habilidades adicionais.',
      'A mesma identidade canônica gera o mesmo ranking de Ímpetos.',
      'Trocar CA, SA, MAT, MLG, VOL ou outra posição não recalcula a receita.',
      'Não existe sorteio, embaralhamento, relógio do aparelho ou influência do nome do arquivo.',
      exactBudget ? 'O orçamento de progressão fecha exatamente.' : 'O orçamento precisa de revisão.'
    ],
    lockedInputs: [
      'versão exata da carta',
      'nome e tipo da carta',
      'posição registrada na própria carta',
      'estilo de jogo oficial',
      'atributos lidos',
      'habilidades nativas, adicionais e especiais',
      'Ímpeto já existente',
      'nível e pontos disponíveis'
    ],
    ignoredInputs: [
      'posição escolhida para usar em campo',
      'formação atual',
      'lado esquerdo ou direito',
      'técnico selecionado',
      'perfil de conexão',
      'nome do print e ordem das leituras',
      'fichas alternativas de motores anteriores',
      'Overall/GER como objetivo'
    ],
    confidence,
    decision,
    summary: `${canonical.parsed.playerName}: receita canônica ${resultSignature}. Ficha, habilidades e Ímpeto permanecem iguais em qualquer posição; a posição escolhida serve apenas para a recomendação tática de uso.`
  };
}

export function buildCanonicalCardV3890(result: AnalysisResult): CanonicalCardV3890Analysis {
  return analysisFromCanonicalResult(result, buildLockedCanonicalResult(result));
}

export function applyCanonicalCardV3890(result: AnalysisResult): AnalysisResult {
  const canonicalCardFirst = buildLockedCanonicalResult(result);
  const analysis = analysisFromCanonicalResult(result, canonicalCardFirst);
  const training = analysis.training;
  const pointsUsed = trainingPlanTotalCost(training);
  const variant = {
    kind: 'competitive' as const,
    title: `Ficha Automática v38.40 — Receita Canônica v38.90 — ${result.parsed.playerName}`,
    positionLabel: 'Receita única da carta',
    training,
    pointsUsed,
    note: 'Esta distribuição é travada pela identidade da carta e não muda ao selecionar outra posição.',
    qualityScore: canonicalCardFirst.cardFirstV3880?.winner.score ?? analysis.confidence,
    adaptationLabel: 'UMA CARTA • UMA RECEITA • SEM OVERALL',
    highlights: [
      `Assinatura ${analysis.resultSignature}.`,
      `Posição registrada: ${analysis.canonicalPositionLabel}.`,
      `Posição selecionada não altera a ficha: ${analysis.selectedPositionLabel}.`,
      `Ímpeto principal: ${analysis.primaryImpeto ?? 'revisar leitura'}.`
    ],
    risks: analysis.decision === 'revisar' ? ['Confirme os campos da carta antes de aplicar definitivamente.'] : [],
    efficiencyScore: canonicalCardFirst.cardFirstV3880?.winner.pointEfficiency ?? analysis.confidence,
    balanceScore: canonicalCardFirst.cardFirstV3880?.winner.identityFit ?? analysis.confidence,
    verdict: analysis.summary,
    tradeOffs: ['A receita não é alterada para perseguir Overall nem para imitar um molde de posição.'],
    simulationsTested: canonicalCardFirst.cardFirstV3880?.candidatesEvaluated ?? 1
  };

  return {
    ...result,
    training,
    trainingCost: trainingPlanCost(training),
    trainingPointsUsed: pointsUsed,
    trainingPointsRemaining: result.trainingPointsTotal - pointsUsed,
    buildVariants: [variant],
    recommendedSkills: analysis.skills,
    skillRecommendations: canonicalCardFirst.skillRecommendations,
    recommendedImpetos: analysis.impetos,
    buildName: variant.title,
    recommendationExplanation: [
      analysis.summary,
      'A posição escolhida continua registrada para escalação e análise tática, mas não entra no cálculo da ficha.',
      'Para gerar outra receita é necessário mudar a versão da carta, os atributos, as habilidades ou o orçamento real.',
      ...canonicalCardFirst.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 12),
    strengths: [
      'Resultado reproduzível: a mesma carta sempre retorna a mesma ficha, habilidades e Ímpetos.',
      `DNA canônico travado em ${analysis.resultSignature}.`,
      ...canonicalCardFirst.strengths
    ].slice(0, 10),
    weaknesses: [
      ...(analysis.decision === 'revisar' ? ['A leitura possui confiança insuficiente; confirme os campos críticos.'] : []),
      ...canonicalCardFirst.weaknesses
    ].slice(0, 8),
    note: `${analysis.summary} A adequação da carta à posição escolhida deve ser exibida separadamente, sem regenerar a receita.`,
    cardFirstV3880: canonicalCardFirst.cardFirstV3880,
    skillIntegrity: canonicalCardFirst.skillIntegrity,
    specialSkillsAnalysis: canonicalCardFirst.specialSkillsAnalysis,
    skillPriority: canonicalCardFirst.skillPriority,
    canonicalCardV3890: analysis,
    advancedOptimizer: {
      ...result.advancedOptimizer,
      winnerTitle: variant.title,
      winnerScore: variant.qualityScore,
      efficiencyScore: variant.efficiencyScore,
      wasteScore: Math.max(0, 100 - variant.efficiencyScore),
      unusedPoints: Math.max(0, result.trainingPointsTotal - pointsUsed),
      decisionReasons: [analysis.summary, ...result.advancedOptimizer.decisionReasons].slice(0, 8),
      positionPreserved: true,
      budgetRespected: pointsUsed === result.trainingPointsTotal
    }
  };
}
