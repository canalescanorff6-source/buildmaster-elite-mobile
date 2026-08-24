import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';

const text = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Atacante Integridade Final
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 64
ÍMPETO: Chute
HABILIDADES JÁ POSSUI: Chute de primeira, Passe de primeira
Talento ofensivo: 90
Controle de bola: 83
Drible: 82
Condução firme: 82
Passe rasteiro: 76
Passe alto: 72
Finalização: 90
Cabeçada: 80
Velocidade: 85
Aceleração: 85
Força do chute: 90
Salto: 80
Contato físico: 80
Equilíbrio: 82
Resistência: 82
[FIM AJUSTES]`;

const result = applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', 'CF', 'integridade-final.png', {
  formation: '4-3-3',
  style: 'CONTRA_ATAQUE_RAPIDO'
}));

const ownedSkills = new Set([...result.parsed.nativeSkills, ...result.parsed.specialSkills].map(skillIdentityKey));
const usableImpetos = result.recommendedImpetos.filter((item) => item.tier !== 'evitar');

assert.equal(result.trainingPointsUsed, 64, 'A ficha final deve usar exatamente os pontos informados.');
assert.equal(result.trainingPointsRemaining, 0, 'A ficha final não pode deixar pontos sobrando.');
assert.equal(result.recommendedSkills.length, 5, 'A ficha deve entregar exatamente cinco habilidades adicionais.');
assert.equal(new Set(result.recommendedSkills.map(skillIdentityKey)).size, 5, 'As cinco habilidades devem ser únicas.');
assert.ok(result.recommendedSkills.every((skill) => !ownedSkills.has(skillIdentityKey(skill))), 'Nenhuma habilidade adicional pode repetir habilidade já existente.');
assert.ok(usableImpetos.every((item) => item.name.toLowerCase() !== 'chute'), 'O Ímpeto já presente na carta não pode ser recomendado novamente.');
assert.equal((result as typeof result & { finalDecisionAuthority2027R118?: { currentImpeto?: string | null; impetoDecision?: string } }).finalDecisionAuthority2027R118?.currentImpeto?.toLowerCase(), 'chute', 'O r118 deve reconhecer o Ímpeto já aplicado como recurso atual da carta.');
assert.equal((result as typeof result & { finalDecisionAuthority2027R118?: { currentImpeto?: string | null; impetoDecision?: string } }).finalDecisionAuthority2027R118?.impetoDecision, 'KEEP_CURRENT', 'Ímpeto já aplicado deve ser preservado, não recomendado novamente.');

console.log('v31.82 integridade runtime de ficha, Top 5 e Ímpetos aprovada.');
