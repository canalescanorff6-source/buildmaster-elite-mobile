import type { ParsedCard, SkillRecommendation, ImpetoRecommendation } from './analyzerDomain';
import { canonicalSkillName, isOfficialAdditionalSkillIdentity, normalizeSkillIdentity } from './officialSkillIdentity';
import { isRecognizableImpetoName } from './officialImpetoCatalog';

export const SKILL_BOOSTER_INTELLIGENCE_R567_VERSION = 'r567-source-verified-planning-1' as const;
export type R567Decision = 'RECOMENDAR' | 'PENDENTE' | 'JA_POSSUI' | 'SEM_VAGA' | 'NAO_RECONHECIDO' | 'EVITAR';
export type R567Action = {
  name: string;
  kind: 'HABILIDADE' | 'IMPETO';
  decision: R567Decision;
  slot: string | null;
  reason: string;
};
export type R567Plan = {
  version: typeof SKILL_BOOSTER_INTELLIGENCE_R567_VERSION;
  mode: 'CONSULTIVO_SEM_GASTO';
  skillSlotsConfirmedFree: number;
  craftingSlotConfirmedFree: boolean;
  skillTokensConfirmed: number | null;
  boosterTokensConfirmed: number | null;
  skills: R567Action[];
  boosters: R567Action[];
  alerts: string[];
  canAutoApply: false;
};

type CardR567 = Pick<ParsedCard, 'nativeSkills' | 'specialSkills' | 'additionalSkills' | 'impetos'
  | 'additionalSkillSlotsR560' | 'boosterSlotsR560'>;
export type R567Input = {
  card: CardR567;
  recommendedSkills: readonly SkillRecommendation[];
  recommendedImpetos: readonly ImpetoRecommendation[];
  /** Counts are user's own confirmed inventory values; null means unknown. */
  skillTokens: number | null;
  boosterTokens: number | null;
  /** Verified tokens required for one selected craft, not assumed from icon count. */
  boosterCostTokens: number | null;
  inventoryConfirmed: boolean;
  costConfirmed: boolean;
};

