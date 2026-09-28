import type { AttributeKey } from '../../lib/analyzerDomain';
import refs from './goldenCardLabR513.references.json';
import type { ProjectedPlayerStateR504 } from './projectedPlayerStateR504';
import { analyzePossessionR511, type PossessionUsageFunctionR511 } from './possessionEngineR511';

export const GOLDEN_CARD_LAB_R513_VERSION='40.80-r513-golden-card-lab-v1' as const;
export type GoldenScenarioR513='ORCHESTRATOR_POSSESSION'|'ANCHOR_DMF_POSSESSION'|'BOX_STRIKER'|'INFILTRATOR'|'BOX_TO_BOX'|'DESTROYER'|'BUILD_UP_CB'|'DEFENSIVE_FULLBACK';
export type GoldenReferenceR513={id:string;scenario:GoldenScenarioR513;label:string;position:'CMF'|'DMF'|'CF'|'AMF'|'CB'|'RB';style:'POSSESSION_CENTRAL';usageFunction:PossessionUsageFunctionR511;referenceKind:'SYNTHETIC_ARCHETYPE';officialGameData:false;purpose:string};
const rawRefs=refs as unknown as readonly Omit<GoldenReferenceR513,'style'|'referenceKind'|'officialGameData'>[];
export const GOLDEN_CARD_LAB_R513_REFERENCES:readonly GoldenReferenceR513[]=rawRefs.map(item=>({...item,style:'POSSESSION_CENTRAL',referenceKind:'SYNTHETIC_ARCHETYPE',officialGameData:false}));

export type GoldenDeterminismInputR513={referenceId:string;state:ProjectedPlayerStateR504;repetitions:number};
export type GoldenDeterminismResultR513={version:typeof GOLDEN_CARD_LAB_R513_VERSION;referenceId:string;scenario:GoldenScenarioR513;repetitions:number;uniqueOutputs:number;deterministic:boolean;status:'PASS'|'FAIL';certifiedForFinalWrite:false};
export type GoldenPerturbationInputR513={referenceId:string;state:ProjectedPlayerStateR504;perturbation:{attribute:AttributeKey;from:number;to:number;maxExpectedPossessionDelta:number}};
export type GoldenPerturbationResultR513={version:typeof GOLDEN_CARD_LAB_R513_VERSION;referenceId:string;scenario:GoldenScenarioR513;status:'PASS'|'REVIEW';changedAttributes:AttributeKey[];baseline:{attributeValue:number;possessionScore:number;calibrationStatus:'PROVISIONAL_UNCALIBRATED'};perturbed:{attributeValue:number;possessionScore:number;calibrationStatus:'PROVISIONAL_UNCALIBRATED'};possessionScoreDelta:number;maxExpectedPossessionDelta:number;certifiedForFinalWrite:false;reason:string};

const round6=(value:number)=>Math.round(value*1_000_000)/1_000_000;
function reference(referenceId:string){const found=GOLDEN_CARD_LAB_R513_REFERENCES.find(item=>item.id===referenceId);if(!found)throw new Error(`Referência Golden R513 desconhecida: ${referenceId}. Nenhum fallback foi aplicado.`);return found;}
function repetitions(value:number){if(!Number.isInteger(value)||value<2||value>100)throw new Error('Golden R513: repetitions deve ser inteiro entre 2 e 100.');return value;}
function fingerprint(state:ProjectedPlayerStateR504,usageFunction:PossessionUsageFunctionR511){return JSON.stringify(analyzePossessionR511(state,{usageFunction}));}
function changed(before:ProjectedPlayerStateR504,after:ProjectedPlayerStateR504){const keys=new Set<AttributeKey>([...Object.keys(before.finalAttributes) as AttributeKey[],...Object.keys(after.finalAttributes) as AttributeKey[]]);return [...keys].filter(key=>Number(before.finalAttributes[key])!==Number(after.finalAttributes[key])).sort((a,b)=>a.localeCompare(b));}

export function runGoldenDeterminismR513(input:GoldenDeterminismInputR513):GoldenDeterminismResultR513{
 const ref=reference(input.referenceId),count=repetitions(input.repetitions),outputs=new Set<string>();
 for(let index=0;index<count;index++)outputs.add(fingerprint(input.state,ref.usageFunction));
 const deterministic=outputs.size===1;
 return{version:GOLDEN_CARD_LAB_R513_VERSION,referenceId:ref.id,scenario:ref.scenario,repetitions:count,uniqueOutputs:outputs.size,deterministic,status:deterministic?'PASS':'FAIL',certifiedForFinalWrite:false};
}

export function runGoldenPerturbationR513(input:GoldenPerturbationInputR513):GoldenPerturbationResultR513{
 const ref=reference(input.referenceId),{attribute}=input.perturbation,actual=Number(input.state.finalAttributes[attribute]),from=Number(input.perturbation.from),to=Number(input.perturbation.to),max=Number(input.perturbation.maxExpectedPossessionDelta);
 if(!Number.isFinite(actual)||actual!==from)throw new Error(`Golden R513: valor inicial de ${attribute} é ${actual}; cenário declarou ${from}.`);
 if(!Number.isFinite(to)||to<1||to>99)throw new Error(`Golden R513: valor perturbado inválido para ${attribute}: ${to}.`);
 if(!Number.isFinite(max)||max<0)throw new Error('Golden R513: maxExpectedPossessionDelta deve ser finito e não negativo.');
 const perturbed:ProjectedPlayerStateR504={...input.state,finalAttributes:{...input.state.finalAttributes,[attribute]:to}};
 const changedAttributes=changed(input.state,perturbed),baseline=analyzePossessionR511(input.state,{usageFunction:ref.usageFunction}),next=analyzePossessionR511(perturbed,{usageFunction:ref.usageFunction}),delta=round6(next.possessionScore-baseline.possessionScore);
 const single=changedAttributes.length===1&&changedAttributes[0]===attribute,direction=to<from||delta>=-1e-9,inside=Math.abs(delta)<=max+1e-9,pass=single&&direction&&inside;
 return{version:GOLDEN_CARD_LAB_R513_VERSION,referenceId:ref.id,scenario:ref.scenario,status:pass?'PASS':'REVIEW',changedAttributes,baseline:{attributeValue:actual,possessionScore:round6(baseline.possessionScore),calibrationStatus:baseline.calibration.status},perturbed:{attributeValue:to,possessionScore:round6(next.possessionScore),calibrationStatus:next.calibration.status},possessionScoreDelta:delta,maxExpectedPossessionDelta:max,certifiedForFinalWrite:false,reason:pass?`Perturbação ${attribute} ${from}→${to} ficou estável dentro da faixa declarada (${max}).`:`Perturbação requer revisão: atributoÚnico=${single}; direçãoRacional=${direction}; dentroDaFaixa=${inside}.`};
}
