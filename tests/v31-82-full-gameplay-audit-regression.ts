import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';
import { RECOGNIZABLE_IMPETO_NAMES } from '../src/lib/officialImpetoCatalog';
import { getLocalImpetoCatalog } from '../src/lib/localAiEngine';
import { readDetailedPrint } from '../src/modules/card-reader/detailedPrintReader';

const card = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Auditoria Gameplay Completa
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI:
Talento ofensivo: 92
Controle de bola: 85
Drible: 82
Condução firme: 80
Passe rasteiro: 76
Passe alto: 73
Finalização: 90
Cabeceio: 82
Velocidade: 86
Aceleração: 85
Força do chute: 91
Salto: 82
Contato físico: 82
Equilíbrio: 81
Resistência: 84
[FIM AJUSTES]`;

const profile = (formation: '4-2-2-2' | '5-3-2', proficiency: number) => ({
  formation,
  style: 'CONTRA_ATAQUE_RAPIDO' as const,
  managerId: 'manager-audit',
  managerName: 'Técnico de Auditoria',
  managerProficiency: proficiency,
  managerBooster: 'padrao' as const
});

function run(text: string, formation: '4-2-2-2' | '5-3-2' = '4-2-2-2', proficiency = 90) {
  return applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', 'CF', 'audit-same-card.png', profile(formation, proficiency)));
}

const emptySkills = run(card);
assert.deepEqual(emptySkills.parsed.nativeSkills, [], 'Uma linha vazia de habilidades não pode capturar o atributo seguinte.');
assert.equal(emptySkills.trainingPointsUsed, 64);
assert.equal(emptySkills.trainingPointsRemaining, 0);
assert.equal(emptySkills.recommendedSkills.length, 5);

const newlyOwned = emptySkills.recommendedSkills[0];
const withOwnedSkill = run(card.replace('HABILIDADES JÁ POSSUI:', `HABILIDADES JÁ POSSUI: ${newlyOwned}`));
assert.ok(withOwnedSkill.parsed.nativeSkills.some((skill) => skillIdentityKey(skill) === skillIdentityKey(newlyOwned)), 'A nova habilidade nativa precisa entrar na leitura atual.');
assert.ok(withOwnedSkill.recommendedSkills.every((skill) => skillIdentityKey(skill) !== skillIdentityKey(newlyOwned)), 'O cache não pode devolver a recomendação antiga após mudar as habilidades da carta.');
assert.equal(new Set(withOwnedSkill.recommendedSkills.map(skillIdentityKey)).size, 5);

const narrow = run(card, '4-2-2-2', 90);
const backFive = run(card, '5-3-2', 90);
assert.deepEqual(narrow.training, backFive.training, 'Na v35, a formação não pode alterar a ficha universal da posição escolhida.');
assert.deepEqual(narrow.recommendedSkills, backFive.recommendedSkills, 'Na v35, a formação não pode alterar o Top 5 de habilidades adicionais.');
assert.equal(narrow.supremeGameplay?.dimensions.tacticalFit, backFive.supremeGameplay?.dimensions.tacticalFit, 'O encaixe tático deve permanecer universal quando apenas a formação muda.');
assert.ok(narrow.recommendedSkills.some((skill) => ['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Cabeçada', 'Superioridade aérea', 'Chute com o peito do pé'].includes(skill)), 'O atacante deve receber complemento oficial coerente com seu DNA e sua posição, sem depender da formação.');

const lowerManager = run(card, '5-3-2', 70);
const eliteManager = run(card, '5-3-2', 90);
assert.notEqual(lowerManager.supremeGameplay?.dimensions.managerFit, eliteManager.supremeGameplay?.dimensions.managerFit, 'A proficiência do técnico deve alterar o encaixe medido.');
assert.notEqual(lowerManager.supremeGameplay?.dimensions.tacticalFit, eliteManager.supremeGameplay?.dimensions.tacticalFit, 'A proficiência deve controlar quanto o contexto tático influencia cada candidata.');


const impetoText = RECOGNIZABLE_IMPETO_NAMES.map((name) => `${name} +1`).join('\n');
const impetoRead = readDetailedPrint(`${impetoText}\nEsticada de Perna +1\nSombra veloz +1`, []);
assert.equal(impetoRead.impetos.length, RECOGNIZABLE_IMPETO_NAMES.length, 'O OCR precisa reconhecer o mesmo catálogo usado pelo motor de recomendação.');
assert.ok(RECOGNIZABLE_IMPETO_NAMES.every((name) => impetoRead.impetos.some((item) => item.value.startsWith(`${name} +`))), 'Nenhum Ímpeto reconhecido pode faltar no scanner.');
assert.ok(impetoRead.impetos.every((item) => !/Esticada de Perna|Sombra veloz|Impulso ofensivo/i.test(item.value)), 'Habilidades especiais não podem ser classificadas como Ímpetos.');
assert.deepEqual(new Set(getLocalImpetoCatalog()), new Set(RECOGNIZABLE_IMPETO_NAMES), 'Scanner, analisador e IA local precisam usar o mesmo catálogo de Ímpetos.');

const fingerprint = fs.readFileSync('src/lib/cardAnalysisFingerprint.ts', 'utf8');
assert.match(fingerprint, /parsed\.attributes/);
assert.match(fingerprint, /parsed\.nativeSkills/);
assert.doesNotMatch(fingerprint, /tacticalProfile\.formation/, 'A formação não deve invalidar o cache da ficha universal.');
const supreme = fs.readFileSync('src/lib/supremeGameplayEngine.ts', 'utf8');
assert.doesNotMatch(supreme, /formationRoleWeights/, 'A ficha universal v35 não deve depender de peso da formação.');
assert.match(supreme, /managerTacticalTrust/);
assert.match(supreme, /currentGameplayAdjustment/);
assert.match(supreme, /defensiveAwareness/);
assert.match(supreme, /tightPossession/);
assert.match(supreme, /kickingPower/);
const skills = fs.readFileSync('src/lib/skillIntelligenceV31.ts', 'utf8');
assert.match(skills, /tacticalSkillScore/);
const impetos = fs.readFileSync('src/lib/localAiEngine.ts', 'utf8');
assert.match(impetos, /tacticalImpetoSynergy/);

console.log('v31.82/v35 auditoria de cache, ficha universal, habilidades oficiais e Ímpetos aprovada.');
