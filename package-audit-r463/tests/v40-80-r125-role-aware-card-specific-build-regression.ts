import assert from 'node:assert/strict';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});

function resultFor({
  name='Carta r125', overall=105, main='CF', best=main, style='Artilheiro', defensive='Básico', defensiveConfirmed=true, native=[] as string[], attrs
}: {
  name?: string; overall?: number; main?: string; best?: string; style?: string; defensive?: string; defensiveConfirmed?: boolean; native?: string[]; attrs: Record<string,number>;
}) {
  const parsed:any={
    playerName:name,cardType:'Epic',mainPosition:main,mainPositionPt:main,positions:[main],positionsPt:[main],positionRatings:{[main]:100},
    playstyle:style,offensivePlaystyle:style,defensivePlaystyle:defensive,defensivePlaystyleConfirmed:defensiveConfirmed,dominantFoot:'Direito',
    overall,maxOverall:overall,height:180,weight:78,trainingPointsTotal:64,condition:{},impetos:[],nativeSkills:native,additionalSkills:[],specialSkills:[],
    attributes:attrs,physicalProfile:{},manualConfirmed:true,
    evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:1,skillConfidence:.98,impetoSlotStatus:'DISPONIVEL'},
    internalId:`r125-${name}`,confidence:.98,warnings:[]
  };
  return {
    objective:'COMPETITIVE',parsed,bestPosition:{code:best,label:best,score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,
    trainingPointsTotal:64,trainingPointsRemaining:64,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],
    tacticalProfile:{formation:'AUTO',style:'AUTO'},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},
    permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',
    deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}
  } as any;
}

const cfAttrs:any={
  offensiveAwareness:91,ballControl:87,dribbling:84,tightPossession:82,lowPass:72,loftedPass:68,finishing:91,heading:80,placeKicking:73,curl:76,
  defensiveAwareness:46,defensiveEngagement:48,tackling:45,aggression:70,speed:86,acceleration:88,kickingPower:88,jump:78,physicalContact:82,balance:83,stamina:79
};
const naturalCF:any=applyCleanSlatePerformance2027R119(resultFor({attrs:cfAttrs,native:['Finalização de primeira','Cabeçada']}));
const sameCardCB:any=applyCleanSlatePerformance2027R119(resultFor({attrs:cfAttrs,best:'CB',native:['Finalização de primeira','Cabeçada']}));
const sameCardHighOverall:any=applyCleanSlatePerformance2027R119(resultFor({attrs:cfAttrs,overall:118,native:['Finalização de primeira','Cabeçada']}));

assert.ok(Number(naturalCF.cleanSlate2027R119.version.match(/-r(\d+)-/)?.[1])>=125,'R125: a autoridade Clean Slate não pode regredir abaixo da revisão card-specific.');
assert.equal(naturalCF.cleanSlate2027R119.authority,'CLEAN_SLATE_SINGLE_WRITER');
assert.equal(trainingPlanTotalCost(naturalCF.training),64);
assert.equal(trainingPlanTotalCost(sameCardCB.training),64);
assert.equal(naturalCF.cleanSlate2027R119.cardKey,sameCardCB.cleanSlate2027R119.cardKey,'A identidade da carta não muda por posição de uso.');
assert.equal(naturalCF.cleanSlate2027R119.positionAnchor,'CF');
assert.equal(sameCardCB.cleanSlate2027R119.positionAnchor,'CF');
assert.equal(naturalCF.cleanSlate2027R119.usagePosition,'CF');
assert.equal(sameCardCB.cleanSlate2027R119.usagePosition,'CB');
assert.equal(sameCardCB.cleanSlate2027R119.usagePositionChanged,true);
assert.deepEqual(sameCardCB.training,naturalCF.training,'Uma mudança real CF→CB deve alterar o contexto de uso sem recriar a progressão permanente da mesma carta.');
assert.equal(sameCardCB.cleanSlate2027R119.positionStabilityR184?.decision,'NATURAL_ANCHOR','A autoridade permanente deve continuar ancorada na posição natural da carta.');
assert.equal(sameCardCB.cleanSlate2027R119.playstyleContext.offensive.status,'LIKELY_INACTIVE');
assert.equal(sameCardCB.cleanSlate2027R119.playstyleContext.offensive.activeWeight,0);
assert.equal(sameCardCB.cleanSlate2027R119.playstyleContext.neutralRoleMode,true,'Estilo ofensivo cinza/inativo deve liberar cálculo neutro por função.');
assert.deepEqual(sameCardHighOverall.training,naturalCF.training,'Overall/GER continua proibido de decidir a ficha.');
assert.equal(naturalCF.cleanSlate2027R119.guards.usagePositionAffectsBuildNotCardIdentity,true);
assert.equal(naturalCF.cleanSlate2027R119.guards.inactivePlaystyleDoesNotForceRecipe,true);
assert.equal(naturalCF.cleanSlate2027R119.guards.actionAttributesHaveFunctionalWeights,true);

