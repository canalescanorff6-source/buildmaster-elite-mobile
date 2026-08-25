import assert from 'node:assert/strict';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const zero=()=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});

function card(name:string,attrs:Record<string,number>,opts:{specialSkills?:string[];slot?:string;impeto?:string|null}={}){
  const parsed:any={
    playerName:name,cardType:'Epic',mainPosition:'CF',mainPositionPt:'CA',positions:['CF'],positionsPt:['CA'],positionRatings:{CF:100},
    playstyle:'Homem de área',offensivePlaystyle:'Homem de área',defensivePlaystyle:null,dominantFoot:'Direito',overall:105,maxOverall:105,
    height:182,weight:80,trainingPointsTotal:64,condition:{},
    impetos:opts.impeto?[{name:opts.impeto,active:true}]:[],nativeSkills:['Chute de primeira'],additionalSkills:[],specialSkills:opts.specialSkills??[],
    attributes:attrs,physicalProfile:{},manualConfirmed:true,
    evidence:{positionLocked:true,playstyleLocked:true,attributeCount:Object.keys(attrs).length,positionRatingsCount:1,skillConfidence:.97,...(opts.slot?{impetoSlotStatus:opts.slot}:{})},
    internalId:name,confidence:.97,warnings:[]
  };
  return {parsed,bestPosition:{code:'CF',label:'CA',score:100},positionScores:[],pri:{},tacticalFit:{},training:zero(),trainingCost:zero(),trainingPointsUsed:0,trainingPointsTotal:64,trainingPointsRemaining:64,trainingCostRule:'',trainingComparison:[],buildVariants:[],recommendationExplanation:[],tacticalProfile:{formation:'AUTO',style:'AUTO'},teamMap:{},profileTips:[],validation:{level:'safe',confirmed:true,canGenerate:true,issues:[]},permittedPositions:[],avoidPositions:[],recommendedSkills:[],skillRecommendations:[],avoidSkills:[],recommendedImpetos:[],buildName:'',strengths:[],weaknesses:[],usageTips:[],note:'',deepAnalysis:{},advancedTacticalFunction:{},specialSkillsAnalysis:{},physicalEngine:{},attributeGoals:{},advancedOptimizer:{},correctionLimit:{},marginalReturn:[],errorTolerance:{},skillPriority:{}} as any;
}

const technicalAttrs={offensiveAwareness:92,finishing:92,ballControl:90,dribbling:88,tightPossession:89,acceleration:88,balance:90,speed:84,kickingPower:89,heading:78,jump:79,physicalContact:82,stamina:82,lowPass:78,loftedPass:70,curl:86,placeKicking:75};
const aerialAttrs={offensiveAwareness:91,finishing:89,ballControl:79,dribbling:72,tightPossession:73,acceleration:80,balance:78,speed:80,kickingPower:87,heading:91,jump:92,physicalContact:90,stamina:83,lowPass:70,loftedPass:68,curl:76,placeKicking:72};

const technical:any=applyCleanSlatePerformance2027R119(card('CF técnico sem prova aérea',technicalAttrs,{slot:'DISPONIVEL'}));
const aerial:any=applyCleanSlatePerformance2027R119(card('CF aéreo comprovado',aerialAttrs,{slot:'DISPONIVEL',specialSkills:['Fortaleza aérea','Cabeçada fulminante']}));

assert.equal(trainingPlanTotalCost(technical.training),64,'O orçamento precisa continuar exato.');
assert.equal(trainingPlanTotalCost(aerial.training),64,'O orçamento da carta aérea também precisa continuar exato.');
const technicalAerial=technical.cleanSlate2027R119.actions.find((item:any)=>item.id==='aerial_finish');
const technicalFinish=technical.cleanSlate2027R119.actions.find((item:any)=>item.id==='finish_box');
const trueAerial=aerial.cleanSlate2027R119.actions.find((item:any)=>item.id==='aerial_finish');
assert.ok(technicalAerial && technicalFinish && trueAerial,'As ações sentinela precisam existir.');
assert.ok(technicalAerial.frequency < technicalFinish.frequency,'Capacidade aérea secundária não pode virar frequência maior que a principal ação de finalização sem prova funcional.');
assert.ok(trueAerial.frequency > technicalAerial.frequency+25,'Habilidade especial/nativa aérea precisa elevar claramente a prioridade aérea quando a própria carta comprova isso.');
assert.ok(technical.training.aerialStrength < 8,'Uma carta técnica sem prova aérea não deve despejar pontos em Bola aérea apenas porque os atributos são bons.');
assert.ok(aerial.training.aerialStrength > technical.training.aerialStrength,'Especialização aérea verdadeira pode justificar mais investimento aéreo.');
assert.ok(!technical.recommendedSkills.includes('Super substituto'),'Top 5 permanente não deve sacrificar uma habilidade forte para forçar diversidade com Super substituto contextual.');

const unknownSlot:any=applyCleanSlatePerformance2027R119(card('CF vaga não lida',technicalAttrs));
assert.equal(unknownSlot.cleanSlate2027R119.impetoDecision,'REVIEW_SLOT','Vaga desconhecida deve separar candidato ideal de autorização de gasto.');
assert.ok(unknownSlot.cleanSlate2027R119.impetoIdeal,'Mesmo sem vaga confirmada o motor deve mostrar qual Ímpeto tem melhor encaixe.');
assert.ok(unknownSlot.cleanSlate2027R119.impetoIdealScore>=48,'O candidato exibido precisa superar o limiar funcional.');
assert.equal(unknownSlot.recommendedImpetos.length,0,'Sem vaga confirmada o motor não pode autorizar gasto nem preencher recommendedImpetos.');
assert.match(unknownSlot.cleanSlate2027R119.impetoReason,/confirme a vaga/i);

const occupied:any=applyCleanSlatePerformance2027R119(card('CF sem vaga',technicalAttrs,{slot:'SEM_VAGA'}));
assert.equal(occupied.cleanSlate2027R119.impetoDecision,'SLOT_NOT_AVAILABLE');
assert.ok(occupied.cleanSlate2027R119.impetoIdeal,'Sem vaga ainda pode existir candidato ideal para referência futura.');
assert.equal(occupied.recommendedImpetos.length,0);

const current:any=applyCleanSlatePerformance2027R119(card('CF Ímpeto atual',technicalAttrs,{slot:'OCUPADO',impeto:'Chute'}));
assert.equal(current.cleanSlate2027R119.impetoDecision,'KEEP_CURRENT');
assert.equal(current.cleanSlate2027R119.currentImpeto,'Chute');
assert.equal(current.recommendedImpetos.length,0,'Ímpeto existente nunca pode ser recomendado novamente.');

console.log('r119 output quality aprovada: capacidade != frequência, anti-aéreo falso, Top 5 suave e Ímpeto ideal separado do gasto.');
