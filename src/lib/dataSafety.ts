export const CURRENT_DATA_SCHEMA = 2736;
export const APP_DATA_VERSION = '27.39.0';

export type BackupSection = 'history' | 'settings' | 'calibration' | 'plans' | 'folders' | 'rules' | 'session' | 'evolution' | 'tacticalStudio' | 'customFormations' | 'imageGallery';

export type BackupEnvelope = {
  app: 'BuildMaster Elite Tático';
  version: string;
  schema: number;
  exportedAt: string;
  checksum: string;
  sections: Partial<Record<BackupSection, unknown>>;
};

export type IntegrityIssue = {
  level: 'critical' | 'warning' | 'info';
  code: string;
  message: string;
  section?: BackupSection;
};

export type IntegrityReport = {
  score: number;
  status: 'healthy' | 'attention' | 'critical';
  issues: IntegrityIssue[];
  totals: { sections: number; records: number; malformed: number };
};

const BACKUP_SECTIONS = new Set<BackupSection>(['history', 'settings', 'calibration', 'plans', 'folders', 'rules', 'session', 'evolution', 'tacticalStudio', 'customFormations', 'imageGallery']);
const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const MAX_BACKUP_DEPTH = 18;
const MAX_BACKUP_NODES = 250_000;
const MAX_ARRAY_ITEMS = 20_000;
const MAX_OBJECT_KEYS = 20_000;
const MAX_STRING_LENGTH = 32 * 1024 * 1024;

type SanitizeBudget = { nodes: number };

function sanitizeBackupValue(value: unknown, depth = 0, budget: SanitizeBudget = { nodes: 0 }): unknown {
  budget.nodes += 1;
  if (budget.nodes > MAX_BACKUP_NODES) throw new Error('O backup contém dados demais para ser restaurado com segurança.');
  if (depth > MAX_BACKUP_DEPTH) throw new Error('O backup possui uma estrutura profunda demais.');
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LENGTH) throw new Error('O backup contém um campo de texto ou imagem acima do limite seguro.');
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) throw new Error('O backup contém uma lista acima do limite seguro.');
    return value.map((item) => sanitizeBackupValue(item, depth + 1, budget));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > MAX_OBJECT_KEYS) throw new Error('O backup contém um objeto acima do limite seguro.');
    const clean: Record<string, unknown> = {};
    for (const [key, item] of entries) {
      if (FORBIDDEN_OBJECT_KEYS.has(key)) continue;
      clean[key] = sanitizeBackupValue(item, depth + 1, budget);
    }
    return clean;
  }
  return null;
}

function sanitizeSections(value: unknown): BackupEnvelope['sections'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('As seções do backup são inválidas.');
  const clean: BackupEnvelope['sections'] = {};
  const budget: SanitizeBudget = { nodes: 0 };
  for (const [key, section] of Object.entries(value as Record<string, unknown>)) {
    if (!BACKUP_SECTIONS.has(key as BackupSection)) continue;
    clean[key as BackupSection] = sanitizeBackupValue(section, 1, budget);
  }
  return clean;
}

