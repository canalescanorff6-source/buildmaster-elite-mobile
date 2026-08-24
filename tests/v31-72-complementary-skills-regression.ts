import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { canonicalSkillName, skillIdentityKey } from '../src/lib/officialSkillIdentity';
import { availableOfficialAdditionalSkillCount, isRoleCompatibleAdditionalSkill, resolveAdditionalSkillPosition } from '../src/lib/skillIntelligenceV31';

const tacticalProfile = {
  formation: '4-3-1-2' as const,
  style: 'POSSE_DE_BOLA' as const,
  managerId: 'manager-v3172',
  managerName: 'Técnico v31.72',
  managerProficiency: 90,
  managerBooster: 'duplo' as const
};

const cards = [
  {
    target: 'CF' as const,
    text: `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Atacante Complementar\nPOSIÇÃO PRINCIPAL: CF\nESTILO DE JOGO: Homem de Área\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: One-touch Pass, First-time Shot, Long-Range Shooting, Acrobatic Finishing, Heading\nTalento ofensivo: 91\nControle de bola: 84\nDrible: 78\nCondução firme: 77\nPasse rasteiro: 74\nPasse alto: 70\nFinalização: 92\nCabeçada: 89\nVelocidade: 82\nAceleração: 81\nForça do chute: 91\nSalto: 88\nContato físico: 90\nEquilíbrio: 77\nResistência: 82\n[FIM AJUSTES]`,
    expectedOwned: ['Passe de primeira', 'Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Cabeçada']
  },
  {
    target: 'CB' as const,
    text: `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Zagueiro Complementar\nPOSIÇÃO PRINCIPAL: CB\nESTILO DE JOGO: Defensor Criativo\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: Man Marking, Interception, Blocker, Aerial Superiority\nPasse rasteiro: 80\nPasse alto: 82\nTalento defensivo: 91\nDedicação defensiva: 92\nDesarme: 90\nAgressividade: 84\nVelocidade: 80\nAceleração: 77\nForça do chute: 82\nCabeçada: 88\nSalto: 89\nContato físico: 91\nEquilíbrio: 78\nResistência: 88\n[FIM AJUSTES]`,
    expectedOwned: ['Marcação individual', 'Interceptação', 'Bloqueador', 'Superioridade aérea']
  },
  {
    target: 'GK' as const,
    text: `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Goleiro Complementar\nPOSIÇÃO PRINCIPAL: GK\nESTILO DE JOGO: Goleiro Ofensivo\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: GK Low Punt, Penalty Saver, GK Long Throw\nTalento de GO: 91\nFirmeza de GO: 87\nDefesa de GO: 88\nReflexos de GO: 93\nAlcance de GO: 90\nSalto: 82\nContato físico: 84\nForça do chute: 86\n[FIM AJUSTES]`,
    expectedOwned: ['Reposição baixa do goleiro', 'Pegador de pênalti', 'Arremesso longo do goleiro']
  }
];

for (const card of cards) {
  const result = applyCompleteCardIntelligence(analyzeCard(card.text, 'COMPETITIVE', card.target, `${card.target}.png`, tacticalProfile));
  const ownedKeys = new Set(result.parsed.nativeSkills.map(skillIdentityKey));

  for (const expected of card.expectedOwned) {
    assert.ok(ownedKeys.has(skillIdentityKey(expected)), `${card.target}: alias deveria virar ${expected}.`);
  }
  const expectedCount = Math.min(5, availableOfficialAdditionalSkillCount(result));
  assert.equal(result.recommendedSkills.length, expectedCount, `${card.target}: deve entregar todas as habilidades oficiais restantes, até o limite de cinco.`);
  assert.equal(new Set(result.recommendedSkills.map(skillIdentityKey)).size, result.recommendedSkills.length, `${card.target}: Top 5 não pode repetir internamente.`);
  assert.ok(result.recommendedSkills.every((skill) => isRoleCompatibleAdditionalSkill(skill, resolveAdditionalSkillPosition(result))), `${card.target}: todas as cinco habilidades devem ser compatíveis com a função.`);
  assert.ok(result.recommendedSkills.every((skill) => !ownedKeys.has(skillIdentityKey(skill))), `${card.target}: recomendação não pode repetir habilidade existente.`);
  assert.ok(result.recommendedSkills.every((skill) => canonicalSkillName(skill) === skill), `${card.target}: recomendação deve usar nome oficial canônico.`);
  assert.ok(result.skillIntegrity, `${card.target}: auditoria final precisa existir.`);
  assert.equal(result.skillIntegrity?.removedDuplicates.length, 0, `${card.target}: o motor já deve impedir a duplicata antes do auditor final.`);
  assert.ok(result.recommendedImpetos.every((item) => !result.parsed.impetos.some((owned) => owned.active !== false && owned.name.toLowerCase() === item.name.toLowerCase())), `${card.target}: Ímpeto já aplicado nunca pode reaparecer como recomendação.`);
  assert.match(result.skillIntegrity?.checks.join(' ') ?? '', /Ímpetos foram avaliados em trilhas separadas/);
}



