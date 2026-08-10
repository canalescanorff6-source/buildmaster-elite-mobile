import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';
import type { TrainingPlan } from '../src/lib/analyzerDomain';

type MatrixCase = {
  name: string;
  position: 'LWF' | 'AMF' | 'DMF' | 'CB' | 'LB' | 'GK';
  style: string;
  formation: string;
  teamStyle: 'POSSE_DE_BOLA' | 'CONTRA_ATAQUE_RAPIDO' | 'CONTRA_ATAQUE';
  owned: string;
  attributes: string;
  validate: (training: TrainingPlan) => boolean;
  message: string;
};

const cases: MatrixCase[] = [
  {
    name: 'Ponta de ruptura', position: 'LWF', style: 'Ala produtivo', formation: '4-3-3', teamStyle: 'CONTRA_ATAQUE_RAPIDO', owned: 'Corte com virada',
    attributes: `Talento ofensivo: 87\nControle de bola: 89\nDrible: 91\nCondução firme: 89\nPasse rasteiro: 80\nPasse alto: 78\nFinalização: 82\nCurva: 86\nVelocidade: 91\nAceleração: 92\nForça do chute: 84\nContato físico: 67\nEquilíbrio: 90\nResistência: 84`,
    validate: (t) => t.dribbling + t.dexterity + t.lowerBodyStrength > t.defending + t.aerialStrength,
    message: 'O ponta precisa priorizar domínio, resposta e explosão em vez de defesa/jogo aéreo.'
  },
  {
    name: 'Criador central', position: 'AMF', style: 'Armador Criativo', formation: '4-2-3-1', teamStyle: 'POSSE_DE_BOLA', owned: 'Passe de primeira',
    attributes: `Talento ofensivo: 86\nControle de bola: 91\nDrible: 88\nCondução firme: 90\nPasse rasteiro: 92\nPasse alto: 89\nFinalização: 78\nCurva: 88\nVelocidade: 79\nAceleração: 84\nForça do chute: 80\nContato físico: 68\nEquilíbrio: 89\nResistência: 84`,
    validate: (t) => t.passing + t.dribbling >= t.shooting + t.defending,
    message: 'O MAT criador precisa preservar passe e controle como núcleo da ficha.'
  },
  {
    name: 'Primeiro volante', position: 'DMF', style: 'Primeiro volante', formation: '4-1-2-3', teamStyle: 'POSSE_DE_BOLA', owned: 'Interceptação',
    attributes: `Talento defensivo: 90\nDesarme: 88\nAgressividade: 84\nParticipação defensiva: 91\nControle de bola: 84\nCondução firme: 82\nPasse rasteiro: 88\nPasse alto: 86\nVelocidade: 80\nAceleração: 76\nContato físico: 86\nEquilíbrio: 82\nResistência: 92`,
    validate: (t) => t.defending + t.passing > t.shooting + t.dribbling,
    message: 'O primeiro volante precisa combinar proteção e saída, sem desperdiçar em finalização.'
  },
  {
    name: 'Zagueiro construtor', position: 'CB', style: 'Defensor Criativo', formation: '4-2-2-2', teamStyle: 'CONTRA_ATAQUE', owned: 'Marcação individual',
    attributes: `Talento defensivo: 91\nDesarme: 90\nAgressividade: 85\nParticipação defensiva: 91\nPasse rasteiro: 82\nPasse alto: 84\nVelocidade: 82\nAceleração: 76\nCabeceio: 88\nSalto: 87\nContato físico: 90\nEquilíbrio: 77\nResistência: 86`,
    validate: (t) => t.defending + t.aerialStrength > t.shooting + t.dribbling,
    message: 'O zagueiro deve priorizar defesa e duelos antes de grupos ofensivos.'
  },
  {
    name: 'Lateral de segurança', position: 'LB', style: 'Lateral defensivo', formation: '4-3-3', teamStyle: 'CONTRA_ATAQUE_RAPIDO', owned: 'Bloqueio',
    attributes: `Talento defensivo: 87\nDesarme: 86\nAgressividade: 82\nParticipação defensiva: 88\nControle de bola: 82\nPasse rasteiro: 83\nPasse alto: 82\nVelocidade: 88\nAceleração: 86\nContato físico: 81\nEquilíbrio: 83\nResistência: 91`,
    validate: (t) => t.defending + t.lowerBodyStrength + t.passing > t.shooting + t.aerialStrength,
    message: 'O lateral defensivo precisa equilibrar cobertura, velocidade e saída curta.'
  },
  {
    name: 'Goleiro reativo', position: 'GK', style: 'Goleiro ofensivo', formation: '4-2-2-2', teamStyle: 'CONTRA_ATAQUE_RAPIDO', owned: 'Goleiro pegador de pênalti',
    attributes: `Talento de goleiro: 91\nDefesa do goleiro: 90\nAfastamento do goleiro: 88\nReflexos do goleiro: 92\nAlcance do goleiro: 90\nSalto: 87\nPasse rasteiro: 75\nPasse alto: 78\nContato físico: 84`,
    validate: (t) => t.gk1 + t.gk2 + t.gk3 > t.shooting + t.dribbling + t.defending,
    message: 'O goleiro deve receber grupos específicos de GK, nunca uma ficha de linha.'
  }
];

for (const entry of cases) {
  const text = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: ${entry.name}\nPOSIÇÃO PRINCIPAL: ${entry.position}\nESTILO DE JOGO: ${entry.style}\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: ${entry.owned}\n${entry.attributes}\n[FIM AJUSTES]`;
  const result = applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', entry.position, `${entry.position}.png`, {
    formation: entry.formation,
    style: entry.teamStyle,
    managerId: 'matrix-manager',
    managerName: 'Técnico Matrix',
    managerProficiency: 90,
    managerBooster: 'padrao'
  }));

  assert.equal(result.bestPosition.code, entry.position, `${entry.name}: a posição escolhida pelo usuário deve ser preservada.`);
  assert.equal(result.trainingPointsUsed, 64, `${entry.name}: a ficha precisa usar exatamente os 64 pontos.`);
  assert.equal(result.trainingPointsRemaining, 0, `${entry.name}: não pode sobrar ponto utilizável.`);
  assert.equal(result.recommendedSkills.length, 5, `${entry.name}: o Top 5 precisa estar completo.`);
  assert.equal(new Set(result.recommendedSkills.map(skillIdentityKey)).size, 5, `${entry.name}: as habilidades devem ser únicas.`);
  assert.ok(result.recommendedSkills.every((skill) => skillIdentityKey(skill) !== skillIdentityKey(entry.owned)), `${entry.name}: não pode repetir a habilidade já existente.`);
  assert.ok(entry.validate(result.training), `${entry.name}: ${entry.message} Ficha: ${JSON.stringify(result.training)}`);
  assert.ok((result.unifiedIntelligence?.impetoPlan.name ?? '').length > 0, `${entry.name}: precisa haver recomendação de Ímpeto contextualizada.`);
  assert.ok((result.supremeGameplay?.dimensions.tacticalFit ?? 0) > 0, `${entry.name}: formação e estilo coletivo precisam entrar na avaliação.`);
}

console.log(`v31.82 matriz de ${cases.length} funções, posições, estilos, formações, fichas, habilidades e Ímpetos aprovada.`);
