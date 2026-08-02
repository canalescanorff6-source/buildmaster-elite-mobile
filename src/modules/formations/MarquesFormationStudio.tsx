'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Crown, Download, LayoutTemplate, ShieldCheck, Sparkles, Target, TriangleAlert, WandSparkles } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';
import { FORMATION_ROLE_CATALOG, type FormationRoleId } from '@/lib/formationRoleEngine';
import { TacticalPosterStudioPanel } from '@/components/TacticalPosterStudioPanel';
import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';
import {
  FORMATION_GOAL_OPTIONS,
  FORMATION_STYLE_OPTIONS,
  MARQUES_FORMATION_STUDIO_VERSION,
  OFFICIAL_MARQUES_PLAYSTYLES,
  applyRoleOverrides,
  createFormationLineup,
  defaultRoleOverrides,
  recommendMetaFormations,
  roleOptionsForSlot,
  validateFormationRoles,
  type FormationGoalId,
  type MarquesCoachStyle
} from './metaFormationCatalog';

const PLAN_STORAGE_KEY = 'marques_formation_studio_plans_v3178';

type Props = { results: AnalysisResult[] };

type MetricProps = { label: string; value: number };
function Metric({ label, value }: MetricProps) {
  return <div className="marques-metric"><span>{label}</span><strong>{value}</strong><i><b style={{ width: `${value}%` }} /></i></div>;
}