const sameAttrsPoacher:any=applyCleanSlatePerformance2027R119(resultFor({name:'Mesmo DNA Artilheiro',attrs:cfAttrs,style:'Artilheiro'}));
const sameAttrsPivot:any=applyCleanSlatePerformance2027R119(resultFor({name:'Mesmo DNA Pivô',attrs:cfAttrs,style:'Pivô'}));
const poacherAttack=sameAttrsPoacher.cleanSlate2027R119.actions.find((x:any)=>x.id==='attack_space');
const pivotAttack=sameAttrsPivot.cleanSlate2027R119.actions.find((x:any)=>x.id==='attack_space');
const poacherHold=sameAttrsPoacher.cleanSlate2027R119.actions.find((x:any)=>x.id==='hold_up');
const pivotHold=sameAttrsPivot.cleanSlate2027R119.actions.find((x:any)=>x.id==='hold_up');
assert.ok(poacherAttack && pivotAttack && poacherAttack.frequency > pivotAttack.frequency,'Artilheiro deve reforçar ataque ao espaço mais que Pivô com a mesma carta-base.');
assert.ok(poacherHold && pivotHold && pivotHold.frequency > poacherHold.frequency,'Pivô deve reforçar proteção/apoio mais que Artilheiro com a mesma carta-base.');

const provisionalDefensive:any=applyCleanSlatePerformance2027R119(resultFor({name:'ZAG estilo defensivo provisório',main:'CB',best:'CB',style:'Defensor Criativo',defensive:'Destruidor',defensiveConfirmed:false,attrs:{...cfAttrs,defensiveAwareness:90,defensiveEngagement:90,tackling:90,aggression:90}}));
assert.equal(provisionalDefensive.cleanSlate2027R119.playstyleContext.defensive.activeWeight,0,'Estilo defensivo provisório não pode influenciar a ficha até confirmação.');
assert.match(provisionalDefensive.cleanSlate2027R119.playstyleContext.note,/provisório.*peso zero/i);

const technicalCF:any={...cfAttrs,ballControl:95,dribbling:95,tightPossession:94,balance:94,heading:66,jump:67,physicalContact:70};
const aerialCF:any={...cfAttrs,ballControl:78,dribbling:72,tightPossession:72,balance:76,heading:94,jump:92,physicalContact:93};
const tech:any=applyCleanSlatePerformance2027R119(resultFor({name:'CF técnico',attrs:technicalCF,style:'Puxa marcação',native:['Toque duplo','Controle de domínio']}));
const aerial:any=applyCleanSlatePerformance2027R119(resultFor({name:'CF aéreo',attrs:aerialCF,style:'Homem de área',native:['Cabeçada','Finalização acrobática']}));
assert.notDeepEqual(aerial.training,tech.training,'Duas cartas de CF com DNA diferente não podem cair na mesma receita por padrão.');
assert.ok(aerial.training.aerialStrength > tech.training.aerialStrength,'O CF aéreo deve receber mais retorno em força aérea que o CF técnico.');

