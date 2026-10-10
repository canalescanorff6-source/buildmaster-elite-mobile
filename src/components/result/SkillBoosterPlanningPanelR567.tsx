'use client';

import { useMemo, useState } from 'react';
import type { AnalysisResult } from '@/lib/analyzer';
import { planSkillBoosterIntelligenceR567 } from '@/lib/skillBoosterIntelligenceR567';

function count(value:string): number|null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed=Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function SkillBoosterPlanningPanelR567({result}:{result:AnalysisResult}) {
  // Verificação manual temporária. Jamais grava slots na carta salva.
  const [slotNames,setSlotNames]=useState<string[]>(()=>Array.from({length:5},(_,i)=>
    result.parsed.additionalSkillSlotsR560?.find(x=>x.slot===i+1)?.skill ??
    result.parsed.additionalSkills?.[i] ?? ''));
  const [slotReviewed,setSlotReviewed]=useState<boolean[]>([false,false,false,false,false]);
  const [primaryName,setPrimaryName]=useState(result.parsed.boosterSlotsR560?.primary?.name ??
    result.parsed.impetos?.[0]?.name ?? '');
  const [secondaryName,setSecondaryName]=useState(result.parsed.boosterSlotsR560?.secondary?.name ??
    result.parsed.impetos?.[1]?.name ?? '');
  const [boosterStatus,setBoosterStatus]=useState<'NAO_CONFIRMADO'|'DISPONIVEL'|'OCUPADO'|'SEM_VAGA'>('NAO_CONFIRMADO');
  const [boosterReviewed,setBoosterReviewed]=useState(false);
  const [skills,setSkills]=useState('');
  const [skillCost,setSkillCost]=useState('');
  const [boosters,setBoosters]=useState('');
  const [boosterCost,setBoosterCost]=useState('');
  const [inventoryConfirmed,setInventoryConfirmed]=useState(false);
  const [costConfirmed,setCostConfirmed]=useState(false);
  const [skillCostConfirmed,setSkillCostConfirmed]=useState(false);
  const plan=useMemo(()=>{
    const confirmedSkills=slotReviewed.every(Boolean);
    const cardForSimulation={
      ...result.parsed,
      additionalSkills:confirmedSkills?slotNames.map(x=>x.trim()).filter(Boolean):result.parsed.additionalSkills,
      additionalSkillSlotsR560:slotNames.map((name,index)=>({
        slot:(index+1) as 1|2|3|4|5,
        skill:name.trim()||null,
        source:slotReviewed[index]?'MANUAL' as const:undefined,
      })),
      boosterSlotsR560:boosterReviewed?{
        primary:primaryName.trim()?{name:primaryName.trim(),active:true}:null,
        secondary:boosterStatus==='OCUPADO'&&secondaryName.trim()?{name:secondaryName.trim(),active:true}:null,
        secondaryStatus:boosterStatus,source:'MANUAL' as const,
      }:result.parsed.boosterSlotsR560,
      impetos:boosterReviewed
        ?[primaryName,boosterStatus==='OCUPADO'?secondaryName:''].map(x=>x.trim()).filter(Boolean).map(name=>({name,active:true}))
        :result.parsed.impetos,
    };
    return planSkillBoosterIntelligenceR567({
    card:cardForSimulation,
    recommendedSkills:result.skillRecommendations ?? [],
    recommendedImpetos:result.recommendedImpetos ?? [],
    skillTokens:count(skills),
    skillCostTokens:count(skillCost),
    skillCostConfirmed,
    boosterTokens:count(boosters),
    boosterCostTokens:count(boosterCost),
    inventoryConfirmed,
    costConfirmed
    });
  },[result,slotNames,slotReviewed,primaryName,secondaryName,boosterStatus,boosterReviewed,
    skills,skillCost,skillCostConfirmed,boosters,boosterCost,inventoryConfirmed,costConfirmed]);

  return (
    <details className="luxury-panel" style={{marginBlock:12,padding:14}}>
      <summary style={{cursor:'pointer',fontWeight:700}}>R567 — Inteligência de habilidades e ímpetos</summary>
      <p className="panel-note">
        Planejador local, sem gastar tokens. Confirme os recursos reais; as vagas devem constar
        como livres e conferidas manualmente no cadastro da carta.
      </p>
      <details style={{marginBottom:12}}>
        <summary style={{cursor:'pointer',fontWeight:600}}>Conferir vagas no jogo (simulação, sem salvar)</summary>
        <div className="v27-pairing-list">
          {slotNames.map((name,i)=>(
            <label key={i}>Habilidade adicional — vaga {i+1}
              <input aria-label={`Habilidade na vaga ${i+1}`} type="text" value={name}
                placeholder="Vaga vazia ou habilidade"
                onChange={event=>{
                  setSlotNames(current=>current.map((value,k)=>k===i?event.target.value:value));
                  setSlotReviewed(current=>current.map((value,k)=>k===i?false:value));
                }}/>
              <span><input type="checkbox" checked={!!slotReviewed[i]}
                onChange={event=>setSlotReviewed(current=>current.map((value,k)=>k===i?event.target.checked:value))}/>
                Vaga conferida manualmente</span>
            </label>
          ))}
          <label>Ímpeto principal
            <input aria-label="Ímpeto principal" type="text" value={primaryName}
              onChange={event=>{setPrimaryName(event.target.value);setBoosterReviewed(false);}}/>
          </label>
          <label>Situação da segunda vaga de ímpeto
            <select value={boosterStatus} onChange={event=>{
              setBoosterStatus(event.target.value as typeof boosterStatus);
              setBoosterReviewed(false);
            }}>
              <option value="NAO_CONFIRMADO">Não confirmada</option>
              <option value="DISPONIVEL">Livre</option>
              <option value="OCUPADO">Ocupada</option>
              <option value="SEM_VAGA">Sem vaga</option>
            </select>
          </label>
          {boosterStatus==='OCUPADO'&&<label>Ímpeto da segunda vaga
            <input aria-label="Ímpeto secundário" type="text" value={secondaryName}
              onChange={event=>{setSecondaryName(event.target.value);setBoosterReviewed(false);}}/>
          </label>}
          <label><input type="checkbox" checked={boosterReviewed}
            onChange={event=>setBoosterReviewed(event.target.checked)}/>
            Conferi os ímpetos e a segunda vaga no jogo
          </label>
        </div>
        <small>Conferência temporária para esta simulação. Não altera nem salva a carta.</small>
      </details>
      <div className="v27-pairing-list">
        <label>Tokens de habilidade disponíveis
          <input aria-label="Quantidade de tokens de habilidade" inputMode="numeric" type="number" min={0}
            value={skills} onChange={event=>{setSkills(event.target.value);setInventoryConfirmed(false);}}/>
        </label>
        <label>Tokens necessários por habilidade selecionada
          <input aria-label="Custo da habilidade confirmado no jogo" inputMode="numeric" type="number" min={1}
            value={skillCost} onChange={event=>{setSkillCost(event.target.value);setSkillCostConfirmed(false);}}/>
        </label>
        <label>Tokens de ímpeto disponíveis
          <input aria-label="Quantidade de tokens de ímpeto" inputMode="numeric" type="number" min={0}
            value={boosters} onChange={event=>{setBoosters(event.target.value);setInventoryConfirmed(false);}}/>
        </label>
        <label>Tokens necessários para criar o ímpeto desejado
          <input aria-label="Custo de crafting confirmado no jogo" inputMode="numeric" type="number" min={1}
            value={boosterCost} onChange={event=>{setBoosterCost(event.target.value);setCostConfirmed(false);}}/>
        </label>
        <label><input type="checkbox" checked={inventoryConfirmed}
          onChange={event=>setInventoryConfirmed(event.target.checked)}/>
          Conferi as duas quantidades de tokens no jogo.
        </label>
        <label><input type="checkbox" checked={skillCostConfirmed}
          onChange={event=>setSkillCostConfirmed(event.target.checked)}/>
          Conferi o custo da seleção de habilidade no jogo.
        </label>
        <label><input type="checkbox" checked={costConfirmed}
          onChange={event=>setCostConfirmed(event.target.checked)}/>
          Conferi o custo desta seleção no jogo.
        </label>
        <span>Vagas adicionais comprovadamente livres: {plan.skillSlotsConfirmedFree}/5</span>
        <span>Booster Crafting: {plan.craftingSlotConfirmedFree?'LIVRE CONFIRMADO':'PENDENTE'}</span>
      </div>
      <div className="v27-pairing-list">
        {plan.skills.slice(0,10).map(action=> (
          <span key={'skill:'+action.name}>
            Habilidade — {action.name}: {action.decision}
            {action.slot?' • vaga '+action.slot:''}. {action.reason}
          </span>
        ))}
        {plan.boosters.slice(0,8).map(action=>(
          <span key={'booster:'+action.name}>
            Ímpeto — {action.name}: {action.decision}. {action.reason}
          </span>
        ))}
        {!plan.skills.length&&!plan.boosters.length&&
          <span>O motor não forneceu recomendações desta carta; não serão inventadas.</span>}
        {plan.alerts.map(alert=><span key={alert}>{alert}</span>)}
      </div>
      <small>RECOMENDAR significa somente candidato de planejamento, nunca efeito ou meta comprovado.
        As habilidades nativas e os ímpetos existentes são preservados. A decisão final é sua.</small>
    </details>
  );
}
