import type {
  AnalysisResult,
  AttributeKey,
  MetaVivo2027V4080R8Analysis,
  PositionCode
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { buildV600LiveCatalogSnapshot } from './efootballV600LiveCatalog';
import { buildManualDefenceCoachV600 } from './manualDefenceCoachV600';
import { buildGameplayEnvironmentV600 } from './gameplayEnvironmentV600';
import { buildManagerMetaV600 } from './managerMetaV600';
import { skillIdentityKey } from './officialSkillIdentity';
import { buildAttributeMeta2027 } from './attributeMeta2027V600';

export const META_VIVO_2027_V4080_R8_VERSION = '40.80-r8-meta-vivo-2027' as const;

function clamp(value: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)) * 10) / 10;
}

function value(result: AnalysisResult, key: AttributeKey, fallback = 50) {
  return Number(result.parsed.attributes[key] ?? fallback);
}

function average(values: number[]) {
  return values.length ? values.reduce((sum,item)=>sum+item,0)/values.length : 0;
}

function skillOwned(result: AnalysisResult, pattern: RegExp) {
  return [...result.parsed.nativeSkills,...(result.parsed.additionalSkills ?? []),...result.parsed.specialSkills].some((item)=>pattern.test(item));
}

function positionWeights(position: PositionCode): { attack:number; defence:number } {
  if (position === 'GK') return {attack:.08,defence:.92};
  if (position === 'CB') return {attack:.18,defence:.82};
  if (position === 'LB' || position === 'RB') return {attack:.38,defence:.62};
  if (position === 'DMF') return {attack:.37,defence:.63};
  if (position === 'CMF') return {attack:.55,defence:.45};
  if (position === 'LMF' || position === 'RMF') return {attack:.62,defence:.38};
  if (position === 'AMF') return {attack:.76,defence:.24};
  if (position === 'SS') return {attack:.8,defence:.2};
  if (position === 'CF') return {attack:.88,defence:.12};
  return {attack:.82,defence:.18};
}

function firstTouchScore(result: AnalysisResult) {
  if (result.bestPosition.code === 'GK') return clamp(average([value(result,'goalkeeperAwareness'),value(result,'goalkeeperCatching'),value(result,'lowPass',55)]));
  return clamp(value(result,'ballControl')*.29 + value(result,'tightPossession')*.24 + value(result,'balance')*.17 + value(result,'lowPass')*.17 + value(result,'acceleration')*.13);
}

function commandResponseScore(result: AnalysisResult) {
  if (result.bestPosition.code === 'GK') return clamp(value(result,'goalkeeperReflexes')*.45 + value(result,'goalkeeperAwareness')*.3 + value(result,'acceleration',55)*.1 + value(result,'balance',55)*.15);
  return clamp(value(result,'acceleration')*.27 + value(result,'balance')*.23 + value(result,'ballControl')*.19 + value(result,'tightPossession')*.18 + value(result,'stamina')*.13);
}

function manualDefenceScore(result: AnalysisResult) {
  const interception = skillOwned(result,/intercepta[cç][aã]o/i) ? 7 : 0;
  const blocker = skillOwned(result,/bloqueador/i) ? 5 : 0;
  const marking = skillOwned(result,/marca[cç][aã]o individual/i) ? 4 : 0;
  const score = value(result,'defensiveAwareness')*.28 + value(result,'defensiveEngagement')*.25 + value(result,'tackling')*.22 + value(result,'acceleration')*.11 + value(result,'stamina')*.08 + interception + blocker + marking;
  return clamp(score);
}

function coverageScore(result: AnalysisResult) {
  const awareness=value(result,'defensiveAwareness');
  const engagement=value(result,'defensiveEngagement');
  const stamina=value(result,'stamina');
  const speed=value(result,'speed');
  return clamp(awareness*.34+engagement*.3+stamina*.18+speed*.12+(skillOwned(result,/intercepta[cç][aã]o/i)?6:0));
}

function transitionScore(result: AnalysisResult) {
  if (result.bestPosition.code === 'GK') return clamp(value(result,'lowPass',55)*.32+value(result,'loftedPass',55)*.42+value(result,'goalkeeperAwareness')*.26);
  return clamp(value(result,'lowPass')*.23+value(result,'ballControl')*.2+value(result,'tightPossession')*.16+value(result,'acceleration')*.17+value(result,'offensiveAwareness')*.12+value(result,'stamina')*.12);
}

