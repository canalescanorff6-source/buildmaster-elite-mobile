'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { AlertTriangle, CheckCircle2, Download, ExternalLink, Loader2, RefreshCw, Settings, ShieldCheck, Smartphone } from 'lucide-react';
import {
  APP_NATIVE_VERSION,
  APP_RELEASE_VERSION,
  CURRENT_BUILD_ID,
  DEFAULT_UPDATE_MANIFEST_URL,
  evaluateUpdateManifest,
  isTrustedManifestUrl,
  type AppUpdateManifest,
  type InstalledAppInfo
} from '@/lib/appUpdates';
import {
  downloadVerifyAndInstallApk,
  getNativeInstallInfo,
  onApkDownloadProgress,
  openInstallPermissionSettings,
  type ApkDownloadProgress
} from '@/lib/secureStorage';

const AUTO_KEY = 'buildmaster_auto_update_check';
const IGNORED_KEY = 'buildmaster_ignored_update_build';
const LAST_CHECK_KEY = 'buildmaster_last_update_check';
const PENDING_KEY = 'buildmaster_pending_update';
const BACKUP_READY_KEY = 'buildmaster_update_backup_ready_build';
const AUTO_INTERVAL_MS = 6 * 60 * 60 * 1000;
const AUTO_THROTTLE_MS = 90 * 1000;

function webInstallInfo(): InstalledAppInfo {
  return {
    packageName: 'com.buildmaster.elitetatico',
    versionName: APP_RELEASE_VERSION,
    versionCode: 0,
    canInstallPackages: false,
    platform: 'web'
  };
}

async function readInstalledInfo(): Promise<InstalledAppInfo> {
  const native = await getNativeInstallInfo();
  return native ?? webInstallInfo();
}

