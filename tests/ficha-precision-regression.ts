import { analyzeCard } from '../src/lib/analyzer';

function assertCost(label: string, result: ReturnType<typeof analyzeCard>) {
  if (result.trainingPointsUsed > result.trainingPointsTotal) {
    throw new Error(`${label}: ficha passou do orçamento ${result.trainingPointsUsed}/${result.trainingPointsTotal}`);
  }
}

const cf = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Hristo Stoichkov
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 62
Finalização: 91
Talento ofensivo: 91
Força do chute: 90
Velocidade: 83
Aceleração: 86
Cabeçada: 77
Contato físico: 78
Passe rasteiro: 76
[FIM AJUSTES]
`, 'QUICK_COUNTER', 'AUTO');
assertCost('CA Artilheiro', cf);
if (cf.training.defending > 0) throw new Error(`CA Artilheiro não deve gastar em Defesa: ${JSON.stringify(cf.training)}`);
if (cf.training.shooting < 9) throw new Error(`CA Artilheiro precisa priorizar Finalização: ${JSON.stringify(cf.training)}`);

const orchestrator = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Pirlo
POSIÇÃO PRINCIPAL: DMF
ESTILO DE JOGO: Orquestrador
PONTOS TOTAIS: 62
Passe rasteiro: 92
Passe alto: 91
Controle de bola: 88
Condução firme: 84
Talento defensivo: 72
Desarme: 70
Resistência: 78
[FIM AJUSTES]
`, 'POSSESSION', 'AUTO');
assertCost('VOL Orquestrador', orchestrator);
if (orchestrator.training.passing < orchestrator.training.defending) {
  throw new Error(`VOL Orquestrador deve priorizar passe/saída, não destruidor puro: ${JSON.stringify(orchestrator.training)}`);
}

const anchor = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Casemiro
POSIÇÃO PRINCIPAL: DMF
ESTILO DE JOGO: Primeiro volante
PONTOS TOTAIS: 62
Talento defensivo: 88
Desarme: 88
Dedicação defensiva: 90
Agressividade: 86
Contato físico: 87
Passe rasteiro: 78
Cabeçada: 78
Salto: 79
[FIM AJUSTES]
`, 'DEFENSIVE', 'AUTO');
assertCost('Primeiro volante', anchor);
if (anchor.training.defending < 10) throw new Error(`Primeiro volante precisa proteger zaga com Defesa alta: ${JSON.stringify(anchor.training)}`);

const creativeCb = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Beckenbauer
POSIÇÃO PRINCIPAL: CB
ESTILO DE JOGO: Defensor criativo
PONTOS TOTAIS: 62
Talento defensivo: 88
Desarme: 86
Dedicação defensiva: 84
Passe rasteiro: 84
Passe alto: 86
Salto: 80
Contato físico: 80
[FIM AJUSTES]
`, 'COMPETITIVE', 'AUTO');
assertCost('ZAG Defensor criativo', creativeCb);
if (creativeCb.training.passing < 3) throw new Error(`ZAG defensor criativo precisa manter passe para saída: ${JSON.stringify(creativeCb.training)}`);
if (creativeCb.training.shooting > 0) throw new Error(`ZAG não deve gastar em finalização: ${JSON.stringify(creativeCb.training)}`);

if (!cf.deepAnalysis || cf.deepAnalysis.originalIdentity.indexOf('CA') < 0) throw new Error('Análise profunda não preservou identidade original.');
if (!cf.deepAnalysis.readingItems.some((item) => item.field === 'Posição original' && item.source === 'confirmado')) throw new Error('Auditoria não marcou posição manual como confirmada.');
if (cf.deepAnalysis.recommendedFunction.length < 3) throw new Error('Função recomendada não foi registrada na análise profunda.');
console.log('OK: motor v24.35 respeita função, orçamento e auditoria profunda da leitura.');

const convertedAmf = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Meia pela esquerda
POSIÇÃO PRINCIPAL: LMF
ESTILO DE JOGO: Perito em cruzamento
PONTOS TOTAIS: 62
Passe rasteiro: 84
Passe alto: 88
Controle de bola: 85
Drible: 82
Condução firme: 83
Aceleração: 81
Finalização: 72
[FIM AJUSTES]
`, 'CREATOR', 'AMF');
assertCost('Conversão ME para MAT', convertedAmf);
if (convertedAmf.bestPosition.code !== 'AMF') throw new Error(`Posição-alvo AMF foi ignorada: ${convertedAmf.bestPosition.code}`);
if (convertedAmf.training.passing < convertedAmf.training.defending) throw new Error(`MAT convertido deve priorizar criação: ${JSON.stringify(convertedAmf.training)}`);
if (!convertedAmf.recommendationExplanation[0]?.includes('Posição escolhida por você')) throw new Error('Conversão não foi explicada ao usuário.');

const convertedCb = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Volante destruidor
POSIÇÃO PRINCIPAL: DMF
ESTILO DE JOGO: O destruidor
PONTOS TOTAIS: 62
Talento defensivo: 86
Dedicação defensiva: 88
Desarme: 87
Agressividade: 90
Contato físico: 86
Salto: 79
Cabeçada: 77
Passe rasteiro: 75
[FIM AJUSTES]
`, 'DEFENSIVE', 'CB');
assertCost('Conversão VOL para ZAG', convertedCb);
if (convertedCb.bestPosition.code !== 'CB') throw new Error(`Posição-alvo CB foi ignorada: ${convertedCb.bestPosition.code}`);
if (convertedCb.training.defending < 11) throw new Error(`ZAG convertido precisa de Defesa alta: ${JSON.stringify(convertedCb.training)}`);
if (convertedCb.training.shooting > 0) throw new Error(`ZAG convertido não deve gastar em finalização: ${JSON.stringify(convertedCb.training)}`);

