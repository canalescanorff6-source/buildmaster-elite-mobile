'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AlertTriangle, CheckCircle2, Download, Gauge, HardDrive, RefreshCw, ShieldCheck, Smartphone, XCircle } from 'lucide-react';
import { canWriteLocalStorage } from '@/lib/safeLocalStorage';
import { readLongTaskSamples, readRuntimeQualityIssues } from '@/lib/appQualityV2840';
import { readUpdateChannelPreference } from '@/modules/updates/updateGovernance';
import {
  buildProductionReadinessReport,
  formatProductionReadinessReport,
  type ProductionReadinessReport,
  type ProductionReadinessSignals
} from '@/lib/productionReadiness';

function collectSignals(appVersion: string, dataIntegrityScore: number): ProductionReadinessSignals {
  const browser = typeof window !== 'undefined';
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  return {
    appVersion,
    expectedVersion: '29.20.0',
    secureContext: browser ? window.isSecureContext || Capacitor.isNativePlatform() : true,
    storageWritable: browser ? canWriteLocalStorage() : true,
    indexedDbAvailable: browser ? typeof indexedDB !== 'undefined' : true,
    cryptoAvailable: typeof crypto !== 'undefined' && Boolean(crypto.subtle),
    serviceWorkerAvailable: Boolean(nav && 'serviceWorker' in nav),
    nativeRuntime: Capacitor.isNativePlatform(),
    online: nav?.onLine !== false,
    dataIntegrityScore,
    runtimeIssueCount: readRuntimeQualityIssues().length,
    longTaskCount: readLongTaskSamples().length,
    viewportWidth: browser ? window.innerWidth : 1280,
    viewportHeight: browser ? window.innerHeight : 720,
    updateChannel: readUpdateChannelPreference()
  };
}

export function ProductionReadinessCenter({ appVersion, dataIntegrityScore }: { appVersion: string; dataIntegrityScore: number }) {
  const [report, setReport] = useState<ProductionReadinessReport>(() => buildProductionReadinessReport(collectSignals(appVersion, dataIntegrityScore)));
  const refresh = useCallback(() => setReport(buildProductionReadinessReport(collectSignals(appVersion, dataIntegrityScore))), [appVersion, dataIntegrityScore]);

  useEffect(() => {
    refresh();
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    window.addEventListener('resize', refresh);
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      window.removeEventListener('resize', refresh);
    };
  }, [refresh]);

  const passed = useMemo(() => report.checks.filter((check) => check.passed).length, [report]);
  const statusLabel = report.state === 'pass' ? 'Pronto' : report.state === 'attention' ? 'Revisar' : 'Bloqueado';

  function exportReport() {
    const url = URL.createObjectURL(new Blob([formatProductionReadinessReport(report)], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `buildmaster-prontidao-producao-v${appVersion}-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="bm2920-production-center luxury-panel" aria-labelledby="bm2920-production-title">
    <header className="bm2920-production-heading">
      <div><p className="kicker"><ShieldCheck size={15} /> Blocos 14 e 15</p><h3 id="bm2920-production-title">Testes, estabilidade e prontidão de produção</h3><span>Confere o ambiente local. A aprovação definitiva exige APK assinado instalado e atualização real em Android.</span></div>
      <strong className={`state-${report.state}`}>{report.score}/100 • {statusLabel}</strong>
    </header>

    <div className="bm2920-production-metrics">
      <article><CheckCircle2 size={20} /><div><span>Verificações aprovadas</span><strong>{passed}/{report.checks.length}</strong><small>contratos locais da execução atual</small></div></article>
      <article><XCircle size={20} /><div><span>Bloqueios</span><strong>{report.blockers.length}</strong><small>impedem considerar o aparelho pronto</small></div></article>
      <article><AlertTriangle size={20} /><div><span>Avisos</span><strong>{report.attention.length}</strong><small>exigem revisão antes do rollout total</small></div></article>
      <article><Gauge size={20} /><div><span>Motor</span><strong>v{report.version}</strong><small>prontidão final de produção</small></div></article>
    </div>

    <div className="bm2920-production-checks">
      {report.checks.map((check) => <article key={check.id} className={check.passed ? 'is-pass' : check.severity === 'critical' ? 'is-blocked' : 'is-warning'}>
        <span className="bm2920-check-icon">{check.area === 'dados' ? <HardDrive size={18} /> : check.area === 'dispositivo' ? <Smartphone size={18} /> : check.passed ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}</span>
        <div><small>{check.area}</small><strong>{check.label}</strong><span>{check.detail}</span></div>
      </article>)}
    </div>

    <div className={`bm2920-release-recommendation state-${report.state}`} role="status"><strong>{statusLabel}</strong><span>{report.releaseRecommendation}</span></div>
    <div className="bm2920-production-actions">
      <button type="button" onClick={refresh}><RefreshCw size={16} /> Executar novamente</button>
      <button type="button" onClick={exportReport}><Download size={16} /> Exportar prontidão</button>
    </div>
  </section>;
}