async function fetchManifestJson(): Promise<unknown> {
  if (!isTrustedManifestUrl()) throw new Error('O canal oficial de atualização não foi configurado neste APK.');
  const separator = DEFAULT_UPDATE_MANIFEST_URL.includes('?') ? '&' : '?';
  const target = `${DEFAULT_UPDATE_MANIFEST_URL}${separator}buildmasterCache=${Date.now()}`;

  if (Capacitor.isNativePlatform()) {
    try {
      const native = await CapacitorHttp.get({
        url: target,
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
        connectTimeout: 30_000,
        readTimeout: 45_000,
        responseType: 'json'
      });
      if (native.status >= 200 && native.status < 300) return native.data as unknown;
      throw new Error(`O canal oficial retornou HTTP ${native.status}.`);
    } catch (nativeError) {
      try {
        const response = await fetch(target, { cache: 'no-store', headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json() as unknown;
      } catch {
        throw nativeError;
      }
    }
  }

  const response = await fetch(target, { cache: 'no-store', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`O canal oficial retornou HTTP ${response.status}.`);
  return await response.json() as unknown;
}

function formatBytes(value?: number) {
  if (!value || value <= 0) return 'tamanho confirmado após o download';
  const mb = value / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 1 : 2)} MB`;
}

function updateErrorMessage(cause: unknown) {
  const message = cause instanceof Error ? cause.message : String(cause || '');
  const lower = message.toLowerCase();
  if (lower.includes('assinatura') || lower.includes('signature')) {
    return 'A assinatura do APK instalado é diferente da assinatura oficial. Será necessária uma instalação manual única da versão oficial; depois disso, as próximas versões atualizarão por cima.';
  }
  if (lower.includes('versioncode') || lower.includes('não é mais nova')) {
    return 'O pacote publicado não possui um versionCode maior que o instalado. Gere uma nova execução do GitHub Actions.';
  }
  if (lower.includes('sha-256') || lower.includes('checksum') || lower.includes('tamanho')) {
    return 'O arquivo baixado não corresponde ao manifesto oficial. A instalação foi bloqueada para proteger o aparelho.';
  }
  if (lower.includes('http 404')) return 'A release oficial ainda não contém o APK ou o manifesto desta versão.';
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('alcançar') || lower.includes('network')) {
    return 'A conexão com o canal oficial demorou demais. Verifique a internet e tente novamente.';
  }
  return message || 'A instalação segura não pôde ser iniciada.';
}

type Props = { onPrepareBackup: () => Promise<void> | void };

export function UpdateAutoChecker() {
  const lastAttemptRef = useRef(0);

  useEffect(() => {
    let active = true;
    let timer: number | null = null;

    async function check() {
      if (!active || localStorage.getItem(AUTO_KEY) === '0' || !isTrustedManifestUrl()) return;
      const now = Date.now();
      if (now - lastAttemptRef.current < AUTO_THROTTLE_MS) return;
      lastAttemptRef.current = now;
      try {
        const installed = await readInstalledInfo();
        const ignored = localStorage.getItem(IGNORED_KEY) || '';
        const result = evaluateUpdateManifest(await fetchManifestJson(), installed, CURRENT_BUILD_ID, ignored);
        const checkedAt = new Date().toISOString();
        localStorage.setItem(LAST_CHECK_KEY, checkedAt);
        if (!result.available || !result.manifest) {
          localStorage.removeItem(PENDING_KEY);
          return;
        }
        localStorage.setItem(PENDING_KEY, JSON.stringify(result.manifest));
        window.dispatchEvent(new CustomEvent('buildmaster:update-available', {
          detail: { version: result.manifest.version, reason: result.reason, mandatory: result.mandatory }
        }));
      } catch {
        // A verificação silenciosa nunca bloqueia a abertura do app.
      }
    }

    timer = window.setTimeout(() => void check(), 2200);
    const interval = window.setInterval(() => void check(), AUTO_INTERVAL_MS);
    const onOnline = () => void check();
    const onVisible = () => { if (document.visibilityState === 'visible') void check(); };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      if (timer != null) window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}

export function UpdateCenterPanel({ onPrepareBackup }: Props) {
  const [autoCheck, setAutoCheck] = useState(true);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [awaitingPermission, setAwaitingPermission] = useState(false);
  const [message, setMessage] = useState('Aguardando verificação do canal oficial.');
  const [manifest, setManifest] = useState<AppUpdateManifest | null>(null);
  const [installed, setInstalled] = useState<InstalledAppInfo>(webInstallInfo());
  const [available, setAvailable] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [progress, setProgress] = useState<ApkDownloadProgress | null>(null);

  const channelReady = isTrustedManifestUrl();

  const refreshInstalledInfo = useCallback(async () => {
    const next = await readInstalledInfo();
    setInstalled(next);
    return next;
  }, []);

  useEffect(() => {
    try {
      setAutoCheck(localStorage.getItem(AUTO_KEY) !== '0');
      setLastCheck(localStorage.getItem(LAST_CHECK_KEY));
      const pending = localStorage.getItem(PENDING_KEY);
      if (pending) setManifest(JSON.parse(pending) as AppUpdateManifest);
    } catch { /* opcional */ }
    void refreshInstalledInfo();
  }, [refreshInstalledInfo]);

  useEffect(() => {
    let handle: Awaited<ReturnType<typeof onApkDownloadProgress>> = null;
    void onApkDownloadProgress((event) => setProgress(event)).then((next) => { handle = next; });
    return () => { void handle?.remove(); };
  }, []);

  useEffect(() => {
    if (!awaitingPermission) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      window.setTimeout(() => {
        void refreshInstalledInfo().then((info) => {
          if (info.canInstallPackages) {
            setAwaitingPermission(false);
            setMessage('Permissão liberada. Toque novamente em instalar para continuar.');
          }
        });
      }, 700);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [awaitingPermission, refreshInstalledInfo]);

  const checkForUpdates = useCallback(async (silent = false) => {
    if (!channelReady) {
      if (!silent) setMessage('Este APK não contém o endereço oficial de atualização. Gere-o pelo workflow oficial de APK.');
      return;
    }
    setChecking(true);
    if (!silent) setMessage('Conectando ao canal oficial...');
    try {
      const current = await refreshInstalledInfo();
      const ignored = localStorage.getItem(IGNORED_KEY) || '';
      const result = evaluateUpdateManifest(await fetchManifestJson(), current, CURRENT_BUILD_ID, ignored);
      setManifest(result.manifest);
      setAvailable(result.available);
      setMessage(result.reason);
      const checkedAt = new Date().toISOString();
      setLastCheck(checkedAt);
      localStorage.setItem(LAST_CHECK_KEY, checkedAt);
      if (result.available && result.manifest) localStorage.setItem(PENDING_KEY, JSON.stringify(result.manifest));
      else localStorage.removeItem(PENDING_KEY);
    } catch (cause) {
      if (!silent) setMessage(updateErrorMessage(cause));
    } finally {
      setChecking(false);
    }
  }, [channelReady, refreshInstalledInfo]);

  useEffect(() => {
    if (!autoCheck || !channelReady) return;
    const timer = window.setTimeout(() => void checkForUpdates(true), 1300);
    return () => window.clearTimeout(timer);
  }, [autoCheck, channelReady, checkForUpdates]);

  const buildShort = useMemo(() => CURRENT_BUILD_ID === 'local-build' ? 'local' : CURRENT_BUILD_ID.slice(0, 8), []);
  const progressLabel = progress?.phase === 'connecting' ? 'Conectando ao GitHub'
    : progress?.phase === 'downloading' ? `Baixando ${progress.percent}%`
      : progress?.phase === 'verifying' ? 'Conferindo arquivo e assinatura'
        : progress?.phase === 'ready' ? 'APK validado' : '';

  async function installUpdate() {
    if (!manifest?.apkUrl || !manifest.checksum) return;
    setInstalling(true);
    setProgress(null);
    try {
      if (!Capacitor.isNativePlatform()) {
        window.open(manifest.apkUrl, '_blank', 'noopener,noreferrer');
        setMessage('No navegador, baixe somente o APK da release oficial. A instalação automática funciona dentro do APK Android.');
        return;
      }

      const current = await refreshInstalledInfo();
      if (!current.canInstallPackages) {
        setAwaitingPermission(true);
        setMessage('O Android precisa permitir que o BuildMaster instale a atualização. Ative “Permitir desta fonte” e volte ao app.');
        await openInstallPermissionSettings();
        return;
      }

      if (localStorage.getItem(BACKUP_READY_KEY) !== manifest.buildId) {
        setMessage('Protegendo seus dados antes da atualização...');
        await onPrepareBackup();
        localStorage.setItem(BACKUP_READY_KEY, manifest.buildId);
      }

      setMessage('Baixando o APK oficial. Não feche o aplicativo...');
      const result = await downloadVerifyAndInstallApk({
        url: manifest.apkUrl,
        checksum: manifest.checksum,
        expectedPackageName: manifest.appId,
        expectedVersionCode: manifest.versionCode,
        expectedVersionName: manifest.version,
        expectedSizeBytes: manifest.sizeBytes
      });

      if (result.needsPermission) {
        setAwaitingPermission(true);
        setMessage('Libere “Permitir desta fonte” nas configurações do Android e tente novamente.');
        await openInstallPermissionSettings();
      } else if (result.verified) {
        setMessage('APK oficial validado. Confirme “Atualizar” na tela do instalador Android. Seus dados serão mantidos.');
      }
    } catch (cause) {
      setMessage(updateErrorMessage(cause));
    } finally {
      setInstalling(false);
    }
  }

  function ignoreCurrent() {
    if (!manifest || manifest.mandatory) return;
    localStorage.setItem(IGNORED_KEY, manifest.buildId);
    setAvailable(false);
    setMessage('Esta revisão foi ignorada neste aparelho.');
  }

  return (
    <section className="update-center-panel luxury-panel settings-view-panel settings-final-panel">
      <div className="settings-panel-heading">
        <div><p className="kicker"><RefreshCw size={15} /> Atualizações</p><h3>Atualização automática verificada</h3><span>Detecta a nova versão, protege seus dados, confere o APK e abre o instalador Android.</span></div>
        <span className="settings-state-pill">v{installed.versionName || APP_RELEASE_VERSION} • {buildShort}</span>
      </div>

      <div className="update-readiness-grid">
        <article className="is-ready"><CheckCircle2 size={18} /><div><span>Versão instalada</span><strong>{installed.versionName || APP_RELEASE_VERSION}</strong><small>versionCode {installed.versionCode || 'web'} • base {APP_NATIVE_VERSION}</small></div></article>
        <article className={channelReady ? 'is-ready' : 'needs-attention'}><ShieldCheck size={18} /><div><span>Canal oficial</span><strong>{channelReady ? 'Fixo e verificado' : 'Não configurado'}</strong><small>somente o seu repositório GitHub</small></div></article>
        <article className={!Capacitor.isNativePlatform() || installed.canInstallPackages ? 'is-ready' : 'needs-attention'}><Settings size={18} /><div><span>Permissão Android</span><strong>{!Capacitor.isNativePlatform() ? 'Teste web' : installed.canInstallPackages ? 'Liberada' : 'Precisa liberar'}</strong><small>necessária uma única vez</small></div></article>
        <article className={available ? 'update-ready' : 'is-ready'}>{available ? <Download size={18} /> : <CheckCircle2 size={18} />}<div><span>Situação</span><strong>{available ? `Nova v${manifest?.version}` : 'Atualizado'}</strong><small>{manifest ? `code ${manifest.versionCode}` : 'aguardando manifesto'}</small></div></article>
      </div>

      <div className={`cloud-status-card update-status-final ${available ? 'update-available' : ''}`} role="status" aria-live="polite">
        {checking || installing ? <Loader2 className="spin" size={17} /> : available ? <Download size={17} /> : <CheckCircle2 size={17} />}
        <div><strong>{installing ? progressLabel || 'Instalação segura' : checking ? 'Verificando canal' : available ? 'Atualização disponível' : 'Status da atualização'}</strong><span>{message}</span></div>
      </div>

      {installing && progress && (
        <div className="update-download-progress" aria-label={`Progresso do download: ${progress.percent}%`}>
          <div><span>{progressLabel}</span><strong>{progress.percent}%</strong></div>
          <i><b style={{ width: `${progress.percent}%` }} /></i>
          <small>{progress.downloadedBytes > 0 ? `${formatBytes(progress.downloadedBytes)} de ${formatBytes(progress.totalBytes)}` : 'Preparando download seguro'}</small>
        </div>
      )}

      {manifest && (
        <div className="update-release-card update-release-final-card">
          <div className="update-release-version"><span>Versão publicada</span><strong>v{manifest.version}</strong><small>versionCode {manifest.versionCode} • {formatBytes(manifest.sizeBytes)}</small></div>
          <div className="update-release-details"><span>Publicada em {new Date(manifest.publishedAt).toLocaleString('pt-BR')}</span>{manifest.notes.length > 0 && <ul>{manifest.notes.slice(0, 6).map((note) => <li key={note}>{note}</li>)}</ul>}<small>SHA-256: {manifest.checksum}</small>{manifest.mandatory && <b><ShieldCheck size={14} /> Atualização obrigatória</b>}</div>
        </div>
      )}

      {awaitingPermission && (
        <div className="settings-explanation-card update-permission-help"><AlertTriangle size={19} /><div><strong>Permissão de instalação pendente</strong><span>Na tela do Android, ative “Permitir desta fonte”, volte ao BuildMaster e toque novamente no botão de instalar.</span></div></div>
      )}

      <div className="safety-actions-grid update-actions-grid update-final-actions">
        <button type="button" onClick={() => void checkForUpdates(false)} disabled={checking || installing}><RefreshCw size={18} /><strong>Verificar agora</strong><span>Consulta versão, versionCode e integridade.</span><small>Não modifica o aplicativo</small></button>
        <button type="button" onClick={() => void installUpdate()} disabled={!available || !manifest || installing}><Download size={18} /><strong>{awaitingPermission ? 'Continuar instalação' : 'Atualizar aplicativo'}</strong><span>Backup, download, SHA-256 e assinatura.</span><small>{manifest ? formatBytes(manifest.sizeBytes) : 'APK oficial'}</small></button>
        <button type="button" onClick={ignoreCurrent} disabled={!available || !manifest || Boolean(manifest.mandatory)}><Smartphone size={18} /><strong>Ignorar esta revisão</strong><span>Somente para atualização opcional.</span><small>Obrigatórias não podem ser ignoradas</small></button>
      </div>

      <label className="update-toggle"><input type="checkbox" checked={autoCheck} onChange={(event) => { setAutoCheck(event.target.checked); localStorage.setItem(AUTO_KEY, event.target.checked ? '1' : '0'); }} /><span>Verificar automaticamente ao abrir, voltar ao app e reconectar à internet</span></label>

      <div className="update-install-steps"><article><i>1</i><div><strong>Detectar</strong><span>Compara a versão e o versionCode reais.</span></div></article><article><i>2</i><div><strong>Validar</strong><span>Confere tamanho, SHA-256, pacote e assinatura.</span></div></article><article><i>3</i><div><strong>Atualizar</strong><span>O Android instala por cima e mantém seus dados.</span></div></article></div>
      <div className="settings-explanation-card"><ExternalLink size={19} /><div><strong>Primeira instalação oficial</strong><span>Se uma versão antiga foi assinada com outra chave, será necessária uma reinstalação manual única. A partir desta base, o workflow só publica APK com a assinatura permanente.</span></div></div>
      {lastCheck && <p className="panel-note">Última consulta: {new Date(lastCheck).toLocaleString('pt-BR')}.</p>}
    </section>
  );
}
