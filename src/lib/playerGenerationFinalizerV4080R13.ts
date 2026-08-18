import type { AnalysisResult } from './analyzerDomain';
import { trainingPlanTotalCost } from './trainingPlanCore';

export const PLAYER_GENERATION_FINALIZER_V4080_R13_VERSION = '40.80-r13-player-generation-finalizer' as const;

type GenerationStatus = 'PRONTA' | 'PRONTA_COM_RESSALVAS' | 'REVISAR_LEITURA';

type PlayerGenerationFinalizerV4080R13 = {
  engineVersion: typeof PLAYER_GENERATION_FINALIZER_V4080_R13_VERSION;
  status: GenerationStatus;
  confidence: number;
  cardConfidence: number;
  attributeCoverage: number;
  pointBudgetExact: boolean;
  skillIntegrity: number;
  metaReadiness: number;
  fluidCompatibility: number;
  recommendedMode: 'TRADICIONAL' | 'FLUIDA_LEVE' | 'FLUIDA_COMPLETA';
  readyForUse: boolean;
  readyForSale: boolean;
  blockers: string[];
  cautions: string[];
  decisiveSignals: string[];
  summary: string;
};

type ResultWithGenerationFinalizer = AnalysisResult & {
  playerGenerationV4080R13: PlayerGenerationFinalizerV4080R13;
};

function clamp(value: number) {
  return Math.round(Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0)) * 10) / 10;
}

function unique(values: string[]) {
  return values.filter((value, index, all) => Boolean(value?.trim()) && all.indexOf(value) === index);
}

