import assert from 'node:assert/strict';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});

function resultFor({
  name='Carta A',
  overall=105,
  best='AMF',
  main='AMF',
  style='Jogador de infiltração',
  defensive='Básico',
  native=['Toque duplo','Passe de primeira'],
  attrs
}: {
  name?: string;
  overall?: number;
  best?: string;
  main?: string;
  style?: string;
  defensive?: string;
  native?: string[];
  attrs: Record<string,number>;
}) {
  const parsed:any={
    playerName:name,cardType:'Epic',mainPosition:main,mainPositionPt:main,positions:[main],positionsPt:[main],positionRatings:{[main]:100},
    playstyle:style,offensivePlaystyle:style,defensivePlaystyle:defensive,defensivePlaystyleConfirmed:true,dominantFoot:'Direito',
    overall,maxOverall:overall,height:178,weight:74,trainingPointsTotal:64,condition:{},impetos:[],nativeSkills:native,additionalSkills:[],specialSkills:[],
    attributes:attrs,physicalProfile:{},manualConfirmed:true,
    evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:1,skillConfidence:.98,impetoSlotStatus:'DISPONIVEL'},
    internalId:`${name}-${overall}`,confidence:.98,warnings:[]
  };
  return {
    parsed,bestPosition:{code:best,label:best,score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,
    trainingPointsTotal:64,trainingPointsRemaining:64,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],
    tacticalProfile:{formation:'AUTO',style:'AUTO'},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},
    permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',
    deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}
  } as any;
}

const creatorAttrs:any={
  offensiveAwareness:88,ballControl:94,dribbling:94,tightPossession:93,lowPass:88,loftedPass:82,finishing:83,heading:60,placeKicking:83,curl:90,
  defensiveAwareness:52,defensiveEngagement:54,tackling:50,aggression:58,speed:87,acceleration:92,kickingPower:84,jump:64,physicalContact:66,balance:94,stamina:82
};
const creator:any=applyCleanSlatePerformance2027R119(resultFor({attrs:creatorAttrs}));
const renamed:any=applyCleanSlatePerformance2027R119(resultFor({name:'Nome completamente diferente',attrs:creatorAttrs}));
const highOverall:any=applyCleanSlatePerformance2027R119(resultFor({name:'Carta A',overall:112,attrs:creatorAttrs}));
const differentSelected:any=applyCleanSlatePerformance2027R119(resultFor({name:'Carta A',best:'CF',attrs:creatorAttrs}));
const noDribbleEvidence:any=applyCleanSlatePerformance2027R119(resultFor({name:'Carta sem skill',attrs:creatorAttrs,native:['Passe de primeira']}));

assert.equal(creator.cleanSlate2027R119.authority,'CLEAN_SLATE_SINGLE_WRITER');
assert.match(creator.cleanSlate2027R119.version,/r12(?:2-online-competitive-dna|3-competitive-lab-saturation-confidence)/);
assert.equal(trainingPlanTotalCost(creator.training),64);
assert.ok(creator.cleanSlate2027R119.onlinePerformance.rankedScore > 0 && creator.cleanSlate2027R119.onlinePerformance.rankedScore <= 100);
assert.ok(creator.cleanSlate2027R119.onlinePerformance.friendsScore > 0 && creator.cleanSlate2027R119.onlinePerformance.friendsScore <= 100);
assert.ok(creator.cleanSlate2027R119.onlinePerformance.identityPreservation >= 50,'DNA da carta precisa participar da escolha final.');
assert.ok(creator.cleanSlate2027R119.pointRationale.length > 0,'A ficha final precisa explicar o retorno dos grupos usados.');
assert.ok(creator.cleanSlate2027R119.pointRationale.every((item:any)=>creator.training[item.training] > 0),'Somente grupos realmente usados devem aparecer em Por que esta ficha?.');

assert.deepEqual(renamed.training,creator.training,'O nome do jogador não pode alterar a ficha.');
assert.deepEqual(renamed.recommendedSkills,creator.recommendedSkills,'O nome do jogador não pode alterar o Top 5.');
assert.equal(renamed.cleanSlate2027R119.onlinePerformance.rankedScore,creator.cleanSlate2027R119.onlinePerformance.rankedScore,'O nome do jogador não pode alterar a nota online.');
assert.deepEqual(highOverall.training,creator.training,'Overall/GER não pode alterar a ficha r122.');
assert.deepEqual(differentSelected.training,creator.training,'A posição selecionada não pode reescrever a assinatura permanente da mesma carta.');

const closeCreator=creator.cleanSlate2027R119.actions.find((x:any)=>x.id==='close_control');
const closeNoSkill=noDribbleEvidence.cleanSlate2027R119.actions.find((x:any)=>x.id==='close_control');
assert.ok(closeCreator && closeNoSkill && closeCreator.frequency > closeNoSkill.frequency,'Habilidades reais da carta devem aumentar evidência de ações coerentes com o DNA.');

const dmfAttrs:any={
  offensiveAwareness:64,ballControl:78,dribbling:70,tightPossession:75,lowPass:84,loftedPass:80,finishing:58,heading:78,placeKicking:60,curl:61,
  defensiveAwareness:90,defensiveEngagement:92,tackling:90,aggression:87,speed:80,acceleration:76,kickingPower:79,jump:82,physicalContact:88,balance:80,stamina:69
};
const dmf:any=applyCleanSlatePerformance2027R119(resultFor({name:'VOL estrutural',main:'DMF',best:'DMF',style:'Primeiro volante',defensive:'Pressão no Ataque',native:['Interceptação','Bloqueador','Passe de primeira'],attrs:dmfAttrs}));
assert.equal(dmf.training.shooting,0,'VOL defensivo não deve gastar em finalização sem retorno funcional.');
assert.ok(dmf.training.lowerBodyStrength > 0,'Carga online alta e stamina baixa devem justificar investimento físico quando houver retorno.');
assert.ok(dmf.cleanSlate2027R119.onlinePerformance.staminaSustainability > 0);
assert.ok(dmf.cleanSlate2027R119.actions.some((x:any)=>x.id==='intercept' && x.frequency>0));

console.log('r122 aprovada: máximo online, DNA por evidência da carta, anti-nome, anti-GER, estabilidade de assinatura e justificativa marginal por ponto.');