export function MarquesFormationStudio({ results }: Props) {
  const [style, setStyle] = useState<MarquesCoachStyle>('CONTRA_ATAQUE_RAPIDO');
  const [goal, setGoal] = useState<FormationGoalId>('sem-pontas');
  const recommendations = useMemo(() => recommendMetaFormations(style, goal), [goal, style]);
  const [selectedId, setSelectedId] = useState(recommendations[0]?.formation.id ?? '4-1-2-1-2');
  const selectedRecommendation = recommendations.find((item) => item.formation.id === selectedId) ?? recommendations[0];
  const baseFormation = selectedRecommendation.formation;
  const [overridesByFormation, setOverridesByFormation] = useState<Record<string, Record<string, FormationRoleId>>>({});
  const roleOverrides = overridesByFormation[baseFormation.id] ?? defaultRoleOverrides(baseFormation);
  const customizedFormation = useMemo(() => applyRoleOverrides(baseFormation, roleOverrides), [baseFormation, roleOverrides]);
  const lineup = useMemo(() => createFormationLineup(customizedFormation, results), [customizedFormation, results]);
  const validation = useMemo(() => validateFormationRoles(baseFormation, roleOverrides), [baseFormation, roleOverrides]);
  const [showPoster, setShowPoster] = useState(false);
  const [message, setMessage] = useState('');

  function selectFormation(id: string) {
    setSelectedId(id);
    setShowPoster(false);
    setMessage('');
  }

  function updateRole(slotId: string, role: FormationRoleId) {
    setOverridesByFormation((current) => ({
      ...current,
      [baseFormation.id]: { ...(current[baseFormation.id] ?? defaultRoleOverrides(baseFormation)), [slotId]: role }
    }));
    setShowPoster(false);
  }

  function savePlan() {
    try {
      const stored = safeStorageGetJson<unknown[]>(PLAN_STORAGE_KEY, []);
      const plan = { id: `plan-${Date.now()}`, savedAt: new Date().toISOString(), style, goal, formationId: baseFormation.id, formationName: baseFormation.name, roles: roleOverrides, validation };
      if (!safeStorageSetJson(PLAN_STORAGE_KEY, [plan, ...stored].slice(0, 30))) throw new Error('storage unavailable');
      setMessage('Plano salvo no Estúdio Marques com formação, funções e validação.');
    } catch {
      setMessage('Não foi possível salvar agora. A formação continua aberta para exportação.');
    }
  }

  return (
    <section className="marques-formation-studio" aria-label="Estúdio de Formações Marques Fichas">
      <header className="marques-studio-hero">
        <div className="marques-studio-emblem" aria-hidden="true"><strong>M</strong><i /></div>
        <div>
          <p className="kicker"><Crown size={15} /> Marques Fichas • v{MARQUES_FORMATION_STUDIO_VERSION}</p>
          <h1>Estúdio de Formações</h1>
          <p>Monte uma estrutura competitiva, escolha os estilos oficiais por posição, valide os riscos e gere uma imagem tática premium pronta para salvar ou compartilhar.</p>
          <div className="marques-hero-badges"><span><ShieldCheck size={15}/> 22 estilos oficiais</span><span><LayoutTemplate size={15}/> {recommendations.length} estruturas</span><span><WandSparkles size={15}/> PNG e PDF</span></div>
        </div>
        <aside><span>Qualidade tática</span><strong>{validation.score}</strong><small>{validation.status}</small></aside>
      </header>

      <div className="marques-studio-steps" aria-label="Etapas">
        <span className="done"><b>1</b> Modelo de jogo</span><ChevronRight size={16}/><span className="done"><b>2</b> Objetivo</span><ChevronRight size={16}/><span className="active"><b>3</b> Formação e funções</span><ChevronRight size={16}/><span><b>4</b> Imagem premium</span>
      </div>

      <section className="marques-studio-section">
        <div className="marques-section-heading"><div><p className="kicker">Etapa 1</p><h2>Escolha o modelo de jogo</h2></div><span>Somente os três estilos definidos para o estúdio</span></div>
        <div className="marques-style-grid">
          {FORMATION_STYLE_OPTIONS.map((item) => (
            <button key={item.id} type="button" className={style === item.id ? 'active' : ''} onClick={() => { setStyle(item.id); setSelectedId(recommendMetaFormations(item.id, goal)[0].formation.id); setShowPoster(false); }}>
              <span>{style === item.id ? <CheckCircle2 size={19}/> : <Target size={19}/>}</span><strong>{item.label}</strong><small>{item.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="marques-studio-section">
        <div className="marques-section-heading"><div><p className="kicker">Etapa 2</p><h2>Defina o objetivo da formação</h2></div><span>O ranking muda automaticamente</span></div>
        <div className="marques-goal-grid">
          {FORMATION_GOAL_OPTIONS.map((item) => <button key={item.id} type="button" className={goal === item.id ? 'active' : ''} onClick={() => { setGoal(item.id); setSelectedId(recommendMetaFormations(style, item.id)[0].formation.id); setShowPoster(false); }}><strong>{item.label}</strong><small>{item.description}</small></button>)}
        </div>
      </section>

      <div className="marques-studio-main-grid">
        <section className="marques-studio-section marques-catalog-panel">
          <div className="marques-section-heading"><div><p className="kicker">Catálogo competitivo</p><h2>Formações recomendadas</h2></div><span>Ordenadas por encaixe</span></div>
          <div className="marques-formation-list">
            {recommendations.slice(0, 12).map((item, index) => (
              <button key={item.formation.id} type="button" className={baseFormation.id === item.formation.id ? 'active' : ''} onClick={() => selectFormation(item.formation.id)}>
                <b>{String(index + 1).padStart(2, '0')}</b><div><strong>{item.formation.name}</strong><small>{item.headline} • {item.tags.join(' • ') || 'Estrutura adaptável'}</small></div><em>{item.score}</em>
              </button>
            ))}
          </div>
        </section>

        <section className="marques-studio-section marques-preview-panel">
          <div className="marques-section-heading"><div><p className="kicker">Prévia interativa</p><h2>{baseFormation.name}</h2></div><span>{selectedRecommendation.headline}</span></div>
          <div className="marques-pitch" aria-label={`Campo da formação ${baseFormation.name}`}>
            <div className="marques-pitch-lines" aria-hidden="true"><i/><i/><i/></div>
            {customizedFormation.slots.map((slot) => {
              const role = FORMATION_ROLE_CATALOG[slot.primaryRoles[0]];
              return <div key={slot.id} className={`marques-player-marker line-${slot.line}`} style={{ left: `${slot.x}%`, top: `${slot.y}%` }}><span>{slot.label}</span><small>{role?.officialName ?? slot.position}</small></div>;
            })}
          </div>
          <p className="marques-formation-reason">{selectedRecommendation.reason}</p>
          <div className="marques-metrics-grid">
            <Metric label="Ataque" value={selectedRecommendation.metrics.attack}/><Metric label="Criação" value={selectedRecommendation.metrics.creation}/><Metric label="Defesa" value={selectedRecommendation.metrics.defense}/><Metric label="Transição" value={selectedRecommendation.metrics.transition}/><Metric label="Controle" value={selectedRecommendation.metrics.control}/><Metric label="Dificuldade" value={selectedRecommendation.metrics.difficulty}/>
          </div>
        </section>
      </div>

      <div className="marques-studio-main-grid marques-role-grid-wrap">
        <section className="marques-studio-section">
          <div className="marques-section-heading"><div><p className="kicker">Etapa 3</p><h2>Estilo oficial por posição</h2></div><span>{baseFormation.slots.length} jogadores</span></div>
          <div className="marques-role-list">
            {baseFormation.slots.map((slot) => {
              const options = roleOptionsForSlot(baseFormation, slot.id);
              return <label key={slot.id}><span><b>{slot.label}</b><small>{slot.duty}</small></span><select value={roleOverrides[slot.id] ?? options[0]} onChange={(event) => updateRole(slot.id, event.target.value as FormationRoleId)}>{options.map((roleId) => <option key={roleId} value={roleId}>{FORMATION_ROLE_CATALOG[roleId].officialName}</option>)}</select></label>;
            })}
          </div>
        </section>

        <aside className="marques-studio-section marques-validation-panel">
          <div className="marques-section-heading"><div><p className="kicker">Validação inteligente</p><h2>Diagnóstico da estrutura</h2></div><strong>{validation.score}/100</strong></div>
          <div className={`marques-validation-status ${validation.status}`}><Sparkles size={21}/><div><strong>{validation.status === 'excelente' ? 'Estrutura pronta para competir' : validation.status === 'equilibrada' ? 'Estrutura equilibrada' : 'Ajustes recomendados'}</strong><span>O app cruza funções, cobertura, criação e comportamento dos jogadores.</span></div></div>
          {validation.strengths.map((item) => <p className="marques-validation-item positive" key={item}><CheckCircle2 size={16}/>{item}</p>)}
          {validation.warnings.map((item) => <p className="marques-validation-item warning" key={item}><TriangleAlert size={16}/>{item}</p>)}
          <div className="marques-studio-actions"><button type="button" onClick={savePlan}><ShieldCheck size={18}/> Salvar plano</button><button type="button" className="primary" onClick={() => setShowPoster(true)}><Download size={18}/> Gerar imagem premium</button></div>
          {message && <p className="marques-studio-message" role="status">{message}</p>}
        </aside>
      </div>

      <section className="marques-official-styles marques-studio-section">
        <div className="marques-section-heading"><div><p className="kicker">Base oficial do estúdio</p><h2>Estilos utilizados pelo gerador</h2></div><span>Nenhum nome extra é inventado</span></div>
        {Object.entries(OFFICIAL_MARQUES_PLAYSTYLES).map(([category, styles]) => <div key={category}><strong>{category === 'ataque' ? 'Ataque' : category === 'meio' ? 'Meio-campo' : category === 'defesa' ? 'Defesa e laterais' : 'Goleiros'}</strong><p>{styles.map((item) => <span key={item}>{item}</span>)}</p></div>)}
      </section>

      {showPoster && <section className="marques-poster-output"><div className="marques-section-heading"><div><p className="kicker">Etapa 4</p><h2>Imagem tática premium</h2></div><button type="button" onClick={() => setShowPoster(false)}>Fechar prévia</button></div><TacticalPosterStudioPanel formation={customizedFormation} lineup={lineup} style={style} brandTitle="Marques Fichas" brandSubtitle={`${baseFormation.name} • formação competitiva personalizada`} defaultPalette="ciano" defaultFocus="Formação eficiente, funções complementares e comportamento claro em cada fase." /></section>}
    </section>
  );
}
