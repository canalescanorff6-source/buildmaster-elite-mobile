'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  WifiOff
} from 'lucide-react';
import {
  APP_NATIVE_VERSION,
  APP_RELEASE_VERSION,
  DEFAULT_UPDATE_MANIFEST_URL,
  CURRENT_BUILD_ID,
  evaluateUpdateManifest,
  isTrustedManifestUrl,
  isTrustedReleaseApiUrl,
  type AppUpdateManifest,
  type InstalledAppInfo
} from '@/lib/appUpdates';
import { fetchUpdateManifest, type UpdateChannelSource } from '@/lib/updateChannel';
import { DefinitiveUpdateCenter } from '@/modules/updates/DefinitiveUpdateCenter';
import { getUpdateEvaluationOptions, readUpdateChannelPreference } from '@/modules/updates/updateGovernance';
import {
  appendUpdateAudit,
  clearUpdateAudit,
  formatUpdateAudit,
  readUpdateAudit,
  type UpdateAuditEntry
} from '@/lib/updateAudit';
import {
  canWriteLocalStorage,
  safeStorageGet,
  safeStorageGetJson,
  safeStorageRemove,
  safeStorageSet,
  safeStorageSetJson
} from '@/lib/safeLocalStorage';
import {
  clearUpdateRouteHealth,
  describeUpdateRouteHealth,
  rankUpdateCandidatesByHealth,
  recordUpdateRouteFailure,
  recordUpdateRouteSuccess
} from '@/lib/updateRouteHealth';
import {
  downloadVerifyAndInstallApk,
  getNativeInstallInfo,
  onApkDownloadProgress,
  openInstallPermissionSettings,
  type ApkDownloadProgress
} from '@/lib/secureStorage';

const AUTO_KEY = 'buildmaster_auto_update_check';
const AUTO_INSTALL_KEY = 'buildmaster_auto_update_install';
const AUTO_INSTALL_ATTEMPT_KEY = 'buildmaster_auto_update_attempt';
const AUTO_PERMISSION_PROMPT_KEY = 'buildmaster_auto_update_permission_prompt';
const IGNORED_KEY = 'buildmaster_ignored_update_build';
const LAST_CHECK_KEY = 'buildmaster_last_update_check';
const PENDING_KEY = 'buildmaster_pending_update';
const BACKUP_READY_KEY = 'buildmaster_update_backup_ready_build';
const AUTO_INTERVAL_MS = 6 * 60 * 60 * 1000;
const AUTO_THROTTLE_MS = 90 * 1000;
const AUTO_INSTALL_COOLDOWN_MS = 6 * 60 * 60 * 1000;

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

