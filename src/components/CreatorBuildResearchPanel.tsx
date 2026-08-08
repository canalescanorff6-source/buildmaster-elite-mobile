'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ClipboardCopy,
  ExternalLink,
  Globe2,
  ImagePlus,
  Loader2,
  Plus,
  ScanText,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Trophy
} from 'lucide-react';
import type { AnalysisResult, PositionCode, TrainingKey, TrainingPlan } from '@/lib/analyzerDomain';
import { validateImageFile } from '@/modules/images/imageSafety';
import { fileDigest, recognizeWithOcrWorker } from '@/lib/ocrWorkerManager';
import {
  CREATOR_BUILD_RESEARCH_EVENT,
  CREATOR_TRAINING_KEYS,
  CREATOR_TRAINING_LABELS,
  buildCreatorBuildConsensus,
  buildCreatorSourceDraft,
  creatorSearchQuery,
  creatorSearchUrls,
  creatorTrainingCost,
  detectCreatorPlatform,
  loadCreatorBuildSources,
  parseCreatorTrainingText,
  saveCreatorBuildSources,
  sanitizeCreatorSource,
  type CreatorAuthority,
  type CreatorBuildSource,
  type CreatorDevice,
  type CreatorPlatform,
  type CreatorEvidenceLevel,
  type CreatorProofType
} from '@/lib/creatorBuildResearch';
import {
  listWorldPros,
  loadWorldProRegistry,
  registryFreshnessLabel,
  searchWorldProVideos,
  worldProTierLabel,
  type WorldProProfile,
  type WorldProVideoCandidate
} from '@/lib/worldProRegistry';

const AUTHORITY_LABELS: Record<CreatorAuthority, string> = {
  PRO_PLAYER: 'Pro player confirmado',
  TOP_RANK: 'Ranking alto',
  CRIADOR: 'Criador especializado',
  COMUNIDADE: 'Comunidade'
};

const DEVICE_LABELS: Record<CreatorDevice, string> = {
  MOBILE: 'Mobile',
  CONSOLE: 'Console',
  AMBOS: 'Mobile e console',
  NAO_INFORMADO: 'Não informado'
};

const PLATFORM_LABELS: Record<CreatorPlatform, string> = {
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  OUTRA: 'Outra fonte'
};

const EVIDENCE_LABELS: Record<CreatorEvidenceLevel, string> = {
  FICHA_COMPLETA: 'Ficha completa',
  PROGRESSAO: 'Somente progressão',
  PARCIAL: 'Evidência parcial'
};

const PROOF_LABELS: Record<CreatorProofType, string> = {
  VIDEO: 'Vídeo',
  SCREENSHOT: 'Print',
  STREAM: 'Transmissão ao vivo',
  MANUAL: 'Registro manual'
};

const POSITION_OPTIONS: Array<{ value: PositionCode; label: string }> = [
  { value: 'CF', label: 'CA' }, { value: 'SS', label: 'SA' }, { value: 'LWF', label: 'PE' }, { value: 'RWF', label: 'PD' },
  { value: 'LMF', label: 'ME' }, { value: 'RMF', label: 'MD' }, { value: 'AMF', label: 'MAT' }, { value: 'CMF', label: 'MLG' },
  { value: 'DMF', label: 'VOL' }, { value: 'CB', label: 'ZAG' }, { value: 'LB', label: 'LE' }, { value: 'RB', label: 'LD' }, { value: 'GK', label: 'GOL' }
];

function planText(plan: TrainingPlan): string {
  return CREATOR_TRAINING_KEYS
    .map((key) => `${CREATOR_TRAINING_LABELS[key]} ${plan[key]}`)
    .join(' • ');
}

function blockDifference(source: number, app: number): string {
  const difference = source - app;
  if (difference === 0) return '=';
  return difference > 0 ? `+${difference}` : String(difference);
}

