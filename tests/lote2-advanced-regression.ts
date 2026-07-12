import { analyzeCard, type PositionCode } from '../src/lib/analyzer';

const positions: PositionCode[] = ['CF','SS','LWF','RWF','LMF','RMF','AMF','CMF','DMF','CB','LB','RB','GK'];
const base = `CONFIRMACAO MANUAL: SIM
NOME: Jogador Teste
POSICAO ORIGINAL: VOL
ESTILO: O Destruidor
PONTOS DE TREINO: 64
ALTURA 184 cm
PESO 79 kg
PE DIREITO
VELOCIDADE 78
ACELERACAO 76
EQUILIBRIO 74
CONTATO FISICO 82
IMPULSAO 80
RESISTENCIA 84
CONSCIENCIA DEFENSIVA 82
DESARME 83
AGRESSIVIDADE 84
PASSE RASTEIRO 75
CONTROLE DE BOLA 73
FINALIZACAO 65
CABECEIO 78
CONSCIENCIA DO GOLEIRO 70
REFLEXOS DO GOLEIRO 72
ALCANCE DO GOLEIRO 72
ESPALMAR 70`;
for (const position of positions) {
  const result = analyzeCard(base, 'COMPETITIVE', position);
  if (result.bestPosition.code !== position) throw new Error(`Posição alterada: ${position}`);
  if (!result.physicalEngine || result.physicalEngine.suitabilityScore < 1 || result.physicalEngine.suitabilityScore > 100) throw new Error(`Motor físico inválido: ${position}`);
  if (!result.attributeGoals || result.attributeGoals.goals.length < 4) throw new Error(`Metas ausentes: ${position}`);
  if (result.attributeGoals.goals.some(goal => !goal.label || goal.targetMin > goal.targetIdeal)) throw new Error(`Meta inválida: ${position}`);
  if (!result.advancedOptimizer || !result.advancedOptimizer.positionPreserved || !result.advancedOptimizer.budgetRespected) throw new Error(`Otimizador inválido: ${position}`);
  if (result.buildVariants.some(item => item.pointsUsed > result.trainingPointsTotal)) throw new Error(`Orçamento excedido: ${position}`);
}
console.log(`Lote 2 aprovado: motor físico, metas e otimizador validados em ${positions.length} posições.`);
