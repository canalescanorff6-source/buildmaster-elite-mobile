'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  Filter,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
  XCircle,
  Zap
} from 'lucide-react';
import { useBuildMasterAccount } from '@/components/AuthGate';
import {
  adminAccountRequest,
  beginAdminMfaEnrollment,
  getAdminMfaStatus,
  isCloudAccountsConfigured,
  validateOnlineLicense,
  verifyAdminMfa,
  type AccountStatus,
  type AdminMfaEnrollment,
  type AdminMfaStatus,
  type AdminUserAction,
  type AdminUserRow,
  validateUsername
} from '@/lib/accountAuth';

function dateLabel(value?: string | null) {
  if (!value) return 'Sem vencimento';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleString('pt-BR');
}

function shortDateLabel(value?: string | null) {
  if (!value) return 'Sem prazo';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Inválida' : date.toLocaleDateString('pt-BR');
}

function statusLabel(status: AccountStatus) {
  if (status === 'active') return 'Ativo';
  if (status === 'suspended') return 'Suspenso';
  if (status === 'blocked') return 'Bloqueado';
  return 'Vencido';
}

function statusClass(status: AccountStatus) {
  return `account-status account-status-${status}`;
}

function effectiveStatus(user: AdminUserRow): AccountStatus {
  if (user.status !== 'active') return user.status;
  if (user.expiresAt && Date.parse(user.expiresAt) <= Date.now()) return 'expired';
  return 'active';
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const symbols = '@#%';
  const bytes = new Uint32Array(9);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
  return `${body.slice(0, 4)}${symbols[bytes[0] % symbols.length]}${body.slice(4)}7`;
}

type CreatedCredentials = {
  username: string;
  password: string;
  durationDays: number;
  maxDevices: number;
};

type AdminDialog =
  | { kind: 'password'; user: AdminUserRow; password: string; showPassword: boolean }
  | { kind: 'devices'; user: AdminUserRow; maxDevices: number }
  | { kind: 'delete'; user: AdminUserRow }
  | null;

