'use client';

import { createContext, FormEvent, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Crown,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  UserRound,
  WifiOff
} from 'lucide-react';
import {
  isCloudAccountsConfigured,
  isTransientAccountError,
  restoreAccountAccess,
  signInWithUsername,
  signOutAccount,
  type AccountProfile,
  type LicenseValidation
} from '@/lib/accountAuth';
import { clearActiveAccountIdentity, setActiveAccountIdentity } from '@/lib/accountStorage';

const LOCAL_AUTH_KEY = 'buildmaster_local_auth_v15_premium';
const LOCAL_LOGIN_USER = process.env.NEXT_PUBLIC_BUILDMASTER_LOCAL_ADMIN_USER || '';
const LOCAL_LOGIN_PASSWORD = process.env.NEXT_PUBLIC_BUILDMASTER_LOCAL_ADMIN_PASSWORD || '';
const ALLOW_LOCAL_FALLBACK = process.env.NEXT_PUBLIC_BUILDMASTER_ALLOW_LOCAL_FALLBACK === '1' && Boolean(LOCAL_LOGIN_USER && LOCAL_LOGIN_PASSWORD);
const SESSION_DURATION = 1000 * 60 * 60 * 24 * 14;

type RestoreStep = 'session' | 'license' | 'workspace';
type LoginPhase = 'idle' | 'credentials' | 'license' | 'authorized';
type FeedbackTone = 'danger' | 'warning' | 'info';

type LoginFeedback = {
  title: string;
  message: string;
  hint: string;
  tone: FeedbackTone;
};

export type BuildMasterAccountContextValue = {
  profile: AccountProfile;
  offline: boolean;
  cloudEnabled: boolean;
  logout: () => Promise<void>;
};

const AccountContext = createContext<BuildMasterAccountContextValue | null>(null);

export function useBuildMasterAccount() {
  return useContext(AccountContext);
}

function localAdminProfile(): AccountProfile {
  return {
    id: 'local-admin',
    username: LOCAL_LOGIN_USER,
    displayName: 'Administrador local',
    role: 'admin',
    status: 'active',
    plan: 'local',
    expiresAt: null,
    maxDevices: 1,
    offlineGraceHours: 0
  };
}

