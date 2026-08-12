export type ApkDownloadProgress = {
  phase: 'refreshing-manifest' | 'preparing-backup' | 'awaiting-permission' | 'connecting' | 'downloading' | 'downloading-system' | 'downloading-http' | 'copying' | 'verifying' | 'opening-installer' | 'ready';
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
};
