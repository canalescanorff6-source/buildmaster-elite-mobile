import type { AnalysisResult, ParsedCard } from './analyzerDomain';
import type { ManagerRecord } from './managers';
import { projectManagerAttributesR560 } from './managerLinkEngineR560';
import { deriveProjectedPlayerStateR504, verifiedTrainingBaseAttributes } from '../modules/analysis/projectedPlayerStateR504';

export type SlotEvidenceStatusR561 = 'CONFIRMADO' | 'REGISTRADO' | 'PENDENTE' | 'LIVRE_CONFIRMADA' | 'SEM_VAGA';
export type DisplaySlotR561 = { label: string; value: string | null; status: SlotEvidenceStatusR561; source: string | null };
const named = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0;
// OCR and a catalog prove recognition, not ownership or actual free slots.
const verified = (x: unknown) => x === 'MANUAL';

/**
 * Do not equate an OCR result or legacy array with verified possession.
 * Recommended skills and boosters are never read as owned slots.
 */
export function buildCardSlotsViewR561(card: ParsedCard) {
  const legacy = (card.additionalSkills ?? []).filter(named);
  const skills: DisplaySlotR561[] = ([1,2,3,4,5] as const).map(index => {
    const explicit = card.additionalSkillSlotsR560?.find(slot => slot.slot === index);
    const value = named(explicit?.skill) ? explicit!.skill!.trim() : null;
    const source = verified(explicit?.source) ? explicit!.source! : null;
    if (explicit) return {label:'Habilidade '+index,value,
      status:value?(source?'CONFIRMADO':'REGISTRADO'):source?'LIVRE_CONFIRMADA':'PENDENTE',source};
    return {label:'Habilidade '+index,value:legacy[index-1]??null,
      status:legacy[index-1]?'REGISTRADO':'PENDENTE',source:null};
  });
  const primary = card.boosterSlotsR560?.primary?.name;
  const secondary = card.boosterSlotsR560?.secondary?.name;
  const legacyBoosters = (card.impetos ?? []).filter(item => named(item.name) && item.active !== false);
  const evidence = verified(card.boosterSlotsR560?.source) ? card.boosterSlotsR560!.source! : null;
  const occupied = (name:string|null|undefined):SlotEvidenceStatusR561 =>
    name ? evidence?'CONFIRMADO':'REGISTRADO':'PENDENTE';
  const first=primary??legacyBoosters[0]?.name??null;
  const second=secondary??legacyBoosters[1]?.name??null;
  const boosters: DisplaySlotR561[] = [
    {label:'Ímpeto principal',value:first,status:occupied(first),source:evidence},
    {label:'Booster Crafting',value:second,status:second?occupied(second):
      evidence&&card.boosterSlotsR560?.secondaryStatus==='DISPONIVEL'?'LIVRE_CONFIRMADA':
      evidence&&card.boosterSlotsR560?.secondaryStatus==='SEM_VAGA'?'SEM_VAGA':'PENDENTE',source:evidence}
  ];
  const all=[...skills,...boosters];
  return {skills,boosters,
    confirmed:all.filter(x=>['CONFIRMADO','LIVRE_CONFIRMADA','SEM_VAGA'].includes(x.status)).length,
    recorded:all.filter(x=>x.status==='REGISTRADO').length,
    pending:all.filter(x=>x.status==='PENDENTE').length};
}

/** An independently verified training baseline is required before a manager projection. */
export function buildManagerAttributeViewR561(result: AnalysisResult, manager: ManagerRecord|null|undefined) {
  if(!manager?.attributeBoostsR560)return null;
  const base = result.parsed.trainingBase?.sources?.length
    ? verifiedTrainingBaseAttributes(result.parsed) : null;
  const projected = base ? deriveProjectedPlayerStateR504(result.parsed,result.training).finalAttributes : null;
  const outcome = projectManagerAttributesR560(projected??{},manager,projected?'BASE_SEM_BONUS_TECNICO':'INDETERMINADO');
  const rows=(['tightPossession','balance'] as const).filter(key=>typeof manager.attributeBoostsR560?.[key]==='number')
    .map(key=>({key,bonus:manager.attributeBoostsR560![key]!,base:projected?.[key]??null,
      projected:outcome.status==='APLICADO' ? outcome.attributes[key]??null:null,
      status:outcome.status==='APLICADO'&&typeof projected?.[key]==='number'?'APLICADO' as const:'PENDENTE' as const}));
  return {managerName:manager.name,rows,status:rows.length&&rows.every(x=>x.status==='APLICADO')?'APLICADO' as const:'PENDENTE' as const,
    note:outcome.status==='APLICADO'?'Projeção somente visual a partir de base independente; não é atributo observado.':'Origem pré-técnico pendente; bônus não somado ao print.'};
}
