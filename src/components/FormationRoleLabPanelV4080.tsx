'use client';

import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeftRight, CheckCircle2, Lock, Move, RotateCcw, Save, ShieldCheck, SlidersHorizontal, Sparkles, Users } from 'lucide-react';
import type { AnalysisResult, PositionCode, TacticalStyle } from '@/lib/analyzer';
import { FormationRoleLabPanel as LegacyFormationRoleLabPanel } from '@/components/FormationRoleLabPanel';
import { FORMATION_BLUEPRINTS, buildFormationLineup, getFormationBlueprint, type FormationBlueprint, type FormationSlot } from '@/lib/formationRoleEngine';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { createStableId } from '@/lib/stableId';
import {
  createFluidFormationPlanV600,
  deriveCompactDefenseV600,
  inferFormationNameV600,
  inferPositionV600,
  normalizeFluidSlotV600,
  readFluidFormationPlanV600,
  writeFluidFormationPlanV600,
  type FluidDefensivePresetV600,
  type FluidFormationPhaseV600,
  type FluidFormationPlanV600,
  type FluidTeamPlaystyleV600
} from '@/lib/fluidFormationV600';

const STORAGE_KEY = 'buildmaster_custom_formations_v31_10';
const LAST_EDITOR_KEY = 'buildmaster_free_formation_editor_v4080';

const POSITION_LABELS: Record<PositionCode, string> = {
  CF:'CA', SS:'SA', LWF:'PE', RWF:'PD', LMF:'ME', RMF:'MD', AMF:'MAT', CMF:'MLG', DMF:'VOL', CB:'ZAG', LB:'LE', RB:'LD', GK:'GOL'
};
const POSITION_OPTIONS: PositionCode[] = ['CF','SS','LWF','RWF','AMF','LMF','RMF','CMF','DMF','LB','CB','RB'];

type SavedCustomFormation = FormationBlueprint & { createdAt: string; updatedAt: string };
type LegacyDraftSnapshot = { baseId: string; formation: FormationBlueprint };

function cloneFormation(source: FormationBlueprint): FormationBlueprint {
  return {
    ...source,
    family: 'personalizada',
    slots: source.slots.map((slot) => ({
      ...slot,
      alternatives:[...slot.alternatives], primaryRoles:[...slot.primaryRoles], complementaryRoles:[...slot.complementaryRoles], keyTraits:[...slot.keyTraits]
    }))
  };
}

function readLegacySnapshot(): LegacyDraftSnapshot | null {
  try {
    const parsed = JSON.parse(readAccountStorage(LAST_EDITOR_KEY) || 'null') as LegacyDraftSnapshot | null;
    return parsed?.baseId && parsed.formation?.slots?.length ? parsed : null;
  } catch { return null; }
}

function initialBaseId(activeFormation: string): string {
  if (activeFormation !== 'AUTO' && FORMATION_BLUEPRINTS.some((item) => item.id === activeFormation)) return activeFormation;
  return FORMATION_BLUEPRINTS.some((item) => item.id === '4-3-3-2ss') ? '4-3-3-2ss' : FORMATION_BLUEPRINTS[0]?.id ?? '4-3-3';
}

function snappedCoordinates(position: PositionCode, currentX: number): { x: number; y: number } {
  const centralX = Math.max(24, Math.min(76, currentX));
  const map: Record<PositionCode, { x:number; y:number }> = {
    CF:{x:Math.max(34,Math.min(66,currentX)),y:14}, SS:{x:centralX,y:23}, LWF:{x:10,y:19}, RWF:{x:90,y:19},
    AMF:{x:centralX,y:37}, LMF:{x:12,y:49}, RMF:{x:88,y:49}, CMF:{x:centralX,y:51}, DMF:{x:centralX,y:61},
    LB:{x:10,y:73}, RB:{x:90,y:73}, CB:{x:Math.max(28,Math.min(72,currentX)),y:79}, GK:{x:50,y:93}
  };
  return map[position];
}

