import { analyzeCard } from '../src/lib/analyzer';

const sample = analyzeCard([
  'NOME DO JOGADOR: Stoichkov',
  'POSIÇÃO PRINCIPAL: CF',
  'ESTILO DE JOGO: Artilheiro',
  'NÍVEL MÁXIMO: 32',
  'PONTOS TOTAIS: 62',
  'CONFIRMAÇÃO MANUAL: SIM'
].join('\n'), 'COMPETITIVE', 'AUTO', 'teste-premium-plus', { formation: '4-2-2-2', style: 'CONTRA_ATAQUE_RAPIDO' });

if (sample.trainingPointsUsed > sample.trainingPointsTotal) {
  throw new Error('Ficha passou do orçamento de pontos.');
}

const forbidden = ['Volta para marcar', 'Interceptação', 'Marcação individual', 'Carrinho', 'Bloqueador'];
for (const skill of forbidden) {
  if (sample.recommendedSkills.includes(skill)) {
    throw new Error(`CA Artilheiro recebeu habilidade incompatível no Top 5: ${skill}`);
  }
}

if (!sample.teamMap?.functionLabel) {
  throw new Error('Mapa do jogador não retornou função real.');
}

console.log('Premium Plus OK:', sample.parsed.playerName, sample.trainingPointsUsed, '/', sample.trainingPointsTotal);
