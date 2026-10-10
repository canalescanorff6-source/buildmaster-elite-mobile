import type { AnalysisResult, AttributeKey, TrainingPlan } from './analyzerDomain';
import type { ManagerRecord } from './managers';
import type { MatchValidationRecord } from './appStartupContractsR200';
import { auditCardBuildR564 } from './cardPerformanceAuditR564';
import { comparePerformanceBuildsR565 } from './buildComparisonR565';
import { buildCardSlotsViewR561, buildManagerAttributeViewR561 } from './cardVisualEvidenceR561';
import { verifiedTrainingBaseAttributes } from '../modules/analysis/projectedPlayerStateR504';
import { listMatchEvidenceContextsR568 } from './matchEvidenceLabR568';
import { cardIdentityFingerprintR126 } from './cardIdentityFingerprintR126';

export const FINAL_DECISION_R570_VERSION = 'r570-evidence-decision-readonly-1' as const;
export type DecisionCheckR570 = {
  key: 'CARD' | 'BUDGET' | 'BUILDS' | 'TACTIC' | 'MANAGER' | 'SKILLS' | 'BOOSTERS' | 'MATCHES';
  label: string;
  status: 'VALIDADO' | 'REVISAR' | 'BLOQUEADO';
  detail: string;
};
export type FinalDecisionR570 = {
  version: typeof FINAL_DECISION_R570_VERSION;
  status: 'BLOQUEADO' | 'PRECISA_REVISAO';
  checks: DecisionCheckR570[];
  playerName: string;
  editionFingerprint: string;
  requestedPosition: string;
  style: string;
  formation: string;
  managerName: string | null;
  spent: number | null;
  budget: number | null;
  remaining: number | null;
  variantCount: number;
  matchCount: number;
  comparableMatchContexts: number;
  nextActions: string[];
  /** Estimates and uncalibrated heuristic scores never produce an automatic winner. */
  selectedWinnerId: null;
  canWriteVault: false;
  canApplyToGame: false;
};

const NUM = (v: unknown): v is number => typeof v==='number' && Number.isSafeInteger(v) && v>=0;
const matchRecordInCard = (record: MatchValidationRecord, result: AnalysisResult): boolean =>
  record.cardFingerprint===cardIdentityFingerprintR126(result.parsed)
  && record.targetPosition===(result.requestedUsagePosition??result.bestPosition.code);