const everyPosition = [
  ['CF', 'Homem de Área', 'One-touch Pass'],
  ['SS', 'Jogador de Infiltração', 'Double Touch'],
  ['LWF', 'Ponta Prolífico', 'Pinpoint Crossing'],
  ['RWF', 'Flanco Móvel', 'Pinpoint Crossing'],
  ['LMF', 'Perito em Cruzamento', 'Track Back'],
  ['RMF', 'Perito em Cruzamento', 'Track Back'],
  ['AMF', 'Armador Criativo', 'Through Passing'],
  ['CMF', 'Meia Versátil', 'Weighted Pass'],
  ['DMF', 'Primeiro Volante', 'Interception'],
  ['CB', 'Defensor Criativo', 'Blocker'],
  ['LB', 'Lateral Defensivo', 'Man Marking'],
  ['RB', 'Lateral Defensivo', 'Man Marking'],
  ['GK', 'Goleiro Defensivo', 'GK Low Punt']
] as const;

for (const [target, playstyle, ownedAlias] of everyPosition) {
  const text = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Teste ${target}\nPOSIÇÃO PRINCIPAL: ${target}\nESTILO DE JOGO: ${playstyle}\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: ${ownedAlias}\nTalento ofensivo: 84\nControle de bola: 84\nDrible: 82\nCondução firme: 82\nPasse rasteiro: 84\nPasse alto: 84\nFinalização: 84\nCabeçada: 82\nVelocidade: 84\nAceleração: 84\nForça do chute: 84\nSalto: 82\nContato físico: 84\nEquilíbrio: 83\nResistência: 86\nTalento defensivo: 84\nDedicação defensiva: 84\nDesarme: 84\nAgressividade: 84\nTalento de GO: 88\nFirmeza de GO: 86\nDefesa de GO: 87\nReflexos de GO: 89\nAlcance de GO: 88\n[FIM AJUSTES]`;
  const result = applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', target, `${target}-all.png`, tacticalProfile));
  const owned = new Set([...result.parsed.nativeSkills, ...result.parsed.specialSkills].map(skillIdentityKey));
  const expectedCount = Math.min(5, availableOfficialAdditionalSkillCount(result));
  assert.equal(result.recommendedSkills.length, expectedCount, `${target}: deve receber todas as opções oficiais restantes, até cinco.`);
  assert.ok(result.recommendedSkills.every((skill) => !owned.has(skillIdentityKey(skill))), `${target}: nenhuma posição pode repetir habilidade existente.`);
  assert.ok(result.recommendedSkills.every((skill) => isRoleCompatibleAdditionalSkill(skill, resolveAdditionalSkillPosition(result))), `${target}: nenhuma habilidade pode sair do pool seguro da posição.`);
  assert.equal(new Set(result.recommendedSkills.map(skillIdentityKey)).size, result.recommendedSkills.length, `${target}: nenhuma posição pode repetir dentro do Top 5.`);
  assert.ok(result.skillIntegrity, `${target}: toda posição precisa da auditoria final.`);
  assert.ok(result.recommendedImpetos.every((item) => item.tier !== 'evitar'), `${target}: a autoridade final só pode expor Ímpeto aprovado; lista vazia é válida quando não houver recurso seguro.`);
  assert.equal(result.trainingPointsUsed, result.trainingPointsTotal, `${target}: a ficha de desempenho deve respeitar exatamente o orçamento de pontos.`);
  assert.equal(result.trainingPointsRemaining, 0, `${target}: a ficha não pode deixar pontos sem uso.`);
}

const headingAttributeOnly = analyzeCard(`[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Teste Cabeçada\nPOSIÇÃO PRINCIPAL: CF\nESTILO DE JOGO: Homem de Área\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: Passe de primeira\nCabeçada: 90\nFinalização: 90\nTalento ofensivo: 90\n[FIM AJUSTES]`, 'COMPETITIVE', 'CF');
assert.ok(!headingAttributeOnly.parsed.nativeSkills.some((skill) => skillIdentityKey(skill) === skillIdentityKey('Cabeçada')), 'Rótulo do atributo Cabeçada não pode ser confundido com habilidade nativa.');

console.log('v31.72 fichas, habilidades complementares e Ímpetos separados aprovados.');