const convertedSs = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Ponta convertido
POSIÇÃO PRINCIPAL: RWF
ESTILO DE JOGO: Ala produtivo
PONTOS TOTAIS: 62
Talento ofensivo: 83
Controle de bola: 86
Drible: 88
Condução firme: 85
Finalização: 81
Velocidade: 88
Aceleração: 89
Passe rasteiro: 78
[FIM AJUSTES]
`, 'QUICK_COUNTER', 'SS');
assertCost('Conversão PD para SA', convertedSs);
if (convertedSs.bestPosition.code !== 'SS') throw new Error(`Posição-alvo SS foi ignorada: ${convertedSs.bestPosition.code}`);
if (convertedSs.training.dexterity < convertedSs.training.defending) throw new Error(`SA convertido deve priorizar mobilidade/ataque: ${JSON.stringify(convertedSs.training)}`);
const allFieldPositions = ['CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'CB', 'LB', 'RB'] as const;
for (const original of allFieldPositions) {
  for (const target of allFieldPositions) {
    const universal = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Conversão universal ${original} para ${target}
POSIÇÃO PRINCIPAL: ${original}
ESTILO DE JOGO: Jogador versátil
PONTOS TOTAIS: 62
Talento ofensivo: 82
Controle de bola: 83
Drible: 81
Condução firme: 82
Passe rasteiro: 82
Passe alto: 80
Finalização: 79
Cabeçada: 77
Talento defensivo: 78
Dedicação defensiva: 79
Desarme: 78
Agressividade: 78
Velocidade: 82
Aceleração: 82
Força do chute: 81
Impulsão: 79
Contato físico: 80
Equilíbrio: 81
Resistência: 83
[FIM AJUSTES]
`, 'COMPETITIVE', target);
    assertCost(`Conversão universal ${original}→${target}`, universal);
    if (universal.bestPosition.code !== target) {
      throw new Error(`Conversão universal falhou em ${original}→${target}: retornou ${universal.bestPosition.code}`);
    }
  }
}
console.log(`OK: v24.38 validou ${allFieldPositions.length * allFieldPositions.length} combinações de posição de linha, incluindo permanência e conversões entre todas as posições.`);

// v24.39 — as três fichas devem ser adaptativas, manter a posição escolhida e respeitar o orçamento.
const adaptiveElite = convertedCb;
if (adaptiveElite.buildVariants.length !== 3) throw new Error('v24.39 deve entregar exatamente três fichas adaptativas.');
for (const variant of adaptiveElite.buildVariants) {
  if (variant.positionLabel !== 'ZAG') throw new Error('Uma variante deixou de respeitar a posição escolhida.');
  if (!variant.qualityScore || variant.qualityScore < 1 || variant.qualityScore > 100) throw new Error('Nota de qualidade adaptativa inválida.');
  if (!variant.adaptationLabel) throw new Error('Avaliação de adaptação ausente.');
  if (variant.pointsUsed > adaptiveElite.trainingPointsTotal) throw new Error('Variante adaptativa ultrapassou o orçamento.');
}
if (new Set(adaptiveElite.buildVariants.map((item) => JSON.stringify(item.training))).size < 2) throw new Error('As fichas adaptativas ficaram idênticas.');
console.log('OK: v24.39 entrega três fichas adaptativas com nota, adaptação e orçamento válido.');

// v24.40 — cada ficha precisa explicar cenários, eficiência, equilíbrio e quantidade de simulações.
for (const variant of adaptiveElite.buildVariants) {
  if (!variant.efficiencyScore || variant.efficiencyScore < 1 || variant.efficiencyScore > 100) throw new Error('Eficiência por ponto inválida.');
  if (!variant.balanceScore || variant.balanceScore < 1 || variant.balanceScore > 100) throw new Error('Índice de equilíbrio inválido.');
  if (!variant.simulationsTested || variant.simulationsTested < 20) throw new Error('Motor simulou poucas distribuições.');
  if (!variant.verdict) throw new Error('Veredito técnico ausente.');
  if (!variant.scenarioScores) throw new Error('Cenários de desempenho ausentes.');
  for (const score of Object.values(variant.scenarioScores)) {
    if (score < 1 || score > 100) throw new Error('Nota de cenário fora da faixa válida.');
  }
}
console.log('OK: v24.40 compara eficiência, equilíbrio e cinco cenários de desempenho em cada ficha.');
