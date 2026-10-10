'use client';

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent } from 'react';
import { Grip, RotateCcw, Save, Settings2 } from 'lucide-react';
import type { TeamDiagnosis, IntegratedPlayerRecord } from '@/modules/core/centralIntelligence';
import type { ManualTeamLayoutR573, ManualPointR573 } from '@/lib/manualTeamEditorR573';
import {
  assignManualStarterR573, emptyManualLayoutR573,
  limitPitchCoordinateR573, sanitizeManualLayoutR573
} from '@/lib/manualTeamEditorR573';
import { getFormationBlueprint } from '@/lib/formationRoleEngine';
import { cardIdentityFingerprintR126 } from '@/lib/cardIdentityFingerprintR126';

type Props = {
  team: TeamDiagnosis;
  players: IntegratedPlayerRecord[];
  manualLayout: ManualTeamLayoutR573 | null;
  onManualLayoutChange: (next:ManualTeamLayoutR573 | null)=>void;
};
type Drag = { id:string;pointer:number;last:ManualPointR573;start:ManualPointR573 };
function initials(name:string){
  return name.split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]?.toLocaleUpperCase('pt-BR')).join('')||'?';
}
export function ManualPitchEditorR573({team,players,manualLayout,onManualLayoutChange}:Props) {
  const [editing,setEditing]=useState(false);
  const [preview,setPreview]=useState<Record<string,ManualPointR573>>({});
  const drag=useRef<Drag|null>(null);
  const pitch=useRef<HTMLDivElement>(null);
  const blueprint=useMemo(()=>getFormationBlueprint(team.formation),[team.formation]);
  const layout=useMemo(()=>sanitizeManualLayoutR573(blueprint,
    manualLayout??emptyManualLayoutR573(blueprint)),[blueprint,manualLayout]);
  const playersByFingerprint=useMemo(()=>new Map(players.map(p=>[p.fingerprint,p])),[players]);
  const locked=new Set(team.lineup.flatMap(f=>f.player?[cardIdentityFingerprintR126(f.player.parsed)]:[]));
  const reserves=players.filter(p=>!locked.has(p.fingerprint)).slice(0,5);
  function save(patch:(draft:ManualTeamLayoutR573)=>void){
    const next=sanitizeManualLayoutR573(blueprint,layout);
    patch(next);
    onManualLayoutChange(sanitizeManualLayoutR573(blueprint,next));
  }
  function pointFor(id:string,origin:ManualPointR573):ManualPointR573{
    return preview[id]??layout.positions[id]??origin;
  }
  function move(slotId:string,point:ManualPointR573){
    save(current=>{current.positions[slotId]=limitPitchCoordinateR573(point.x,point.y)});
    setPreview(current=>{const next={...current};delete next[slotId];return next});
  }
  function pointFromPointer(event:ReactPointerEvent<HTMLButtonElement>):ManualPointR573|null{
    const rect=pitch.current?.getBoundingClientRect();
    if(!rect?.width||!rect.height)return null;
    return limitPitchCoordinateR573(
      ((event.clientX-rect.left)/rect.width)*100,
      ((event.clientY-rect.top)/rect.height)*100
    );
  }
  function onDown(event:ReactPointerEvent<HTMLButtonElement>,id:string,origin:ManualPointR573){
    if(!editing || (event.pointerType==='mouse'&&event.button!==0))return;
    const start=pointFor(id,origin);
    drag.current={id,pointer:event.pointerId,last:start,start};
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function onMove(event:ReactPointerEvent<HTMLButtonElement>){
    if(!editing || !drag.current || drag.current.pointer!==event.pointerId)return;
    const point=pointFromPointer(event);
    if(!point)return;
    drag.current.last=point;
    setPreview(old=>({...old,[drag.current!.id]:point}));
  }
  function onEnd(event:ReactPointerEvent<HTMLButtonElement>,cancel=false){
    const current=drag.current;
    if(!current || current.pointer!==event.pointerId)return;
    drag.current=null;
    if(event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    setPreview(old=>{const next={...old};delete next[current.id];return next});
    if(!cancel && (Math.abs(current.last.x-current.start.x)>.4 || Math.abs(current.last.y-current.start.y)>.4))
      move(current.id,current.last);
  }
  function onKey(event:KeyboardEvent<HTMLButtonElement>,id:string,origin:ManualPointR573){
    if(!editing)return;
    const delta:Record<string,[number,number]>={
      ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]
    };
    const changes=delta[event.key];
    if(!changes)return;
    event.preventDefault();
    const current=pointFor(id,origin);
    move(id,{x:current.x+changes[0],y:current.y+changes[1]});
  }
  return (
    <section className="bm32-team-pitch-panel" aria-label="Campo e editor manual do Meu Time">
      <div style={{display:'flex',gap:8,alignItems:'center',justifyContent:'space-between',
        flexWrap:'wrap',padding:'8px 8px 14px'}}>
        <div><strong>Escalação no campo</strong>
          <small style={{display:'block'}}>Escolha titulares e mova as peças quando quiser.</small>
        </div>
        <button type="button" className="elite-button" aria-pressed={editing}
          onClick={()=>{setEditing(x=>!x);setPreview({});drag.current=null}}>
          <Settings2 size={16}/>{editing?'Concluir edição':'Editar jogadores e posições'}
        </button>
      </div>
      <div className="bm32-team-pitch" ref={pitch} role="group"
        aria-label={'Campo tático '+team.formation+', '+team.filledSlots+' de '+team.totalSlots+' posições'}>
        <div className="bm32-pitch-lines" aria-hidden="true"><i/><i/><i/><i/></div>
        {team.lineup.map(fit=>{
          const id=fit.slot.id;
          const name=fit.player?.parsed.playerName??'';
          const fingerprint=fit.player?cardIdentityFingerprintR126(fit.player.parsed):null;
          const record=fingerprint?playersByFingerprint.get(fingerprint):null;
          const place=pointFor(id,{x:fit.slot.x,y:fit.slot.y});
          return <button type="button" key={id}
            className={'bm32-squad-card line-'+fit.slot.line+(fit.player?'':' empty')}
            style={{left:place.x+'%',top:place.y+'%',cursor:editing?'grab':'default',
              touchAction:editing?'none':'auto',border:editing?'1px dashed currentColor':undefined}}
            disabled={!editing} title={editing?'Arraste ou use as setas para mover a posição visual':'Ative a edição para mover jogadores'}
            aria-label={fit.slot.label+': '+(name||'sem jogador')+
              (editing?', posição editável, use setas ou arraste':'')}
            onPointerDown={e=>onDown(e,id,{x:fit.slot.x,y:fit.slot.y})}
            onPointerMove={onMove} onPointerUp={e=>onEnd(e)}
            onPointerCancel={e=>onEnd(e,true)}
            onKeyDown={e=>onKey(e,id,{x:fit.slot.x,y:fit.slot.y})}>
            <span className="bm32-squad-art">
              {record?.playerImage?<img src={record.playerImage} alt=""/>:<b>{name?initials(name):'+'}</b>}
              <em>{record?.overall||fit.score||'--'}</em>
            </span>
            <strong>{fit.slot.label}</strong>
            <small>{name||'Sem encaixe'}</small>
            <i>{record?.playstyle||fit.slot.primaryRoles[0]}</i>
            {editing&&<Grip size={14} aria-hidden="true" />}
          </button>;
        })}
        <span className="bm32-reserve-count">Reservas {reserves.length}/5</span>
        <span className="bm32-team-score">Força do time <strong>{team.globalScore}</strong></span>
      </div>
      {editing&&<div className="luxury-panel" style={{padding:14,marginTop:12}}>
        <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
          <strong>Editor de titulares e funções</strong>
          <button type="button" className="mini-action"
            onClick={()=>{onManualLayoutChange(null);setPreview({});}}>
            <RotateCcw size={15}/>Restaurar escalação automática
          </button>
        </header>
        <p className="panel-note">
          Toque em cada posição para escolher qualquer carta do Cofre, inclusive fora da posição.
          Jogadores escalados em outra vaga são trocados, sem duplicação. As peças podem ser
          arrastadas com o dedo e ajustadas com as setas do teclado. As posições oficiais
          só mudam pela seleção da função abaixo, não pelo arraste visual.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
          {team.lineup.map(fit=>{
            const id=fit.slot.id;
            const origin=blueprint.slots.find(v=>v.id===id)??fit.slot;
            const manual=layout.assignments[id];
            const selection=manual===undefined?'__AUTO__':manual===null?'__EMPTY__':manual;
            const position=layout.positionOverrides[id]??origin.position;
            return <article key={id} style={{display:'grid',gap:6,padding:10,
              border:'1px solid var(--bm-border, rgba(130,140,150,.3))',borderRadius:12}}>
              <strong>{origin.label} • {fit.score}/100</strong>
              <label htmlFor={'r573-player-'+id}>Jogador titular</label>
              <select id={'r573-player-'+id} value={selection}
                onChange={e=>{
                  const value=e.target.value;
                  if(value==='__AUTO__'){
                    save(d=>{delete d.assignments[id]});
                  }else if(value==='__EMPTY__'){
                    onManualLayoutChange(assignManualStarterR573(blueprint,layout,team.lineup,id,null));
                  }else{
                    onManualLayoutChange(assignManualStarterR573(blueprint,layout,team.lineup,id,value));
                  }
                }}>
                <option value="__AUTO__">{'Automático'+(fit.player?' — '+fit.player.parsed.playerName:'')}</option>
                <option value="__EMPTY__">Deixar posição vazia</option>
                {players.map(player=><option key={player.id} value={player.fingerprint}>
                  {player.name} • {player.cardPosition} • {player.buildName}
                </option>)}
              </select>
              <label htmlFor={'r573-role-'+id}>Posição / função disponível na formação</label>
              <select id={'r573-role-'+id} value={position}
                onChange={e=>{
                  const next=e.target.value;
                  if(![origin.position,...origin.alternatives].includes(next as typeof origin.position))return;
                  save(d=>{if(next===origin.position)delete d.positionOverrides[id];
                    else d.positionOverrides[id]=next as typeof origin.position});
                }}>
                {[origin.position,...origin.alternatives.filter(role=>role!==origin.position)].map(role=>
                  <option key={role} value={role}>{role}</option>)}
              </select>
              <small>Se o encaixe for fraco, o aplicativo avisará. A ativação real no eFootball deve ser conferida no jogo.</small>
            </article>;
          })}
        </div>
        <p className="panel-note"><Save size={14}/> A configuração deste esquema é salva por conta, separada do Cofre.</p>
      </div>}
    </section>
  );
}
