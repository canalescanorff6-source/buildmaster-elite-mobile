import type { AnalysisResult, PositionCode, TacticalStyle } from './analyzerDomain';
import {
  buildFormationLineup, scorePlayerForFormationSlot,
  type FormationBlueprint, type FormationSlot, type FormationSlotFit,
} from './formationRoleEngine';
import { cardIdentityFingerprintR126 } from './cardIdentityFingerprintR126';
import { readAccountStorage, writeAccountStorage } from './accountStorage';

export const MANUAL_TEAM_LAYOUT_KEY_R573 = 'buildmaster_my_team_manual_layouts_r573_v1';
export type ManualPointR573 = { x: number; y: number };
export type ManualTeamLayoutR573 = {
  version: 1;
  formation: string;
  /** Absent = automatic, null = intentionally empty, string = edition fingerprint. */
  assignments: Record<string, string | null>;
  positions: Record<string, ManualPointR573>;
  positionOverrides: Record<string, PositionCode>;
};
export type ManualTeamLayoutsR573 = Record<string, ManualTeamLayoutR573>;

const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
export const limitPitchCoordinateR573 = (x: number,y: number): ManualPointR573 => ({
  x: Math.round(Math.max(7,Math.min(93,x))*10)/10,
  y: Math.round(Math.max(8,Math.min(92,y))*10)/10
});
export function emptyManualLayoutR573(blueprint:FormationBlueprint):ManualTeamLayoutR573 {
  return {version:1,formation:blueprint.id,assignments:{},positions:{},positionOverrides:{}};
}
const owns = (v:object,k:string) => Object.prototype.hasOwnProperty.call(v,k);
export function sanitizeManualLayoutR573(blueprint:FormationBlueprint, value:unknown):ManualTeamLayoutR573 {
  const result=emptyManualLayoutR573(blueprint);
  if (!value || typeof value!=='object' || Array.isArray(value))return result;
  const draft=value as Partial<ManualTeamLayoutR573>;
  if(draft.version!==1 || draft.formation!==blueprint.id)return result;
  for(const slot of blueprint.slots){
    const id=slot.id;
    if(draft.assignments && typeof draft.assignments==='object' && owns(draft.assignments,id)){
      const v=draft.assignments[id];
      if(v===null || typeof v==='string'&&v.length>0&&v.length<=160)result.assignments[id]=v;
    }
    const point=draft.positions?.[id];
    if(point && finite(point.x) && finite(point.y))result.positions[id]=limitPitchCoordinateR573(point.x,point.y);
    const role=draft.positionOverrides?.[id];
    if(role && (role===slot.position || slot.alternatives.includes(role)))result.positionOverrides[id]=role;
  }
  // Reject collisions even in malicious or corrupted saved data.
  const seen=new Set<string>();
  for(const slot of blueprint.slots){
    const assigned=result.assignments[slot.id];
    if(!assigned)continue;
    if(seen.has(assigned))delete result.assignments[slot.id];
    else seen.add(assigned);
  }
  return result;
}
export function readMyTeamLayoutsR573():ManualTeamLayoutsR573 {
  try{
    const raw=readAccountStorage(MANUAL_TEAM_LAYOUT_KEY_R573,{migrateLegacy:false});
    if(!raw)return {};
    const data=JSON.parse(raw) as unknown;
    if(!data || typeof data!=='object'||Array.isArray(data))return {};
    const layouts:ManualTeamLayoutsR573={};
    const original=data as Record<string,unknown>;
    // The caller passes only a catalog-validated blueprint for active formation.
    for(const key of Object.keys(original).slice(0,35)){
      const layout=original[key];
      if(layout&&typeof layout==='object'&&!Array.isArray(layout) &&
        (layout as Partial<ManualTeamLayoutR573>).formation===key&&
        (layout as Partial<ManualTeamLayoutR573>).version===1)
        layouts[key]=layout as ManualTeamLayoutR573;
    }
    return layouts;
  }catch{return {}}
}
export function persistMyTeamLayoutsR573(layouts:ManualTeamLayoutsR573):boolean{
  try{return writeAccountStorage(MANUAL_TEAM_LAYOUT_KEY_R573,JSON.stringify(layouts))}
  catch{return false}
}
const emptyFit = (slot:FormationSlot):FormationSlotFit => ({
  slot,player:null,score:0,roleFit:0,positionFit:0,
  reasons:['Vaga livre definida manualmente.'],warnings:[],
});
/**
 * Uses manual assignments and position alternatives in real diagnostics,
 * including bench, chemistry and Match Vision. Never edits card objects.
 * Missing fingerprint becomes auto-fill, never another edition by player name.
 */