function skillKey(value: string): string {
  return normalizeSkillIdentity(canonicalSkillName(value) || value);
}
function impetoKey(value: string): string {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function tokens(value: number|null, confirmed: boolean): number|null {
  return confirmed && value !== null && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

/**
 * Produces evidence-scoped *proposals*, never a possession claim, purchase,
 * modifier to the vault or an automatic mutation of skills/boosters.
 */
export function planSkillBoosterIntelligenceR567(input:R567Input):R567Plan {
  const {card}=input;
  const alerts:string[]=[];
  const skillTokensConfirmed=tokens(input.skillTokens,input.inventoryConfirmed);
  const boosterTokensConfirmed=tokens(input.boosterTokens,input.inventoryConfirmed);
  const boosterCostConfirmed=tokens(input.boosterCostTokens,input.costConfirmed);
  if (skillTokensConfirmed===null || boosterTokensConfirmed===null)
    alerts.push('Quantidade de tokens não confirmada. Nenhum gasto pode ser autorizado.');
  const slots=card.additionalSkillSlotsR560??[];
  const uniqueSlots = new Set(slots.map(x=>x.slot));
  const allFive=slots.length===5 && uniqueSlots.size===5 &&
    [1,2,3,4,5].every(i=>uniqueSlots.has(i as 1|2|3|4|5));
  const manualSlots=allFive && slots.every(s=>s.source==='MANUAL');
  const tracked = slots.map(s=>s.skill).filter((x):x is string=>!!x?.trim());
  const legacy = (card.additionalSkills??[]).filter(Boolean);
  const trackedKeys=new Set(tracked.map(skillKey));
  const legacyConflict=legacy.some(s=>!trackedKeys.has(skillKey(s)));
  const trustedSlots=manualSlots && !legacyConflict;
  if(!trustedSlots) alerts.push('As cinco vagas adicionais não foram verificadas individualmente, ou divergem da lista antiga.');
  const freeSlots=trustedSlots?slots.filter(x=>!x.skill?.trim()).sort((a,b)=>a.slot-b.slot):[];
  const ownedSkills=new Set([
    ...(card.nativeSkills??[]), ...(card.specialSkills??[]),
    ...legacy, ...tracked,
  ].map(skillKey).filter(Boolean));
  const seenSkills=new Set<string>();
  let assigned=0, usedSkillTokens=0;
  const skills:R567Action[]=[];
  for(const suggestion of input.recommendedSkills) {
    const label=String(suggestion.name??'').trim();
    if(!label)continue;
    const key=skillKey(label);
    if(seenSkills.has(key))continue;
    seenSkills.add(key);
    let decision:R567Decision='PENDENTE',slot:string|null=null,reason='';
    if(ownedSkills.has(key)){decision='JA_POSSUI';reason='Habilidade já registrada no inventário; não recomendar duplicata.';}
    else if(suggestion.tier==='evitar'){decision='EVITAR';reason='O motor existente desaconselha esta habilidade.';}
    else if(!isOfficialAdditionalSkillIdentity(label)){decision='NAO_RECONHECIDO';reason='Nome não confirmado no catálogo atual.';}
    else if(!trustedSlots){reason='Conferir os cinco slots adicionais e as habilidades já presentes.';}
    else if(!freeSlots.length || assigned>=freeSlots.length){decision='SEM_VAGA';reason='Nenhuma vaga adicional comprovadamente livre.';}
    else if(skillTokensConfirmed===null){reason='Confirme a quantidade real de tokens de habilidade.';}
    else if(usedSkillTokens>=skillTokensConfirmed){decision='PENDENTE';reason='Tokens disponíveis insuficientes; planejar aquisição, sem gasto automático.';}
    else{
      decision='RECOMENDAR';slot=String(freeSlots[assigned].slot);assigned++;usedSkillTokens++;
      reason='Candidato sugerido para vaga livre confirmada; aceite é manual. '+String(suggestion.reason??'').slice(0,220);
    }
    skills.push({name:label,kind:'HABILIDADE',decision,slot,reason});
  }

  const boosterSlots=card.boosterSlotsR560;
  const occupiedBoosterNames=[
    ...(card.impetos??[]).map(x=>x.name),
    boosterSlots?.primary?.name,boosterSlots?.secondary?.name,
  ].filter((x):x is string=>typeof x==='string'&&!!x.trim());
  const ownedBoosters=new Set(occupiedBoosterNames.map(impetoKey));
  const craftingFree=boosterSlots?.source==='MANUAL'
    && boosterSlots.secondaryStatus==='DISPONIVEL'
    && !boosterSlots.secondary
    && !!boosterSlots.primary?.name
    && ownedBoosters.size===1;
  if(!craftingFree)alerts.push('Vaga de Booster Crafting não comprovadamente livre; sem sugestão de gasto.');
  const seenBoosters=new Set<string>();
  let usedBoosters=0;
  const boosters:R567Action[]=[];
  for(const suggestion of input.recommendedImpetos){
    const label=String(suggestion.name??'').trim();
    if(!label)continue;
    const key=impetoKey(label);
    if(seenBoosters.has(key))continue;
    seenBoosters.add(key);
    let decision:R567Decision='PENDENTE', slot:string|null=null, reason='';
    if(ownedBoosters.has(key)){decision='JA_POSSUI';reason='Ímpeto já registrado. Não substituir nem duplicar automaticamente.';}
    else if(suggestion.tier==='evitar'){decision='EVITAR';reason='Candidato desaconselhado pelo motor de análise.';}
    else if(!isRecognizableImpetoName(label)){decision='NAO_RECONHECIDO';reason='Ímpeto não identificado no catálogo; conferir no jogo.';}
    else if(!craftingFree || usedBoosters>0){decision='SEM_VAGA';reason='Vaga de crafting não comprovada ou já reservada por outra proposta.';}
    else if(boosterTokensConfirmed===null || boosterCostConfirmed===null || boosterCostConfirmed===0 || boosterTokensConfirmed < boosterCostConfirmed){reason='Confirmar tokens disponíveis e custo real da seleção; recursos insuficientes ou sem prova.';}
    else {
      decision='RECOMENDAR';slot='CRAFTING';usedBoosters++;
      reason='Proposta de ímpeto para vaga confirmada; custo exato e efeito devem ser conferidos no jogo. '+String(suggestion.reason??'').slice(0,220);
    }
    boosters.push({name:label,kind:'IMPETO',decision,slot,reason});
  }
  return {
    version:SKILL_BOOSTER_INTELLIGENCE_R567_VERSION, mode:'CONSULTIVO_SEM_GASTO',
    skillSlotsConfirmedFree:freeSlots.length,craftingSlotConfirmedFree:Boolean(craftingFree),
    skillTokensConfirmed,boosterTokensConfirmed,skills,boosters,alerts,canAutoApply:false
  };
}
