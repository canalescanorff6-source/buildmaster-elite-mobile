'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Image as ImageIcon,
  Layers3,
  RotateCcw,
  Save,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  WandSparkles
} from 'lucide-react';
import type { IntegratedPlayerRecord } from '@/modules/core/centralIntelligence';
import { downloadBlob, safeFileName, svgToPngBlob } from './exportUtils';
import { professionalMetaFormationOutputSize, renderProfessionalMetaFormationSvg } from './professionalTacticalTemplateV3833';
import {
  META_COACH_STYLES,
  META_FORMATION_CATALOG,
  META_OBJECTIVES,
  OFFICIAL_PLAYER_STYLES,
  createMetaFormationProject,
  deleteMetaFormationProject,
  getMetaFormation,
  readMetaFormationProjects,
  recommendMetaFormations,
  saveMetaFormationProject,
  scorePlayerForMetaSlot,
  validateMetaFormation,
  type MetaCoachStyle,
  type MetaFormationExportFormat,
  type MetaFormationMode,
  type MetaFormationProject,
  type MetaObjective,
  type OfficialPlayerStyle
} from './metaFormationStudioV3832';

export type MetaFormationStudioV3832Props = {
  players: IntegratedPlayerRecord[];
  defaultStyle?: string;
};

type SmartAnswers = {
  central: boolean;
  usesWingers: boolean;
  twoStrikers: boolean;
  fast: boolean;
  suffersCounters: boolean;
  defensiveDifficulty: boolean;
  protectResult: boolean;
  risk: 'segurança' | 'equilíbrio' | 'agressividade';
};

const DEFAULT_ANSWERS: SmartAnswers = {
  central: true,
  usesWingers: false,
  twoStrikers: true,
  fast: false,
  suffersCounters: true,
  defensiveDifficulty: false,
  protectResult: false,
  risk: 'equilíbrio'
};

function normalizeStyle(value?: string): MetaCoachStyle {
  const text = String(value || '').toLowerCase();
  if (text.includes('rápido') || text.includes('rapido')) return 'Contra-ataque rápido';
  if (text.includes('contra')) return 'Contra-ataque normal';
  return 'Posse de bola';
}

function levelLabel(level: ReturnType<typeof validateMetaFormation>['level']) {
  if (level === 'recommended') return 'Combinação recomendada';
  if (level === 'balanced') return 'Estrutura equilibrada';
  if (level === 'high-risk') return 'Risco alto';
  return 'Atenção';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Agora' : date.toLocaleString('pt-BR');
}

function projectWithFormation(project: MetaFormationProject, formationId: string): MetaFormationProject {
  const formation = getMetaFormation(formationId);
  const next = createMetaFormationProject(formation, project.objective, project.mode);
  return {
    ...next,
    id: project.id,
    appearance: project.appearance,
    customTexts: project.customTexts,
    createdAt: project.createdAt
  };
}

