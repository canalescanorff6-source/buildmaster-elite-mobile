import type { IntegratedPlayerRecord } from '@/modules/core/centralIntelligence';
import type { PerformanceSample } from './appRefinement';
import { safeStorageEntries } from './safeLocalStorage';

export type LocalStorageEstimate = {
  entries: number;
  bytes: number;
  formatted: string;
};

export function estimateLocalStorageUsage(): LocalStorageEstimate {
  const storedEntries = safeStorageEntries();
  let bytes = 0;
  for (const [key, value] of storedEntries) bytes += new Blob([key, value]).size;
  const entries = storedEntries.length;
  const formatted = bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.max(0.1, bytes / 1024).toFixed(1)} KB`;
  return { entries, bytes, formatted };
}

export function buildMonthlyEvolutionReport(players: IntegratedPlayerRecord[], performance: PerformanceSample[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const updated = players.filter((player) => Date.parse(player.updatedAt) >= monthStart.getTime());
  const validated = updated.filter((player) => player.matchCount > 0);
  const averageEfficiency = updated.length ? Math.round(updated.reduce((sum, player) => sum + player.efficiency, 0) / updated.length) : 0;
  const averageConfidence = updated.length ? Math.round(updated.reduce((sum, player) => sum + player.confidence, 0) / updated.length) : 0;
  const slowOperations = performance.filter((sample) => sample.milliseconds >= 2000).slice(0, 10);
  return {
    month: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    playersUpdated: updated.length,
    playersValidated: validated.length,
    averageEfficiency,
    averageConfidence,
    slowOperations,
    generatedAt: now.toISOString()
  };
}

export function monthlyEvolutionReportText(players: IntegratedPlayerRecord[], performance: PerformanceSample[]) {
  const report = buildMonthlyEvolutionReport(players, performance);
  const lines = [
    `BuildMaster — Relatório mensal de ${report.month}`,
    `Gerado em: ${new Date(report.generatedAt).toLocaleString('pt-BR')}`,
    '',
    `Jogadores atualizados: ${report.playersUpdated}`,
    `Jogadores validados em partida: ${report.playersValidated}`,
    `Eficiência média: ${report.averageEfficiency}/100`,
    `Confiança média: ${report.averageConfidence}%`,
    '',
    'Operações lentas registradas localmente:',
    ...(report.slowOperations.length ? report.slowOperations.map((sample) => `- ${sample.name}: ${sample.milliseconds} ms${sample.detail ? ` — ${sample.detail}` : ''}`) : ['- Nenhuma operação acima de 2 segundos.'])
  ];
  return lines.join('\n');
}

export type LegacyImportInspection = {
  valid: boolean;
  kind: 'backup' | 'tactical-project' | 'unknown';
  version: string | null;
  itemCount: number;
  warnings: string[];
};

export function inspectLegacyProject(input: unknown): LegacyImportInspection {
  if (!input || typeof input !== 'object') return { valid: false, kind: 'unknown', version: null, itemCount: 0, warnings: ['O arquivo não contém um objeto JSON válido.'] };
  const record = input as Record<string, unknown>;
  const warnings: string[] = [];
  if (record.sections && typeof record.sections === 'object') {
    const sections = record.sections as Record<string, unknown>;
    const history = Array.isArray(sections.history) ? sections.history : [];
    if (!history.length) warnings.push('O backup não contém fichas, mas outros módulos ainda podem ser restaurados.');
    return { valid: true, kind: 'backup', version: typeof record.dataVersion === 'string' ? record.dataVersion : null, itemCount: history.length, warnings };
  }
  if (record.project || record.formation || record.players) {
    const players = Array.isArray(record.players) ? record.players.length : 0;
    return { valid: true, kind: 'tactical-project', version: typeof record.version === 'string' ? record.version : null, itemCount: players, warnings };
  }
  return { valid: false, kind: 'unknown', version: null, itemCount: 0, warnings: ['Formato não reconhecido. Nenhum dado será alterado.'] };
}
