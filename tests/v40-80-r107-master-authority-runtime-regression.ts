import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const text = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Auditor R107\nPOSIÇÃO PRINCIPAL: SS\nESTILO DE JOGO: Puxa marcação\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: Passe de primeira, Chute de primeira\nTalento ofensivo: 88\nControle de bola: 94\nDrible: 96\nCondução firme: 95\nPasse rasteiro: 84\nPasse alto: 78\nFinalização: 84\nCabeceio: 64\nCurva: 86\nVelocidade: 90\nAceleração: 94\nForça do chute: 82\nSalto: 66\nContato físico: 69\nEquilíbrio: 94\nResistência: 83\n[FIM AJUSTES]`;

const result:any = applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', 'SS', 'r107-master.png', {
  formation: '4-3-3', style: 'POSSE_DE_BOLA', gameplayMode: 'UNIVERSAL', connectionProfile: 'VARIABLE', controlProfile: 'DRIBBLE'
}));

const quality = result.performanceEngine2027R107;
assert.ok(quality, 'r107 precisa continuar disponível como especialista Quality.');
assert.equal(quality.guards.exactBudget, true);
assert.equal(quality.guards.dnaProtected, true);
assert.equal(quality.guards.staminaBalanced, true);

const extreme = result.performanceEngine2027R108;
const position = result.performanceEngine2027R109;
const explanation = result.recommendationExplanation as string[];

const r109Applied = explanation.some((line:string) => /Motor Mestre aplicou Extreme Position r109/.test(line));
const r108Applied = explanation.some((line:string) => /Motor Mestre aplicou Extreme Gameplay r108/.test(line));
const r107Applied = explanation.some((line:string) => /Motor Mestre aplicou Ficha Quality r107/.test(line));
const r70Applied = explanation.some((line:string) => /Motor Mestre aplicou a candidata r70/.test(line));

if (r109Applied) {
  assert.ok(position?.adaptationApplied, 'r109 só pode ser declarado aplicado quando houver adaptação segura.');
  assert.deepEqual(result.training, position.appliedTraining);
} else if (r108Applied) {
  assert.ok(extreme, 'r108 declarado como aplicado precisa existir.');
  assert.deepEqual(result.training, extreme.winner.training);
} else if (r107Applied) {
  assert.deepEqual(result.training, quality.winner.training);
} else {
  assert.ok(
    r70Applied || result.masterCardV4080R50,
    'Se r109/r108/r107 forem barrados pelos guardas, o Motor Mestre deve manter fallback seguro e auditado.'
  );
}

assert.equal(trainingPlanTotalCost(result.training), 64);
assert.equal(result.trainingPointsRemaining, 0);
assert.deepEqual(result.masterCardV4080R50?.masterTraining, result.training, 'Ficha Mestre precisa espelhar exatamente a progressão final.');

const technical = Number(result.training.dribbling ?? 0) + Number(result.training.dexterity ?? 0);
const creation = Number(result.training.shooting ?? 0) + Number(result.training.passing ?? 0);
assert.ok(technical >= creation, 'Carta tecnicamente dominante não pode perder o DNA para chute+passe na ficha final.');
assert.ok(explanation.some((line:string) => /sem perseguir overall/i.test(line)), 'A entrega final precisa declarar explicitamente a proteção anti-overall.');

console.log('r107 autoridade atual aprovada: r109 > r108 > r107 > r70/final seguro, orçamento exato e DNA técnico preservado.');