function stableStringify(value: unknown, seen = new WeakSet<object>()): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (seen.has(value)) throw new Error('Não é possível gerar integridade para dados circulares.');
  seen.add(value);
  try {
    if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item, seen)).join(',')}]`;
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key], seen)}`).join(',')}}`;
  } finally {
    seen.delete(value);
  }
}

export function checksumFor(value: unknown): string {
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function createBackupEnvelope(sections: BackupEnvelope['sections'], exportedAt = new Date().toISOString()): BackupEnvelope {
  const safeSections = sanitizeSections(sections);
  const safeDate = Number.isNaN(Date.parse(exportedAt)) ? new Date().toISOString() : exportedAt;
  const core = { app: 'BuildMaster Elite Tático' as const, version: APP_DATA_VERSION, schema: CURRENT_DATA_SCHEMA, exportedAt: safeDate, sections: safeSections };
  return { ...core, checksum: checksumFor(core) };
}

export function validateBackupEnvelope(input: unknown): { valid: boolean; migrated: BackupEnvelope | null; issues: IntegrityIssue[] } {
  const issues: IntegrityIssue[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, migrated: null, issues: [{ level: 'critical', code: 'invalid-root', message: 'O arquivo não contém um backup válido.' }] };
  }
  const raw = input as Partial<BackupEnvelope> & { items?: unknown[] };
  try {
    if (Array.isArray(raw.items) && !raw.sections) {
      const migrated = createBackupEnvelope({ history: raw.items });
      issues.push({ level: 'info', code: 'legacy-history', message: 'Backup antigo do Cofre convertido para o formato atual.', section: 'history' });
      return { valid: true, migrated, issues };
    }
    if (raw.app !== 'BuildMaster Elite Tático' || !raw.sections || typeof raw.sections !== 'object' || Array.isArray(raw.sections)) {
      return { valid: false, migrated: null, issues: [{ level: 'critical', code: 'wrong-app', message: 'O arquivo não foi reconhecido como backup do BuildMaster.' }] };
    }
    const schema = Number(raw.schema || 0);
    if (!Number.isSafeInteger(schema) || schema < 0) {
      return { valid: false, migrated: null, issues: [{ level: 'critical', code: 'invalid-schema', message: 'O esquema do backup é inválido.' }] };
    }
    if (schema > CURRENT_DATA_SCHEMA) issues.push({ level: 'warning', code: 'future-schema', message: 'O backup foi criado por uma versão mais nova do app.' });
    const exportedAt = String(raw.exportedAt || '');
    if (!exportedAt || Number.isNaN(Date.parse(exportedAt))) issues.push({ level: 'warning', code: 'invalid-date', message: 'A data do backup não pôde ser confirmada.' });
    const safeSections = sanitizeSections(raw.sections);
    const core = { app: raw.app, version: String(raw.version || 'desconhecida'), schema, exportedAt, sections: safeSections };
    const expected = checksumFor(core);
    if (!raw.checksum || raw.checksum !== expected) {
      issues.push({ level: 'critical', code: 'checksum', message: 'O código de integridade do backup não confere. O arquivo pode ter sido alterado ou corrompido.' });
    }
    const migrated = createBackupEnvelope(safeSections, exportedAt || new Date().toISOString());
    return { valid: !issues.some((issue) => issue.level === 'critical'), migrated, issues };
  } catch (cause) {
    return {
      valid: false,
      migrated: null,
      issues: [{ level: 'critical', code: 'unsafe-payload', message: cause instanceof Error ? cause.message : 'O backup ultrapassa os limites seguros.' }]
    };
  }
}

function countRecords(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length;
  return value == null ? 0 : 1;
}

export function inspectDataIntegrity(sections: BackupEnvelope['sections']): IntegrityReport {
  const issues: IntegrityIssue[] = [];
  let malformed = 0;
  const history = sections.history;
  if (!Array.isArray(history)) {
    issues.push({ level: 'critical', code: 'history-shape', message: 'O Cofre não está em formato de lista.', section: 'history' });
    malformed += 1;
  } else {
    const ids = new Set<string>();
    history.forEach((item, index) => {
      if (!item || typeof item !== 'object') { malformed += 1; issues.push({ level: 'warning', code: 'history-item', message: `Ficha ${index + 1} está malformada.`, section: 'history' }); return; }
      const row = item as Record<string, unknown>;
      const id = String(row.id || row.saveKey || '');
      if (!id) { malformed += 1; issues.push({ level: 'warning', code: 'missing-id', message: `Ficha ${index + 1} está sem identificador.`, section: 'history' }); }
      else if (ids.has(id)) issues.push({ level: 'warning', code: 'duplicate-id', message: `Identificador duplicado no Cofre: ${id}.`, section: 'history' });
      ids.add(id);
      if (!row.result || typeof row.result !== 'object') { malformed += 1; issues.push({ level: 'critical', code: 'missing-result', message: `Ficha ${index + 1} está sem resultado técnico.`, section: 'history' }); }
    });
  }
  if (!sections.settings) issues.push({ level: 'info', code: 'settings-missing', message: 'Preferências visuais não foram incluídas.', section: 'settings' });
  if (!sections.calibration) issues.push({ level: 'info', code: 'calibration-missing', message: 'Não há calibração pós-partida no backup.', section: 'calibration' });
  const critical = issues.filter((issue) => issue.level === 'critical').length;
  const warnings = issues.filter((issue) => issue.level === 'warning').length;
  const score = Math.max(0, 100 - critical * 30 - warnings * 8 - malformed * 3);
  return {
    score,
    status: critical ? 'critical' : warnings || score < 90 ? 'attention' : 'healthy',
    issues,
    totals: {
      sections: Object.values(sections).filter((value) => value !== undefined).length,
      records: Object.values(sections).reduce<number>((total, value) => total + countRecords(value), 0),
      malformed
    }
  };
}

export function migrateBackup(envelope: BackupEnvelope): { envelope: BackupEnvelope; steps: string[] } {
  const steps: string[] = [];
  const sections = { ...envelope.sections };
  if (!sections.folders) { sections.folders = []; steps.push('Pastas personalizadas inicializadas.'); }
  if (!sections.settings) { sections.settings = {}; steps.push('Preferências visuais inicializadas.'); }
  if (!sections.plans) { sections.plans = {}; steps.push('Área de Planos A, B e C inicializada.'); }
  if (!sections.evolution) { sections.evolution = {}; steps.push('Registro de cartas e validação real inicializados.'); }
  if (!sections.tacticalStudio) { sections.tacticalStudio = []; steps.push('Biblioteca do Estúdio Tático inicializada.'); }
  if (!sections.customFormations) { sections.customFormations = []; steps.push('Formações personalizadas inicializadas.'); }
  if (!sections.imageGallery) { sections.imageGallery = []; steps.push('Galeria de imagens inicializada.'); }
  if (sections.evolution && typeof sections.evolution === 'object') {
    const evolution = { ...(sections.evolution as Record<string, unknown>) };
    if (!evolution.centralIntelligence) {
      evolution.centralIntelligence = { schemaVersion: 29, migratedAt: envelope.exportedAt, preservedKeys: [], note: 'Migração não destrutiva da Central Inteligente.' };
      steps.push('Central Inteligente vinculada aos dados existentes sem apagar o Cofre.');
    }
    if (!evolution.centralEntityIndex) {
      evolution.centralEntityIndex = null;
      steps.push('Índice unificado preparado para relacionar cartas, fichas, formações e partidas.');
    }
    sections.evolution = evolution;
  }
  if (envelope.schema < CURRENT_DATA_SCHEMA) steps.push(`Dados migrados do esquema ${envelope.schema || 'legado'} para ${CURRENT_DATA_SCHEMA}.`);
  return { envelope: createBackupEnvelope(sections, envelope.exportedAt), steps };
}

export function buildHealthSummary(input: {
  integrity: IntegrityReport;
  backupAgeDays?: number | null;
  pendingReviews: number;
  lowConfidence: number;
  totalHistory: number;
  testsKnown?: number;
}) {
  const alerts: string[] = [];
  if (input.integrity.status !== 'healthy') alerts.push('A integridade dos dados precisa de atenção.');
  if (input.backupAgeDays == null) alerts.push('Nenhum backup completo foi registrado neste aparelho.');
  else if (input.backupAgeDays > 14) alerts.push(`O último backup completo tem ${input.backupAgeDays} dias.`);
  if (input.pendingReviews > 0) alerts.push(`${input.pendingReviews} ficha(s) precisam de revisão.`);
  if (input.lowConfidence > 0) alerts.push(`${input.lowConfidence} ficha(s) têm confiança baixa.`);
  const score = Math.max(0, Math.round((input.integrity.score * 0.55) + (input.backupAgeDays == null ? 0 : input.backupAgeDays <= 7 ? 25 : input.backupAgeDays <= 14 ? 18 : 8) + (input.pendingReviews === 0 ? 10 : Math.max(0, 10 - input.pendingReviews)) + (input.lowConfidence === 0 ? 10 : Math.max(0, 10 - input.lowConfidence))));
  return { score: Math.min(100, score), status: score >= 90 ? 'Excelente' : score >= 75 ? 'Boa' : score >= 55 ? 'Atenção' : 'Crítica', alerts, totalHistory: input.totalHistory };
}