export function MetaFormationStudioV3832({ players, defaultStyle }: MetaFormationStudioV3832Props) {
  const initialStyle = normalizeStyle(defaultStyle);
  const [mode, setMode] = useState<MetaFormationMode>('rapido');
  const [style, setStyle] = useState<MetaCoachStyle>(initialStyle);
  const [objective, setObjective] = useState<MetaObjective>('jogar pelo centro');
  const [answers, setAnswers] = useState<SmartAnswers>(DEFAULT_ANSWERS);
  const [project, setProject] = useState<MetaFormationProject>(() => createMetaFormationProject(recommendMetaFormations(initialStyle, 'jogar pelo centro')[0].formation, 'jogar pelo centro', 'rapido'));
  const [saved, setSaved] = useState<MetaFormationProject[]>(() => readMetaFormationProjects());
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [exportFormat, setExportFormat] = useState<MetaFormationExportFormat>('complete');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const recommendations = useMemo(
    () => recommendMetaFormations(style, objective, mode === 'inteligente' ? answers : {}),
    [answers, mode, objective, style]
  );
  const formation = useMemo(() => getMetaFormation(project.formationId), [project.formationId]);
  const validation = useMemo(() => validateMetaFormation(formation, project.assignments, project.objective), [formation, project.assignments, project.objective]);
  const preview = useMemo(() => renderProfessionalMetaFormationSvg(project, exportFormat), [exportFormat, project]);
  const selectedSlot = formation.slots.find((item) => item.id === selectedSlotId) || formation.slots[0];
  const selectedAssignment = selectedSlot ? project.assignments[selectedSlot.id] : undefined;
  const compatiblePlayers = useMemo(() => {
    if (!selectedSlot || !selectedAssignment) return [];
    return players.map((player) => ({ player, fit: scorePlayerForMetaSlot(player, selectedSlot, selectedAssignment.style) })).sort((a, b) => b.fit.score - a.fit.score);
  }, [players, selectedAssignment, selectedSlot]);

  function updateProject(updater: (current: MetaFormationProject) => MetaFormationProject) {
    setProject((current) => ({ ...updater(current), updatedAt: new Date().toISOString() }));
  }

  function applyRecommendation(formationId: string) {
    const next = projectWithFormation({ ...project, mode, style, objective }, formationId);
    setProject({ ...next, style, objective, mode });
    setSelectedSlotId(next.assignments.GK ? 'GK' : Object.keys(next.assignments)[0] || '');
    setMessage('Formação aplicada. Os estilos e riscos já foram recalculados.');
  }

  function updateAssignment(slotId: string, patch: Partial<MetaFormationProject['assignments'][string]>) {
    updateProject((current) => ({
      ...current,
      assignments: { ...current.assignments, [slotId]: { ...current.assignments[slotId], ...patch } }
    }));
  }

  function selectPlayer(slotId: string, playerId: string) {
    const player = players.find((item) => item.id === playerId);
    updateAssignment(slotId, { playerId: player?.id, playerName: player?.name });
  }

  function saveProject() {
    const next = saveMetaFormationProject(project);
    setSaved(next);
    setMessage('Formação salva no histórico do BuildMaster.');
  }

  function restoreProject(item: MetaFormationProject) {
    setProject(item);
    setStyle(item.style);
    setObjective(item.objective);
    setMode(item.mode);
    setSelectedSlotId(Object.keys(item.assignments)[0] || '');
    setMessage('Versão restaurada para edição.');
  }

  async function exportImage(format: MetaFormationExportFormat = exportFormat) {
    setBusy(true);
    setMessage('Gerando imagem tática em alta resolução...');
    try {
      const svg = renderProfessionalMetaFormationSvg(project, format);
      const size = professionalMetaFormationOutputSize(format);
      const png = await svgToPngBlob(svg, size.width, size.height, 2);
      downloadBlob(png, `${safeFileName(project.name)}-${format}.png`);
      setMessage('Imagem PNG gerada com sucesso.');
    } catch (cause) {
      const svg = renderProfessionalMetaFormationSvg(project, format);
      downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${safeFileName(project.name)}-${format}.svg`);
      setMessage(cause instanceof Error ? `${cause.message} A arte foi salva em SVG nítido.` : 'A arte foi salva em SVG nítido.');
    } finally {
      setBusy(false);
    }
  }

  async function shareImage() {
    setBusy(true);
    try {
      const svg = renderProfessionalMetaFormationSvg(project, exportFormat);
      const size = professionalMetaFormationOutputSize(exportFormat);
      const png = await svgToPngBlob(svg, size.width, size.height, 2);
      const file = new File([png], `${safeFileName(project.name)}.png`, { type: 'image/png' });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: project.name, text: `${project.style} • ${project.objective} • Marques Fichas`, files: [file] });
        setMessage('Imagem aberta no compartilhamento do aparelho.');
      } else {
        downloadBlob(png, file.name);
        setMessage('Compartilhamento direto indisponível. A imagem foi salva.');
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setMessage(cause instanceof Error ? cause.message : 'Não foi possível compartilhar agora.');
    } finally {
      setBusy(false);
    }
  }

  function exportPdf() {
    const windowRef = window.open('', '_blank', 'noopener,noreferrer');
    if (!windowRef) {
      setMessage('Permita pop-ups para gerar o PDF.');
      return;
    }
    const svg = renderProfessionalMetaFormationSvg(project, 'complete');
    windowRef.document.write(`<!doctype html><html><head><title>${project.name}</title><style>html,body{margin:0;background:#02070d}svg{display:block;width:100%;height:auto}@page{size:A4 portrait;margin:0} @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>${svg}<script>addEventListener('load',()=>setTimeout(()=>print(),300))<\/script></body></html>`);
    windowRef.document.close();
    setMessage('Prévia de impressão aberta. Escolha “Salvar como PDF”.');
  }

  const smartQuestions: Array<{ key: keyof Omit<SmartAnswers, 'risk'>; label: string }> = [
    { key: 'central', label: 'Joga principalmente pelo centro?' },
    { key: 'usesWingers', label: 'Utiliza pontas?' },
    { key: 'twoStrikers', label: 'Prefere dois atacantes?' },
    { key: 'fast', label: 'Prefere acelerar as jogadas?' },
    { key: 'suffersCounters', label: 'Sofre contra contra-ataques?' },
    { key: 'defensiveDifficulty', label: 'Tem dificuldade para defender?' },
    { key: 'protectResult', label: 'Quer proteger o resultado?' }
  ];

  return (
    <section className="meta-formation-studio-v3832">
      <header className="meta-studio-header">
        <div><p className="kicker"><Layers3 size={15}/> Estúdio de Formações Meta</p><h2>Gerador Tático Profissional por Template</h2><span>Gere artes detalhadas no padrão azul-marinho e dourado, sem IA paga e com todos os dados táticos do projeto.</span></div>
        <span className="meta-version-pill">v38.37</span>
      </header>

      <nav className="meta-mode-tabs" aria-label="Modo de criação">
        {([['rapido', 'Rápido'], ['personalizado', 'Personalizado'], ['inteligente', 'Inteligente']] as const).map(([value, label]) => (
          <button key={value} type="button" className={mode === value ? 'active' : ''} onClick={() => { setMode(value); updateProject((current) => ({ ...current, mode: value })); }}><WandSparkles size={16}/>{label}</button>
        ))}
      </nav>

      <div className="meta-studio-config-grid">
        <label><span>Estilo do técnico</span><select value={style} onChange={(event: { target: HTMLSelectElement }) => { const value = event.target.value as MetaCoachStyle; setStyle(value); const first = recommendMetaFormations(value, objective, mode === 'inteligente' ? answers : {})[0]; setProject(createMetaFormationProject(first.formation, objective, mode)); }}>{META_COACH_STYLES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Objetivo</span><select value={objective} onChange={(event: { target: HTMLSelectElement }) => { const value = event.target.value as MetaObjective; setObjective(value); updateProject((current) => ({ ...current, objective: value })); }}>{META_OBJECTIVES.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>

      {mode === 'inteligente' && (
        <details className="meta-studio-details" open>
          <summary><Sparkles size={17}/> Perguntas rápidas</summary>
          <div className="meta-smart-questions">
            {smartQuestions.map((question) => <label key={question.key}><span>{question.label}</span><input type="checkbox" checked={answers[question.key]} onChange={(event: { target: HTMLInputElement }) => setAnswers((current) => ({ ...current, [question.key]: event.target.checked }))}/></label>)}
            <label><span>Perfil de risco</span><select value={answers.risk} onChange={(event: { target: HTMLSelectElement }) => setAnswers((current) => ({ ...current, risk: event.target.value as SmartAnswers['risk'] }))}><option>segurança</option><option>equilíbrio</option><option>agressividade</option></select></label>
          </div>
        </details>
      )}

      <section className="meta-recommendations">
        <div className="meta-section-heading"><div><p className="kicker">Recomendação</p><h3>{mode === 'personalizado' ? 'Catálogo completo' : 'Melhores estruturas para o objetivo'}</h3></div><span>{mode === 'personalizado' ? META_FORMATION_CATALOG.filter((item) => item.style === style).length : 3}</span></div>
        <div className="meta-recommendation-grid">
          {(mode === 'personalizado' ? META_FORMATION_CATALOG.filter((item) => item.style === style).map((formationItem) => ({ formation: formationItem, score: 0, reasons: formationItem.strengths.slice(0, 2) })) : recommendations.slice(0, 3)).map((entry) => (
            <article key={entry.formation.id} className={project.formationId === entry.formation.id ? 'selected' : ''}>
              <div><small>{entry.formation.classification}</small><strong>{entry.formation.commercialName}</strong><span>{entry.formation.structure} • risco {entry.formation.risk.toLowerCase()}</span></div>
              <div className="meta-score-row"><span>Ataque {entry.formation.scores.attack}</span><span>Defesa {entry.formation.scores.defense}</span><span>Controle {entry.formation.scores.control}</span></div>
              <p>{entry.formation.whyItWorks}</p>
              <button type="button" onClick={() => applyRecommendation(entry.formation.id)}>Usar formação <ChevronRight size={16}/></button>
            </article>
          ))}
        </div>
      </section>

      <div className="meta-editor-layout">
        <section className="meta-field-editor luxury-panel">
          <div className="meta-section-heading"><div><p className="kicker">Prévia em tempo real</p><h3>{project.name}</h3></div><span>{formation.slots.length} jogadores</span></div>
          <div className="meta-svg-preview" dangerouslySetInnerHTML={{ __html: preview }}/>
          <div className="meta-export-actions">
            <select aria-label="Formato da arte" value={exportFormat} onChange={(event: { target: HTMLSelectElement }) => setExportFormat(event.target.value as MetaFormationExportFormat)}><option value="complete">Versão completa</option><option value="vertical">PNG vertical</option><option value="square">PNG quadrado</option><option value="story">Story</option><option value="whatsapp">WhatsApp</option><option value="field-only">Somente campo</option></select>
            <button type="button" disabled={busy} onClick={() => void exportImage()}><ImageIcon size={16}/> Gerar PNG</button>
            <button type="button" disabled={busy} onClick={exportPdf}><FileText size={16}/> PDF</button>
            <button type="button" disabled={busy} onClick={() => void shareImage()}><Share2 size={16}/> Compartilhar</button>
          </div>
        </section>

        <aside className="meta-editor-side">
          <section className={`meta-validation-card is-${validation.level}`}>
            <div><ShieldCheck size={19}/><strong>{levelLabel(validation.level)}</strong></div>
            {validation.notes.slice(0, 5).map((note, index) => <p key={`${note.text}-${index}`} className={`is-${note.level}`}>{note.level === 'positive' ? <CheckCircle2 size={15}/> : <AlertTriangle size={15}/>}<span>{note.text}</span></p>)}
          </section>

          <details className="meta-studio-details" open>
            <summary><Users size={17}/> Jogadores e estilos</summary>
            <div className="meta-slot-list">
              {formation.slots.map((slotItem) => {
                const assignment = project.assignments[slotItem.id];
                return <button key={slotItem.id} type="button" className={selectedSlot?.id === slotItem.id ? 'active' : ''} onClick={() => setSelectedSlotId(slotItem.id)}><span>{slotItem.label}</span><strong>{assignment?.playerName || assignment?.style || slotItem.recommendedStyles[0]}</strong></button>;
              })}
            </div>
            {selectedSlot && selectedAssignment && <div className="meta-slot-editor">
              <label><span>Estilo oficial — {selectedSlot.label}</span><select value={selectedAssignment.style} onChange={(event: { target: HTMLSelectElement }) => updateAssignment(selectedSlot.id, { style: event.target.value as OfficialPlayerStyle })}>{OFFICIAL_PLAYER_STYLES.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>Jogador do Meu Time</span><select value={selectedAssignment.playerId || ''} onChange={(event: { target: HTMLSelectElement }) => selectPlayer(selectedSlot.id, event.target.value)}><option value="">Sem jogador definido</option>{compatiblePlayers.map(({ player, fit }) => <option key={player.id} value={player.id}>{player.name} — {fit.score}% {fit.label}</option>)}</select></label>
              <div className="meta-position-controls"><label><span>Horizontal</span><input type="range" min="4" max="96" value={selectedAssignment.x ?? selectedSlot.x} onChange={(event: { target: HTMLInputElement }) => updateAssignment(selectedSlot.id, { x: Number(event.target.value) })}/></label><label><span>Vertical</span><input type="range" min="5" max="95" value={selectedAssignment.y ?? selectedSlot.y} onChange={(event: { target: HTMLInputElement }) => updateAssignment(selectedSlot.id, { y: Number(event.target.value) })}/></label></div>
            </div>}
          </details>

          <details className="meta-studio-details">
            <summary><Layers3 size={17}/> Setas e apresentação</summary>
            <div className="meta-toggle-grid">
              <label><input type="checkbox" checked={project.appearance.showArrows} onChange={(event: { target: HTMLInputElement }) => updateProject((current) => ({ ...current, appearance: { ...current.appearance, showArrows: event.target.checked } }))}/><span>Mostrar setas</span></label>
              <label><input type="checkbox" checked={project.appearance.showNotes} onChange={(event: { target: HTMLInputElement }) => updateProject((current) => ({ ...current, appearance: { ...current.appearance, showNotes: event.target.checked } }))}/><span>Mostrar notas</span></label>
              <label><input type="checkbox" checked={project.appearance.showInstructions} onChange={(event: { target: HTMLInputElement }) => updateProject((current) => ({ ...current, appearance: { ...current.appearance, showInstructions: event.target.checked } }))}/><span>Mostrar instruções</span></label>
            </div>
            <label><span>Nome da arte</span><input value={project.name} onChange={(event: { target: HTMLInputElement }) => updateProject((current) => ({ ...current, name: event.target.value }))}/></label>
            <label><span>Nome do time</span><input value={project.appearance.teamName} onChange={(event: { target: HTMLInputElement }) => updateProject((current) => ({ ...current, appearance: { ...current.appearance, teamName: event.target.value } }))}/></label>
            <label><span>Fundo</span><select value={project.appearance.background} onChange={(event: { target: HTMLSelectElement }) => updateProject((current) => ({ ...current, appearance: { ...current.appearance, background: event.target.value as MetaFormationProject['appearance']['background'] } }))}><option value="marinho">Azul-marinho</option><option value="grafite">Grafite</option><option value="campo">Campo</option></select></label>
            <div className="meta-arrow-list">{project.arrows.map((arrow) => <label key={arrow.id}><input type="checkbox" checked={arrow.enabled} onChange={(event: { target: HTMLInputElement }) => updateProject((current) => ({ ...current, arrows: current.arrows.map((item) => item.id === arrow.id ? { ...item, enabled: event.target.checked } : item) }))}/><span>{arrow.label}</span></label>)}</div>
          </details>

          <details className="meta-studio-details">
            <summary><FileText size={17}/> Textos táticos</summary>
            <label><span>Como atacar</span><textarea value={project.customTexts.attack ?? formation.attackPlan[0]} onChange={(event: { target: HTMLTextAreaElement }) => updateProject((current) => ({ ...current, customTexts: { ...current.customTexts, attack: event.target.value } }))}/></label>
            <label><span>Como defender</span><textarea value={project.customTexts.defense ?? formation.defensePlan[0]} onChange={(event: { target: HTMLTextAreaElement }) => updateProject((current) => ({ ...current, customTexts: { ...current.customTexts, defense: event.target.value } }))}/></label>
            <label><span>Por que rende</span><textarea value={project.customTexts.why ?? formation.whyItWorks} onChange={(event: { target: HTMLTextAreaElement }) => updateProject((current) => ({ ...current, customTexts: { ...current.customTexts, why: event.target.value } }))}/></label>
          </details>

          <div className="meta-primary-actions"><button type="button" onClick={saveProject}><Save size={16}/> Salvar formação</button><button type="button" onClick={() => { const fresh = createMetaFormationProject(formation, objective, mode); setProject(fresh); setMessage('Edição reiniciada sem apagar o histórico.'); }}><RotateCcw size={16}/> Reiniciar</button></div>
        </aside>
      </div>

      {saved.length > 0 && <details className="meta-studio-details meta-saved-projects"><summary><Save size={17}/> Formações salvas ({saved.length})</summary><div>{saved.map((item) => <article key={item.id}><button type="button" onClick={() => restoreProject(item)}><strong>{item.name}</strong><span>{item.style} • {item.objective}</span><small>{formatDate(item.updatedAt)}</small></button><button type="button" aria-label={`Excluir ${item.name}`} onClick={() => setSaved(deleteMetaFormationProject(item.id))}><Trash2 size={16}/></button></article>)}</div></details>}

      {message && <p className="meta-studio-message" role="status"><CheckCircle2 size={16}/>{message}</p>}
      <footer><span>Marques Fichas</span><small>BuildMaster • formações, fichas, vídeos e desempenho integrados</small><button type="button" onClick={() => navigator.clipboard?.writeText(project.name)} aria-label="Copiar nome da formação"><Copy size={15}/></button><button type="button" onClick={() => void exportImage('field-only')} aria-label="Baixar somente o campo"><Download size={15}/></button></footer>
    </section>
  );
}
