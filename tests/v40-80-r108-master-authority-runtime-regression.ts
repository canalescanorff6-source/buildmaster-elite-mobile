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
assert.ok(extreme, 'r108 precisa estar presente antes do Motor Mestre.');
assert.equal(extreme.guards.exactBudget, true);
assert.equal(extreme.guards.overallIgnored, true);
assert.equal(extreme.guards.formationIndependent, true);
assert.equal(extreme.guards.positionSelectionDoesNotRewriteCore, true);
assert.equal(extreme.guards.synergyFirst, true);
assert.ok(extreme.winner.synergyScore >= 68);
assert.ok(extreme.winner.responseScore >= 66);
assert.deepEqual(result.training, extreme.winner.training, 'quando r108 passa nos guardas, o Motor Mestre deve gravar exatamente a vencedora extrema.');
assert.deepEqual(result.masterCardV4080R50?.masterTraining, extreme.winner.training);
assert.equal(trainingPlanTotalCost(result.training), 64);
assert.ok(result.recommendationExplanation.some((line:string)=>/Motor Mestre aplicou Extreme Gameplay r108/.test(line)));
assert.ok(result.production2027R100?.performanceScore >= 60);

console.log('r108 autoridade aprovada: Motor Mestre entrega exatamente a ficha Extreme Gameplay escolhida.');
