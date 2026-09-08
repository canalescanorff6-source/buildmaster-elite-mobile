import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { regenerateSkillAfterOwnedConfirmation } from '../src/lib/intelligentSkillReplacementV3830';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';

const CARD = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Pelé
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Superioridade aérea, Chute de primeira
HABILIDADES ESPECIAIS: Curva Blitz
Finalização: 94
Controle de bola: 88
Drible: 87
Condução firme: 86
Passe rasteiro: 77
Passe alto: 72
Cabeceio: 88
Curva: 90
Velocidade: 88
Aceleração: 89
Força do chute: 93
Salto: 87
Contato físico: 85
Equilíbrio: 84
Resistência: 82
[FIM AJUSTES]
Edson Arantes Nascimento
Nome Errado do OCR`;

const result = applyCompleteCardIntelligence(analyzeCard(CARD, 'COMPETITIVE', 'CF', 'pele-carta.png', {
  formation: 'AUTO',
  style: 'AUTO',
  gameplayMode: 'RANKED',
  connectionProfile: 'HIGH_DELAY',
  controlProfile: 'PASSING'
}));

assert.equal(result.parsed.playerName, 'Pelé', 'O nome digitado na revisão deve vencer qualquer nome completo encontrado pelo OCR.');
assert.ok(result.parsed.nativeSkills.some((skill) => skillIdentityKey(skill) === skillIdentityKey('Superioridade aérea')));
assert.ok(result.parsed.specialSkills.some((skill) => skillIdentityKey(skill) === skillIdentityKey('Curva Blitz')));
assert.equal(result.recommendedSkills.length, 5);
assert.ok(!result.recommendedSkills.some((skill) => skillIdentityKey(skill) === skillIdentityKey('Superioridade aérea')));
assert.deepEqual(result.recommendedSkills, result.skillIntegrity.recommendedSkills, 'O conjunto final e a auditoria antirrepetição precisam terminar sincronizados.');

const oldTopFive = [...result.recommendedSkills];
const skillAlreadyOwned = oldTopFive[0];
const replacement = regenerateSkillAfterOwnedConfirmation(result, skillAlreadyOwned);
const ownedKeys = new Set([
  ...replacement.result.parsed.nativeSkills,
  ...(replacement.result.parsed.additionalSkills ?? []),
  ...replacement.result.parsed.specialSkills
].map(skillIdentityKey));

assert.ok(ownedKeys.has(skillIdentityKey(skillAlreadyOwned)), 'Ao confirmar que já possui, a habilidade precisa entrar no inventário da carta.');
assert.ok(!replacement.result.recommendedSkills.some((skill) => skillIdentityKey(skill) === skillIdentityKey(skillAlreadyOwned)), 'A habilidade confirmada como existente não pode permanecer no Top 5.');
assert.equal(new Set(replacement.result.recommendedSkills.map(skillIdentityKey)).size, replacement.result.recommendedSkills.length);
assert.equal(replacement.result.recommendedSkills.length, 5, 'A nova análise deve recompor as cinco vagas quando houver opção oficial segura.');
assert.equal(replacement.result.bestPosition.code, 'CF');
assert.equal(replacement.result.trainingPointsUsed, 64);
assert.deepEqual(replacement.result.recommendedSkills, replacement.result.skillIntegrity.recommendedSkills);
assert.ok(replacement.replacementSkill, 'A troca inteligente deve identificar qual nova habilidade entrou no conjunto.');

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
assert.match(app, /HABILIDADES ESPECIAIS: \$\{selectedSpecialSkills\.join\(', '\)\}/);
assert.match(app, /regenerateSkillAfterOwnedConfirmation/);
assert.match(workspace, /Já possui\? Gerar outra/);
assert.match(workspace, /Já possui — gerar outra/);
assert.match(pipeline, /return enforceComplementarySkillIntegrity\(finalAdvanced\)/);

console.log('v38.30 aprovado: nome manual soberano, inventário completo e troca inteligente sem habilidades repetidas.');
