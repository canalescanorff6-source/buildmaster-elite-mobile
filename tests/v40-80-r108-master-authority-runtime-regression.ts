import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const text = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Auditor Extreme R108
POSIÇÃO PRINCIPAL: SS
ESTILO DE JOGO: Puxa marcação
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Duplo toque, Passe de primeira
Talento ofensivo: 90
Controle de bola: 94
Drible: 95
Condução firme: 94
Passe rasteiro: 86
Passe alto: 79
Finalização: 84
Cabeceio: 63
Curva: 86
Velocidade: 89
Aceleração: 93
Força do chute: 82
Salto: 65
Contato físico: 68
Equilíbrio: 93
Resistência: 83
[FIM AJUSTES]`;

const result:any = applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', 'SS', 'r108-master.png', {
  formation: '4-3-3', style: 'POSSE_DE_BOLA', gameplayMode: 'UNIVERSAL', connectionProfile: 'VARIABLE', controlProfile: 'DRIBBLE'
}));

const extreme = result.performanceEngine2027R108;
const position = result.performanceEngine2027R109;
const explanation = result.recommendationExplanation as string[];

assert.ok(extreme, 'r108 precisa estar presente antes do Motor Mestre.');
assert.equal(extreme.guards.exactBudget, true);
assert.equal(extreme.guards.overallIgnored, true);
assert.equal(extreme.guards.formationIndependent, true);
assert.equal(extreme.guards.positionSelectionDoesNotRewriteCore, true);
assert.equal(extreme.guards.synergyFirst, true);
assert.ok(extreme.winner.synergyScore >= 68);
assert.ok(extreme.winner.responseScore >= 66);

const r109Applied = explanation.some((line:string)=>/Motor Mestre aplicou Extreme Position r109/.test(line));
const r108Applied = explanation.some((line:string)=>/Motor Mestre aplicou Extreme Gameplay r108/.test(line));

if (r109Applied) {
  assert.ok(position, 'Se o Motor Mestre declarar r109, a análise r109 precisa existir.');
  assert.equal(position.adaptationApplied, true, 'r109 só pode substituir o núcleo quando houver adaptação posicional real.');
  assert.equal(position.guards.exactBudget, true);
  assert.equal(position.guards.overallIgnored, true);
  assert.equal(position.guards.formationIndependent, true);
  assert.equal(position.guards.minimumCorePreservation, true);
  assert.equal(position.guards.selectedPositionImproved, true);
  assert.equal(position.guards.extremeLossControlled, true);
  assert.deepEqual(position.coreTraining, extreme.winner.training, 'r109 deve partir exatamente do núcleo vencedor r108.');
  assert.deepEqual(result.training, position.appliedTraining, 'quando r109 passa nos guardas do Motor Mestre, a ficha final deve ser a adaptação posicional segura.');
  assert.deepEqual(result.masterCardV4080R50?.masterTraining, position.appliedTraining);
} else {
  assert.equal(r108Applied, true, 'sem r109 aplicado, r108 deve permanecer como autoridade antes dos fallbacks inferiores.');
  assert.deepEqual(result.training, extreme.winner.training, 'sem adaptação r109 aplicada, o Motor Mestre deve gravar exatamente a vencedora extrema r108.');
  assert.deepEqual(result.masterCardV4080R50?.masterTraining, extreme.winner.training);
}

assert.equal(trainingPlanTotalCost(result.training), 64);
assert.equal(result.trainingPointsRemaining, 0);
assert.ok(explanation.some((line:string)=>/sem perseguir overall/i.test(line)));
assert.ok(result.production2027R100?.performanceScore >= 60);

console.log(`r108/r109 autoridade aprovada: ${r109Applied ? 'r109 adaptou a execução preservando o núcleo r108' : 'r108 permaneceu como ficha final'}.`);
