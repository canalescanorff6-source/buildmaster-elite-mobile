import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import {
  OFFICIAL_ADDITIONAL_SKILL_CATALOG_VERSION,
  OFFICIAL_ADDITIONAL_SKILL_NAMES,
  OFFICIAL_ADDITIONAL_SKILLS,
  SPECIAL_SKILL_NAMES,
} from '../src/modules/analysis/analyzerCatalog';
import { canonicalSkillName, skillIdentityKey } from '../src/lib/officialSkillIdentity';
import { availableOfficialAdditionalSkillCount, isRoleCompatibleAdditionalSkill } from '../src/lib/skillIntelligenceV31';
import type { PositionCode, TacticalFormation, TacticalStyle } from '../src/lib/analyzerDomain';

const EXPECTED_FIELD_SKILLS = [
  'Pedalada simples', 'Toque duplo', 'Elástico', 'Giro 360°', 'Chapéu', 'Corte com virada',
  'Puxada de letra', 'Finta de letra', 'Controle com a sola', 'Cabeçada', 'Efeito de longe',
  'Controle da cavadinha', 'Chute com o peito do pé', 'Folha seca', 'Chute ascendente',
  'Precisão à distância', 'Finalização acrobática', 'Toque de calcanhar', 'Chute de primeira',
  'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Cruzamento preciso',
  'Curva para fora', 'De letra', 'Passe sem olhar', 'Passe aéreo baixo', 'Arremesso lateral longo',
  'Especialista em pênalti', 'Malícia', 'Marcação individual', 'Volta para marcar', 'Interceptação',
  'Bloqueador', 'Superioridade aérea', 'Carrinho', 'Afastamento acrobático', 'Liderança',
  'Super substituto', 'Espírito guerreiro',
] as const;

assert.match(OFFICIAL_ADDITIONAL_SKILL_CATALOG_VERSION, /^35\.00-/);
assert.equal(OFFICIAL_ADDITIONAL_SKILL_NAMES.length, 44, 'O APK deve conter 40 habilidades oficiais de linha e 4 habilidades oficiais de goleiro.');
assert.deepEqual(OFFICIAL_ADDITIONAL_SKILL_NAMES.slice(0, 40), EXPECTED_FIELD_SKILLS, 'A lista de jogadores de linha deve reproduzir os nomes oficiais enviados nos prints.');
assert.equal(new Set(OFFICIAL_ADDITIONAL_SKILL_NAMES.map(skillIdentityKey)).size, 44, 'O catálogo oficial não pode conter duplicidades ou aliases como entradas extras.');
assert.ok(!OFFICIAL_ADDITIONAL_SKILLS.has('Corrida explosiva'), 'Nome inexistente Corrida explosiva deve ser eliminado do APK.');
assert.ok(!OFFICIAL_ADDITIONAL_SKILLS.has('Corte rápido'), 'Corte rápido não pode existir como habilidade oficial separada.');
assert.equal(canonicalSkillName('Chop Turn'), 'Corte com virada');
assert.ok(SPECIAL_SKILL_NAMES.every((skill) => !OFFICIAL_ADDITIONAL_SKILLS.has(skill)), 'Habilidades especiais/nativas não podem entrar no sorteio das cinco adicionais.');

function cardText(name: string, position: PositionCode, playstyle: string, owned: string, attrs: string) {
  return `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: ${name}\nPOSIÇÃO PRINCIPAL: ${position}\nESTILO DE JOGO: ${playstyle}\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: ${owned}\n${attrs}\n[FIM AJUSTES]`;
}

const DRIBBLER = cardText('Driblador Oficial V35', 'SS', 'Puxa marcação', 'Passe de primeira, Chute de primeira', `
Talento ofensivo: 88
Controle de bola: 94
Drible: 96
Condução firme: 95
Passe rasteiro: 84
Passe alto: 78
Finalização: 84
Cabeceio: 64
Curva: 86
Velocidade: 90
Aceleração: 94
Força do chute: 82
Salto: 66
Contato físico: 69
Equilíbrio: 94
Resistência: 83`);

const FINISHER = cardText('Finalizador Oficial V35', 'CF', 'Artilheiro', 'Chute de primeira, Cabeçada', `
Talento ofensivo: 94
Controle de bola: 84
Drible: 82
Condução firme: 80
Passe rasteiro: 72
Passe alto: 67
Finalização: 95
Cabeceio: 86
Curva: 80
Velocidade: 88
Aceleração: 88
Força do chute: 94
Salto: 85
Contato físico: 84
Equilíbrio: 80
Resistência: 82`);

const ANCHOR = cardText('Primeiro Volante Oficial V35', 'DMF', 'Primeiro volante', 'Interceptação, Passe de primeira', `
Talento ofensivo: 66
Controle de bola: 82
Drible: 76
Condução firme: 80
Passe rasteiro: 88
Passe alto: 87
Finalização: 61
Cabeceio: 82
Talento defensivo: 94
Desarme: 93
Participação defensiva: 95
Agressividade: 88
Velocidade: 82
Aceleração: 78
Salto: 88
Contato físico: 92
Equilíbrio: 80
Resistência: 94`);

