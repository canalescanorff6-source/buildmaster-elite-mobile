'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Copy,
  Layers,
  Plus,
  Route,
  Save,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trash2,
  Trophy,
  UserRoundCog,
  Users
} from 'lucide-react';
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
import {
  CANONICAL_PLAYER_PLAYSTYLES,
  FORMATION_COACH_STYLE_OPTIONS,
  getPlayerStyleMeta2026,
  normalizeFormationCoachStyle,
  playerStyleTierLabel
} from '@/lib/efootball2026Playstyles';
import { MANAGERS, type ManagerRecord } from '@/lib/managers';
import {
  buildTacticalGuide,
  rankManagersForPlan,
  recommendedRoleForSlot,
  type ManagerFormationFit
} from '@/lib/tacticalPlanningEngine';

const STORAGE_KEY = 'buildmaster_custom_formations_v31_10';
const PLAN_STORAGE_KEY = 'buildmaster_tactical_plan_v31_10';
const MANAGER_STORAGE_KEY = 'buildmaster_custom_managers_v31_10';
const POSITIONS: PositionCode[] = ['CF','SS','LWF','RWF','LMF','RMF','AMF','CMF','DMF','CB','LB','RB','GK'];
const POSITION_LABELS: Record<PositionCode,string> = { CF:'CA',SS:'SA',LWF:'PE',RWF:'PD',LMF:'ME',RMF:'MD',AMF:'MAT',CMF:'MLG',DMF:'VOL',CB:'ZAG',LB:'LE',RB:'LD',GK:'GOL' };
const STYLES: TacticalStyle[] = FORMATION_COACH_STYLE_OPTIONS.map((item) => item.value);

type SavedCustomFormation = FormationBlueprint & { createdAt: string; updatedAt: string };
type LabTab = 'tecnicos' | 'formacoes' | 'guia' | 'montagem';
type SavedPlan = { formationId: string; style: TacticalStyle; managerId: string; updatedAt: string };
type ManagerDraft = { name: string; primaryStyle: TacticalStyle; primaryProficiency: number; useSecondary: boolean; secondaryStyle: TacticalStyle; secondaryProficiency: number };

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

function readSavedPlan(): SavedPlan | null {
  try {
    const parsed = JSON.parse(readAccountStorage(PLAN_STORAGE_KEY) || 'null') as Partial<SavedPlan> | null;
    if (!parsed?.formationId || !parsed.style || !parsed.managerId) return null;
    return { formationId: parsed.formationId, style: parsed.style, managerId: parsed.managerId, updatedAt: parsed.updatedAt || new Date().toISOString() };
  } catch { return null; }
}

function readCustomManagers(): ManagerRecord[] {
  try {
    const parsed = JSON.parse(readAccountStorage(MANAGER_STORAGE_KEY) || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ManagerRecord => Boolean(item && typeof item === 'object' && 'id' in item && 'name' in item && 'primaryStyle' in item && 'primaryProficiency' in item));
  } catch { return []; }
}

function sourceLabel(source: ManagerFormationFit['source']): string {
  if (source === 'principal') return 'Proficiência principal';
  if (source === 'secundaria') return 'Segunda proficiência';
  return 'Uso adaptado';
}

function managerStyleLine(manager: ManagerRecord): string {
  const primary = `${styleLabel(manager.primaryStyle)} ${manager.primaryProficiency}`;
  const secondary = manager.secondaryStyle && manager.secondaryProficiency
    ? ` • ${styleLabel(manager.secondaryStyle)} ${manager.secondaryProficiency}`
    : '';
  return `${primary}${secondary}`;
}

