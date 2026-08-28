import assert from 'node:assert/strict';
import { detectV600Playstyles } from '../src/lib/efootballV600Playstyles';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const legacy = detectV600Playstyles('ESTILO DE JOGO: Infiltração');
assert.equal(legacy.offensive, 'Infiltração');
assert.equal(legacy.defensive, 'Básico');
assert.equal(legacy.defensiveConfirmed, true);

const dual = detectV600Playstyles('ESTILO DE JOGO OFENSIVO: Artilheiro\nESTILO DE JOGO DEFENSIVO: Pressão no Ataque');
assert.equal(dual.offensive, 'Artilheiro');
assert.equal(dual.defensive, 'Pressão no Ataque');
assert.equal(dual.defensiveConfirmed, true);

const basic = detectV600Playstyles('ESTILO DE JOGO OFENSIVO: Infiltração\nESTILO DE JOGO DEFENSIVO: Básico');
assert.equal(basic.defensive, 'Básico');

const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});
function dmf(stamina:number, defensivePlaystyle='Básico') {
  const attrs:any={
    offensiveAwareness:67,finishing:60,placeKicking:62,curl:63,
    lowPass:82,loftedPass:79,ballControl:78,dribbling:72,tightPossession:75,
    acceleration:77,balance:79,speed:80,kickingPower:79,stamina,
    heading:77,jump:81,physicalContact:86,
    defensiveAwareness:88,defensiveEngagement:91,tackling:89,aggression:86
  };
  const parsed:any={playerName:`VOL ${stamina}`,cardType:'Epic',mainPosition:'DMF',mainPositionPt:'VOL',positions:['DMF','CMF'],positionsPt:['VOL','MLG'],positionRatings:{DMF:100,CMF:94},playstyle:'1º Volante',offensivePlaystyle:'1º Volante',defensivePlaystyle,defensivePlaystyleConfirmed:true,dominantFoot:'Direito',overall:105,maxOverall:109,height:190,weight:84,trainingPointsTotal:64,condition:{},impetos:[],nativeSkills:['Interceptação','Bloqueador','Passe de primeira'],additionalSkills:[],specialSkills:[],attributes:attrs,physicalProfile:{},manualConfirmed:true,evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:2,skillConfidence:.98,impetoSlotStatus:'DISPONIVEL'},internalId:`dmf-${stamina}`,confidence:.98,warnings:[]};
  return {parsed,bestPosition:{code:'DMF',label:'VOL',score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,trainingPointsTotal:64,trainingPointsRemaining:64,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],tacticalProfile:{formation:'AUTO',style:'AUTO'},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}} as any;
}

const low:any=applyCleanSlatePerformance2027R119(dmf(68));
const high:any=applyCleanSlatePerformance2027R119(dmf(91));
const press:any=applyCleanSlatePerformance2027R119(dmf(78,'Pressão no Ataque'));

assert.equal(trainingPlanTotalCost(low.training),64);
assert.equal(trainingPlanTotalCost(high.training),64);
assert.equal(low.training.shooting,0,'VOL defensivo sem evidência ofensiva não deve gastar em finalização por sobra de pontos.');
assert.ok(low.training.lowerBodyStrength >= high.training.lowerBodyStrength,'Resistência baixa com carga alta deve justificar pelo menos o mesmo investimento físico que stamina já alta.');
const lowIntercept=low.cleanSlate2027R119.actions.find((x:any)=>x.id==='intercept');
const pressRecover=press.cleanSlate2027R119.actions.find((x:any)=>x.id==='press_recover');
const basicRecover=high.cleanSlate2027R119.actions.find((x:any)=>x.id==='press_recover');
assert.ok(lowIntercept && lowIntercept.frequency>0,'Interceptação deve permanecer ação funcional do VOL com habilidade nativa.');
assert.ok(pressRecover && basicRecover && pressRecover.frequency>basicRecover.frequency,'Pressão no Ataque deve aumentar a frequência projetada de pressão, sem criar receita fixa de treino.');

console.log('r120 aprovada: dual playstyle, Básico legado, Pressão no Ataque, defesa manual e stamina adaptativa sem receita por posição.');