function persistCustomFormation(formation: FormationBlueprint): SavedCustomFormation {
  const now = new Date().toISOString();
  const saved: SavedCustomFormation = {
    ...cloneFormation(formation),
    id:createStableId('custom-formation-free'),
    name:inferFormationNameV600(formation.slots),
    description:`Formação de ataque livre criada no editor eFootball 2027 v6.0 a partir de ${formation.name}.`,
    createdAt:now, updatedAt:now
  };
  let current: SavedCustomFormation[] = [];
  try { const parsed=JSON.parse(readAccountStorage(STORAGE_KEY)||'[]'); current=Array.isArray(parsed)?parsed:[]; } catch { current=[]; }
  writeAccountStorage(STORAGE_KEY, JSON.stringify([saved,...current].slice(0,40)));
  return saved;
}

function averageFit(lineup: ReturnType<typeof buildFormationLineup>): number {
  const filled=lineup.filter((pick)=>pick.player);
  return filled.length ? Math.round(filled.reduce((sum,pick)=>sum+pick.score,0)/filled.length) : 0;
}

function initializeFluid(activeFormation: string): FluidFormationPlanV600 {
  const saved=readFluidFormationPlanV600();
  if (saved) return saved;
  const legacy=readLegacySnapshot();
  const baseId=legacy?.baseId && FORMATION_BLUEPRINTS.some((item)=>item.id===legacy.baseId) ? legacy.baseId : initialBaseId(activeFormation);
  const attack=legacy?.formation?.slots?.length ? cloneFormation(legacy.formation) : cloneFormation(getFormationBlueprint(baseId));
  return createFluidFormationPlanV600(baseId, attack);
}

