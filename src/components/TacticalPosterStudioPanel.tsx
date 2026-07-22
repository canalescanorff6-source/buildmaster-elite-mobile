'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  Copy,
  Download,
  FileImage,
  FileJson,
  FolderOpen,
  Image as ImageIcon,
  LayoutTemplate,
  Palette,
  Plus,
  Printer,
  RefreshCcw,
  Save,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles
} from 'lucide-react';
import type { TacticalStyle } from '@/lib/analyzer';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import type { FormationBlueprint, FormationSlotFit } from '@/lib/formationRoleEngine';
import {
  createDefaultTacticalPosterArrows,
  DEFAULT_TACTICAL_POSTER_OPTIONS,
  createTacticalPosterSvg,
  defaultTacticalPosterInstructions,
  type TacticalPosterArrow,
  type TacticalPosterArrowKind,
  type TacticalPosterConfig,
  type TacticalPosterCustomColors,
  type TacticalPosterDisplayOptions,
  type TacticalPosterOrientation,
  type TacticalPosterPalette,
  type TacticalPosterPlayerOverride
} from '@/lib/tacticalPoster';
import {
  deleteTacticalPosterProject,
  duplicateTacticalPosterProject,
  normalizeTacticalPosterState,
  readTacticalPosterLibrary,
  saveTacticalPosterProject,
  type SavedTacticalPosterProject,
  type TacticalPosterEditableState
} from '@/lib/tacticalPosterLibrary';
import { createStableId } from '@/lib/stableId';
import {
  addTacticalImage,
  deleteTacticalImage,
  getTacticalImage,
  listTacticalImages,
  type TacticalImageSummary
} from '@/modules/images/accountImageLibrary';
import { blobToDataUrl } from '@/modules/images/imageSafety';
import { downloadBlob, escapeHtml, safeFileName, svgToPngBlob } from '@/modules/tactical-studio/exportUtils';

const DRAFT_KEY_PREFIX = 'buildmaster_tactical_poster_draft_v2736';

type TacticalPosterStudioPanelProps = {
  formation: FormationBlueprint;
  lineup: FormationSlotFit[];
  style: TacticalStyle;
};

type PosterTemplate = {
  id: string;
  label: string;
  description: string;
  palette: TacticalPosterPalette;
  orientation: TacticalPosterOrientation;
  options: Partial<TacticalPosterDisplayOptions>;
};

type ExportScale = 1 | 1.5 | 2;

const PALETTES: Array<{ value: TacticalPosterPalette; label: string }> = [
  { value: 'ouro', label: 'Ouro Premium' },
  { value: 'ciano', label: 'Azul Tático' },
  { value: 'grafite', label: 'Escuro Competitivo' },
  { value: 'rubi', label: 'Vermelho Pressão' },
  { value: 'esmeralda', label: 'Verde Clássico' }
];

const ARROW_KINDS: Array<{ value: TacticalPosterArrowKind; label: string }> = [
  { value: 'support', label: 'Passe / apoio' },
  { value: 'recycle', label: 'Reciclar / voltar' },
  { value: 'defend', label: 'Defesa / compactação' },
  { value: 'movement', label: 'Movimento sem bola' }
];

const TEMPLATES: PosterTemplate[] = [
  { id: 'premium', label: 'Premium completo', description: 'Todos os blocos, legenda, setas e nomes.', palette: 'ouro', orientation: 'vertical', options: {} },
  { id: 'mobile', label: 'Leitura rápida', description: 'Arte limpa para visualizar no celular.', palette: 'ciano', orientation: 'vertical', options: { showScores: false } },
  { id: 'coach', label: 'Quadro do técnico', description: 'Campo amplo, nomes e setas em formato horizontal.', palette: 'grafite', orientation: 'horizontal', options: { showScores: false } },
  { id: 'pressing', label: 'Pressão competitiva', description: 'Tema rubi com foco defensivo e riscos.', palette: 'rubi', orientation: 'vertical', options: {} },
  { id: 'clean', label: 'Campo limpo', description: 'Sem painéis laterais para destacar a formação.', palette: 'esmeralda', orientation: 'vertical', options: { showInstructionPanels: false, showLegend: false, showScores: false } }
];

function linesToText(lines: string[]): string {
  return lines.join('\n');
}

function textToLines(value: string): string[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 8);
}

