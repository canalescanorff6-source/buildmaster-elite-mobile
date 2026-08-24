import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const text = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Auditor R118\nPOSIÇÃO PRINCIPAL: SS\nESTILO DE JOGO: Puxa marcação\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: Passe de primeira, Chute de primeira\nTalento ofensivo: 88\nControle de bola: 94\nDrible: 96\nCondução firme: 95\nPasse rasteiro: 84\nPasse alto: 78\nFinalização: 84\nCabeceio: 64\nCurva: 86\nVelocidade: 90\nAceleração: 94\nForça do chute: 82\nSalto: 66\nContato físico: 69\nEquilíbrio: 94\nResistência: 83\n[FIM AJUSTES]`;

const result:any = applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', 'SS', 'r118-authority.png', {
  formation: '4-3-3', style: 'POSSE_DE_BOLA', gameplayMode: 'UNIVERSAL', connectionProfile: 'VARIABLE', controlProfile: 'DRIBBLE'
}));

assert.ok(result.performanceEngine2027R107, 'r107 precisa continuar disponível como especialista somente-leitura.');
assert.ok(result.performanceEngine2027R108, 'Card Signature/r108 precisa existir.');
assert.ok(result.finalDecisionAuthority2027R118, 'r118 permanece como auditoria histórica em Node.');
assert.ok(result.cleanSlate2027R119, 'r119 precisa selar a decisão final.');
assert.equal(result.masterCardV4080R50?.authorityMode, 'LEGACY_READ_ONLY');
assert.equal(result.cleanSlate2027R119.authority, 'CLEAN_SLATE_SINGLE_WRITER');
assert.deepEqual(result.training, result.cleanSlate2027R119.training);
assert.equal(trainingPlanTotalCost(result.training), 64);
assert.equal(result.trainingPointsRemaining, 0);
assert.deepEqual(result.recommendedSkills, result.cleanSlate2027R119.top5);
assert.equal(result.cleanSlate2027R119.guards.legacyEnginesReadOnly, true);
assert.equal(result.cleanSlate2027R119.guards.rawSnapshotProtected, true);
assert.equal(result.finalCardAuthorityV4080R45, undefined, 'r45 não pode executar quando Card Signature tem dados suficientes.');
assert.ok(!(result.recommendationExplanation as string[]).some((line:string) => /Motor Mestre aplicou Ficha Quality r107/.test(line)));

console.log('r107 compatível com r119: especialista histórico permanece read-only e Clean Slate sela a ficha final.');
