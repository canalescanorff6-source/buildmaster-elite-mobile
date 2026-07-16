'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { CheckCircle2, Download, ExternalLink, Loader2, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
import { APP_NATIVE_VERSION, APP_RELEASE_VERSION, CURRENT_BUILD_ID, DEFAULT_UPDATE_MANIFEST_URL, evaluateUpdateManifest, isTrustedManifestUrl, type AppUpdateManifest } from '@/lib/appUpdates';
import { downloadVerifyAndInstallApk } from '@/lib/secureStorage';

const AUTO_KEY = 'buildmaster_auto_update_check';
const IGNORED_KEY = 'buildmaster_ignored_update_build';
const LAST_CHECK_KEY = 'buildmaster_last_update_check';

async function fetchManifestJson(): Promise<unknown> {
  if (!isTrustedManifestUrl()) throw new Error('O canal oficial de atualização não foi configurado neste APK.');
  const target = `${DEFAULT_UPDATE_MANIFEST_URL}?t=${Date.now()}`;
  try {
    const response = await fetch(target, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as unknown;
  } catch (webError) {
    if (!Capacitor.isNativePlatform()) throw webError;
    const native = await CapacitorHttp.get({ url: target, connectTimeout: 20_000, readTimeout: 30_000, responseType: 'json' });
    if (native.status < 200 || native.status >= 300) throw new Error(`HTTP ${native.status}`);
    return native.data as unknown;
  }
}

type Props = { onPrepareBackup: () => Promise<void> | void };

export function UpdateAutoChecker() {
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        if (localStorage.getItem(AUTO_KEY) === '0' || !isTrustedManifestUrl()) return;
        const ignored = localStorage.getItem(IGNORED_KEY) || '';
        const result = evaluateUpdateManifest(await fetchManifestJson(), APP_RELEASE_VERSION, CURRENT_BUILD_ID, ignored);
        if (!active || !result.available || !result.manifest) return;
        localStorage.setItem('buildmaster_pending_update', JSON.stringify(result.manifest));
        window.dispatchEvent(new CustomEvent('buildmaster:update-available', { detail: { version: result.manifest.version, reason: result.reason } }));
      } catch {
        // A verificação silenciosa nunca bloqueia a abertura do app.
      }
    }, 1600);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);
  return null;
}

