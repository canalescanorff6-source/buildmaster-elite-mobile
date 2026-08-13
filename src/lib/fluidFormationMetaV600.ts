import type { PositionCode } from './analyzerDomain';
import type { FormationBlueprint, FormationSlot } from './formationRoleEngine';
import type { FluidFormationPlanV600 } from './fluidFormationV600';

export const FLUID_FORMATION_META_V600_VERSION = '40.80-r8-fluid-meta-v600' as const;

export type FluidFormationMetaV600 = {
  attackName: string;
  defenseName: string;
  compactness: number;
  centralCover: number;
  recoveryDistance: number;
  transitionOutlet: number;
  inversionRisk: number;
  doublePressStructuralRisk: 'BAIXO' | 'MEDIO' | 'ALTO';
  recommendations: string[];
};

function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value * 10) / 10)); }
function outfield(slots: FormationSlot[]) { return slots.filter((slot)=>slot.position !== 'GK'); }
function average(values: number[]) { return values.length ? values.reduce((sum,value)=>sum+value,0)/values.length : 0; }
function spread(slots: FormationSlot[]) {
  if (!slots.length) return 0;
  const xs=slots.map((slot)=>slot.x); const ys=slots.map((slot)=>slot.y);
  return (Math.max(...xs)-Math.min(...xs)) + (Math.max(...ys)-Math.min(...ys));
}
function countPositions(formation: FormationBlueprint, positions: PositionCode[]) {
  return formation.slots.filter((slot)=>positions.includes(slot.position)).length;
}

export function evaluateFluidFormationMetaV600(plan: Pick<FluidFormationPlanV600,'attack'|'defense'|'teamPlaystyle'>): FluidFormationMetaV600 {
  const defense=outfield(plan.defense.slots);
  const defensiveSpread=spread(defense);
  const compactness=clamp(118-defensiveSpread*.62);
  const central=defense.filter((slot)=>slot.x>=27&&slot.x<=73&&slot.y>=38).length;
  const centralCover=clamp(central*13 + countPositions(plan.defense,['DMF'])*12 + countPositions(plan.defense,['CB'])*7);
  const lineY=average(defense.filter((slot)=>['LB','CB','RB'].includes(slot.position)).map((slot)=>slot.y));
  const recoveryDistance=clamp(100-Math.abs(76-lineY)*3.2);
  const outlets=defense.filter((slot)=>slot.y<34).length;
  const transitionOutlet=clamp(35+outlets*24 + countPositions(plan.defense,['CF','SS'])*8);
  const overload=plan.teamPlaystyle==='SOBREPOSICAO';
  const wideDefenders=defense.filter((slot)=>slot.x<20||slot.x>80).length;
  const inversionRisk=clamp((overload?52:28)+(wideDefenders<2?22:0)+(compactness>82?8:0));
  const highAttackers=defense.filter((slot)=>slot.y<42).length;
  const doublePressStructuralRisk:FluidFormationMetaV600['doublePressStructuralRisk']=highAttackers>=4&&centralCover<70?'ALTO':highAttackers>=3?'MEDIO':'BAIXO';
  const recommendations:string[]=[];
  if(centralCover<70) recommendations.push('Aproxime VOL/MLG da frente da zaga para impedir que dois defensores precisem sair ao mesmo tempo.');
  if(inversionRisk>=65) recommendations.push('Proteja a inversão: o jogador do lado oposto deve manter largura defensiva enquanto o lado da bola pressiona.');
  if(transitionOutlet<55) recommendations.push('Mantenha pelo menos uma referência alta para o primeiro passe após a recuperação.');
  if(doublePressStructuralRisk!=='BAIXO') recommendations.push('Defina um primeiro pressor e um fechador de linha; evite dois jogadores atacarem o mesmo portador.');
  if(!recommendations.length) recommendations.push('Estrutura equilibrada: preserve o primeiro defensor, a cobertura e a saída curta antes de aumentar a pressão.');
  return {attackName:plan.attack.name,defenseName:plan.defense.name,compactness,centralCover,recoveryDistance,transitionOutlet,inversionRisk,doublePressStructuralRisk,recommendations};
}