const GOALKEEPER = cardText('Goleiro Oficial V35', 'GK', 'Goleiro ofensivo', 'Reposição baixa do goleiro', `
Talento de GO: 95
Alcance do GO: 94
Defesa do GO: 93
Reflexos do GO: 96
Firmeza do GO: 92
Passe rasteiro: 75
Passe alto: 82
Salto: 90
Contato físico: 88
Resistência: 78`);

const GOALKEEPER_EXHAUSTED = cardText('Goleiro Catálogo Quase Completo V35', 'GK', 'Goleiro defensivo', 'Reposição baixa do goleiro, Pegador de pênalti, Arremesso longo do goleiro', `
Talento de GO: 95
Alcance do GO: 94
Defesa do GO: 93
Reflexos do GO: 96
Firmeza do GO: 92
Passe rasteiro: 70
Passe alto: 76
Salto: 90
Contato físico: 88
Resistência: 82`);

function run(text: string, position: PositionCode, formation: TacticalFormation, style: TacticalStyle) {
  return applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', position, `v35-${position}-${formation}-${style}.png`, {
    formation,
    style,
    managerId: `manager-${style}`,
    managerName: `Técnico ${style}`,
    managerProficiency: 90,
    managerBooster: 'padrao',
    gameplayMode: 'UNIVERSAL',
    connectionProfile: 'VARIABLE',
    controlProfile: position === 'SS' ? 'DRIBBLE' : 'BALANCED',
  }));
}

function assertOfficialTopFive(result: ReturnType<typeof run>, position: PositionCode, skillPosition: PositionCode = position) {
  const owned = new Set([...result.parsed.nativeSkills, ...result.parsed.specialSkills].map(skillIdentityKey));
  assert.equal(result.bestPosition.code, position, 'A posição escolhida pelo usuário deve permanecer soberana.');
  assert.equal(result.trainingPointsUsed, 64);
  assert.equal(result.trainingPointsRemaining, 0);
  assert.equal(result.recommendedSkills.length, 5, 'A ficha precisa entregar exatamente cinco habilidades adicionais.');
  assert.equal(new Set(result.recommendedSkills.map(skillIdentityKey)).size, 5, 'As cinco habilidades precisam ser únicas.');
  for (const skill of result.recommendedSkills) {
    assert.ok(OFFICIAL_ADDITIONAL_SKILLS.has(skill), `Habilidade não oficial encontrada no Top 5: ${skill}`);
    assert.ok(!owned.has(skillIdentityKey(skill)), `Habilidade já existente foi repetida: ${skill}`);
    assert.ok(isRoleCompatibleAdditionalSkill(skill, skillPosition), `Habilidade incompatível com ${skillPosition}: ${skill}`);
  }
}

const dribbler = run(DRIBBLER, 'SS', '4-3-3', 'POSSE_DE_BOLA');
const finisher = run(FINISHER, 'CF', '4-2-2-2', 'CONTRA_ATAQUE_RAPIDO');
const anchor = run(ANCHOR, 'DMF', '4-1-2-3', 'CONTRA_ATAQUE');
const goalkeeper = run(GOALKEEPER, 'GK', '5-3-2', 'PASSE_LONGO');

assertOfficialTopFive(dribbler, 'SS');
assertOfficialTopFive(finisher, 'CF');
assertOfficialTopFive(anchor, 'DMF');
assertOfficialTopFive(goalkeeper, 'GK');

const goalkeeperExhausted = run(GOALKEEPER_EXHAUSTED, 'GK', '4-3-3', 'POSSE_DE_BOLA');
assert.equal(availableOfficialAdditionalSkillCount(goalkeeperExhausted), 3, 'O goleiro já possui três das seis opções compatíveis e deve ter somente três restantes.');
assert.deepEqual(
  new Set(goalkeeperExhausted.recommendedSkills),
  new Set(['Reposição alta do goleiro', 'Liderança', 'Espírito guerreiro']),
  'Quando o catálogo próprio estiver quase esgotado, o APK deve entregar todas as opções oficiais restantes sem inventar uma quinta.'
);
assert.equal(goalkeeperExhausted.skillIntegrity?.missingSlots, 0, 'Catálogo oficial esgotado não deve ser tratado como vaga ausente.');
assert.equal(goalkeeperExhausted.skillIntegrity?.status, 'approved', 'A entrega de todas as opções oficiais restantes deve ser aprovada.');


