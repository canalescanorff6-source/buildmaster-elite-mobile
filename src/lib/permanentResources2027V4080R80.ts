import type { AnalysisResult, ImpetoRecommendation, PositionCode } from './analyzerDomain';
import type { CanonicalCardIdentityR60 } from './canonicalCardIdentity2027V4080R60';
import type { PerformanceEngine2027R70 } from './performanceEngine2027V4080R70';
import type { PerformanceEngine2027R107 } from './performanceEngine2027V4080R107';
import type { PerformanceEngine2027R108 } from './performanceEngine2027V4080R108';
import { skillIdentityKey } from './officialSkillIdentity';

export const PERMANENT_RESOURCES_2027_R80_VERSION = '40.80-r80-permanent-skills-impeto-2027' as const;

type ResourceCandidate = { name: string; score: number; stability: number; regretRisk: number; reasons: string[] };
export type PermanentResources2027R80 = {
  version: typeof PERMANENT_RESOURCES_2027_R80_VERSION;
  cardKey: string;
  attackPosition: PositionCode;
  defencePosition: PositionCode;
  permanentTop5: string[];
  skillScores: ResourceCandidate[];
  permanentImpeto: ResourceCandidate | null;
  impetoAlternatives: ResourceCandidate[];
  shouldSpendImpeto: boolean;
  shouldSpendSkills: boolean;
  confidence: number;
  guards: {
    nativeDuplicatesBlocked: boolean;
    fiveSlotsRespected: boolean;
    dualPhaseStable: boolean;
    rareResourceRegretProtected: boolean;
  };
};

type WithR80 = AnalysisResult & { permanentResources2027R80: PermanentResources2027R80 };

