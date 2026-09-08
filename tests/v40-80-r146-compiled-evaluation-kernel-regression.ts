import assert from 'node:assert/strict';
import { analyzeCardForProductionR128 } from '../src/lib/productionAnalysisR128';
import { CLEAN_SLATE_SEARCH_OPTIMIZATION_R146_VERSION } from '../src/lib/cleanSlatePerformance2027V4080R119';

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
  {natural:'CB',target:'CB',style:'Defensor Criativo',skill:'Interceptação',attrs:baseAttrs.replace('Talento defensivo: 74','Talento defensivo: 91').replace('Desarme: 75','Desarme: 92'),training:{shooting:0,passing:0,dribbling:0,dexterity:9,lowerBodyStrength:10,aerialStrength:3,defending:12,gk1:0,gk2:0,gk3:0},top5:['Bloqueador','Passe de primeira','Marcação individual','Espírito guerreiro','Volta para marcar'],score:95.4},
  {natural:'CF',target:'CF',style:'Artilheiro',skill:'Chute de primeira',attrs:baseAttrs.replace('Finalização: 76','Finalização: 91').replace('Talento ofensivo: 78','Talento ofensivo: 90'),training:{shooting:7,passing:0,dribbling:10,dexterity:10,lowerBodyStrength:8,aerialStrength:2,defending:0,gk1:0,gk2:0,gk3:0},top5:['Efeito de longe','Chute com o peito do pé','Toque duplo','Folha seca','Controle com a sola'],score:95.5},
  {natural:'CMF',target:'DMF',style:'Orquestrador',skill:'Passe de primeira',attrs:baseAttrs.replace('Passe rasteiro: 84','Passe rasteiro: 91').replace('Passe alto: 80','Passe alto: 89'),training:{shooting:0,passing:7,dribbling:8,dexterity:7,lowerBodyStrength:4,aerialStrength:0,defending:12,gk1:0,gk2:0,gk3:0},top5:['Passe em profundidade','Passe na medida','Cruzamento preciso','Passe aéreo baixo','Toque de calcanhar'],score:95.1},
  {natural:'CF',target:'CB',style:'Artilheiro',skill:'Chute de primeira',attrs:baseAttrs.replace('Talento defensivo: 74','Talento defensivo: 68').replace('Finalização: 76','Finalização: 90'),training:{shooting:0,passing:0,dribbling:0,dexterity:8,lowerBodyStrength:4,aerialStrength:4,defending:16,gk1:0,gk2:0,gk3:0},top5:['Interceptação','Bloqueador','Espírito guerreiro','Passe de primeira','Marcação individual'],score:91.6},
  {natural:'GK',target:'GK',style:'Goleiro ofensivo',skill:'Pegador de pênalti',attrs:`
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
Alcance do GOLEIRO: 91`,training:{shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:10,gk2:12,gk3:10},top5:['Arremesso longo do goleiro','Reposição alta do goleiro','Reposição baixa do goleiro','Espírito guerreiro','Liderança'],score:66.4}
] as const;

for (const item of cases) {
  const raw=`[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: R146 ${item.natural}-${item.target}\nPOSIÇÃO PRINCIPAL: ${item.natural}\nESTILO DE JOGO: ${item.style}\nPONTOS TOTAIS: 60\nHABILIDADES JÁ POSSUI: ${item.skill}${item.attrs}\n[FIM AJUSTES]`;
  const result:any=analyzeCardForProductionR128(raw,'COMPETITIVE',item.target as any);
  assert.deepEqual(result.training,item.training,`${item.natural}->${item.target}: R146 deve ser idêntica à R145.`);
  assert.deepEqual(result.recommendedSkills,item.top5,`${item.natural}->${item.target}: Top 5 não pode mudar.`);
  assert.equal(result.cleanSlate2027R119.score,item.score,`${item.natural}->${item.target}: score não pode mudar.`);
  const r145=result.cleanSlate2027R119.searchOptimizationR145;
  const r146=result.cleanSlate2027R119.searchOptimizationR146;
  assert.ok(r145 && r146,'R146 deve preservar telemetria R145 e adicionar o kernel compilado equivalente.');
  assert.equal(r146.version,CLEAN_SLATE_SEARCH_OPTIMIZATION_R146_VERSION);
  assert.equal(r146.beamWidth,20);
  assert.equal(r146.heuristicChanged,false);
  assert.equal(r146.beamReduced,false);
  assert.equal(r146.compiledEvaluationKernel,true);
  assert.equal(r146.actionProjectionCompiled,true);
  assert.equal(r146.pressureProjectionCompiled,true);
  assert.equal(r146.groupLevelProfilesCompiled,true);
  assert.equal(r146.projectedScoreArrayAligned,true);
  assert.equal(r146.projectedScoreMapsAllocated,0);
  assert.equal(r146.repeatedAttributeGroupLookups,0);
  assert.equal(r146.repeatedStaticGroupMath,0);
  assert.equal(r146.compiledGroupLevelProfiles,170);
  assert.ok(r146.compiledActionAttributes>0);
  assert.ok(r146.compiledPressureAttributes>0);
  assert.equal(r146.generatedStates,r145.generatedStates);
  assert.equal(r146.uniqueFrontierStates,r145.uniqueFrontierStates);
}

console.log('r146 aprovada: kernel de avaliação compilado remove lookups/matemática estática repetida e preserva integralmente a saída R145.');
