'use client';

import { useMemo, useState } from 'react';
import { BookOpenCheck, ExternalLink, Filter, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';
import { buildCommunityIntelligence, type CommunityCategory, type CommunityConfidence, type CommunityAuthority } from '@/lib/communityIntelligence';

type View = 'recomendadas' | 'oficial' | 'consenso' | 'todas' | 'fontes';

const CATEGORY_LABELS: Record<CommunityCategory, string> = {
  FICHA: 'Ficha', ATAQUE: 'Ataque', DEFESA: 'Defesa', DRIBLE: 'Drible', TATICA: 'Tática', FORMACAO: 'Formação', HABILIDADE: 'Habilidades', TREINO: 'Treino', DELAY: 'Delay', CONFIGURACAO: 'Configuração'
};
const CONFIDENCE_LABELS: Record<CommunityConfidence, string> = {
  muito_alta: 'muito alta', alta: 'alta', media: 'média', baixa: 'baixa', controversa: 'controversa'
};
const AUTHORITY_LABELS: Record<CommunityAuthority, string> = {
  OFICIAL: 'Oficial', PRO_PLAYER: 'Pro player', CRIADOR: 'Criador', COMUNIDADE: 'Comunidade'
};

export function CommunityIntelligencePanel({ result }: { result: AnalysisResult }) {
  const report = useMemo(() => buildCommunityIntelligence(result), [result]);
  const [view, setView] = useState<View>('recomendadas');
  const [category, setCategory] = useState<'TODAS' | CommunityCategory>('TODAS');
  const [query, setQuery] = useState('');

  const base = view === 'recomendadas'
    ? report.recommended
    : view === 'oficial'
      ? report.officialMechanics
      : view === 'consenso'
        ? report.strongConsensus
        : report.allTips.map((tip) => ({ ...tip, score: 0, matchReasons: [], sourceCount: tip.sourceIds.length }));

  const tips = useMemo(() => base.filter((tip) => {
    if (category !== 'TODAS' && tip.category !== category) return false;
    const haystack = `${tip.title} ${tip.summary} ${tip.tags.join(' ')}`.toLocaleLowerCase('pt-BR');
    return !query.trim() || haystack.includes(query.trim().toLocaleLowerCase('pt-BR'));
  }), [base, category, query]);

  const sourceById = useMemo(() => new Map(report.sources.map((source) => [source.id, source])), [report.sources]);

  return <article className="luxury-panel wide-card community-intelligence-card">
    <div className="section-title-row">
      <div>
        <p className="kicker">v26.60 • Inteligência de pro players e criadores</p>
        <h3>Central de conhecimento competitivo 2026</h3>
      </div>
      <span>{report.sources.length} fontes</span>
    </div>
    <p className="panel-note">{report.verdict}</p>

    <div className="health-score-grid community-score-grid">
      <article><strong>{report.allTips.length}</strong><span>Dicas normalizadas</span></article>
      <article><strong>{report.officialMechanics.length}</strong><span>Mecânicas oficiais</span></article>
      <article><strong>{report.strongConsensus.length}</strong><span>Consensos fortes</span></article>
      <article><strong>{report.coverage.length}</strong><span>Áreas do app</span></article>
    </div>

    <div className="community-tabs" role="tablist" aria-label="Conteúdo da comunidade">
      <button type="button" className={view === 'recomendadas' ? 'active' : ''} onClick={() => setView('recomendadas')}><Sparkles size={15}/> Para esta carta</button>
      <button type="button" className={view === 'oficial' ? 'active' : ''} onClick={() => setView('oficial')}><ShieldCheck size={15}/> Oficial</button>
      <button type="button" className={view === 'consenso' ? 'active' : ''} onClick={() => setView('consenso')}><UsersRound size={15}/> Consenso</button>
      <button type="button" className={view === 'todas' ? 'active' : ''} onClick={() => setView('todas')}><BookOpenCheck size={15}/> Todas</button>
      <button type="button" className={view === 'fontes' ? 'active' : ''} onClick={() => setView('fontes')}><ExternalLink size={15}/> Fontes</button>
    </div>

    {view !== 'fontes' && <>
      <div className="community-filter-bar">
        <label><Filter size={15}/> Área<select value={category} onChange={(event) => setCategory(event.target.value as 'TODAS' | CommunityCategory)}><option value="TODAS">Todas</option>{report.coverage.map((item) => <option key={item.category} value={item.category}>{CATEGORY_LABELS[item.category]} ({item.count})</option>)}</select></label>
        <label>Pesquisar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: Match-up, Blitz Curler, 4-2-2-2..." /></label>
      </div>

      <div className="community-tip-grid">
        {tips.map((tip) => <article key={tip.id} className={`community-tip-card authority-${tip.authority.toLocaleLowerCase('pt-BR')}`}>
          <div className="community-tip-head"><span>{CATEGORY_LABELS[tip.category]}</span><em>{AUTHORITY_LABELS[tip.authority]} • confiança {CONFIDENCE_LABELS[tip.confidence]}</em></div>
          <h4>{tip.title}</h4>
          <p>{tip.summary}</p>
          {tip.matchReasons.length > 0 && <div className="community-match-reasons">{tip.matchReasons.map((reason) => <small key={reason}>✓ {reason}</small>)}</div>}
          {tip.drill && <div className="community-drill"><strong>Treino prático</strong><span>{tip.drill}</span></div>}
          {tip.avoidWhen?.map((warning) => <small key={warning} className="community-warning">⚠ {warning}</small>)}
          <div className="chip-cloud">{tip.tags.slice(0,6).map((tag) => <span key={tag}>{tag}</span>)}</div>
          <details><summary>{tip.sourceIds.length} fonte(s) utilizada(s)</summary>{tip.sourceIds.map((sourceId) => {
            const source = sourceById.get(sourceId);
            return source ? <a key={source.id} href={source.url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>{source.title}</a> : null;
          })}</details>
        </article>)}
      </div>
      {!tips.length && <p className="panel-note">Nenhuma dica corresponde a todos os filtros atuais.</p>}
    </>}

    {view === 'fontes' && <div className="community-source-list">
      {report.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="community-source-card">
        <div><strong>{source.title}</strong><span>{source.platform} • {AUTHORITY_LABELS[source.authority]}{source.subject ? ` • ${source.subject}` : ''}</span></div>
        <p>{source.note}</p><small>Revisada em {source.reviewedAt}</small><ExternalLink size={16}/>
      </a>)}
    </div>}

    <details className="settings-details-card">
      <summary>Conflitos e opiniões que não devem virar regra automática</summary>
      <div className="dna-goal-list">{report.conflicts.map((item) => <div key={item.title}><strong>{item.title}</strong><small>{item.explanation}</small></div>)}</div>
    </details>
    <details className="settings-details-card">
      <summary>Proteções da central</summary>
      {report.safeguards.map((item) => <p key={item} className="panel-note">• {item}</p>)}
    </details>
    <p className="panel-note"><b>{report.snapshotLabel}</b>. Como o jogo e o conteúdo competitivo mudam, este pacote deve ser revisado após atualizações importantes.</p>
  </article>;
}