export function CreatorBuildResearchPanel({ result }: { result: AnalysisResult }) {
  const [sources, setSources] = useState<CreatorBuildSource[]>([]);
  const [draft, setDraft] = useState<CreatorBuildSource>(() => buildCreatorSourceDraft(result));
  const [formOpen, setFormOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [ocrBusy, setOcrBusy] = useState(false);
  const [proSearchBusy, setProSearchBusy] = useState<string | null>(null);
  const [proSearchStatus, setProSearchStatus] = useState('');
  const [proVideos, setProVideos] = useState<WorldProVideoCandidate[]>([]);
  const [worldPros, setWorldPros] = useState<WorldProProfile[]>(() => listWorldPros('TODOS'));
  const [worldProSource, setWorldProSource] = useState<'ONLINE' | 'LOCAL'>('LOCAL');
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const refresh = () => setSources(loadCreatorBuildSources());
    refresh();
    setDraft(buildCreatorSourceDraft(result));
    setStatus('');
    window.addEventListener(CREATOR_BUILD_RESEARCH_EVENT, refresh);
    return () => window.removeEventListener(CREATOR_BUILD_RESEARCH_EVENT, refresh);
  }, [result.parsed.internalId, result.parsed.playerName, result.parsed.cardType, result.trainingPointsTotal]);

  useEffect(() => {
    let active = true;
    void loadWorldProRegistry('TODOS').then((registry) => {
      if (!active) return;
      setWorldPros(registry.profiles);
      setWorldProSource(registry.source);
    });
    return () => { active = false; };
  }, []);

  const searchUrls = useMemo(() => creatorSearchUrls(result), [result]);
  const searchQuery = useMemo(() => creatorSearchQuery(result), [result]);
  const consensus = useMemo(() => buildCreatorBuildConsensus(result, sources), [result, sources]);
  const draftCost = useMemo(() => creatorTrainingCost(draft.training), [draft.training]);

  async function searchWithWorldPro(profile: WorldProProfile) {
    setProSearchBusy(profile.id);
    setProSearchStatus(`Pesquisando a carta exata com ${profile.gamerTag}…`);
    setProVideos([]);
    try {
      const response = await searchWorldProVideos(result, profile);
      setProSearchStatus(response.message);
      if (response.videos.length) setProVideos(response.videos);
      else window.open(response.fallbackUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setProSearchBusy(null);
    }
  }

  function useProVideo(video: WorldProVideoCandidate, profile?: WorldProProfile) {
    const device: CreatorDevice = profile?.platform === 'CONSOLE' ? 'CONSOLE' : profile?.platform === 'AMBOS' ? 'AMBOS' : 'MOBILE';
    setDraft((current) => ({
      ...current,
      url: video.url,
      platform: 'YOUTUBE',
      authority: profile ? 'PRO_PLAYER' : 'TOP_RANK',
      verifiedProId: profile?.id || '',
      device,
      channel: video.channel || profile?.gamerTag || '',
      country: profile?.country || current.country,
      title: video.title || current.title,
      publishedAt: video.publishedAt ? video.publishedAt.slice(0, 10) : null
    }));
    setFormOpen(true);
    setStatus('Vídeo selecionado. Agora leia o print da progressão e confirme a carta exata antes de salvar.');
  }

  function updateDraft<K extends keyof CreatorBuildSource>(key: K, value: CreatorBuildSource[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateTraining(key: TrainingKey, value: string) {
    const number = Number(value);
    setDraft((current) => ({
      ...current,
      training: {
        ...current.training,
        [key]: Number.isFinite(number) ? Math.max(0, Math.min(16, Math.round(number))) : 0
      }
    }));
  }


  async function readBuildScreenshot(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setOcrBusy(true);
    setStatus('Lendo os blocos da ficha no print…');
    try {
      const validated = await validateImageFile(file);
      const digest = await fileDigest(validated.sanitizedBlob);
      const recognition = await recognizeWithOcrWorker(validated.sanitizedBlob, {
        label: 'Ficha mostrada por criador',
        kind: 'general',
        cacheKey: `creator-build:${digest}`
      });
      const parsed = parseCreatorTrainingText(recognition.text);
      if (!parsed.matchedKeys.length) {
        setStatus('O OCR não encontrou blocos de progressão. Recorte o print para mostrar somente a tela da ficha e tente novamente.');
        return;
      }
      setDraft((current) => {
        const training = { ...current.training };
        for (const key of parsed.matchedKeys) training[key] = parsed.training[key];
        const ocrNote = `OCR do print: ${parsed.matchedKeys.length} bloco(s), confiança ${parsed.confidence}% e leitura ${recognition.confidence}%.`;
        return { ...current, training, notes: current.notes ? `${current.notes}
${ocrNote}` : ocrNote };
      });
      setStatus(`Print lido: ${parsed.matchedKeys.length} bloco(s) preenchido(s). Confira os números antes de salvar.`);
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível ler o print da ficha.');
    } finally {
      setOcrBusy(false);
    }
  }

  function useCurrentBuildAsDraft() {
    setDraft((current) => ({
      ...current,
      training: { ...result.training },
      skills: [...result.recommendedSkills.slice(0, 5)],
      impeto: result.recommendedImpetos[0]?.name ?? '',
      evidenceLevel: 'FICHA_COMPLETA'
    }));
    setStatus('A ficha atual do BuildMaster foi copiada. Ajuste progressão, habilidades e Ímpeto para reproduzir exatamente a fonte.');
  }

  function saveSource() {
    const platform = detectCreatorPlatform(draft.url);
    const candidate = sanitizeCreatorSource({ ...draft, platform: platform === 'OUTRA' ? draft.platform : platform }, draft.card);
    if (!candidate) {
      setStatus('Informe um link válido e confirme o nome da carta antes de salvar.');
      return;
    }
    if (!candidate.channel.trim()) {
      setStatus('Informe o canal ou criador para que a fonte possa ser auditada.');
      return;
    }
    if (candidate.authority === 'PRO_PLAYER' && !candidate.verifiedProId) {
      setStatus('Para usar peso de pro player, selecione o vídeo pelo Índice Mundial Verificado. Fontes manuais podem ser salvas como ranking alto ou criador.');
      return;
    }
    if (!Object.values(candidate.training).some((value) => value > 0)) {
      setStatus('Preencha pelo menos um bloco da ficha mostrada no vídeo.');
      return;
    }
    if (candidate.card.trainingPointsTotal && draftCost.totalCost > candidate.card.trainingPointsTotal) {
      setStatus(`A ficha custa ${draftCost.totalCost} pontos, acima dos ${candidate.card.trainingPointsTotal} disponíveis. Corrija os blocos antes de salvar.`);
      return;
    }
    if (candidate.evidenceLevel === 'FICHA_COMPLETA' && (!candidate.skills.length || !candidate.impeto)) {
      setStatus('Para marcar como ficha completa, informe pelo menos uma habilidade adicional e o Ímpeto mostrado na fonte.');
      return;
    }
    const next = saveCreatorBuildSources([candidate, ...sources.filter((item) => item.id !== candidate.id)]);
    setSources(next);
    setDraft(buildCreatorSourceDraft(result));
    setFormOpen(false);
    setStatus('Fonte salva e incorporada à comparação desta carta.');
  }

  function removeSource(id: string) {
    const next = saveCreatorBuildSources(sources.filter((source) => source.id !== id));
    setSources(next);
    setStatus('Fonte removida da pesquisa.');
  }

  async function copyConsensus() {
    const text = [
      `BuildMaster • consenso de criadores • ${result.parsed.playerName}`,
      `Carta: ${result.parsed.cardType || 'não informada'}${result.parsed.specialTag ? ` • ${result.parsed.specialTag}` : ''}`,
      planText(consensus.training),
      `Custo: ${consensus.totalCost}/${result.trainingPointsTotal} pontos`,
      `Fontes compatíveis: ${consensus.sourceCount} • carta exata: ${consensus.exactCardCount} • confiança: ${consensus.confidence}%`
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Ficha consenso copiada.');
    } catch {
      setStatus('Não foi possível copiar automaticamente neste aparelho.');
    }
  }

  return <article className="luxury-panel wide-card creator-build-research-card">
    <div className="section-title-row creator-research-heading">
      <div>
        <p className="kicker">Pesquisa de fichas • YouTube, TikTok e criadores</p>
        <h3>Comparador de progressão por carta exata</h3>
      </div>
      <span>{consensus.sourceCount} fonte(s) compatível(is)</span>
    </div>

    <p className="panel-note">O app não copia uma ficha apenas porque ela tem overall alto. Cada vídeo fica vinculado ao jogador, tipo da carta, edição, posição, orçamento de pontos e plataforma. Fontes de cartas diferentes são separadas automaticamente.</p>

    <section className="world-pro-network">
      <div className="section-title-row">
        <div><p className="kicker"><Globe2 size={14} /> Índice mundial verificado</p><h4>Pesquisar a carta com jogadores de elite</h4></div>
        <span>{registryFreshnessLabel(worldPros)} • {worldProSource === 'ONLINE' ? 'base online' : 'base offline'}</span>
      </div>
      <p className="panel-note">O índice confirma a autoridade competitiva. A progressão só influencia a ficha depois que vídeo, print e versão exata da carta passam pela auditoria.</p>
      <div className="world-pro-grid">{worldPros.map((profile) => <article key={profile.id}>
        <div className="world-pro-head"><Trophy size={16} /><span>{worldProTierLabel(profile.tier)}</span><em>{profile.platform}</em></div>
        <strong>{profile.gamerTag}</strong><small>{profile.country} • autoridade {profile.authorityScore}/100</small><p>{profile.achievement}</p>
        <div className="world-pro-actions"><button type="button" disabled={proSearchBusy === profile.id} onClick={() => void searchWithWorldPro(profile)}>{proSearchBusy === profile.id ? <Loader2 size={15} className="spin" /> : <Search size={15} />} Buscar ficha desta carta</button><a href={profile.officialSourceUrl} target="_blank" rel="noreferrer" aria-label={`Abrir fonte oficial de ${profile.gamerTag}`}><ShieldCheck size={15} /></a></div>
      </article>)}</div>
      {proSearchStatus && <p className="creator-status" role="status">{proSearchStatus}</p>}
      {proVideos.length > 0 && <div className="world-pro-video-results">{proVideos.map((video) => {
        const profile = worldPros.find((item) => video.gamerTag === item.gamerTag);
        return <article key={video.id}><div><strong>{video.title}</strong><span>{video.channel}{video.publishedAt ? ` • ${video.publishedAt.slice(0, 10).split('-').reverse().join('/')}` : ''}</span></div><button type="button" onClick={() => useProVideo(video, profile)}>Usar como fonte</button><a href={video.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a></article>;
      })}</div>}
    </section>

    <section className="creator-search-strip">
      <div>
        <Search size={18} />
        <span><strong>Pesquisa preparada</strong><small>{searchQuery}</small></span>
      </div>
      <a href={searchUrls.youtube} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Pesquisar no YouTube</a>
      <a href={searchUrls.tiktok} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Pesquisar no TikTok</a>
      <button type="button" onClick={() => setFormOpen((current) => !current)}><Plus size={17} /> Registrar vídeo</button>
    </section>

    {formOpen && <section className="creator-source-form">
      <div className="creator-form-intro">
        <div><strong>Registrar ficha mostrada no vídeo</strong><span>Confirme a versão da carta e copie cada bloco exatamente como aparece.</span></div>
        <div className="creator-form-intro-actions">
          <input ref={screenshotInputRef} type="file" accept="image/*" hidden onChange={(event: ChangeEvent<HTMLInputElement>) => void readBuildScreenshot(event)} />
          <button type="button" disabled={ocrBusy} onClick={() => screenshotInputRef.current?.click()}>{ocrBusy ? <Loader2 size={16} className="spin" /> : <ImagePlus size={16} />} Ler print do vídeo</button>
          <button type="button" onClick={useCurrentBuildAsDraft}><ScanText size={16} /> Usar ficha atual</button>
        </div>
      </div>

      <div className="creator-form-grid">
        <label className="span-2">Link do vídeo<input value={draft.url} onChange={(event: ChangeEvent<HTMLInputElement>) => updateDraft('url', event.target.value)} placeholder="https://www.youtube.com/watch?v=..." inputMode="url" /></label>
        <label>Plataforma<select value={draft.platform} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateDraft('platform', event.target.value as CreatorPlatform)}>{Object.entries(PLATFORM_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Canal ou criador<input value={draft.channel} onChange={(event: ChangeEvent<HTMLInputElement>) => updateDraft('channel', event.target.value)} placeholder="Nome do canal" /></label>
        <label className="span-2">Título do vídeo<input value={draft.title} onChange={(event: ChangeEvent<HTMLInputElement>) => updateDraft('title', event.target.value)} /></label>
        <label>Autoridade<select value={draft.authority} onChange={(event: ChangeEvent<HTMLSelectElement>) => setDraft((current) => ({ ...current, authority: event.target.value as CreatorAuthority, verifiedProId: event.target.value === 'PRO_PLAYER' ? current.verifiedProId : '' }))}>{Object.entries(AUTHORITY_LABELS).map(([value, label]) => <option key={value} value={value} disabled={value === 'PRO_PLAYER' && !draft.verifiedProId}>{label}{value === 'PRO_PLAYER' && !draft.verifiedProId ? ' (use o índice)' : ''}</option>)}</select></label>
        <label>Plataforma de jogo<select value={draft.device} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateDraft('device', event.target.value as CreatorDevice)}>{Object.entries(DEVICE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>País/região<input value={draft.country} onChange={(event: ChangeEvent<HTMLInputElement>) => updateDraft('country', event.target.value)} placeholder="Brasil, Japão..." /></label>
        <label>Data do vídeo<input type="date" value={draft.publishedAt || ''} onChange={(event: ChangeEvent<HTMLInputElement>) => updateDraft('publishedAt', event.target.value || null)} /></label>
        <label>Posição usada<select value={draft.targetPosition} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateDraft('targetPosition', event.target.value as PositionCode)}>{POSITION_OPTIONS.map((position) => <option key={position.value} value={position.value}>{position.label}</option>)}</select></label>
        <label>Estilo/função usada<input value={draft.playstyle} onChange={(event: ChangeEvent<HTMLInputElement>) => updateDraft('playstyle', event.target.value)} placeholder="Ex.: SA infiltrador" /></label>
        <label>Nível da evidência<select value={draft.evidenceLevel} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateDraft('evidenceLevel', event.target.value as CreatorEvidenceLevel)}>{Object.entries(EVIDENCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Tipo de prova<select value={draft.proofType} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateDraft('proofType', event.target.value as CreatorProofType)}>{Object.entries(PROOF_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="span-2">Torneio/contexto<input value={draft.tournament} onChange={(event: ChangeEvent<HTMLInputElement>) => updateDraft('tournament', event.target.value)} placeholder="Ex.: World Finals 2026, ranking global, treino em live" /></label>
      </div>

      <div className="creator-card-identity-grid">
        <label>Jogador<input value={draft.card.playerName} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft((current) => ({ ...current, card: { ...current.card, playerName: event.target.value } }))} /></label>
        <label>Tipo da carta<input value={draft.card.cardType} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft((current) => ({ ...current, card: { ...current.card, cardType: event.target.value } }))} /></label>
        <label>Edição/tag<input value={draft.card.specialTag} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft((current) => ({ ...current, card: { ...current.card, specialTag: event.target.value } }))} placeholder="Epic, Big Time, Showtime..." /></label>
        <label>Overall máximo<input type="number" min="1" max="120" value={draft.card.maxOverall ?? ''} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft((current) => ({ ...current, card: { ...current.card, maxOverall: event.target.value ? Number(event.target.value) : null } }))} /></label>
        <label>Pontos disponíveis<input type="number" min="1" max="120" value={draft.card.trainingPointsTotal ?? ''} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft((current) => ({ ...current, card: { ...current.card, trainingPointsTotal: event.target.value ? Number(event.target.value) : null } }))} /></label>
        <label className="creator-tested-check"><input type="checkbox" checked={draft.testedInMatches} onChange={(event: ChangeEvent<HTMLInputElement>) => updateDraft('testedInMatches', event.target.checked)} /><span>O criador testou em partidas</span></label>
      </div>

      <div className="creator-training-editor">
        <div className="creator-editor-heading"><strong>Blocos da ficha</strong><span>Custo real: {draftCost.totalCost}/{draft.card.trainingPointsTotal ?? result.trainingPointsTotal} pontos</span></div>
        <div className="creator-training-grid">{CREATOR_TRAINING_KEYS.map((key) => <label key={key}><span>{CREATOR_TRAINING_LABELS[key]}</span><input type="number" min="0" max="16" value={draft.training[key]} onChange={(event: ChangeEvent<HTMLInputElement>) => updateTraining(key, event.target.value)} /><small>{draftCost.costByBlock[key]} pts reais</small></label>)}</div>
      </div>

      <div className="creator-complete-build-editor">
        <div className="creator-editor-heading"><strong>Ficha completa do pro player</strong><span>Esses campos permitem comparar progressão, Top 5 e Ímpeto juntos.</span></div>
        <label>Habilidades adicionais mostradas<input value={draft.skills.join(', ')} onChange={(event: ChangeEvent<HTMLInputElement>) => updateDraft('skills', event.target.value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 10))} placeholder="Passe de primeira, Interceptação, Espírito guerreiro..." /></label>
        <label>Ímpeto mostrado<input value={draft.impeto} onChange={(event: ChangeEvent<HTMLInputElement>) => updateDraft('impeto', event.target.value)} placeholder="Nome exato do Ímpeto" /></label>
      </div>

      <label className="creator-notes-field">Observações<textarea value={draft.notes} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateDraft('notes', event.target.value)} placeholder="O que o criador explicou? A ficha foi testada? Qual ponto forte e qual fraqueza?" rows={3} /></label>
      <div className="creator-form-actions"><button type="button" onClick={() => setFormOpen(false)}>Cancelar</button><button type="button" className="primary" onClick={saveSource}><ShieldCheck size={16} /> Salvar fonte auditável</button></div>
    </section>}

    <section className="creator-consensus-overview">
      <article className={`creator-confidence-card confidence-${consensus.confidenceLabel.replace(' ', '-')}`}>
        <span>Confiança do consenso</span><strong>{consensus.confidence}%</strong><small>{consensus.confidenceLabel}</small>
      </article>
      <article><span>Fontes aceitas</span><strong>{consensus.sourceCount}</strong><small>{consensus.exactCardCount} da carta exata</small></article>
      <article><span>Pro/ranking alto</span><strong>{consensus.proSourceCount}</strong><small>peso maior no consenso</small></article>
      <article><span>Custo da ficha</span><strong>{consensus.totalCost}</strong><small>de {result.trainingPointsTotal} pontos</small></article>
    </section>

    <p className="panel-note"><b>{consensus.verdict}</b></p>
    {consensus.warnings.map((warning) => <p key={warning} className="creator-warning"><TriangleAlert size={15} /> {warning}</p>)}

    <section className="creator-consensus-section">
      <div className="section-title-row"><div><p className="kicker">Ficha mais repetida</p><h4>Consenso ponderado por bloco</h4></div><button type="button" onClick={() => void copyConsensus()} disabled={!consensus.sourceCount}><ClipboardCopy size={16} /> Copiar</button></div>
      <div className="creator-consensus-grid">{consensus.blocks.map((block) => <article key={block.key}>
        <span>{block.label}</span><strong>{block.value}</strong><small>{block.sampleCount ? `faixa ${block.min}–${block.max}` : 'sem dados'}</small><i><b style={{ width: `${block.agreement}%` }} /></i><em>{block.agreement}% de acordo</em>
      </article>)}</div>
    </section>

    {consensus.acceptedSources.length > 0 && <section className="creator-comparison-section">
      <div className="section-title-row"><div><p className="kicker"><BarChart3 size={14} /> Comparação completa</p><h4>Cada vídeo contra a ficha do BuildMaster</h4></div><span>{consensus.acceptedSources.length} fonte(s)</span></div>
      <div className="creator-comparison-scroll">
        <table className="creator-comparison-table"><thead><tr><th>Fonte</th>{CREATOR_TRAINING_KEYS.map((key) => <th key={key}>{CREATOR_TRAINING_LABELS[key]}</th>)}<th>Custo</th><th></th></tr></thead><tbody>
          <tr className="creator-app-row"><td><strong>BuildMaster atual</strong><small>Referência local</small></td>{CREATOR_TRAINING_KEYS.map((key) => <td key={key}><b>{result.training[key]}</b></td>)}<td>{result.trainingPointsUsed}</td><td></td></tr>
          {consensus.acceptedSources.map((match) => {
            const cost = creatorTrainingCost(match.source.training).totalCost;
            return <tr key={match.source.id}><td><a href={match.source.url} target="_blank" rel="noreferrer"><strong>{match.source.channel}</strong><small>{PLATFORM_LABELS[match.source.platform]} • compatibilidade {match.score}%</small></a></td>{CREATOR_TRAINING_KEYS.map((key) => <td key={key}><b>{match.source.training[key]}</b><small>{blockDifference(match.source.training[key], result.training[key])}</small></td>)}<td>{cost}</td><td><button type="button" onClick={() => removeSource(match.source.id)} aria-label={`Remover fonte ${match.source.channel}`}><Trash2 size={15} /></button></td></tr>;
          })}
        </tbody></table>
      </div>
    </section>}

    <section className="creator-source-list-section">
      <div className="section-title-row"><div><p className="kicker">Biblioteca da conta</p><h4>Fontes registradas para este jogador</h4></div><span>{consensus.sources.length}</span></div>
      <div className="creator-source-grid">{consensus.sources.map((match) => <article key={match.source.id} className={match.score >= 62 ? 'is-compatible' : 'is-rejected'}>
        <div className="creator-source-head"><span>{PLATFORM_LABELS[match.source.platform]}</span><em>{match.score}% compatível</em></div>
        <h5>{match.source.title}</h5><p>{match.source.channel} • {AUTHORITY_LABELS[match.source.authority]} • {DEVICE_LABELS[match.source.device]}</p>
        <div className="creator-source-build-completeness"><span>{EVIDENCE_LABELS[match.source.evidenceLevel]}</span><span>{PROOF_LABELS[match.source.proofType]}</span>{match.source.tournament && <span>{match.source.tournament}</span>}</div>
        {match.source.skills.length > 0 && <p><b>Habilidades:</b> {match.source.skills.join(', ')}</p>}
        {match.source.impeto && <p><b>Ímpeto:</b> {match.source.impeto}</p>}
        <div className="creator-source-signals">{match.reasons.slice(0, 4).map((reason) => <small key={reason}><CheckCircle2 size={12} /> {reason}</small>)}{match.warnings.slice(0, 3).map((warning) => <small key={warning} className="warning"><TriangleAlert size={12} /> {warning}</small>)}</div>
        <div className="creator-source-footer"><a href={match.source.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Abrir vídeo</a><button type="button" onClick={() => removeSource(match.source.id)}><Trash2 size={14} /> Excluir</button></div>
      </article>)}</div>
      {!consensus.sources.length && <div className="creator-empty-state"><Search size={24} /><strong>Nenhum vídeo registrado para esta carta</strong><span>Pesquise, confira a carta exata e registre os blocos mostrados pelo criador.</span></div>}
    </section>

    {status && <p className="creator-status" role="status">{status}</p>}
    <details className="settings-details-card"><summary>Como o módulo evita fichas erradas</summary><p className="panel-note">Ele compara nome, tipo da carta, edição especial, posição original, overall máximo e quantidade de pontos. Fontes abaixo de 62% não entram no consenso. Pro players e ranking alto recebem peso maior, mas não anulam divergências entre os blocos.</p></details>
  </article>;
}
