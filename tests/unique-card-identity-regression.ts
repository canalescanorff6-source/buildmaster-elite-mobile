import { analyzeCard } from '../src/lib/analyzer';

function card(name: string, style: string, special: string, attrs: string) {
  return analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: ${name}
POSIÇÃO PRINCIPAL: AMF
ESTILO DE JOGO: ${style}
HABILIDADE ESPECIAL: ${special}
PONTOS TOTAIS: 62
${attrs}
[FIM AJUSTES]
`, 'COMPETITIVE', 'AMF');
}

const creator = card('Criador técnico', 'Armador criativo', 'Phenomenal Pass', `
Controle de bola: 91
Drible: 85
Condução firme: 90
Passe rasteiro: 93
Passe alto: 91
Finalização: 72
Talento ofensivo: 82
Velocidade: 76
Aceleração: 79
Equilíbrio: 86
Resistência: 78
`);

const finisher = card('Meia infiltrador', 'Jogador de infiltração', 'Phenomenal Finishing', `
Controle de bola: 85
Drible: 87
Condução firme: 84
Passe rasteiro: 78
Passe alto: 74
Finalização: 91
Talento ofensivo: 90
Velocidade: 86
Aceleração: 89
Força do chute: 90
Equilíbrio: 82
Resistência: 80
`);

if (JSON.stringify(creator.training) === JSON.stringify(finisher.training)) {
  throw new Error(`Cartas diferentes na mesma posição receberam ficha idêntica: ${JSON.stringify(creator.training)}`);
}
if ((creator.cardDna?.behavior.creation ?? 0) <= (finisher.cardDna?.behavior.creation ?? 0)) {
  throw new Error('O criador deveria projetar mais criação, mesmo quando a distribuição corrige outras lacunas.');
}
if ((finisher.cardDna?.behavior.finishing ?? 0) <= (creator.cardDna?.behavior.finishing ?? 0)) {
  throw new Error('O infiltrador finalizador deveria projetar mais finalização.');
}
if (creator.playerIdentity!.signature === finisher.playerIdentity!.signature) throw new Error('Assinaturas de identidade ficaram iguais.');
if (!creator.playerIdentity!.decisiveFactors.some((item) => item.includes('Armador criativo'))) throw new Error('Estilo oficial não entrou na identidade do criador.');
if (!finisher.playerIdentity!.decisiveFactors.some((item) => item.includes('Jogador de infiltração'))) throw new Error('Estilo oficial não entrou na identidade do finalizador.');

const fastCb = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Zagueiro rápido construtor
POSIÇÃO PRINCIPAL: CB
ESTILO DE JOGO: Defensor criativo
PONTOS TOTAIS: 62
Talento defensivo: 84
Dedicação defensiva: 83
Desarme: 84
Passe rasteiro: 87
Passe alto: 88
Velocidade: 86
Aceleração: 82
Contato físico: 78
Cabeçada: 74
Salto: 75
[FIM AJUSTES]
`, 'COMPETITIVE', 'CB');

const aerialCb = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Zagueiro físico aéreo
POSIÇÃO PRINCIPAL: CB
ESTILO DE JOGO: O destruidor
ALTURA: 193
PESO: 91
PONTOS TOTAIS: 62
Talento defensivo: 89
Dedicação defensiva: 88
Desarme: 88
Passe rasteiro: 72
Passe alto: 74
Velocidade: 72
Aceleração: 68
Contato físico: 94
Cabeçada: 92
Salto: 91
[FIM AJUSTES]
`, 'COMPETITIVE', 'CB');

if (JSON.stringify(fastCb.training) === JSON.stringify(aerialCb.training)) throw new Error('Dois zagueiros de identidade oposta receberam a mesma ficha.');
if ((fastCb.cardDna?.behavior.creation ?? 0) <= (aerialCb.cardDna?.behavior.creation ?? 0)) throw new Error('Zagueiro construtor rápido deveria projetar melhor saída/criação.');
if ((aerialCb.cardDna?.behavior.physicalDuels ?? 0) <= (fastCb.cardDna?.behavior.physicalDuels ?? 0)) throw new Error('Zagueiro aéreo deveria projetar mais força nos duelos.');

for (const result of [creator, finisher, fastCb, aerialCb]) {
  if (result.trainingPointsUsed > result.trainingPointsTotal) throw new Error('Ficha individual ultrapassou o orçamento.');
  if (result.bestPosition.code !== (result.parsed.mainPosition === 'CB' ? 'CB' : 'AMF')) throw new Error('Posição escolhida não foi preservada.');
}
console.log('OK: v25.83 gera fichas diferentes por identidade real da carta, mesmo na mesma posição.');
