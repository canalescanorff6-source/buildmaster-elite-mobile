import { POSITION_PT, type AnalysisResult, type PositionCode } from './analyzerDomain';

export const PLAYER_COMPARISON_R171_VERSION = '40.80-r171-player-comparison-light-boundary-v1' as const;

export type PlayerComparisonItem = { id: string; name: string; originalPosition: string; targetPosition: string; score: number; adaptation: string; confidence: number; efficiency: number; physical: number; skills: number; goals: number; dna: number; individuality: number; cloneRisk: 'baixo' | 'médio' | 'alto' | 'não calculado'; uniqueEdge: string; behavior: string; strengths: string[]; risks: string[] };
export type PlayerComparisonReport = { targetPosition: PositionCode; targetLabel: string; ranking: PlayerComparisonItem[]; winner: string | null; reason: string };

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function comparePlayers(entries: Array<{ id: string; result: AnalysisResult }>, targetPosition: PositionCode): PlayerComparisonReport {
  const ranking = entries.map(({ id, result }) => {
    const physical = result.physicalEngine?.suitabilityScore ?? 50;
    const skills = result.specialSkillsAnalysis?.coverageScore ?? 50;
    const goals = result.attributeGoals?.readinessScore ?? 50;
    const efficiency = result.advancedOptimizer?.efficiencyScore ?? 50;
    const sameTarget = result.bestPosition.code === targetPosition;
    const adaptation = sameTarget ? (result.advancedTacticalFunction?.fitLabel ?? 'boa') : 'requer nova ficha';
    const individuality = result.cardDna?.antiClone.individualityScore ?? result.playerIdentity?.individualityScore ?? 50;
    const dna = result.cardDna ? clamp((individuality * .45) + (result.cardDna.behavior.matchConsistency * .25) + (result.cardDna.behavior.specialSkillUsage * .15) + (result.cardDna.antiClone.distributionDiversity * .15)) : individuality;
    const score = clamp((physical * .16) + (skills * .14) + (goals * .2) + (efficiency * .18) + (result.parsed.confidence * .12) + (dna * .2) + (sameTarget ? 8 : -8));
    const uniqueEdge = result.cardDna?.behavior.strongestBehaviors[0] ?? result.playerIdentity?.naturalStrengths[0] ?? result.strengths[0] ?? 'Identidade ainda não calculada';
    const behavior = result.cardDna?.behavior.summary ?? 'Gere novamente a ficha nesta versão para calcular o comportamento em campo.';
    const cloneRisk: PlayerComparisonItem['cloneRisk'] = result.cardDna?.antiClone.cloneRisk ?? 'não calculado';
    return { id, name: result.parsed.playerName, originalPosition: result.parsed.mainPositionPt, targetPosition: POSITION_PT[targetPosition], score, adaptation, confidence: result.parsed.confidence, efficiency, physical, skills, goals, dna, individuality, cloneRisk, uniqueEdge, behavior, strengths: result.strengths.slice(0,3), risks: result.weaknesses.slice(0,3) };
  }).sort((a,b) => b.score - a.score);
  return { targetPosition, targetLabel: POSITION_PT[targetPosition], ranking, winner: ranking[0]?.name ?? null, reason: ranking[0] ? `${ranking[0].name} apresentou o melhor conjunto para ${POSITION_PT[targetPosition]}, considerando também DNA, comportamento projetado e risco de ficha clonada.` : 'Selecione jogadores do Cofre para comparar.' };
}
