'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Beaker,
  CheckCircle2,
  Clock3,
  Copy,
  FileClock,
  GitBranch,
  History,
  Loader2,
  PauseCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  TestTube2
} from 'lucide-react';
import { APP_RELEASE_VERSION, type AppUpdateManifest } from '@/lib/appUpdates';
import { fetchUpdateManifest, type UpdateManifestFetchResult } from '@/lib/updateChannel';
import {
  audienceBucketForManifest,
  buildUpdateHealthReport,
  fetchReleaseHistory,
  readUpdateChannelPreference,
  rollbackCandidate,
  writeUpdateChannelPreference,
  type ReleaseHistoryEntry,
  type UpdateChannelPreference
} from './updateGovernance';

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'data inválida' : date.toLocaleString('pt-BR');
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const input = document.createElement('textarea');
  input.value = value;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

export function DefinitiveUpdateCenter() {
  const [channel, setChannel] = useState<UpdateChannelPreference>(() => readUpdateChannelPreference());
  const [result, setResult] = useState<UpdateManifestFetchResult | null>(null);
  const [history, setHistory] = useState<ReleaseHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Pronto para testar os canais de publicação.');
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async (nextChannel = channel) => {
    setLoading(true);
    setMessage(`Testando o canal ${nextChannel === 'beta' ? 'de testes' : 'estável'}...`);
    try {
      const [manifestResult, releaseRows] = await Promise.all([fetchUpdateManifest(nextChannel), fetchReleaseHistory(nextChannel)]);
      setResult(manifestResult);
      setHistory(releaseRows);
      setMessage(`Canal validado: v${manifestResult.manifest.version}, code ${manifestResult.manifest.versionCode}, ${manifestResult.alternatives.length} rota(s).`);
    } catch (cause) {
      setResult(null);
      setHistory(await fetchReleaseHistory(nextChannel));
      setMessage(cause instanceof Error ? cause.message : 'O canal não respondeu corretamente.');
    } finally {
      setLoading(false);
    }
  }, [channel]);

  useEffect(() => { void refresh(channel); }, [channel, refresh]);

  const manifest: AppUpdateManifest | null = result?.manifest || null;
  const report = useMemo(() => buildUpdateHealthReport(result, history), [history, result]);
  const bucket = manifest ? audienceBucketForManifest(manifest) : 0;
  const rollout = manifest?.rolloutPercentage || 100;
  const included = manifest ? manifest.mandatory || (!manifest.paused && bucket < rollout) : false;
  const rollback = manifest ? rollbackCandidate(history, manifest.versionCode, manifest.channel) : null;

  function selectChannel(next: UpdateChannelPreference) {
    writeUpdateChannelPreference(next);
    setChannel(next);
    window.dispatchEvent(new CustomEvent('buildmaster:update-channel-changed', { detail: { channel: next } }));
  }

  async function copyReleaseChecklist() {
    const lines = [
      'BuildMaster — checklist de publicação segura',
      `Aplicativo local: v${APP_RELEASE_VERSION}`,
      `Canal selecionado: ${channel}`,
      `Manifesto: ${manifest ? `v${manifest.version} / code ${manifest.versionCode}` : 'indisponível'}`,
      `Rollout: ${rollout}%${manifest?.paused ? ' (pausado)' : ''}`,
      `Rotas válidas: ${result?.alternatives.length || 0}`,
      `Saúde: ${report.score}/100 — ${report.status}`,
      '',
      'Ordem obrigatória:',
      '1. Compilar e assinar o APK.',
      '2. Conferir pacote, versionName, versionCode, tamanho e SHA-256.',
      '3. Publicar a release imutável como teste.',
      '4. Baixar novamente o APK público e comparar bytes.',
      '5. Publicar manifesto do canal com rollout inicial.',
      '6. Validar o manifesto e o APK pelas rotas públicas.',
      '7. Ampliar o rollout ou publicar rollback com versionCode maior.'
    ];
    await copyText(lines.join('\n'));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="definitive-update-center bm2910-update-governance" aria-label="Atualização automática definitiva">
      <div className="bm2910-update-heading">
        <div><p className="kicker"><GitBranch size={15} /> Bloco 13</p><h3>Governança definitiva da atualização</h3><span>Canais separados, rollout gradual, histórico, pausa e rollback seguro.</span></div>
        <span className={`bm2910-health-pill health-${report.status}`}>{report.score}/100 • {report.status}</span>
      </div>

      <div className="settings-segmented-control bm2910-channel-selector" role="group" aria-label="Canal de atualização">
        <button type="button" className={channel === 'stable' ? 'selected' : ''} onClick={() => selectChannel('stable')}><ShieldCheck size={16} /> Estável</button>
        <button type="button" className={channel === 'beta' ? 'selected' : ''} onClick={() => selectChannel('beta')}><Beaker size={16} /> Testes</button>
      </div>

      <div className="bm2910-governance-grid">
        <article><Activity size={19} /><div><span>Manifesto</span><strong>{manifest ? `v${manifest.version}` : 'Indisponível'}</strong><small>{manifest ? `code ${manifest.versionCode} • schema ${manifest.schemaVersion || 1}` : message}</small></div></article>
        <article><GitBranch size={19} /><div><span>Canal publicado</span><strong>{manifest?.channel === 'beta' ? 'Testes' : 'Estável'}</strong><small>{result?.source || 'sem rota ativa'}</small></div></article>
        <article>{manifest?.paused ? <PauseCircle size={19} /> : <TestTube2 size={19} />}<div><span>Distribuição</span><strong>{manifest?.paused ? 'Pausada' : `${rollout}% liberado`}</strong><small>aparelho no grupo {bucket} • {included ? 'incluído' : 'fora da etapa'}</small></div></article>
        <article><History size={19} /><div><span>Histórico</span><strong>{history.length} versões</strong><small>{rollback ? `rollback-base v${rollback.version}` : 'sem versão anterior registrada'}</small></div></article>
      </div>

      <div className={`cloud-status-card ${result ? 'is-ready' : 'needs-attention'}`} role="status" aria-live="polite">{loading ? <Loader2 className="spin" size={17} /> : result ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}<div><strong>{loading ? 'Executando diagnóstico' : result ? 'Canal operacional' : 'Canal precisa de atenção'}</strong><span>{message}</span></div></div>

      <div className="bm2910-health-checks">
        {report.checks.map((check) => <article key={check.id} className={check.ok ? 'check-ok' : 'check-warning'}>{check.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}<div><strong>{check.label}</strong><span>{check.detail}</span></div></article>)}
      </div>

      {manifest?.rollbackFromVersion && <div className="settings-explanation-card bm2910-rollback-alert"><RotateCcw size={19} /><div><strong>Publicação de rollback</strong><span>Esta versão recompila a base v{manifest.rollbackFromVersion} com `versionCode` maior. Motivo: {manifest.rollbackReason || 'correção emergencial'}.</span></div></div>}

      <div className="bm2910-update-actions">
        <button type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw className={loading ? 'spin' : ''} size={17} /><div><strong>Testar canais agora</strong><span>Manifesto, rotas, rollout e histórico.</span></div></button>
        <button type="button" onClick={() => void copyReleaseChecklist()}><Copy size={17} /><div><strong>{copied ? 'Checklist copiado' : 'Copiar checklist de publicação'}</strong><span>Ordem segura antes de liberar o APK.</span></div></button>
      </div>

      <details className="settings-details-card bm2910-release-history" open={history.some((entry) => entry.status === 'failed' || entry.status === 'rolled_back')}>
        <summary>Histórico de versões ({history.length})</summary>
        <div>
          {history.length ? history.slice(0, 12).map((entry) => <article key={`${entry.channel}-${entry.versionCode}`} className={`release-${entry.status}`}><span><FileClock size={16} /></span><div><strong>v{entry.version} • code {entry.versionCode}</strong><small>{entry.channel} • {entry.rolloutPercentage}% • {entry.status} • {formatDate(entry.publishedAt)}</small></div>{entry.checksum && <code>{entry.checksum.slice(0, 12)}…</code>}</article>) : <p className="panel-note">O workflow publicará `release-history.json` a partir desta versão.</p>}
        </div>
      </details>

      <div className="settings-explanation-card"><Clock3 size={18} /><div><strong>Rollback correto no Android</strong><span>O app não tenta instalar um APK antigo por cima. O workflow recompila a versão conhecida como boa e publica um novo pacote com `versionCode` maior, preservando a assinatura e os dados.</span></div></div>
      <div className="settings-explanation-card"><ShieldCheck size={18} /><div><strong>Ponte segura para APKs antigos</strong><span>O manifesto legado só avança quando o canal estável está em 100% e não está pausado. Assim, aparelhos antigos não furam o rollout gradual.</span></div></div>
    </section>
  );
}