const buildCBAttrs:any={...cfAttrs,offensiveAwareness:55,finishing:48,ballControl:82,tightPossession:79,lowPass:87,loftedPass:86,defensiveAwareness:91,defensiveEngagement:89,tackling:88,aggression:82,speed:82,acceleration:77,heading:82,jump:82,physicalContact:86,stamina:86};
const stopperCBAttrs:any={...buildCBAttrs,ballControl:70,tightPossession:68,lowPass:72,loftedPass:72,defensiveAwareness:94,defensiveEngagement:95,tackling:94,aggression:94,heading:92,jump:91,physicalContact:94};
const buildCB:any=applyCleanSlatePerformance2027R119(resultFor({name:'ZAG construtor',main:'CB',best:'CB',style:'Defensor criativo',attrs:buildCBAttrs,native:['Passe de primeira','Passe ponderado']}));
const stopperCB:any=applyCleanSlatePerformance2027R119(resultFor({name:'ZAG imposição',main:'CB',best:'CB',style:'O destruidor',attrs:stopperCBAttrs,native:['Interceptação','Bloqueador','Combate']}));
assert.notDeepEqual(buildCB.training,stopperCB.training,'Zagueiros com DNA técnico e físico diferentes não podem compartilhar receita automática.');
assert.ok(buildCB.training.passing > stopperCB.training.passing,'Zagueiro construtor deve justificar mais passe quando a própria carta sustenta isso.');
assert.ok(stopperCB.training.aerialStrength > buildCB.training.aerialStrength,'Zagueiro de imposição aérea deve justificar mais força aérea pela própria evidência.');
assert.ok(buildCB.training.dribbling <= 4 && stopperCB.training.dribbling <= 4,'Zagueiro não deve ganhar drible alto apenas porque o grupo matematicamente soma vários atributos.');

console.log('r125 aprovada: posição de uso afeta a função sem apagar o DNA, estilo inativo não força receita, GER é neutro e cartas distintas geram fichas distintas por evidência.');


// BM_R404_CARD_DNA_DIVERSITY_REGRESSION
const r404SameStyleArchetypes:any[]=[
  {...cfAttrs,ballControl:96,dribbling:96,tightPossession:95,balance:94,heading:63,jump:65,physicalContact:68,speed:83,acceleration:86,finishing:86},
  {...cfAttrs,offensiveAwareness:96,speed:96,acceleration:97,balance:84,ballControl:84,dribbling:80,tightPossession:79,heading:66,jump:70,physicalContact:72},
  {...cfAttrs,offensiveAwareness:95,finishing:97,kickingPower:96,curl:91,ballControl:84,dribbling:78,tightPossession:77,speed:82,acceleration:83,heading:70},
  {...cfAttrs,heading:97,jump:96,physicalContact:97,finishing:91,kickingPower:91,balance:86,ballControl:77,dribbling:70,tightPossession:69,speed:78,acceleration:76},
  {...cfAttrs,lowPass:94,loftedPass:91,ballControl:94,tightPossession:93,dribbling:89,balance:90,finishing:82,kickingPower:82,speed:80,acceleration:82,heading:65}
];
const r404ArchetypeBuilds=r404SameStyleArchetypes.map((attrs,index)=>applyCleanSlatePerformance2027R119(resultFor({name:`R404 DNA ${index}`,attrs,style:'Artilheiro',native:[]})));
for(const build of r404ArchetypeBuilds){
  assert.ok(Number(build.cleanSlate2027R119.version.match(/-r(\d+)-/)?.[1])>=404);
  assert.equal(trainingPlanTotalCost(build.training),64);
}
const r404Signatures=new Set(r404ArchetypeBuilds.map(build=>JSON.stringify(build.training)));
assert.ok(r404Signatures.size>=4,`R404: cinco CFs de mesmo papel, estilo e orçamento devem preservar diversidade real de DNA; assinaturas=${r404Signatures.size}.`);