function createInitialState(formation: FormationBlueprint, style: TacticalStyle): TacticalPosterEditableState {
  const instructions = defaultTacticalPosterInstructions(formation, style);
  return {
    title: 'BuildMaster Elite Tático 2026',
    subtitle: `${formation.name} • estilos oficiais`,
    focus: 'Segurança, construção curta e finalização inteligente.',
    palette: 'ouro',
    orientation: 'vertical',
    options: { ...DEFAULT_TACTICAL_POSTER_OPTIONS },
    playerOverrides: {},
    backgroundImageId: undefined,
    backgroundImageOpacity: 0.2,
    customColors: {},
    useAutomaticArrows: true,
    manualArrows: [],
    passing: linesToText(instructions.passing),
    recycle: linesToText(instructions.recycle),
    attack: linesToText(instructions.attack),
    defend: linesToText(instructions.defend),
    offensive: linesToText(instructions.offensive),
    defensive: linesToText(instructions.defensive),
    avoid: linesToText(instructions.avoid),
    whyItWorks: linesToText(instructions.whyItWorks)
  };
}

export function TacticalPosterStudioPanel({ formation, lineup, style }: TacticalPosterStudioPanelProps) {
  const initialState = useMemo(() => createInitialState(formation, style), [formation, style]);
  const [title, setTitle] = useState(initialState.title);
  const [subtitle, setSubtitle] = useState(initialState.subtitle);
  const [focus, setFocus] = useState(initialState.focus);
  const [palette, setPalette] = useState<TacticalPosterPalette>(initialState.palette);
  const [orientation, setOrientation] = useState<TacticalPosterOrientation>(initialState.orientation);
  const [options, setOptions] = useState<TacticalPosterDisplayOptions>(initialState.options);
  const [playerOverrides, setPlayerOverrides] = useState<Record<string, TacticalPosterPlayerOverride>>({});
  const [backgroundImageId, setBackgroundImageId] = useState<string | undefined>(undefined);
  const [backgroundImageOpacity, setBackgroundImageOpacity] = useState(0.2);
  const [backgroundImageDataUrl, setBackgroundImageDataUrl] = useState('');
  const [imageLibrary, setImageLibrary] = useState<TacticalImageSummary[]>([]);
  const [imageThumbnailUrls, setImageThumbnailUrls] = useState<Record<string, string>>({});
  const [customColors, setCustomColors] = useState<TacticalPosterCustomColors>({});
  const [useAutomaticArrows, setUseAutomaticArrows] = useState(true);
  const [manualArrows, setManualArrows] = useState<TacticalPosterArrow[]>([]);
  const [passing, setPassing] = useState(initialState.passing);
  const [recycle, setRecycle] = useState(initialState.recycle);
  const [attack, setAttack] = useState(initialState.attack);
  const [defend, setDefend] = useState(initialState.defend);
  const [offensive, setOffensive] = useState(initialState.offensive);
  const [defensive, setDefensive] = useState(initialState.defensive);
  const [avoid, setAvoid] = useState(initialState.avoid);
  const [whyItWorks, setWhyItWorks] = useState(initialState.whyItWorks);
  const [exportScale, setExportScale] = useState<ExportScale>(1.5);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [draftStatus, setDraftStatus] = useState('rascunho pronto');
  const [previewUrl, setPreviewUrl] = useState('');
  const [library, setLibrary] = useState<SavedTacticalPosterProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectName, setProjectName] = useState(`${formation.name} • arte tática`);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const initialLoadRef = useRef(false);

  const editableState = useMemo<TacticalPosterEditableState>(() => ({
    title,
    subtitle,
    focus,
    palette,
    orientation,
    options,
    playerOverrides,
    backgroundImageId,
    backgroundImageOpacity,
    customColors,
    useAutomaticArrows,
    manualArrows,
    passing,
    recycle,
    attack,
    defend,
    offensive,
    defensive,
    avoid,
    whyItWorks
  }), [attack, avoid, backgroundImageId, backgroundImageOpacity, customColors, defend, defensive, focus, manualArrows, offensive, options, orientation, palette, passing, playerOverrides, recycle, subtitle, title, useAutomaticArrows, whyItWorks]);

  function applyEditableState(state: TacticalPosterEditableState): void {
    setTitle(state.title);
    setSubtitle(state.subtitle);
    setFocus(state.focus);
    setPalette(state.palette);
    setOrientation(state.orientation);
    setOptions({ ...DEFAULT_TACTICAL_POSTER_OPTIONS, ...state.options });
    setPlayerOverrides(state.playerOverrides ?? {});
    setBackgroundImageId(state.backgroundImageId);
    setBackgroundImageOpacity(state.backgroundImageOpacity ?? 0.2);
    setCustomColors(state.customColors ?? {});
    setUseAutomaticArrows(state.useAutomaticArrows !== false);
    setManualArrows(state.manualArrows ?? []);
    setPassing(state.passing);
    setRecycle(state.recycle);
    setAttack(state.attack);
    setDefend(state.defend);
    setOffensive(state.offensive);
    setDefensive(state.defensive);
    setAvoid(state.avoid);
    setWhyItWorks(state.whyItWorks);
  }

  function resetAutomatic(): void {
    applyEditableState(createInitialState(formation, style));
    setSelectedProjectId('');
    setProjectName(`${formation.name} • arte tática`);
    setMessage('Conteúdo, tema e linhas reconstruídos automaticamente pela formação e pelo estilo selecionados.');
  }

  function startNewProject(): void {
    resetAutomatic();
    setMessage('Nova arte iniciada sem alterar os projetos salvos.');
  }

  async function refreshImageLibrary(): Promise<void> {
    try {
      setImageLibrary(await listTacticalImages());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível carregar a galeria.');
    }
  }

  useEffect(() => {
    void refreshImageLibrary();
  }, []);

  useEffect(() => {
    const urls: Record<string, string> = {};
    imageLibrary.forEach((item) => { urls[item.id] = URL.createObjectURL(item.thumbnail); });
    setImageThumbnailUrls(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [imageLibrary]);

  useEffect(() => {
    let cancelled = false;
    if (!backgroundImageId) {
      setBackgroundImageDataUrl('');
      return () => { cancelled = true; };
    }
    void getTacticalImage(backgroundImageId).then(async (item) => {
      if (!item || cancelled) return;
      const dataUrl = await blobToDataUrl(item.original);
      if (!cancelled) setBackgroundImageDataUrl(dataUrl);
    }).catch(() => { if (!cancelled) setBackgroundImageDataUrl(''); });
    return () => { cancelled = true; };
  }, [backgroundImageId]);

  useEffect(() => {
    setLibrary(readTacticalPosterLibrary());
    const draftKey = `${DRAFT_KEY_PREFIX}_${formation.id}`;
    const rawDraft = readAccountStorage(draftKey) || readAccountStorage('buildmaster_tactical_poster_draft_v2734') || readAccountStorage('buildmaster_tactical_poster_draft_v2732');
    if (rawDraft) {
      try {
        const parsed = JSON.parse(rawDraft) as { formationId?: string; state?: unknown };
        const normalized = normalizeTacticalPosterState(parsed.state);
        if (parsed.formationId === formation.id && normalized) {
          applyEditableState(normalized);
          setDraftStatus('rascunho restaurado');
        }
      } catch {
        setDraftStatus('rascunho novo');
      }
    }
    initialLoadRef.current = true;
  // Restauração somente na entrada do Estúdio; mudanças de formação usam o efeito abaixo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialLoadRef.current) return;
    applyEditableState(createInitialState(formation, style));
    setProjectName(`${formation.name} • arte tática`);
    setSelectedProjectId('');
    setDraftStatus('rascunho novo');
  // O estado inicial já contém todas as dependências táticas necessárias.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formation.id, style]);

  useEffect(() => {
    if (!initialLoadRef.current) return;
    setDraftStatus('salvando rascunho…');
    const timer = window.setTimeout(() => {
      writeAccountStorage(`${DRAFT_KEY_PREFIX}_${formation.id}`, JSON.stringify({
        schema: 2736,
        formationId: formation.id,
        savedAt: new Date().toISOString(),
        state: editableState
      }));
      setDraftStatus('rascunho salvo');
    }, 500);
    return () => window.clearTimeout(timer);
  }, [editableState, formation.id]);

  const config = useMemo<TacticalPosterConfig>(() => ({
    title,
    subtitle,
    focus,
    formation,
    lineup,
    style,
    palette,
    orientation,
    options,
    playerOverrides,
    backgroundImageDataUrl,
    backgroundImageOpacity,
    customColors,
    useAutomaticArrows,
    manualArrows,
    instructions: {
      passing: textToLines(passing),
      recycle: textToLines(recycle),
      attack: textToLines(attack),
      defend: textToLines(defend),
      offensive: textToLines(offensive),
      defensive: textToLines(defensive),
      avoid: textToLines(avoid),
      whyItWorks: textToLines(whyItWorks)
    }
  }), [attack, avoid, backgroundImageDataUrl, backgroundImageOpacity, customColors, defend, defensive, focus, formation, lineup, manualArrows, offensive, options, orientation, palette, passing, playerOverrides, recycle, style, subtitle, title, useAutomaticArrows, whyItWorks]);

  const svg = useMemo(() => createTacticalPosterSvg(config), [config]);

  useEffect(() => {
    const nextUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [svg]);

  function applyTemplate(template: PosterTemplate): void {
    setPalette(template.palette);
    setOrientation(template.orientation);
    setOptions({ ...DEFAULT_TACTICAL_POSTER_OPTIONS, ...template.options });
    setCustomColors({});
    setMessage(`Template “${template.label}” aplicado. Cores, setas e textos continuam editáveis.`);
  }

  function updateOption(key: keyof TacticalPosterDisplayOptions, checked: boolean): void {
    setOptions((current) => ({ ...current, [key]: checked }));
  }

  function updatePlayerOverride(slotId: string, patch: TacticalPosterPlayerOverride): void {
    setPlayerOverrides((current) => ({ ...current, [slotId]: { ...current[slotId], ...patch } }));
  }

  function updateCustomColor(key: keyof TacticalPosterCustomColors, value: string): void {
    setCustomColors((current) => ({ ...current, [key]: value }));
  }

  function convertAutomaticArrows(): void {
    setManualArrows(createDefaultTacticalPosterArrows(lineup, style).map((item) => ({ ...item, id: createStableId('poster-arrow') })));
    setUseAutomaticArrows(false);
    setMessage('As linhas automáticas viraram linhas editáveis. Agora você pode alterar origem, destino, tipo e curvatura.');
  }

  function addManualArrow(): void {
    if (lineup.length < 2) return;
    setManualArrows((current) => [...current, {
      id: createStableId('poster-arrow'),
      fromSlotId: lineup[0].slot.id,
      toSlotId: lineup[1].slot.id,
      kind: 'support' as TacticalPosterArrowKind,
      bend: 0,
      label: '',
      enabled: true
    }].slice(0, 24));
  }

  function updateManualArrow(id: string, patch: Partial<TacticalPosterArrow>): void {
    setManualArrows((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function removeManualArrow(id: string): void {
    setManualArrows((current) => current.filter((item) => item.id !== id));
  }

  function exportSvg(): void {
    downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${safeFileName(`${title}-${formation.name}-${orientation}`)}.svg`);
    setMessage('Arte SVG salva. Ela continua editável e nítida em qualquer tamanho.');
  }

  async function createPngBlob(): Promise<Blob> {
    const baseWidth = orientation === 'horizontal' ? 1536 : 1024;
    const baseHeight = orientation === 'horizontal' ? 1024 : 1536;
    return svgToPngBlob(svg, baseWidth, baseHeight, exportScale);
  }

  async function exportPng(): Promise<void> {
    setExporting(true);
    setMessage('Gerando PNG localmente…');
    try {
      const blob = await createPngBlob();
      downloadBlob(blob, `${safeFileName(`${title}-${formation.name}-${orientation}`)}.png`);
      setMessage('PNG em alta resolução gerado no próprio aparelho, sem API externa.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível gerar o PNG.');
    } finally {
      setExporting(false);
    }
  }

  async function sharePng(): Promise<void> {
    setExporting(true);
    try {
      const blob = await createPngBlob();
      const file = new File([blob], `${safeFileName(`${title}-${formation.name}`)}.png`, { type: 'image/png' });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title, text: `${formation.name} • ${subtitle}`, files: [file] });
        setMessage('Arte enviada ao menu de compartilhamento do aparelho.');
      } else {
        downloadBlob(blob, file.name);
        setMessage('O compartilhamento direto não está disponível. O PNG foi salvo no aparelho.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') setMessage('Compartilhamento cancelado.');
      else setMessage(error instanceof Error ? error.message : 'Não foi possível compartilhar a arte.');
    } finally {
      setExporting(false);
    }
  }

  function printOrPdf(): void {
    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.width = '1px';
    frame.style.height = '1px';
    frame.style.opacity = '0';
    frame.style.pointerEvents = 'none';
    frame.setAttribute('sandbox', 'allow-modals allow-same-origin');
    frame.srcdoc = `<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'"><title>${escapeHtml(title)}</title><style>@page{size:${orientation === 'horizontal' ? 'landscape' : 'portrait'};margin:0}html,body{margin:0;background:#000}svg{display:block;width:100%;height:auto}</style></head><body>${svg}</body></html>`;
    frame.onload = () => {
      window.setTimeout(() => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        window.setTimeout(() => frame.remove(), 2000);
      }, 250);
    };
    document.body.appendChild(frame);
    setMessage('A tela de impressão foi aberta. Escolha “Salvar como PDF” para gerar o arquivo.');
  }

  function exportProjectJson(): void {
    const payload = {
      app: 'BuildMaster Elite Tático',
      schema: 2736,
      exportedAt: new Date().toISOString(),
      formationId: formation.id,
      formationName: formation.name,
      state: editableState
    };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }), `${safeFileName(projectName)}.buildmaster-poster.json`);
    setMessage('Projeto editável exportado em JSON.');
  }

  async function importProjectJson(file: File): Promise<void> {
    try {
      if (file.size > 1_500_000) throw new Error('O projeto é maior que o limite permitido.');
      const parsed = JSON.parse(await file.text()) as { state?: unknown; formationId?: string; formationName?: string };
      const normalized = normalizeTacticalPosterState(parsed.state);
      if (!normalized) throw new Error('O arquivo não contém um projeto tático válido.');
      applyEditableState(normalized);
      setSelectedProjectId('');
      setProjectName(`${parsed.formationName || formation.name} • importado`);
      setMessage(parsed.formationId && parsed.formationId !== formation.id
        ? 'Projeto importado. A formação original é diferente; os textos e o visual foram aplicados à formação atual.'
        : 'Projeto editável importado com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível importar o projeto.');
    }
  }

  async function importStudioFile(file: File): Promise<void> {
    if (file.name.toLowerCase().endsWith('.json') || file.type === 'application/json') {
      await importProjectJson(file);
      return;
    }
    setMessage('Validando e importando imagem com segurança…');
    try {
      const item = await addTacticalImage(file);
      await refreshImageLibrary();
      setBackgroundImageId(item.id);
      setBackgroundImageOpacity(0.2);
      setMessage(item.kind === 'gif'
        ? 'GIF importado com segurança. A arte usa o primeiro quadro como imagem estática.'
        : `${item.name} foi adicionada à galeria desta conta e aplicada ao campo.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível importar a imagem.');
    }
  }

  async function removeGalleryImage(id: string): Promise<void> {
    try {
      await deleteTacticalImage(id);
      if (backgroundImageId === id) setBackgroundImageId(undefined);
      await refreshImageLibrary();
      setMessage('Imagem removida da galeria. Nenhum outro projeto foi apagado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível remover a imagem.');
    }
  }

  function movePlayerFromPointer(slotId: string, event: ReactPointerEvent<HTMLButtonElement>): void {
    const pitch = event.currentTarget.parentElement;
    if (!pitch) return;
    const rect = pitch.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((event.clientY - rect.top) / rect.height) * 100));
    updatePlayerOverride(slotId, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  function saveProject(): void {
    try {
      const result = saveTacticalPosterProject({
        id: selectedProjectId || undefined,
        name: projectName,
        formationId: formation.id,
        formationName: formation.name,
        state: editableState
      });
      setLibrary(result.library);
      setSelectedProjectId(result.project.id);
      setProjectName(result.project.name);
      setMessage('Arte salva na biblioteca desta conta.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar a arte.');
    }
  }

  function loadProject(id: string): void {
    const project = library.find((item) => item.id === id);
    if (!project) return;
    applyEditableState(project);
    setSelectedProjectId(project.id);
    setProjectName(project.name);
    setMessage(project.formationId === formation.id
      ? 'Projeto carregado da biblioteca.'
      : `Projeto carregado. Ele foi criado para ${project.formationName}; o visual foi aplicado à formação atual.`);
  }

  function duplicateProject(): void {
    if (!selectedProjectId) return;
    const result = duplicateTacticalPosterProject(selectedProjectId);
    if (!result) return;
    setLibrary(result.library);
    setSelectedProjectId(result.project.id);
    setProjectName(result.project.name);
    applyEditableState(result.project);
    setMessage('Cópia independente criada na biblioteca.');
  }

  function removeProject(): void {
    if (!selectedProjectId) return;
    setLibrary(deleteTacticalPosterProject(selectedProjectId));
    startNewProject();
    setMessage('Projeto removido da biblioteca.');
  }

  const outputSize = orientation === 'vertical'
    ? `${Math.round(1024 * exportScale)} × ${Math.round(1536 * exportScale)}`
    : `${Math.round(1536 * exportScale)} × ${Math.round(1024 * exportScale)}`;

  return (
    <article className="tactical-poster-studio luxury-panel">
      <div className="section-title-row tactical-poster-heading">
        <div>
          <p className="kicker"><Sparkles size={15}/> v27.36 • Estúdio Tático Completo • Meta 2026</p>
          <h3>Gere, edite, salve e compartilhe artes premium da sua formação</h3>
          <p>O app desenha campo, jogadores, setas e textos localmente em SVG, PNG e PDF. Não existe cobrança por imagem e nenhuma API de inteligência artificial é usada.</p>
        </div>
        <span className="tactical-local-badge"><ImageIcon size={15}/> offline e gratuito</span>
      </div>

      <div className="tactical-template-strip" aria-label="Templates de arte tática">
        {TEMPLATES.map((template) => (
          <button key={template.id} type="button" onClick={() => applyTemplate(template)}>
            <LayoutTemplate size={17}/><span><strong>{template.label}</strong><small>{template.description}</small></span>
          </button>
        ))}
      </div>

      <div className="tactical-library-bar">
        <label className="tactical-project-name"><span>Nome do projeto</span><input value={projectName} maxLength={90} onChange={(event) => setProjectName(event.target.value)}/></label>
        <label><span>Biblioteca</span><select value={selectedProjectId} onChange={(event) => { const id = event.target.value; setSelectedProjectId(id); if (id) loadProject(id); else startNewProject(); }}>
          <option value="">Nova arte</option>
          {library.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select></label>
        <div className="tactical-library-actions">
          <button type="button" onClick={startNewProject}><Plus size={16}/> Nova</button>
          <button type="button" onClick={saveProject}><Save size={16}/> Salvar</button>
          <button type="button" onClick={duplicateProject} disabled={!selectedProjectId}><Copy size={16}/> Duplicar</button>
          <button type="button" onClick={removeProject} disabled={!selectedProjectId}><Trash2 size={16}/> Excluir</button>
        </div>
      </div>

      <div className="tactical-poster-grid">
        <div className="tactical-poster-editor">
          <div className="tactical-poster-fields">
            <label><span>Título</span><input value={title} maxLength={58} onChange={(event) => setTitle(event.target.value)}/></label>
            <label><span>Subtítulo</span><input value={subtitle} maxLength={70} onChange={(event) => setSubtitle(event.target.value)}/></label>
            <label className="wide"><span>Foco da estratégia</span><input value={focus} maxLength={160} onChange={(event) => setFocus(event.target.value)}/></label>
            <label><span><Palette size={14}/> Tema</span><select value={palette} onChange={(event) => { setPalette(event.target.value as TacticalPosterPalette); setCustomColors({}); }}>{PALETTES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label><span>Formato</span><select value={orientation} onChange={(event) => setOrientation(event.target.value as TacticalPosterOrientation)}><option value="vertical">Vertical 2:3</option><option value="horizontal">Horizontal 3:2</option></select></label>
            <label><span>Qualidade PNG</span><select value={String(exportScale)} onChange={(event) => setExportScale(Number(event.target.value) as ExportScale)}><option value="1">Padrão</option><option value="1.5">Alta</option><option value="2">Ultra</option></select></label>
          </div>

          <details open><summary>Elementos visuais</summary><div className="tactical-poster-toggles">
            {([
              ['showArrows', 'Setas e linhas táticas'],
              ['showLegend', 'Legenda das linhas'],
              ['showInstructionPanels', 'Painéis de instruções'],
              ['showPrinciples', 'Princípios e resumo'],
              ['showPlayerNames', 'Nomes dos jogadores'],
              ['showScores', 'Pontuação de encaixe'],
              ['showFooter', 'Rodapé BuildMaster']
            ] as Array<[keyof TacticalPosterDisplayOptions, string]>).map(([key, label]) => <label key={key}><input type="checkbox" checked={options[key]} onChange={(event) => updateOption(key, event.target.checked)}/><span>{label}</span></label>)}
          </div></details>

          <details><summary>Cores personalizadas</summary><div className="tactical-custom-colors">
            <label><span>Destaque principal</span><input type="color" value={customColors.accent || '#f4c542'} onChange={(event) => updateCustomColor('accent', event.target.value)}/></label>
            <label><span>Reciclagem</span><input type="color" value={customColors.secondary || '#1fd3df'} onChange={(event) => updateCustomColor('secondary', event.target.value)}/></label>
            <label><span>Alertas</span><input type="color" value={customColors.danger || '#ff5a5f'} onChange={(event) => updateCustomColor('danger', event.target.value)}/></label>
            <label><span>Campo</span><input type="color" value={customColors.field || '#274f21'} onChange={(event) => updateCustomColor('field', event.target.value)}/></label>
            <button type="button" onClick={() => setCustomColors({})}><RefreshCcw size={15}/> Usar cores do tema</button>
          </div></details>

          <details open><summary>Galeria de imagens da conta</summary><div className="tactical-image-library">
            <div className="tactical-image-library-toolbar">
              <button type="button" onClick={() => importInputRef.current?.click()}><Upload size={15}/> Importar JPG, PNG e outros</button>
              <button type="button" onClick={() => setBackgroundImageId(undefined)} disabled={!backgroundImageId}><RefreshCcw size={15}/> Remover fundo</button>
              <label><span>Opacidade {Math.round(backgroundImageOpacity * 100)}%</span><input type="range" min={5} max={80} value={Math.round(backgroundImageOpacity * 100)} onChange={(event) => setBackgroundImageOpacity(Number(event.target.value) / 100)}/></label>
            </div>
            {imageLibrary.length === 0 ? <p className="panel-note">Nenhuma imagem importada. A galeria é local, separada por conta e não apaga arquivos antigos automaticamente.</p> : <div className="tactical-image-grid">
              {imageLibrary.map((item) => <div key={item.id} className={backgroundImageId === item.id ? 'active' : ''}>
                {imageThumbnailUrls[item.id] ? <img src={imageThumbnailUrls[item.id]} alt={item.name}/> : <span>Prévia</span>}
                <strong title={item.name}>{item.name}</strong><small>{item.width}×{item.height} • {Math.max(1, Math.round(item.size / 1024))} KB</small>
                <div><button type="button" onClick={() => setBackgroundImageId(item.id)}>Usar</button><button type="button" className="danger" onClick={() => void removeGalleryImage(item.id)}><Trash2 size={14}/></button></div>
              </div>)}
            </div>}
          </div></details>

          <details><summary>Jogadores e funções exibidas</summary><div className="tactical-player-overrides">
            <div className="tactical-position-editor" aria-label="Editor de posição dos jogadores">
              {lineup.map((pick) => {
                const override = playerOverrides[pick.slot.id] ?? {};
                const x = override.x ?? pick.slot.x;
                const y = override.y ?? pick.slot.y;
                return <button key={pick.slot.id} type="button" style={{ left: `${x}%`, top: `${y}%` }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); movePlayerFromPointer(pick.slot.id, event); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) movePlayerFromPointer(pick.slot.id, event); }} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}><strong>{pick.slot.label}</strong><span>{override.name || pick.player?.parsed.playerName || pick.slot.duty}</span></button>;
              })}
            </div>
            <p className="panel-note">Arraste cada jogador no mini campo. A posição fica salva no projeto e também altera as linhas inteligentes.</p>
            {lineup.map((pick) => {
              const override = playerOverrides[pick.slot.id] ?? {};
              return <div className="tactical-player-row" key={pick.slot.id}><strong>{pick.slot.label}</strong><input aria-label={`Nome em ${pick.slot.label}`} placeholder={pick.player?.parsed.playerName || 'Nome opcional'} value={override.name ?? ''} onChange={(event) => updatePlayerOverride(pick.slot.id, { name: event.target.value })}/><input aria-label={`Função em ${pick.slot.label}`} placeholder={pick.slot.duty} value={override.role ?? ''} onChange={(event) => updatePlayerOverride(pick.slot.id, { role: event.target.value })}/><button type="button" onClick={() => updatePlayerOverride(pick.slot.id, { x: pick.slot.x, y: pick.slot.y })}>Centralizar</button></div>;
            })}
          </div></details>

          <details open><summary>Setas e linhas editáveis</summary><div className="tactical-arrow-editor">
            <div className="tactical-arrow-toolbar">
              <label><input type="checkbox" checked={useAutomaticArrows} onChange={(event) => setUseAutomaticArrows(event.target.checked)}/><span>Manter linhas automáticas inteligentes</span></label>
              <button type="button" onClick={convertAutomaticArrows}><WandSparkles size={15}/> Tornar automáticas editáveis</button>
              <button type="button" onClick={addManualArrow} disabled={manualArrows.length >= 24}><Plus size={15}/> Adicionar linha</button>
            </div>
            {manualArrows.length === 0 ? <p className="panel-note">Use as linhas automáticas ou toque em “Adicionar linha” para criar uma instrução personalizada.</p> : <div className="tactical-arrow-list">
              {manualArrows.map((item, index) => <div key={item.id} className="tactical-arrow-row">
                <strong>Linha {index + 1}</strong>
                <label><span>Origem</span><select value={item.fromSlotId} onChange={(event) => updateManualArrow(item.id, { fromSlotId: event.target.value })}>{lineup.map((pick) => <option key={pick.slot.id} value={pick.slot.id}>{pick.slot.label} • {pick.player?.parsed.playerName || pick.slot.duty}</option>)}</select></label>
                <label><span>Destino</span><select value={item.toSlotId} onChange={(event) => updateManualArrow(item.id, { toSlotId: event.target.value })}>{lineup.map((pick) => <option key={pick.slot.id} value={pick.slot.id}>{pick.slot.label} • {pick.player?.parsed.playerName || pick.slot.duty}</option>)}</select></label>
                <label><span>Tipo</span><select value={item.kind} onChange={(event) => updateManualArrow(item.id, { kind: event.target.value as TacticalPosterArrowKind })}>{ARROW_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></label>
                <label><span>Curva {item.bend}</span><input type="range" min={-90} max={90} step={5} value={item.bend} onChange={(event) => updateManualArrow(item.id, { bend: Number(event.target.value) })}/></label>
                <label><span>Legenda opcional</span><input value={item.label || ''} maxLength={40} onChange={(event) => updateManualArrow(item.id, { label: event.target.value })}/></label>
                <label className="tactical-arrow-enabled"><input type="checkbox" checked={item.enabled} onChange={(event) => updateManualArrow(item.id, { enabled: event.target.checked })}/><span>Ativa</span></label>
                <button type="button" aria-label={`Excluir linha ${index + 1}`} onClick={() => removeManualArrow(item.id)}><Trash2 size={15}/></button>
              </div>)}
            </div>}
          </div></details>

          <details open><summary>Instruções durante a partida</summary><div className="tactical-poster-textareas">
            <label><span>Passe certo</span><textarea value={passing} onChange={(event) => setPassing(event.target.value)} rows={5}/></label>
            <label><span>Quando voltar</span><textarea value={recycle} onChange={(event) => setRecycle(event.target.value)} rows={5}/></label>
            <label><span>Quando atacar</span><textarea value={attack} onChange={(event) => setAttack(event.target.value)} rows={5}/></label>
            <label><span>Como defender</span><textarea value={defend} onChange={(event) => setDefend(event.target.value)} rows={5}/></label>
          </div></details>

          <details><summary>Princípios, riscos e explicação</summary><div className="tactical-poster-textareas">
            <label><span>Princípios ofensivos</span><textarea value={offensive} onChange={(event) => setOffensive(event.target.value)} rows={5}/></label>
            <label><span>Princípios defensivos</span><textarea value={defensive} onChange={(event) => setDefensive(event.target.value)} rows={5}/></label>
            <label><span>Erros a evitar</span><textarea value={avoid} onChange={(event) => setAvoid(event.target.value)} rows={5}/></label>
            <label><span>Por que rende</span><textarea value={whyItWorks} onChange={(event) => setWhyItWorks(event.target.value)} rows={5}/></label>
          </div></details>

          <div className="tactical-poster-actions">
            <button type="button" className="elite-button" onClick={exportSvg}><Download size={16}/> SVG editável</button>
            <button type="button" className="elite-button secondary" onClick={() => void exportPng()} disabled={exporting}><FileImage size={16}/> {exporting ? 'Gerando…' : 'PNG em alta'}</button>
            <button type="button" className="elite-button secondary" onClick={printOrPdf}><Printer size={16}/> Imprimir / PDF</button>
            <button type="button" className="elite-button secondary" onClick={() => void sharePng()} disabled={exporting}><Share2 size={16}/> Compartilhar</button>
            <button type="button" className="elite-button secondary" onClick={exportProjectJson}><FileJson size={16}/> Projeto JSON</button>
            <button type="button" className="elite-button secondary" onClick={() => importInputRef.current?.click()}><Upload size={16}/> Importar</button>
            <button type="button" className="elite-button secondary" onClick={resetAutomatic}><RefreshCcw size={16}/> Gerar automático</button>
          </div>
          <input ref={importInputRef} className="tactical-hidden-input" type="file" accept="application/json,.json,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.avif,.heic,.heif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importStudioFile(file); event.currentTarget.value = ''; }}/>
          {message && <p className="panel-note tactical-poster-message" role="status">{message}</p>}
        </div>

        <div className="tactical-poster-preview-wrap">
          <div className="tactical-preview-toolbar"><span><FolderOpen size={14}/> {outputSize}</span><span>{draftStatus}</span></div>
          {previewUrl ? <img className={`tactical-poster-preview ${orientation}`} src={previewUrl} alt={`Prévia da arte tática ${formation.name}`}/> : <div className="tactical-poster-loading">Preparando prévia…</div>}
          <small>Jogadores, posições, setas e funções vêm da escalação analisada. Você pode editar a arte sem alterar a ficha original.</small>
        </div>
      </div>
    </article>
  );
}
