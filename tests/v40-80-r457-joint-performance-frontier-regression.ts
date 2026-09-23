import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';
const source=fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts','utf8');
assert.match(source,/function selectJointConfigurationR457/);
assert.match(source,/PROVEN_WITHIN_EXACT_TRAINING_EQUIVALENCE_BAND/);
assert.match(source,/exactR457\.equivalentStates/);
assert.match(source,/evaluateCompactPlanR148\(state\.levels,evaluationContext,true\)/,'Skills/Ímpeto precisam receber ações detalhadas da ficha candidata.');
assert.doesNotMatch(source,/globalJointOptimality:true/,'Ímpeto funcional sem efeito numérico oficial não pode gerar falsa prova global conjunta.');
const raw=`[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Joint R457
POSIÇÃO PRINCIPAL: CMF
ESTILO DE JOGO: Orquestrador
PONTOS TOTAIS: 8
HABILIDADES JÁ POSSUI: Passe de primeira
Controle de bola: 86
Drible: 82
Condução firme: 84
Passe rasteiro: 91
Passe alto: 88
Talento ofensivo: 80
Finalização: 73
Velocidade: 82
Aceleração: 83
Equilíbrio: 84
Resistência: 89
Talento defensivo: 77
Dedicação defensiva: 80
Desarme: 78
Agressividade: 75
[FIM AJUSTES]`;
const request={rawText:raw,targetPosition:'CMF',objective:'COMPETITIVE' as const,tacticalProfile:{formation:'AUTO',style:'POSSE_DE_BOLA'} as any};
const result:any=createProductionAnalysisR138(request);
const exact=result.cleanSlate2027R119?.optimalityCertificateR457;
const joint=result.cleanSlate2027R119?.jointConfigurationR457;
assert.equal(exact?.status,'PROVEN_GLOBAL');
assert.equal(joint?.status,'PROVEN_WITHIN_EXACT_TRAINING_EQUIVALENCE_BAND');
assert.equal(joint?.globalJointOptimality,false);
assert.ok(joint?.equivalentTrainingCandidates>=1);
assert.ok(joint?.baseScoreSacrifice<=0.020001,'A escolha conjunta não pode sair da faixa de equivalência do ótimo exato.');
assert.equal(result.trainingPointsUsed,8);
assert.equal(result.finalAdditionalSkillSetR457?.exactFive,true);
assert.ok(result.finalAdditionalSkillSetR457?.finalSetScore>0,'Ações detalhadas precisam alimentar o Top 5 conjunto.');
assert.equal(result.finalImpetoDecisionR457?.automaticSpendAuthorized,false);
assert.ok(result.finalImpetoDecisionR457?.technicalIdealScore>=0);
const again:any=createProductionAnalysisR138(request);
assert.deepEqual(again.training,result.training,'Cache da certificação não pode mudar a seleção conjunta.');
assert.deepEqual(again.finalAdditionalSkillSetR457?.finalSkills,result.finalAdditionalSkillSetR457?.finalSkills);
console.log(`R457 Stage 8 aprovada: ${joint.equivalentTrainingCandidates} ficha(s) equivalentes comparadas com Top 5 + Ímpeto; sacrifício base ${joint.baseScoreSacrifice}.`);