function delayRobustness(result: AnalysisResult, firstTouch:number, response:number) {
  const simpleExecution=average([value(result,'lowPass'),value(result,'ballControl'),value(result,'balance'),value(result,'tightPossession')]);
  const profile=result.efootballV600?.connectionProfile ?? result.tacticalProfile.connectionProfile ?? 'VARIABLE';
  const context = profile === 'HIGH_DELAY' ? 1.08 : profile === 'VARIABLE' ? 1.03 : .97;
  return clamp((firstTouch*.34+response*.34+simpleExecution*.32)*context);
}

function phaseLabels(result: AnalysisResult) {
  const current=result.realPerformance2027V4080R7?.phaseProfile;
  return {
    attack:current?.attackRole ?? result.teamMap.attackingJob ?? `função ofensiva de ${POSITION_PT[result.bestPosition.code]}`,
    defence:current?.defenceRole ?? result.teamMap.defensiveJob ?? `função defensiva de ${POSITION_PT[result.bestPosition.code]}`
  };
}

function portfolio(result: AnalysisResult): MetaVivo2027V4080R8Analysis['skillPortfolio'] {
  const r7=result.realPerformance2027V4080R7;
  const final=r7?.finalSkills?.length ? r7.finalSkills : result.recommendedSkills;
  const ranked=r7?.skillMarginal ?? [];
  const roles: MetaVivo2027V4080R8Analysis['skillPortfolio'][number]['role'][]=['IDENTIDADE','ATAQUE','TRANSICAO_DEFESA','ROBUSTEZ','DIFERENCIAL'];
  return final.slice(0,5).map((name,index)=>{
    const marginal=ranked.find((item)=>skillIdentityKey(item.name)===skillIdentityKey(name));
    const role=roles[index] ?? 'DIFERENCIAL';
    const reason=role==='IDENTIDADE'
      ? 'Preserva a maior característica funcional da carta.'
      : role==='ATAQUE'
        ? 'Melhora a ação principal na fase com bola.'
        : role==='TRANSICAO_DEFESA'
          ? 'Cobre perda da bola, pressão, passe de saída ou duelo conforme a posição.'
          : role==='ROBUSTEZ'
            ? 'Reduz dependência de execução perfeita em cenário variável.'
            : 'Completa o conjunto sem duplicar uma função já suficientemente coberta.';
    return {name,role,marginalGain:clamp(marginal?.marginalGain ?? 70),reason};
  });
}

function impetoInvestment(result: AnalysisResult): MetaVivo2027V4080R8Analysis['impetoInvestment'] {
  const policy=result.realPerformance2027V4080R7?.impetoPolicy;
  if(!policy) return {decision:'CONFIRMAR_ANTES_DE_GASTAR',current:null,ideal:null,gain:0,priority:'NAO_GASTAR',reason:'A política de Ímpeto anterior não está disponível; não gaste até a vaga e o Ímpeto atual serem confirmados.'};
  const priority:MetaVivo2027V4080R8Analysis['impetoInvestment']['priority']=policy.decision==='SEM_VAGA'||policy.decision==='CONFIRMAR_ANTES_DE_GASTAR'||policy.decision==='MANTER'
    ? 'NAO_GASTAR'
    : policy.gain>=14?'ALTA':policy.gain>=9?'MEDIA':'BAIXA';
  return {decision:policy.decision,current:policy.current,ideal:policy.ideal,gain:policy.gain,priority,reason:policy.reason};
}

function defensiveStyleStatus(result: AnalysisResult): MetaVivo2027V4080R8Analysis['catalog']['playerDefensiveStyleStatus'] {
  if(!result.parsed.defensivePlaystyle) return 'AUSENTE';
  return result.parsed.defensivePlaystyleConfirmed ? 'CONFIRMADO' : 'PROVISORIO';
}

