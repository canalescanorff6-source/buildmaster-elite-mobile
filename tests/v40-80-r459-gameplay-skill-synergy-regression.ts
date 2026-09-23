import assert from 'node:assert/strict';
import fs from 'node:fs';
import { skillActionSupportDetailR459 } from '../src/lib/gameplayImpactR458';
import { optimizeFinalAdditionalSkillSetR457 } from '../src/lib/finalAdditionalSkillSetR457';
import { createProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE='1';

const duel=skillActionSupportDetailR459(['Marcação individual','Carrinho'],'defensive_duel');
assert.equal(duel.supportCount,2);
assert.ok(duel.score>.9 && duel.score<=1,'Duas skills complementares precisam superar a melhor isolada sem ultrapassar 100%.');
assert.deepEqual(duel.supportingSkills.slice(0,2),['Marcação individual','Carrinho']);
const duplicated=skillActionSupportDetailR459(['Carrinho','Carrinho'],'defensive_duel');
assert.equal(duplicated.supportCount,1,'A mesma skill não pode ser contada duas vezes.');

const parsed:any={
  playerName:'R459 Skill Alignment',mainPosition:'CMF',positions:['CMF','DMF'],cardType:'Epic',specialTag:'Teste',
  nativeSkills:[],specialSkills:[],additionalSkills:[],attributes:{},evidence:{},impetos:[]
};
const creationActions:any=[
  {id:'short_creation',label:'Tabela',frequency:100,contribution:100},
  {id:'through_creation',label:'Ruptura',frequency:94,contribution:90},
  {id:'close_control',label:'Controle',frequency:78,contribution:72}
];
const defenseActions:any=[
  {id:'intercept',label:'Interceptação',frequency:100,contribution:100},
  {id:'defensive_duel',label:'Duelo',frequency:95,contribution:92},
  {id:'cover_space',label:'Cobertura',frequency:90,contribution:87}
];
const creation=optimizeFinalAdditionalSkillSetR457(parsed,creationActions,'CMF');
const defense=optimizeFinalAdditionalSkillSetR457(parsed,defenseActions,'CMF');
const creationPass=creation.individualScores.find(item=>item.name==='Passe de primeira')?.score??0;
const defensePass=defense.individualScores.find(item=>item.name==='Passe de primeira')?.score??0;
const creationIntercept=creation.individualScores.find(item=>item.name==='Interceptação')?.score??0;
const defenseIntercept=defense.individualScores.find(item=>item.name==='Interceptação')?.score??0;
assert.ok(creationPass>defensePass,'Passe de primeira precisa valer mais quando a ação real é tabela/criação.');
assert.ok(defenseIntercept>creationIntercept,'Interceptação precisa valer mais quando a ação real é defensiva.');
assert.notDeepEqual(creation.finalSkills,defense.finalSkills,'Top 5 precisa mudar quando as ações funcionais mudam.');

const completeRaw=`[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Confiança R459\nPOSIÇÃO PRINCIPAL: CMF\nESTILO DE JOGO: Orquestrador\nPONTOS TOTAIS: 8\nControle de bola: 84\nDrible: 82\nCondução firme: 80\nPasse rasteiro: 84\nPasse alto: 82\nTalento ofensivo: 78\nFinalização: 70\nCurva: 76\nVelocidade: 78\nAceleração: 79\nEquilíbrio: 78\nResistência: 84\nTalento defensivo: 75\nDedicação defensiva: 76\nDesarme: 74\nAgressividade: 72\n[FIM AJUSTES]`;
const incompleteRaw=completeRaw.replace('Passe alto: 82\n','').replace('Curva: 76\n','').replace('Equilíbrio: 78\n','');
const request=(rawText:string)=>createProductionAnalysisR138({rawText,targetPosition:'CMF',usageFunction:'Orquestrador',objective:'COMPETITIVE',tacticalProfile:{formation:'4-2-2-2',style:'POSSE_DE_BOLA'} as any}) as any;
const complete=request(completeRaw);
const incomplete=request(incompleteRaw);
assert.equal(complete.cleanSlate2027R119.gameplayImpactR458.engineRevision,'R459');
assert.equal(complete.cleanSlate2027R119.gameplayImpactR458.skillSynergyAware,true);
assert.ok(complete.cleanSlate2027R119.gameplayImpactR458.decisionConfidence>incomplete.cleanSlate2027R119.gameplayImpactR458.decisionConfidence,'Falta de atributo crítico precisa reduzir confiança sem inventar valor.');
assert.ok(incomplete.cleanSlate2027R119.gameplayImpactR458.actions.some((item:any)=>item.missingAttributes.length>0),'Leitura incompleta precisa aparecer nas ações sem imputação fictícia.');

const ui=fs.readFileSync('src/components/UnifiedPerformanceV3920Panel.tsx','utf8');
assert.match(ui,/Confiança da decisão/);
assert.match(ui,/action\.skillSupportSkills/);
console.log(`R459 gameplay aprovado: sinergia ${Math.round(duel.score*1000)/10}%, Top5 por ação e confiança ${complete.cleanSlate2027R119.gameplayImpactR458.decisionConfidence} > ${incomplete.cleanSlate2027R119.gameplayImpactR458.decisionConfidence}.`);
