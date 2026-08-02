import type { IntegratedPlayerRecord } from './central-stub';
export const META_COACH_STYLES = ['Posse de bola','Contra-ataque normal','Contra-ataque rápido'] as const;
export type MetaCoachStyle = typeof META_COACH_STYLES[number];
export const META_OBJECTIVES = ['jogar pelo centro','jogar sem pontas'] as const;
export type MetaObjective = string;
export const OFFICIAL_PLAYER_STYLES = ['Artilheiro','Primeiro volante','Lateral defensivo'] as const;
export type OfficialPlayerStyle = string;
export type MetaFormationMode = 'rapido'|'personalizado'|'inteligente';
export type MetaFormationExportFormat = 'vertical'|'square'|'story'|'whatsapp'|'field-only'|'complete';
export type MetaFormationSlot = {id:string;position:string;side:'esquerdo'|'centro'|'direito';label:string;x:number;y:number;recommendedStyles:OfficialPlayerStyle[];alternatives:OfficialPlayerStyle[]};
export type MetaTacticalArrow = {id:string;fromSlotId:string;toSlotId?:string;kind:string;label:string;enabled:boolean};
export type MetaFormationDefinition = {id:string;commercialName:string;structure:string;style:MetaCoachStyle;objectives:MetaObjective[];classification:string;difficulty:string;aggression:number;risk:string;scores:{attack:number;defense:number;creation:number;transition:number;control:number;compactness:number};slots:MetaFormationSlot[];arrows:MetaTacticalArrow[];strengths:string[];weaknesses:string[];startPlay:string[];accelerateWhen:string[];recycleWhen:string[];attackPlan:string[];defensePlan:string[];protectCenter:string[];exploreSpace:string[];avoid:string[];offensivePrinciples:string[];defensivePrinciples:string[];successKeys:string[];whyItWorks:string};
export type MetaFormationSlotAssignment={slotId:string;style:OfficialPlayerStyle;playerId?:string;playerName?:string;x?:number;y?:number};
export type MetaFormationProject={id:string;name:string;formationId:string;style:MetaCoachStyle;objective:MetaObjective;mode:MetaFormationMode;assignments:Record<string,MetaFormationSlotAssignment>;arrows:MetaTacticalArrow[];customTexts:Record<string,string>;appearance:{shirt:'clássica'|'moderna'|'minimalista';background:'marinho'|'grafite'|'campo';intensity:'suave'|'equilibrada'|'forte';showNotes:boolean;showInstructions:boolean;userName:string;teamName:string;logoDataUrl:string};createdAt:string;updatedAt:string};
export const META_FORMATION_CATALOG:MetaFormationDefinition[]=[];
export function createMetaFormationProject(_formation:MetaFormationDefinition,_objective:MetaObjective,_mode:MetaFormationMode):MetaFormationProject{throw new Error('stub')}
export function deleteMetaFormationProject(_id:string):MetaFormationProject[]{return []}
export function getMetaFormation(_id:string):MetaFormationDefinition{return META_FORMATION_CATALOG[0]}
export function metaFormationOutputSize(_format:MetaFormationExportFormat){return {width:1080,height:1350}}
export function readMetaFormationProjects():MetaFormationProject[]{return []}
export function recommendMetaFormations(_style:MetaCoachStyle,_objective:MetaObjective,_answers?:Record<string,unknown>):MetaFormationDefinition[]{return []}
export function renderMetaFormationSvg(_project:MetaFormationProject,_format:MetaFormationExportFormat):string{return '<svg/>'}
export function saveMetaFormationProject(project:MetaFormationProject):MetaFormationProject[]{return [project]}
export function scorePlayerForMetaSlot(_player:IntegratedPlayerRecord,_slot:MetaFormationSlot,_style:OfficialPlayerStyle){return {score:80,label:'compatível'}}
export function validateMetaFormation(_formation:MetaFormationDefinition,_assignments:Record<string,MetaFormationSlotAssignment>,_objective:MetaObjective){return {level:'balanced' as const,title:'',notes:[] as Array<{level:'positive'|'warning'|'critical';text:string}>}}
