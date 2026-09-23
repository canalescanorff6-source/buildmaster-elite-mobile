import { canonicalSkillName } from './officialSkillIdentity';

export const GAMEPLAY_IMPACT_R458_VERSION = '40.80-r458-real-gameplay-impact-v1' as const;

export type GameplayImpactActionR458 = {
  id:string;
  label:string;
  demand:number;
  naturalScore:number;
  projectedScore:number;
  gain:number;
  bottleneckAttributes:string[];
  missingAttributes:string[];
  skillSupport:number;
  skillSupportSkills:string[];
  skillSupportCount:number;
  evidenceCoverage:number;
  primaryEvidenceCoverage:number;
  decisionConfidence:number;
};

export type GameplayImpactImmutableContextR458 = {
  dominantFoot:string|null;
  weakFootFrequency:string|null;
  weakFootAccuracy:string|null;
  form:string|null;
  injuryResistance:string|null;
  height:number|null;
  weight:number|null;
  physicalEvidenceCount:number;
  physicalSignals:string[];
  numericalPolicy:'NO_UNVERIFIED_TRAIT_IMPUTATION';
};

export type GameplayImpactR458 = {
  version:typeof GAMEPLAY_IMPACT_R458_VERSION;
  model:'FUNCTION_DEMAND_BOTTLENECK_HARMONIC';
  usageFunction:string;
  tacticalStyle:string;
  formation:string;
  functionDemandActive:true;
  bottleneckAware:true;
  missingAttributesNeutral:true;
  skillActionSpecific:true;
  engineRevision:'R459';
  skillSynergyAware:true;
  evidenceConfidenceAware:true;
  decisionConfidence:number;
  observedAttributeCoverage:number;
  criticalMissingAttributes:string[];
  immutableContext:GameplayImpactImmutableContextR458;
  actions:GameplayImpactActionR458[];
  notes:string[];
};

const norm=(value:unknown)=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
const clamp01=(value:number)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));

const FUNCTION_ACTION_DEMAND_R458:Record<string,Partial<Record<string,number>>>={
  'artilheiro':{attack_space:1,finish_box:1,turn_finish:.58,long_finish:.36,press_recover:.18},
  'homem de area':{finish_box:1,aerial_finish:.96,hold_up:.82,turn_finish:.42,attack_space:.28},
  'pivo':{hold_up:1,short_creation:.82,aerial_finish:.78,finish_box:.55,through_creation:.42},
  'atacante pivo':{hold_up:.94,short_creation:1,through_creation:.78,finish_box:.5,close_control:.56},
  'puxa marcacao':{attack_space:.96,short_creation:.78,close_control:.6,finish_box:.58,carry:.45},
  'infiltracao':{attack_space:1,finish_box:.86,carry:.74,close_control:.62,long_finish:.55,press_recover:.34},
  'armador criativo':{short_creation:1,through_creation:1,close_control:.9,carry:.66,long_finish:.34,set_piece:.38},
  'classico 10':{short_creation:1,through_creation:.96,close_control:.92,turn_finish:.62,long_finish:.55,set_piece:.45},
  'meia versatil':{press_recover:1,cover_space:.86,short_creation:.8,carry:.72,intercept:.7,defensive_duel:.52},
  'orquestrador':{short_creation:1,through_creation:.98,build_out:.95,close_control:.78,cover_space:.42,intercept:.36,set_piece:.35},
  '1 volante':{intercept:1,cover_space:1,build_out:.9,defensive_duel:.82,short_creation:.58,aerial_defend:.48},
  'destruidor':{defensive_duel:1,press_recover:.92,intercept:.9,aerial_defend:.7,cover_space:.62},
  'defensor criativo':{build_out:1,intercept:.86,cover_space:.84,aerial_defend:.68,defensive_duel:.55,short_creation:.42},
  'atacante surpresa':{attack_space:.9,finish_box:.8,aerial_finish:.75,carry:.62,press_recover:.45},
  'lateral ofensivo':{cross_support:1,carry:.82,attack_space:.68,press_recover:.62,cover_space:.5},
  'lateral defensivo':{cover_space:1,intercept:.98,defensive_duel:.86,build_out:.7,aerial_defend:.58},
  'lateral atacante':{attack_space:.9,carry:.86,cross_support:.84,long_finish:.58,press_recover:.42},
  'lateral movel':{carry:1,close_control:.8,cross_support:.78,attack_space:.72,press_recover:.58},
  'ala produtivo':{carry:.96,attack_space:.9,cross_support:.82,close_control:.72,press_recover:.46},
  'perito em cruzamento':{cross_support:1,through_creation:.7,carry:.5,press_recover:.38,set_piece:.52},
  'high line gk':{gk_position:1,gk_reflex:.86,build_out:.64,gk_secure:.55},
  'goleiro ofensivo':{gk_position:.94,gk_reflex:.8,build_out:.62,gk_secure:.58},
  'goleiro defensivo':{gk_secure:1,gk_position:.94,gk_reflex:.9},
  'sweeper gk':{gk_position:1,gk_reflex:.84,build_out:.7,gk_secure:.55}
};

const TEAM_STYLE_ACTION_DEMAND_R458:Record<string,Partial<Record<string,number>>>={
  'posse de bola':{short_creation:1,build_out:.92,close_control:.86,through_creation:.72,carry:.58,press_recover:.48},
  'contra ataque':{attack_space:.9,through_creation:.78,hold_up:.68,finish_box:.66,cover_space:.5},
  'contra ataque rapido':{attack_space:1,through_creation:.86,carry:.78,finish_box:.74,press_recover:.65},
  'por fora':{cross_support:1,carry:.82,attack_space:.62,short_creation:.5},
  'passe longo':{hold_up:.9,aerial_finish:.84,attack_space:.78,through_creation:.62,aerial_defend:.46},
  'sobreposicao':{cross_support:.94,carry:.82,attack_space:.72,press_recover:.56}
};