function clamp(v:number,min=0,max=100){ return Math.max(min,Math.min(max,v)); }
function norm(v:unknown){ return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
type MasterShape = { cardKey:string; attackPosition:PositionCode; defencePosition:PositionCode };
type Enriched = AnalysisResult & { masterCardV4080R50?: MasterShape; canonicalCardIdentity2027R60?: CanonicalCardIdentityR60; performanceEngine2027R70?: PerformanceEngine2027R70; performanceEngine2027R107?: PerformanceEngine2027R107; performanceEngine2027R108?: PerformanceEngine2027R108 };
function master(result: AnalysisResult): MasterShape | undefined { return (result as Enriched).masterCardV4080R50; }
function canonical(result: AnalysisResult): CanonicalCardIdentityR60 | undefined { return (result as Enriched).canonicalCardIdentity2027R60; }
function r70(result: AnalysisResult): PerformanceEngine2027R70 | undefined { return (result as Enriched).performanceEngine2027R70; }
function r107(result: AnalysisResult): PerformanceEngine2027R107 | undefined { return (result as Enriched).performanceEngine2027R107; }
function r108(result: AnalysisResult): PerformanceEngine2027R108 | undefined { return (result as Enriched).performanceEngine2027R108; }
function positions(result: AnalysisResult): [PositionCode,PositionCode] {
  const m=master(result), c=canonical(result);
  return [m?.attackPosition ?? c?.attackPosition ?? result.bestPosition.code, m?.defencePosition ?? c?.defencePosition ?? result.bestPosition.code];
}
function cardKey(result:AnalysisResult){ return master(result)?.cardKey ?? canonical(result)?.cardKey ?? `${norm(result.parsed.playerName)}|${norm(result.parsed.cardType)}|${result.parsed.mainPosition}`; }

function ownedKeys(result:AnalysisResult){
  const owned = [...(result.parsed.nativeSkills ?? []), ...(result.parsed.additionalSkills ?? [])];
  return new Set(owned.map(skillIdentityKey));
}
function roleAffinity(skill:string,pos:PositionCode){
  const s=norm(skill); let n=55;
  const attack=['CF','SS','LWF','RWF','AMF'].includes(pos), midfield=['CMF','LMF','RMF','DMF'].includes(pos), defence=['CB','LB','RB'].includes(pos), gk=pos==='GK';
  if(gk) return /goleiro|penalti|lideranca|guerreiro/.test(s)?92:5;
  if(attack && /chute|finaliza|cavadinha|efeito|cabec|duplo|sola|passe de primeira|profundidade/.test(s)) n+=25;
  if(midfield && /passe|intercept|volta para marcar|sola|guerreiro|bloqueador/.test(s)) n+=22;
  if(defence && /intercept|bloqueador|marcacao|carrinho|afastamento|superioridade aerea|guerreiro/.test(s)) n+=28;
  if(defence && /penalti|cavadinha|folha seca/.test(s)) n-=45;
  if(attack && /marcacao individual|carrinho|afastamento/.test(s)) n-=35;
  return clamp(n);
}
function skillCandidate(skill:string,a:PositionCode,d:PositionCode):ResourceCandidate{
  const sa=roleAffinity(skill,a), sd=roleAffinity(skill,d); const dual=Math.min(sa,sd); const peak=Math.max(sa,sd);
  const stability=clamp(dual*0.72+peak*0.28); const regret=clamp(100-stability);
  const score=clamp(stability + (a===d?5:0) - regret*0.08);
  return {name:skill,score:+score.toFixed(1),stability:+stability.toFixed(1),regretRisk:+regret.toFixed(1),reasons:[`Ataque ${a}: ${sa}/100.`,`Defesa ${d}: ${sd}/100.`, a===d?'Mesma posição nas duas fases aumenta permanência.':'Pontuação prioriza utilidade nas duas fases.']};
}
function impetoCandidate(item:ImpetoRecommendation,a:PositionCode,d:PositionCode):ResourceCandidate{
  const base=clamp(Number(item.score??0)); const confidence=clamp(Number(item.confidence??70));
  const stability=clamp(base*0.68+confidence*0.32-(a!==d?5:0)); const regret=clamp(100-stability);
  return {name:item.name,score:+(stability-regret*0.12).toFixed(1),stability:+stability.toFixed(1),regretRisk:+regret.toFixed(1),reasons:[item.reason,`Confiança original ${confidence}/100.`,a===d?'Função posicional estável.':'Penalidade de arrependimento aplicada por função de duas fases.'].filter(Boolean)};
}


function specialImpetoSupportR115(result: AnalysisResult, item: ImpetoRecommendation) {
  const special=norm((result.parsed.specialSkills??[]).join(' | '));
  if(!special) return 0;
  const attrs=norm((item.attributes??[]).join(' | '));
  let bonus=0; const matches=(pattern:RegExp)=>pattern.test(attrs);
  if(/curva descendente|blitz curler/.test(special)&&matches(/finaliza|curva|forca do chute|acelera|equilibr|controle/)) bonus+=14;
  if(/drible explosivo|drible de impulso|pes magneticos/.test(special)&&matches(/drible|controle|acelera|equilibr|veloc/)) bonus+=13;
  if(/finalizacao fenomenal|chute rasteiro fulminante|cabecada fulminante/.test(special)&&matches(/finaliza|talento ofensivo|forca do chute|cabec|salto/)) bonus+=13;
  if(/passe decisivo|passador nato|passe visionario|desencadeador de ataques|cruzamento cortante/.test(special)&&matches(/passe|controle|curva/)) bonus+=12;
  if(/esticada de perna|fortaleza|garra/.test(special)&&matches(/defens|desarme|contato|resistencia|veloc/)) bonus+=12;
  if(/comandante da defesa|rugido do goleiro/.test(special)&&matches(/goleiro|reflex|alcance|firmeza|defesa/)) bonus+=14;
  return bonus;
}
function withSpecialImpetoSupportR115(result: AnalysisResult, item: ImpetoRecommendation, base: ResourceCandidate) {
  const bonus=specialImpetoSupportR115(result,item); if(!bonus) return base;
  const stability=clamp(base.stability+bonus*.55); const regretRisk=clamp(100-stability);
  return {...base,score:+clamp(base.score+bonus).toFixed(1),stability:+stability.toFixed(1),regretRisk:+regretRisk.toFixed(1),reasons:[`Habilidade especial: +${bonus} compatibilidade funcional.`,...base.reasons]};
}
// BM_R115_IMPETO_SPECIAL_SUPPORT: Ímpeto resolve gargalo real da carta, não overall.

export function applyPermanentResources2027R80(result:AnalysisResult):WithR80{
  const [attack,defence]=positions(result); const owned=ownedKeys(result);
  const skillScores=(result.recommendedSkills??[]).filter(s=>!owned.has(skillIdentityKey(s))).map(s=>skillCandidate(s,attack,defence)).sort((x,y)=>y.score-x.score);
  const top5=skillScores.slice(0,5).map(x=>x.name);
  const active=result.parsed.impetos?.find(i=>i.active!==false)?.name ?? null;
  const impetos=(result.recommendedImpetos??[]).filter(i=>i.tier!=='evitar').map(i=>withSpecialImpetoSupportR115(result,i,impetoCandidate(i,attack,defence))).sort((x,y)=>y.score-x.score);
  let winner:ResourceCandidate|null=impetos[0]??null;
  if(active) winner={name:active,score:100,stability:100,regretRisk:0,reasons:['Ímpeto já aplicado: preservado como recurso permanente da carta.']};
  // BM_R114_IMPETO_TRUTH: candidato fraco pode aparecer como alternativa, mas não vira recurso Mestre.
  if(!active && winner && (winner.stability<88 || winner.regretRisk>12)) winner=null;
  const confidence=clamp((canonical(result)?.identityConfidence??72)*0.45+(r108(result)?.confidence??r107(result)?.confidence??r70(result)?.confidence??70)*0.35+(top5.length===5?100:65)*0.2);
  const shouldSpendImpeto=!active && !!winner && winner.stability>=88 && winner.regretRisk<=12 && confidence>=82;
  const shouldSpendSkills=top5.length===5 && skillScores.slice(0,5).every(x=>x.stability>=55) && confidence>=70;
  const analysis:PermanentResources2027R80={version:PERMANENT_RESOURCES_2027_R80_VERSION,cardKey:cardKey(result),attackPosition:attack,defencePosition:defence,permanentTop5:top5,skillScores,permanentImpeto:winner,impetoAlternatives:impetos.slice(1,4),shouldSpendImpeto,shouldSpendSkills,confidence:+confidence.toFixed(1),guards:{nativeDuplicatesBlocked:top5.every(s=>!owned.has(skillIdentityKey(s))),fiveSlotsRespected:top5.length<=5,dualPhaseStable:skillScores.slice(0,5).every(x=>x.stability>=50),rareResourceRegretProtected:active?true:!winner||winner.regretRisk<=12||!shouldSpendImpeto}};
  return {...result,permanentResources2027R80:analysis,recommendationExplanation:[`Recursos r80: Top 5 permanente ${top5.length}/5; confiança ${analysis.confidence}%.`,winner?(shouldSpendImpeto?`Ímpeto Mestre aprovado: ${winner.name}.`:`Ímpeto candidato ${winner.name}, mas gasto bloqueado até confiança/permanência suficientes.`):'Ímpeto: nenhum candidato seguro; não gastar recurso raro.',...result.recommendationExplanation].filter((x,i,a)=>a.indexOf(x)===i).slice(0,88)} as WithR80;
}
