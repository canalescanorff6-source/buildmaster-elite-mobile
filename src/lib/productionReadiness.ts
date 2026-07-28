export const PRODUCTION_READINESS_VERSION = '31.77.0';

export type ReadinessSeverity = 'critical' | 'warning' | 'info';
export type ReadinessState = 'pass' | 'attention' | 'blocked';

export type ProductionReadinessSignals = {
  appVersion: string;
  expectedVersion: string;
  secureContext: boolean;
  storageWritable: boolean;
  indexedDbAvailable: boolean;
  cryptoAvailable: boolean;
  serviceWorkerAvailable: boolean;
  nativeRuntime: boolean;
  online: boolean;
  dataIntegrityScore: number;
  runtimeIssueCount: number;
  longTaskCount: number;
  viewportWidth: number;
  viewportHeight: number;
  updateChannel: 'stable' | 'beta';
};

export type ProductionReadinessCheck = {
  id: string;
  area: 'versão' | 'dados' | 'segurança' | 'desempenho' | 'dispositivo' | 'atualização';
  label: string;
  detail: string;
  severity: ReadinessSeverity;
  passed: boolean;
  weight: number;
};

export type ProductionReadinessReport = {
  version: string;
  generatedAt: string;
  score: number;
  state: ReadinessState;
  blockers: ProductionReadinessCheck[];
  attention: ProductionReadinessCheck[];
  checks: ProductionReadinessCheck[];
  releaseRecommendation: string;
};

function clamp(value: number, minimum = 0, maximum = 100): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}

export function buildProductionReadinessReport(signals: ProductionReadinessSignals, now = new Date()): ProductionReadinessReport {
  const checks: ProductionReadinessCheck[] = [
    {
      id: 'version', area: 'versão', label: 'Versão de produção consistente',
      detail: signals.appVersion === signals.expectedVersion ? `v${signals.appVersion} confirmada.` : `Aplicativo v${signals.appVersion}; esperado v${signals.expectedVersion}.`,
      severity: 'critical', passed: signals.appVersion === signals.expectedVersion, weight: 18
    },
    {
      id: 'secure-context', area: 'segurança', label: 'Contexto seguro',
      detail: signals.secureContext ? 'HTTPS/ambiente Android protegido disponível.' : 'O aplicativo não está em contexto seguro.',
      severity: 'critical', passed: signals.secureContext, weight: 14
    },
    {
      id: 'crypto', area: 'segurança', label: 'Criptografia disponível',
      detail: signals.cryptoAvailable ? 'Web Crypto disponível para backup e integridade.' : 'Web Crypto indisponível.',
      severity: 'critical', passed: signals.cryptoAvailable, weight: 13
    },
    {
      id: 'storage', area: 'dados', label: 'Armazenamento local gravável',
      detail: signals.storageWritable ? 'Leitura e escrita local confirmadas.' : 'O aparelho bloqueou a gravação local.',
      severity: 'critical', passed: signals.storageWritable, weight: 13
    },
    {
      id: 'indexeddb', area: 'dados', label: 'Banco local disponível',
      detail: signals.indexedDbAvailable ? 'IndexedDB disponível para histórico e versões.' : 'IndexedDB indisponível.',
      severity: 'critical', passed: signals.indexedDbAvailable, weight: 11
    },
    {
      id: 'integrity', area: 'dados', label: 'Integridade dos dados',
      detail: `Pontuação local ${Math.round(clamp(signals.dataIntegrityScore))}/100.`,
      severity: signals.dataIntegrityScore < 70 ? 'critical' : 'warning', passed: signals.dataIntegrityScore >= 85, weight: 10
    },
    {
      id: 'runtime', area: 'desempenho', label: 'Falhas recentes controladas',
      detail: `${Math.max(0, signals.runtimeIssueCount)} falha(s) local(is) recente(s).`,
      severity: signals.runtimeIssueCount >= 5 ? 'critical' : 'warning', passed: signals.runtimeIssueCount === 0, weight: 7
    },
    {
      id: 'long-tasks', area: 'desempenho', label: 'Resposta da interface',
      detail: `${Math.max(0, signals.longTaskCount)} tarefa(s) longa(s) registrada(s).`,
      severity: 'warning', passed: signals.longTaskCount <= 2, weight: 5
    },
    {
      id: 'viewport', area: 'dispositivo', label: 'Tela compatível',
      detail: `${Math.round(signals.viewportWidth)} × ${Math.round(signals.viewportHeight)} px.`,
      severity: 'warning', passed: signals.viewportWidth >= 320 && signals.viewportHeight >= 500, weight: 4
    },
    {
      id: 'service-worker', area: 'dispositivo', label: 'Suporte offline',
      detail: signals.serviceWorkerAvailable ? 'Service Worker suportado.' : 'Sem suporte ao cache offline do navegador.',
      severity: 'info', passed: signals.serviceWorkerAvailable || signals.nativeRuntime, weight: 2
    },
    {
      id: 'network', area: 'atualização', label: 'Canal de atualização acessível',
      detail: signals.online ? `Online no canal ${signals.updateChannel}.` : 'Aparelho offline; atualização será verificada depois.',
      severity: 'info', passed: signals.online, weight: 1
    },
    {
      id: 'channel', area: 'atualização', label: 'Canal de produção',
      detail: signals.updateChannel === 'stable' ? 'Canal estável selecionado.' : 'Canal beta selecionado neste aparelho.',
      severity: 'warning', passed: signals.updateChannel === 'stable', weight: 2
    }
  ];

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const passedWeight = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
  const score = Math.round((passedWeight / totalWeight) * 100);
  const blockers = checks.filter((check) => !check.passed && check.severity === 'critical');
  const attention = checks.filter((check) => !check.passed && check.severity !== 'critical');
  const state: ReadinessState = blockers.length ? 'blocked' : attention.length || score < 92 ? 'attention' : 'pass';
  const releaseRecommendation = blockers.length
    ? `Não publicar neste aparelho: corrija ${blockers.length} bloqueio(s) crítico(s).`
    : state === 'attention'
      ? 'Produção permitida com revisão dos avisos e teste real do APK assinado.'
      : 'Ambiente local pronto; confirme assinatura, instalação e atualização real antes da liberação total.';

  return {
    version: PRODUCTION_READINESS_VERSION,
    generatedAt: now.toISOString(),
    score,
    state,
    blockers,
    attention,
    checks,
    releaseRecommendation
  };
}

export function formatProductionReadinessReport(report: ProductionReadinessReport): string {
  const lines = [
    'BUILDMASTER — PRONTIDÃO DE PRODUÇÃO',
    `Motor: ${report.version}`,
    `Gerado em: ${new Date(report.generatedAt).toLocaleString('pt-BR')}`,
    `Pontuação: ${report.score}/100`,
    `Estado: ${report.state === 'pass' ? 'APROVADO' : report.state === 'attention' ? 'ATENÇÃO' : 'BLOQUEADO'}`,
    `Recomendação: ${report.releaseRecommendation}`,
    '',
    'VERIFICAÇÕES'
  ];
  for (const check of report.checks) lines.push(`${check.passed ? 'OK' : check.severity === 'critical' ? 'BLOQUEIO' : 'AVISO'} • ${check.area} • ${check.label} • ${check.detail}`);
  lines.push('', 'Este diagnóstico local não substitui a instalação do APK assinado e o teste de atualização em Android real.');
  return lines.join('\n');
}
