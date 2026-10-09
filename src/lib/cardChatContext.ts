import { ATTRIBUTE_PT, type AnalysisResult } from './analyzerDomain';
import { analysisUsageFunctionR457, analysisUsagePositionR138 } from './analysisUsagePositionR138';

/** Contexto isolado da carta; nenhuma credencial ou conversa do usuário é compartilhada. */
export function cardChatContext(result:AnalysisResult) {
  const card=result.parsed;
  return [
    'Analise somente esta carta de eFootball. Quero desempenho em campo, sem maximizar Overall. Não copie um treino por posição ou quantidade de PP. Compare o ganho útil de cada ponto e justifique o que a carta realmente precisa.',
    'Prefiro posse de bola pelo centro, sem pontas. Preserve minhas escolhas de função. Adaptações exigem conferir proficiência; estilo inativo não torna a carta automaticamente ruim.',
    `Jogador: ${card.playerName}. Tipo: ${card.cardType}. Edição: ${card.editionIdentity?.cardLabel||'não identificada'}.`,
    `Card ID: ${card.editionIdentity?.officialCardId||'pendente'}; confirmado: ${card.editionIdentity?.officialCardIdVerified?'sim':'não'}.`,
    `Posição original: ${card.mainPosition}. Uso: ${analysisUsagePositionR138(result)}; função: ${analysisUsageFunctionR457(result)}.`,
    `Formação: ${result.tacticalProfile.formation}; estilo: ${result.tacticalProfile.style}. Nível máximo: ${card.level??'pendente'}; orçamento: ${result.trainingPointsTotal} PP.`,
    `Estilos: ${card.offensivePlaystyle||card.playstyle||'pendente'} / ${card.defensivePlaystyle||'pendente'}. Altura: ${card.height??'pendente'}; pé: ${card.dominantFoot??'pendente'}.`,
    `Nativas: ${card.nativeSkills.join('; ')}. Adicionais instaladas: ${(card.additionalSkills??[]).join('; ')}. Especiais: ${card.specialSkills.join('; ')}.`,
    `Ímpetos lidos: ${card.impetos.map(i=>i.name).join('; ')||'pendente'}. Não suponha vaga selecionável nem bônus do técnico.`,
    'Atributos exibidos no print (podem incluir treino e bônus):',
    ...Object.entries(card.attributes).map(([k,v])=>`${ATTRIBUTE_PT[k as keyof typeof ATTRIBUTE_PT]||k}: ${v}`),
    card.trainingBase?`Atributos de nível 1 pesquisados: ${JSON.stringify(card.trainingBase.attributes)}; bônus fixos: ${JSON.stringify(card.trainingBase.fixedBonus||{})}; fontes: ${card.trainingBase.sources.join(' ')}`:'Atributos de nível 1 ainda não confirmados. Não trate valores treinados como base nem invente a edição.',
    `Proposta local: ${JSON.stringify(result.training)}. Custo: ${result.trainingPointsUsed}; restantes: ${result.trainingPointsRemaining}.`,
    `Habilidades propostas: ${result.recommendedSkills.join('; ')}. Ímpetos propostos: ${result.recommendedImpetos.map(i=>i.name).join('; ')}.`,
    'Confira as fontes da edição exata e a regra de custo crescente. Separe fato, opinião da comunidade e hipótese. Entregue treino, até cinco adicionais que complementem as nativas, ímpeto compatível e um teste em partidas para comparar a proposta. Se faltar prova, identifique a pendência sem inventar valores.'
  ].join('\n');
}