export function AccountAdminPanel() {
  const account = useBuildMasterAccount();
  const configured = isCloudAccountsConfigured();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [durationDays, setDurationDays] = useState(30);
  const [maxDevices, setMaxDevices] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [dialog, setDialog] = useState<AdminDialog>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [mfaStatus, setMfaStatus] = useState<AdminMfaStatus | null>(null);
  const [mfaEnrollment, setMfaEnrollment] = useState<AdminMfaEnrollment | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!configured || account?.profile.role !== 'admin' || !mfaStatus?.protected) return;
    setLoading(true);
    setError('');
    try {
      const result = await adminAccountRequest<{ users: AdminUserRow[] }>({ action: 'list' });
      setUsers(Array.isArray(result.users) ? result.users : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não consegui carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [account?.profile.role, configured, mfaStatus?.protected]);

  const refreshMfa = useCallback(async () => {
    if (!configured || account?.profile.role !== 'admin') return;
    setMfaLoading(true);
    setError('');
    try {
      const next = await getAdminMfaStatus();
      setMfaStatus(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível verificar o MFA.');
    } finally {
      setMfaLoading(false);
    }
  }, [account?.profile.role, configured]);

  useEffect(() => { void refreshMfa(); }, [refreshMfa]);
  useEffect(() => { if (mfaStatus?.protected) void loadUsers(); }, [mfaStatus?.protected, loadUsers]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 5_000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) setDialog(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dialog, loading]);

  async function startMfaEnrollment() {
    setMfaLoading(true);
    setError('');
    try {
      const enrollment = await beginAdminMfaEnrollment();
      setMfaEnrollment(enrollment);
      setMessage('Escaneie o QR Code e confirme o código de 6 números.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar o MFA.');
    } finally {
      setMfaLoading(false);
    }
  }

  async function confirmMfa() {
    const factorId = mfaEnrollment?.factorId || mfaStatus?.verifiedFactor?.id;
    if (!factorId) { setError('Ative um fator MFA antes de confirmar.'); return; }
    setMfaLoading(true);
    setError('');
    try {
      const next = await verifyAdminMfa(factorId, mfaCode);
      setMfaStatus(next);
      setMfaEnrollment(null);
      setMfaCode('');
      setMessage('MFA confirmado. O painel administrativo está protegido.');
      await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Código MFA inválido.');
    } finally {
      setMfaLoading(false);
    }
  }

  async function runAction(action: AdminUserAction, success: string, userId?: string) {
    setLoading(true);
    setPendingUserId(userId || null);
    setError('');
    setMessage('');
    try {
      await adminAccountRequest(action);
      setMessage(success);
      await loadUsers();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'A ação não pôde ser concluída.');
      return false;
    } finally {
      setPendingUserId(null);
      setLoading(false);
    }
  }

  async function createUser(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    const cleanUsername = username.trim().toLowerCase();
    const usernameError = validateUsername(cleanUsername);
    if (usernameError) { setError(usernameError); return; }
    if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) { setError('Use 10 caracteres com letra maiúscula, minúscula e número.'); return; }

    setLoading(true);
    try {
      await adminAccountRequest({ action: 'create', username: cleanUsername, password, displayName: displayName.trim(), durationDays, maxDevices, plan: 'premium' });
      setCreatedCredentials({ username: cleanUsername, password, durationDays, maxDevices });
      setMessage(`Conta ${cleanUsername} criada e pronta para uso.`);
      setUsername('');
      setDisplayName('');
      setPassword('');
      await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  async function testConnection() {
    setTestingConnection(true);
    setDiagnostic('Testando autenticação e licença...');
    setError('');
    try {
      const validation = await validateOnlineLicense();
      if (account?.profile.role === 'admin') {
        const response = await adminAccountRequest<{ users: AdminUserRow[] }>({ action: 'list' });
        setDiagnostic(`Supabase conectado. Licença ativa para @${validation.profile.username} e painel administrativo respondeu com ${response.users?.length ?? 0} conta(s).`);
      } else {
        setDiagnostic(`Supabase conectado. Licença de @${validation.profile.username} validada no servidor.`);
      }
    } catch (cause) {
      setDiagnostic('');
      setError(cause instanceof Error ? cause.message : 'A conexão com o Supabase não pôde ser confirmada.');
    } finally {
      setTestingConnection(false);
    }
  }

  function createdCredentialsText() {
    if (!createdCredentials) return '';
    return `BuildMaster Elite Tático
Usuário: ${createdCredentials.username}
Senha temporária: ${createdCredentials.password}
Validade inicial: ${createdCredentials.durationDays} dias
Aparelhos permitidos: ${createdCredentials.maxDevices}`;
  }

  async function copyCreatedCredentials() {
    if (!createdCredentials) return;
    try {
      await navigator.clipboard.writeText(createdCredentialsText());
      setMessage('Dados da nova conta copiados.');
    } catch {
      setMessage('Não foi possível copiar automaticamente. Selecione os dados exibidos.');
    }
  }

  async function shareCreatedCredentials() {
    if (!createdCredentials) return;
    if (!navigator.share) {
      await copyCreatedCredentials();
      return;
    }
    try {
      await navigator.share({ title: 'Acesso BuildMaster', text: createdCredentialsText() });
      setMessage('Dados da conta compartilhados.');
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setError('Não foi possível abrir o compartilhamento. Os dados continuam disponíveis nesta tela.');
    }
  }

  async function confirmDialogAction() {
    if (!dialog) return;
    let success = false;
    if (dialog.kind === 'password') {
      if (dialog.password.length < 10 || !/[A-Z]/.test(dialog.password) || !/[a-z]/.test(dialog.password) || !/\d/.test(dialog.password)) {
        setError('A nova senha precisa ter 10 caracteres com maiúscula, minúscula e número.');
        return;
      }
      success = await runAction({ action: 'reset_password', userId: dialog.user.id, password: dialog.password }, `Senha de ${dialog.user.username} redefinida.`, dialog.user.id);
    } else if (dialog.kind === 'devices') {
      const value = Math.max(1, Math.min(10, Math.round(dialog.maxDevices)));
      success = await runAction({ action: 'set_devices', userId: dialog.user.id, maxDevices: value }, `Limite de aparelhos de ${dialog.user.username} atualizado.`, dialog.user.id);
    } else {
      success = await runAction({ action: 'delete', userId: dialog.user.id }, `${dialog.user.username} foi excluído.`, dialog.user.id);
    }
    if (success) setDialog(null);
  }

  const activeCount = useMemo(() => users.filter((user) => effectiveStatus(user) === 'active').length, [users]);
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const currentStatus = effectiveStatus(user);
      const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter;
      const searchable = `${user.username} ${user.displayName || ''} ${user.plan || ''}`.toLowerCase();
      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [users, search, statusFilter]);

  if (!account) return null;

  if (!configured) {
    return (
      <section className="account-admin-panel luxury-panel settings-view-panel settings-final-panel">
        <div className="settings-panel-heading"><div><p className="kicker"><Users size={15} /> Contas e licenças</p><h3>Servidor de contas não configurado</h3><span>O aplicativo está em modo local e não pode criar licenças reais.</span></div><span className="settings-state-pill">Modo local</span></div>
        <div className="account-setup-warning"><AlertTriangle size={20} /><div><strong>Conecte o projeto Supabase antes de criar usuários.</strong><span>O BuildMaster precisa da URL pública, da chave publishable e das funções license-session e admin-users.</span></div></div>
        <div className="account-setup-steps"><span>1. Executar a migração no SQL Editor.</span><span>2. Publicar <b>license-session</b> e <b>admin-users</b>.</span><span>3. Configurar as variáveis do APK.</span><span>4. Gerar e instalar um APK novo.</span></div>
      </section>
    );
  }

  if (account.profile.role !== 'admin') {
    return (
      <section className="account-admin-panel luxury-panel settings-view-panel settings-final-panel">
        <div className="settings-panel-heading"><div><p className="kicker"><ShieldCheck size={15} /> Minha licença</p><h3>{account.profile.displayName || account.profile.username}</h3><span>Consulte prazo, plano e limite de aparelhos da sua conta.</span></div><span className={statusClass(account.profile.status)}>{statusLabel(account.profile.status)}</span></div>
        <div className="account-license-grid account-license-premium-grid">
          <article><strong>@{account.profile.username}</strong><span>Usuário</span></article>
          <article><strong>{shortDateLabel(account.profile.expiresAt)}</strong><span>Vencimento</span></article>
          <article><strong>{account.profile.maxDevices}</strong><span>Aparelho(s)</span></article>
          <article><strong>{account.profile.plan}</strong><span>Plano</span></article>
        </div>
        <button className="settings-diagnostic-button" type="button" onClick={() => void testConnection()} disabled={testingConnection}><Zap size={17} /><div><strong>Testar conexão da licença</strong><span>{testingConnection ? 'Validando no Supabase...' : 'Confirma autenticação, prazo e serviço license-session.'}</span></div></button>
        {diagnostic && <p className="account-success" role="status"><CheckCircle2 size={15} /> {diagnostic}</p>}
        {error && <p className="auth-error" role="alert"><AlertTriangle size={15} /> {error}</p>}
        <p className="panel-note">Criação, renovação e troca de senha são feitas somente pelo administrador.</p>
      </section>
    );
  }

  if (mfaStatus === null || !mfaStatus.protected) {
    const hasVerifiedFactor = Boolean(mfaStatus?.verifiedFactor);
    return (
      <section className="account-admin-panel luxury-panel settings-view-panel settings-final-panel admin-mfa-gate">
        <div className="settings-panel-heading">
          <div><p className="kicker"><ShieldCheck size={15} /> Proteção administrativa</p><h3>Confirmação em duas etapas obrigatória</h3><span>O painel de usuários só abre após senha e código temporário do autenticador.</span></div>
          <span className="settings-state-pill">{mfaLoading ? 'Verificando' : hasVerifiedFactor ? 'Código necessário' : 'Ativação necessária'}</span>
        </div>
        <div className="admin-mfa-security-card">
          <ShieldCheck size={28} />
          <div><strong>{hasVerifiedFactor ? 'Digite o código do autenticador' : 'Ative o MFA da conta administradora'}</strong><span>{hasVerifiedFactor ? 'Abra Google Authenticator, Microsoft Authenticator ou outro aplicativo TOTP.' : 'Escaneie o QR Code. Depois disso, cada acesso ao painel exigirá um código de 6 números.'}</span></div>
        </div>
        {!hasVerifiedFactor && !mfaEnrollment && <button className="elite-button admin-mfa-primary" type="button" onClick={() => void startMfaEnrollment()} disabled={mfaLoading}>{mfaLoading ? <Loader2 className="spin" size={17} /> : <KeyRound size={17} />} Ativar MFA agora</button>}
        {mfaEnrollment && <div className="admin-mfa-enrollment"><img src={mfaEnrollment.qrCode} alt="QR Code para ativar o MFA" /><div><strong>Chave manual</strong><code>{mfaEnrollment.secret}</code><span>Não compartilhe essa chave. Guarde um segundo autenticador como recuperação.</span></div></div>}
        {(hasVerifiedFactor || mfaEnrollment) && <div className="admin-mfa-code-row"><label><span>Código de 6 números</span><input inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} /></label><button className="elite-button" type="button" onClick={() => void confirmMfa()} disabled={mfaLoading || mfaCode.length !== 6}>{mfaLoading ? <Loader2 className="spin" size={17} /> : <ShieldCheck size={17} />} Confirmar e abrir painel</button></div>}
        {message && <p className="account-success" role="status"><CheckCircle2 size={15} /> {message}</p>}
        {error && <p className="auth-error" role="alert"><AlertTriangle size={15} /> {error}</p>}
        <button className="settings-diagnostic-button" type="button" onClick={() => void refreshMfa()} disabled={mfaLoading}><RefreshCw size={16} /><div><strong>Verificar proteção novamente</strong><span>Atualiza a sessão sem pedir a senha.</span></div></button>
      </section>
    );
  }

  return (
    <div className="account-admin-workspace account-admin-final-workspace">
      <section className="account-admin-panel luxury-panel settings-view-panel settings-final-panel">
        <div className="settings-panel-heading">
          <div><p className="kicker"><ShieldCheck size={15} /> Administração exclusiva</p><h3>Contas, prazos e aparelhos</h3><span>Crie, renove, suspenda e desconecte usuários sem entrar no painel do Supabase.</span></div>
          <div className="account-admin-header-actions"><button type="button" onClick={() => void testConnection()} disabled={testingConnection || loading}>{testingConnection ? <Loader2 className="spin" size={16} /> : <Zap size={16} />} Testar Supabase</button><button type="button" onClick={() => void loadUsers()} disabled={loading}>{loading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />} Atualizar</button></div>
        </div>
        <div className="account-license-grid account-license-premium-grid">
          <article><strong>{users.length}</strong><span>Contas</span><small>total cadastrado</small></article>
          <article><strong>{activeCount}</strong><span>Ativas</span><small>com prazo válido</small></article>
          <article><strong>{users.filter((user) => effectiveStatus(user) === 'suspended' || effectiveStatus(user) === 'blocked').length}</strong><span>Restritas</span><small>suspensas ou bloqueadas</small></article>
          <article><strong>{users.reduce((sum, user) => sum + Number(user.deviceCount || 0), 0)}</strong><span>Aparelhos</span><small>sessões registradas</small></article>
        </div>
        {diagnostic && <p className="account-success" role="status"><CheckCircle2 size={15} /> {diagnostic}</p>}
        {message && <p className="account-success" role="status"><CheckCircle2 size={15} /> {message}</p>}
        {error && <p className="auth-error" role="alert"><AlertTriangle size={15} /> {error}</p>}
      </section>

      <section className="account-create-panel luxury-panel settings-view-panel settings-final-panel">
        <div className="settings-panel-heading"><div><p className="kicker"><UserPlus size={15} /> Nova conta</p><h3>Criar acesso para um cliente</h3><span>O e-mail técnico fica oculto. O cliente recebe somente usuário e senha.</span></div><span className="settings-state-pill">Plano premium</span></div>
        <form className="account-create-grid account-create-final-grid" onSubmit={createUser} aria-busy={loading}>
          <label><span>Nome de usuário</span><input value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/\s+/g, ''))} placeholder="ex.: joao10" autoCapitalize="none" autoCorrect="off" required minLength={3} /></label>
          <label><span>Nome de exibição</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="João" /></label>
          <label className="account-password-field"><span>Senha temporária</span><div><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Mínimo 10 caracteres" required minLength={10} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div><button type="button" className="account-generate-password" onClick={() => { setPassword(generateTemporaryPassword()); setShowPassword(true); }}>Gerar senha segura</button></label>
          <label><span>Prazo inicial</span><select value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))}><option value={7}>7 dias</option><option value={15}>15 dias</option><option value={30}>30 dias</option><option value={60}>60 dias</option><option value={90}>90 dias</option><option value={180}>6 meses</option><option value={365}>1 ano</option></select></label>
          <label><span>Limite de aparelhos</span><select value={maxDevices} onChange={(event) => setMaxDevices(Number(event.target.value))}><option value={1}>1 aparelho</option><option value={2}>2 aparelhos</option><option value={3}>3 aparelhos</option></select></label>
          <button className="elite-button account-create-submit" type="submit" disabled={loading}><UserPlus size={17} /> {loading ? 'Criando conta...' : 'Criar usuário'}</button>
        </form>

        {createdCredentials && <div className="created-credentials-card" role="status"><div><CheckCircle2 size={19} /><div><strong>Conta criada com sucesso</strong><span>Copie os dados antes de fechar esta mensagem.</span></div></div><dl><div><dt>Usuário</dt><dd>{createdCredentials.username}</dd></div><div><dt>Senha</dt><dd>{createdCredentials.password}</dd></div><div><dt>Prazo</dt><dd>{createdCredentials.durationDays} dias</dd></div><div><dt>Aparelhos</dt><dd>{createdCredentials.maxDevices}</dd></div></dl><div><button type="button" onClick={() => void copyCreatedCredentials()}><Copy size={15} /> Copiar</button><button type="button" onClick={() => void shareCreatedCredentials()}><Share2 size={15} /> Compartilhar</button><button type="button" onClick={() => setCreatedCredentials(null)}>Fechar</button></div></div>}
      </section>

      <section className="account-users-panel luxury-panel settings-view-panel settings-final-panel">
        <div className="settings-panel-heading"><div><p className="kicker"><Users size={15} /> Contas cadastradas</p><h3>Gerenciar usuários</h3><span>Use a busca e os filtros para encontrar rapidamente cada licença.</span></div><span className="settings-state-pill">{filteredUsers.length} resultado(s)</span></div>

        <div className="account-user-toolbar">
          <label><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por usuário ou nome" aria-label="Buscar contas" /></label>
          <label><Filter size={16} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filtrar contas por status"><option value="all">Todos os status</option><option value="active">Ativos</option><option value="expired">Vencidos</option><option value="suspended">Suspensos</option><option value="blocked">Bloqueados</option></select></label>
        </div>

        <div className="account-user-list account-user-final-list">
          {filteredUsers.map((user) => {
            const currentStatus = effectiveStatus(user);
            return (
              <article key={user.id} className={`account-user-card account-user-final-card ${pendingUserId === user.id ? 'is-pending' : ''}`} aria-busy={pendingUserId === user.id}>
                <div className="account-user-head">
                  <div className="account-user-identity"><i>{(user.displayName || user.username).slice(0, 1).toUpperCase()}</i><div><strong>{user.displayName || user.username}</strong><span>@{user.username} • {user.role === 'admin' ? 'Administrador' : user.plan}</span></div></div>
                  <span className={statusClass(currentStatus)}>{statusLabel(currentStatus)}</span>
                </div>
                <div className="account-user-meta account-user-final-meta"><span><Clock3 size={14} /> {dateLabel(user.expiresAt)}</span><span><Users size={14} /> {user.deviceCount || 0}/{user.maxDevices} aparelho(s)</span></div>

                <div className="account-quick-renew"><span>Renovação rápida</span><button type="button" onClick={() => void runAction({ action: 'renew', userId: user.id, durationDays: 7 }, `Acesso de ${user.username} renovado por 7 dias.`, user.id)}>+7 dias</button><button type="button" onClick={() => void runAction({ action: 'renew', userId: user.id, durationDays: 30 }, `Acesso de ${user.username} renovado por 30 dias.`, user.id)}>+30 dias</button><button type="button" onClick={() => void runAction({ action: 'renew', userId: user.id, durationDays: 90 }, `Acesso de ${user.username} renovado por 90 dias.`, user.id)}>+90 dias</button></div>

                <details className="account-user-more-actions">
                  <summary>Outras ações</summary>
                  <div className="account-user-actions">
                    {currentStatus === 'active' ? <>
                      <button type="button" onClick={() => void runAction({ action: 'set_status', userId: user.id, status: 'suspended' }, `${user.username} foi suspenso.`, user.id)}><XCircle size={14} /> Suspender</button>
                      {user.role !== 'admin' && <button type="button" onClick={() => void runAction({ action: 'set_status', userId: user.id, status: 'blocked' }, `${user.username} foi bloqueado.`, user.id)}><XCircle size={14} /> Bloquear</button>}
                    </> : <button type="button" onClick={() => void runAction({ action: 'set_status', userId: user.id, status: 'active' }, `${user.username} foi reativado.`, user.id)}><CheckCircle2 size={14} /> Ativar</button>}
                    <button type="button" onClick={() => setDialog({ kind: 'password', user, password: generateTemporaryPassword(), showPassword: false })}><KeyRound size={14} /> Nova senha</button>
                    <button type="button" onClick={() => setDialog({ kind: 'devices', user, maxDevices: user.maxDevices })}><Users size={14} /> Limite</button>
                    <button type="button" onClick={() => void runAction({ action: 'revoke_devices', userId: user.id }, `Aparelhos de ${user.username} desconectados.`, user.id)}><RefreshCw size={14} /> Desconectar</button>
                    {user.role !== 'admin' && <button className="danger-action" type="button" onClick={() => setDialog({ kind: 'delete', user })}><Trash2 size={14} /> Excluir</button>}
                  </div>
                </details>
              </article>
            );
          })}
          {!loading && filteredUsers.length === 0 && <div className="empty-cofre-card vault-empty-state"><div className="empty-icon"><Users size={27} /></div><strong>Nenhuma conta encontrada</strong><span>Altere a busca ou o filtro. Caso ainda não existam clientes, crie a primeira conta acima.</span></div>}
        </div>
      </section>

      {dialog && (
        <div className="bm-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) setDialog(null); }}>
          <section className={`bm-admin-dialog luxury-panel dialog-${dialog.kind}`} role="dialog" aria-modal="true" aria-labelledby="bm-admin-dialog-title">
            <div className="bm-dialog-heading">
              <div>
                <p className="kicker">Ação administrativa</p>
                <h3 id="bm-admin-dialog-title">{dialog.kind === 'password' ? `Nova senha para @${dialog.user.username}` : dialog.kind === 'devices' ? `Limite de aparelhos de @${dialog.user.username}` : `Excluir @${dialog.user.username}`}</h3>
              </div>
              <button type="button" onClick={() => setDialog(null)} disabled={loading} aria-label="Fechar janela"><X size={18} /></button>
            </div>

            {dialog.kind === 'password' && (
              <div className="bm-dialog-content">
                <p>Defina uma senha temporária forte. A sessão antiga do cliente continuará protegida até o próximo acesso.</p>
                <label><span>Nova senha</span><div className="bm-dialog-password"><input autoFocus value={dialog.password} onChange={(event) => setDialog({ ...dialog, password: event.target.value })} type={dialog.showPassword ? 'text' : 'password'} minLength={10} /><button type="button" onClick={() => setDialog({ ...dialog, showPassword: !dialog.showPassword })} aria-label={dialog.showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{dialog.showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
                <button type="button" className="bm-dialog-helper" onClick={() => setDialog({ ...dialog, password: generateTemporaryPassword(), showPassword: true })}>Gerar outra senha segura</button>
              </div>
            )}

            {dialog.kind === 'devices' && (
              <div className="bm-dialog-content">
                <p>Escolha quantos aparelhos podem permanecer vinculados ao mesmo usuário.</p>
                <label><span>Aparelhos permitidos</span><select autoFocus value={dialog.maxDevices} onChange={(event) => setDialog({ ...dialog, maxDevices: Number(event.target.value) })}>{[1,2,3,4,5,6,8,10].map((value) => <option key={value} value={value}>{value} aparelho{value > 1 ? 's' : ''}</option>)}</select></label>
              </div>
            )}

            {dialog.kind === 'delete' && (
              <div className="bm-dialog-danger">
                <AlertTriangle size={24} />
                <div><strong>Esta ação não pode ser desfeita</strong><span>A conta será removida do acesso. Faça backup dos dados do cliente antes de continuar.</span></div>
              </div>
            )}

            <div className="bm-dialog-actions">
              <button type="button" onClick={() => setDialog(null)} disabled={loading}>Cancelar</button>
              <button type="button" className={dialog.kind === 'delete' ? 'danger-action' : 'elite-button'} onClick={() => void confirmDialogAction()} disabled={loading || (dialog.kind === 'password' && dialog.password.length < 10)}>
                {loading ? <Loader2 className="spin" size={16} /> : dialog.kind === 'delete' ? <Trash2 size={16} /> : <CheckCircle2 size={16} />}
                {dialog.kind === 'password' ? 'Salvar nova senha' : dialog.kind === 'devices' ? 'Atualizar limite' : 'Excluir conta'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
