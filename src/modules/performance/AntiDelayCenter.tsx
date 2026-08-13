'use client';

import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Battery, CheckCircle2, Cpu, Download, Gauge, Network, RefreshCw, Save, Signal, Thermometer, Trash2, Wifi } from 'lucide-react';
import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';
import { COMPETITIVE_MATCH_STORAGE_KEY, type CompetitiveMatchRecord } from '@/modules/matches/competitivePerformanceEngine';
import {
  ANTI_DELAY_LINK_STORAGE_KEY,
  ANTI_DELAY_PROFILE_STORAGE_KEY,
  ANTI_DELAY_STORAGE_KEY,
  CONNECTION_LABELS,
  createAntiDelaySample,
  diagnoseAntiDelay,
  linkSampleToMatch,
  normalizeAntiDelayProfile,
  runHttpLatencyProbe,
  summarizeAntiDelayHistory,
  type AntiDelayMatchLink,
  type AntiDelayProfile,
  type AntiDelaySample,
  type ConnectionKind,
  type ThermalLevel
} from './antiDelayEngine';

type Tab = 'diagnostico' | 'preparacao' | 'historico';

type NetworkInformationLike = {
  effectiveType?: string;
  downlink?: number;
  type?: string;
};

type NavigatorWithConnection = Navigator & { connection?: NetworkInformationLike; mozConnection?: NetworkInformationLike; webkitConnection?: NetworkInformationLike };

function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function currentDeviceLabel() {
  if (typeof navigator === 'undefined') return 'Aparelho atual';
  const android = navigator.userAgent.match(/Android[^;)]*/i)?.[0] || '';
  return `${navigator.platform || 'Android'}${android ? ` • ${android}` : ''}`.slice(0, 120);
}

function connectionSnapshot() {
  if (typeof navigator === 'undefined') return { kind: 'unknown' as ConnectionKind, downlink: null as number | null, label: 'Não identificada' };
  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const rawType = String(connection?.type || '').toLowerCase();
  const kind: ConnectionKind = rawType === 'wifi' ? 'wifi-5ghz' : rawType === 'ethernet' ? 'ethernet' : rawType === 'cellular' ? 'mobile' : 'unknown';
  return { kind, downlink: typeof connection?.downlink === 'number' ? connection.downlink : null, label: connection?.effectiveType || CONNECTION_LABELS[kind] };
}