/** Consolidates decisions, never silently upgrades OCR, coach bonuses or match measurements. */
export function buildFinalDecisionR570(input:{
  result:AnalysisResult;
  manager:ManagerRecord|null;
  matchRecords:readonly MatchValidationRecord[];
}):FinalDecisionR570 {
  const {result,manager}=input;
  const card=result.parsed;
  const fingerprint=cardIdentityFingerprintR126(card);
  const base=verifiedTrainingBaseAttributes(card);
  const confirmedKeys: AttributeKey[]=base?Object.keys(base) as AttributeKey[]:[];
  const verifiedBase=!!base && confirmedKeys.length===26;
  const manualBudget=card.manualConfirmed===true && card.trainingPointSource==='MANUAL'
    && NUM(card.trainingPointsTotal)?card.trainingPointsTotal:null;
  const cleanCard=verifiedBase?{...card,attributes:base!}:card;
  const audit=auditCardBuildR564({
    card:cleanCard,plan:result.training,
    budget:manualBudget,budgetProvenance:manualBudget===null?'UNKNOWN':'MANUAL_CONFIRMED',
    baseProvenance:verifiedBase?'PRE_MANAGER_CONFIRMED':'UNKNOWN',
    confirmedBaseAttributeKeys:confirmedKeys,
  });
  const distinct=new Set<string>();
  const options=(result.buildVariants??[]).filter(v=>{
    const signature=JSON.stringify(v.training);
    if(distinct.has(signature))return false;
    distinct.add(signature);
    return true;
  }).slice(0,3).map((v,i)=>({
    id:v.kind+'-'+i, objective:(v.kind==='safe'?'EQUILIBRADA'
      :v.kind==='alternative'?'ESPECIALISTA':'COMPETITIVA') as 'EQUILIBRADA'|'ESPECIALISTA'|'COMPETITIVA',
    training:v.training as TrainingPlan,
    calibration:'UNVERIFIED' as const,
  }));
  const comparison=comparePerformanceBuildsR565({
    card:cleanCard,budget:manualBudget,baseProvenance:verifiedBase?'PRE_MANAGER_CONFIRMED':'UNKNOWN',
    confirmedBaseAttributeKeys:confirmedKeys,candidates:options,
  });
  const slots=buildCardSlotsViewR561(card);
  const managerProjection=buildManagerAttributeViewR561(result,manager);
  const inContext=input.matchRecords.filter(r=>matchRecordInCard(r,result));
  const contexts=listMatchEvidenceContextsR568(inContext);
  const matchingPosition=result.requestedUsagePosition??result.bestPosition.code;
  const warnings:DecisionCheckR570[]=[
    {
      key:'CARD',label:'Identidade e atributos da carta',
      status:card.evidence?.criticalStateR419==='CONFLICTING'?'BLOQUEADO'
        :verifiedBase && card.evidence?.attributeCount===26?'VALIDADO':'REVISAR',
      detail:verifiedBase?'Base independente verificável e 26 atributos encontrados; conferir a edição.'
        :'Origem dos atributos-base ou edição ainda sem comprovação independente.',
    },
    {
      key:'BUDGET',label:'Progressão e orçamento',
      status:audit.status==='BLOQUEADO'?'BLOQUEADO'
        :audit.optimizationAllowed?'VALIDADO':'REVISAR',
      detail:'Custo progressivo: '+(audit.pointsUsed??'PENDENTE')+
        ' / orçamento: '+(audit.budget??'PENDENTE')+
        '. '+(audit.issues.slice(0,2).map(x=>x.message).join(' ')||'Sem alertas de custo.'),
    },
    {
      key:'BUILDS',label:'Variantes e desempenho em campo',
      status:'REVISAR',
      detail:comparison.candidates.length+' variante(s). '+comparison.reason+
        ' Não otimizar GER como substituto de eficiência real.',
    },
    {
      key:'TACTIC',label:'Posição, formação e estilo',
      status:'REVISAR',
      detail:'Posição '+matchingPosition+', formação '+result.tacticalProfile.formation+
        ', estilo '+result.tacticalProfile.style+
        '. São contexto da análise; confirmar em campo e no XI da R566.',
    },
    {
      key:'MANAGER',label:'Técnico e origem dos bônus',
      status:'REVISAR',
      detail:manager?manager.name+': '+(managerProjection?.note??'Bônus não mensurados neste perfil.')+
        ' Ativação de vínculos depende da escalação real.':'Técnico não selecionado nesta análise.',
    },
    {
      key:'SKILLS',label:'Cinco habilidades adicionais',
      status:slots.skills.every(x=>x.status==='CONFIRMADO'||x.status==='LIVRE_CONFIRMADA')?'VALIDADO':'REVISAR',
      detail:slots.skills.filter(x=>x.status==='CONFIRMADO').length+
        ' ocupada(s) confirmada(s); '+slots.skills.filter(x=>x.status==='LIVRE_CONFIRMADA').length+
        ' livre(s) confirmada(s). Tokens exigem conferência na R567.',
    },
    {
      key:'BOOSTERS',label:'Ímpetos e crafting',
      status:slots.boosters.every(x=>x.status==='CONFIRMADO'||x.status==='LIVRE_CONFIRMADA'||x.status==='SEM_VAGA')?'VALIDADO':'REVISAR',
      detail:slots.boosters.map(x=>x.label+': '+x.status).join('; ')+
        '. Seleção e custo no jogo dependem de confirmação manual.',
    },
    {
      key:'MATCHES',label:'Partidas reais e calibração',
      status:'REVISAR',
      detail:inContext.length+' partida(s) desta edição/posição; '+contexts.length+
        ' contexto(s) A/B com metadados. R568 só permite análise descritiva com evidência suficiente.',
    },
  ];
  const nextActions=warnings.filter(x=>x.status!=='VALIDADO').map(x=>x.label+': '+x.detail).slice(0,5);
  const blocked=warnings.some(x=>x.status==='BLOQUEADO');
  return {
    version:FINAL_DECISION_R570_VERSION,status:blocked?'BLOQUEADO':'PRECISA_REVISAO',
    checks:warnings,playerName:card.playerName||'Carta sem nome',
    editionFingerprint:fingerprint,
    requestedPosition:matchingPosition,
    style:result.tacticalProfile.style,formation:result.tacticalProfile.formation,
    managerName:manager?.name??null,spent:audit.pointsUsed,budget:audit.budget,
    remaining:audit.pointsRemaining,variantCount:options.length,
    matchCount:inContext.length,comparableMatchContexts:contexts.length,
    nextActions,selectedWinnerId:null,canWriteVault:false,canApplyToGame:false,
  };
}
