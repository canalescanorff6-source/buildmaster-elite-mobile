'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Info, Loader2, Sparkles, WifiOff, X } from 'lucide-react';
import type { PremiumBusyPayload, PremiumScreenChangePayload, PremiumToastPayload, PremiumToastTone } from '@/lib/premiumExperience';

type ToastRecord = Required<Pick<PremiumToastPayload, 'title' | 'tone' | 'duration'>> & Omit<PremiumToastPayload, 'title' | 'tone' | 'duration'> & { id: string };

const MAX_TOASTS = 4;

function toneIcon(tone: PremiumToastTone) {
  if (tone === 'success') return <CheckCircle2 size={18} />;
  if (tone === 'warning') return <AlertTriangle size={18} />;
  if (tone === 'danger') return <X size={18} />;
  return <Info size={18} />;
}

function createId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PremiumExperienceLayer() {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const [busy, setBusy] = useState<PremiumBusyPayload>({ active: false, progress: null });
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const [screenLabel, setScreenLabel] = useState('');
  const [celebration, setCelebration] = useState('');
  const timers = useRef(new Map<string, number>());
  const screenTimer = useRef<number | null>(null);
  const celebrationTimer = useRef<number | null>(null);

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((payload: PremiumToastPayload) => {
    const toast: ToastRecord = {
      id: createId(),
      title: payload.title,
      message: payload.message,
      tone: payload.tone ?? 'info',
      duration: Math.max(1800, Math.min(payload.duration ?? 4200, 12000)),
      actionLabel: payload.actionLabel,
      actionEvent: payload.actionEvent
    };
    setToasts((current) => [...current.slice(-(MAX_TOASTS - 1)), toast]);
    const timer = window.setTimeout(() => dismiss(toast.id), toast.duration);
    timers.current.set(toast.id, timer);
  }, [dismiss]);

  useEffect(() => {
    const onToast = (event: Event) => pushToast((event as CustomEvent<PremiumToastPayload>).detail);
    const onBusy = (event: Event) => setBusy((event as CustomEvent<PremiumBusyPayload>).detail);
    const onScreen = (event: Event) => {
      const payload = (event as CustomEvent<PremiumScreenChangePayload>).detail;
      setScreenLabel(payload.label || payload.section);
      document.documentElement.classList.remove('bm-screen-entering');
      void document.documentElement.offsetWidth;
      document.documentElement.classList.add('bm-screen-entering');
      if (screenTimer.current) window.clearTimeout(screenTimer.current);
      screenTimer.current = window.setTimeout(() => document.documentElement.classList.remove('bm-screen-entering'), 460);
    };
    const onCelebrate = (event: Event) => {
      const payload = (event as CustomEvent<{ message?: string }>).detail;
      setCelebration(payload.message || 'Concluído');
      if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current);
      celebrationTimer.current = window.setTimeout(() => setCelebration(''), 1500);
    };
    const updateNetwork = () => {
      const next = navigator.onLine;
      setOnline(next);
      pushToast(next
        ? { title: 'Conexão restabelecida', message: 'Os recursos online voltaram a ficar disponíveis.', tone: 'success', duration: 3200 }
        : { title: 'Você está sem internet', message: 'Fichas e recursos locais continuam disponíveis.', tone: 'warning', duration: 6000 });
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>('button, a, [role="button"], [data-premium-feedback]');
      if (!target || target.matches(':disabled,[aria-disabled="true"]')) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--bm-ripple-x', `${event.clientX - rect.left}px`);
      target.style.setProperty('--bm-ripple-y', `${event.clientY - rect.top}px`);
      target.classList.remove('bm-premium-pressed');
      void target.offsetWidth;
      target.classList.add('bm-premium-pressed');
      window.setTimeout(() => target.classList.remove('bm-premium-pressed'), 520);
      if (target.dataset.haptic !== 'off' && navigator.vibrate && matchMedia('(pointer: coarse)').matches) navigator.vibrate(8);
    };

    window.addEventListener('buildmaster:toast', onToast);
    window.addEventListener('buildmaster:busy', onBusy);
    window.addEventListener('buildmaster:screen-change', onScreen);
    window.addEventListener('buildmaster:celebrate', onCelebrate);
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => {
      window.removeEventListener('buildmaster:toast', onToast);
      window.removeEventListener('buildmaster:busy', onBusy);
      window.removeEventListener('buildmaster:screen-change', onScreen);
      window.removeEventListener('buildmaster:celebrate', onCelebrate);
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
      document.removeEventListener('pointerdown', onPointerDown);
      timers.current.forEach((timer) => window.clearTimeout(timer));
      if (screenTimer.current) window.clearTimeout(screenTimer.current);
      if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current);
    };
  }, [pushToast]);

  const progressStyle = useMemo(() => {
    const value = typeof busy.progress === 'number' ? Math.min(100, Math.max(0, busy.progress)) : null;
    return value === null ? undefined : { width: `${value}%` };
  }, [busy.progress]);

  return (
    <>
      <div className={`bm-premium-progress ${busy.active ? 'is-active' : ''} ${typeof busy.progress === 'number' ? 'is-determinate' : 'is-indeterminate'}`} role="progressbar" aria-hidden={!busy.active} aria-label={busy.label || 'Processando'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={typeof busy.progress === 'number' ? busy.progress : undefined}>
        <i style={progressStyle} />
        {busy.active && busy.label && <span><Loader2 size={13} className="spin" />{busy.label}</span>}
      </div>

      {!online && <div className="bm-offline-banner" role="status"><WifiOff size={15} /><span>Modo offline: seus dados locais continuam seguros.</span></div>}

      <div className="bm-toast-viewport" aria-live="polite" aria-relevant="additions removals">
        {toasts.map((toast) => (
          <article key={toast.id} className={`bm-premium-toast tone-${toast.tone}`} role={toast.tone === 'danger' ? 'alert' : 'status'}>
            <span className="bm-toast-icon">{toneIcon(toast.tone)}</span>
            <div className="bm-toast-copy"><strong>{toast.title}</strong>{toast.message && <span>{toast.message}</span>}</div>
            {toast.actionLabel && toast.actionEvent && <button type="button" onClick={() => { window.dispatchEvent(new CustomEvent(toast.actionEvent)); dismiss(toast.id); }}>{toast.actionLabel}</button>}
            <button type="button" className="bm-toast-close" onClick={() => dismiss(toast.id)} aria-label="Fechar aviso"><X size={15} /></button>
            <i className="bm-toast-timer" style={{ animationDuration: `${toast.duration}ms` }} />
          </article>
        ))}
      </div>

      <div className={`bm-screen-announcer ${screenLabel ? 'has-label' : ''}`} aria-live="polite" aria-atomic="true">{screenLabel ? `Área aberta: ${screenLabel}` : ''}</div>

      {celebration && <div className="bm-premium-celebration" role="status"><span><Sparkles size={22} /></span><strong>{celebration}</strong><i /><i /><i /></div>}
    </>
  );
}
