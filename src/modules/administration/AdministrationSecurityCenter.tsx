'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileClock,
  KeyRound,
  Laptop,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Save,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  UserRoundCheck,
  Users,
  WifiOff,
  XCircle
} from 'lucide-react';
import { useBuildMasterAccount } from '@/components/AuthGate';
import {
  adminAccountRequest,
  isCloudAccountsConfigured,
  type AdminDeviceRow,
  type AdminOverview,
  type AdminSecuritySettings
} from '@/lib/accountAuth';

const EMPTY_SETTINGS: AdminSecuritySettings = {
  minAppVersion: '29.00.0',
  allowLegacyClients: false,
  requireDeviceProof: true,
  adminMfaRequired: true,
  userOfflineGraceHours: 4,
  adminOfflineGraceHours: 12,
  updatedAt: new Date(0).toISOString()
};

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    create_user: 'Conta criada',
    renew: 'Licença renovada',
    set_status: 'Status alterado',
    reset_password: 'Senha redefinida',
    set_devices: 'Limite de aparelhos alterado',
    revoke_devices: 'Todos os aparelhos desconectados',
    revoke_device: 'Aparelho desconectado',
    delete: 'Conta excluída',
    update_security_settings: 'Política de segurança alterada'
  };
  return labels[action] || action.replaceAll('_', ' ');
}

function platformIcon(device: AdminDeviceRow) {
  const text = `${device.platform} ${device.deviceName}`.toLowerCase();
  return text.includes('android') || text.includes('mobile') ? <Smartphone size={18} /> : <Laptop size={18} />;
}

