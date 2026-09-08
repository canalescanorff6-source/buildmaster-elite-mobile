import assert from 'node:assert/strict';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { OFFICIAL_ADDITIONAL_SKILLS } from '../src/modules/analysis/analyzerCatalog';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';

const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});
const attrs:any={
  offensiveAwareness:90,ballControl:94,dribbling:95,tightPossession:94,lowPass:86,loftedPass:78,finishing:86,heading:67,placeKicking:78,curl:89,
  defensiveAwareness:50,defensiveEngagement:55,tackling:48,aggression:61,speed:87,acceleration:93,kickingPower:84,jump:69,physicalContact:70,balance:94,stamina:84,
  goalkeeperAwareness:40,goalkeeperCatching:40,goalkeeperParrying:40,goalkeeperReflexes:40,goalkeeperReach:40
};
function base(target:'SS'|'CF', impeto?:string) {
  const parsed:any={
    playerName:'R180 Mesma Carta',cardType:'Epic',mainPosition:'SS',mainPositionPt:'SA',positions:['SS','CF'],positionsPt:['SA','CA'],positionRatings:{SS:100,CF:96},
    playstyle:'Puxa marcação',offensivePlaystyle:'Puxa marcação',defensivePlaystyle:'Básico',defensivePlaystyleConfirmed:true,dominantFoot:'Direito',overall:105,maxOverall:105,
    height:178,weight:74,trainingPointsTotal:64,condition:{},impetos:impeto?[{name:impeto,active:true,value:2}]:[],nativeSkills:['Passe de primeira','Precisão à distância'],additionalSkills:[],specialSkills:[],
    attributes:attrs,physicalProfile:{},manualConfirmed:true,evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:2,skillConfidence:.98,impetoSlotStatus:impeto?'OCUPADO':'DISPONIVEL'},internalId:'r180-same-card',confidence:.98,warnings:[]
  };
  return {objective:'COMPETITIVE',parsed,bestPosition:{code:target,label:target,score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,trainingPointsTotal:64,trainingPointsRemaining:64,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],tacticalProfile:{formation:'AUTO',style:'AUTO'},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}} as any;
}

const ss:any=applyCleanSlatePerformance2027R119(base('SS'));
const cf:any=applyCleanSlatePerformance2027R119(base('CF'));
assert.equal(ss.cleanSlate2027R119.authority,'CLEAN_SLATE_SINGLE_WRITER');
assert.equal(cf.cleanSlate2027R119.authority,'CLEAN_SLATE_SINGLE_WRITER');
assert.equal(ss.cleanSlate2027R119.cardKey,cf.cleanSlate2027R119.cardKey,'Mesma carta precisa manter identidade permanente entre posições de uso.');
assert.equal(ss.cleanSlate2027R119.positionAnchor,cf.cleanSlate2027R119.positionAnchor,'Âncora natural não muda com a função escolhida.');
assert.equal(ss.cleanSlate2027R119.usagePosition,'SS');
assert.equal(cf.cleanSlate2027R119.usagePosition,'CF');
assert.notDeepEqual(ss.training,cf.training,'A ficha precisa adaptar-se à função real de uso.');
assert.equal(trainingPlanTotalCost(ss.training),64);
assert.equal(trainingPlanTotalCost(cf.training),64);
for (const result of [ss,cf]) {
  assert.equal(result.recommendedSkills.length,5,'Catálogo disponível deve entregar exatamente cinco habilidades.');
  assert.equal(new Set(result.recommendedSkills.map(skillIdentityKey)).size,5,'Top 5 não pode conter duplicatas.');
  const owned=new Set([...result.parsed.nativeSkills,...result.parsed.additionalSkills,...result.parsed.specialSkills].map(skillIdentityKey));
  for (const skill of result.recommendedSkills) {
    assert.ok(OFFICIAL_ADDITIONAL_SKILLS.has(skill),`Habilidade não oficial na saída final: ${skill}`);
    assert.ok(!owned.has(skillIdentityKey(skill)),`Habilidade já possuída foi repetida: ${skill}`);
  }
  assert.equal(result.cleanSlate2027R119.guards.usagePositionAffectsBuildNotCardIdentity,true);
  assert.equal(result.cleanSlate2027R119.guards.ownedSkillDuplicatesBlocked,true);
  assert.equal(result.cleanSlate2027R119.guards.exactBudget,true);
}
const occupied:any=applyCleanSlatePerformance2027R119(base('SS','Chute'));
assert.equal(occupied.cleanSlate2027R119.impetoDecision,'KEEP_CURRENT');
assert.equal(occupied.cleanSlate2027R119.currentImpeto,'Chute');
assert.equal(occupied.recommendedImpetos.length,0,'Ímpeto já aplicado nunca pode ser recomendado de novo.');
assert.equal(occupied.cleanSlate2027R119.guards.existingImpetoNeverRepeated,true);
console.log('R180 runtime final aprovado: identidade fixa, ficha adaptável, orçamento exato, Top 5 oficial/único e Ímpeto seguro.');