const r404NameA:any=applyCleanSlatePerformance2027R119(resultFor({name:'Nome A não decide',attrs:r404SameStyleArchetypes[0],style:'Artilheiro',native:[]}));
const r404NameB:any=applyCleanSlatePerformance2027R119(resultFor({name:'Nome B não decide',attrs:r404SameStyleArchetypes[0],style:'Artilheiro',native:[]}));
assert.deepEqual(r404NameA.training,r404NameB.training,'R404: nome não pode ser usado para fabricar diversidade.');

const r404Partial:any=applyCleanSlatePerformance2027R119(resultFor({name:'R404 leitura parcial',style:'Artilheiro',native:[],attrs:{
  offensiveAwareness:93,ballControl:91,dribbling:90,tightPossession:89,finishing:92,
  speed:91,acceleration:92,kickingPower:90,balance:88,stamina:84
}}));
assert.equal(r404Partial.cleanSlate2027R119.status,'READY');
assert.equal(r404Partial.training.passing,0,'R404: passe totalmente não observado não pode receber pontos por fallback artificial.');
assert.equal(r404Partial.training.aerialStrength,0,'R404: bola aérea totalmente não observada não pode receber pontos por fallback artificial.');
assert.equal(trainingPlanTotalCost(r404Partial.training),64);

console.log('r404 aprovada: diversidade vem do DNA observado; posição/receita não domina, nome não interfere e atributo ausente não fabrica retorno.');


// BM_R405_MARGINAL_RETURN_DIVERSITY_REGRESSION
for(const build of r404ArchetypeBuilds){
  assert.ok(Number(build.cleanSlate2027R119.version.match(/-r(\d+)-/)?.[1])>=405);
  assert.equal(trainingPlanTotalCost(build.training),64);
  assert.ok(build.cleanSlate2027R119.pointRationale.every((x:any)=>Number.isFinite(x.returnPerCost)),'R405: retorno marginal final deve ser auditável.');
}
assert.ok(new Set(r404ArchetypeBuilds.map(build=>JSON.stringify(build.training))).size>=4,'R405: desempate marginal não pode recolapsar os cinco DNAs em uma receita.');
const r405Repeat:any=applyCleanSlatePerformance2027R119(resultFor({name:'R405 repetição determinística',attrs:r404SameStyleArchetypes[0],style:'Artilheiro',native:[]}));
assert.deepEqual(r405Repeat.training,r404ArchetypeBuilds[0].training,'R405: mesma evidência deve produzir a mesma ficha sem aleatoriedade.');
console.log('r405 aprovada: finalistas near-tie usam retorno marginal + DNA; desempenho continua primeiro e a ficha permanece determinística.');


// BM_R406_PARETO_NO_WASTED_POINT_REGRESSION
for(const build of r404ArchetypeBuilds){
  assert.ok(Number(build.cleanSlate2027R119.version.match(/-r(\d+)-/)?.[1])>=406);
  assert.equal(trainingPlanTotalCost(build.training),64);
  assert.equal(build.cleanSlate2027R119.guards.exactBudget,true);
}
assert.ok(new Set(r404ArchetypeBuilds.map(build=>JSON.stringify(build.training))).size>=4,'R406: Pareto não pode recolapsar DNAs distintos em receita única.');
const r406Again:any=applyCleanSlatePerformance2027R119(resultFor({name:'R406 determinismo',attrs:r404SameStyleArchetypes[3],style:'Artilheiro',native:[]}));
assert.deepEqual(r406Again.training,r404ArchetypeBuilds[3].training,'R406: frontier Pareto precisa ser determinística.');
console.log('r406 aprovada: ficha final permanece exata, determinística, diversa por DNA e protegida contra candidato Pareto-dominado no frontier.');