export function AdministrationSecurityCenter() {
  const account = useBuildMasterAccount();
  const configured = isCloudAccountsConfigured();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [settings, setSettings] = useState<AdminSecuritySettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDevice, setPendingDevice] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'active' | 'all'>('active');

  const loadOverview = useCallback(async () => {
    if (!configured || account?.profile.role !== 'admin') return;
    setLoading(true);
    setError('');
    try {
      const data = await adminAccountRequest<AdminOverview>({ action: 'overview', auditLimit: 80 });
      setOverview(data);
      setSettings(data.settings);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a central administrativa.');
    } finally {
      setLoading(false);
    }
  }, [account?.profile.role, configured]);

  useEffect(() => { void loadOverview(); }, [loadOverview]);

  const activeDevices = useMemo(() => (overview?.devices || []).filter((device) => !device.revokedAt), [overview]);
  const visibleDevices = useMemo(
    () => deviceFilter === 'active' ? activeDevices : overview?.devices || [],
    [activeDevices, deviceFilter, overview]
  );
  const protectedDevices = activeDevices.filter((device) => device.protected).length;
  const deniedActions = (overview?.audit || []).filter((entry) => entry.outcome !== 'success').length;
  const securityScore = Math.max(0, Math.min(100,
    (settings.adminMfaRequired ? 25 : 0)
    + (settings.requireDeviceProof ? 25 : 0)
    + (!settings.allowLegacyClients ? 20 : 0)
    + (protectedDevices === activeDevices.length ? 15 : 0)
    + (settings.userOfflineGraceHours <= 4 ? 15 : 5)
  ));

  async function saveSecurityPolicy() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await adminAccountRequest<{ success: boolean; settings: AdminSecuritySettings }>({
        action: 'update_security_settings',
        settings: {
          minAppVersion: settings.minAppVersion,
          allowLegacyClients: settings.allowLegacyClients,
          requireDeviceProof: true,
          adminMfaRequired: true,
          userOfflineGraceHours: settings.userOfflineGraceHours,
          adminOfflineGraceHours: settings.adminOfflineGraceHours
        }
      });
      setSettings(response.settings);
      setMessage(`Política salva. APKs abaixo da v${response.settings.minAppVersion} serão bloqueados na próxima validação online.`);
      await loadOverview();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a política.');
    } finally {
      setSaving(false);
    }
  }

  async function revokeDevice(device: AdminDeviceRow) {
    if (device.revokedAt) return;
    setPendingDevice(device.id);
    setMessage('');
    setError('');
    try {
      await adminAccountRequest({ action: 'revoke_device', userId: device.userId, deviceId: device.deviceId });
      setMessage(`${device.deviceName} de @${device.username} foi desconectado. O próximo acesso exigirá novo vínculo protegido.`);
      await loadOverview();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível desconectar o aparelho.');
    } finally {
      setPendingDevice('');
    }
  }

  if (!configured || account?.profile.role !== 'admin') return null;

  return (
    <section className="admin-security-center luxury-panel settings-view-panel settings-final-panel" aria-label="Administração e segurança avançada">
      <div className="settings-panel-heading">
        <div><p className="kicker"><ShieldCheck size={15} /> Bloco 12</p><h3>Central administrativa e segurança</h3><span>Auditoria, aparelhos, limites, MFA e bloqueio de versões antigas em um único painel.</span></div>
        <button type="button" className="bm2910-refresh" onClick={() => void loadOverview()} disabled={loading}>{loading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />} Atualizar</button>
      </div>

      <div className="bm2910-admin-score-grid">
        <article><ShieldCheck size={20} /><div><strong>{securityScore}/100</strong><span>Proteção administrativa</span><small>{securityScore >= 90 ? 'Configuração recomendada' : 'Revise os itens pendentes'}</small></div></article>
        <article><Users size={20} /><div><strong>{overview?.users.length || 0}</strong><span>Contas cadastradas</span><small>{overview?.users.filter((user) => user.status === 'active').length || 0} ativas</small></div></article>
        <article><Smartphone size={20} /><div><strong>{activeDevices.length}</strong><span>Aparelhos ativos</span><small>{protectedDevices} com prova criptográfica</small></div></article>
        <article><FileClock size={20} /><div><strong>{overview?.audit.length || 0}</strong><span>Eventos auditados</span><small>{deniedActions} negado(s) ou com erro</small></div></article>
      </div>

      {message && <p className="account-success" role="status"><CheckCircle2 size={15} /> {message}</p>}
      {error && <p className="auth-error" role="alert"><AlertTriangle size={15} /> {error}</p>}

      <div className="bm2910-admin-columns">
        <section className="bm2910-security-policy">
          <div className="bm2910-subheading"><LockKeyhole size={19} /><div><strong>Política de acesso</strong><span>Alterações exigem sessão administrativa com MFA.</span></div></div>
          <label><span>Versão mínima permitida</span><input value={settings.minAppVersion} onChange={(event) => setSettings((current) => ({ ...current, minAppVersion: event.target.value.replace(/^v/i, '') }))} inputMode="decimal" placeholder="29.10.0" /><small>Elevar esta versão bloqueia APKs antigos na validação de licença.</small></label>
          <div className="bm2910-inline-fields">
            <label><span>Offline do usuário</span><select value={settings.userOfflineGraceHours} onChange={(event) => setSettings((current) => ({ ...current, userOfflineGraceHours: Number(event.target.value) }))}><option value={0}>Sempre online</option><option value={2}>2 horas</option><option value={4}>4 horas</option><option value={8}>8 horas</option><option value={12}>12 horas</option><option value={24}>24 horas</option></select></label>
            <label><span>Offline do admin</span><select value={settings.adminOfflineGraceHours} onChange={(event) => setSettings((current) => ({ ...current, adminOfflineGraceHours: Number(event.target.value) }))}><option value={0}>Sempre online</option><option value={4}>4 horas</option><option value={8}>8 horas</option><option value={12}>12 horas</option><option value={24}>24 horas</option></select></label>
          </div>
          <label className="update-toggle"><input type="checkbox" checked readOnly disabled aria-label="MFA obrigatório e bloqueado" /><span><b>MFA obrigatório para administração</b><small>Proteção obrigatória: não pode ser desligada pelo painel.</small></span></label>
          <label className="update-toggle"><input type="checkbox" checked readOnly disabled aria-label="Prova criptográfica obrigatória e bloqueada" /><span><b>Prova criptográfica do aparelho</b><small>Proteção obrigatória: cada aparelho precisa provar sua identidade.</small></span></label>
          <label className="update-toggle bm2910-danger-toggle"><input type="checkbox" checked={settings.allowLegacyClients} onChange={(event) => setSettings((current) => ({ ...current, allowLegacyClients: event.target.checked }))} /><span><b>Permitir clientes sem versão</b><small>Deixe desligado em produção.</small></span></label>
          <button type="button" className="elite-button" onClick={() => void saveSecurityPolicy()} disabled={saving}>{saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />} Salvar política de segurança</button>
        </section>

        <section className="bm2910-rate-panel">
          <div className="bm2910-subheading"><Activity size={19} /><div><strong>Rate limit administrativo</strong><span>Contagem da janela atual por operação.</span></div></div>
          <div className="bm2910-rate-list">
            {(overview?.rateLimits || []).length ? overview?.rateLimits.slice(0, 10).map((rate) => <article key={rate.action}><div><strong>{actionLabel(rate.action)}</strong><span>janela iniciada {new Date(rate.windowStartedAt).toLocaleTimeString('pt-BR')}</span></div><b>{rate.requestCount}</b></article>) : <p className="panel-note">Nenhuma ação registrada nesta janela.</p>}
          </div>
          <div className="settings-explanation-card"><KeyRound size={18} /><div><strong>Ações sensíveis têm limite menor</strong><span>Criação, senha, exclusão e política usam janelas mais restritas que consultas.</span></div></div>
        </section>
      </div>

      <section className="bm2910-devices-section">
        <div className="bm2910-section-toolbar"><div className="bm2910-subheading"><Smartphone size={19} /><div><strong>Controle individual de aparelhos</strong><span>Desconecte apenas o aparelho comprometido sem remover os demais.</span></div></div><div className="settings-segmented-control"><button type="button" className={deviceFilter === 'active' ? 'selected' : ''} onClick={() => setDeviceFilter('active')}>Ativos</button><button type="button" className={deviceFilter === 'all' ? 'selected' : ''} onClick={() => setDeviceFilter('all')}>Todos</button></div></div>
        <div className="bm2910-device-grid">
          {visibleDevices.length ? visibleDevices.slice(0, 24).map((device) => <article key={device.id} className={device.revokedAt ? 'is-revoked' : ''}>
            <div className="bm2910-device-icon">{platformIcon(device)}</div>
            <div><strong>{device.deviceName}</strong><span>@{device.username} • {device.platform}</span><small>Último acesso: {new Date(device.lastSeenAt).toLocaleString('pt-BR')}</small></div>
            <div className="bm2910-device-security">{device.protected ? <span className="is-protected"><ShieldCheck size={14} /> Protegido</span> : <span className="needs-protection"><ShieldOff size={14} /> Legado</span>}{device.revokedAt ? <em>Revogado</em> : <button type="button" onClick={() => void revokeDevice(device)} disabled={pendingDevice === device.id}>{pendingDevice === device.id ? <Loader2 className="spin" size={14} /> : <XCircle size={14} />} Desconectar</button>}</div>
          </article>) : <p className="panel-note">Nenhum aparelho encontrado.</p>}
        </div>
      </section>

      <section className="bm2910-audit-section">
        <div className="bm2910-subheading"><FileClock size={19} /><div><strong>Auditoria administrativa</strong><span>As senhas nunca entram no histórico.</span></div></div>
        <div className="bm2910-audit-list">
          {(overview?.audit || []).length ? overview?.audit.slice(0, 40).map((entry) => <article key={entry.id} className={`audit-${entry.outcome}`}>
            <span>{entry.outcome === 'success' ? <UserRoundCheck size={16} /> : entry.outcome === 'denied' ? <WifiOff size={16} /> : <AlertTriangle size={16} />}</span>
            <div><strong>{actionLabel(entry.action)}</strong><small>@{entry.adminUsername}{entry.targetUsername ? ` → @${entry.targetUsername}` : ''} • APK {entry.appVersion || 'não informado'}</small></div>
            <time><Clock3 size={13} /> {new Date(entry.createdAt).toLocaleString('pt-BR')}</time>
          </article>) : <p className="panel-note">O histórico aparecerá após a primeira ação administrativa.</p>}
        </div>
      </section>
    </section>
  );
}
