'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, Layers, Plus, Save, ShieldCheck, Sparkles, Target, Trash2, Users } from 'lucide-react';
import type { AnalysisResult, PositionCode, TacticalStyle } from '@/lib/analyzer';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { createStableId } from '@/lib/stableId';
import { TacticalPosterStudioPanel } from '@/components/TacticalPosterStudioPanel';
import {
  FORMATION_BLUEPRINTS,
  FORMATION_ROLE_CATALOG,
  buildFormationLineup,
  getFormationBlueprint,
  styleAdviceForFormation,
  styleLabel,
  getFormationRoleMeta2026,
  type FormationBlueprint,
  type FormationRoleId,
  type FormationSlot
} from '@/lib/formationRoleEngine';
import { CANONICAL_PLAYER_PLAYSTYLES, FORMATION_COACH_STYLE_OPTIONS, getPlayerStyleMeta2026, normalizeFormationCoachStyle, playerStyleTierLabel } from '@/lib/efootball2026Playstyles';

const STORAGE_KEY = 'buildmaster_custom_formations_v26_77';
const POSITIONS: PositionCode[] = ['CF','SS','LWF','RWF','LMF','RMF','AMF','CMF','DMF','CB','LB','RB','GK'];
const POSITION_LABELS: Record<PositionCode,string> = { CF:'CA',SS:'SA',LWF:'PE',RWF:'PD',LMF:'ME',RMF:'MD',AMF:'MAT',CMF:'MLG',DMF:'VOL',CB:'ZAG',LB:'LE',RB:'LD',GK:'GOL' };
const STYLES: TacticalStyle[] = FORMATION_COACH_STYLE_OPTIONS.map((item) => item.value);

type SavedCustomFormation = FormationBlueprint & { createdAt: string; updatedAt: string };

function cloneBlueprint(source: FormationBlueprint, name: string): SavedCustomFormation {
  const now = new Date().toISOString();
  return {
    ...source,
    id: createStableId('custom-formation'),
    name,
    family: 'personalizada',
    description: `Formação personalizada baseada na ${source.name}.`,
    slots: source.slots.map((slot) => ({ ...slot, primaryRoles:[...slot.primaryRoles], complementaryRoles:[...slot.complementaryRoles], alternatives:[...slot.alternatives], keyTraits:[...slot.keyTraits] })),
    createdAt: now,
    updatedAt: now
  };
}

