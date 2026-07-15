'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { CheckCircle2, Download, ExternalLink, Loader2, RefreshCw, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import {
  APP_NATIVE_VERSION,
  APP_RELEASE_VERSION,
  CURRENT_BUILD_ID,
  DEFAULT_UPDATE_MANIFEST_URL,
  evaluateUpdateManifest,
  type AppUpdateManifest
} from '@/lib/appUpdates';

const URL_KEY = 'buildmaster_update_manifest_url';
const AUTO_KEY = 'buildmaster_auto_update_check';
const IGNORED_KEY = 'buildmaster_ignored_update_build';
const LAST_CHECK_KEY = 'buildmaster_last_update_check';
const LEGACY_KEYS = {
  url: 'buildmaster_update_manifest_url_v26_70',
  auto: 'buildmaster_auto_update_check_v26_70',
  ignored: 'buildmaster_ignored_update_build_v26_70',
  lastCheck: 'buildmaster_last_update_check_v26_70'
} as const;

function readMigratedPreference(key: string, legacyKey: string): string | null {
  const current = localStorage.getItem(key);
  if (current != null) return current;
  const legacy = localStorage.getItem(legacyKey);
  if (legacy != null) localStorage.setItem(key, legacy);
  return legacy;
}

async function fetchManifestJson(url: string): Promise<unknown> {
  const target = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
  try {
    const response = await fetch(target, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as unknown;
  } catch (webError) {
    if (!Capacitor.isNativePlatform()) throw webError;
    const native = await CapacitorHttp.get({
      url: target,
      connectTimeout: 20_000,
      readTimeout: 30_000,
      responseType: 'json'
    });
    if (native.status < 200 || native.status >= 300) throw new Error(`HTTP ${native.status}`);
    return native.data as unknown;
  }
}

type Props = {
  onPrepareBackup: () => Promise<void> | void;
};

export function UpdateAutoChecker() {
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        if (readMigratedPreference(AUTO_KEY, LEGACY_KEYS.auto) === '0') return;
        const url = readMigratedPreference(URL_KEY, LEGACY_KEYS.url) || DEFAULT_UPDATE_MANIFEST_URL;
        if (!url.trim()) return;
        const ignored = readMigratedPreference(IGNORED_KEY, LEGACY_KEYS.ignored) || '';
        const result = evaluateUpdateManifest(await fetchManifestJson(url) as unknown, APP_RELEASE_VERSION, CURRENT_BUILD_ID, ignored);
        if (!active || !result.available || !result.manifest) return;
        localStorage.setItem('buildmaster_pending_update', JSON.stringify(result.manifest));
        window.dispatchEvent(new CustomEvent('buildmaster:update-available', { detail: { version: result.manifest.version, reason: result.reason } }));
      } catch {
        // A busca silenciosa nunca pode atrapalhar a abertura do app.
      }
    }, 1600);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);
  return null;
}