export function buildPlayerGenerationFinalizerV4080R13(result: AnalysisResult): PlayerGenerationFinalizerV4080R13 {
  const cardConfidence = clamp(Number(result.parsed.confidence ?? 0));
  const attributeCount = Number(result.parsed.evidence.attributeCount ?? 0);
  const attributeCoverage = clamp(attributeCount / 26 * 100);
  const pointBudgetExact = trainingPlanTotalCost(result.training) === Number(result.parsed.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  const finalSkills = unique(result.recommendedSkills.slice(0, 5));
  const skillIntegrity = clamp(finalSkills.length / 5 * 100);
  const metaReadiness = clamp(Number(result.gameplayMetaV600R10?.scores.metaReadiness ?? 70));
  const fluidCompatibility = clamp(Number(result.gameplayMetaV600R10?.scores.fluidCompatibility ?? 65));
  const recommendedMode = result.gameplayMetaV600R10?.formation.recommendation ?? 'TRADICIONAL';
  const unknownMetaFields = result.liveEvolutionV600R11?.catalog.unknownFields?.length ?? 0;
  const stamina90 = result.matchStaminaV4080R44;

  const blockers: string[] = [];
  const cautions: string[] = [];
  if (cardConfidence < 62) blockers.push('Confiança da leitura da carta abaixo do mínimo seguro.');
  if (attributeCount < 10) blockers.push('Poucos atributos foram confirmados para uma ficha de desempenho máximo.');
  if (!pointBudgetExact && result.parsed.trainingPointsTotal != null) blockers.push('Orçamento de progressão não fecha exatamente com os pontos confirmados.');
  if (finalSkills.length < 5) cautions.push(`Top adicional possui ${finalSkills.length}/5 habilidades confirmadas; o app não completa vagas inventando nomes.`);
  if (unknownMetaFields > 0) cautions.push('Há dado novo/provisório da v6.0 preservado pelo OCR; ele não recebe peso de gameplay até confirmação.');
  if (cardConfidence < 78) cautions.push('A leitura é utilizável, mas vale revisar nome, posição, estilo e atributos críticos antes de aplicar recursos irreversíveis.');
  if (attributeCoverage < 58) cautions.push('Cobertura de atributos ainda é parcial; a ficha usa proteção conservadora contra falsa precisão.');
  if (stamina90?.risk === 'ALTO') cautions.push(`Risco físico alto: intensidade projetada até ~${stamina90.projectedMinute} min; alvo de resistência ${stamina90.targetStamina}.`);
  else if (stamina90?.risk === 'MEDIO') cautions.push(`Resistência moderada: intensidade projetada até ~${stamina90.projectedMinute} min; gerencie sprint/pressão no fim.`);

  const confidence = clamp(
    cardConfidence * .34 +
    Math.min(100, attributeCoverage + 16) * .2 +
    skillIntegrity * .14 +
    metaReadiness * .2 +
    (pointBudgetExact ? 100 : 58) * .12 -
    unknownMetaFields * 3
  );

  let status: GenerationStatus = 'PRONTA';
  if (blockers.length || confidence < 68) status = 'REVISAR_LEITURA';
  else if (cautions.length || confidence < 84) status = 'PRONTA_COM_RESSALVAS';

  const readyForUse = status !== 'REVISAR_LEITURA';
  const readyForSale = status === 'PRONTA' && finalSkills.length === 5 && pointBudgetExact && cardConfidence >= 80;
  const decisiveSignals = [
    `DNA: ${result.cardDna?.identityLabel ?? result.bestPosition.label}.`,
    `Posição final: ${result.bestPosition.label}.`,
    `Meta v6.0: ${Math.round(metaReadiness)}/100.`,
    `Passe ${Math.round(result.gameplayMetaV600R10?.scores.shortPassing ?? 0)} • condução ${Math.round(result.gameplayMetaV600R10?.scores.ballCarry ?? 0)} • tiki-taka ${Math.round(result.gameplayMetaV600R10?.scores.tikiTaka ?? 0)} • defesa manual ${Math.round(result.gameplayMetaV600R10?.scores.manualDefence ?? 0)}.`,
    `Estrutura recomendada: ${recommendedMode.replaceAll('_', ' ')}.`,
    stamina90 ? `Resistência 90 min: ${stamina90.enduranceScore}/100 • carga ${stamina90.workload.toLowerCase()} • ~${stamina90.projectedMinute} min.` : 'Resistência 90 min: ainda não calibrada.',
    `Top 5 confirmado: ${finalSkills.length}/5.`
  ];

  const label = status === 'PRONTA' ? 'Ficha pronta para aplicar' : status === 'PRONTA_COM_RESSALVAS' ? 'Ficha pronta com ressalvas' : 'Revisar leitura antes de aplicar';
  return {
    engineVersion: PLAYER_GENERATION_FINALIZER_V4080_R13_VERSION,
    status,
    confidence,
    cardConfidence,
    attributeCoverage,
    pointBudgetExact,
    skillIntegrity,
    metaReadiness,
    fluidCompatibility,
    recommendedMode,
    readyForUse,
    readyForSale,
    blockers,
    cautions,
    decisiveSignals,
    summary: `${label} • confiança ${Math.round(confidence)}/100 • posição ${result.bestPosition.label} • Meta v6.0 ${Math.round(metaReadiness)}/100 • ${recommendedMode.replaceAll('_', ' ')}.`
  };
}

export function applyPlayerGenerationFinalizerV4080R13(result: AnalysisResult): AnalysisResult {
  const analysis = buildPlayerGenerationFinalizerV4080R13(result);
  const output = {
    ...result,
    playerGenerationV4080R13: analysis,
    recommendationExplanation: [
      analysis.summary,
      ...analysis.blockers.map((item) => `BLOQUEIO: ${item}`),
      ...analysis.cautions.map((item) => `ATENÇÃO: ${item}`),
      ...analysis.decisiveSignals,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 56),
    strengths: [
      analysis.readyForSale ? `Gerador Final r13: ficha pronta para uso comercial com confiança ${Math.round(analysis.confidence)}/100.` : `Gerador Final r13: ${analysis.status.replaceAll('_', ' ').toLowerCase()} (${Math.round(analysis.confidence)}/100).`,
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 32)
  } as ResultWithGenerationFinalizer;
  return output;
}