export function FormationRoleLabPanelV4080({ results, activeFormation, activeStyle }: { results: AnalysisResult[]; activeFormation: string; activeStyle: TacticalStyle }) {
  const initial = useMemo(() => initializeFluid(activeFormation), [activeFormation]);
  const [baseId,setBaseId]=useState(initial.baseId);
  const [attackDraft,setAttackDraft]=useState<FormationBlueprint>(()=>cloneFormation(initial.attack));
  const [defenseDraft,setDefenseDraft]=useState<FormationBlueprint>(()=>cloneFormation(initial.defense));
  const [phase,setPhase]=useState<FluidFormationPhaseV600>('attack');
  const [fluidEnabled,setFluidEnabled]=useState(initial.enabled);
  const [teamPlaystyle,setTeamPlaystyle]=useState<FluidTeamPlaystyleV600>(initial.teamPlaystyle);
  const [defensivePreset,setDefensivePreset]=useState<FluidDefensivePresetV600>(initial.defensivePreset);
  const [autoPosition,setAutoPosition]=useState(true);
  const initialDraft=initial.attack;
  const [selectedSlotId,setSelectedSlotId]=useState(()=>initialDraft.slots.find((slot)=>slot.position!=='GK')?.id ?? initialDraft.slots[0]?.id ?? '');
  const [draggingId,setDraggingId]=useState<string|null>(null);
  const [message,setMessage]=useState('v6.0 ativo: edite ATAQUE e DEFESA separadamente. Arraste os jogadores como no eFootball.');
  const [legacyRevision,setLegacyRevision]=useState(0);
  const pitchRef=useRef<HTMLElement|null>(null);

  const draft=phase==='attack'?attackDraft:defenseDraft;
  const inferredName=useMemo(()=>inferFormationNameV600(draft.slots),[draft.slots]);
  const attackName=useMemo(()=>inferFormationNameV600(attackDraft.slots),[attackDraft.slots]);
  const defenseName=useMemo(()=>inferFormationNameV600(defenseDraft.slots),[defenseDraft.slots]);
  const lineup=useMemo(()=>buildFormationLineup(results,{...draft,name:inferredName}),[results,draft,inferredName]);
  const attackLineup=useMemo(()=>buildFormationLineup(results,{...attackDraft,name:attackName}),[results,attackDraft,attackName]);
  const defenseLineup=useMemo(()=>buildFormationLineup(results,{...defenseDraft,name:defenseName}),[results,defenseDraft,defenseName]);
  const selectedSlot=draft.slots.find((slot)=>slot.id===selectedSlotId) ?? draft.slots[0] ?? null;
  const attackFit=averageFit(attackLineup);
  const defenseFit=averageFit(defenseLineup);

  function persistFluid(nextAttack=attackDraft,nextDefense=defenseDraft,nextPreset=defensivePreset,nextTeam=teamPlaystyle,nextEnabled=fluidEnabled) {
    writeFluidFormationPlanV600({
      engineVersion:'6.0.0-buildmaster-1', baseId, enabled:nextEnabled, teamPlaystyle:nextTeam, defensivePreset:nextPreset,
      attack:nextAttack, defense:nextDefense, updatedAt:new Date().toISOString()
    });
    writeAccountStorage(LAST_EDITOR_KEY, JSON.stringify({baseId,formation:nextAttack} satisfies LegacyDraftSnapshot));
  }

  function setCurrentDraft(next: FormationBlueprint, nextMessage?: string, manualDefense=false) {
    if (phase==='attack') {
      setAttackDraft(next);
      let nextDefense=defenseDraft;
      if (defensivePreset!=='PERSONALIZADO') {
        nextDefense=deriveCompactDefenseV600(next, defensivePreset);
        setDefenseDraft(nextDefense);
      }
      persistFluid(next,nextDefense,defensivePreset);
    } else {
      setDefenseDraft(next);
      const preset=manualDefense?'PERSONALIZADO':defensivePreset;
      if (manualDefense) setDefensivePreset(preset);
      persistFluid(attackDraft,next,preset);
    }
    if(nextMessage) setMessage(nextMessage);
  }

  function commitSlots(nextSlots: FormationSlot[], nextMessage?: string, manualDefense=false) {
    setCurrentDraft({...draft,name:inferFormationNameV600(nextSlots),slots:nextSlots},nextMessage,manualDefense);
  }

  function updateSlotPosition(slotId:string,position:PositionCode,snap=true) {
    const nextSlots=draft.slots.map((slot)=>{
      if(slot.id!==slotId) return slot;
      if(slot.position==='GK'&&position!=='GK') return slot;
      const coords=snap?snappedCoordinates(position,slot.x):{x:slot.x,y:slot.y};
      return normalizeFluidSlotV600(slot,position,coords.x,coords.y);
    });
    commitSlots(nextSlots,`${POSITION_LABELS[position]} aplicado na fase de ${phase==='attack'?'ataque':'defesa'}. Escalação recalculada.`,phase==='defense');
  }

  function handlePointerMove(slotId:string,event:ReactPointerEvent<HTMLButtonElement>) {
    if(draggingId!==slotId||!pitchRef.current) return;
    const source=draft.slots.find((slot)=>slot.id===slotId);
    if(!source||source.position==='GK') return;
    const rect=pitchRef.current.getBoundingClientRect();
    const x=Math.max(5,Math.min(95,((event.clientX-rect.left)/rect.width)*100));
    const y=Math.max(7,Math.min(88,((event.clientY-rect.top)/rect.height)*100));
    const nextPosition=autoPosition?inferPositionV600(x,y,source.position):source.position;
    commitSlots(draft.slots.map((slot)=>slot.id===slotId?normalizeFluidSlotV600(slot,nextPosition,x,y):slot),undefined,phase==='defense');
  }

  function startDrag(slot:FormationSlot,event:ReactPointerEvent<HTMLButtonElement>) {
    setSelectedSlotId(slot.id);
    if(slot.position==='GK'){setMessage('O goleiro fica protegido nas duas fases.');return;}
    event.currentTarget.setPointerCapture(event.pointerId); setDraggingId(slot.id);
  }

  function endDrag(slotId:string,event:ReactPointerEvent<HTMLButtonElement>) {
    if(event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDraggingId(null);
    const slot=draft.slots.find((item)=>item.id===slotId);
    if(slot) setMessage(`${slot.label} agora é ${POSITION_LABELS[slot.position]} na fase de ${phase==='attack'?'ataque':'defesa'}. Estrutura: ${inferFormationNameV600(draft.slots)}.`);
  }

  function selectBase(nextBaseId:string) {
    const attack=cloneFormation(getFormationBlueprint(nextBaseId));
    const defense=deriveCompactDefenseV600(attack,'COMPACTO_CENTRAL');
    setBaseId(nextBaseId); setAttackDraft(attack); setDefenseDraft(defense); setDefensivePreset('COMPACTO_CENTRAL');
    setSelectedSlotId(attack.slots.find((slot)=>slot.position!=='GK')?.id??attack.slots[0]?.id??'');
    writeFluidFormationPlanV600({engineVersion:'6.0.0-buildmaster-1',baseId:nextBaseId,enabled:fluidEnabled,teamPlaystyle,defensivePreset:'COMPACTO_CENTRAL',attack,defense,updatedAt:new Date().toISOString()});
    setMessage(`Base ${attack.name} carregada. Defesa compacta v6.0 gerada automaticamente.`);
  }

  function generateDefense(preset:Exclude<FluidDefensivePresetV600,'PERSONALIZADO'>) {
    const defense=deriveCompactDefenseV600(attackDraft,preset);
    setDefenseDraft(defense); setDefensivePreset(preset); setPhase('defense');
    persistFluid(attackDraft,defense,preset);
    setMessage(preset==='BLOCO_ALTO'?'Defesa em bloco alto criada. Use com atenção à recuperação e ao delay.':'Bloco compacto criado para reduzir espaços e facilitar marcação manual.');
  }

  function restoreBase() { selectBase(baseId); setMessage('Ataque e defesa restaurados a partir da formação base.'); }

  function saveFormation() {
    const saved=persistCustomFormation({...attackDraft,name:attackName});
    persistFluid(attackDraft,defenseDraft,defensivePreset);
    setLegacyRevision((value)=>value+1);
    setMessage(`Plano fluido salvo: ataque ${attackName}; defesa ${defenseName}. Formação-base salva como ${saved.name}.`);
  }

  function toggleFluid(enabled:boolean){setFluidEnabled(enabled);persistFluid(attackDraft,defenseDraft,defensivePreset,teamPlaystyle,enabled);}
  function changeTeamPlaystyle(value:FluidTeamPlaystyleV600){setTeamPlaystyle(value);persistFluid(attackDraft,defenseDraft,defensivePreset,value,fluidEnabled);}

  return <section className="bm4080-free-formation-shell bm-v600-fluid-shell">
    <article className="bm4080-free-formation-editor luxury-panel">
      <header className="bm4080-free-formation-header">
        <div><p className="kicker"><Sparkles size={15}/> eFootball 2027 • Formação fluída</p><h3>Uma formação para atacar e outra para defender</h3><p>Edite as duas fases separadamente. O encaixe do elenco é recalculado em cada posição, e o plano fica salvo para o cenário v6.0.</p></div>
        <strong>{phase==='attack'?attackName:defenseName}</strong>
      </header>

      <div className="bm-v600-phase-summary">
        <button type="button" className={phase==='attack'?'active':''} onClick={()=>setPhase('attack')}><span>ATAQUE</span><strong>{attackName}</strong><small>{attackFit}/100 encaixe</small></button>
        <ArrowLeftRight size={22}/>
        <button type="button" className={phase==='defense'?'active':''} onClick={()=>setPhase('defense')}><span>DEFESA</span><strong>{defenseName}</strong><small>{defenseFit}/100 encaixe</small></button>
      </div>

      <div className="bm4080-free-formation-controls bm-v600-fluid-controls">
        <label><span>Formação base</span><select value={baseId} onChange={(event:ChangeEvent<HTMLSelectElement>)=>selectBase(event.target.value)}>{FORMATION_BLUEPRINTS.map((formation)=><option key={formation.id} value={formation.id}>{formation.name}</option>)}</select></label>
        <label className="bm4080-auto-position"><input type="checkbox" checked={fluidEnabled} onChange={(event)=>toggleFluid(event.target.checked)}/><span><b>Formação fluída</b><small>{fluidEnabled?'Ataque e defesa separados ativos.':'Usará a fase de ataque como referência única.'}</small></span></label>
        <label className="bm4080-auto-position"><input type="checkbox" checked={autoPosition} onChange={(event)=>setAutoPosition(event.target.checked)}/><span><b>Posição automática</b><small>Arrastar muda PE → SA → CA, MAT → MLG → VOL etc.</small></span></label>
        <label><span>Estilo v6.0</span><select value={teamPlaystyle} onChange={(event:ChangeEvent<HTMLSelectElement>)=>changeTeamPlaystyle(event.target.value as FluidTeamPlaystyleV600)}><option value="LEGADO">Estilo atual do técnico</option><option value="SOBREPOSICAO">Sobreposição</option></select><small>{teamPlaystyle==='SOBREPOSICAO'?'Compacta no lado da bola e favorece passes curtos/pressão alta.':'Mantém o estilo de técnico já configurado.'}</small></label>
        <button type="button" onClick={()=>generateDefense('COMPACTO_CENTRAL')}><ShieldCheck size={16}/> Gerar bloco compacto</button>
        <button type="button" onClick={()=>generateDefense('BLOCO_ALTO')}><Users size={16}/> Gerar bloco alto</button>
        <button type="button" onClick={restoreBase}><RotateCcw size={16}/> Restaurar</button>
        <button type="button" className="elite-button" onClick={saveFormation}><Save size={16}/> Salvar plano fluido</button>
      </div>

      <div className="bm-v600-meta-note"><ShieldCheck size={17}/><div><strong>Motor v6.0</strong><span>Na defesa, priorize compactação e jogadores com Dedicação defensiva/Interceptação. Em conexão variável, o bloco compacto exige menos correções bruscas do que uma pressão permanente.</span></div></div>

      <div className="bm4080-free-formation-grid">
        <article ref={pitchRef} className={`bm4080-free-pitch bm-v600-phase-${phase}`} aria-label={`Editor ${phase} ${inferredName}`}>
          <div className="bm4080-free-pitch-lines" aria-hidden="true"><i/><i/><i/><i/></div>
          {draft.slots.map((slot)=>{const pick=lineup.find((item)=>item.slot.id===slot.id);return <button type="button" key={slot.id}
            className={`bm4080-free-marker ${selectedSlotId===slot.id?'selected':''} ${draggingId===slot.id?'dragging':''} ${slot.position==='GK'?'locked':''}`}
            style={{left:`${slot.x}%`,top:`${slot.y}%`,touchAction:'none'}} onPointerDown={(event)=>startDrag(slot,event)} onPointerMove={(event)=>handlePointerMove(slot.id,event)} onPointerUp={(event)=>endDrag(slot.id,event)} onPointerCancel={(event)=>endDrag(slot.id,event)} onClick={()=>setSelectedSlotId(slot.id)}
            aria-label={`${slot.label}, ${POSITION_LABELS[slot.position]} na fase de ${phase}`}>
            <span>{slot.position==='GK'?<Lock size={13}/>:<Move size={13}/>} {slot.label}</span><strong>{pick?.player?.parsed.playerName?.split(' ').slice(0,2).join(' ')??POSITION_LABELS[slot.position]}</strong><small>{pick?.player?`${pick.score}/100`:'vaga'}</small>
          </button>;})}
        </article>

        <aside className="bm4080-free-inspector">
          <div className="bm4080-free-identity"><SlidersHorizontal size={18}/><div><span>{phase==='attack'?'Estrutura de ataque':'Estrutura defensiva'}</span><strong>{inferredName}</strong></div></div>
          {selectedSlot&&<><label><span>Jogador/slot</span><strong>{selectedSlot.label}</strong></label><label><span>Posição manual</span><select value={selectedSlot.position} disabled={selectedSlot.position==='GK'} onChange={(event:ChangeEvent<HTMLSelectElement>)=>updateSlotPosition(selectedSlot.id,event.target.value as PositionCode)}>{selectedSlot.position==='GK'?<option value="GK">GOL</option>:POSITION_OPTIONS.map((position)=><option key={position} value={position}>{POSITION_LABELS[position]}</option>)}</select></label><div className="bm4080-free-position-readout"><span>X <b>{Math.round(selectedSlot.x)}</b></span><span>Y <b>{Math.round(selectedSlot.y)}</b></span><span>Linha <b>{selectedSlot.line}</b></span></div><p>{selectedSlot.position==='GK'?'Goleiro protegido.':'Arraste ou selecione a posição. Na fase defensiva, qualquer edição manual passa a ser preservada como Personalizada.'}</p></>}
          <div className="bm4080-free-live-lineup"><h4><Users size={16}/> Encaixe da fase</h4>{lineup.filter((pick)=>pick.slot.position!=='GK').slice(0,10).map((pick)=><span key={pick.slot.id}><b>{pick.slot.label}</b>{pick.player?.parsed.playerName??'vaga'}<em>{pick.score||0}</em></span>)}</div>
        </aside>
      </div>
      <p className="bm4080-free-message" role="status"><CheckCircle2 size={15}/> {message}</p>
    </article>

    <details className="bm4080-advanced-formation-tools luxury-panel"><summary><div><span>Ferramentas táticas avançadas</span><strong>Técnicos, estilos, guia e montagem</strong></div><SlidersHorizontal size={18}/></summary><LegacyFormationRoleLabPanel key={legacyRevision} results={results} activeFormation={activeFormation} activeStyle={activeStyle}/></details>
  </section>;
}
