export const CURRENT_DATA_SCHEMA = 2700;
export const APP_DATA_VERSION = '27.0.0';

export type BackupSection = 'history' | 'settings' | 'calibration' | 'plans' | 'folders' | 'rules' | 'session' | 'evolution';

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

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
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
  const core = { app: 'BuildMaster Elite Tático' as const, version: APP_DATA_VERSION, schema: CURRENT_DATA_SCHEMA, exportedAt, sections };
  return { ...core, checksum: checksumFor(core) };
}

export function validateBackupEnvelope(input: unknown): { valid: boolean; migrated: BackupEnvelope | null; issues: IntegrityIssue[] } {
  const issues: IntegrityIssue[] = [];
  if (!input || typeof input !== 'object') return { valid: false, migrated: null, issues: [{ level: 'critical', code: 'invalid-root', message: 'O arquivo não contém um backup válido.' }] };
  const raw = input as Partial<BackupEnvelope> & { items?: unknown[] };
  if (Array.isArray(raw.items) && !raw.sections) {
    const migrated = createBackupEnvelope({ history: raw.items });
    issues.push({ level: 'info', code: 'legacy-history', message: 'Backup antigo do Cofre convertido para o formato atual.', section: 'history' });
    return { valid: true, migrated, issues };
  }
  if (raw.app !== 'BuildMaster Elite Tático' || !raw.sections || typeof raw.sections !== 'object') {
    return { valid: false, migrated: null, issues: [{ level: 'critical', code: 'wrong-app', message: 'O arquivo não foi reconhecido como backup do BuildMaster.' }] };
  }
  const schema = Number(raw.schema || 0);
  if (schema > CURRENT_DATA_SCHEMA) issues.push({ level: 'warning', code: 'future-schema', message: 'O backup foi criado por uma versão mais nova do app.' });
  const core = { app: raw.app, version: String(raw.version || 'desconhecida'), schema, exportedAt: String(raw.exportedAt || ''), sections: raw.sections };
  const expected = checksumFor(core);
  if (raw.checksum && raw.checksum !== expected) issues.push({ level: 'critical', code: 'checksum', message: 'A assinatura do backup não confere. O arquivo pode ter sido alterado ou corrompido.' });
  const migrated = createBackupEnvelope(raw.sections as BackupEnvelope['sections'], core.exportedAt || new Date().toISOString());
  return { valid: !issues.some((issue) => issue.level === 'critical'), migrated, issues };
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
  if (sections.evolution && typeof sections.evolution === 'object') {
    const evolution = { ...(sections.evolution as Record<string, unknown>) };
    if (!evolution.centralIntelligence) {
      evolution.centralIntelligence = { schemaVersion: 27, migratedAt: envelope.exportedAt, preservedKeys: [], note: 'Migração não destrutiva da Central Inteligente.' };
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