export function UpdateCenterPanel({ onPrepareBackup }: Props) {
  const [autoCheck, setAutoCheck] = useState(true);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState('Aguardando verificação do canal oficial.');
  const [manifest, setManifest] = useState<AppUpdateManifest | null>(null);
  const [available, setAvailable] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  useEffect(() => {
    try {
      setAutoCheck(localStorage.getItem(AUTO_KEY) !== '0');
      setLastCheck(localStorage.getItem(LAST_CHECK_KEY));
    } catch { /* opcional */ }
  }, []);

  const channelReady = isTrustedManifestUrl();
  const checkForUpdates = useCallback(async (silent = false) => {
    if (!channelReady) { if (!silent) setMessage('Este APK não contém o endereço oficial de atualização. Gere-o pelo workflow v26.76.'); return; }
    setChecking(true);
    if (!silent) setMessage('Conectando ao canal oficial...');
    try {
      const ignored = localStorage.getItem(IGNORED_KEY) || '';
      const result = evaluateUpdateManifest(await fetchManifestJson(), APP_RELEASE_VERSION, CURRENT_BUILD_ID, ignored);
      setManifest(result.manifest);
      setAvailable(result.available);
      setMessage(result.reason);
      const checkedAt = new Date().toISOString();
      setLastCheck(checkedAt);
      localStorage.setItem(LAST_CHECK_KEY, checkedAt);
    } catch (cause) {
      if (!silent) setMessage(cause instanceof Error ? cause.message : 'Não foi possível consultar o canal oficial.');
    } finally { setChecking(false); }
  }, [channelReady]);

  useEffect(() => {
    if (!autoCheck || !channelReady) return;
    const timer = window.setTimeout(() => void checkForUpdates(true), 1200);
    return () => window.clearTimeout(timer);
  }, [autoCheck, channelReady, checkForUpdates]);

  const buildShort = useMemo(() => CURRENT_BUILD_ID === 'local-build' ? 'local' : CURRENT_BUILD_ID.slice(0, 8), []);

  async function installUpdate() {
    if (!manifest?.apkUrl || !manifest.checksum) return;
    setInstalling(true);
    try {
      await onPrepareBackup();
      setMessage('Baixando e verificando o APK oficial...');
      const native = await downloadVerifyAndInstallApk(manifest.apkUrl, manifest.checksum);
      if (native) setMessage('APK verificado por SHA-256. Confirme a instalação no Android.');
      else {
        window.open(manifest.apkUrl, '_blank', 'noopener,noreferrer');
        setMessage('Backup criado. No navegador, baixe apenas o APK da release oficial.');
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'A instalação segura não pôde ser iniciada.');
    } finally { setInstalling(false); }
  }

  function ignoreCurrent() {
    if (!manifest || manifest.mandatory) return;
    localStorage.setItem(IGNORED_KEY, manifest.buildId);
    setAvailable(false);
    setMessage('Esta revisão foi ignorada neste aparelho.');
  }

  return (
    <section className="update-center-panel luxury-panel settings-view-panel settings-final-panel">
      <div className="settings-panel-heading"><div><p className="kicker"><RefreshCw size={15} /> Atualizações</p><h3>Canal oficial e instalação verificada</h3><span>O endereço é fixo no APK. O arquivo só é instalado após conferência SHA-256.</span></div><span className="settings-state-pill">v{APP_RELEASE_VERSION} • {buildShort}</span></div>
      <div className="update-readiness-grid">
        <article className="is-ready"><CheckCircle2 size={18} /><div><span>Versão instalada</span><strong>{APP_RELEASE_VERSION}</strong><small>base nativa {APP_NATIVE_VERSION}</small></div></article>
        <article className={channelReady ? 'is-ready' : 'needs-attention'}><ShieldCheck size={18} /><div><span>Canal oficial</span><strong>{channelReady ? 'Bloqueado e válido' : 'Não configurado'}</strong><small>usuários não podem trocar a URL</small></div></article>
        <article className={lastCheck ? 'is-ready' : ''}>{checking ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}<div><span>Última verificação</span><strong>{lastCheck ? new Date(lastCheck).toLocaleDateString('pt-BR') : 'Nunca'}</strong><small>{autoCheck ? 'automática ativa' : 'somente manual'}</small></div></article>
        <article className={available ? 'update-ready' : 'is-ready'}>{available ? <Download size={18} /> : <CheckCircle2 size={18} />}<div><span>Situação</span><strong>{available ? 'Nova versão' : 'Atualizado'}</strong><small>{manifest?.checksum ? 'checksum disponível' : 'aguardando manifesto'}</small></div></article>
      </div>
      <div className={`cloud-status-card update-status-final ${available ? 'update-available' : ''}`} role="status" aria-live="polite">{checking || installing ? <Loader2 className="spin" size={17} /> : available ? <Download size={17} /> : <CheckCircle2 size={17} />}<div><strong>{installing ? 'Instalação segura' : checking ? 'Verificando canal' : available ? 'Atualização disponível' : 'Status da atualização'}</strong><span>{message}</span></div></div>
      {manifest && <div className="update-release-card update-release-final-card"><div className="update-release-version"><span>Versão publicada</span><strong>v{manifest.version}</strong><small>{manifest.channel === 'stable' ? 'Canal estável' : 'Canal beta'} • {manifest.updateType.toUpperCase()}</small></div><div className="update-release-details"><span>Publicada em {new Date(manifest.publishedAt).toLocaleString('pt-BR')}</span>{manifest.notes.length > 0 && <ul>{manifest.notes.slice(0, 6).map((note) => <li key={note}>{note}</li>)}</ul>}{manifest.checksum && <small>SHA-256: {manifest.checksum}</small>}{manifest.mandatory && <b><ShieldCheck size={14} /> Atualização obrigatória</b>}</div></div>}
      <div className="safety-actions-grid update-actions-grid update-final-actions">
        <button type="button" onClick={() => void checkForUpdates(false)} disabled={checking || installing}><RefreshCw size={18} /><strong>Testar canal oficial</strong><span>Confere manifesto, versão e origem.</span><small>Não altera o app</small></button>
        <button type="button" onClick={() => void installUpdate()} disabled={!available || !manifest || installing}><Download size={18} /><strong>Backup, verificar e instalar</strong><span>Baixa o APK e compara o SHA-256.</span><small>Proteção reforçada</small></button>
        <button type="button" onClick={ignoreCurrent} disabled={!available || !manifest || Boolean(manifest.mandatory)}><Smartphone size={18} /><strong>Ignorar esta revisão</strong><span>Disponível apenas para atualização opcional.</span><small>Não vale para versão obrigatória</small></button>
      </div>
      <label className="update-toggle"><input type="checkbox" checked={autoCheck} onChange={(event) => { setAutoCheck(event.target.checked); localStorage.setItem(AUTO_KEY, event.target.checked ? '1' : '0'); }} /><span>Verificar automaticamente ao abrir o app</span></label>
      <div className="update-install-steps"><article><i>1</i><div><strong>Verificar</strong><span>Canal e endereço fixos no APK.</span></div></article><article><i>2</i><div><strong>Proteger</strong><span>Backup criptografado antes da instalação.</span></div></article><article><i>3</i><div><strong>Validar</strong><span>O SHA-256 precisa ser idêntico ao manifesto.</span></div></article></div>
      <div className="settings-explanation-card"><ExternalLink size={19} /><div><strong>Assinatura permanente</strong><span>Além do checksum, o Android exige a mesma assinatura para instalar a atualização por cima.</span></div></div>
    </section>
  );
}
