import type { AnalysisResult, GameplayDnaProfileId, SkillRecommendation } from './analyzerDomain';
import { trainingPlanCost, trainingPlanTotalCost } from './trainingPlanCore';

export function applyGameplayDnaProfileSelection(result: AnalysisResult, profileId: GameplayDnaProfileId): AnalysisResult {
  const dna = result.gameplayDna;
  const profile = dna?.profiles.find((item) => item.id === profileId);
  if (!dna || !profile) return result;

  const used = trainingPlanTotalCost(profile.training);
  const existingAvoid = result.skillRecommendations.filter((item) => item.tier === 'evitar');
  const selectedRecommendations: SkillRecommendation[] = profile.additionalSkills.map((name, index) => ({
    name,
    tier: index === 0 ? 'essencial' : 'alternativa',
    reason: `${profile.label}: habilidade oficial escolhida para ${profile.functionalStyle.toLowerCase()}.`
  }));

  return {
    ...result,
    training: profile.training,
    trainingCost: trainingPlanCost(profile.training),
    trainingPointsUsed: used,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - used),
    trainingComparison: result.trainingComparison.map((item) => ({
      ...item,
      recommended: profile.training[item.key],
      difference: profile.training[item.key] - item.auto
    })),
    buildName: `Ficha DNA — ${profile.label}`,
    recommendedSkills: profile.additionalSkills,
    skillRecommendations: [...selectedRecommendations, ...existingAvoid],
    recommendationExplanation: [
      `Perfil de Gameplay aplicado: ${profile.label} para ${profile.position}.`,
      profile.description,
      `Compatibilidade ${profile.compatibility}/100 e nota prática ${profile.score}/100, sem perseguir overall.`,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 14),
    buildVariants: [
      {
        kind: 'competitive' as const,
        title: `DNA — ${profile.label}`,
        positionLabel: result.bestPosition.label,
        training: profile.training,
        pointsUsed: used,
        qualityScore: profile.score,
        efficiencyScore: profile.exactBudget ? 100 : 80,
        balanceScore: profile.compatibility,
        note: profile.focus.join(' • '),
        verdict: profile.description,
        simulationsTested: 0
      },
      ...result.buildVariants.filter((item) => item.title !== `DNA — ${profile.label}`)
    ].slice(0, 8),
    calibrationV32: result.calibrationV32 ? {
      ...result.calibrationV32,
      finalTraining: profile.training,
      calibrationScore: profile.score,
      summary: `Perfil ${profile.label} aplicado. A ficha usa ${used}/${result.trainingPointsTotal} pontos e mantém proteção anti-overall.`
    } : result.calibrationV32,
    supremeGameplay: result.supremeGameplay ? {
      ...result.supremeGameplay,
      finalTraining: profile.training,
      winnerScore: profile.score,
      roleLabel: profile.label,
      summary: profile.description
    } : result.supremeGameplay,
    unifiedIntelligence: result.unifiedIntelligence ? {
      ...result.unifiedIntelligence,
      finalTraining: profile.training,
      summary: `Perfil funcional ativo: ${profile.label}. ${profile.description}`
    } : result.unifiedIntelligence,
    deepCardIntelligence: result.deepCardIntelligence ? {
      ...result.deepCardIntelligence,
      finalTraining: profile.training,
      winnerScore: profile.score,
      summary: `Perfil funcional ativo: ${profile.label}. ${profile.description}`
    } : result.deepCardIntelligence,
    skillIntegrity: result.skillIntegrity ? {
      ...result.skillIntegrity,
      recommendedSkills: profile.additionalSkills,
      missingSlots: Math.max(0, 5 - profile.additionalSkills.length),
      checks: [
        `Perfil ${profile.label} aplicado sem alterar o Estilo de Jogo oficial.`,
        ...result.skillIntegrity.checks
      ].slice(0, 8)
    } : result.skillIntegrity,
    gameplayDna: {
      ...dna,
      primaryProfileId: profile.id,
      profiles: dna.profiles.map((item) => ({ ...item, recommended: item.id === profile.id })),
      summary: `${profile.label} foi selecionada para ${dna.playerName} em ${result.bestPosition.label}. O Estilo de Jogo oficial permanece ${dna.officialPlaystyle || 'não confirmado'}.`
    }
  };
}