export function UpdateCenterPanel({ onPrepareBackup }: Props) {
  const [manifestUrl, setManifestUrl] = useState(DEFAULT_UPDATE_MANIFEST_URL);
  const [autoCheck, setAutoCheck] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('Aguardando verificação.');
  const [manifest, setManifest] = useState<AppUpdateManifest | null>(null);
  const [available, setAvailable] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  useEffect(() => {
    try {
      setManifestUrl(readMigratedPreference(URL_KEY, LEGACY_KEYS.url) || DEFAULT_UPDATE_MANIFEST_URL);
      setAutoCheck(readMigratedPreference(AUTO_KEY, LEGACY_KEYS.auto) !== '0');
      setLastCheck(readMigratedPreference(LAST_CHECK_KEY, LEGACY_KEYS.lastCheck));
    } catch {
      // Preferências de atualização são opcionais.
    }
  }, []);

  const urlValid = useMemo(() => /^https:\/\//i.test(manifestUrl.trim()) && /\.json(?:$|\?)/i.test(manifestUrl.trim()), [manifestUrl]);

  const checkForUpdates = useCallback(async (silent = false) => {
    const url = manifestUrl.trim();
    if (!url) {
      if (!silent) setMessage('Defina a URL do manifesto ou gere o APK pelo workflow atualizado.');
      return;
    }
    setChecking(true);
    if (!silent) setMessage('Conectando ao canal de atualizações...');
    try {
      const raw = await fetchManifestJson(url);
      const ignored = readMigratedPreference(IGNORED_KEY, LEGACY_KEYS.ignored) || '';
      const result = evaluateUpdateManifest(raw, APP_RELEASE_VERSION, CURRENT_BUILD_ID, ignored);
      setManifest(result.manifest);
      setAvailable(result.available);
      setMessage(result.reason);
      const checkedAt = new Date().toISOString();
      setLastCheck(checkedAt);
      localStorage.setItem(LAST_CHECK_KEY, checkedAt);
    } catch {
      if (!silent) setMessage('Não foi possível consultar atualizações. Verifique a internet, a URL e a publicação da release.');
    } finally {
      setChecking(false);
    }
  }, [manifestUrl]);

  useEffect(() => {
    if (!autoCheck || !manifestUrl.trim()) return;
    const timer = window.setTimeout(() => void checkForUpdates(true), 1200);
    return () => window.clearTimeout(timer);
  }, [autoCheck, manifestUrl, checkForUpdates]);

  const buildShort = useMemo(() => CURRENT_BUILD_ID === 'local-build' ? 'local' : CURRENT_BUILD_ID.slice(0, 8), []);

  function savePreferences() {
    try {
      localStorage.setItem(URL_KEY, manifestUrl.trim());
      localStorage.setItem(AUTO_KEY, autoCheck ? '1' : '0');
      setMessage('Preferências de atualização salvas.');
    } catch {
      setMessage('Não foi possível salvar as preferências neste aparelho.');
    }
  }

  async function downloadUpdate() {
    if (!manifest) return;
    try {
      await onPrepareBackup();
    } catch {
      setMessage('Não foi possível confirmar o backup. Faça um backup manual antes de instalar.');
      return;
    }
    const target = manifest.apkUrl || manifest.otaUrl;
    if (!target) {
      setMessage('A atualização não possui um endereço de download válido.');
      return;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
    setMessage(manifest.updateType === 'apk'
      ? 'Backup criado. O Android abrirá o download e pedirá sua confirmação para instalar.'
      : 'Backup criado. O pacote de atualização foi aberto.');
  }

  function ignoreCurrent() {
    if (!manifest || manifest.mandatory) return;
    try {
      localStorage.setItem(IGNORED_KEY, manifest.buildId);
      setAvailable(false);
      setMessage('Esta revisão foi ignorada neste aparelho.');
    } catch {
      setMessage('Não foi possível registrar a versão ignorada.');
    }
  }

  return (
    <section className="update-center-panel luxury-panel settings-view-panel settings-final-panel">
      <div className="settings-panel-heading">
        <div><p className="kicker"><RefreshCw size={15} /> Atualizações</p><h3>Versão, canal e instalação segura</h3><span>O app verifica o manifesto, cria um backup e somente depois abre o novo APK.</span></div>
        <span className="settings-state-pill">v{APP_RELEASE_VERSION} • {buildShort}</span>
      </div>

      <div className="update-readiness-grid">
        <article className="is-ready"><CheckCircle2 size={18} /><div><span>Versão instalada</span><strong>{APP_RELEASE_VERSION}</strong><small>base nativa {APP_NATIVE_VERSION}</small></div></article>
        <article className={urlValid ? 'is-ready' : 'needs-attention'}>{urlValid ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}<div><span>Canal configurado</span><strong>{urlValid ? 'Válido' : 'Revisar URL'}</strong><small>manifesto JSON público</small></div></article>
        <article className={lastCheck ? 'is-ready' : ''}>{checking ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}<div><span>Última verificação</span><strong>{lastCheck ? new Date(lastCheck).toLocaleDateString('pt-BR') : 'Nunca'}</strong><small>{autoCheck ? 'busca automática ativa' : 'busca manual'}</small></div></article>
        <article className={available ? 'update-ready' : 'is-ready'}>{available ? <Download size={18} /> : <CheckCircle2 size={18} />}<div><span>Situação</span><strong>{available ? 'Nova versão' : 'Atualizado'}</strong><small>{available ? 'backup recomendado' : 'nenhuma ação necessária'}</small></div></article>
      </div>

      <div className={`cloud-status-card update-status-final ${available ? 'update-available' : ''}`} role="status" aria-live="polite">
        {checking ? <Loader2 className="spin" size={17} /> : available ? <Download size={17} /> : <CheckCircle2 size={17} />}
        <div><strong>{checking ? 'Verificando canal' : available ? 'Atualização disponível' : 'Status da atualização'}</strong><span>{message}</span></div>
      </div>

      {manifest && (
        <div className="update-release-card update-release-final-card">
          <div className="update-release-version"><span>Nova versão</span><strong>v{manifest.version}</strong><small>{manifest.channel === 'stable' ? 'Canal estável' : 'Canal beta'} • {manifest.updateType.toUpperCase()}</small></div>
          <div className="update-release-details"><span>Publicada em {new Date(manifest.publishedAt).toLocaleString('pt-BR')}</span>{manifest.notes.length > 0 && <ul>{manifest.notes.slice(0, 6).map((note) => <li key={note}>{note}</li>)}</ul>}{manifest.checksum && <small>SHA-256: {manifest.checksum.slice(0, 20)}…</small>}{manifest.mandatory && <b><ShieldCheck size={14} /> Atualização importante</b>}</div>
        </div>
      )}

      <div className="safety-actions-grid update-actions-grid update-final-actions">
        <button type="button" onClick={() => void checkForUpdates(false)} disabled={checking}><RefreshCw size={18} /><strong>Testar canal agora</strong><span>Confere internet, manifesto e versão publicada.</span><small>Não altera o app</small></button>
        <button type="button" onClick={() => void downloadUpdate()} disabled={!available || !manifest}><Download size={18} /><strong>Backup e atualizar</strong><span>Protege o Cofre antes de abrir o novo APK.</span><small>Recomendado</small></button>
        <button type="button" onClick={ignoreCurrent} disabled={!available || !manifest || Boolean(manifest?.mandatory)}><Smartphone size={18} /><strong>Ignorar esta revisão</strong><span>Oculta somente uma atualização não obrigatória.</span><small>Reversível em nova versão</small></button>
      </div>

      <details className="settings-details-card">
        <summary>Configuração do canal de atualização</summary>
        <div className="update-settings-grid update-final-settings">
          <label><span>URL do manifesto</span><input value={manifestUrl} onChange={(event) => setManifestUrl(event.target.value)} placeholder="https://.../update-manifest.json" aria-invalid={!urlValid && Boolean(manifestUrl.trim())} /><small>{urlValid ? 'Formato reconhecido.' : 'Use uma URL HTTPS terminada em .json.'}</small></label>
          <label className="update-toggle"><input type="checkbox" checked={autoCheck} onChange={(event) => setAutoCheck(event.target.checked)} /><span>Verificar automaticamente ao abrir o app</span></label>
          <button type="button" onClick={savePreferences}><Zap size={15} /> Salvar configuração</button>
        </div>
      </details>

      <div className="update-install-steps">
        <article><i>1</i><div><strong>Verificar</strong><span>O BuildMaster compara a versão instalada com o manifesto.</span></div></article>
        <article><i>2</i><div><strong>Proteger</strong><span>Um backup dos jogadores é criado antes do download.</span></div></article>
        <article><i>3</i><div><strong>Instalar</strong><span>O Android pede confirmação. A mesma assinatura permite atualizar por cima.</span></div></article>
      </div>

      <div className="settings-explanation-card"><ExternalLink size={19} /><div><strong>Atualização fora da Play Store</strong><span>O Android sempre pede sua confirmação. Não desinstale a versão atual quando o APK novo tiver a mesma assinatura; assim os dados locais são mantidos.</span></div></div>
    </section>
  );
}