export function buildMetaVivo2027V4080R8(result: AnalysisResult): MetaVivo2027V4080R8Analysis {
  const catalog=buildV600LiveCatalogSnapshot();
  const coach=buildManualDefenceCoachV600(result);
  const environment=buildGameplayEnvironmentV600(result);
  const manager=buildManagerMetaV600(result);
  const attributeMeta=buildAttributeMeta2027(result);
  const firstTouch=firstTouchScore(result);
  const commandResponse=commandResponseScore(result);
  const manualDefence=manualDefenceScore(result);
  const coverageDiscipline=coverageScore(result);
  const transition=transitionScore(result);
  const r7Balance=result.realPerformance2027V4080R7?.phaseProfile.phaseBalanceScore ?? 75;
  const phaseBalance=clamp(r7Balance*.68+transition*.16+coach.score*.16);
  const delayRobustnessScore=delayRobustness(result,firstTouch,commandResponse);
  const weights=positionWeights(result.bestPosition.code);
  const attackFunctional=clamp(firstTouch*.27+commandResponse*.22+transition*.26+value(result,'offensiveAwareness')*.13+value(result,'stamina')*.12);
  const defenceFunctional=clamp(manualDefence*.43+coverageDiscipline*.37+coach.score*.2);
  const phaseFunctional=attackFunctional*weights.attack+defenceFunctional*weights.defence;
  const finalFunctional=clamp(phaseFunctional*.84+phaseBalance*.08+delayRobustnessScore*.08);
  const confidence=clamp(result.parsed.confidence*.62+Math.min(100,result.parsed.evidence.attributeCount*4)*.22+(result.parsed.defensivePlaystyleConfirmed?100:72)*.08+(result.realPerformance2027V4080R7?100:65)*.08);
  const phase=phaseLabels(result);
  const skillPortfolio=portfolio(result);
  const impeto=impetoInvestment(result);
  const managerStatus=manager.status;
  const learningRecommendation=environment.connectionProfile==='STABLE'
    ? 'Use as partidas v6.0 estáveis como amostra principal do A/B; mantenha pelo menos 5 jogos por variante.'
    : 'Partidas com conexão variável/alta latência entram com peso menor; não deixe uma sessão ruim derrubar uma ficha que funciona em partidas estáveis.';

  return {
    engineVersion:META_VIVO_2027_V4080_R8_VERSION,
    mode:'META_VIVO_2027',
    selectedPosition:result.bestPosition.code,
    attributeMeta:{engineVersion:attributeMeta.engineVersion,positionLabel:attributeMeta.positionLabel,playerPlaystyle:attributeMeta.playerPlaystyle,teamPlaystyle:attributeMeta.teamPlaystyle,topPriorities:attributeMeta.topPriorities.map(({label,current,targetMin,targetIdeal,usefulCeiling,priority,gap,reason})=>({label,current,targetMin,targetIdeal,usefulCeiling,priority,gap,reason})),stopSpending:attributeMeta.stopSpending.map(({label,current,targetIdeal,usefulCeiling,priority,reason})=>({label,current,targetIdeal,usefulCeiling,priority,reason})),dnaRule:attributeMeta.dnaRule,summary:attributeMeta.summary},
    scores:{firstTouch,commandResponse,manualDefence,coverageDiscipline,transition,phaseBalance,delayRobustness:delayRobustnessScore,finalFunctional,confidence},
    phaseRole:{attack:phase.attack,defence:phase.defence,responsibility:coach.responsibility,doublePressRisk:coach.doublePressRisk,instruction:coach.instruction,secondaryInstruction:coach.secondaryInstruction,drill:coach.drill},
    skillPortfolio,
    finalSkills:skillPortfolio.map((item)=>item.name),
    impetoInvestment:impeto,
    catalog:{
      standardAdditionalSkills:catalog.standardAdditionalSkills,
      effectiveAdditionalSkills:catalog.effectiveAdditionalSkills,
      recognizedSpecialSkills:catalog.recognizedSpecialSkills,
      effectiveSpecialSkills:catalog.effectiveSpecialSkills,
      provisionalSpecialSkills:catalog.provisionalSpecialSkills,
      offensivePlaystyles:catalog.offensivePlaystyles,
      confirmedDefensivePlaystyles:catalog.confirmedDefensivePlaystyles,
      teamPlaystyles:catalog.teamPlaystyles,
      playerDefensiveStyleStatus:defensiveStyleStatus(result)
    },
    manager:{teamStyle:manager.teamStyleLabel,primaryStyle:manager.primaryStyle,secondaryStyle:manager.secondaryStyle,combinationSlotsSupported:2,observedCombinations:manager.observedCombinations.map((item)=>item.name),status:managerStatus},
    environment:{connectionProfile:environment.connectionProfile,reliabilityWeight:environment.reliabilityWeight,graphicsPolicy:environment.graphicsPolicy,savedGraphicsMode:environment.savedGraphicsMode,targetFps:environment.targetFps,stadiumQuality:environment.stadiumQuality,diagnosis:environment.diagnosis},
    learning:{currentEpochWeight:1,legacyWeight:.35,minimumAbMatchesPerArm:5,poorConnectionMatchesDownweighted:true,recommendation:learningRecommendation},
    guarantees:{gerIsNotOptimizationTarget:true,doesNotClaimToFixNetwork:true,unknownSkillsAreNotWeighted:true,unknownDefensiveStylesAreNotWeighted:true,existingImpetoIsNeverAutoReplaced:true,attackAndDefenceAreJointlyEvaluated:true,doublePressureGuardEnabled:true},
    reasons:[
      attributeMeta.summary,
      `Primeiro toque ${Math.round(firstTouch)}/100 e resposta a comando ${Math.round(commandResponse)}/100 entram separadamente para não confundir qualidade técnica com velocidade pura.`,
      `Defesa manual ${Math.round(manualDefence)}/100 e disciplina de cobertura ${Math.round(coverageDiscipline)}/100 usam a função real da posição e habilidades defensivas já possuídas.`,
      `Responsabilidade defensiva: ${coach.responsibility.replaceAll('_',' ')}; risco de dupla pressão ${coach.doublePressRisk.toLowerCase()}.`,
      environment.diagnosis,
      impeto.reason,
      manager.note,
      `Catálogo vivo: ${catalog.standardAdditionalSkills} habilidades adicionais padrão, ${catalog.recognizedSpecialSkills} especiais reconhecidas e novos itens remotos/provisórios separados por confiança.`
    ],
    summary:`${result.parsed.playerName}: Meta Vivo 2027 fecha ${POSITION_PT[result.bestPosition.code]} em ${Math.round(finalFunctional)}/100 funcional, com primeiro toque ${Math.round(firstTouch)}, defesa manual ${Math.round(manualDefence)} e robustez ao cenário de delay ${Math.round(delayRobustnessScore)}.`
  };
}

