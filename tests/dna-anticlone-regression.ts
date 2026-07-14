import { analyzeCard } from '../src/lib/analyzer';
import { comparePlayers } from '../src/lib/confidenceComparison';

function makeCard(name: string, style: string, special: string, attrs: string, position: 'AMF' | 'CB' = 'AMF') {
  return analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: ${name}
POSIÇÃO PRINCIPAL: ${position}
ESTILO DE JOGO: ${style}
HABILIDADE ESPECIAL: ${special}
PONTOS TOTAIS: 62
${attrs}
[FIM AJUSTES]
`, 'COMPETITIVE', position);
}

const creator = makeCard('Versão criadora', 'Armador criativo', 'Phenomenal Pass', `
Controle de bola: 92
Drible: 86
Condução firme: 91
Passe rasteiro: 94
Passe alto: 92
Finalização: 71
Talento ofensivo: 84
Velocidade: 76
Aceleração: 80
Equilíbrio: 88
Resistência: 79
`);

const finisher = makeCard('Versão finalizadora', 'Jogador de infiltração', 'Phenomenal Finishing', `
Controle de bola: 85
Drible: 87
Condução firme: 84
Passe rasteiro: 77
Passe alto: 73
Finalização: 93
Talento ofensivo: 92
Velocidade: 86
Aceleração: 90
Força do chute: 91
Equilíbrio: 83
Resistência: 81
`);

for (const result of [creator, finisher]) {
  if (!result.cardDna) throw new Error('DNA individual não foi gerado.');
  if (result.buildVariants.length !== 3) throw new Error('O motor precisa entregar três fichas DNA.');
  const titles = result.buildVariants.map((item) => item.title);
  if (!titles.some((title) => /híbrida DNA/i.test(title))) throw new Error('Ficha híbrida DNA ausente.');
  if (!titles.some((title) => /identidade/i.test(title))) throw new Error('Ficha identidade ausente.');
  if (!titles.some((title) => /adaptação/i.test(title))) throw new Error('Ficha adaptação ausente.');
  if (new Set(result.buildVariants.map((item) => JSON.stringify(item.training))).size < 3) throw new Error('As três filosofias ficaram com a mesma distribuição.');
  if (result.trainingPointsUsed > result.trainingPointsTotal) throw new Error('Ficha DNA ultrapassou o orçamento.');
  if (result.bestPosition.code !== 'AMF') throw new Error('A posição escolhida foi alterada.');
  if (result.cardDna.individualGoals.length < 4) throw new Error('Metas individuais insuficientes.');
  if (result.cardDna.antiClone.fingerprint.length < 8) throw new Error('Fingerprint anticlone inválida.');
  if (result.cardDna.behavior.matchConsistency < 1 || result.cardDna.behavior.matchConsistency > 99) throw new Error('Simulação de comportamento fora da faixa.');
}

if (JSON.stringify(creator.training) === JSON.stringify(finisher.training)) throw new Error('Cartas opostas na mesma posição ainda receberam a mesma ficha principal.');
if (creator.cardDna!.behavior.creation <= finisher.cardDna!.behavior.creation) throw new Error('A versão criadora deveria projetar mais criação.');
if (finisher.cardDna!.behavior.finishing <= creator.cardDna!.behavior.finishing) throw new Error('A versão finalizadora deveria projetar mais finalização.');
if (!creator.cardDna!.skillSynergies.some((item) => item.name === 'Phenomenal Pass')) throw new Error('Phenomenal Pass não entrou na sinergia profunda.');
if (!finisher.cardDna!.skillSynergies.some((item) => item.name === 'Phenomenal Finishing')) throw new Error('Phenomenal Finishing não entrou na sinergia profunda.');
if (creator.cardDna!.versionSignature === finisher.cardDna!.versionSignature) throw new Error('Versões diferentes ficaram com a mesma assinatura DNA.');

const shortDefender = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Defensor baixo técnico
POSIÇÃO PRINCIPAL: DMF
ESTILO DE JOGO: Orquestrador
ALTURA: 170
PESO: 67
HABILIDADE ESPECIAL: Esticada de Perna
PONTOS TOTAIS: 62
Talento defensivo: 83
Dedicação defensiva: 85
Desarme: 87
Passe rasteiro: 88
Passe alto: 86
Velocidade: 84
Aceleração: 86
Contato físico: 72
Cabeçada: 63
Salto: 66
Equilíbrio: 88
Resistência: 87
[FIM AJUSTES]
`, 'COMPETITIVE', 'CB');

const aerialWeakness = shortDefender.cardDna?.weaknessStrategies.find((item) => item.training === 'aerialStrength');
if (!aerialWeakness || aerialWeakness.correctability !== 'baixa') throw new Error('Limitação aérea natural de jogador baixo não foi reconhecida.');
if (!shortDefender.cardDna?.skillSynergies.some((item) => item.name === 'Esticada de Perna')) throw new Error('Esticada de Perna não foi analisada.');

const comparison = comparePlayers([{ id:'creator', result:creator }, { id:'finisher', result:finisher }], 'AMF');
if (comparison.ranking.length !== 2) throw new Error('Comparador DNA não retornou os dois jogadores.');
if (comparison.ranking.some((item) => item.dna <= 0 || !item.uniqueEdge || !item.behavior)) throw new Error('Comparador não incluiu DNA e comportamento.');

console.log('OK: v25.83 cria DNA por versão, metas individuais, três fichas distintas, habilidades profundas, comportamento e proteção anticlone.');
