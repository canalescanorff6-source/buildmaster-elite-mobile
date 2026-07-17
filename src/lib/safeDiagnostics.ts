import { getOcrRuntimeState } from './ocrWorkerManager';
import { runtimeList, runtimePut, runtimeTrimStore } from './localDatabase';

const SENSITIVE_KEY = /(password|passwd|secret|token|authorization|cookie|session|credential|private|keystore|anon[_-]?key|service[_-]?role|api[_-]?key|email|username|user[_-]?id)/i;
const SENSITIVE_VALUE = /(bearer\s+[a-z0-9._-]+|eyJ[a-zA-Z0-9_-]{12,}\.|sb_(?:secret|publishable)_[a-zA-Z0-9_-]+|-----BEGIN [A-Z ]+PRIVATE KEY-----)/i;

export type SafeDiagnosticReport = {
  schemaVersion: 2;
  app: string;
  version: string;
  generatedAt: string;
  runtime: {
    userAgentFamily: string;
    platform: string;
    language: string;
    online: boolean;
    viewport: string;
    devicePixelRatio: number;
    memoryGb: number | null;
    logicalCores: number | null;
  };
  storage: {
    indexedDbAvailable: boolean;
    quotaBytes: number | null;
    usageBytes: number | null;
    usagePercent: number | null;
    runtimeStores: Record<string, number>;
  };
  ocr: ReturnType<typeof getOcrRuntimeState>;
  health: unknown;
  integrity: unknown;
  migrationLog: string[];
  recentErrors: Array<{ at: string; area: string; code: string; message: string }>;
  privacy: {
    redacted: true;
    excluded: string[];
  };
};

function userAgentFamily(value: string) {
  const source = value.toLowerCase();
  if (source.includes('android')) return 'Android WebView/Chrome';
  if (source.includes('iphone') || source.includes('ipad')) return 'iOS WebKit';
  if (source.includes('chrome')) return 'Chrome';
  if (source.includes('firefox')) return 'Firefox';
  if (source.includes('safari')) return 'Safari';
  return 'Navegador não identificado';
}

export function redactDiagnosticValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[limite de profundidade]';
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (SENSITIVE_VALUE.test(value) || value.length > 1500) return value.length > 1500 ? `[texto omitido: ${value.length} caracteres]` : '[removido]';
    return value.replace(/https?:\/\/[^\s?#]+\?[^\s]+/gi, (url) => url.split('?')[0]);
  }
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => redactDiagnosticValue(item, depth + 1));
  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 150)) {
      output[key] = SENSITIVE_KEY.test(key) ? '[removido]' : redactDiagnosticValue(item, depth + 1);
    }
    return output;
  }
  return String(value);
}

export async function recordSafeRuntimeError(input: { area: string; code?: string; message: string }) {
  const record = {
    at: new Date().toISOString(),
    area: input.area.slice(0, 80),
    code: (input.code || 'runtime').slice(0, 50),
    message: String(redactDiagnosticValue(input.message)).slice(0, 400)
  };
  await runtimePut('diagnostics', `${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, record).catch(() => undefined);
  await runtimeTrimStore('diagnostics', 80).catch(() => undefined);
}

async function storageEstimate() {
  try {
    const estimate = await navigator.storage?.estimate?.();
    const quota = Number.isFinite(estimate?.quota) ? Number(estimate?.quota) : null;
    const usage = Number.isFinite(estimate?.usage) ? Number(estimate?.usage) : null;
    return {
      quotaBytes: quota,
      usageBytes: usage,
      usagePercent: quota && usage !== null ? Math.round((usage / quota) * 1000) / 10 : null
    };
  } catch {
    return { quotaBytes: null, usageBytes: null, usagePercent: null };
  }
}

export async function createSafeDiagnosticReport(input: {
  version: string;
  health: unknown;
  integrity: unknown;
  migrationLog: string[];
}): Promise<SafeDiagnosticReport> {
  const stores = ['ocr-cache', 'ocr-corrections', 'scan-history', 'diagnostics', 'image-thumbnails', 'ocr-queue', 'cards', 'builds', 'formations', 'matches'] as const;
  const counts: Record<string, number> = {};
  for (const store of stores) {
    counts[store] = (await runtimeList(store, 1000).catch(() => [])).length;
  }
  const recentErrors = (await runtimeList<{ at?: string; area?: string; code?: string; message?: string }>('diagnostics', 20).catch(() => []))
    .map(({ value }) => ({
      at: value.at || '',
      area: value.area || 'runtime',
      code: value.code || 'runtime',
      message: String(redactDiagnosticValue(value.message || 'Erro sem mensagem')).slice(0, 400)
    }));
  const estimate = await storageEstimate();
  const nav = typeof navigator === 'undefined' ? null : navigator;
  const win = typeof window === 'undefined' ? null : window;
  const memory = nav && 'deviceMemory' in nav ? Number((nav as Navigator & { deviceMemory?: number }).deviceMemory) : null;
  return {
    schemaVersion: 2,
    app: 'BuildMaster Elite Tático',
    version: input.version,
    generatedAt: new Date().toISOString(),
    runtime: {
      userAgentFamily: nav ? userAgentFamily(nav.userAgent) : 'Servidor',
      platform: nav?.platform || 'não informado',
      language: nav?.language || 'pt-BR',
      online: nav?.onLine ?? true,
      viewport: win ? `${win.innerWidth}x${win.innerHeight}` : 'não disponível',
      devicePixelRatio: win?.devicePixelRatio || 1,
      memoryGb: Number.isFinite(memory) ? memory : null,
      logicalCores: Number.isFinite(nav?.hardwareConcurrency) ? Number(nav?.hardwareConcurrency) : null
    },
    storage: {
      indexedDbAvailable: Boolean(win && 'indexedDB' in win),
      ...estimate,
      runtimeStores: counts
    },
    ocr: getOcrRuntimeState(),
    health: redactDiagnosticValue(input.health),
    integrity: redactDiagnosticValue(input.integrity),
    migrationLog: input.migrationLog.slice(0, 80).map((item) => String(redactDiagnosticValue(item))),
    recentErrors,
    privacy: {
      redacted: true,
      excluded: ['senhas', 'tokens', 'cookies', 'sessões', 'chaves privadas', 'e-mail', 'nome de usuário', 'imagens e texto integral dos prints']
    }
  };
}
