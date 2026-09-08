import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE='1';
const text=`[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Auditor R181
POSIÇÃO PRINCIPAL: SS
ESTILO DE JOGO: Puxa marcação
PONTOS TOTAIS: 64
Talento ofensivo: 88
Controle de bola: 94
Drible: 96
Condução firme: 95
Passe rasteiro: 84
Finalização: 84
Velocidade: 90
Aceleração: 94
Equilíbrio: 94
Resistência: 83
[FIM AJUSTES]`;
const result:any=applyCompleteCardIntelligence(analyzeCard(text,'COMPETITIVE','SS'));
assert.equal(result.performanceEngine2027R107, undefined);
assert.equal(result.performanceEngine2027R70, undefined);
assert.equal(result.performanceEngine2027R109, undefined);
assert.ok(result.cleanSlate2027R119);
assert.equal(result.cleanSlate2027R119.authority,'CLEAN_SLATE_SINGLE_WRITER');
assert.deepEqual(result.training,result.cleanSlate2027R119.training);
assert.equal(trainingPlanTotalCost(result.training),64);
assert.equal(result.trainingPointsRemaining,0);
console.log('r107 autoridade moderna aprovada: motores aposentados ausentes no fast path e Clean Slate R119 sela a saída.');