const ACTION_SKILL_SUPPORT_R458:Record<string,Record<string,number>>={
  attack_space:{'Drible explosivo':.48,'Impulso ofensivo':.64,'Sombra veloz':.68,'Super substituto':.28},
  finish_box:{'Chute de primeira':.9,'Finalização acrobática':.58,'Finalização fenomenal':.78,'Cabeçada':.28,'Garra':.16},
  turn_finish:{'Controle com a sola':.72,'Toque duplo':.62,'Giro 360°':.58,'Chute de primeira':.55,'Finalização fenomenal':.46},
  long_finish:{'Precisão à distância':.92,'Efeito de longe':.9,'Curva descendente':.78,'Chute com o peito do pé':.54,'Folha seca':.48},
  close_control:{'Controle com a sola':.94,'Toque duplo':.78,'Pés magnéticos':.82,'Drible de impulso':.72,'Giro 360°':.48},
  carry:{'Toque duplo':.72,'Drible explosivo':.9,'Drible de impulso':.84,'Pés magnéticos':.72,'Elástico':.42},
  short_creation:{'Passe de primeira':1,'Passe na medida':.62,'Toque de calcanhar':.54,'Passe visionário':.78,'Passador nato':.82},
  through_creation:{'Passe em profundidade':1,'Passe na medida':.84,'Passe visionário':.9,'Passador nato':.88,'Passe aéreo baixo':.48},
  hold_up:{'Controle com a sola':.72,'Passe de primeira':.58,'Espírito guerreiro':.46,'Garra':.5,'Superioridade aérea':.36},
  aerial_finish:{'Cabeçada':1,'Superioridade aérea':.96,'Fortaleza aérea':.94,'Cabeçada fulminante':.92,'Finalização acrobática':.5},
  aerial_defend:{'Superioridade aérea':1,'Fortaleza aérea':.96,'Afastamento acrobático':.62,'Bloqueador':.38,'Fortaleza':.46},
  press_recover:{'Volta para marcar':1,'Espírito guerreiro':.72,'Garra':.72,'Marcação individual':.46,'Interceptação':.42},
  intercept:{'Interceptação':1,'Bloqueador':.66,'Marcação individual':.58,'Esticada de Perna':.72,'Fortaleza':.36},
  defensive_duel:{'Marcação individual':.9,'Carrinho':.76,'Bloqueador':.68,'Fortaleza':.7,'Esticada de Perna':.64,'Espírito guerreiro':.48},
  cover_space:{'Marcação individual':.74,'Interceptação':.84,'Volta para marcar':.62,'Fortaleza':.46,'Esticada de Perna':.52},
  build_out:{'Passe de primeira':.92,'Passe em profundidade':.7,'Passe na medida':.78,'Controle com a sola':.56,'Passador nato':.82},
  cross_support:{'Cruzamento preciso':1,'Passe na medida':.72,'Curva para fora':.7,'Passe aéreo baixo':.58},
  set_piece:{'Curva descendente':.78,'Folha seca':.66,'Curva para fora':.58,'Chute com o peito do pé':.42},
  gk_position:{'Comandante da defesa (GO)':.72,'Rugido do goleiro':.62},
  gk_reflex:{'Pegador de pênalti':.5,'Rugido do goleiro':.54},
  gk_secure:{'Pegador de pênalti':.38,'Comandante da defesa (GO)':.52}
};

export function functionActionDemandR458(functionLabel:string|undefined|null,actionId:string){
  const key=norm(functionLabel);
  return clamp01(Number(FUNCTION_ACTION_DEMAND_R458[key]?.[actionId]??0));
}

export function teamStyleActionDemandR458(style:string|undefined|null,actionId:string){
  const key=norm(style);
  return clamp01(Number(TEAM_STYLE_ACTION_DEMAND_R458[key]?.[actionId]??0));
}

export function skillActionSupportDetailR459(skills:Array<string|null|undefined>,actionId:string){
  const actionMap=ACTION_SKILL_SUPPORT_R458[actionId]??{};
  const unique=new Map<string,{name:string;weight:number}>();
  for(const raw of skills){
    const canonical=canonicalSkillName(raw)??String(raw??'').trim();
    if(!canonical) continue;
    const weight=clamp01(Number(actionMap[canonical]??0));
    if(weight<=0) continue;
    const key=norm(canonical);
    const current=unique.get(key);
    if(!current||weight>current.weight) unique.set(key,{name:canonical,weight});
  }
  const support=[...unique.values()].sort((a,b)=>b.weight-a.weight||a.name.localeCompare(b.name,'pt-BR'));
  // R459: várias habilidades complementares contribuem com retorno decrescente.
  // A fórmula é apenas um score interno de cobertura funcional, não um bônus oficial de atributo.
  let uncovered=1;
  for(const item of support) uncovered*=1-item.weight;
  return {
    score:clamp01(1-uncovered),
    supportingSkills:support.map(item=>item.name),
    supportCount:support.length
  };
}

export function skillActionSupportR458(skills:Array<string|null|undefined>,actionId:string){
  return skillActionSupportDetailR459(skills,actionId).score;
}
