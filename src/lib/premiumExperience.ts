export type PremiumToastTone = 'success' | 'info' | 'warning' | 'danger';

export type PremiumToastPayload = {
  title: string;
  message?: string;
  tone?: PremiumToastTone;
  duration?: number;
  actionLabel?: string;
  actionEvent?: string;
};

export type PremiumBusyPayload = {
  active: boolean;
  label?: string;
  progress?: number | null;
};

export type PremiumScreenChangePayload = {
  section: string;
  label?: string;
};

function dispatch<T>(name: string, detail: T) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<T>(name, { detail }));
}

export function showPremiumToast(payload: PremiumToastPayload) {
  dispatch('buildmaster:toast', payload);
}

export function setPremiumBusy(payload: PremiumBusyPayload) {
  dispatch('buildmaster:busy', payload);
}

export function announcePremiumScreen(payload: PremiumScreenChangePayload) {
  dispatch('buildmaster:screen-change', payload);
}

export function celebratePremiumAction(message = 'Ação concluída com sucesso') {
  dispatch('buildmaster:celebrate', { message });
}