export function buildManualFormationLineupR573(
  players:readonly AnalysisResult[],blueprint:FormationBlueprint,style:TacticalStyle,raw:ManualTeamLayoutR573|null|undefined
):FormationSlotFit[]{
  if(!raw)return buildFormationLineup([...players],blueprint,style);
  const layout=sanitizeManualLayoutR573(blueprint,raw);
  const manualAssignments=layout.assignments;
  const results=new Map<string,AnalysisResult>();
  for(const player of players){
    const id=cardIdentityFingerprintR126(player.parsed);
    if(!results.has(id))results.set(id,player);
  }
  const reserved=new Set(Object.values(manualAssignments).filter((s):s is string=>typeof s==='string'&&results.has(s)));
  const used=new Set<string>();
  const auto=buildFormationLineup([...players],blueprint,style);
  const placed:FormationSlotFit[]=[];
  const append=(fit:FormationSlotFit)=>{placed.push(fit);return fit};
  return blueprint.slots.map((sourceSlot,index)=>{
    const role=layout.positionOverrides[sourceSlot.id];
    const placement=layout.positions[sourceSlot.id];
    // Field coordinates remain presentation metadata; tactical role is changed only by
    // validated positionOverrides. Both are propagated to the complete team diagnosis.
    const adjustedSlot=placement?{...sourceSlot,x:placement.x,y:placement.y}:sourceSlot;
    const slot=role && (role===sourceSlot.position||sourceSlot.alternatives.includes(role))
      ?{...adjustedSlot,position:role,label:role===sourceSlot.position?sourceSlot.label:sourceSlot.label+' • '+role}:adjustedSlot;
    const hasPin=owns(manualAssignments,slot.id);
    const pin=manualAssignments[slot.id];
    if(hasPin && pin===null)return append(emptyFit(slot));
    const partners=placed.flatMap(f=>f.player?[f.player]:[]);
    const manual=typeof pin==='string'?results.get(pin):undefined;
    if(manual&&!used.has(pin!)){
      used.add(pin!);
      const fit=scorePlayerForFormationSlot(manual,slot,{formationId:blueprint.id,teamStyle:style,partnerResults:partners});
      return append({...fit,warnings:[...fit.warnings,...(fit.score<48?['Atribuição manual fora do encaixe recomendado; confira o efeito dentro do jogo.']:[])]});
    }
    // Locked player can't be duplicated by automatic selection.
    const autoPick=auto[index]?.player;
    const autoId=autoPick?cardIdentityFingerprintR126(autoPick.parsed):null;
    const candidates=autoPick&&autoId&&!used.has(autoId)&&!reserved.has(autoId)
      ?[autoPick]
      :[...results.entries()].filter(([id])=>!used.has(id)&&!reserved.has(id)).map(([,p])=>p);
    const ranked=candidates.map(player=>scorePlayerForFormationSlot(player,slot,{
      formationId:blueprint.id,teamStyle:style,partnerResults:partners,
    })).sort((a,b)=>b.score-a.score);
    const best=ranked[0];
    if(!best||best.score<48)return append(emptyFit(slot));
    used.add(cardIdentityFingerprintR126(best.player!.parsed));
    return append(best);
  });
}
/** New player assignment swaps with a previously occupied slot when necessary. */
export function assignManualStarterR573(
  blueprint:FormationBlueprint,raw:ManualTeamLayoutR573|null|undefined,
  lineup:readonly FormationSlotFit[],slotId:string,playerFingerprint:string|null
):ManualTeamLayoutR573 {
  const next=sanitizeManualLayoutR573(blueprint,raw??emptyManualLayoutR573(blueprint));
  if(!blueprint.slots.some(s=>s.id===slotId))return next;
  const current=lineup.find(x=>x.slot.id===slotId)?.player;
  const previousId=current?cardIdentityFingerprintR126(current.parsed):null;
  if(playerFingerprint){
    const from=lineup.find(x=>x.slot.id!==slotId&&x.player&&cardIdentityFingerprintR126(x.player.parsed)===playerFingerprint);
    if(from)next.assignments[from.slot.id]=previousId;
    // Never leave an older override pointing at the same edition.
    for(const [id,value] of Object.entries(next.assignments))
      if(id!==slotId&&(!from||id!==from.slot.id)&&value===playerFingerprint)delete next.assignments[id];
  }
  next.assignments[slotId]=playerFingerprint;
  return next;
}