export function AntiDelayCenter({ competitiveMatches }: { competitiveMatches?: CompetitiveMatchRecord[] } = {}) {
  const detected = useMemo(connectionSnapshot, []);
  const [storedMatches] = useState<CompetitiveMatchRecord[]>(() => safeStorageGetJson<CompetitiveMatchRecord[]>(COMPETITIVE_MATCH_STORAGE_KEY, []));
  const matches = competitiveMatches ?? storedMatches;
  const [tab, setTab] = useState<Tab>('diagnostico');
  const [samples, setSamples] = useState<AntiDelaySample[]>(() => safeStorageGetJson<AntiDelaySample[]>(ANTI_DELAY_STORAGE_KEY, []));
  const [links, setLinks] = useState<AntiDelayMatchLink[]>(() => safeStorageGetJson<AntiDelayMatchLink[]>(ANTI_DELAY_LINK_STORAGE_KEY, []));
  const [profile, setProfile] = useState<AntiDelayProfile>(() => normalizeAntiDelayProfile(safeStorageGetJson<Partial<AntiDelayProfile> | null>(ANTI_DELAY_PROFILE_STORAGE_KEY, null)));
  const [probing, setProbing] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    deviceLabel: profile.deviceLabel || currentDeviceLabel(),
    connectionKind: profile.connectionKind === 'unknown' ? detected.kind : profile.connectionKind,
    pingMs: 60,
    jitterMs: 8,
    packetLossPct: 0,
    downlinkMbps: detected.downlink ?? 0,
    signalQuality: 75,
    batteryPct: 70,
    batterySaver: false,
    memoryFreeGb: 2,
    thermalLevel: 2 as ThermalLevel,
    backgroundLoad: 2,
    perceivedDelay: 2 as ThermalLevel,
    source: 'manual' as 'manual' | 'http-probe' | 'mixed'
  });
  const latest = samples[0] || null;
  const diagnosis = useMemo(() => latest ? diagnoseAntiDelay(latest) : null, [latest]);
  const history = useMemo(() => summarizeAntiDelayHistory(samples, links), [samples, links]);
  const latestMatch = useMemo(() => [...matches].sort((a, b) => b.playedAt.localeCompare(a.playedAt))[0] || null, [matches]);

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function runProbe() {
    setProbing(true);
    setMessage('Executando seis amostras HTTP locais…');
    try {
      const result = await runHttpLatencyProbe();
      setForm((current) => ({ ...current, pingMs: result.pingMs, jitterMs: result.jitterMs, packetLossPct: result.packetLossPct, source: 'mixed' }));
      setMessage(`${result.successes}/${result.attempts} respostas recebidas. Revise temperatura, memória e bateria antes de salvar.`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Não foi possível concluir o teste HTTP.');
    } finally {
      setProbing(false);
    }
  }

  function saveProfile(next: AntiDelayProfile) {
    const normalized = normalizeAntiDelayProfile(next);
    setProfile(normalized);
    safeStorageSetJson(ANTI_DELAY_PROFILE_STORAGE_KEY, normalized);
  }

  function saveSample() {
    const sample = createAntiDelaySample({
      ...form,
      connectionKind: form.connectionKind,
      thermalLevel: form.thermalLevel,
      backgroundLoad: form.backgroundLoad,
      perceivedDelay: form.perceivedDelay,
      downlinkMbps: form.downlinkMbps || null,
      batteryPct: form.batteryPct || null,
      memoryFreeGb: form.memoryFreeGb || null
    });
    const nextSamples = [sample, ...samples].slice(0, 240);
    const link = linkSampleToMatch(sample, latestMatch);
    const nextLinks = [link, ...links].slice(0, 240);
    setSamples(nextSamples);
    setLinks(nextLinks);
    safeStorageSetJson(ANTI_DELAY_STORAGE_KEY, nextSamples);
    safeStorageSetJson(ANTI_DELAY_LINK_STORAGE_KEY, nextLinks);
    saveProfile({ ...profile, deviceLabel: sample.deviceLabel, connectionKind: sample.connectionKind });
    window.dispatchEvent(new CustomEvent('buildmaster:anti-delay-updated'));
    setMessage(latestMatch ? 'Diagnóstico salvo e ligado à partida competitiva mais recente.' : 'Diagnóstico salvo. Registre uma partida para comparar delay e erros.');
    setTab('preparacao');
  }

  function removeSample(id: string) {
    const nextSamples = samples.filter((item) => item.id !== id);
    const nextLinks = links.filter((item) => item.sampleId !== id);
    setSamples(nextSamples);
    setLinks(nextLinks);
    safeStorageSetJson(ANTI_DELAY_STORAGE_KEY, nextSamples);
    safeStorageSetJson(ANTI_DELAY_LINK_STORAGE_KEY, nextLinks);
  }

  function exportReport() {
    const lines = [
      'BuildMaster v29.60 — Central anti-delay',
      `Amostras: ${history.samples}`,
      `Média: ${history.averageScore}/100`,
      `Correlação delay/erros: ${history.correlationLabel}${history.delayErrorCorrelation == null ? '' : ` (${history.delayErrorCorrelation})`}`,
      `Parcela provável de delay: ${history.likelyDelayShare}%`,
      '',
      ...history.recommendations,
      '',
      'Últimos diagnósticos:',
      ...samples.slice(0, 20).map((sample) => {
        const item = diagnoseAntiDelay(sample);
        return `${new Date(sample.measuredAt).toLocaleString('pt-BR')} • ${CONNECTION_LABELS[sample.connectionKind]} • ${sample.pingMs} ms • jitter ${sample.jitterMs} ms • perda ${sample.packetLossPct}% • índice ${item.score}/100`;
      }),
      '',
      'Aviso: o teste usa requisições HTTP e não mede diretamente o servidor da partida.'
    ];
    downloadText(`buildmaster-anti-delay-${new Date().toISOString().slice(0, 10)}.txt`, lines.join('\n'));
  }

  return <section className="bm2960-anti-delay luxury-panel">
    <header className="bm2960-heading">
      <div><p className="kicker"><Wifi size={15}/> Bloco 22</p><h3>Central anti-delay</h3><span>Compare rede, aparelho, horário e erros reais sem prometer eliminar o atraso do servidor.</span></div>
      <div className="bm2960-score-chip"><Gauge size={18}/><strong>{diagnosis?.score ?? '--'}</strong><span>/100</span></div>
    </header>

    <nav className="bm2960-tabs" aria-label="Central anti-delay">
      <button type="button" className={tab === 'diagnostico' ? 'active' : ''} onClick={() => setTab('diagnostico')}><Activity size={16}/> Diagnóstico</button>
      <button type="button" className={tab === 'preparacao' ? 'active' : ''} onClick={() => setTab('preparacao')}><CheckCircle2 size={16}/> Preparação</button>
      <button type="button" className={tab === 'historico' ? 'active' : ''} onClick={() => setTab('historico')}><Network size={16}/> Histórico</button>
    </nav>

    {message && <p className="bm2960-message">{message}</p>}

    {tab === 'diagnostico' && <div className="bm2960-diagnostic-grid">
      <article className="bm2960-form-card">
        <div className="bm2960-card-title"><Signal size={18}/><div><strong>Condição atual</strong><span>O teste HTTP preenche latência, jitter e perda estimada.</span></div></div>
        <div className="bm2960-form-grid">
          <label>Aparelho<input value={form.deviceLabel} onChange={(event) => update('deviceLabel', event.target.value)}/></label>
          <label>Conexão<select value={form.connectionKind} onChange={(event) => update('connectionKind', event.target.value as ConnectionKind)}>{Object.entries(CONNECTION_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Ping HTTP (ms)<input type="number" min={0} max={3000} value={form.pingMs} onChange={(event) => update('pingMs', Number(event.target.value))}/></label>
          <label>Jitter (ms)<input type="number" min={0} max={1000} value={form.jitterMs} onChange={(event) => update('jitterMs', Number(event.target.value))}/></label>
          <label>Perda estimada (%)<input type="number" min={0} max={100} step="0.1" value={form.packetLossPct} onChange={(event) => update('packetLossPct', Number(event.target.value))}/></label>
          <label>Download estimado (Mbps)<input type="number" min={0} max={10000} step="0.1" value={form.downlinkMbps} onChange={(event) => update('downlinkMbps', Number(event.target.value))}/></label>
          <label>Sinal 0–100<input type="number" min={0} max={100} value={form.signalQuality} onChange={(event) => update('signalQuality', Number(event.target.value))}/></label>
          <label>Bateria (%)<input type="number" min={0} max={100} value={form.batteryPct} onChange={(event) => update('batteryPct', Number(event.target.value))}/></label>
          <label>Memória livre (GB)<input type="number" min={0} max={128} step="0.1" value={form.memoryFreeGb} onChange={(event) => update('memoryFreeGb', Number(event.target.value))}/></label>
          <label>Temperatura percebida<select value={form.thermalLevel} onChange={(event) => update('thermalLevel', Number(event.target.value) as ThermalLevel)}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label>
          <label>Carga em segundo plano<select value={form.backgroundLoad} onChange={(event) => update('backgroundLoad', Number(event.target.value))}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label>
          <label>Delay percebido<select value={form.perceivedDelay} onChange={(event) => update('perceivedDelay', Number(event.target.value) as ThermalLevel)}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label>
        </div>
        <label className="bm2960-check"><input type="checkbox" checked={form.batterySaver} onChange={(event) => update('batterySaver', event.target.checked)}/> Economia de bateria está ativa</label>
        <div className="bm2960-actions"><button type="button" onClick={runProbe} disabled={probing}><RefreshCw size={17}/>{probing ? 'Testando…' : 'Executar teste HTTP'}</button><button type="button" className="elite-button" onClick={saveSample}><Save size={17}/> Salvar diagnóstico</button></div>
        <p className="panel-note">O navegador não mede ICMP, temperatura real ou servidor do eFootball. Esses campos usam requisições HTTP e informações fornecidas por você.</p>
      </article>
      <article className="bm2960-metrics-card">
        <div className="bm2960-card-title"><Gauge size={18}/><div><strong>Leitura mais recente</strong><span>{latest ? new Date(latest.measuredAt).toLocaleString('pt-BR') : 'Nenhum teste salvo'}</span></div></div>
        {diagnosis ? <><div className="bm2960-metric-list">{diagnosis.metrics.map((metric) => <div key={metric.key} className={`band-${metric.band}`}><span>{metric.label}</span><strong>{metric.display}</strong><small>{metric.detail}</small></div>)}</div>{diagnosis.blockers.length > 0 && <div className="bm2960-blockers"><strong><AlertTriangle size={16}/> Bloqueios antes da ranqueada</strong>{diagnosis.blockers.map((item) => <span key={item}>{item}</span>)}</div>}<p className="panel-note">Confiança do diagnóstico: {diagnosis.confidence}%</p></> : <p className="panel-note">Execute e salve o primeiro diagnóstico.</p>}
      </article>
    </div>}

    {tab === 'preparacao' && <>{diagnosis ? <div className="bm2960-prep-grid">
      <article><div className="bm2960-card-title"><Network size={18}/><strong>Rede</strong></div>{diagnosis.networkActions.map((item) => <span key={item}>{item}</span>)}</article>
      <article><div className="bm2960-card-title"><Cpu size={18}/><strong>Aparelho</strong></div>{diagnosis.deviceActions.map((item) => <span key={item}>{item}</span>)}</article>
      <article><div className="bm2960-card-title"><Activity size={18}/><strong>Dentro do jogo</strong></div>{diagnosis.gameActions.map((item) => <span key={item}>{item}</span>)}</article>
      <article className="bm2960-checklist"><div className="bm2960-card-title"><CheckCircle2 size={18}/><strong>Checklist pré-partida</strong></div>{diagnosis.preMatchChecklist.map((item) => <div key={item.label} className={item.passed ? 'passed' : 'failed'}>{item.passed ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}<div><strong>{item.label}</strong><span>{item.detail}</span></div></div>)}</article>
      <article className="bm2960-profile"><div className="bm2960-card-title"><Battery size={18}/><strong>Perfil deste aparelho</strong></div><label>Modo gráfico<select value={profile.gameQualityMode} onChange={(event) => saveProfile({ ...profile, gameQualityMode: event.target.value as AntiDelayProfile['gameQualityMode'] })}><option value="desempenho">Desempenho</option><option value="equilibrado">Equilibrado</option><option value="qualidade">Qualidade</option></select></label><label>Estádio<select value={profile.stadiumQuality} onChange={(event) => saveProfile({ ...profile, stadiumQuality: event.target.value as AntiDelayProfile['stadiumQuality'] })}><option value="baixo">Baixo</option><option value="padrao">Padrão</option><option value="alto">Alto</option></select></label><label>FPS alvo<select value={profile.targetFps} onChange={(event) => saveProfile({ ...profile, targetFps: Number(event.target.value) as AntiDelayProfile['targetFps'] })}>{[30,60,90,120].map((value) => <option key={value} value={value}>{value} FPS</option>)}</select></label><label>Observações<textarea value={profile.notes} onChange={(event) => saveProfile({ ...profile, notes: event.target.value })}/></label></article>
      <article className="bm2960-warning"><Thermometer size={22}/><div><strong>Limite honesto</strong><span>{diagnosis.explanation}</span></div></article>
    </div> : <p className="panel-note">Salve um diagnóstico para gerar a preparação.</p>}</>}

    {tab === 'historico' && <div className="bm2960-history-grid">
      <article><div className="bm2960-card-title"><Gauge size={18}/><div><strong>Resumo</strong><span>{history.samples} amostra(s)</span></div></div><div className="bm2960-history-metrics"><div><span>Média</span><strong>{history.averageScore}/100</strong></div><div><span>Correlação</span><strong>{history.correlationLabel}</strong></div><div><span>Provável delay</span><strong>{history.likelyDelayShare}%</strong></div></div>{history.recommendations.map((item) => <p key={item}>{item}</p>)}<button type="button" onClick={exportReport}><Download size={17}/> Exportar diagnóstico</button></article>
      <article><div className="bm2960-card-title"><Activity size={18}/><strong>Melhores horários</strong></div>{history.bestHours.map((item) => <div className="bm2960-ranking" key={item.hour}><strong>{item.label}</strong><span>{item.samples} teste(s)</span><b>{item.score}</b></div>)}{!history.bestHours.length && <p className="panel-note">Ainda sem histórico suficiente.</p>}<div className="bm2960-card-title"><Wifi size={18}/><strong>Conexões</strong></div>{history.connectionRanking.map((item) => <div className="bm2960-ranking" key={item.kind}><strong>{item.label}</strong><span>{item.samples} teste(s)</span><b>{item.score}</b></div>)}</article>
      <article className="bm2960-sample-list"><div className="bm2960-card-title"><Network size={18}/><strong>Amostras salvas</strong></div>{samples.map((sample) => <div key={sample.id}><div><strong>{diagnoseAntiDelay(sample).score}/100 • {CONNECTION_LABELS[sample.connectionKind]}</strong><span>{new Date(sample.measuredAt).toLocaleString('pt-BR')} • {sample.pingMs} ms • jitter {sample.jitterMs} ms</span></div><button type="button" aria-label="Excluir diagnóstico" onClick={() => removeSample(sample.id)}><Trash2 size={16}/></button></div>)}{!samples.length && <p className="panel-note">Nenhum diagnóstico salvo.</p>}</article>
    </div>}
  </section>;
}
