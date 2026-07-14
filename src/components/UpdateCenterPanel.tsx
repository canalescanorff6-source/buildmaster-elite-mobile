'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
        const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return;
        const ignored = readMigratedPreference(IGNORED_KEY, LEGACY_KEYS.ignored) || '';
        const result = evaluateUpdateManifest(await response.json() as unknown, APP_RELEASE_VERSION, CURRENT_BUILD_ID, ignored);
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

  const checkForUpdates = useCallback(async (silent = false) => {
    const url = manifestUrl.trim();
    if (!url) {
      if (!silent) setMessage('Defina a URL do manifesto ou gere o APK pelo workflow atualizado.');
      return;
    }
    setChecking(true);
    try {
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.json() as unknown;
      const ignored = readMigratedPreference(IGNORED_KEY, LEGACY_KEYS.ignored) || '';
      const result = evaluateUpdateManifest(raw, APP_RELEASE_VERSION, CURRENT_BUILD_ID, ignored);
      setManifest(result.manifest);
      setAvailable(result.available);
      setMessage(result.reason);
      const checkedAt = new Date().toISOString();
      setLastCheck(checkedAt);
      localStorage.setItem(LAST_CHECK_KEY, checkedAt);
    } catch {
      if (!silent) setMessage('Não foi possível consultar atualizações. Verifique a internet e a URL configurada.');
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

  function downloadUpdate() {
    if (!manifest) return;
    try {
      void onPrepareBackup();
    } catch {
      // A atualização continua disponível mesmo se o navegador bloquear o download do backup.
    }
    const target = manifest.apkUrl || manifest.otaUrl;
    if (!target) {
      setMessage('A atualização não possui um endereço de download válido.');
      return;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
    setMessage(manifest.updateType === 'apk'
      ? 'Backup de segurança criado. O Android abrirá o download e pedirá confirmação para instalar.'
      : 'Backup de segurança criado. O pacote de atualização foi aberto.');
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
    <section className="update-center-panel luxury-panel settings-view-panel">
      <div className="section-title-row">
        <div><p className="kicker"><RefreshCw size={15} /> Atualizações</p><h3>Central de atualização do aplicativo</h3></div>
        <span>v{APP_RELEASE_VERSION} • {buildShort}</span>
      </div>

      <div className="health-score-grid">
        <article><strong>{APP_RELEASE_VERSION}</strong><span>Versão instalada</span></article>
        <article><strong>{APP_NATIVE_VERSION}</strong><span>Base nativa</span></article>
        <article><strong>{available ? 'Disponível' : 'Atualizado'}</strong><span>Situação</span></article>
        <article><strong>{lastCheck ? new Date(lastCheck).toLocaleDateString('pt-BR') : 'Nunca'}</strong><span>Última busca</span></article>
      </div>

      <div className={`cloud-status-card ${available ? 'update-available' : ''}`}>
        {checking ? <Loader2 className="spin" size={16} /> : available ? <Download size={16} /> : <CheckCircle2 size={16} />}
        <span>{message}</span>
      </div>

      {manifest && (
        <div className="update-release-card">
          <div><strong>v{manifest.version}</strong><span>{manifest.channel === 'stable' ? 'Canal estável' : 'Canal beta'} • {manifest.updateType.toUpperCase()}</span></div>
          <small>Publicada em {new Date(manifest.publishedAt).toLocaleString('pt-BR')}</small>
          {manifest.notes.length > 0 && <ul>{manifest.notes.slice(0, 6).map((note) => <li key={note}>{note}</li>)}</ul>}
          {manifest.checksum && <small>SHA-256: {manifest.checksum.slice(0, 16)}…</small>}
          {manifest.mandatory && <b><ShieldCheck size={14} /> Atualização importante</b>}
        </div>
      )}

      <div className="safety-actions-grid update-actions-grid">
        <button type="button" onClick={() => void checkForUpdates(false)} disabled={checking}><RefreshCw size={17} /><strong>Buscar atualização</strong><span>Consulta a versão publicada mais recente.</span></button>
        <button type="button" onClick={downloadUpdate} disabled={!available || !manifest}><Download size={17} /><strong>Backup e atualizar</strong><span>Cria uma cópia local antes de abrir o download.</span></button>
        <button type="button" onClick={ignoreCurrent} disabled={!available || !manifest || Boolean(manifest?.mandatory)}><Smartphone size={17} /><strong>Ignorar revisão</strong><span>Disponível somente para atualização não obrigatória.</span></button>
      </div>

      <details className="settings-details-card">
        <summary>Configuração da atualização automática</summary>
        <div className="update-settings-grid">
          <label><span>URL do manifesto de atualização</span><input value={manifestUrl} onChange={(event) => setManifestUrl(event.target.value)} placeholder="https://.../update-manifest.json" /></label>
          <label className="update-toggle"><input type="checkbox" checked={autoCheck} onChange={(event) => setAutoCheck(event.target.checked)} /><span>Verificar automaticamente ao abrir o app</span></label>
          <button type="button" onClick={savePreferences}><Zap size={15} /> Salvar configuração</button>
        </div>
      </details>

      <div className="settings-explanation-card"><ExternalLink size={19} /><div><strong>Como funciona</strong><span>O GitHub Actions pode gerar um APK e um manifesto novo em cada envio para a branch main. O app avisa e abre o download. Por segurança do Android, a instalação do APK ainda exige sua confirmação. Mudanças nativas sempre exigem APK novo.</span></div></div>
    </section>
  );
}
