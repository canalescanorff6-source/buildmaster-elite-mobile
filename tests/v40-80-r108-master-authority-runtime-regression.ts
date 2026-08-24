import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const text = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Auditor Card Signature
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

const result:any = applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', 'SS', 'r118-card-signature.png', {
  formation: '4-3-3', style: 'POSSE_DE_BOLA', gameplayMode: 'UNIVERSAL', connectionProfile: 'VARIABLE', controlProfile: 'DRIBBLE'
}));

const extreme = result.performanceEngine2027R108;
const authority = result.cleanSlate2027R119;
assert.ok(extreme, 'r108/Card Signature precisa continuar presente como especialista.');
assert.ok(authority, 'r119 precisa existir.');
assert.equal(extreme.authority, 'SPECIALIST_READ_ONLY');
assert.equal(extreme.guards.overallIgnored, true);
assert.equal(extreme.guards.formationIndependent, true);
assert.equal(authority.authority, 'CLEAN_SLATE_SINGLE_WRITER');
assert.deepEqual(result.training, authority.training);
assert.equal(trainingPlanTotalCost(result.training), 64);
assert.ok(
  JSON.stringify(result.training) === JSON.stringify(authority.training),
  'A ficha final deve ser exatamente a decisão Clean Slate.'
);
assert.deepEqual(result.recommendedSkills, authority.top5);
assert.equal(result.recommendedImpetos?.[0]?.name ?? null, authority.recommendedImpeto ?? null);
assert.equal(result.finalCardAuthorityV4080R45, undefined);
assert.ok((result.recommendationExplanation as string[]).some((line:string) => /Motor final: Clean Slate r119/.test(line)));

console.log('r108/r119 aprovado: Card Signature fica em auditoria e Clean Slate sela ficha + Top 5 + Ímpeto.');
