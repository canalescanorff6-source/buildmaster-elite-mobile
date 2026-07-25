'use client';

import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Copy, Download, FileUp, Library, MessageSquare, PackagePlus, ShieldCheck, Star, UserRound } from 'lucide-react';
import {
  addCommunityPackage, addCommunityRating, createCommunitySharePackage, decideCommunityImport, exportCommunityState,
  queueCommunityImport, readCommunityState, reportCommunityPackage, updateCommunityProfile, type CommunityShareKind,
  type CommunityVisibility
} from './communitySharing';

const KIND_LABELS: Record<CommunityShareKind, string> = {
  player_build: 'Ficha de jogador', formation: 'Formação', training_plan: 'Plano de treino', opponent_plan: 'Plano contra adversário', tactical_sequence: 'Sequência tática'
};

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

export function CommunitySharingCenter({ preparePayload, canPublish = false, publicationLimit = 0 }: {
  preparePayload?: (kind: CommunityShareKind) => unknown;
  canPublish?: boolean;
  publicationLimit?: number;
}) {
  const [state, setState] = useState(() => readCommunityState());
  const [tab, setTab] = useState<'create' | 'library' | 'review' | 'profile'>('create');
  const [kind, setKind] = useState<CommunityShareKind>('player_build');
  const [visibility, setVisibility] = useState<CommunityVisibility>('private');
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const publicCount = useMemo(() => state.packages.filter((pkg) => pkg.visibility === 'community').length, [state.packages]);

  function createPackage(): void {
    const effectiveVisibility: CommunityVisibility = visibility === 'community' && (!canPublish || publicCount >= publicationLimit) ? 'unlisted' : visibility;
    const pkg = createCommunitySharePackage({ kind, title: title || KIND_LABELS[kind], description, visibility: effectiveVisibility, author: { id: state.profile.id, displayName: state.profile.displayName }, payload: preparePayload?.(kind) ?? { kind, notice: 'Conteúdo preparado manualmente.' }, expiresInDays: effectiveVisibility === 'private' ? 7 : 30 });
    setState(addCommunityPackage(pkg)); downloadJson(`${pkg.code}.buildmaster-share.json`, pkg); setMessage(effectiveVisibility !== visibility ? 'Pacote criado como não listado porque o plano atual não permite nova publicação comunitária.' : 'Pacote criado. Nada foi publicado ou importado sem confirmação.');
  }
  async function importFile(file: File | null): Promise<void> {
    if (!file) return;
    try { const review = queueCommunityImport(JSON.parse(await file.text())); setState(readCommunityState()); setTab('review'); setMessage(`Pacote ${review.package.title} colocado em revisão. Nenhum dado atual foi substituído.`); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Não foi possível importar.'); }
  }

  return <section className="bm2980-center community-sharing-center" aria-label="Compartilhamento e comunidade">
    <header className="bm2980-hero"><div><span className="bm2980-eyebrow">Bloco 25</span><h2>Compartilhamento e comunidade</h2><p>Crie códigos verificáveis, revise importações e mantenha sua biblioteca sem sobrescrever dados atuais.</p></div><ShieldCheck aria-hidden="true" /></header>
    <nav className="bm2980-tabs" aria-label="Áreas da comunidade">
      <button type="button" className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}><PackagePlus size={17} />Criar</button>
      <button type="button" className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}><Library size={17} />Biblioteca</button>
      <button type="button" className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}><FileUp size={17} />Revisão ({state.reviews.filter((item) => item.status === 'review').length})</button>
      <button type="button" className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}><UserRound size={17} />Perfil</button>
    </nav>
    {message && <div className="bm2980-notice" role="status">{message}</div>}

    {tab === 'create' && <div className="bm2980-grid two">
      <article className="bm2980-card"><h3>Novo pacote</h3><label>Tipo<select value={kind} onChange={(event) => setKind(event.target.value as CommunityShareKind)}>{Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder={KIND_LABELS[kind]} /></label><label>Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} /></label><label>Visibilidade<select value={visibility} onChange={(event) => setVisibility(event.target.value as CommunityVisibility)}><option value="private">Privado</option><option value="unlisted">Não listado</option><option value="community">Comunidade moderada</option></select></label><button type="button" className="bm2980-primary" onClick={createPackage}><Download size={17} />Gerar e baixar pacote</button></article>
      <article className="bm2980-card"><h3>Proteções</h3><ul><li>Checksum identifica alterações no arquivo.</li><li>Senhas, tokens, sessões, e-mails e imagens embutidas são removidos.</li><li>Importações entram em revisão e nunca sobrescrevem automaticamente.</li><li>Publicações comunitárias dependem do plano e de moderação.</li></ul><p><strong>{publicCount}</strong> de <strong>{publicationLimit}</strong> publicações comunitárias no plano atual.</p><button type="button" onClick={() => fileRef.current?.click()}><FileUp size={17} />Importar pacote para revisão</button><input ref={fileRef} hidden type="file" accept=".json,application/json" onChange={(event) => void importFile(event.currentTarget.files?.[0] || null)} /></article>
    </div>}

    {tab === 'library' && <div className="bm2980-list">{state.packages.length === 0 ? <div className="bm2980-empty">Nenhum pacote salvo.</div> : state.packages.map((pkg) => <article className="bm2980-card" key={pkg.id}><div className="bm2980-card-head"><div><small>{KIND_LABELS[pkg.kind]} · {pkg.visibility}</small><h3>{pkg.title}</h3></div><CheckCircle2 size={20} /></div><p>{pkg.description || 'Sem descrição.'}</p><code>{pkg.code}</code><div className="bm2980-actions"><button type="button" onClick={() => void navigator.clipboard?.writeText(pkg.code)}><Copy size={16} />Copiar código</button><button type="button" onClick={() => downloadJson(`${pkg.code}.json`, pkg)}><Download size={16} />Exportar</button><button type="button" onClick={() => setState(addCommunityRating(pkg.id, 5, 'Avaliação local'))}><Star size={16} />Avaliar</button><button type="button" onClick={() => setState(reportCommunityPackage(pkg.id, 'Revisão solicitada pelo usuário'))}><MessageSquare size={16} />Denunciar</button></div></article>)}</div>}

    {tab === 'review' && <div className="bm2980-list">{state.reviews.length === 0 ? <div className="bm2980-empty">Nenhuma importação aguardando revisão.</div> : state.reviews.map((review) => <article className="bm2980-card" key={review.id}><small>{review.status}</small><h3>{review.package.title}</h3><p>{KIND_LABELS[review.package.kind]} · autor {review.package.author.displayName}</p>{review.warnings.map((warning) => <p className="bm2980-warning" key={warning}>{warning}</p>)}{review.status === 'review' && <div className="bm2980-actions"><button type="button" className="bm2980-primary" onClick={() => setState(decideCommunityImport(review.id, true))}>Aceitar na biblioteca</button><button type="button" onClick={() => setState(decideCommunityImport(review.id, false))}>Rejeitar</button></div>}</article>)}</div>}

    {tab === 'profile' && <div className="bm2980-grid two"><article className="bm2980-card"><h3>Perfil de criador</h3><label>Nome<input value={state.profile.displayName} onChange={(event) => setState(updateCommunityProfile({ displayName: event.target.value }))} maxLength={80} /></label><label>Biografia<textarea value={state.profile.bio} onChange={(event) => setState(updateCommunityProfile({ bio: event.target.value }))} maxLength={300} /></label><label className="bm2980-check"><input type="checkbox" checked={state.profile.creator} onChange={(event) => setState(updateCommunityProfile({ creator: event.target.checked }))} />Quero organizar conteúdo como criador</label></article><article className="bm2980-card"><h3>Dados locais</h3><p>{state.packages.length} pacotes · {state.ratings.length} avaliações · {state.comments.length} comentários · {state.reports.length} denúncias.</p><button type="button" onClick={() => downloadJson('buildmaster-comunidade.json', exportCommunityState())}><Download size={17} />Exportar dados da comunidade</button><p className="bm2980-muted">A interface desta versão trabalha localmente. A publicação multiusuário exige aplicar a migração Supabase e conectar as operações ao backend.</p></article></div>}
  </section>;
}