function readCustomFormations(): SavedCustomFormation[] {
  try {
    const parsed = JSON.parse(readAccountStorage(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function FormationRoleLabPanel({ results, activeFormation, activeStyle }: { results: AnalysisResult[]; activeFormation: string; activeStyle: TacticalStyle }) {
  const initialId = activeFormation !== 'AUTO' && FORMATION_BLUEPRINTS.some((item) => item.id === activeFormation) ? activeFormation : '4-2-2-2';
  const [formationId, setFormationId] = useState(initialId);
  const [style, setStyle] = useState<TacticalStyle>(normalizeFormationCoachStyle(activeStyle));
  const [customFormations, setCustomFormations] = useState<SavedCustomFormation[]>([]);
  const [editing, setEditing] = useState<SavedCustomFormation | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => setCustomFormations(readCustomFormations()), []);

  const selected = useMemo<FormationBlueprint>(() => {
    if (editing && formationId === editing.id) return editing;
    return customFormations.find((item) => item.id === formationId) ?? getFormationBlueprint(formationId);
  }, [formationId, customFormations, editing]);
  const advice = useMemo(() => styleAdviceForFormation(selected, style), [selected, style]);
  const lineup = useMemo(() => buildFormationLineup(results, selected), [results, selected]);
  const filled = lineup.filter((item) => item.player).length;
  const averageFit = filled ? Math.round(lineup.reduce((sum,item) => sum + (item.player ? item.score : 0),0) / filled) : 0;

  function persist(next: SavedCustomFormation[]) {
    setCustomFormations(next);
    writeAccountStorage(STORAGE_KEY, JSON.stringify(next));
  }

  function createCustom() {
    const base = selected.family === 'personalizada' ? getFormationBlueprint('4-2-2-2') : selected;
    const next = cloneBlueprint(base, `${base.name} personalizada`);
    persist([...customFormations, next]);
    setEditing(next);
    setFormationId(next.id);
    setMessage('Formação personalizada criada. Ajuste posições, funções e localização dos espaços.');
  }

  function updateSlot(slotId: string, patch: Partial<FormationSlot>) {
    setEditing((current) => current ? ({ ...current, updatedAt:new Date().toISOString(), slots:current.slots.map((slot) => slot.id === slotId ? { ...slot, ...patch } : slot) }) : current);
  }

  function saveCustom() {
    if (!editing) return;
    const next = customFormations.some((item) => item.id === editing.id)
      ? customFormations.map((item) => item.id === editing.id ? editing : item)
      : [...customFormations, editing];
    persist(next);
    setMessage('Formação personalizada salva nesta conta.');
  }

  function duplicateSelected() {
    const next = cloneBlueprint(selected, `${selected.name} cópia`);
    persist([...customFormations, next]);
    setEditing(next);
    setFormationId(next.id);
    setMessage('Cópia criada para personalização.');
  }

  function deleteCustom() {
    if (selected.family !== 'personalizada') return;
    const next = customFormations.filter((item) => item.id !== selected.id);
    persist(next);
    setEditing(null);
    setFormationId('4-2-2-2');
    setMessage('Formação personalizada excluída.');
  }

  return (
    <section className="formation-role-lab">
      <article className="formation-lab-hero luxury-panel">
        <div><p className="kicker"><Sparkles size={15}/> v27.36 • Meta eFootball 2026</p><h3>Formações com estilos oficiais e regras competitivas</h3><p>O técnico usa somente Posse de bola, Contra-ataque rápido ou Contra-ataque normal. Cada jogador mantém o estilo oficial da carta e recebe a avaliação Meta 2026.</p></div>
        <div className="formation-lab-score"><span>Elenco preenchido</span><strong>{filled}/11</strong><small>encaixe médio {averageFit}/100</small></div>
      </article>

      <article className="formation-lab-controls luxury-panel">
        <label><span>Formação</span><select value={formationId} onChange={(event) => { const id=event.target.value; setFormationId(id); const custom=customFormations.find((item)=>item.id===id) ?? null; setEditing(custom); }}>
          <optgroup label="Formações do app">{FORMATION_BLUEPRINTS.filter((item)=>item.family==='oficial-app').map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
          <optgroup label="Formações extras">{FORMATION_BLUEPRINTS.filter((item)=>item.family==='extra').map((item)=><option key={item.id} value={item.id}>{item.name} • extra</option>)}</optgroup>
          {customFormations.length > 0 && <optgroup label="Personalizadas">{customFormations.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>}
        </select></label>
        <label><span>Estilo do técnico</span><select value={style} onChange={(event)=>setStyle(normalizeFormationCoachStyle(event.target.value))}>{STYLES.map((item)=><option key={item} value={item}>{styleLabel(item)}</option>)}</select><small>Somente os 3 estilos definidos para as formações.</small></label>
        <div className="formation-lab-buttons"><button type="button" onClick={createCustom}><Plus size={16}/> Criar personalizada</button><button type="button" onClick={duplicateSelected}><Copy size={16}/> Duplicar</button>{selected.family==='personalizada' && <button type="button" onClick={deleteCustom}><Trash2 size={16}/> Excluir</button>}</div>
      </article>

      <article className="formation-lab-summary luxury-panel">
        <div className="section-title-row"><div><p className="kicker"><Layers size={14}/> {selected.family === 'personalizada' ? 'Formação personalizada' : selected.family === 'extra' ? 'Formação extra' : 'Formação do app'}</p><h3>{selected.name}</h3></div><span>{advice.label} • {advice.fit}/100</span></div>
        <p>{selected.description}</p><p className="panel-note"><b>Comportamento:</b> {selected.behavior}</p><p className="panel-note"><b>Risco:</b> {selected.risk}</p><p className="panel-note"><b>Estilo:</b> {advice.note}</p>
      </article>

      <div className="formation-lab-workspace">
        <article className="formation-role-pitch luxury-panel" aria-label={`Mapa da formação ${selected.name}`}>
          <div className="pitch-markings"><i/><i/><i/></div>
          {lineup.map((pick) => {
            const roles = pick.slot.primaryRoles.map((id)=>FORMATION_ROLE_CATALOG[id].officialName);
            return <button type="button" key={pick.slot.id} className={`formation-pitch-slot ${pick.player ? 'filled' : 'empty'} fit-${pick.score >= 80 ? 'high' : pick.score >= 60 ? 'medium' : 'low'}`} style={{ left:`${pick.slot.x}%`, top:`${pick.slot.y}%` }} title={`${pick.slot.label}: ${roles.join(' ou ')}`}>
              <span>{pick.slot.label}</span><strong>{pick.player?.parsed.playerName ?? roles[0]}</strong><small>{pick.player ? `${pick.score}/100` : 'vaga'}</small>
            </button>;
          })}
        </article>

        <article className="formation-role-list luxury-panel">
          <div className="section-title-row"><div><p className="kicker"><Users size={14}/> Funções por posição</p><h3>Estilos recomendados e encaixe do Cofre</h3></div><span>{selected.slots.length} espaços</span></div>
          <div className="formation-slot-cards">
            {lineup.map((pick) => (
              <details key={pick.slot.id} className={pick.player ? 'has-player' : 'needs-player'}>
                <summary><div><span>{pick.slot.label} • {POSITION_LABELS[pick.slot.position]}</span><strong>{pick.player?.parsed.playerName ?? 'Jogador necessário'}</strong></div><b>{pick.score || '—'}</b></summary>
                <div className="formation-slot-detail">
                  <p>{pick.slot.duty}</p>
                  <div className="formation-role-chips"><span>Principal: {pick.slot.primaryRoles.map((id)=>FORMATION_ROLE_CATALOG[id].officialName).join(' ou ')}</span>{pick.slot.complementaryRoles.length>0 && <span>Alternativa: {pick.slot.complementaryRoles.map((id)=>FORMATION_ROLE_CATALOG[id].officialName).join(' ou ')}</span>}</div>
                  <div className="formation-meta-chips">{pick.slot.primaryRoles.map((id) => { const meta = getFormationRoleMeta2026(id, pick.slot.position); return meta ? <span key={id} className={`meta-${meta.tier}`}><b>{FORMATION_ROLE_CATALOG[id].officialName}</b> • {playerStyleTierLabel(meta.tier)}</span> : null; })}</div>
                  <small>Atributos-chave: {pick.slot.keyTraits.join(' • ')}</small>
                  {pick.slot.pairingNote && <small>Combinação: {pick.slot.pairingNote}</small>}
                  {pick.player && <><div className="formation-fit-bars"><span>Posição <b>{pick.positionFit}</b></span><span>Estilo/função <b>{pick.roleFit}</b></span></div>{pick.reasons.map((reason)=><small key={reason}>✓ {reason}</small>)}{pick.warnings.map((warning)=><small key={warning} className="warn">⚠ {warning}</small>)}</>}
                </div>
              </details>
            ))}
          </div>
        </article>
      </div>

      {editing && formationId === editing.id && (
        <article className="formation-custom-editor luxury-panel">
          <div className="section-title-row"><div><p className="kicker"><Target size={14}/> Editor personalizado</p><h3>Monte sua própria formação</h3></div><button type="button" className="elite-button" onClick={saveCustom}><Save size={16}/> Salvar formação</button></div>
          <label className="formation-name-field"><span>Nome da formação</span><input value={editing.name} onChange={(event)=>setEditing({...editing,name:event.target.value,updatedAt:new Date().toISOString()})}/></label>
          <div className="formation-custom-slots">
            {editing.slots.map((slotItem) => (
              <div key={slotItem.id}>
                <strong>{slotItem.label}</strong>
                <label><span>Posição</span><select value={slotItem.position} onChange={(event)=>updateSlot(slotItem.id,{position:event.target.value as PositionCode})}>{POSITIONS.map((position)=><option key={position} value={position}>{POSITION_LABELS[position]}</option>)}</select></label>
                <label><span>Estilo principal</span><select value={slotItem.primaryRoles[0]} onChange={(event)=>updateSlot(slotItem.id,{primaryRoles:[event.target.value as FormationRoleId]})}>{Object.values(FORMATION_ROLE_CATALOG).filter((role)=>role.positions.includes(slotItem.position) || role.usablePositions?.includes(slotItem.position)).sort((a,b)=>(getFormationRoleMeta2026(b.id, slotItem.position)?.score ?? 0)-(getFormationRoleMeta2026(a.id, slotItem.position)?.score ?? 0)).map((role)=>{ const meta=getFormationRoleMeta2026(role.id,slotItem.position); return <option key={role.id} value={role.id}>{role.officialName}{meta ? ` • ${meta.verdict}` : ''}</option>; })}</select></label>
                <label><span>Horizontal</span><input type="range" min={5} max={95} value={slotItem.x} onChange={(event)=>updateSlot(slotItem.id,{x:Number(event.target.value)})}/></label>
                <label><span>Vertical</span><input type="range" min={7} max={94} value={slotItem.y} onChange={(event)=>updateSlot(slotItem.id,{y:Number(event.target.value)})}/></label>
              </div>
            ))}
          </div>
          <p className="panel-note"><ShieldCheck size={14}/> As formações personalizadas ficam separadas por conta e não alteram automaticamente a escalação principal.</p>
        </article>
      )}

      <article className="formation-meta-catalog luxury-panel">
        <div className="section-title-row"><div><p className="kicker"><ShieldCheck size={14}/> Base oficial do jogador</p><h3>22 estilos cadastrados com sua avaliação Meta 2026</h3></div><span>{CANONICAL_PLAYER_PLAYSTYLES.length} estilos</span></div>
        <div className="formation-meta-grid">{CANONICAL_PLAYER_PLAYSTYLES.map((name) => { const meta=getPlayerStyleMeta2026(name); return meta ? <details key={name} className={`meta-card meta-${meta.tier}`}><summary><strong>{name}</strong><span>{meta.verdict}</span></summary><p>{meta.advice}</p>{meta.restrictions?.map((rule)=><small key={rule}>⚠ {rule}</small>)}</details> : null; })}</div>
      </article>

      <TacticalPosterStudioPanel formation={selected} lineup={lineup} style={style}/>

      {message && <p className="formation-lab-message"><CheckCircle2 size={16}/> {message}</p>}
    </section>
  );
}
