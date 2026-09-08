import type { AnalysisResult } from '@/lib/analyzerDomain';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';
import { POSITION_PT } from '@/lib/analyzerDomain';
import { trainingPlanTotalCost } from '@/lib/trainingPlanCore';

export const FINAL_BUILD_DIAGNOSTICS_R142_VERSION = '40.80-r142-final-build-diagnostics-v1' as const;

type R142CleanSlate = {
  score?: number;
  candidateCount?: number;
  onlinePerformance?: { pointEfficiency?: number };
};

export type FinalBuildDiagnosticsR142Stamp = {
  version: typeof FINAL_BUILD_DIAGNOSTICS_R142_VERSION;
  usagePosition: string;
  trainingFingerprint: string;
  synchronized: true;
};

function trainingFingerprintR142(result: AnalysisResult): string {
  const usage = analysisUsagePositionR138(result);
  const ordered = Object.entries(result.training).sort(([a], [b]) => a.localeCompare(b));
  return `${usage}|${ordered.map(([key, value]) => `${key}:${Number(value ?? 0)}`).join('|')}`;
}

export function isFinalBuildDiagnosticsCurrentR142(result: AnalysisResult): boolean {
  const stamp = (result as AnalysisResult & { finalBuildDiagnosticsR142?: FinalBuildDiagnosticsR142Stamp }).finalBuildDiagnosticsR142;
  if (!stamp || stamp.version !== FINAL_BUILD_DIAGNOSTICS_R142_VERSION || stamp.synchronized !== true) return false;
  if (stamp.usagePosition !== analysisUsagePositionR138(result)) return false;
  if (stamp.trainingFingerprint !== trainingFingerprintR142(result)) return false;
  const winner = result.buildVariants?.[0];
  return Boolean(winner && JSON.stringify(winner.training) === JSON.stringify(result.training) && result.advancedOptimizer?.winnerTitle === 'Ficha Clean Slate — final');
}

/**
 * Sincroniza os cartões comparativos que eram calculados antes do Clean Slate com a
 * ficha que realmente saiu do único escritor final. Não reotimiza e não altera
 * progressão/Top 5/Ímpeto.
 */
export function synchronizeFinalBuildDiagnosticsR142(input: AnalysisResult): AnalysisResult {
  const clean = (input as AnalysisResult & { cleanSlate2027R119?: R142CleanSlate }).cleanSlate2027R119;
  if (!clean) return input;

  const usage = analysisUsagePositionR138(input);
  const training = { ...input.training };
  const used = trainingPlanTotalCost(training);
  const budget = Number(input.trainingPointsTotal ?? used);
  const quality = Math.max(1, Math.min(99, Math.round(Number(clean.score ?? input.buildVariants?.[0]?.qualityScore ?? input.bestPosition.score ?? 80))));
  const efficiency = Math.max(1, Math.min(99, Math.round(Number(clean.onlinePerformance?.pointEfficiency ?? input.advancedOptimizer?.efficiencyScore ?? 80))));
  const currentWinner = input.buildVariants?.[0];

  const buildVariants = currentWinner ? [
    {
      ...currentWinner,
      title: 'Ficha Clean Slate — final',
      positionLabel: POSITION_PT[usage],
      training,
      pointsUsed: used,
      qualityScore: quality,
      efficiencyScore: efficiency,
      simulationsTested: Math.max(Number(currentWinner.simulationsTested ?? 0), Number(clean.candidateCount ?? 0)),
      highlights: [
        'Esta é a progressão selada pelo único escritor final.',
        ...(currentWinner.highlights ?? []).filter((item) => !/provis|legad/i.test(item)).slice(0, 3)
      ],
      note: 'Comparador sincronizado com a progressão final Clean Slate; não exibe mais como vencedora uma ficha provisória do analisador-base.',
      verdict: 'Ficha oficial de produção para a posição real de uso.'
    },
    ...input.buildVariants.slice(1)
  ] : input.buildVariants;

  const advancedOptimizer = input.advancedOptimizer ? {
    ...input.advancedOptimizer,
    winnerTitle: 'Ficha Clean Slate — final',
    winnerScore: quality,
    efficiencyScore: efficiency,
    wasteScore: Math.max(0, 100 - efficiency),
    unusedPoints: Math.max(0, budget - used),
    budgetRespected: used <= budget,
    positionPreserved: true,
    decisionReasons: [
      `Autoridade final sincronizada para ${POSITION_PT[usage]} com ${used}/${budget} pontos.`,
      ...(input.advancedOptimizer.decisionReasons ?? []).filter((item) => !/ficha vencedora|provis/i.test(item)).slice(0, 3)
    ]
  } : input.advancedOptimizer;

  const synchronized = {
    ...input,
    buildVariants,
    advancedOptimizer,
    recommendationExplanation: [
      `R142: comparador e painel de otimização sincronizados com a ficha Clean Slate final em ${POSITION_PT[usage]}; busca exaustiva provisória foi removida do caminho de produção.`,
      ...input.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index)
  } as AnalysisResult;

  return {
    ...synchronized,
    finalBuildDiagnosticsR142: {
      version: FINAL_BUILD_DIAGNOSTICS_R142_VERSION,
      usagePosition: analysisUsagePositionR138(synchronized),
      trainingFingerprint: trainingFingerprintR142(synchronized),
      synchronized: true
    }
  } as AnalysisResult;
}