export function applyMetaVivo2027V4080R8(result: AnalysisResult): AnalysisResult {
  const analysis=buildMetaVivo2027V4080R8(result);
  if(result.objective!=='COMPETITIVE') return {...result,metaVivo2027V4080R8:analysis};
  const finalSkills=analysis.finalSkills.length===5?analysis.finalSkills:result.recommendedSkills;
  return {
    ...result,
    recommendedSkills:finalSkills,
    buildName:`Ficha Automática v40.80 r8 — Meta Vivo 2027 — ${result.parsed.playerName}`,
    buildVariants:result.buildVariants.length?result.buildVariants.map((variant,index)=>index===0?{
      ...variant,
      title:`Ficha Final r8 — Meta Vivo 2027 — ${result.parsed.playerName}`,
      adaptationLabel:'V6 AO VIVO • ATAQUE/DEFESA • DEFESA MANUAL • CATÁLOGO VIVO',
      note:analysis.summary,
      qualityScore:analysis.scores.finalFunctional
    }:variant):result.buildVariants,
    recommendationExplanation:[analysis.summary,...analysis.reasons,...result.recommendationExplanation].filter((item,index,all)=>all.indexOf(item)===index).slice(0,42),
    strengths:[
      'Meta Vivo 2027 avalia atributos-meta por posição + estilo do jogador + técnico, primeiro toque, resposta, defesa manual, cobertura, transição e robustez ao delay sem usar GER como alvo.',
      'Catálogo de habilidades e estilos é vivo: itens desconhecidos ficam provisórios até confirmação, sem peso inventado.',
      'Cada carta recebe responsabilidade defensiva explícita para reduzir dupla pressão na Formação Fluída.',
      ...result.strengths
    ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,28),
    note:`${analysis.summary} Ímpeto: ${analysis.impetoInvestment.decision.replaceAll('_',' ')}.`,
    metaVivo2027V4080R8:analysis
  };
}
