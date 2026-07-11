'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserRound } from 'lucide-react';

const AUTH_KEY = 'buildmaster_local_auth_v15_premium';
const LOGIN_USER = 'thiago0126';
const LOGIN_PASSWORD = 'iu1fsaa67a';
const SESSION_DURATION = 1000 * 60 * 60 * 24 * 14;

function makeSessionToken() {
  return `bm-local-pro-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function hasValidLocalSession() {
  if (typeof window === 'undefined') return false;

  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;

    const session = JSON.parse(raw) as { token?: string; createdAt?: number };
    if (!session.token || !session.createdAt) return false;

    if (Date.now() - session.createdAt > SESSION_DURATION) {
      localStorage.removeItem(AUTH_KEY);
      return false;
    }

    return true;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return false;
  }
}

function saveLocalSession() {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token: makeSessionToken(), createdAt: Date.now() }));
}

export function clearBuildMasterSession() {
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('buildmaster_local_auth_v6_1');
  } catch {
    // Alguns navegadores bloqueiam localStorage em modo privado.
  }
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState(LOGIN_USER);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    window.setTimeout(() => {
      const cleanUser = username.trim();
      const cleanPassword = password.trim();

      if (cleanUser !== LOGIN_USER || cleanPassword !== LOGIN_PASSWORD) {
        setError('Usuário ou senha incorretos. Confira e tente novamente.');
        setLoading(false);
        return;
      }

      try {
        saveLocalSession();
        onSuccess();
      } catch {
        setError('O navegador bloqueou a sessão local. Limpe os dados do site ou desative o modo privado.');
        setLoading(false);
      }
    }, 160);
  }

  return (
    <main className="auth-screen">
      <section className="auth-orbit" aria-hidden="true" />
      <section className="auth-card luxury-panel">
        <div className="auth-logo-mark"><Sparkles size={34} /></div>
        <p className="auth-app-name">BuildMaster</p>
        <h1>Elite Tático</h1>
        <p className="auth-subtitle">Central premium local, privada e focada em desempenho real.</p>

        <div className="auth-security-note">
          <LockKeyhole size={18} />
          <div>
            <strong>Acesso privado e seguro</strong>
            <span>Seus dados ficam apenas no seu dispositivo.</span>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Entrar no BuildMaster</h2>

          <label className="auth-field">
            <span>Usuário</span>
            <div>
              <UserRound size={18} />
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
            </div>
          </label>

          <label className="auth-field">
            <span>Senha</span>
            <div>
              <LockKeyhole size={18} />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="elite-button auth-submit" type="submit" disabled={loading}>
            <ShieldCheck size={18} />
            {loading ? 'Entrando...' : 'Entrar com segurança'}
          </button>

          <p className="auth-footnote"><ShieldCheck size={14} /> Sessão salva apenas neste navegador</p>
        </form>
      </section>
    </main>
  );
}

export function AuthGate({ children }: { children?: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(hasValidLocalSession());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="auth-screen">
        <section className="auth-card luxury-panel loading-card">
          <p className="kicker">BuildMaster</p>
          <h2>Verificando acesso...</h2>
        </section>
      </main>
    );
  }

  if (!authenticated) {
    return <LoginScreen onSuccess={() => setAuthenticated(true)} />;
  }

  return <>{children}</>;
}
