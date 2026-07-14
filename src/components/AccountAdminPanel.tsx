'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, KeyRound, Loader2, RefreshCw, ShieldCheck, Trash2, UserPlus, Users, XCircle } from 'lucide-react';
import { useBuildMasterAccount } from '@/components/AuthGate';
import { adminAccountRequest, isCloudAccountsConfigured, type AccountStatus, type AdminUserAction, type AdminUserRow, validateUsername } from '@/lib/accountAuth';

function dateLabel(value?: string | null) {
  if (!value) return 'Sem vencimento';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleString('pt-BR');
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

export function AccountAdminPanel() {
  const account = useBuildMasterAccount();
  const configured = isCloudAccountsConfigured();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [maxDevices, setMaxDevices] = useState(1);

  const loadUsers = useCallback(async () => {
    if (!configured || account?.profile.role !== 'admin') return;
    setLoading(true); setError('');
    try {
      const result = await adminAccountRequest<{ users: AdminUserRow[] }>({ action: 'list' });
      setUsers(Array.isArray(result.users) ? result.users : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não consegui carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [account?.profile.role, configured]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  async function runAction(action: AdminUserAction, success: string) {
    setLoading(true); setError(''); setMessage('');
    try {
      await adminAccountRequest(action);
      setMessage(success);
      await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'A ação não pôde ser concluída.');
    } finally {
      setLoading(false);
    }
  }

  async function createUser(event: FormEvent) {
    event.preventDefault();
    const usernameError = validateUsername(username);
    if (usernameError) { setError(usernameError); return; }
    if (password.length < 8) { setError('Use uma senha temporária com pelo menos 8 caracteres.'); return; }
    await runAction({ action: 'create', username, password, displayName, durationDays, maxDevices, plan: 'premium' }, `Usuário ${username.trim().toLowerCase()} criado.`);
    setUsername(''); setDisplayName(''); setPassword('');
  }

  const activeCount = useMemo(() => users.filter((user) => user.status === 'active' && (!user.expiresAt || Date.parse(user.expiresAt) > Date.now())).length, [users]);

  if (!account) return null;

  if (!configured) {
    return (
      <section className="account-admin-panel luxury-panel settings-view-panel">
        <div className="section-title-row"><div><p className="kicker"><Users size={15} /> Contas e licenças</p><h3>Configuração do servidor pendente</h3></div><span>Modo local</span></div>
        <div className="account-setup-warning"><AlertTriangle size={20} /><div><strong>O painel seguro ainda não está conectado.</strong><span>Crie o projeto Supabase, aplique o SQL e publique as duas Edge Functions incluídas no pacote. Depois configure as variáveis do GitHub.</span></div></div>
        <div className="account-setup-steps">
          <span>1. Supabase → SQL Editor → executar a migração de contas.</span>
          <span>2. Publicar as funções <b>license-session</b> e <b>admin-users</b>.</span>
          <span>3. Configurar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.</span>
          <span>4. Criar e promover a primeira conta de administrador.</span>
        </div>
      </section>
    );
  }

  if (account.profile.role !== 'admin') {
    return (
      <section className="account-admin-panel luxury-panel settings-view-panel">
        <div className="section-title-row"><div><p className="kicker"><ShieldCheck size={15} /> Minha licença</p><h3>{account.profile.displayName || account.profile.username}</h3></div><span className={statusClass(account.profile.status)}>{statusLabel(account.profile.status)}</span></div>
        <div className="account-license-grid">
          <article><strong>{account.profile.username}</strong><span>Usuário</span></article>
          <article><strong>{dateLabel(account.profile.expiresAt)}</strong><span>Vencimento</span></article>
          <article><strong>{account.profile.maxDevices}</strong><span>Aparelho(s) permitido(s)</span></article>
          <article><strong>{account.profile.plan}</strong><span>Plano</span></article>
        </div>
        <p className="panel-note">A criação, renovação e troca de senha são feitas somente pelo administrador.</p>
      </section>
    );
  }

  return (
    <div className="account-admin-workspace">
      <section className="account-admin-panel luxury-panel settings-view-panel">
        <div className="section-title-row">
          <div><p className="kicker"><ShieldCheck size={15} /> Administração exclusiva</p><h3>Usuários e prazos de acesso</h3></div>
          <button type="button" onClick={() => void loadUsers()} disabled={loading}>{loading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />} Atualizar</button>
        </div>
        <div className="account-license-grid">
          <article><strong>{users.length}</strong><span>Contas</span></article>
          <article><strong>{activeCount}</strong><span>Ativas</span></article>
          <article><strong>{users.filter((user) => user.status === 'suspended').length}</strong><span>Suspensas</span></article>
          <article><strong>{users.reduce((sum, user) => sum + Number(user.deviceCount || 0), 0)}</strong><span>Aparelhos</span></article>
        </div>
        {message && <p className="account-success"><CheckCircle2 size={15} /> {message}</p>}
        {error && <p className="auth-error"><AlertTriangle size={15} /> {error}</p>}
      </section>

      <section className="account-create-panel luxury-panel settings-view-panel">
        <div className="section-title-row"><div><p className="kicker"><UserPlus size={15} /> Nova conta</p><h3>Somente o administrador cria</h3></div><span>Sem e-mail visível</span></div>
        <form className="account-create-grid" onSubmit={createUser}>
          <label><span>Nome de usuário</span><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="ex.: joao10" autoCapitalize="none" /></label>
          <label><span>Nome de exibição</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="João" /></label>
          <label><span>Senha temporária</span><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Mínimo 8 caracteres" /></label>
          <label><span>Prazo inicial</span><select value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))}><option value={7}>7 dias</option><option value={15}>15 dias</option><option value={30}>30 dias</option><option value={60}>60 dias</option><option value={90}>90 dias</option><option value={365}>1 ano</option></select></label>
          <label><span>Limite de aparelhos</span><select value={maxDevices} onChange={(event) => setMaxDevices(Number(event.target.value))}><option value={1}>1 aparelho</option><option value={2}>2 aparelhos</option><option value={3}>3 aparelhos</option></select></label>
          <button className="elite-button" type="submit" disabled={loading}><UserPlus size={17} /> Criar usuário</button>
        </form>
      </section>

      <section className="account-users-panel luxury-panel settings-view-panel">
        <div className="section-title-row"><div><p className="kicker"><Users size={15} /> Contas cadastradas</p><h3>Renovar, bloquear e redefinir</h3></div><span>{users.length} resultado(s)</span></div>
        <div className="account-user-list">
          {users.map((user) => (
            <article key={user.id} className="account-user-card">
              <div className="account-user-head">
                <div><strong>{user.displayName || user.username}</strong><span>@{user.username} • {user.role === 'admin' ? 'Administrador' : user.plan}</span></div>
                <span className={statusClass(user.status)}>{statusLabel(user.status)}</span>
              </div>
              <div className="account-user-meta"><span><Clock3 size={14} /> {dateLabel(user.expiresAt)}</span><span>{user.deviceCount || 0}/{user.maxDevices} aparelho(s)</span></div>
              <div className="account-user-actions">
                <button type="button" onClick={() => void runAction({ action: 'renew', userId: user.id, durationDays: 30 }, `Acesso de ${user.username} renovado por 30 dias.`)}><Clock3 size={14} /> +30 dias</button>
                {user.status === 'active' ? <>
                  <button type="button" onClick={() => void runAction({ action: 'set_status', userId: user.id, status: 'suspended' }, `${user.username} foi suspenso.`)}><XCircle size={14} /> Suspender</button>
                  {user.role !== 'admin' && <button type="button" onClick={() => void runAction({ action: 'set_status', userId: user.id, status: 'blocked' }, `${user.username} foi bloqueado.`)}><XCircle size={14} /> Bloquear</button>}
                </> : <button type="button" onClick={() => void runAction({ action: 'set_status', userId: user.id, status: 'active' }, `${user.username} foi reativado.`)}><CheckCircle2 size={14} /> Ativar</button>}
                <button type="button" onClick={() => { const next = window.prompt(`Nova senha para ${user.username}:`); if (next) void runAction({ action: 'reset_password', userId: user.id, password: next }, `Senha de ${user.username} redefinida.`); }}><KeyRound size={14} /> Nova senha</button>
                <button type="button" onClick={() => { const next = Number(window.prompt(`Quantos aparelhos para ${user.username}?`, String(user.maxDevices))); if (Number.isFinite(next) && next >= 1) void runAction({ action: 'set_devices', userId: user.id, maxDevices: next }, `Limite de aparelhos de ${user.username} atualizado.`); }}><Users size={14} /> Limite</button>
                <button type="button" onClick={() => void runAction({ action: 'revoke_devices', userId: user.id }, `Aparelhos de ${user.username} desconectados.`)}><RefreshCw size={14} /> Desconectar</button>
                {user.role !== 'admin' && <button className="danger-action" type="button" onClick={() => { if (window.confirm(`Excluir definitivamente ${user.username}?`)) void runAction({ action: 'delete', userId: user.id }, `${user.username} foi excluído.`); }}><Trash2 size={14} /> Excluir</button>}
              </div>
            </article>
          ))}
          {!loading && users.length === 0 && <div className="empty-cofre-card"><strong>Nenhum usuário carregado</strong><span>Crie a primeira conta comum pelo formulário acima.</span></div>}
        </div>
      </section>
    </div>
  );
}
