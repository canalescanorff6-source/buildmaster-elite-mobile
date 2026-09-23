import assert from 'node:assert/strict';
import { createProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';
import { cardIdentityFingerprintR126, cardUsageIdentityKeyR126 } from '../src/lib/cardIdentityFingerprintR126';
import { inspectPlaystyleActivationR124 } from '../src/lib/efootball2027PhaseCatalogR124';
import { isCurrentProductionAnalysisR128 } from '../src/lib/productionAuthorityR128';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const raw=(ger:number)=>`[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Integração R457
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: CMF
ESTILO DE JOGO: Orquestrador
PONTOS TOTAIS: 8
GER: ${ger}
HABILIDADES JÁ POSSUI: Passe de primeira
Controle de bola: 88
Drible: 84
Condução firme: 87
Passe rasteiro: 92
Passe alto: 89
Talento ofensivo: 80
Finalização: 74
Velocidade: 82
Aceleração: 83
Força do chute: 81
Equilíbrio: 85
Resistência: 90
Talento defensivo: 78
Dedicação defensiva: 81
Desarme: 79
Agressividade: 76
Contato físico: 79
Salto: 72
Cabeceio: 69
[FIM AJUSTES]`;

function analyze(ger:number){
 return createProductionAnalysisR138({
  rawText:raw(ger),objective:'COMPETITIVE',targetPosition:'CMF',
  tacticalProfile:{formation:'4-2-2-2',style:'POSSE_DE_BOLA'} as any
 }) as any;
}
const a=analyze(105),b=analyze(119),repeat=analyze(105);

assert.equal(cardIdentityFingerprintR126(a.parsed),cardIdentityFingerprintR126(b.parsed),'GER não pode trocar a identidade da carta.');
assert.deepEqual(a.training,b.training,'GER não pode alterar a ficha.');
assert.deepEqual(a.finalAdditionalSkillSetR457?.finalSkills,b.finalAdditionalSkillSetR457?.finalSkills,'GER não pode alterar os cinco slots ideais.');
assert.equal(a.finalImpetoDecisionR457?.technicalIdeal,b.finalImpetoDecisionR457?.technicalIdeal,'GER não pode alterar Ímpeto técnico ideal.');
assert.deepEqual(a.training,repeat.training,'Mesma entrada precisa produzir a mesma ficha.');
assert.deepEqual(a.finalAdditionalSkillSetR457?.finalSkills,repeat.finalAdditionalSkillSetR457?.finalSkills,'Conjunto de skills precisa ser determinístico.');
assert.equal(trainingPlanTotalCost(a.training),8);
assert.equal(a.trainingPointsUsed,8);
assert.equal(a.trainingPointsRemaining,0);
assert.equal(a.cleanSlate2027R119?.guards?.exactBudget,true);
assert.equal(a.cleanSlate2027R119?.optimalityCertificateR457?.status,'PROVEN_GLOBAL');
assert.equal(a.finalAdditionalSkillSetR457?.exactFive,true);
assert.equal(new Set(a.finalAdditionalSkillSetR457?.finalSkills??[]).size,5);
assert.equal(a.finalAdditionalSkillSetR457?.officialOnly,true);
assert.equal(a.finalImpetoDecisionR457?.automaticSpendAuthorized,false);
assert.equal(a.finalImpetoDecisionR457?.numericAttributeEffectVerified,false);
assert.equal(a.cleanSlate2027R119?.jointConfigurationR457?.globalJointOptimality,false,'Ímpeto sem efeito numérico oficial estruturado não pode gerar falsa prova global.');
assert.equal(isCurrentProductionAnalysisR128(a),true,'Saída integrada precisa manter selo R128 atual.');

assert.equal(inspectPlaystyleActivationR124('Ala Produtivo','OFFENSIVE','RB').status,'LIKELY_INACTIVE');
assert.equal(inspectPlaystyleActivationR124('Ala Produtivo','OFFENSIVE','RWF').status,'LIKELY_ACTIVE');

const card:any={...a.parsed};
assert.notEqual(
 cardUsageIdentityKeyR126(card,'CMF','MLG orquestrador'),
 cardUsageIdentityKeyR126(card,'CMF','MLG box-to-box'),
 'Funções diferentes na mesma posição devem ser builds diferentes da mesma carta.'
);

assert.equal(a.cleanSlate2027R119?.canonicalDnaR457?.safeguards?.overallExcluded,true);
assert.equal(a.cleanSlate2027R119?.canonicalDnaR457?.safeguards?.additionalSkillsExcluded,true);
assert.equal(a.cleanSlate2027R119?.canonicalDnaR457?.safeguards?.impetoExcluded,true);

console.log('R457 integração core aprovada: identidade, GER neutro, PP exatos, skills, Ímpeto seguro, DNA, função, estilo e R128 convergem.');
