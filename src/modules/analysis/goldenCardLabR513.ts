import type { AttributeKey } from '../../lib/analyzerDomain';
import refs from './goldenCardLabR513.references.json';
import type { ProjectedPlayerStateR504 } from './projectedPlayerStateR504';
import { analyzePossessionR511, type PossessionUsageFunctionR511 } from './possessionEngineR511';

export const GOLDEN_CARD_LAB_R513_VERSION='40.80-r513-golden-card-lab-v1' as const;
type GoldenRef={id:string;scenario:string;label:string;position:string;usageFunction:PossessionUsageFunctionR511;purpose:string};
export const GOLDEN_CARD_LAB_R513_REFERENCES=(refs as unknown as readonly GoldenRef[]).map(r=>({...r,style:'POSSESSION_CENTRAL' as const,referenceKind:'SYNTHETIC_ARCHETYPE' as const,officialGameData:false as const}));

const round6=(n:number)=>Math.round(n*1e6)/1e6;
const ref=(id:string)=>{const r=GOLDEN_CARD_LAB_R513_REFERENCES.find(x=>x.id===id);if(!r)throw new Error(`Referência Golden R513 desconhecida: ${id}. Nenhum fallback foi aplicado.`);return r;};
const count=(n:number)=>{if(!Number.isInteger(n)||n<2||n>100)throw new Error('Golden R513: repetitions deve ser inteiro entre 2 e 100.');return n;};
const fingerprint=(state:ProjectedPlayerStateR504,usageFunction:PossessionUsageFunctionR511)=>JSON.stringify(analyzePossessionR511(state,{usageFunction}));
const changed=(a:ProjectedPlayerStateR504,b:ProjectedPlayerStateR504)=>{const keys=new Set<AttributeKey>([...Object.keys(a.finalAttributes) as AttributeKey[],...Object.keys(b.finalAttributes) as AttributeKey[]]);return[...keys].filter(k=>Number(a.finalAttributes[k])!==Number(b.finalAttributes[k])).sort((x,y)=>x.localeCompare(y));};

export function runGoldenDeterminismR513(input:{referenceId:string;state:ProjectedPlayerStateR504;repetitions:number}){
 const r=ref(input.referenceId),repetitions=count(input.repetitions),outputs=new Set<string>();
 for(let i=0;i<repetitions;i++)outputs.add(fingerprint(input.state,r.usageFunction));
 const deterministic=outputs.size===1;
 return{version:GOLDEN_CARD_LAB_R513_VERSION,referenceId:r.id,scenario:r.scenario,repetitions,uniqueOutputs:outputs.size,deterministic,status:deterministic?'PASS' as const:'FAIL' as const,certifiedForFinalWrite:false as const};
}

export function runGoldenPerturbationR513(input:{referenceId:string;state:ProjectedPlayerStateR504;perturbation:{attribute:AttributeKey;from:number;to:number;maxExpectedPossessionDelta:number}}){
 const r=ref(input.referenceId),{attribute}=input.perturbation,actual=Number(input.state.finalAttributes[attribute]),from=Number(input.perturbation.from),to=Number(input.perturbation.to),max=Number(input.perturbation.maxExpectedPossessionDelta);
 if(!Number.isFinite(actual)||actual!==from)throw new Error(`Golden R513: valor inicial de ${attribute} é ${actual}; cenário declarou ${from}.`);
 if(!Number.isFinite(to)||to<1||to>99)throw new Error(`Golden R513: valor perturbado inválido para ${attribute}: ${to}.`);
 if(!Number.isFinite(max)||max<0)throw new Error('Golden R513: maxExpectedPossessionDelta deve ser finito e não negativo.');
 const nextState:ProjectedPlayerStateR504={...input.state,finalAttributes:{...input.state.finalAttributes,[attribute]:to}},changedAttributes=changed(input.state,nextState),base=analyzePossessionR511(input.state,{usageFunction:r.usageFunction}),next=analyzePossessionR511(nextState,{usageFunction:r.usageFunction}),delta=round6(next.possessionScore-base.possessionScore),single=changedAttributes.length===1&&changedAttributes[0]===attribute,direction=to<from||delta>=-1e-9,inside=Math.abs(delta)<=max+1e-9,pass=single&&direction&&inside;
 return{version:GOLDEN_CARD_LAB_R513_VERSION,referenceId:r.id,scenario:r.scenario,status:pass?'PASS' as const:'REVIEW' as const,changedAttributes,baseline:{attributeValue:actual,possessionScore:round6(base.possessionScore),calibrationStatus:base.calibration.status},perturbed:{attributeValue:to,possessionScore:round6(next.possessionScore),calibrationStatus:next.calibration.status},possessionScoreDelta:delta,maxExpectedPossessionDelta:max,certifiedForFinalWrite:false as const,reason:pass?`Perturbação ${attribute} ${from}→${to} ficou estável dentro da faixa declarada (${max}).`:`Perturbação requer revisão: atributoÚnico=${single}; direçãoRacional=${direction}; dentroDaFaixa=${inside}.`};
}