const dribbleSkills = new Set(['Pedalada simples', 'Toque duplo', 'Elástico', 'Giro 360°', 'Chapéu', 'Corte com virada', 'Puxada de letra', 'Finta de letra', 'Controle com a sola']);
assert.ok(dribbler.recommendedSkills.filter((skill) => dribbleSkills.has(skill)).length >= 2, 'Uma carta cujo DNA é drible deve receber pelo menos duas habilidades oficiais de drible/controle.');
assert.ok(dribbler.training.dribbling + dribbler.training.dexterity >= dribbler.training.shooting + dribbler.training.passing, 'A ficha do driblador deve refletir o DNA técnico da carta, sem perseguir overall.');
assert.ok(finisher.recommendedSkills.some((skill) => ['Precisão à distância', 'Finalização acrobática', 'Chute com o peito do pé', 'Folha seca', 'Chute ascendente', 'Controle da cavadinha'].includes(skill)), 'O CA finalizador deve receber complemento oficial de finalização.');
assert.ok(anchor.recommendedSkills.filter((skill) => ['Marcação individual', 'Volta para marcar', 'Bloqueador', 'Superioridade aérea', 'Carrinho', 'Afastamento acrobático'].includes(skill)).length >= 2, 'O primeiro volante deve receber habilidades defensivas oficiais úteis.');
assert.ok(goalkeeper.recommendedSkills.every((skill) => ['Pegador de pênalti', 'Arremesso longo do goleiro', 'Reposição alta do goleiro', 'Reposição baixa do goleiro', 'Espírito guerreiro', 'Liderança'].includes(skill)), 'Goleiro não pode receber habilidade de jogador de linha.');

const formA = run(DRIBBLER, 'SS', '4-3-3', 'POSSE_DE_BOLA');
const formB = run(DRIBBLER, 'SS', '5-3-2', 'POSSE_DE_BOLA');
const formC = run(DRIBBLER, 'SS', '4-2-2-2', 'POSSE_DE_BOLA');
assert.deepEqual(formA.training, formB.training, 'A formação não deve alterar a ficha universal da posição escolhida.');
assert.deepEqual(formA.training, formC.training, 'Qualquer formação deve usar a mesma ficha universal para a mesma posição e contexto.');
assert.deepEqual(formA.recommendedSkills, formB.recommendedSkills, 'A formação não deve trocar o Top 5 oficial.');
assert.deepEqual(formA.recommendedSkills, formC.recommendedSkills, 'A formação não deve trocar o Top 5 oficial.');

const possession = run(DRIBBLER, 'SS', '4-3-3', 'POSSE_DE_BOLA');
const quickCounter = run(DRIBBLER, 'SS', '4-3-3', 'CONTRA_ATAQUE_RAPIDO');
assert.deepEqual(possession.training, quickCounter.training, 'O estilo do técnico não pode alterar a Receita Canônica da carta.');
assert.deepEqual(possession.recommendedSkills, quickCounter.recommendedSkills, 'O estilo do técnico não pode trocar o Top adicional canônico.');
assert.deepEqual(possession.recommendedImpetos, quickCounter.recommendedImpetos, 'O estilo do técnico não pode trocar o Ímpeto canônico.');

const asCF = run(DRIBBLER, 'CF', '4-3-3', 'POSSE_DE_BOLA');
assert.equal(asCF.recommendedSkills.length, 5, 'A adaptação para CA precisa manter cinco habilidades oficiais quando houver catálogo disponível.');
assert.ok(asCF.recommendedSkills.every((skill) => OFFICIAL_ADDITIONAL_SKILLS.has(skill)), 'A adaptação não pode introduzir habilidade não oficial.');
assert.deepEqual(asCF.adaptivePositionV3930?.coreTraining, dribbler.adaptivePositionV3930?.coreTraining, 'Selecionar outra posição não pode recriar o núcleo da carta.');
assert.notDeepEqual(asCF.training, dribbler.training, 'A camada aplicada pode mudar de forma limitada para a posição escolhida.');
assert.ok((asCF.adaptivePositionV3930?.corePreservation ?? 0) >= 72, 'A adaptação deve preservar a essência da carta.');
assert.deepEqual(asCF.recommendedImpetos, dribbler.recommendedImpetos, 'Selecionar outra posição não pode trocar os Ímpetos da carta.');


const appSource = require('node:fs').readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const calibrationCardSource = require('node:fs').readFileSync('src/components/result/CalibrationV32Card.tsx', 'utf8');
assert.match(appSource, /formation: 'AUTO'/, 'A análise individual deve fixar a formação em automático.');
assert.match(appSource, /A formação não muda pontos nem habilidades/, 'A interface deve explicar o contrato universal.');
const creationStart = appSource.indexOf('creation-advanced-details creation-tactical-details');
const creationEnd = appSource.indexOf('creation-action-dock', creationStart);
const creationBlock = appSource.slice(creationStart, creationEnd);
assert.ok(creationStart >= 0 && creationEnd > creationStart, 'O bloco de contexto da ficha precisa existir.');
assert.doesNotMatch(creationBlock, /Sistema tático/, 'A criação da ficha não deve exigir seleção de formação.');
assert.match(calibrationCardSource, /Calibração (?:Máxima v35\.(?:10|20)|Automática v(?:38\.(?:37|38|39|40)|40\.(?:00|10|20|30|40|50|60|70|80)))/);
assert.match(calibrationCardSource, /Estilo técnico/);
assert.match(calibrationCardSource, /Perfil da carta/);
assert.doesNotMatch(calibrationCardSource, />Equilibrado<|>Passe e tabelas<|>Drible e condução<|>Vertical e direto</);

console.log('v35.00 catálogo oficial permanente, Top 5 por posição/estilo e ficha universal sem formação aprovados.');
