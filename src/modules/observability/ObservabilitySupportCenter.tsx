'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Download, Gauge, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import {
  buildObservabilitySnapshot,
  clearObservabilityEvents,
  createObservabilitySupportBundle,
  OBSERVABILITY_EVENT,
  readFeatureFlags,
  readObservabilityEvents,
  saveFeatureFlags,
  type FeatureFlagId,
  type FeatureFlagState,
  type ObservabilitySnapshot
} from './observabilityEngine';

const FLAG_META: Array<{ id: FeatureFlagId; label: string; detail: string }> = [
  { id: 'ocrVision2', label: 'OCR Vision 2.0', detail: 'Leitura avançada e segunda passagem.' },
  { id: 'tacticalStudio2', label: 'Estúdio Tático 2.0', detail: 'Sequências, animação e exportação.' },
  { id: 'opponentAssistant', label: 'Assistente de adversário', detail: 'Planos A, B e C.' },
  { id: 'antiDelay', label: 'Central anti-delay', detail: 'Diagnóstico de rede e aparelho.' },
  { id: 'smartCoach', label: 'Treinador inteligente', detail: 'Plano semanal adaptativo.' },
  { id: 'community', label: 'Inteligência de criadores', detail: 'Fontes e consenso externo.' }
];

function downloadJson(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ObservabilitySupportCenter({ appVersion, health, integrity }: { appVersion: string; health?: unknown; integrity?: unknown }) {
  const [snapshot, setSnapshot] = useState<ObservabilitySnapshot>(() => buildObservabilitySnapshot());
  const [flags, setFlags] = useState<FeatureFlagState>(() => readFeatureFlags());
  const [status, setStatus] = useState('Diagnóstico local pronto. Nenhum dado é enviado automaticamente.');
  const latest = useMemo(() => snapshot.recent.slice(0, 12), [snapshot.recent]);

  function refresh() {
    setFlags(readFeatureFlags());
    setSnapshot(buildObservabilitySnapshot(readObservabilityEvents(), readFeatureFlags()));
  }

  useEffect(() => {
    const update = () => refresh();
    window.addEventListener(OBSERVABILITY_EVENT, update);
    return () => window.removeEventListener(OBSERVABILITY_EVENT, update);
  }, []);

  function toggleFlag(id: FeatureFlagId) {
    const next = saveFeatureFlags({ ...flags, [id]: !flags[id] });
    setFlags(next);
    setSnapshot(buildObservabilitySnapshot(readObservabilityEvents(), next));
    setStatus(`${FLAG_META.find((item) => item.id === id)?.label ?? id}: ${next[id] ? 'ativado' : 'desativado'} localmente.`);
  }

  function exportBundle() {
    const content = createObservabilitySupportBundle({ version: appVersion, snapshot, health, integrity });
    downloadJson(`buildmaster-suporte-${appVersion}-${new Date().toISOString().slice(0, 10)}.json`, content);
    setStatus('Pacote de suporte exportado com dados sensíveis removidos.');
  }

  return <section className="bm2970-observability luxury-panel" aria-labelledby="bm2970-observability-title">
    <header className="bm2970-heading">
      <div><p className="kicker"><Activity size={15}/> Observabilidade e suporte</p><h3 id="bm2970-observability-title">Saúde da versão e diagnóstico técnico</h3><span>Registra falhas, lentidão e módulos opcionais somente neste aparelho, com proteção de dados.</span></div>
      <div className={`bm2970-score status-${snapshot.status}`}><strong>{snapshot.score}</strong><span>/100</span><small>{snapshot.status === 'healthy' ? 'saudável' : snapshot.status === 'attention' ? 'atenção' : 'crítico'}</small></div>
    </header>

    <div className="bm2970-metrics">
      <article><Activity size={19}/><span>Eventos</span><strong>{snapshot.total}</strong><small>máximo de 300 locais</small></article>
      <article><AlertTriangle size={19}/><span>Falhas críticas</span><strong>{snapshot.errors}</strong><small>sem conteúdo pessoal</small></article>
      <article><Gauge size={19}/><span>Tarefas longas</span><strong>{snapshot.longTasks}</strong><small>acima de 120 ms</small></article>
      <article><ShieldCheck size={19}/><span>Módulos ativos</span><strong>{Object.values(flags).filter(Boolean).length}/{Object.keys(flags).length}</strong><small>controle de emergência</small></article>
    </div>

    <div className="bm2970-observability-grid">
      <article className="bm2970-card">
        <div className="bm2970-card-title"><Gauge size={18}/><div><strong>Áreas com maior duração registrada</strong><span>Média local das amostras disponíveis.</span></div></div>
        <div className="bm2970-slow-list">{snapshot.slowestAreas.map((item) => <div key={item.area}><span><strong>{item.area}</strong><small>{item.samples} amostra(s)</small></span><b>{item.averageMs} ms</b></div>)}{!snapshot.slowestAreas.length && <p>Ainda não há duração suficiente para comparar áreas.</p>}</div>
      </article>

      <article className="bm2970-card">
        <div className="bm2970-card-title"><ShieldCheck size={18}/><div><strong>Feature flags locais</strong><span>Desative apenas módulos opcionais que estejam causando problema.</span></div></div>
        <div className="bm2970-flags">{FLAG_META.map((item) => <label key={item.id}><input type="checkbox" checked={flags[item.id]} onChange={() => toggleFlag(item.id)}/><span><strong>{item.label}</strong><small>{item.detail}</small></span><em>{flags[item.id] ? 'Ativo' : 'Pausado'}</em></label>)}</div>
        <p className="bm2970-privacy"><AlertTriangle size={15}/> Login, backup, restauração e atualização nunca são desativados por este painel.</p>
      </article>
    </div>

    <article className="bm2970-card">
      <div className="bm2970-card-title"><Activity size={18}/><div><strong>Eventos recentes</strong><span>Mensagens resumidas e sanitizadas para diagnóstico.</span></div></div>
      <div className="bm2970-event-list">{latest.map((item) => <div key={item.id} className={`level-${item.level}`}><span>{item.level === 'critical' ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}</span><div><strong>{item.area} • {item.code}</strong><small>{item.message}</small></div><time>{new Date(item.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>{item.durationMs !== null && <b>{item.durationMs} ms</b>}</div>)}{!latest.length && <p>Nenhum evento técnico registrado.</p>}</div>
    </article>

    <div className="bm2970-support-actions">
      <button type="button" className="elite-button" onClick={exportBundle}><Download size={16}/> Exportar pacote de suporte</button>
      <button type="button" onClick={() => { refresh(); setStatus('Diagnóstico atualizado.'); }}><RefreshCw size={16}/> Atualizar diagnóstico</button>
      <button type="button" className="bm2970-subtle-danger" disabled={!snapshot.total} onClick={() => { clearObservabilityEvents(); refresh(); setStatus('Histórico técnico local removido.'); }}><Trash2 size={16}/> Limpar eventos</button>
      <span role="status">{status}</span>
    </div>
  </section>;
}
