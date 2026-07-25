import { Capacitor, registerPlugin } from '@capacitor/core';

export const APP_DISTRIBUTION = process.env.NEXT_PUBLIC_BUILDMASTER_DISTRIBUTION === 'play' ? 'play' : 'direct';
export const IS_PLAY_DISTRIBUTION = APP_DISTRIBUTION === 'play';

export type PlayIntegrityPreparation = { prepared: boolean; providerExpiresAt?: number };
export type PlayIntegrityToken = { token: string };
export type PlayUpdateAvailability = {
  available: boolean;
  availability: number;
  immediateAllowed: boolean;
  flexibleAllowed: boolean;
  availableVersionCode: number;
  updatePriority: number;
  stalenessDays: number | null;
};

type PlayDeliveryPlugin = {
  prepareIntegrityToken(options: { cloudProjectNumber: string }): Promise<PlayIntegrityPreparation>;
  requestIntegrityToken(options: { requestHash: string }): Promise<PlayIntegrityToken>;
  checkForUpdate(): Promise<PlayUpdateAvailability>;
  startUpdate(options: { mode: 'flexible' | 'immediate' }): Promise<{ started: boolean }>;
  completeFlexibleUpdate(): Promise<{ completed: boolean }>;
};

const PlayDelivery = registerPlugin<PlayDeliveryPlugin>('BuildMasterPlayDelivery');

export function canUseGooglePlayDelivery(): boolean {
  return IS_PLAY_DISTRIBUTION && Capacitor.isNativePlatform();
}

export async function preparePlayIntegrity(cloudProjectNumber: string): Promise<PlayIntegrityPreparation> {
  if (!canUseGooglePlayDelivery()) return { prepared: false };
  const normalized = cloudProjectNumber.trim();
  if (!/^\d{6,20}$/.test(normalized)) throw new Error('Número do projeto Google Cloud inválido.');
  return PlayDelivery.prepareIntegrityToken({ cloudProjectNumber: normalized });
}

export async function requestPlayIntegrityToken(requestHash: string): Promise<PlayIntegrityToken> {
  if (!canUseGooglePlayDelivery()) throw new Error('Play Integrity está disponível somente no aplicativo instalado pela Google Play.');
  const normalized = requestHash.trim();
  if (!/^[A-Za-z0-9_-]{16,500}$/.test(normalized)) throw new Error('Hash da solicitação inválido.');
  return PlayDelivery.requestIntegrityToken({ requestHash: normalized });
}

export async function checkGooglePlayUpdate(): Promise<PlayUpdateAvailability | null> {
  if (!canUseGooglePlayDelivery()) return null;
  return PlayDelivery.checkForUpdate();
}

export async function startGooglePlayUpdate(mode: 'flexible' | 'immediate'): Promise<boolean> {
  if (!canUseGooglePlayDelivery()) return false;
  const result = await PlayDelivery.startUpdate({ mode });
  return Boolean(result.started);
}

export async function completeGooglePlayFlexibleUpdate(): Promise<boolean> {
  if (!canUseGooglePlayDelivery()) return false;
  const result = await PlayDelivery.completeFlexibleUpdate();
  return Boolean(result.completed);
}
