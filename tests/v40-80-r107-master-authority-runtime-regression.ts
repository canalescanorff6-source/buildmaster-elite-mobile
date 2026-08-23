import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const text = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Auditor R107\nPOSIÇÃO PRINCIPAL: SS\nESTILO DE JOGO: Puxa marcação\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: Passe de primeira, Chute de primeira\nTalento ofensivo: 88\nControle de bola: 94\nDrible: 96\nCondução firme: 95\nPasse rasteiro: 84\nPasse alto: 78\nFinalização: 84\nCabeceio: 64\nCurva: 86\nVelocidade: 90\nAceleração: 94\nForça do chute: 82\nSalto: 66\nContato físico: 69\nEquilíbrio: 94\nResistência: 83\n[FIM AJUSTES]`;

const result:any = applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', 'SS', 'r107-master.png', {
  formation: '4-3-3', style: 'POSSE_DE_BOLA', gameplayMode: 'UNIVERSAL', connectionProfile: 'VARIABLE', controlProfile: 'DRIBBLE'
}));

const quality = result.performanceEngine2027R107;
assert.ok(quality, 'r107 precisa estar presente antes do Motor Mestre.');
assert.equal(quality.guards.exactBudget, true);
assert.equal(quality.guards.dnaProtected, true);
assert.equal(quality.guards.staminaBalanced, true);
assert.deepEqual(result.training, quality.winner.training, 'quando r107 passa nos guardas, o Motor Mestre deve realmente gravar a vencedora r107.');
assert.deepEqual(result.masterCardV4080R50?.masterTraining, quality.winner.training);
assert.equal(trainingPlanTotalCost(result.training), 64);
assert.ok(result.recommendationExplanation.some((line:string)=>/Motor Mestre aplicou Ficha Quality r107/.test(line)));

console.log('r107 autoridade aprovada: a ficha exibida é exatamente a vencedora Quality aplicada pelo Motor Mestre.');
