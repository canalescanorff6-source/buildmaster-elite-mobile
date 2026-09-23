import type { AnalysisResult, PositionCode } from './analyzerDomain';
import type { GameplayScoutingRecordR454, GameplayScoutingRoleR454 } from '@/modules/scouting/gameplayScoutingR454';

export const SCOUTING_DECISION_EVIDENCE_R457_VERSION='40.80-r457-scouting-decision-evidence-v1' as const;
export type ScoutingDecisionEvidenceR457={
  version:typeof SCOUTING_DECISION_EVIDENCE_R457_VERSION;
  status:'APPLIED'|'IGNORED_PENDING'|'IGNORED_LOW_CONFIDENCE'|'NO_STRUCTURED_SIGNAL';
  confidenceWeight:number;
  actionMultipliers:Record<string,number>;
  adjustedActions:string[];
  sourceTypes:string[];
  reason:string;
  safeguards:{boundedInfluence:true;neverWritesTraining:true;neverInventsAttributes:true;gameVersionScoped:true};
};

const ROLE_ACTION_RULES:Array<[RegExp,string[]]>= [
  [/orquestr|armador|criador|cria[cç][aã]o|passe|construt|sa[ií]da/,['short_creation','through_creation','build_out']],
  [/infiltra|ruptura|espa[cç]o|profundidade|ataque sem bola/,['attack_space','finish_box']],
  [/drible|condu[cç][aã]o|carreg|controle curto/,['carry','close_control']],
  [/marca[cç][aã]o|intercept|desarme|conten[cç][aã]o|protetor|destruidor/,['intercept','defensive_duel','cover_space','press_recover']],
  [/piv[oô]|prote[cç][aã]o|apoio de costas/,['hold_up']],
  [/a[eé]reo|cabece|bola alta/,['aerial_finish','aerial_defend']],
  [/cruzamento|corredor|amplitude/,['cross_support']],
  [/goleiro|reflexo|shot.?stopper/,['gk_position','gk_reflex','gk_secure']]
];

function norm(v:unknown){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function clamp(v:number,min:number,max:number){return Math.max(min,Math.min(max,v));}
function sourceFactor(record:GameplayScoutingRecordR454){
  const weight:Record<string,number>={OFFICIAL:1,DATABASE:.92,USER_GAMEPLAY:.9,REVIEWER:.74,COMMUNITY:.56};
  const roleEvidenceSources=(record.sources??[]).filter(source=>!String(source.id).startsWith('match-r136:'));
  const values=(roleEvidenceSources.length?roleEvidenceSources.map(source=>source.type):(record.sourceTypes??[])).map(x=>weight[x]??.45);
  return values.length?Math.max(...values):.5;
}
function confidenceBase(record:GameplayScoutingRecordR454){
  return record.confidence==='ALTA'?.06:record.confidence==='MEDIA'?.04:.015;
}
function roleSignals(role:GameplayScoutingRoleR454){
  const text=norm(`${role.label} ${role.function} ${role.reason}`);
  const out=new Set<string>();
  for(const [pattern,actions] of ROLE_ACTION_RULES)if(pattern.test(text))actions.forEach(a=>out.add(a));
  return [...out];
}

export function buildScoutingDecisionEvidenceR457(result:AnalysisResult,position:PositionCode):ScoutingDecisionEvidenceR457{
  const record=(result as AnalysisResult&{gameplayScoutingR454?:GameplayScoutingRecordR454}).gameplayScoutingR454;
  const empty=(status:ScoutingDecisionEvidenceR457['status'],reason:string):ScoutingDecisionEvidenceR457=>({
    version:SCOUTING_DECISION_EVIDENCE_R457_VERSION,status,confidenceWeight:0,actionMultipliers:{},adjustedActions:[],sourceTypes:record?.sourceTypes??[],reason,
    safeguards:{boundedInfluence:true,neverWritesTraining:true,neverInventsAttributes:true,gameVersionScoped:true}
  });
  if(!record||record.status!=='READY')return empty('IGNORED_PENDING','Scouting ainda não está READY; nenhuma decisão da ficha foi alterada.');
  if(record.confidence==='BAIXA')return empty('IGNORED_LOW_CONFIDENCE','Scouting com confiança baixa fica apenas informativo.');
  const base=confidenceBase(record)*sourceFactor(record);
  const testedFactor=(record.testedPositions??[]).includes(position)?1:.78;
  const cap=clamp(base*testedFactor,.01,.06);
  const score=new Map<string,number>();
  const apply=(roles:GameplayScoutingRoleR454[],delta:number)=>{
    for(const role of roles.filter(r=>r.position===position))for(const action of roleSignals(role))score.set(action,(score.get(action)??0)+delta);
  };
  apply(record.bestRoles??[],1);
  apply(record.acceptableRoles??[],.45);
  apply(record.badRoles??[],-.85);
  if(!score.size)return empty('NO_STRUCTURED_SIGNAL','Registro READY existe, mas ainda não há função estruturada para a posição de uso.');
  const actionMultipliers:Record<string,number>={};
  for(const [action,value] of score)actionMultipliers[action]=Math.round(clamp(1+value*cap,.94,1.06)*10000)/10000;
  return {
    version:SCOUTING_DECISION_EVIDENCE_R457_VERSION,status:'APPLIED',confidenceWeight:Math.round(cap*10000)/10000,
    actionMultipliers,adjustedActions:Object.keys(actionMultipliers).sort(),sourceTypes:[...(record.sourceTypes??[])],
    reason:`Scouting READY aplicado com influência máxima de ±6% na demanda funcional; peso efetivo ${Math.round(cap*1000)/10}%.`,
    safeguards:{boundedInfluence:true,neverWritesTraining:true,neverInventsAttributes:true,gameVersionScoped:true}
  };
}
