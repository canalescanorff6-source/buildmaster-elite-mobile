'use client';

import { createContext, FormEvent, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock3, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserRound, WifiOff } from 'lucide-react';
import {
  isCloudAccountsConfigured,
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

function AccessMessage({ title, message, icon }: { title: string; message: string; icon: ReactNode }) {
  return (
    <main className="auth-screen">
      <section className="auth-card luxury-panel auth-license-message">
        <div className="auth-logo-mark">{icon}</div>
        <p className="auth-app-name">BuildMaster</p>
        <h1>{title}</h1>
        <p className="auth-subtitle">{message}</p>
        <button className="elite-button auth-submit" type="button" onClick={() => { clearBuildMasterSession(); window.location.reload(); }}>
          <LockKeyhole size={18} /> Voltar ao login
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const cleanUser = username.trim();
    const cleanPassword = password;

    try {
      if (cloudConfigured) {
        const validation = await signInWithUsername(cleanUser, cleanPassword);
        onSuccess(validation);
        return;
      }

      if (!ALLOW_LOCAL_FALLBACK) throw new Error('O servidor de contas ainda não foi configurado neste APK.');
      if (cleanUser !== LOCAL_LOGIN_USER || cleanPassword.trim() !== LOCAL_LOGIN_PASSWORD) throw new Error('Usuário ou senha incorretos.');
      const profile = saveLocalSession();
      onSuccess({ profile, offline: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.');
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-orbit" aria-hidden="true" />
      <section className="auth-card luxury-panel">
        <div className="auth-logo-mark"><Sparkles size={34} /></div>
        <p className="auth-app-name">BuildMaster</p>
        <h1>Elite Tático</h1>
        <p className="auth-subtitle">Acesso fechado por usuário, senha e prazo definido pelo administrador.</p>

        <div className="auth-security-note">
          <ShieldCheck size={18} />
          <div>
            <strong>{cloudConfigured ? 'Licença verificada no servidor' : 'Modo local temporário'}</strong>
            <span>{cloudConfigured ? 'Não existe cadastro público. Somente o administrador cria usuários.' : 'Configure o Supabase para criar usuários com prazo e aparelhos separados.'}</span>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Entrar no BuildMaster</h2>

          <label className="auth-field">
            <span>Usuário</span>
            <div>
              <UserRound size={18} />
              <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="ex.: joao10" autoCapitalize="none" autoComplete="username" />
            </div>
          </label>

          <label className="auth-field">
            <span>Senha</span>
            <div>
              <LockKeyhole size={18} />
              <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Digite sua senha" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="elite-button auth-submit" type="submit" disabled={loading}>
            <ShieldCheck size={18} /> {loading ? 'Validando acesso...' : 'Entrar'}
          </button>

          <p className="auth-footnote"><ShieldCheck size={14} /> Usuários comuns não podem criar contas.</p>
        </form>
      </section>
    </main>
  );
}

export function AuthGate({ children }: { children?: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [validation, setValidation] = useState<{ profile: AccountProfile; offline: boolean } | null>(null);
  const [restoreError, setRestoreError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function restore() {
      try {
        if (isCloudAccountsConfigured()) {
          const cloud = await restoreAccountAccess();
          if (mounted && cloud) setValidation({ profile: cloud.profile, offline: cloud.offline });
        } else {
          const local = readValidLocalSession();
          if (mounted && local) setValidation({ profile: local, offline: true });
        }
      } catch (cause) {
        if (mounted) setRestoreError(cause instanceof Error ? cause.message : 'Não foi possível validar sua licença.');
      } finally {
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

    async function revalidate() {
      if (validating) return;
      validating = true;
      try {
        const cloud = await restoreAccountAccess();
        if (!mounted) return;
        if (!cloud) {
          setRestoreError('Sua sessão terminou. Entre novamente.');
          setValidation(null);
          return;
        }
        setValidation({ profile: cloud.profile, offline: cloud.offline });
        setRestoreError('');
      } catch (cause) {
        if (!mounted) return;
        setRestoreError(cause instanceof Error ? cause.message : 'Não foi possível validar sua licença.');
        setValidation(null);
      } finally {
        validating = false;
      }
    }

    const timer = window.setInterval(() => void revalidate(), 5 * 60 * 1000);
    const onVisibility = () => { if (document.visibilityState === 'visible') void revalidate(); };
    const onOnline = () => void revalidate();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    return () => {
      mounted = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
    };
  }, [validation?.profile.id]);

  const context = useMemo<BuildMasterAccountContextValue | null>(() => validation ? {
    profile: validation.profile,
    offline: validation.offline,
    cloudEnabled: isCloudAccountsConfigured(),
    logout: async () => {
      clearBuildMasterSession();
      setValidation(null);
    }
  } : null, [validation]);

  if (!ready) {
    return (
      <main className="auth-screen">
        <section className="auth-card luxury-panel loading-card">
          <p className="kicker">BuildMaster</p>
          <h2>Verificando usuário e validade...</h2>
        </section>
      </main>
    );
  }

  if (!validation) {
    return <LoginScreen initialError={restoreError} onSuccess={(next) => { setRestoreError(''); setValidation({ profile: next.profile, offline: next.offline }); }} />;
  }

  if (validation.profile.status === 'blocked' || validation.profile.status === 'suspended') {
    return <AccessMessage title="Acesso bloqueado" message="Esta conta foi suspensa pelo administrador. Entre em contato para regularizar." icon={<AlertTriangle size={34} />} />;
  }
  if (validation.profile.expiresAt && Date.parse(validation.profile.expiresAt) <= Date.now()) {
    return <AccessMessage title="Prazo encerrado" message="Seu período de uso terminou. O administrador pode renovar sua conta pelo painel." icon={<Clock3 size={34} />} />;
  }

  return (
    <AccountContext.Provider value={context}>
      {validation.offline && validation.profile.role !== 'admin' && <div className="offline-license-banner"><WifiOff size={15} /> Modo offline temporário. Conecte-se antes do fim do período permitido.</div>}
      {children}
    </AccountContext.Provider>
  );
}