export function FormationRoleLabPanel({ results, activeFormation, activeStyle }: { results: AnalysisResult[]; activeFormation: string; activeStyle: TacticalStyle }) {
  const savedPlan = useMemo(readSavedPlan, []);
  const initialId = savedPlan?.formationId && FORMATION_BLUEPRINTS.some((item) => item.id === savedPlan.formationId)
    ? savedPlan.formationId
    : activeFormation !== 'AUTO' && FORMATION_BLUEPRINTS.some((item) => item.id === activeFormation)
      ? activeFormation
      : '4-3-3-2ss';
  const [formationId, setFormationId] = useState(initialId);
  const [style, setStyle] = useState<TacticalStyle>(normalizeFormationCoachStyle(savedPlan?.style ?? activeStyle));
  const [managerId, setManagerId] = useState(savedPlan?.managerId || '');
  const [tab, setTab] = useState<LabTab>('formacoes');
  const [customFormations, setCustomFormations] = useState<SavedCustomFormation[]>([]);
  const [customManagers, setCustomManagers] = useState<ManagerRecord[]>([]);
  const [managerDraft, setManagerDraft] = useState<ManagerDraft>({ name:'', primaryStyle:'POSSE_DE_BOLA', primaryProficiency:88, useSecondary:false, secondaryStyle:'CONTRA_ATAQUE_RAPIDO', secondaryProficiency:88 });
  const [editing, setEditing] = useState<SavedCustomFormation | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => { setCustomFormations(readCustomFormations()); setCustomManagers(readCustomManagers()); }, []);

  const selected = useMemo<FormationBlueprint>(() => {
    if (editing && formationId === editing.id) return editing;
    return customFormations.find((item) => item.id === formationId) ?? getFormationBlueprint(formationId);
  }, [formationId, customFormations, editing]);
  const advice = useMemo(() => styleAdviceForFormation(selected, style), [selected, style]);
  const lineup = useMemo(() => buildFormationLineup(results, selected), [results, selected]);
  const guide = useMemo(() => buildTacticalGuide(selected, style), [selected, style]);
  const managerPool = useMemo(() => [...MANAGERS, ...customManagers], [customManagers]);
  const managerRanking = useMemo(() => rankManagersForPlan(managerPool, selected, style), [managerPool, selected, style]);
  const selectedManagerFit = useMemo(() => managerRanking.find((item) => item.manager.id === managerId) ?? managerRanking[0] ?? null, [managerId, managerRanking]);
  const selectedManager = selectedManagerFit?.manager ?? null;
  const filled = lineup.filter((item) => item.player).length;
  const averageFit = filled ? Math.round(lineup.reduce((sum,item) => sum + (item.player ? item.score : 0),0) / filled) : 0;
  const planScore = Math.round((advice.fit * .35) + ((selectedManagerFit?.score ?? 0) * .35) + (averageFit * .3));

  useEffect(() => {
    if (!managerRanking.length) return;
    if (!managerId || !managerRanking.some((item) => item.manager.id === managerId)) setManagerId(managerRanking[0].manager.id);
  }, [managerId, managerRanking]);

  function persist(next: SavedCustomFormation[]) {
    setCustomFormations(next);
    writeAccountStorage(STORAGE_KEY, JSON.stringify(next));
  }

  function savePlan() {
    const manager = selectedManagerFit?.manager;
    if (!manager) return;
    writeAccountStorage(PLAN_STORAGE_KEY, JSON.stringify({ formationId:selected.id, style, managerId:manager.id, updatedAt:new Date().toISOString() } satisfies SavedPlan));
    setMessage(`Plano salvo: ${selected.name}, ${styleLabel(style)} e ${manager.name}.`);
  }

  function saveCustomManager() {
    const name = managerDraft.name.trim();
    if (name.length < 2) { setMessage('Informe o nome do técnico.'); return; }
    const nowId = createStableId('custom-manager');
    const record: ManagerRecord = {
      id: nowId,
      name,
      version: 'Técnico personalizado',
      tier: 'GP',
      primaryStyle: normalizeFormationCoachStyle(managerDraft.primaryStyle),
      primaryProficiency: Math.max(50, Math.min(99, Math.round(managerDraft.primaryProficiency))),
      secondaryStyle: managerDraft.useSecondary ? normalizeFormationCoachStyle(managerDraft.secondaryStyle) : undefined,
      secondaryProficiency: managerDraft.useSecondary ? Math.max(50, Math.min(99, Math.round(managerDraft.secondaryProficiency))) : undefined,
      booster: 'padrao',
      sourceStatus: 'informado_usuario'
    };
    const next = [...customManagers, record];
    setCustomManagers(next);
    writeAccountStorage(MANAGER_STORAGE_KEY, JSON.stringify(next));
    setManagerId(record.id);
    setManagerDraft((current) => ({ ...current, name:'' }));
    setMessage(`Técnico ${record.name} adicionado ao catálogo desta conta.`);
  }

  function deleteCustomManager() {
    if (!selectedManager || !customManagers.some((item) => item.id === selectedManager.id)) return;
    const next = customManagers.filter((item) => item.id !== selectedManager.id);
    setCustomManagers(next);
    writeAccountStorage(MANAGER_STORAGE_KEY, JSON.stringify(next));
    setManagerId('');
    setMessage('Técnico personalizado removido.');
  }

  function createCustom() {
    const base = selected.family === 'personalizada' ? getFormationBlueprint('4-3-3-2ss') : selected;
    const next = cloneBlueprint(base, `${base.name} personalizada`);
    persist([...customFormations, next]);
    setEditing(next);
    setFormationId(next.id);
    setTab('formacoes');
    setMessage('Formação personalizada criada. Ajuste posições, estilos e localização dos espaços.');
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
    setFormationId('4-3-3-2ss');
    setMessage('Formação personalizada excluída.');
  }

  return (
    <section className="formation-role-lab formation-v3110">
      <article className="formation-lab-hero luxury-panel">
        <div>
          <p className="kicker"><Sparkles size={15}/> Técnicos e Formações 2.0</p>
          <h3>Escolha a estrutura, o técnico e o estilo de cada jogador</h3>
          <p>O app cruza a formação, a proficiência principal ou secundária do técnico e o estilo oficial recomendado para cada espaço. O resultado mostra um plano simples, visual e pronto para usar.</p>
        </div>
        <div className="formation-lab-score"><span>Qualidade do plano</span><strong>{planScore}/100</strong><small>{filled}/11 jogadores encaixados</small></div>
      </article>

      <nav className="formation-v3110-tabs luxury-panel" aria-label="Etapas do plano tático">
        <button type="button" className={tab === 'tecnicos' ? 'active' : ''} onClick={() => setTab('tecnicos')}><UserRoundCog size={17}/><span>Técnicos</span><small>proficiências</small></button>
        <button type="button" className={tab === 'formacoes' ? 'active' : ''} onClick={() => setTab('formacoes')}><Layers size={17}/><span>Formações</span><small>oficiais e meta</small></button>
        <button type="button" className={tab === 'guia' ? 'active' : ''} onClick={() => setTab('guia')}><Route size={17}/><span>Guia visual</span><small>ataque e defesa</small></button>
        <button type="button" className={tab === 'montagem' ? 'active' : ''} onClick={() => setTab('montagem')}><BrainCircuit size={17}/><span>Montagem</span><small>encaixe do elenco</small></button>
      </nav>

      <article className="formation-lab-controls luxury-panel">
        <label><span>Formação</span><select value={formationId} onChange={(event: ChangeEvent<HTMLSelectElement>) => { const id=event.target.value; setFormationId(id); const custom=customFormations.find((item)=>item.id===id) ?? null; setEditing(custom); }}>
          <optgroup label="Formações base do app">{FORMATION_BLUEPRINTS.filter((item)=>item.family==='oficial-app').map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
          <optgroup label="Formações meta e personalizadas do catálogo">{FORMATION_BLUEPRINTS.filter((item)=>item.family==='extra').map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
          {customFormations.length > 0 && <optgroup label="Criadas por você">{customFormations.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>}
        </select></label>
        <label><span>Estilo do técnico</span><select value={style} onChange={(event: ChangeEvent<HTMLSelectElement>)=>setStyle(normalizeFormationCoachStyle(event.target.value))}>{STYLES.map((item)=><option key={item} value={item}>{styleLabel(item)}</option>)}</select><small>O app recalcula técnico, funções e guia.</small></label>
        <label><span>Técnico escolhido</span><select value={selectedManager?.id ?? ''} onChange={(event: ChangeEvent<HTMLSelectElement>)=>setManagerId(event.target.value)}>{managerRanking.map((item)=><option key={item.manager.id} value={item.manager.id}>{item.manager.name} • {item.score}/100</option>)}</select><small>{selectedManager ? managerStyleLine(selectedManager) : 'Selecione um técnico'}</small></label>
        <button type="button" className="formation-save-plan" onClick={savePlan}><Save size={16}/> Salvar plano</button>
      </article>

      {tab === 'tecnicos' && (
        <section className="formation-v3110-section">
          <article className="formation-lab-summary luxury-panel">
            <div className="section-title-row"><div><p className="kicker"><Trophy size={14}/> Bloco Técnicos 2.0</p><h3>{selectedManager?.name ?? 'Técnico recomendado'}</h3></div><span>{selectedManagerFit?.score ?? 0}/100</span></div>
            {selectedManagerFit && <>
              <p><b>{sourceLabel(selectedManagerFit.source)}:</b> {styleLabel(style)} {selectedManagerFit.activeProficiency}</p>
              <div className="formation-manager-proficiencies">
                <span><b>Principal</b>{styleLabel(selectedManagerFit.manager.primaryStyle)} • {selectedManagerFit.manager.primaryProficiency}</span>
                {selectedManagerFit.manager.secondaryStyle && selectedManagerFit.manager.secondaryProficiency && <span><b>Secundária</b>{styleLabel(selectedManagerFit.manager.secondaryStyle)} • {selectedManagerFit.manager.secondaryProficiency}</span>}
                <span><b>Tipo</b>{selectedManagerFit.dualProficiency ? 'Técnico híbrido' : 'Especialista'}</span>
                <span><b>Booster</b>{selectedManagerFit.manager.booster}</span>
              </div>
              {selectedManagerFit.reasons.map((reason)=><small key={reason}>✓ {reason}</small>)}
              {selectedManagerFit.warnings.map((warning)=><small key={warning} className="warn">⚠ {warning}</small>)}
            </>}
          </article>
          <div className="formation-manager-grid">
            {managerRanking.slice(0, 12).map((item, index) => (
              <button type="button" key={item.manager.id} className={`formation-manager-card ${selectedManager?.id === item.manager.id ? 'active' : ''}`} onClick={() => setManagerId(item.manager.id)}>
                <i>{index + 1}</i><div><strong>{item.manager.name}</strong><span>{managerStyleLine(item.manager)}</span><small>{sourceLabel(item.source)} • {item.manager.version}</small></div><b>{item.score}</b>
              </button>
            ))}
          </div>
          <article className="formation-custom-manager luxury-panel">
            <div className="section-title-row"><div><p className="kicker"><Plus size={14}/> Técnico personalizado</p><h3>Cadastre qualquer técnico novo</h3></div>{selectedManager && customManagers.some((item)=>item.id===selectedManager.id) && <button type="button" onClick={deleteCustomManager}><Trash2 size={15}/> Remover selecionado</button>}</div>
            <p>Use os números exibidos no jogo. A segunda proficiência é opcional e entra no ranking como estilo secundário real.</p>
            <div className="formation-custom-manager-grid">
              <label><span>Nome</span><input value={managerDraft.name} onChange={(event: ChangeEvent<HTMLInputElement>)=>setManagerDraft((current)=>({...current,name:event.target.value}))} placeholder="Nome do técnico"/></label>
              <label><span>Estilo principal</span><select value={managerDraft.primaryStyle} onChange={(event: ChangeEvent<HTMLSelectElement>)=>setManagerDraft((current)=>({...current,primaryStyle:normalizeFormationCoachStyle(event.target.value)}))}>{STYLES.map((item)=><option key={item} value={item}>{styleLabel(item)}</option>)}</select></label>
              <label><span>Proficiência principal</span><input type="number" min={50} max={99} value={managerDraft.primaryProficiency} onChange={(event: ChangeEvent<HTMLInputElement>)=>setManagerDraft((current)=>({...current,primaryProficiency:Number(event.target.value)}))}/></label>
              <label className="formation-manager-check"><input type="checkbox" checked={managerDraft.useSecondary} onChange={(event: ChangeEvent<HTMLInputElement>)=>setManagerDraft((current)=>({...current,useSecondary:event.target.checked}))}/><span>Possui segunda proficiência</span></label>
              {managerDraft.useSecondary && <><label><span>Segundo estilo</span><select value={managerDraft.secondaryStyle} onChange={(event: ChangeEvent<HTMLSelectElement>)=>setManagerDraft((current)=>({...current,secondaryStyle:normalizeFormationCoachStyle(event.target.value)}))}>{STYLES.map((item)=><option key={item} value={item}>{styleLabel(item)}</option>)}</select></label><label><span>Proficiência secundária</span><input type="number" min={50} max={99} value={managerDraft.secondaryProficiency} onChange={(event: ChangeEvent<HTMLInputElement>)=>setManagerDraft((current)=>({...current,secondaryProficiency:Number(event.target.value)}))}/></label></>}
            </div>
            <button type="button" className="formation-save-plan" onClick={saveCustomManager}><Save size={16}/> Salvar técnico</button>
          </article>
        </section>
      )}

      {tab === 'formacoes' && (
        <section className="formation-v3110-section">
          <article className="formation-lab-summary luxury-panel">
            <div className="section-title-row"><div><p className="kicker"><Layers size={14}/> {selected.family === 'personalizada' ? 'Criada por você' : selected.family === 'extra' ? 'Meta personalizada' : 'Formação base'}</p><h3>{selected.name}</h3></div><span>{advice.label} • {advice.fit}/100</span></div>
            <p>{selected.description}</p><p className="panel-note"><b>Comportamento:</b> {selected.behavior}</p><p className="panel-note"><b>Risco:</b> {selected.risk}</p><p className="panel-note"><b>Combinação:</b> {selectedManager?.name ?? 'Técnico'} • {styleLabel(style)}</p>
            <div className="formation-lab-buttons"><button type="button" onClick={createCustom}><Plus size={16}/> Criar personalizada</button><button type="button" onClick={duplicateSelected}><Copy size={16}/> Duplicar</button>{selected.family==='personalizada' && <button type="button" onClick={deleteCustom}><Trash2 size={16}/> Excluir</button>}</div>
          </article>

          <div className="formation-lab-workspace">
            <article className="formation-role-pitch luxury-panel" aria-label={`Mapa da formação ${selected.name}`}>
              <div className="pitch-markings"><i/><i/><i/></div>
              {lineup.map((pick) => {
                const recommendedRole = recommendedRoleForSlot(pick.slot, style);
                const role = FORMATION_ROLE_CATALOG[recommendedRole];
                return <button type="button" key={pick.slot.id} className={`formation-pitch-slot ${pick.player ? 'filled' : 'empty'} fit-${pick.score >= 80 ? 'high' : pick.score >= 60 ? 'medium' : 'low'}`} style={{ left:`${pick.slot.x}%`, top:`${pick.slot.y}%` }} title={`${pick.slot.label}: ${role.officialName}`}>
                  <span>{pick.slot.label}</span><strong>{pick.player?.parsed.playerName ?? role.officialName}</strong><small>{pick.player ? `${pick.score}/100` : role.officialName}</small>
                </button>;
              })}
            </article>

            <article className="formation-role-list luxury-panel">
              <div className="section-title-row"><div><p className="kicker"><Users size={14}/> Estilo por jogador</p><h3>Posição, função e comportamento</h3></div><span>{selected.slots.length} espaços</span></div>
              <div className="formation-slot-cards">
                {lineup.map((pick) => {
                  const recommendedRole = recommendedRoleForSlot(pick.slot, style);
                  const role = FORMATION_ROLE_CATALOG[recommendedRole];
                  return <details key={pick.slot.id} className={pick.player ? 'has-player' : 'needs-player'}>
                    <summary><div><span>{pick.slot.label} • {POSITION_LABELS[pick.slot.position]}</span><strong>{pick.player?.parsed.playerName ?? role.officialName}</strong></div><b>{pick.score || '—'}</b></summary>
                    <div className="formation-slot-detail">
                      <p><b>{role.officialName}:</b> {role.purpose}</p>
                      <div className="formation-role-chips"><span>Principal: {role.officialName}</span>{pick.slot.complementaryRoles.length>0 && <span>Alternativa: {pick.slot.complementaryRoles.map((id)=>FORMATION_ROLE_CATALOG[id].officialName).join(' ou ')}</span>}</div>
                      <small>Missão: {pick.slot.duty}</small><small>Atributos-chave: {pick.slot.keyTraits.join(' • ')}</small>
                      {pick.slot.pairingNote && <small>Combinação: {pick.slot.pairingNote}</small>}
                      {pick.player && <><div className="formation-fit-bars"><span>Posição <b>{pick.positionFit}</b></span><span>Estilo/função <b>{pick.roleFit}</b></span></div>{pick.reasons.slice(0,2).map((reason)=><small key={reason}>✓ {reason}</small>)}{pick.warnings.map((warning)=><small key={warning} className="warn">⚠ {warning}</small>)}</>}
                    </div>
                  </details>;
                })}
              </div>
            </article>
          </div>
        </section>
      )}

      {tab === 'guia' && (
        <section className="formation-v3110-section">
          <article className="formation-guide-hero luxury-panel">
            <div><p className="kicker"><Route size={14}/> Bloco Guia Tático Visual</p><h3>{guide.identity}</h3><p>{selected.behavior}</p></div>
            <div className="formation-guide-keys">{guide.keys.map((key)=><span key={key}>{key}</span>)}</div>
          </article>
          <div className="formation-guide-grid">
            <article><ClipboardList size={20}/><h4>1. Passe certo</h4>{guide.passing.map((item)=><p key={item}>• {item}</p>)}</article>
            <article><ArrowLeftRight size={20}/><h4>2. Quando voltar</h4>{guide.recycle.map((item)=><p key={item}>• {item}</p>)}</article>
            <article><Swords size={20}/><h4>3. Quando atacar</h4>{guide.attack.map((item)=><p key={item}>• {item}</p>)}</article>
            <article><ShieldCheck size={20}/><h4>4. Como defender</h4>{guide.defend.map((item)=><p key={item}>• {item}</p>)}</article>
          </div>
          <div className="formation-principles-grid">
            <article className="luxury-panel"><h4><Target size={18}/> Princípios ofensivos</h4>{guide.offensive.map((item)=><p key={item}>✓ {item}</p>)}</article>
            <article className="luxury-panel"><h4><ShieldCheck size={18}/> Princípios defensivos</h4>{guide.defensive.map((item)=><p key={item}>✓ {item}</p>)}</article>
          </div>
          <article className="formation-avoid-card"><AlertTriangle size={22}/><div><strong>Erro a evitar</strong>{guide.avoid.map((item)=><p key={item}>{item}</p>)}</div></article>
          <article className="formation-why-card luxury-panel"><Trophy size={24}/><div><strong>Por que rende</strong>{guide.whyItWorks.map((item)=><p key={item}>{item}</p>)}</div></article>
          <TacticalPosterStudioPanel formation={selected} lineup={lineup} style={style} managerName={selectedManager?.name}/>
        </section>
      )}

      {tab === 'montagem' && (
        <section className="formation-v3110-section">
          <article className="formation-lab-summary luxury-panel">
            <div className="section-title-row"><div><p className="kicker"><BrainCircuit size={14}/> Bloco Montagem Inteligente</p><h3>Melhor encaixe do seu Cofre</h3></div><span>{averageFit}/100</span></div>
            <p>O app evita dois zagueiros Destruidores, limita laterais muito ofensivos e distribui os jogadores sem repetir a mesma carta.</p>
          </article>
          <div className="formation-smart-lineup">
            {lineup.map((pick) => {
              const role = FORMATION_ROLE_CATALOG[recommendedRoleForSlot(pick.slot, style)];
              return <article key={pick.slot.id} className={pick.player ? 'filled' : 'empty'}>
                <header><span>{pick.slot.label}</span><b>{pick.score || 0}/100</b></header>
                <h4>{pick.player?.parsed.playerName ?? 'Jogador necessário'}</h4>
                <p><strong>{role.officialName}</strong> — {role.purpose}</p>
                <small>{pick.slot.keyTraits.join(' • ')}</small>
                {pick.player ? <div className="formation-smart-status"><BadgeCheck size={15}/> Carta escolhida automaticamente</div> : <div className="formation-smart-status warn"><AlertTriangle size={15}/> Falta uma carta segura para esta função</div>}
              </article>;
            })}
          </div>
        </section>
      )}

      {editing && formationId === editing.id && tab === 'formacoes' && (
        <article className="formation-custom-editor luxury-panel">
          <div className="section-title-row"><div><p className="kicker"><Target size={14}/> Editor personalizado</p><h3>Monte sua própria formação</h3></div><button type="button" className="elite-button" onClick={saveCustom}><Save size={16}/> Salvar formação</button></div>
          <label className="formation-name-field"><span>Nome da formação</span><input value={editing.name} onChange={(event: ChangeEvent<HTMLInputElement>)=>setEditing({...editing,name:event.target.value,updatedAt:new Date().toISOString()})}/></label>
          <div className="formation-custom-slots">
            {editing.slots.map((slotItem) => (
              <div key={slotItem.id}>
                <strong>{slotItem.label}</strong>
                <label><span>Posição</span><select value={slotItem.position} onChange={(event: ChangeEvent<HTMLSelectElement>)=>updateSlot(slotItem.id,{position:event.target.value as PositionCode})}>{POSITIONS.map((position)=><option key={position} value={position}>{POSITION_LABELS[position]}</option>)}</select></label>
                <label><span>Estilo principal</span><select value={slotItem.primaryRoles[0]} onChange={(event: ChangeEvent<HTMLSelectElement>)=>updateSlot(slotItem.id,{primaryRoles:[event.target.value as FormationRoleId]})}>{Object.values(FORMATION_ROLE_CATALOG).filter((role)=>role.positions.includes(slotItem.position) || role.usablePositions?.includes(slotItem.position)).sort((a,b)=>(getFormationRoleMeta2026(b.id, slotItem.position)?.score ?? 0)-(getFormationRoleMeta2026(a.id, slotItem.position)?.score ?? 0)).map((role)=>{ const meta=getFormationRoleMeta2026(role.id,slotItem.position); return <option key={role.id} value={role.id}>{role.officialName}{meta ? ` • ${meta.verdict}` : ''}</option>; })}</select></label>
                <label><span>Horizontal</span><input type="range" min={5} max={95} value={slotItem.x} onChange={(event: ChangeEvent<HTMLInputElement>)=>updateSlot(slotItem.id,{x:Number(event.target.value)})}/></label>
                <label><span>Vertical</span><input type="range" min={7} max={94} value={slotItem.y} onChange={(event: ChangeEvent<HTMLInputElement>)=>updateSlot(slotItem.id,{y:Number(event.target.value)})}/></label>
              </div>
            ))}
          </div>
          <p className="panel-note"><ShieldCheck size={14}/> As formações personalizadas ficam separadas por conta e não alteram automaticamente a escalação principal.</p>
        </article>
      )}

      <details className="formation-meta-catalog luxury-panel">
        <summary><div><p className="kicker"><ShieldCheck size={14}/> Base de estilos</p><h3>Consultar os estilos oficiais cadastrados</h3></div><span>{CANONICAL_PLAYER_PLAYSTYLES.length} estilos</span></summary>
        <div className="formation-meta-grid">{CANONICAL_PLAYER_PLAYSTYLES.map((name) => { const meta=getPlayerStyleMeta2026(name); return meta ? <details key={name} className={`meta-card meta-${meta.tier}`}><summary><strong>{name}</strong><span>{playerStyleTierLabel(meta.tier)}</span></summary><p>{meta.advice}</p>{meta.restrictions?.map((rule)=><small key={rule}>⚠ {rule}</small>)}</details> : null; })}</div>
      </details>

      {message && <p className="formation-lab-message"><CheckCircle2 size={16}/> {message}</p>}
    </section>
  );
}