function formatBytes(value?: number) {
  if (!value || value <= 0) return 'tamanho confirmado após o download';
  const mb = value / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 1 : 2)} MB`;
}

function isIntegrityDownloadError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : String(cause || '');
  const lower = message.toLowerCase();
  return lower.includes('sha-256')
    || lower.includes('checksum')
    || lower.includes('tamanho do apk')
    || lower.includes('apk/zip')
    || lower.includes('apk android válido')
    || lower.includes('no lugar do apk')
    || lower.includes('http 403')
    || lower.includes('http 408')
    || lower.includes('http 429')
    || lower.includes('http 5');
}

function updateErrorMessage(cause: unknown) {
  const message = cause instanceof Error ? cause.message : String(cause || '');
  const lower = message.toLowerCase();
  if (lower.includes('assinatura') || lower.includes('signature')) {
    return 'O Android recusou a atualização porque a assinatura instalada não corresponde à assinatura permanente do canal oficial.';
  }
  if (lower.includes('versioncode') || lower.includes('não é mais nova')) {
    return 'O pacote publicado não possui um versionCode maior que o instalado. Uma nova publicação precisa ser gerada.';
  }
  if (lower.includes('sha-256') || lower.includes('checksum') || lower.includes('tamanho')) {
    return `O arquivo recebido não corresponde ao pacote publicado. Ele foi apagado e o app tentará outra rota oficial. Detalhe técnico: ${message}`;
  }
  if (lower.includes('manifesto') || lower.includes('json válido') || lower.includes('release indicada')) {
    return `O canal de atualização respondeu com dados inválidos. Detalhe: ${message}`;
  }
  if (lower.includes('http 403') || lower.includes('http 429')) {
    return 'O GitHub limitou temporariamente as consultas. Aguarde alguns minutos e toque em “Verificar agora”.';
  }
  if (lower.includes('apk android válido') || lower.includes('arquivo não é um apk') || lower.includes('zip')) {
    return 'O download não era um APK Android válido. O arquivo foi descartado antes de abrir o instalador.';
  }
  if (lower.includes('instalador de pacotes')) {
    return 'O Android não encontrou o instalador de pacotes. Reinicie o aparelho e tente novamente.';
  }
  if (lower.includes('http 404')) return 'A release oficial ainda não contém o APK ou o manifesto desta versão.';
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('alcançar') || lower.includes('network')) {
    return 'A conexão com o canal oficial demorou demais. Verifique a internet e tente novamente.';
  }
  return message || 'A instalação segura não pôde ser iniciada.';
}

type DiagnosticStatus = 'ok' | 'warning' | 'error';

type DiagnosticItem = {
  id: string;
  label: string;
  status: DiagnosticStatus;
  detail: string;
};

type Props = { onPrepareBackup: () => Promise<void> | void };
type AutoCheckerProps = { onPrepareBackup?: () => Promise<void> | void };

function channelLabel(source: UpdateChannelSource | null) {
  if (source === 'primary-channel') return 'Canal principal independente';
  if (source === 'beta-channel') return 'Canal de testes independente';
  if (source === 'legacy-manifest') return 'Ponte para versões antigas';
  if (source === 'release-api') return 'Release mais nova de reserva';
  return 'Ainda não consultado';
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

export function UpdateAutoChecker({ onPrepareBackup }: AutoCheckerProps = {}) {
  const lastAttemptRef = useRef(0);
  const autoInstallRunningRef = useRef(false);
  const backupRef = useRef(onPrepareBackup);

  useEffect(() => {
    backupRef.current = onPrepareBackup;
  }, [onPrepareBackup]);

  useEffect(() => {
    let active = true;
    let timer: number | null = null;

    function emitStatus(message: string, outcome: 'info' | 'success' | 'warning' | 'error' = 'info') {
      window.dispatchEvent(new CustomEvent('buildmaster:auto-update-status', { detail: { message, outcome } }));
    }

    async function tryAutomaticInstall(manifests: AppUpdateManifest[], installed: InstalledAppInfo) {
      const manifest = manifests[0];
      if (!manifest) return;
      if (!active || !Capacitor.isNativePlatform() || safeStorageGet(AUTO_INSTALL_KEY) === '0' || autoInstallRunningRef.current) return;
      if (!installed.canInstallPackages) {
        appendUpdateAudit({
          phase: 'install',
          outcome: 'warning',
          message: `A v${manifest.version} foi detectada e o Android precisa liberar “Instalar apps desconhecidos”.`,
          detail: 'A tela oficial de permissão será aberta uma vez; depois o fluxo volta a ser automático.'
        });
        emitStatus(`A v${manifest.version} está pronta. Ative “Permitir desta fonte”; ao voltar, o download continuará automaticamente.`, 'warning');
        let shouldOpenPermission = true;
        try {
          const previousPrompt = safeStorageGetJson<{ buildId?: string; at?: number } | null>(AUTO_PERMISSION_PROMPT_KEY, null);
          shouldOpenPermission = previousPrompt?.buildId !== manifest.buildId || Number(previousPrompt?.at || 0) < Date.now() - 24 * 60 * 60 * 1000;
        } catch { /* abre novamente com segurança */ }
        if (shouldOpenPermission) {
          safeStorageSetJson(AUTO_PERMISSION_PROMPT_KEY, { buildId: manifest.buildId, at: Date.now() });
          lastAttemptRef.current = 0;
          try { await openInstallPermissionSettings(); } catch { /* o painel mantém a orientação visível */ }
        }
        return;
      }

      try {
        const previous = safeStorageGetJson<{ buildId?: string; at?: number } | null>(AUTO_INSTALL_ATTEMPT_KEY, null);
        if (previous?.buildId === manifest.buildId && Number(previous.at || 0) > Date.now() - AUTO_INSTALL_COOLDOWN_MS) return;
      } catch {
        safeStorageRemove(AUTO_INSTALL_ATTEMPT_KEY);
      }

      autoInstallRunningRef.current = true;
      safeStorageSetJson(AUTO_INSTALL_ATTEMPT_KEY, { buildId: manifest.buildId, at: Date.now() });
      emitStatus(`Baixando automaticamente a v${manifest.version}. Mantenha o aplicativo aberto...`);
      appendUpdateAudit({ phase: 'download', outcome: 'info', message: `Download automático da v${manifest.version} iniciado.` });

      try {
        try {
          await backupRef.current?.();
          appendUpdateAudit({ phase: 'backup', outcome: 'success', message: 'Cópia local de recuperação atualizada antes do download automático.' });
        } catch (backupError) {
          appendUpdateAudit({
            phase: 'backup',
            outcome: 'warning',
            message: 'A cópia extra de recuperação não pôde ser atualizada, mas os dados locais foram preservados.',
            detail: backupError instanceof Error ? backupError.message : String(backupError)
          });
        }

        let installedResult: Awaited<ReturnType<typeof downloadVerifyAndInstallApk>> | null = null;
        let lastRouteError: unknown = null;
        for (let routeIndex = 0; routeIndex < manifests.length; routeIndex += 1) {
          const routeManifest = manifests[routeIndex];
          appendUpdateAudit({
            phase: 'download',
            outcome: 'info',
            message: `Rota automática ${routeIndex + 1}/${manifests.length}.`,
            detail: `${routeManifest.releaseTag || 'canal oficial'} • ${routeManifest.assetName || 'APK oficial'}`
          });
          try {
            installedResult = await downloadVerifyAndInstallApk({
              url: routeManifest.apkUrl,
              checksum: routeManifest.checksum,
              expectedPackageName: routeManifest.appId,
              expectedVersionCode: routeManifest.versionCode,
              expectedVersionName: routeManifest.version,
              expectedSizeBytes: routeManifest.sizeBytes,
              maxAttempts: 4
            });
            recordUpdateRouteSuccess(routeManifest);
            break;
          } catch (routeError) {
            lastRouteError = routeError;
            recordUpdateRouteFailure(routeManifest, routeError instanceof Error ? routeError.message : String(routeError), isIntegrityDownloadError(routeError));
            if (!isIntegrityDownloadError(routeError) || routeIndex === manifests.length - 1) throw routeError;
            appendUpdateAudit({
              phase: 'download',
              outcome: 'warning',
              message: 'A rota recebida não passou na integridade; tentando a próxima origem oficial.',
              detail: routeError instanceof Error ? routeError.message : String(routeError)
            });
          }
        }
        if (!installedResult) throw lastRouteError || new Error('Nenhuma rota oficial entregou o APK.');
        if (installedResult.needsPermission) {
          safeStorageRemove(AUTO_INSTALL_ATTEMPT_KEY);
          lastAttemptRef.current = 0;
          emitStatus('Ative “Permitir desta fonte”; ao voltar, a atualização continuará automaticamente.', 'warning');
          appendUpdateAudit({ phase: 'install', outcome: 'warning', message: 'Permissão de instalação necessária para continuar.' });
          try { await openInstallPermissionSettings(); } catch { /* orientação permanece na central */ }
          return;
        }
        if (installedResult.verified) {
          emitStatus(`APK v${manifest.version} validado. Confirme “Atualizar” na tela do Android.`, 'success');
          appendUpdateAudit({
            phase: 'install',
            outcome: 'success',
            message: `APK v${manifest.version} baixado e validado automaticamente.`,
            detail: `SHA-256 ${installedResult.checksum || manifest.checksum}`
          });
        }
      } catch (cause) {
        const friendly = updateErrorMessage(cause);
        emitStatus(friendly, 'error');
        safeStorageRemove(AUTO_INSTALL_ATTEMPT_KEY);
        appendUpdateAudit({ phase: 'install', outcome: 'error', message: 'A atualização automática não pôde ser iniciada.', detail: friendly });
      } finally {
        autoInstallRunningRef.current = false;
      }
    }

    async function check() {
      if (!active || safeStorageGet(AUTO_KEY) === '0' || (!isTrustedManifestUrl() && !isTrustedManifestUrl(DEFAULT_UPDATE_MANIFEST_URL) && !isTrustedReleaseApiUrl())) return;
      const now = Date.now();
      if (now - lastAttemptRef.current < AUTO_THROTTLE_MS) return;
      lastAttemptRef.current = now;
      try {
        const installed = await readInstalledInfo();
        const ignored = safeStorageGet(IGNORED_KEY) || '';
        const fetched = await fetchUpdateManifest(readUpdateChannelPreference());
        const result = evaluateUpdateManifest(fetched.payload, installed, CURRENT_BUILD_ID, ignored, getUpdateEvaluationOptions());
        const checkedAt = new Date().toISOString();
        safeStorageSet(LAST_CHECK_KEY, checkedAt);
        appendUpdateAudit({
          phase: 'auto-check',
          outcome: result.available ? 'success' : 'info',
          message: result.available ? `Atualização v${result.manifest?.version} detectada automaticamente.` : result.reason,
          detail: `Rota escolhida: ${channelLabel(fetched.source)} • ${fetched.candidates.length} rota(s) válida(s) comparada(s)`
        });
        if (!result.available || !result.manifest) {
          safeStorageRemove(PENDING_KEY);
          return;
        }
        safeStorageSetJson(PENDING_KEY, result.manifest);
        window.dispatchEvent(new CustomEvent('buildmaster:update-available', {
          detail: { version: result.manifest.version, reason: result.reason, mandatory: result.mandatory }
        }));
        const autoManifests = rankUpdateCandidatesByHealth(fetched.alternatives)
          .map((candidate) => candidate.manifest)
          .filter((candidate, index, all) => candidate.versionCode === result.manifest?.versionCode
            && all.findIndex((other) => other.apkUrl === candidate.apkUrl && other.checksum === candidate.checksum) === index);
        await tryAutomaticInstall(autoManifests.length ? autoManifests : [result.manifest], installed);
      } catch (cause) {
        appendUpdateAudit({
          phase: 'auto-check',
          outcome: 'warning',
          message: 'A verificação automática não conseguiu alcançar os canais oficiais.',
          detail: updateErrorMessage(cause)
        });
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
  const [autoInstall, setAutoInstall] = useState(true);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [awaitingPermission, setAwaitingPermission] = useState(false);
  const [message, setMessage] = useState('Aguardando verificação do canal oficial.');
  const [manifest, setManifest] = useState<AppUpdateManifest | null>(null);
  const [installed, setInstalled] = useState<InstalledAppInfo>(webInstallInfo());
  const [available, setAvailable] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [progress, setProgress] = useState<ApkDownloadProgress | null>(null);
  const [channelSource, setChannelSource] = useState<UpdateChannelSource | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticItem[]>([]);
  const [audit, setAudit] = useState<UpdateAuditEntry[]>([]);
  const [copied, setCopied] = useState(false);

  const channelReady = isTrustedManifestUrl() || isTrustedManifestUrl(DEFAULT_UPDATE_MANIFEST_URL) || isTrustedReleaseApiUrl();

  const refreshInstalledInfo = useCallback(async () => {
    const next = await readInstalledInfo();
    setInstalled(next);
    return next;
  }, []);

  const recordAudit = useCallback((entry: Parameters<typeof appendUpdateAudit>[0]) => {
    setAudit(appendUpdateAudit(entry));
  }, []);

  useEffect(() => {
    let active = true;
    setAudit(readUpdateAudit());
    try {
      setAutoCheck(safeStorageGet(AUTO_KEY) !== '0');
      setAutoInstall(safeStorageGet(AUTO_INSTALL_KEY) !== '0');
      setLastCheck(safeStorageGet(LAST_CHECK_KEY));
    } catch { /* opcional */ }

    void refreshInstalledInfo().then((current) => {
      if (!active) return;
      try {
        const pending = safeStorageGet(PENDING_KEY);
        if (!pending) return;
        const parsed = safeStorageGetJson<AppUpdateManifest | null>(PENDING_KEY, null);
        if (!parsed) throw new Error('Manifesto pendente inválido.');
        const result = evaluateUpdateManifest(parsed, current, CURRENT_BUILD_ID, safeStorageGet(IGNORED_KEY) || '', getUpdateEvaluationOptions());
        setManifest(result.manifest);
        setAvailable(result.available);
        if (result.available) setMessage(`Atualização v${result.manifest?.version} já detectada. Pronta para validar e instalar.`);
      } catch {
        safeStorageRemove(PENDING_KEY);
      }
    });

    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ version?: string; reason?: string }>).detail;
      setAvailable(true);
      setMessage(detail?.version ? `Nova versão v${detail.version} detectada automaticamente.` : detail?.reason || 'Nova atualização detectada.');
      try {
        const pending = safeStorageGetJson<AppUpdateManifest | null>(PENDING_KEY, null);
        if (pending) setManifest(pending);
      } catch { /* sem bloqueio */ }
    };
    const onAutoStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      if (detail?.message) setMessage(detail.message);
      setAudit(readUpdateAudit());
      try {
        const pending = safeStorageGet(PENDING_KEY);
        if (pending) {
          const parsed = safeStorageGetJson<AppUpdateManifest | null>(PENDING_KEY, null);
          if (!parsed) throw new Error('Manifesto pendente inválido.');
          setManifest(parsed);
          setAvailable(true);
        }
      } catch { /* sem bloqueio */ }
    };
    window.addEventListener('buildmaster:update-available', onUpdate);
    window.addEventListener('buildmaster:auto-update-status', onAutoStatus);
    return () => {
      active = false;
      window.removeEventListener('buildmaster:update-available', onUpdate);
      window.removeEventListener('buildmaster:auto-update-status', onAutoStatus);
    };
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
            setMessage('Permissão liberada. Toque novamente em atualizar para continuar.');
            recordAudit({ phase: 'install', outcome: 'success', message: 'Permissão “Instalar apps desconhecidos” liberada.' });
          }
        });
      }, 700);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [awaitingPermission, recordAudit, refreshInstalledInfo]);

  const checkForUpdates = useCallback(async (silent = false) => {
    if (!channelReady) {
      if (!silent) setMessage('Este APK não contém o endereço oficial de atualização. Gere-o pelo workflow oficial de APK.');
      return;
    }
    setChecking(true);
    if (!silent) setMessage('Conectando ao canal oficial...');
    try {
      const current = await refreshInstalledInfo();
      const ignored = safeStorageGet(IGNORED_KEY) || '';
      const fetched = await fetchUpdateManifest(readUpdateChannelPreference());
      setChannelSource(fetched.source);
      const result = evaluateUpdateManifest(fetched.payload, current, CURRENT_BUILD_ID, ignored, getUpdateEvaluationOptions());
      setManifest(result.manifest);
      setAvailable(result.available);
      setMessage(result.reason);
      const checkedAt = fetched.checkedAt;
      setLastCheck(checkedAt);
      safeStorageSet(LAST_CHECK_KEY, checkedAt);
      if (result.available && result.manifest) safeStorageSetJson(PENDING_KEY, result.manifest);
      else safeStorageRemove(PENDING_KEY);
      recordAudit({
        phase: silent ? 'auto-check' : 'manual-check',
        outcome: result.available ? 'success' : result.valid ? 'info' : 'error',
        message: result.reason,
        detail: `Rota escolhida: ${channelLabel(fetched.source)} • ${fetched.candidates.length} rota(s) válida(s) comparada(s)${fetched.previousErrors.length ? ` • observações: ${fetched.previousErrors.join(' | ')}` : ''}`
      });
    } catch (cause) {
      const friendly = updateErrorMessage(cause);
      if (!silent) setMessage(friendly);
      recordAudit({ phase: silent ? 'auto-check' : 'manual-check', outcome: 'error', message: 'Falha ao verificar atualização.', detail: friendly });
    } finally {
      setChecking(false);
    }
  }, [channelReady, recordAudit, refreshInstalledInfo]);

  useEffect(() => {
    if (!autoCheck || !channelReady) return;
    const timer = window.setTimeout(() => void checkForUpdates(true), 1300);
    return () => window.clearTimeout(timer);
  }, [autoCheck, channelReady, checkForUpdates]);

  const buildShort = useMemo(() => CURRENT_BUILD_ID === 'local-build' ? 'local' : CURRENT_BUILD_ID.slice(0, 8), []);
  const progressLabel = progress?.phase === 'connecting' ? 'Conectando ao GitHub'
    : progress?.phase === 'downloading-system' ? `Android baixando ${progress.percent}%`
    : progress?.phase === 'downloading-http' || progress?.phase === 'downloading' ? `Baixando pela rota reserva ${progress.percent}%`
      : progress?.phase === 'verifying' ? 'Conferindo arquivo e assinatura'
        : progress?.phase === 'ready' ? 'APK validado' : '';

  const diagnosticSummary = useMemo(() => {
    if (!diagnostic.length) return null;
    const errors = diagnostic.filter((item) => item.status === 'error').length;
    const warnings = diagnostic.filter((item) => item.status === 'warning').length;
    if (errors) return { className: 'error', label: `${errors} bloqueio(s) encontrado(s)` };
    if (warnings) return { className: 'warning', label: `${warnings} atenção(ões), sem bloqueio crítico` };
    return { className: 'ok', label: 'Tudo pronto para a atualização automática' };
  }, [diagnostic]);

  async function runDiagnostic() {
    setDiagnosing(true);
    setDiagnostic([]);
    setMessage('Executando teste do atualizador sem baixar o APK...');
    const items: DiagnosticItem[] = [];
    try {
      items.push({
        id: 'network',
        label: 'Conexão do aparelho',
        status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'warning' : 'ok',
        detail: typeof navigator !== 'undefined' && navigator.onLine === false ? 'O aparelho informa que está offline.' : 'O aparelho informa conexão disponível.'
      });
      items.push({
        id: 'trusted-channel',
        label: 'Endereços oficiais',
        status: channelReady ? 'ok' : 'error',
        detail: channelReady ? 'Canal independente, ponte de compatibilidade e API da release pertencem ao repositório oficial.' : 'O APK não contém um canal confiável configurado.'
      });

      const current = await refreshInstalledInfo();
      items.push({
        id: 'installed-package',
        label: 'Identidade instalada',
        status: current.packageName === 'com.buildmaster.elitetatico' ? 'ok' : 'error',
        detail: `${current.packageName} • versão ${current.versionName} • versionCode ${current.versionCode || 'web'}`
      });

      const fetched = await fetchUpdateManifest(readUpdateChannelPreference());
      setChannelSource(fetched.source);
      const result = evaluateUpdateManifest(fetched.payload, current, CURRENT_BUILD_ID, safeStorageGet(IGNORED_KEY) || '', getUpdateEvaluationOptions());
      setManifest(result.manifest);
      setAvailable(result.available);
      items.push({
        id: 'manifest',
        label: 'Manifesto oficial',
        status: result.valid ? 'ok' : 'error',
        detail: result.valid && result.manifest
          ? `v${result.manifest.version} • code ${result.manifest.versionCode} • ${channelLabel(fetched.source)} • ${fetched.candidates.length} rota(s) válida(s)`
          : result.reason
      });
      items.push({
        id: 'comparison',
        label: 'Comparação de versões',
        status: result.valid ? 'ok' : 'error',
        detail: result.reason
      });
      if (result.manifest) {
        items.push({
          id: 'route-health',
          label: 'Histórico da rota escolhida',
          status: describeUpdateRouteHealth(result.manifest).includes('em espera') ? 'warning' : 'ok',
          detail: describeUpdateRouteHealth(result.manifest)
        });
      }
      items.push({
        id: 'permission',
        label: 'Permissão do instalador',
        status: current.platform === 'web' || current.canInstallPackages ? 'ok' : 'warning',
        detail: current.platform === 'web' ? 'Teste web: a instalação real ocorre no APK Android.' : current.canInstallPackages ? 'Permissão liberada para abrir o instalador.' : 'O Android pedirá “Permitir desta fonte” antes da primeira instalação pelo app.'
      });

      if (canWriteLocalStorage()) {
        items.push({ id: 'storage', label: 'Estado local do atualizador', status: 'ok', detail: 'Cache, manifesto pendente e histórico podem ser gravados normalmente.' });
      } else {
        items.push({ id: 'storage', label: 'Estado local do atualizador', status: 'error', detail: 'O armazenamento local está bloqueado ou sem espaço; o app não consegue guardar o estado da atualização.' });
      }

      setDiagnostic(items);
      const errors = items.filter((item) => item.status === 'error').length;
      const warnings = items.filter((item) => item.status === 'warning').length;
      const finalMessage = errors
        ? 'O teste encontrou um bloqueio. Veja o item vermelho abaixo.'
        : warnings
          ? 'O canal está funcionando. Há uma permissão ou condição que será resolvida durante a instalação.'
          : 'Teste aprovado. O atualizador está pronto para detectar, baixar, validar e abrir o instalador.';
      setMessage(finalMessage);
      recordAudit({ phase: 'diagnostic', outcome: errors ? 'error' : warnings ? 'warning' : 'success', message: finalMessage, detail: items.map((item) => `${item.label}: ${item.status}`).join(' • ') });
    } catch (cause) {
      const friendly = updateErrorMessage(cause);
      items.push({ id: 'channel-failure', label: 'Consulta pública', status: 'error', detail: friendly });
      setDiagnostic(items);
      setMessage(friendly);
      recordAudit({ phase: 'diagnostic', outcome: 'error', message: 'Teste do atualizador falhou.', detail: friendly });
    } finally {
      setDiagnosing(false);
    }
  }

  async function installUpdate() {
    if (!manifest?.apkUrl || !manifest.checksum) return;
    setInstalling(true);
    setProgress(null);
    try {
      const current = await refreshInstalledInfo();
      // Nunca instala usando apenas o manifesto guardado: o SHA-256 e o URL
      // são atualizados diretamente no canal oficial antes de cada download.
      setMessage('Atualizando os dados do pacote oficial...');
      const fetched = await fetchUpdateManifest(readUpdateChannelPreference());
      setChannelSource(fetched.source);
      const freshResult = evaluateUpdateManifest(fetched.payload, current, CURRENT_BUILD_ID, '', getUpdateEvaluationOptions());
      if (!freshResult.valid || !freshResult.manifest) throw new Error(freshResult.reason);
      if (!freshResult.available) {
        setManifest(freshResult.manifest);
        setAvailable(false);
        safeStorageRemove(PENDING_KEY);
        setMessage(freshResult.reason);
        recordAudit({ phase: 'install', outcome: 'info', message: freshResult.reason });
        return;
      }
      let targetManifest = freshResult.manifest;
      setManifest(targetManifest);
      setAvailable(true);
      safeStorageSetJson(PENDING_KEY, targetManifest);

      if (!Capacitor.isNativePlatform()) {
        window.open(targetManifest.apkUrl, '_blank', 'noopener,noreferrer');
        setMessage('No navegador, o APK é aberto externamente. O fluxo automático completo funciona dentro do aplicativo Android.');
        return;
      }

      if (!current.canInstallPackages) {
        setAwaitingPermission(true);
        setMessage('O Android precisa permitir que o BuildMaster abra o instalador. Ative “Permitir desta fonte” e volte ao app.');
        recordAudit({ phase: 'install', outcome: 'warning', message: 'Permissão de instalação solicitada ao Android.' });
        await openInstallPermissionSettings();
        return;
      }

      if (safeStorageGet(BACKUP_READY_KEY) !== targetManifest.buildId) {
        setMessage('Criando uma cópia local de recuperação antes da atualização...');
        recordAudit({ phase: 'backup', outcome: 'info', message: `Preparando cópia local antes da v${targetManifest.version}.` });
        try {
          await onPrepareBackup();
          safeStorageSet(BACKUP_READY_KEY, targetManifest.buildId);
          recordAudit({ phase: 'backup', outcome: 'success', message: 'Cópia local de recuperação concluída.' });
        } catch (backupError) {
          recordAudit({
            phase: 'backup',
            outcome: 'warning',
            message: 'A cópia extra de recuperação falhou, mas a atualização continuará sem apagar os dados locais.',
            detail: backupError instanceof Error ? backupError.message : String(backupError)
          });
        }
      }

      const runVerifiedInstall = (target: AppUpdateManifest) => downloadVerifyAndInstallApk({
        url: target.apkUrl,
        checksum: target.checksum,
        expectedPackageName: target.appId,
        expectedVersionCode: target.versionCode,
        expectedVersionName: target.version,
        expectedSizeBytes: target.sizeBytes,
        maxAttempts: 4
      });

      const routeCandidates = rankUpdateCandidatesByHealth(fetched.alternatives)
        .filter((candidate) => candidate.manifest.versionCode === targetManifest.versionCode)
        .filter((candidate, index, all) => all.findIndex((other) => other.manifest.apkUrl === candidate.manifest.apkUrl
          && other.manifest.checksum === candidate.manifest.checksum) === index);
      if (!routeCandidates.some((candidate) => candidate.manifest.apkUrl === targetManifest.apkUrl)) {
        routeCandidates.unshift({ ...fetched, manifest: targetManifest, payload: targetManifest });
      }

      let result: Awaited<ReturnType<typeof downloadVerifyAndInstallApk>> | null = null;
      let lastFailure: unknown = null;
      for (let routeIndex = 0; routeIndex < routeCandidates.length; routeIndex += 1) {
        const route = routeCandidates[routeIndex];
        targetManifest = route.manifest;
        setChannelSource(route.source);
        setManifest(targetManifest);
        safeStorageSetJson(PENDING_KEY, targetManifest);
        setProgress(null);
        setMessage(routeIndex === 0
          ? 'Baixando o APK oficial pela rota principal validada...'
          : `A rota anterior divergiu. Tentando a origem oficial ${routeIndex + 1}/${routeCandidates.length}...`);
        recordAudit({
          phase: 'download',
          outcome: 'info',
          message: `Testando rota oficial ${routeIndex + 1}/${routeCandidates.length}.`,
          detail: `${channelLabel(route.source)} • ${targetManifest.releaseTag || 'canal'} • ${targetManifest.assetName || 'APK oficial'} • ${describeUpdateRouteHealth(targetManifest)}`
        });
        try {
          result = await runVerifiedInstall(targetManifest);
          recordUpdateRouteSuccess(targetManifest);
          break;
        } catch (cause) {
          lastFailure = cause;
          recordUpdateRouteFailure(targetManifest, cause instanceof Error ? cause.message : String(cause), isIntegrityDownloadError(cause));
          recordAudit({
            phase: 'download',
            outcome: isIntegrityDownloadError(cause) ? 'warning' : 'error',
            message: `A rota ${routeIndex + 1} não concluiu a validação.`,
            detail: cause instanceof Error ? cause.message : String(cause)
          });
          if (!isIntegrityDownloadError(cause) || routeIndex === routeCandidates.length - 1) throw cause;
          await new Promise((resolve) => window.setTimeout(resolve, 1000 * (routeIndex + 1)));
        }
      }

      if (!result) throw lastFailure || new Error('Nenhuma rota oficial entregou um APK íntegro.');
      if (result.needsPermission) {
        setAwaitingPermission(true);
        setMessage('Libere “Permitir desta fonte” nas configurações do Android e tente novamente.');
        recordAudit({ phase: 'install', outcome: 'warning', message: 'O Android solicitou a permissão de instalação.' });
        await openInstallPermissionSettings();
      } else if (result.verified) {
        setMessage('APK oficial validado. Confirme “Atualizar” na tela do instalador Android. Seus dados serão mantidos.');
        recordAudit({ phase: 'install', outcome: 'success', message: `APK v${targetManifest.version} validado e entregue ao instalador Android.`, detail: `SHA-256 ${result.checksum || targetManifest.checksum} • host ${result.responseHost || 'não informado'} • tipo ${result.contentType || 'não informado'} • transporte ${result.transport || 'não informado'} • bytes ${result.contentLength ?? targetManifest.sizeBytes ?? 'não informado'}${result.etag ? ` • etag ${result.etag}` : ''}` });
      }
    } catch (cause) {
      const friendly = updateErrorMessage(cause);
      setMessage(friendly);
      recordAudit({ phase: 'install', outcome: 'error', message: 'A atualização não pôde ser iniciada.', detail: friendly });
    } finally {
      setInstalling(false);
    }
  }

  function ignoreCurrent() {
    if (!manifest || manifest.mandatory) return;
    safeStorageSet(IGNORED_KEY, manifest.buildId);
    setAvailable(false);
    setMessage('Esta revisão foi ignorada neste aparelho.');
    recordAudit({ phase: 'cache', outcome: 'info', message: `Revisão ${manifest.version} ignorada neste aparelho.` });
  }

  async function copyDiagnostic() {
    const report = [
      'BuildMaster Elite Tático — Diagnóstico do Atualizador',
      `App: ${APP_RELEASE_VERSION} (${CURRENT_BUILD_ID})`,
      `Instalado: ${installed.versionName} • code ${installed.versionCode} • ${installed.packageName}`,
      `Plataforma: ${installed.platform}`,
      `Canal: ${channelLabel(channelSource)}`,
      `Mensagem atual: ${message}`,
      '',
      'TESTE:',
      ...(diagnostic.length ? diagnostic.map((item) => `- [${item.status.toUpperCase()}] ${item.label}: ${item.detail}`) : ['- Teste ainda não executado.']),
      '',
      'HISTÓRICO:',
      formatUpdateAudit(audit) || 'Sem eventos registrados.'
    ].join('\n');
    await copyText(report);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function resetUpdateState() {
    safeStorageRemove(IGNORED_KEY);
    safeStorageRemove(PENDING_KEY);
    safeStorageRemove(BACKUP_READY_KEY);
    safeStorageRemove(AUTO_INSTALL_ATTEMPT_KEY);
    safeStorageRemove(AUTO_PERMISSION_PROMPT_KEY);
    safeStorageRemove(LAST_CHECK_KEY);
    clearUpdateAudit();
    clearUpdateRouteHealth();
    setAudit([]);
    setDiagnostic([]);
    setManifest(null);
    setAvailable(false);
    setLastCheck(null);
    setProgress(null);
    setMessage('Estado do atualizador limpo. Toque em “Verificar agora” para consultar novamente.');
    recordAudit({ phase: 'cache', outcome: 'success', message: 'Cache do atualizador limpo sem apagar fichas ou configurações do app.' });
  }

  return (
    <section className="update-center-panel luxury-panel settings-view-panel settings-final-panel">
      <div className="settings-panel-heading">
        <div><p className="kicker"><RefreshCw size={15} /> Atualizações</p><h3>Atualização automática com diagnóstico</h3><span>Detecta a nova versão, protege seus dados, confere o APK e abre o instalador Android sem baixar manualmente pelo GitHub.</span></div>
        <span className="settings-state-pill">v{installed.versionName || APP_RELEASE_VERSION} • {buildShort}</span>
      </div>

      <div className="update-readiness-grid">
        <article className="is-ready"><CheckCircle2 size={18} /><div><span>Versão instalada</span><strong>{installed.versionName || APP_RELEASE_VERSION}</strong><small>versionCode {installed.versionCode || 'web'} • base {APP_NATIVE_VERSION}</small></div></article>
        <article className={channelReady ? 'is-ready' : 'needs-attention'}><ShieldCheck size={18} /><div><span>Canal oficial</span><strong>{channelReady ? channelLabel(channelSource) : 'Não configurado'}</strong><small>canal independente + ponte antiga + release de reserva</small></div></article>
        <article className={!Capacitor.isNativePlatform() || installed.canInstallPackages ? 'is-ready' : 'needs-attention'}><Settings size={18} /><div><span>Permissão Android</span><strong>{!Capacitor.isNativePlatform() ? 'Teste web' : installed.canInstallPackages ? 'Liberada' : 'Será solicitada'}</strong><small>o Android exige confirmação do usuário</small></div></article>
        <article className={available ? 'update-ready' : 'is-ready'}>{available ? <Download size={18} /> : <CheckCircle2 size={18} />}<div><span>Situação</span><strong>{available ? `Nova v${manifest?.version}` : 'Atualizado'}</strong><small>{manifest ? `code ${manifest.versionCode}` : 'aguardando manifesto'}</small></div></article>
      </div>

      <div className={`cloud-status-card update-status-final ${available ? 'update-available' : ''}`} role="status" aria-live="polite">
        {checking || installing || diagnosing ? <Loader2 className="spin" size={17} /> : available ? <Download size={17} /> : <CheckCircle2 size={17} />}
        <div><strong>{installing ? progressLabel || 'Instalação segura' : diagnosing ? 'Testando atualizador' : checking ? 'Verificando canal' : available ? 'Atualização disponível' : 'Status da atualização'}</strong><span>{message}</span></div>
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
          <div className="update-release-details"><span>Publicada em {new Date(manifest.publishedAt).toLocaleString('pt-BR')}</span>{manifest.notes.length > 0 && <ul>{manifest.notes.slice(0, 6).map((note) => <li key={note}>{note}</li>)}</ul>}<small>Canal: {manifest.releaseTag || 'compatibilidade'} • SHA-256: {manifest.checksum}</small>{manifest.mandatory && <b><ShieldCheck size={14} /> Atualização obrigatória</b>}</div>
        </div>
      )}

      {awaitingPermission && (
        <div className="settings-explanation-card update-permission-help"><AlertTriangle size={19} /><div><strong>Permissão de instalação pendente</strong><span>Na tela do Android, ative “Permitir desta fonte”, volte ao BuildMaster e toque novamente no botão de atualizar.</span></div></div>
      )}

      <div className="safety-actions-grid update-actions-grid update-final-actions">
        <button type="button" onClick={() => void checkForUpdates(false)} disabled={checking || installing || diagnosing}><RefreshCw size={18} /><strong>Verificar agora</strong><span>Consulta versão, versionCode e integridade.</span><small>Não modifica o aplicativo</small></button>
        <button type="button" onClick={() => void installUpdate()} disabled={!available || !manifest || installing || diagnosing}><Download size={18} /><strong>{awaitingPermission ? 'Continuar atualização' : 'Atualizar aplicativo'}</strong><span>Cópia local, download, SHA-256 e assinatura.</span><small>{manifest ? formatBytes(manifest.sizeBytes) : 'APK oficial'}</small></button>
        <button type="button" onClick={() => void runDiagnostic()} disabled={checking || installing || diagnosing}><Activity size={18} /><strong>Testar atualizador</strong><span>Confere canal, versão, permissão e armazenamento.</span><small>Sem baixar o APK</small></button>
        <button type="button" onClick={ignoreCurrent} disabled={!available || !manifest || Boolean(manifest.mandatory)}><Smartphone size={18} /><strong>Ignorar esta revisão</strong><span>Somente para atualização opcional.</span><small>Obrigatórias não podem ser ignoradas</small></button>
      </div>

      {diagnostic.length > 0 && (
        <section className="update-diagnostic-panel" aria-label="Resultado do teste do atualizador">
          <div className="update-diagnostic-heading"><div><Activity size={18} /><strong>Teste do atualizador</strong></div>{diagnosticSummary && <span className={`diagnostic-summary-${diagnosticSummary.className}`}>{diagnosticSummary.label}</span>}</div>
          <div className="update-diagnostic-grid">
            {diagnostic.map((item) => (
              <article key={item.id} className={`diagnostic-${item.status}`}>
                {item.status === 'ok' ? <CheckCircle2 size={17} /> : item.status === 'warning' ? <AlertTriangle size={17} /> : <WifiOff size={17} />}
                <div><strong>{item.label}</strong><span>{item.detail}</span></div>
              </article>
            ))}
          </div>
        </section>
      )}

      <label className="update-toggle"><input type="checkbox" checked={autoCheck} onChange={(event) => { setAutoCheck(event.target.checked); safeStorageSet(AUTO_KEY, event.target.checked ? '1' : '0'); }} /><span>Verificar automaticamente ao abrir, voltar ao app e reconectar à internet</span></label>
      <label className="update-toggle"><input type="checkbox" checked={autoInstall} onChange={(event) => { setAutoInstall(event.target.checked); safeStorageSet(AUTO_INSTALL_KEY, event.target.checked ? '1' : '0'); if (event.target.checked) safeStorageRemove(AUTO_INSTALL_ATTEMPT_KEY); }} /><span>Baixar e abrir o instalador automaticamente quando uma versão mais nova for validada</span></label>

      <details className="settings-details-card update-audit-card" open={audit.some((entry) => entry.outcome === 'error')}>
        <summary>Histórico técnico do atualizador ({audit.length})</summary>
        <div className="update-audit-actions">
          <button type="button" onClick={() => void copyDiagnostic()}><Clipboard size={15} /> {copied ? 'Copiado' : 'Copiar diagnóstico'}</button>
          <button type="button" onClick={resetUpdateState}><Trash2 size={15} /> Limpar somente o atualizador</button>
        </div>
        <div className="update-audit-list">
          {audit.length ? audit.slice(0, 12).map((entry) => <article key={entry.id} className={`audit-${entry.outcome}`}><span>{new Date(entry.at).toLocaleString('pt-BR')}</span><strong>{entry.message}</strong>{entry.detail && <small>{entry.detail}</small>}</article>) : <p className="panel-note">Nenhuma tentativa registrada ainda.</p>}
        </div>
      </details>

      <div className="update-install-steps"><article><i>1</i><div><strong>Detectar</strong><span>Compara a versão e o versionCode reais.</span></div></article><article><i>2</i><div><strong>Validar</strong><span>Confere tamanho, SHA-256, pacote e assinatura.</span></div></article><article><i>3</i><div><strong>Atualizar</strong><span>O Android instala por cima e mantém seus dados.</span></div></article></div>
      <div className="settings-explanation-card"><ExternalLink size={19} /><div><strong>Fluxo automático do aplicativo</strong><span>O BuildMaster detecta, escolhe a rota mais nova, baixa e valida o APK sozinho. A permissão “Instalar apps desconhecidos” é liberada uma vez; depois, o Android ainda exige tocar em “Atualizar” na confirmação final.</span></div></div>
      <DefinitiveUpdateCenter />
      {lastCheck && <p className="panel-note">Última consulta: {new Date(lastCheck).toLocaleString('pt-BR')}.</p>}
    </section>
  );
}
