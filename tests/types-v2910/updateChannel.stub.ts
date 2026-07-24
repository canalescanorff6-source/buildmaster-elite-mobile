import type { AppUpdateManifest } from '../../src/lib/appUpdates';
export type UpdateChannelSource = 'primary-channel' | 'beta-channel' | 'legacy-manifest' | 'release-api';
export type UpdateManifestCandidate = { payload: unknown; manifest: AppUpdateManifest; source: UpdateChannelSource; endpoint: string };
export type UpdateManifestFetchResult = UpdateManifestCandidate & { checkedAt: string; previousErrors: string[]; candidates: Array<{ source: UpdateChannelSource; endpoint: string; version: string; versionCode: number; apkUrl: string; channel: 'stable' | 'beta' }>; alternatives: UpdateManifestCandidate[] };
export async function fetchUpdateManifest(channel: 'stable' | 'beta' = 'stable'): Promise<UpdateManifestFetchResult> { void channel; throw new Error('stub'); }
