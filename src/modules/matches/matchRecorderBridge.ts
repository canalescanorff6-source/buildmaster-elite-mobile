import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export type MatchRecordingQuality = 'economy' | 'balanced' | 'detailed';
export type MatchRecordingState = 'idle' | 'requesting' | 'recording' | 'stopping' | 'completed' | 'error';

export type MatchRecorderCapabilities = {
  native: boolean;
  supported: boolean;
  sdkInt: number | null;
  profiles: MatchRecordingQuality[];
  microphoneSupported: boolean;
  appAudioSupported: boolean;
  maxRecommendedProfile: MatchRecordingQuality;
  reason?: string;
};

export type MatchRecordingDescriptor = {
  id: string;
  path: string;
  uri?: string;
  publicFileName?: string;
  title?: string;
  gallerySaved?: boolean;
  analysisReady?: boolean;
  thumbnailUri?: string;
  relativePath?: string;
  exportedAt?: string;
  fileName: string;
  createdAt: string;
  durationMs: number;
  sizeBytes: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  quality: MatchRecordingQuality;
  state: MatchRecordingState;
  error?: string;
};


export type MatchRecordingExportResult = {
  saved: boolean;
  reused: boolean;
  id: string;
  uri: string;
  fileName: string;
  relativePath: string;
};

export type MatchRecordingShareResult = MatchRecordingExportResult & {
  shared: boolean;
};

export type MatchRecorderStorageInfo = { availableBytes: number; totalBytes: number; lowStorage: boolean };

export type MatchRecorderStatus = {
  state: MatchRecordingState;
  active: boolean;
  startedAt: number | null;
  elapsedMs: number;
  current?: MatchRecordingDescriptor | null;
  last?: MatchRecordingDescriptor | null;
  message?: string;
};

export type StartMatchRecordingOptions = {
  quality: MatchRecordingQuality;
  landscape: boolean;
  includeMicrophone: boolean;
  title?: string;
};

type MatchRecorderPlugin = {
  getCapabilities(): Promise<MatchRecorderCapabilities>;
  getStatus(): Promise<MatchRecorderStatus>;
  startRecording(options: StartMatchRecordingOptions): Promise<MatchRecorderStatus>;
  stopRecording(): Promise<MatchRecorderStatus>;
  listRecordings(): Promise<{ recordings: MatchRecordingDescriptor[] }>;
  deleteRecording(options: { id: string }): Promise<{ deleted: boolean }>;
  renameRecording(options: { id: string; title: string }): Promise<{ renamed: boolean; recording: MatchRecordingDescriptor }>;
  getStorageInfo(): Promise<MatchRecorderStorageInfo>;
  exportRecording(options: { id: string }): Promise<MatchRecordingExportResult>;
  shareRecording(options: { id: string }): Promise<MatchRecordingShareResult>;
  restoreOrientation(): Promise<{ restored: boolean }>;
  addListener(eventName: 'recordingStateChanged', listener: (status: MatchRecorderStatus) => void): Promise<PluginListenerHandle>;
};

const NativeMatchRecorder = registerPlugin<MatchRecorderPlugin>('BuildMasterMatchRecorder');

export function isNativeMatchRecorderAvailable() {
  return Capacitor.isNativePlatform();
}

export async function getMatchRecorderCapabilities(): Promise<MatchRecorderCapabilities> {
  if (!Capacitor.isNativePlatform()) {
    return {
      native: false,
      supported: false,
      sdkInt: null,
      profiles: [],
      microphoneSupported: false,
      appAudioSupported: false,
      maxRecommendedProfile: 'balanced',
      reason: 'A gravação direta funciona somente no aplicativo Android. No navegador, importe um vídeo já gravado.'
    };
  }
  try {
    return await NativeMatchRecorder.getCapabilities();
  } catch (error) {
    return {
      native: true,
      supported: false,
      sdkInt: null,
      profiles: [],
      microphoneSupported: false,
      appAudioSupported: false,
      maxRecommendedProfile: 'balanced',
      reason: error instanceof Error ? error.message : 'O plugin nativo de gravação não está disponível neste APK.'
    };
  }
}

export async function getMatchRecorderStatus(): Promise<MatchRecorderStatus> {
  if (!Capacitor.isNativePlatform()) return { state: 'idle', active: false, startedAt: null, elapsedMs: 0 };
  return NativeMatchRecorder.getStatus();
}

export async function startMatchRecording(options: StartMatchRecordingOptions) {
  if (!Capacitor.isNativePlatform()) throw new Error('A gravação direta está disponível somente no APK Android.');
  return NativeMatchRecorder.startRecording(options);
}

export async function stopMatchRecording() {
  if (!Capacitor.isNativePlatform()) throw new Error('Nenhuma gravação nativa está ativa.');
  return NativeMatchRecorder.stopRecording();
}

export async function listMatchRecordings() {
  if (!Capacitor.isNativePlatform()) return [] as MatchRecordingDescriptor[];
  const result = await NativeMatchRecorder.listRecordings();
  return Array.isArray(result.recordings) ? result.recordings : [];
}

export async function saveMatchRecordingToGallery(id: string) {
  if (!Capacitor.isNativePlatform()) throw new Error('Salvar a gravação na Galeria está disponível somente no APK Android.');
  return NativeMatchRecorder.exportRecording({ id });
}

export async function shareMatchRecording(id: string) {
  if (!Capacitor.isNativePlatform()) throw new Error('Compartilhar a gravação está disponível somente no APK Android.');
  return NativeMatchRecorder.shareRecording({ id });
}

export async function renameMatchRecording(id: string, title: string) {
  if (!Capacitor.isNativePlatform()) throw new Error('Renomear gravações internas está disponível somente no APK Android.');
  return NativeMatchRecorder.renameRecording({ id, title: title.trim().slice(0, 80) });
}

export async function getMatchRecorderStorageInfo(): Promise<MatchRecorderStorageInfo | null> {
  if (!Capacitor.isNativePlatform()) {
    const estimate = await navigator.storage?.estimate?.().catch(() => null);
    if (!estimate?.quota) return null;
    const availableBytes = Math.max(0, estimate.quota - Number(estimate.usage || 0));
    return { availableBytes, totalBytes: estimate.quota, lowStorage: availableBytes < 750 * 1024 * 1024 };
  }
  try { return await NativeMatchRecorder.getStorageInfo(); } catch { return null; }
}

export async function deleteMatchRecording(id: string) {
  if (!Capacitor.isNativePlatform()) return false;
  const result = await NativeMatchRecorder.deleteRecording({ id });
  return Boolean(result.deleted);
}

export async function restoreMatchRecorderOrientation() {
  if (!Capacitor.isNativePlatform()) return false;
  const result = await NativeMatchRecorder.restoreOrientation();
  return Boolean(result.restored);
}

export async function listenToMatchRecorder(listener: (status: MatchRecorderStatus) => void) {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    return await NativeMatchRecorder.addListener('recordingStateChanged', listener);
  } catch {
    return null;
  }
}
