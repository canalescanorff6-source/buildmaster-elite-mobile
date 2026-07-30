import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { extractCanonicalSkillsFromText, isLikelySkillOcrNoise, skillIdentityKey } from '../src/lib/officialSkillIdentity';
import { readDetailedPrint } from '../src/modules/card-reader/detailedPrintReader';
import type { PremiumZoneReading } from '../src/lib/premiumReading';
import { ADDITIONAL_SKILL_ENGINE_VERSION, isRoleCompatibleAdditionalSkill, resolveAdditionalSkillPosition } from '../src/lib/skillIntelligenceV31';

const tacticalProfile = {
  formation: '4-2-2-2' as const,
  style: 'POSSE_DE_BOLA' as const,
  managerId: 'manager-v3180',
  managerName: 'Técnico v31.80',
  managerProficiency: 90,
  managerBooster: 'duplo' as const
};

assert.deepEqual(
  extractCanonicalSkillsFromText('Passe de primeira Passe em profundidade'),
  ['Passe de primeira', 'Passe em profundidade']
);
assert.deepEqual(
  extractCanonicalSkillsFromText('Passe na medida Passe aéreo baixo'),
  ['Passe na medida', 'Passe aéreo baixo']
);
assert.deepEqual(extractCanonicalSkillsFromText('Ply O IN A'), []);
assert.equal(isLikelySkillOcrNoise('Ply'), true);
assert.equal(isLikelySkillOcrNoise('O IN A'), true);

const noisyReading: PremiumZoneReading = {
  key: 'skills', label: 'Habilidades',
  text: 'Ply\nPasse de primeira Passe em profundidade\nO IN A\nPasse na medida Passe aéreo baixo',
  confidence: 92, status: 'confirmed', originPreview: null, enhancement: 'contrast'
};
const strictReading = readDetailedPrint('', [noisyReading]);
assert.deepEqual(strictReading.skills.map((item) => item.value), [
  'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe aéreo baixo'
]);
assert.deepEqual(strictReading.skillCandidates, []);

function runCard(target: 'GK' | 'CB' | 'DMF' | 'CF', playstyle: string, owned = '') {
  const attributesByRole: Record<typeof target, string> = {
    GK: 'Talento de GO: 94\nFirmeza de GO: 92\nDefesa de GO: 93\nReflexos de GO: 96\nAlcance de GO: 95\nPasse rasteiro: 74\nPasse alto: 82\nForça do chute: 88',
    CB: 'Talento defensivo: 94\nDedicação defensiva: 93\nDesarme: 92\nAgressividade: 90\nCabeçada: 88\nSalto: 89\nContato físico: 91\nPasse rasteiro: 81\nPasse alto: 84',
    DMF: 'Talento defensivo: 90\nDedicação defensiva: 92\nDesarme: 89\nAgressividade: 88\nPasse rasteiro: 86\nPasse alto: 84\nResistência: 92\nContato físico: 87',
    CF: 'Talento ofensivo: 94\nFinalização: 95\nCabeçada: 90\nForça do chute: 93\nSalto: 88\nContato físico: 89\nControle de bola: 85\nAceleração: 84'
  };
  const text = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Teste ${target} v31.80\nPOSIÇÃO PRINCIPAL: ${target}\nESTILO DE JOGO: ${playstyle}\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: ${owned}\n${attributesByRole[target]}\n[FIM AJUSTES]`;
  return applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', target, `${target}-v3180.png`, tacticalProfile));
}

const cases = [
  runCard('GK', 'Goleiro Ofensivo', 'Reposição baixa do goleiro'),
  runCard('CB', 'Defensor Criativo', 'Interceptação'),
  runCard('DMF', 'Primeiro Volante', 'Bloqueador'),
  runCard('CF', 'Artilheiro', 'Chute de primeira')
];

for (const result of cases) {
  const position = resolveAdditionalSkillPosition(result);
  const owned = new Set([...result.parsed.nativeSkills, ...result.parsed.specialSkills].map(skillIdentityKey));
  assert.equal(position, result.bestPosition.code, 'A posição escolhida deve permanecer autoritativa.');
  assert.equal(result.recommendedSkills.length, 5, `${position} deve receber exatamente 5 habilidades adicionais.`);
  assert.equal(new Set(result.recommendedSkills.map(skillIdentityKey)).size, 5, `${position} deve receber 5 nomes únicos.`);
  assert.ok(result.recommendedSkills.every((skill) => !owned.has(skillIdentityKey(skill))), `${position} não pode repetir habilidade possuída.`);
  assert.ok(result.recommendedSkills.every((skill) => isRoleCompatibleAdditionalSkill(skill, position)), `${position} não pode receber habilidade de outra função.`);
}


const goalkeeperDefensive = runCard('GK', 'Goleiro Defensivo', 'Reposição baixa do goleiro');
assert.notDeepEqual(
  cases[0].recommendedSkills,
  goalkeeperDefensive.recommendedSkills,
  'O estilo oficial deve alterar a ordem/conjunto do Top 5 do goleiro.'
);
const creativeDefender = runCard('CB', 'Defensor Criativo', 'Interceptação');
const destroyerDefender = runCard('CB', 'Destruidor', 'Interceptação');
assert.notDeepEqual(
  creativeDefender.recommendedSkills,
  destroyerDefender.recommendedSkills,
  'Defensor Criativo e Destruidor devem receber prioridades diferentes.'
);

const goalkeeper = cases[0];
assert.ok(goalkeeper.recommendedSkills.every((skill) => ![
  'Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Cabeçada', 'Toque duplo',
  'Interceptação', 'Bloqueador', 'Marcação individual', 'Carrinho', 'Superioridade aérea'
].includes(skill)), 'Goleiro não pode receber habilidades de atacante ou defensor de linha.');

const centreBack = cases[1];
assert.ok(centreBack.recommendedSkills.every((skill) => ![
  'Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Controle da cavadinha', 'Toque duplo'
].includes(skill)), 'Zagueiro não pode receber finalizações ou dribles de atacante.');

assert.match(ADDITIONAL_SKILL_ENGINE_VERSION, /^(?:31\.80-position-style-exact-five-1|31\.82-position-style-formation-exact-five-1|32\.00-position-style-formation-exact-five-1)$/);
console.log('v31.80: OCR estrito sem nomes estranhos e Top 5 exato por posição/estilo aprovados.');