function makeSessionToken() {
  return `bm-local-pro-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readValidLocalSession(): AccountProfile | null {
  if (typeof window === 'undefined' || !ALLOW_LOCAL_FALLBACK) return null;
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as { token?: string; createdAt?: number; username?: string };
    if (!session.token || !session.createdAt || Date.now() - session.createdAt > SESSION_DURATION) {
      localStorage.removeItem(LOCAL_AUTH_KEY);
      return null;
    }
    const profile = localAdminProfile();
    setActiveAccountIdentity({ id: profile.id, username: profile.username, role: profile.role, expiresAt: null, mode: 'local' });
    return profile;
  } catch {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    return null;
  }
}

function saveLocalSession() {
  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ token: makeSessionToken(), createdAt: Date.now(), username: LOCAL_LOGIN_USER }));
  const profile = localAdminProfile();
  setActiveAccountIdentity({ id: profile.id, username: profile.username, role: profile.role, expiresAt: null, mode: 'local' });
  return profile;
}

export function clearBuildMasterSession() {
  try {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    localStorage.removeItem('buildmaster_local_auth_v6_1');
    clearActiveAccountIdentity();
  } catch {
    // Alguns navegadores bloqueiam localStorage em modo privado.
  }
  void signOutAccount();
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

function formatAccessDate(value: string | null) {
  if (!value) return 'Sem prazo definido';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Data não disponível';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function describeLoginError(message: string): LoginFeedback {
  const normalized = message.toLowerCase();

  if (normalized.includes('usuário ou senha') || normalized.includes('senha incorret')) {
    return {
      title: 'Acesso não reconhecido',
      message: 'O usuário ou a senha não conferem com a conta cadastrada.',
      hint: 'Digite somente o nome de usuário criado pelo administrador e confira letras, números e símbolos da senha.',
      tone: 'danger'
    };
  }
  if (normalized.includes('pelo menos 3') || normalized.includes('pelo menos 6') || normalized.includes('comece e termine')) {
    return {
      title: 'Revise os dados informados',
      message,
      hint: 'O usuário deve ter pelo menos 3 caracteres e a senha precisa ter no mínimo 6.',
      tone: 'warning'
    };
  }
  if (normalized.includes('confirmad')) {
    return {
      title: 'Conta aguardando confirmação',
      message: 'A conta existe, mas ainda não está confirmada no servidor.',
      hint: 'O administrador deve abrir Authentication › Users no Supabase e confirmar esse usuário.',
      tone: 'warning'
    };
  }
  if (normalized.includes('função') || normalized.includes('serviço de licença') || normalized.includes('not found')) {
    return {
      title: 'Serviço de licença indisponível',
      message: 'O aplicativo entrou no servidor, mas não encontrou o serviço responsável por validar a licença.',
      hint: 'Confirme no Supabase se a função license-session está publicada com esse nome exato.',
      tone: 'warning'
    };
  }
  if (normalized.includes('chave incorreta') || normalized.includes('url correta') || normalized.includes('não foi configurado') || normalized.includes('supabase ainda')) {
    return {
      title: 'Aplicativo sem conexão válida',
      message: 'Este APK não contém uma configuração válida do servidor de contas.',
      hint: 'Gere e instale um APK novo com a URL e a chave pública corretas do Supabase.',
      tone: 'warning'
    };
  }
  if (normalized.includes('internet') || normalized.includes('conectar') || normalized.includes('indisponível') || normalized.includes('network') || normalized.includes('fetch')) {
    return {
      title: 'Não foi possível alcançar o servidor',
      message: 'A validação da conta não terminou porque o servidor não respondeu.',
      hint: 'Confira a internet, desligue VPN ou DNS privado temporariamente e tente novamente.',
      tone: 'info'
    };
  }
  if (normalized.includes('muitas tentativas') || normalized.includes('aguarde')) {
    return {
      title: 'Muitas tentativas seguidas',
      message: 'O servidor aplicou uma pausa temporária para proteger a conta.',
      hint: 'Espere alguns minutos antes de tentar novamente.',
      tone: 'warning'
    };
  }
  if (normalized.includes('sessão')) {
    return {
      title: 'Sessão encerrada',
      message: 'A sessão anterior não pôde ser restaurada com segurança.',
      hint: 'Entre novamente para renovar a validação da licença.',
      tone: 'info'
    };
  }

  return {
    title: 'Não foi possível concluir o acesso',
    message: message || 'Ocorreu uma falha inesperada durante a validação.',
    hint: 'Tente novamente. Se continuar, confira a conta e a configuração do servidor.',
    tone: 'danger'
  };
}

function AccessMessage({ profile, type }: { profile: AccountProfile; type: 'blocked' | 'expired' }) {
  const blocked = type === 'blocked';
  return (
    <main className={`auth-screen access-state-screen access-state-${type}`} aria-live="polite">
      <section className="auth-orbit" aria-hidden="true" />
      <section className="access-state-card luxury-panel">
        <div className="access-state-brand">
          <div className="auth-logo-mark">{blocked ? <AlertTriangle size={34} /> : <Clock3 size={34} />}</div>
          <div><span>BuildMaster</span><strong>Elite Tático</strong></div>
        </div>

        <span className="access-state-badge">{blocked ? 'Acesso suspenso' : 'Licença encerrada'}</span>
        <h1>{blocked ? 'Esta conta está bloqueada' : 'Seu período de acesso terminou'}</h1>
        <p>{blocked
          ? 'A licença foi pausada pelo administrador. Seus dados permanecem protegidos e não são apagados.'
          : 'O prazo contratado chegou ao fim. O administrador pode renovar a mesma conta sem perder o Cofre.'}</p>

        <div className="access-state-details">
          <div><UserRound size={17} /><span>Conta</span><strong>{profile.username}</strong></div>
          <div><BadgeCheck size={17} /><span>Plano</span><strong>{profile.plan || 'Premium'}</strong></div>
          <div><Clock3 size={17} /><span>Validade</span><strong>{formatAccessDate(profile.expiresAt)}</strong></div>
        </div>

        <div className="access-state-help">
          <ShieldCheck size={19} />
          <div>
            <strong>{blocked ? 'Como regularizar' : 'Como renovar'}</strong>
            <span>{blocked
              ? 'Entre em contato com o administrador responsável pela sua conta.'
              : 'Peça ao administrador para acrescentar um novo período à licença existente.'}</span>
          </div>
        </div>

        <button className="elite-button auth-submit" type="button" onClick={() => { clearBuildMasterSession(); window.location.reload(); }}>
          <KeyRound size={18} /> Entrar com outra conta
        </button>
      </section>
    </main>
  );
}

function LoginScreen({ onSuccess, initialError = '' }: { onSuccess: (validation: LicenseValidation | { profile: AccountProfile; offline: boolean }) => void; initialError?: string }) {
  const cloudConfigured = isCloudAccountsConfigured();
  const [username, setUsername] = useState(cloudConfigured ? '' : LOCAL_LOGIN_USER);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<LoginPhase>('idle');
  const [error, setError] = useState(initialError);
  const loading = phase !== 'idle';
  const feedback = error ? describeLoginError(error) : null;

  const phaseLabel = phase === 'credentials'
    ? 'Conferindo credenciais...'
    : phase === 'license'
      ? 'Validando sua licença...'
      : phase === 'authorized'
        ? 'Acesso autorizado'
        : 'Entrar com segurança';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPhase('credentials');
    const cleanUser = username.trim();
    const cleanPassword = password;
    let phaseTimer: number | undefined;

    try {
      phaseTimer = window.setTimeout(() => setPhase('license'), 450);
      if (cloudConfigured) {
        const validation = await signInWithUsername(cleanUser, cleanPassword);
        window.clearTimeout(phaseTimer);
        setPhase('authorized');
        await wait(260);
        onSuccess(validation);
        return;
      }

      if (!ALLOW_LOCAL_FALLBACK) throw new Error('O servidor de contas ainda não foi configurado neste APK.');
      if (cleanUser !== LOCAL_LOGIN_USER || cleanPassword.trim() !== LOCAL_LOGIN_PASSWORD) throw new Error('Usuário ou senha incorretos.');
      const profile = saveLocalSession();
      window.clearTimeout(phaseTimer);
      setPhase('authorized');
      await wait(260);
      onSuccess({ profile, offline: true });
    } catch (cause) {
      if (phaseTimer) window.clearTimeout(phaseTimer);
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.');
      setPhase('idle');
    }
  }

  return (
    <main className="auth-screen auth-login-screen">
      <section className="auth-orbit" aria-hidden="true" />
      <section className="auth-shell">
        <aside className="auth-showcase luxury-panel">
          <div className="auth-showcase-brand">
            <div className="auth-logo-mark"><Sparkles size={31} /></div>
            <div><strong>BuildMaster</strong><span>Elite Tático</span></div>
          </div>

          <div className="auth-showcase-copy">
            <span className="auth-exclusive-badge"><Crown size={15} /> Acesso privado</span>
            <h1>Precisão tática em um ambiente exclusivo.</h1>
            <p>Fichas, habilidades, elenco e Cofre protegidos por uma licença individual.</p>
          </div>

          <div className="auth-benefit-list">
            <article><Fingerprint size={20} /><div><strong>Conta individual</strong><span>Cada usuário acessa somente os próprios dados.</span></div></article>
            <article><Smartphone size={20} /><div><strong>Controle de aparelhos</strong><span>A licença respeita o limite definido pelo administrador.</span></div></article>
            <article><ShieldCheck size={20} /><div><strong>Cofre protegido</strong><span>Suas fichas permanecem separadas e organizadas.</span></div></article>
          </div>

          <div className="auth-showcase-footer">
            <span><BadgeCheck size={15} /> BuildMaster Elite</span>
            <small>Ambiente tático premium • v27.11</small>
          </div>
        </aside>

        <section className="auth-card auth-login-card luxury-panel">
          <div className="auth-mobile-brand">
            <div className="auth-logo-mark"><Sparkles size={28} /></div>
            <div><strong>BuildMaster</strong><span>Elite Tático</span></div>
          </div>

          <div className="auth-login-heading">
            <span className="auth-login-kicker"><LockKeyhole size={14} /> Área segura</span>
            <h1>Bem-vindo de volta</h1>
            <p>Entre com o usuário e a senha fornecidos pelo administrador.</p>
          </div>

          <div className={`auth-license-status ${cloudConfigured ? 'is-online' : 'is-local'}`}>
            <div className="auth-license-icon">{cloudConfigured ? <Server size={19} /> : <WifiOff size={19} />}</div>
            <div>
              <span>Status da licença</span>
              <strong>{cloudConfigured ? 'Validação online ativa' : 'Servidor não configurado'}</strong>
            </div>
            <i>{cloudConfigured ? 'Protegido' : 'Local'}</i>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
            <label className="auth-field">
              <span>Nome de usuário</span>
              <div>
                <UserRound size={18} />
                <input
                  value={username}
                  onChange={(event) => { setUsername(event.target.value); if (error) setError(''); }}
                  placeholder="ex.: joao10"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="username"
                  autoFocus
                  required
                  minLength={3}
                  disabled={loading}
                  aria-invalid={Boolean(error)}
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Senha de acesso</span>
              <div>
                <LockKeyhole size={18} />
                <input
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); if (error) setError(''); }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  disabled={loading}
                  aria-invalid={Boolean(error)}
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} disabled={loading}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {feedback && (
              <div className={`auth-feedback auth-feedback-${feedback.tone}`} role="alert">
                <AlertTriangle size={19} />
                <div><strong>{feedback.title}</strong><span>{feedback.message}</span><small>{feedback.hint}</small></div>
              </div>
            )}

            <button className={`elite-button auth-submit ${phase === 'authorized' ? 'is-authorized' : ''}`} type="submit" disabled={loading} aria-busy={loading}>
              {phase === 'authorized' ? <CheckCircle2 size={19} /> : loading ? <Loader2 className="spin" size={19} /> : <ShieldCheck size={18} />}
              <span>{phaseLabel}</span>
            </button>

            <div className="auth-form-footer">
              <span><UserCheck size={14} /> Acesso criado pelo administrador</span>
              <span><Fingerprint size={14} /> Sessão protegida</span>
            </div>
          </form>

          <p className="auth-support-note">Não existe cadastro público. Somente o administrador cria usuários e gerencia licença, prazo e aparelhos.</p>
        </section>
      </section>
    </main>
  );
}

function SessionLoadingScreen({ step }: { step: RestoreStep }) {
  const steps: Array<{ id: RestoreStep; title: string; description: string }> = [
    { id: 'session', title: 'Sessão protegida', description: 'Lendo o acesso salvo neste aparelho.' },
    { id: 'license', title: 'Licença online', description: 'Confirmando prazo, status e aparelhos.' },
    { id: 'workspace', title: 'Ambiente tático', description: 'Preparando Cofre, fichas e preferências.' }
  ];
  const activeIndex = steps.findIndex((item) => item.id === step);

  return (
    <main className="auth-screen premium-loading-screen" role="status" aria-busy="true" aria-live="polite">
      <section className="auth-orbit" aria-hidden="true" />
      <section className="session-loading-card luxury-panel">
        <div className="session-loading-brand">
          <div className="auth-logo-mark premium-loading-mark"><Sparkles size={30} /></div>
          <div><span>BuildMaster</span><strong>Elite Tático</strong></div>
        </div>

        <span className="session-loading-badge"><ShieldCheck size={14} /> Entrada segura</span>
        <h1>Preparando seu ambiente</h1>
        <p>Aguarde enquanto o BuildMaster valida seu acesso e carrega os dados da conta.</p>

        <div className="session-step-list">
          {steps.map((item, index) => {
            const complete = index < activeIndex;
            const active = index === activeIndex;
            return (
              <div key={item.id} className={`${complete ? 'is-complete' : ''} ${active ? 'is-active' : ''}`}>
                <i>{complete ? <CheckCircle2 size={18} /> : active ? <Loader2 className="spin" size={18} /> : <LockKeyhole size={17} />}</i>
                <div><strong>{item.title}</strong><span>{item.description}</span></div>
              </div>
            );
          })}
        </div>

        <div className="premium-loading-track" aria-hidden="true"><i /></div>
        <small className="session-loading-footnote"><RefreshCw size={13} /> A validação é renovada automaticamente durante o uso.</small>
      </section>
    </main>
  );
}

export function AuthGate({ children }: { children?: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [validation, setValidation] = useState<{ profile: AccountProfile; offline: boolean } | null>(null);
  const [restoreError, setRestoreError] = useState('');
  const [restoreStep, setRestoreStep] = useState<RestoreStep>('session');
  const [recheckNonce, setRecheckNonce] = useState(0);
  const [rechecking, setRechecking] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function restore() {
      const startedAt = Date.now();
      try {
        setRestoreStep('session');
        if (isCloudAccountsConfigured()) {
          setRestoreStep('license');
          const cloud = await restoreAccountAccess();
          if (mounted && cloud) {
            setRestoreStep('workspace');
            setValidation({ profile: cloud.profile, offline: cloud.offline });
          }
        } else {
          const local = readValidLocalSession();
          if (mounted && local) {
            setRestoreStep('workspace');
            setValidation({ profile: local, offline: true });
          }
        }
      } catch (cause) {
        if (mounted) setRestoreError(cause instanceof Error ? cause.message : 'Não foi possível validar sua licença.');
      } finally {
        const remaining = Math.max(0, 480 - (Date.now() - startedAt));
        if (remaining) await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
        if (mounted) setReady(true);
      }
    }
    void restore();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!validation || !isCloudAccountsConfigured()) return;
    let mounted = true;
    let validating = false;
    let resumeTimer: number | null = null;
    let reconnectTimer: number | null = null;
    let reconnectAttempt = 0;

    function scheduleReconnect() {
      if (!mounted || reconnectTimer !== null || reconnectAttempt >= 3) return;
      const delays = [4_000, 12_000, 30_000];
      const delay = delays[reconnectAttempt] ?? 30_000;
      reconnectAttempt += 1;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        void revalidate();
      }, delay);
    }

    async function revalidate() {
      if (validating) return;
      validating = true;
      if (mounted) setRechecking(true);
      try {
        const cloud = await restoreAccountAccess();
        if (!mounted) return;
        if (!cloud) {
          setRestoreError('Sua sessão terminou. Entre novamente.');
          setValidation(null);
          return;
        }
        reconnectAttempt = 0;
        setValidation({ profile: cloud.profile, offline: cloud.offline });
        setRestoreError('');
      } catch (cause) {
        if (!mounted) return;

        // Ao voltar do WhatsApp, navegador ou tela bloqueada, a rede do Android pode
        // demorar alguns instantes para responder. Uma falha temporária não encerra
        // a sessão nem devolve o usuário para a tela de login.
        if (isTransientAccountError(cause)) {
          setRestoreError('');
          setValidation((current) => current ? { ...current, offline: true } : current);
          scheduleReconnect();
          return;
        }

        setRestoreError(cause instanceof Error ? cause.message : 'Não foi possível validar sua licença.');
        setValidation(null);
      } finally {
        validating = false;
        if (mounted) setRechecking(false);
      }
    }

    const timer = window.setInterval(() => void revalidate(), 5 * 60 * 1000);
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (resumeTimer !== null) window.clearTimeout(resumeTimer);
      // Pequeno atraso para o WebView recuperar Wi‑Fi/dados móveis antes da validação.
      resumeTimer = window.setTimeout(() => void revalidate(), 1800);
    };
    const onOnline = () => void revalidate();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    if (recheckNonce > 0) void revalidate();
    return () => {
      mounted = false;
      window.clearInterval(timer);
      if (resumeTimer !== null) window.clearTimeout(resumeTimer);
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
    };
  }, [validation?.profile.id, recheckNonce]);

  const context = useMemo<BuildMasterAccountContextValue | null>(() => validation ? {
    profile: validation.profile,
    offline: validation.offline,
    cloudEnabled: isCloudAccountsConfigured(),
    logout: async () => {
      clearBuildMasterSession();
      setValidation(null);
    }
  } : null, [validation]);

  if (!ready) return <SessionLoadingScreen step={restoreStep} />;

  if (!validation) {
    return <LoginScreen initialError={restoreError} onSuccess={(next) => { setRestoreError(''); setValidation({ profile: next.profile, offline: next.offline }); }} />;
  }

  if (validation.profile.status === 'blocked' || validation.profile.status === 'suspended') {
    return <AccessMessage profile={validation.profile} type="blocked" />;
  }
  if (validation.profile.expiresAt && Date.parse(validation.profile.expiresAt) <= Date.now()) {
    return <AccessMessage profile={validation.profile} type="expired" />;
  }

  return (
    <AccountContext.Provider value={context}>
      {validation.offline && (
        <div className="offline-license-banner" role="status" aria-live="polite">
          <span><WifiOff size={15} /><strong>Conexão temporária</strong><small>Sua sessão foi mantida. O app tentará validar novamente sem pedir a senha.</small></span>
          <button type="button" onClick={() => setRecheckNonce((value) => value + 1)} disabled={rechecking}>
            {rechecking ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
            {rechecking ? 'Verificando' : 'Tentar agora'}
          </button>
        </div>
      )}
      {children}
    </AccountContext.Provider>
  );
}
