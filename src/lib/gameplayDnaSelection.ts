import type { AnalysisResult, GameplayDnaProfileId } from './analyzerDomain';

export function applyGameplayDnaProfileSelection(result: AnalysisResult, profileId: GameplayDnaProfileId): AnalysisResult {
  const dna = result.gameplayDna;
  const profile = dna?.profiles.find((item) => item.id === profileId);
  if (!dna || !profile) return result;

  // R128: Gameplay DNA virou somente contexto/diagnóstico. Ele NÃO pode escrever
  // progressão, Top 5, Ímpeto, orçamento ou nome da build depois do Clean Slate.
  return {
    ...result,
    recommendationExplanation: [
      `Perfil de Gameplay analisado: ${profile.label} para ${profile.position}.`,
      `${profile.description} Este perfil é comparativo e não sobrescreve a ficha final R128.`,
      `Compatibilidade ${profile.compatibility}/100 e nota prática ${profile.score}/100, sem perseguir overall.`,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 112),
    gameplayDna: {
      ...dna,
      primaryProfileId: profile.id,
      profiles: dna.profiles.map((item) => ({ ...item, recommended: item.id === profile.id })),
      summary: `${profile.label} foi selecionado como lente de comparação para ${dna.playerName} em ${result.bestPosition.label}. A ficha, o Top 5 e o Ímpeto continuam pertencendo exclusivamente ao Clean Slate.`
    }
  };
}
