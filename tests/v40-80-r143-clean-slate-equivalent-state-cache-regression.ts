import assert from 'node:assert/strict';
import { analyzeCardForProductionR128 } from '../src/lib/productionAnalysisR128';
import { CLEAN_SLATE_SEARCH_OPTIMIZATION_R143_VERSION } from '../src/lib/cleanSlatePerformance2027V4080R119';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';

const baseAttrs = `
Talento ofensivo: 78
Controle de bola: 82
Drible: 79
Condução firme: 80
Passe rasteiro: 84
Passe alto: 80
Finalização: 76
Cabeceio: 72
Talento defensivo: 74
Dedicação defensiva: 76
Desarme: 75
Agressividade: 77
Velocidade: 82
Aceleração: 81
Força do chute: 80
Salto: 78
Contato físico: 80
Equilíbrio: 79
Resistência: 85`;

const cases = [
  {
    natural:'CB', target:'CB', style:'Defensor Criativo', skill:'Interceptação',
    attrs:baseAttrs.replace('Talento defensivo: 74','Talento defensivo: 91').replace('Desarme: 75','Desarme: 92'),
    expectedTraining:{shooting:0,passing:0,dribbling:0,dexterity:9,lowerBodyStrength:10,aerialStrength:3,defending:12,gk1:0,gk2:0,gk3:0},
    expectedTop5:['Bloqueador','Passe de primeira','Marcação individual','Espírito guerreiro','Volta para marcar'], expectedScore:95.4
  },
  {
    natural:'CF', target:'CF', style:'Artilheiro', skill:'Chute de primeira',
    attrs:baseAttrs.replace('Finalização: 76','Finalização: 91').replace('Talento ofensivo: 78','Talento ofensivo: 90'),
    expectedTraining:{shooting:7,passing:0,dribbling:10,dexterity:10,lowerBodyStrength:8,aerialStrength:2,defending:0,gk1:0,gk2:0,gk3:0},
    expectedTop5:['Efeito de longe','Chute com o peito do pé','Toque duplo','Folha seca','Controle com a sola'], expectedScore:95.5
  },
  {
    natural:'CMF', target:'DMF', style:'Orquestrador', skill:'Passe de primeira',
    attrs:baseAttrs.replace('Passe rasteiro: 84','Passe rasteiro: 91').replace('Passe alto: 80','Passe alto: 89'),
    expectedTraining:{shooting:0,passing:7,dribbling:12,dexterity:8,lowerBodyStrength:2,aerialStrength:0,defending:8,gk1:0,gk2:0,gk3:0},
    expectedTop5:['Passe em profundidade','Passe na medida','Cruzamento preciso','Curva para fora','Toque de calcanhar'], expectedScore:94.5
  },
  {
    natural:'CF', target:'CB', style:'Artilheiro', skill:'Chute de primeira',
    attrs:baseAttrs.replace('Talento defensivo: 74','Talento defensivo: 68').replace('Finalização: 76','Finalização: 90'),
    expectedTraining:{shooting:4,passing:0,dribbling:10,dexterity:13,lowerBodyStrength:7,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0},
    expectedTop5:['Efeito de longe','Toque duplo','Chute com o peito do pé','Controle com a sola','Folha seca'], expectedScore:84.5
  },
  {
    natural:'GK', target:'GK', style:'Goleiro ofensivo', skill:'Pegador de pênalti',
    attrs:`
Talento ofensivo: 45
Controle de bola: 65
Passe rasteiro: 70
Passe alto: 73
Talento defensivo: 50
Velocidade: 68
Aceleração: 66
Salto: 85
Contato físico: 83
Equilíbrio: 60
Resistência: 72
Talento de GOLEIRO: 90
Firmeza do GOLEIRO: 87
Afastamento do GOLEIRO: 89
Reflexos do GOLEIRO: 92
Alcance do GOLEIRO: 91`,
    expectedTraining:{shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:10,gk2:12,gk3:10},
    expectedTop5:['Arremesso longo do goleiro','Reposição alta do goleiro','Reposição baixa do goleiro','Espírito guerreiro','Liderança'], expectedScore:66.4
  }
] as const;

for (const item of cases) {
  const raw = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: R143 ${item.natural}-${item.target}\nPOSIÇÃO PRINCIPAL: ${item.natural}\nESTILO DE JOGO: ${item.style}\nPONTOS TOTAIS: 60\nHABILIDADES JÁ POSSUI: ${item.skill}${item.attrs}\n[FIM AJUSTES]`;
  const result:any = analyzeCardForProductionR128(raw,'COMPETITIVE',item.target as any);
  assert.deepEqual(result.training,item.expectedTraining,`${item.natural}->${item.target}: R143 não pode mudar a ficha vencedora da R142.`);
  assert.deepEqual(result.recommendedSkills,item.expectedTop5,`${item.natural}->${item.target}: R143 não pode mudar o Top 5.`);
  assert.equal(result.cleanSlate2027R119.score,item.expectedScore,`${item.natural}->${item.target}: score final deve permanecer equivalente.`);
  assert.equal(result.cleanSlate2027R119.usagePosition,item.target);
  const search=result.cleanSlate2027R119.searchOptimizationR143;
  assert.ok(search,'Toda ficha READY R143 deve expor auditoria da busca equivalente.');
  assert.equal(search.version,CLEAN_SLATE_SEARCH_OPTIMIZATION_R143_VERSION);
  assert.equal(search.beamWidth,20,'Beam deve continuar 20; ganho não pode vir de reduzir candidatos competitivos.');
  assert.equal(search.heuristicChanged,false,'R143 não altera a heurística de score.');
  assert.equal(search.scoreOnlySearch,true);
  assert.equal(search.projectedAttributesReused,true);
  assert.equal(search.generatedStates,result.cleanSlate2027R119.candidateCount);
  assert.ok(search.uniqueEvaluations < search.generatedStates,'Cache deve evitar avaliações equivalentes repetidas.');
  assert.ok(search.cacheHits > 0,'Caso real deve demonstrar reaproveitamento de estados equivalentes.');
  assert.equal(search.uniqueEvaluations + search.cacheHits,search.generatedStates,'Cada estado gerado deve ser avaliação única ou cache hit.');
}

console.log('r143 aprovada: cache de estados equivalentes, score-only no beam e contexto fixo pré-calculado reduzem CPU sem alterar beam, heurística, ficha, Top 5 ou score R142.');
