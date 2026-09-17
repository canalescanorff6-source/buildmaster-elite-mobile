import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TARGETS = {
  account: 'src/lib/accountAuth.ts',
  admin: 'supabase/functions/admin-users/index.ts',
  migration: 'supabase/migrations/202607160001_security_hardening_v2675.sql',
  observability: 'src/modules/observability/observabilityEngine.ts',
};

function read(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R422: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function writeIfChanged(file, before, after, patched) {
  if (after === before) return false;
  fs.writeFileSync(file, after, 'utf8');
  patched.push(path.relative(process.cwd(), file).replaceAll('\\\\', '/'));
  return true;
}

function patchAccount(source) {
  return source
    .replace(/\n\s*\| \{ action: 'restore_account_creation' \}/g, '')
    .replace(/\s*\| \{ action: 'restore_account_creation' \}/g, '');
}

function patchAdmin(source) {
  let next = source;
  next = next.replace(/^\s*if \(action === 'restore_account_creation'\) return \{[^\n]*\};\r?\n/m, '');
  next = next.replace(/\n\s*if \(action === 'restore_account_creation'\) \{[\s\S]*?\n\s*\}\n(?=\s*if \(settings\.admin_mfa_required)/, '\n');
  next = next.replace(/if \(action === 'restore_account_creation'\) \{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*/g, '');
  next = next.replace(/,\s*'restore_account_creation'/g, '');
  next = next.replace(/'restore_account_creation',\s*/g, '');
  next = next.replace(/admin_mfa_required:\s*false/g, 'admin_mfa_required: true');
  next = next.replace(
    'Confirme o código do aplicativo autenticador ou restaure o modo normal de criação de contas.',
    'Confirme o código do aplicativo autenticador para continuar.'
  );
  return next;
}

function patchMigration(source) {
  let next = source;
  const pattern = /coalesce\(nullif\(new\.raw_user_meta_data->>'plan', ''\), 'premium'\),\s*\n\s*nullif\(new\.raw_user_meta_data->>'expires_at', ''\)::timestamptz,\s*\n\s*greatest\(1, least\(10, coalesce\(\(new\.raw_user_meta_data->>'max_devices'\)::integer, 1\)\)\),\s*\n\s*greatest\(0, least\(24, coalesce\(\(new\.raw_user_meta_data->>'offline_grace_hours'\)::integer, 4\)\)\)/;
  if (pattern.test(next)) {
    next = next.replace(pattern, "'premium',\n    null,\n    1,\n    4");
  }
  const remainingPrivilegeMetadata = ['plan', 'expires_at', 'max_devices', 'offline_grace_hours'].filter((field) => next.includes(`raw_user_meta_data->>'${field}'`));
  if (remainingPrivilegeMetadata.length) {
    throw new Error(`R422: contrato inesperado no trigger de perfil; metadata privilegiada remanescente: ${remainingPrivilegeMetadata.join(', ')}`);
  }
  if (!next.includes('R422: campos de autorização nunca vêm de raw_user_meta_data')) {
    next = next.replace(
      '-- Novas contas externas continuam suspensas e recebem somente quatro horas',
      '-- R422: campos de autorização nunca vêm de raw_user_meta_data.\n-- Novas contas externas continuam suspensas e recebem somente quatro horas'
    );
  }
  return next;
}

function patchObservability(source) {
  let next = source.replace(/export const OBSERVABILITY_VERSION = '[^']+';/, "export const OBSERVABILITY_VERSION = '40.80-r422-security-observability-v1';");
  if (!next.includes('export type ObservabilityContextR422')) {
    next = next.replace(
      "export type ObservabilityLevel = 'info' | 'warning' | 'critical';",
      `export type ObservabilityLevel = 'info' | 'warning' | 'critical';\nexport type ObservabilityContextR422 = {\n  appVersion?: string;\n  buildId?: string;\n  stage?: string;\n  trainingPointsTotal?: number | null;\n  fallbackUsed?: boolean;\n  action?: string;\n  details?: Record<string, unknown>;\n};`
    );
  }
  if (!next.includes('context?: ObservabilityContextR422;')) {
    next = next.replace('  durationMs: number | null;\n};', '  durationMs: number | null;\n  context?: ObservabilityContextR422;\n};');
  }
  if (!next.includes('function redactObservabilityDetailsR422')) {
    const helper = `\nfunction redactObservabilityDetailsR422(value: unknown, depth = 0): unknown {\n  if (depth > 3) return '[depth-limit]';\n  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') return value;\n  if (typeof value === 'string') return text(value, 180);\n  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redactObservabilityDetailsR422(item, depth + 1));\n  if (typeof value !== 'object') return text(value, 180);\n  const blocked = /password|senha|token|authorization|cookie|secret|key|email|e-mail|username|user_name|image|ocr_text/i;\n  return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 30).map(([key, item]) => [key, blocked.test(key) ? '[redacted]' : redactObservabilityDetailsR422(item, depth + 1)]));\n}\n\nfunction normalizeObservabilityContextR422(context: ObservabilityContextR422 | undefined): ObservabilityContextR422 | undefined {\n  if (!context) return undefined;\n  return {\n    appVersion: context.appVersion ? text(context.appVersion, 40) : undefined,\n    buildId: context.buildId ? text(context.buildId, 80) : undefined,\n    stage: context.stage ? text(context.stage, 80) : undefined,\n    trainingPointsTotal: Number.isFinite(context.trainingPointsTotal) ? Number(context.trainingPointsTotal) : null,\n    fallbackUsed: typeof context.fallbackUsed === 'boolean' ? context.fallbackUsed : undefined,\n    action: context.action ? text(context.action, 80) : undefined,\n    details: context.details && typeof context.details === 'object' ? redactObservabilityDetailsR422(context.details) as Record<string, unknown> : undefined\n  };\n}\n`;
    next = next.replace('\nfunction emit(detail: unknown) {', `${helper}\nfunction emit(detail: unknown) {`);
  }
  if (!next.includes('context: normalizeObservabilityContextR422(input.context)')) {
    next = next.replace(
      '    durationMs: Number.isFinite(input.durationMs) ? Math.max(0, Math.round(Number(input.durationMs))) : null\n  };',
      '    durationMs: Number.isFinite(input.durationMs) ? Math.max(0, Math.round(Number(input.durationMs))) : null,\n    context: normalizeObservabilityContextR422(input.context)\n  };'
    );
  }
  next = next.replace(
    /export function createObservabilitySupportBundle\(input: \{ version: string; snapshot\?: ObservabilitySnapshot; health\?: unknown; integrity\?: unknown \}\): string \{/,
    'export function createObservabilitySupportBundle(input: { version: string; buildId?: string; snapshot?: ObservabilitySnapshot; health?: unknown; integrity?: unknown }): string {'
  );
  if (!next.includes('buildId: input.buildId')) {
    next = next.replace('    version: input.version,\n    generatedAt,', '    version: input.version,\n    buildId: input.buildId ? text(input.buildId, 80) : null,\n    generatedAt,');
  }
  return next;
}

export function applyR422SecurityObservabilityClosure(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  let changed = false;

  for (const [key, relative] of Object.entries(TARGETS)) {
    const { file, source } = read(root, relative);
    const next = key === 'account' ? patchAccount(source)
      : key === 'admin' ? patchAdmin(source)
      : key === 'migration' ? patchMigration(source)
      : patchObservability(source);
    changed = writeIfChanged(file, source, next, patched) || changed;
  }

  const verify = {
    account: fs.readFileSync(path.resolve(root, TARGETS.account), 'utf8'),
    admin: fs.readFileSync(path.resolve(root, TARGETS.admin), 'utf8'),
    migration: fs.readFileSync(path.resolve(root, TARGETS.migration), 'utf8'),
    obs: fs.readFileSync(path.resolve(root, TARGETS.observability), 'utf8'),
  };
  if (/restore_account_creation/.test(verify.account + verify.admin)) throw new Error('R422: bypass de MFA ainda está exposto.');
  if (/admin_mfa_required:\s*false/.test(verify.admin)) throw new Error('R422: fallback MFA ainda está fail-open.');
  for (const field of ['plan', 'expires_at', 'max_devices', 'offline_grace_hours']) {
    if (verify.migration.includes(`raw_user_meta_data->>'${field}'`)) throw new Error(`R422: ${field} ainda depende de user metadata.`);
  }
  for (const marker of ['40.80-r422-security-observability-v1', 'ObservabilityContextR422', 'redactObservabilityDetailsR422', 'buildId: input.buildId']) {
    if (!verify.obs.includes(marker)) throw new Error(`R422: observabilidade incompleta: ${marker}`);
  }

  return { changed, patched, mfaFailClosed: true, userMetadataPrivilegeRemoved: true, structuredRedactedDiagnostics: true };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR422SecurityObservabilityClosure(process.cwd());
  console.log(result.changed ? `R422 aplicada em ${result.patched.length} arquivo(s).` : 'R422: segurança/observabilidade já estavam convergidas.');
}
