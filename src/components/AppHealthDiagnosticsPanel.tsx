'use client';

import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Download, RefreshCw, ShieldCheck, TriangleAlert, XCircle } from 'lucide-react';
import { exportHealthSnapshot, inspectAppHealth, type AppHealthSnapshot } from '@/lib/appExperienceV2740';

function downloadText(content: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AppHealthDiagnosticsPanel({ appVersion }: { appVersion: string }) {
  const [snapshot, setSnapshot] = useState<AppHealthSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try { setSnapshot(await inspectAppHealth()); } finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, []);

  return <div className="app-health-diagnostics">
    <header><div><ShieldCheck size={26}/><span><strong>Diagnóstico local</strong><small>Confere recursos essenciais sem enviar seus dados para fora do aparelho.</small></span></div><div className="diagnostic-actions"><button type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''}/> Verificar novamente</button>{snapshot && <button type="button" onClick={() => downloadText(exportHealthSnapshot(snapshot, appVersion), `buildmaster-diagnostico-${new Date().toISOString().slice(0, 10)}.txt`)}><Download size={16}/> Exportar</button>}</div></header>

    {snapshot ? <>
      <div className={`diagnostic-score score-${snapshot.overall >= 85 ? 'good' : snapshot.overall >= 65 ? 'attention' : 'critical'}`}><Activity size={28}/><strong>{snapshot.overall}</strong><span>/100</span><small>{snapshot.overall >= 85 ? 'Ambiente saudável' : snapshot.overall >= 65 ? 'Requer atenção' : 'Há recursos indisponíveis'}</small></div>
      <div className="diagnostic-checks">{snapshot.checks.map((check) => <article key={check.id} className={`status-${check.status}`}><span>{check.status === 'ok' ? <CheckCircle2 size={21}/> : check.status === 'attention' ? <TriangleAlert size={21}/> : <XCircle size={21}/>}</span><div><strong>{check.title}</strong><p>{check.detail}</p></div><em>{check.status === 'ok' ? 'OK' : check.status === 'attention' ? 'Atenção' : 'Indisponível'}</em></article>)}</div>
      <p className="diagnostic-privacy">Este diagnóstico não inclui senha, token, conteúdo das fichas ou imagens.</p>
    </> : <div className="diagnostic-loading"><RefreshCw size={28} className="spin"/><span>Verificando recursos do aparelho…</span></div>}
  </div>;
}
