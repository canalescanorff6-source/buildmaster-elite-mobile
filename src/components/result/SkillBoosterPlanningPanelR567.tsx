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
  const [skills,setSkills]=useState('');
  const [boosters,setBoosters]=useState('');
  const [boosterCost,setBoosterCost]=useState('');
  const [inventoryConfirmed,setInventoryConfirmed]=useState(false);
  const [costConfirmed,setCostConfirmed]=useState(false);
  const plan=useMemo(()=>planSkillBoosterIntelligenceR567({
    card:result.parsed,
    recommendedSkills:result.skillRecommendations ?? [],
    recommendedImpetos:result.recommendedImpetos ?? [],
    skillTokens:count(skills),
    boosterTokens:count(boosters),
    boosterCostTokens:count(boosterCost),
    inventoryConfirmed,
    costConfirmed
  }),[result,skills,boosters,boosterCost,inventoryConfirmed,costConfirmed]);

  return (
    <details className="luxury-panel" style={{marginBlock:12,padding:14}}>
      <summary style={{cursor:'pointer',fontWeight:700}}>R567 — Inteligência de habilidades e ímpetos</summary>
      <p className="panel-note">
        Planejador local, sem gastar tokens. Confirme os recursos reais; as vagas devem constar
        como livres e conferidas manualmente no cadastro da carta.
      </p>
      <div className="v27-pairing-list">
        <label>Tokens de habilidade disponíveis
          <input aria-label="Quantidade de tokens de habilidade" inputMode="numeric" type="number" min={0}
            value={skills} onChange={event=>{setSkills(event.target.value);setInventoryConfirmed(false);}}/>
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
