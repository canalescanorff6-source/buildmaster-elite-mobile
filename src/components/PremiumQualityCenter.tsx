'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { Activity, CheckCircle2, Download, Gauge, MonitorCog, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import {
  clearLongTaskSamples,
  clearRuntimeQualityIssues,
  createQualityReport,
  detectDeviceQualityProfile,
  qualityScore,
  readLongTaskSamples,
  readQualityPreference,
  readRuntimeQualityIssues,
  saveQualityPreference,
  type InterfaceAuditSummary,
  type QualityMode,
  type QualityPreference
} from '@/lib/appQualityV2840';

function accessibleName(element: HTMLElement): string {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) return labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
  return (element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || '').trim();
}

function auditVisibleInterface(): InterfaceAuditSummary {
  const visible = (element: HTMLElement) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const buttons = [...document.querySelectorAll<HTMLElement>('button, a[href], [role="button"]')].filter(visible);
  const fields = [...document.querySelectorAll<HTMLElement>('input:not([type="hidden"]), select, textarea')].filter(visible);
  const buttonsWithoutName = buttons.filter((element) => !accessibleName(element)).length;
  const fieldsWithoutName = fields.filter((element) => {
    if (accessibleName(element)) return false;
    if (element.id && [...document.querySelectorAll<HTMLLabelElement>('label[for]')].some((label) => label.htmlFor === element.id)) return false;
    return !element.closest('label');
  }).length;
  const ids = [...document.querySelectorAll<HTMLElement>('[id]')].map((element) => element.id).filter(Boolean);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index).filter((id, index, all) => all.indexOf(id) === index).length;
  const smallTouchTargets = buttons.filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width < 40 || rect.height < 40;
  }).length;
  return { checkedAt: new Date().toISOString(), buttonsWithoutName, fieldsWithoutName, duplicateIds, smallTouchTargets, totalInteractive: buttons.length + fields.length };
}

export function PremiumQualityCenter({ appVersion }: { appVersion: string }) {
  const [preference, setPreference] = useState<QualityPreference>(() => readQualityPreference());
  const [issues, setIssues] = useState(() => readRuntimeQualityIssues());
  const [longTasks, setLongTasks] = useState(() => readLongTaskSamples());
  const [audit, setAudit] = useState<InterfaceAuditSummary | null>(null);
  const profile = useMemo(() => detectDeviceQualityProfile(preference), [preference]);
  const score = qualityScore({ issues: issues.length, longTasks: longTasks.length, audit });

  function updatePreference(next: QualityPreference) {
    const saved = saveQualityPreference(next);
    setPreference(saved);
    window.dispatchEvent(new CustomEvent('buildmaster:quality-preference', { detail: saved }));
  }

  function selectMode(mode: QualityMode) {
    updatePreference({ ...preference, mode });
  }

  function clearDiagnostics() {
    clearRuntimeQualityIssues();
    clearLongTaskSamples();
    setIssues([]);
    setLongTasks([]);
  }

  function exportReport() {
    const text = createQualityReport({ appVersion, profile, preference, issues, longTasks, audit });
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `buildmaster-qualidade-${appVersion}-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="bm2840-quality-center luxury-panel" aria-labelledby="bm2840-quality-title">
    <header className="bm2840-quality-heading">
      <div><p className="kicker"><ShieldCheck size={15} /> Qualidade final</p><h3 id="bm2840-quality-title">Consistência, acessibilidade e desempenho</h3><span>Auditoria executada localmente. Nenhuma senha, imagem ou ficha é enviada.</span></div>
      <strong className={score >= 85 ? 'is-good' : score >= 65 ? 'is-warning' : 'is-danger'}>{score}/100</strong>
    </header>

    <div className="bm2840-quality-metrics">
      <article><MonitorCog size={19}/><div><span>Perfil aplicado</span><strong>{profile.resolvedMode === 'maximum' ? 'Máximo' : 'Econômico'}</strong><small>{profile.reasons[0]}</small></div></article>
      <article><Activity size={19}/><div><span>Falhas recentes</span><strong>{issues.length}</strong><small>registro local sanitizado</small></div></article>
      <article><Gauge size={19}/><div><span>Tarefas longas</span><strong>{longTasks.length}</strong><small>acima de 50 ms</small></div></article>
      <article><CheckCircle2 size={19}/><div><span>Interface auditada</span><strong>{audit ? audit.totalInteractive : '—'}</strong><small>{audit ? 'elementos visíveis' : 'execute a verificação'}</small></div></article>
    </div>

    <div className="bm2840-quality-grid">
      <section>
        <h4>Perfil visual e de desempenho</h4>
        <div className="bm2840-quality-mode" role="group" aria-label="Perfil de qualidade">
          {([['automatic', 'Automático', 'Adapta efeitos ao aparelho.'], ['maximum', 'Máximo', 'Visual completo e animações premium.'], ['economy', 'Econômico', 'Menos brilho, blur e movimento.']] as Array<[QualityMode, string, string]>).map(([mode, label, hint]) => <button type="button" key={mode} className={preference.mode === mode ? 'active' : ''} onClick={() => selectMode(mode)}><strong>{label}</strong><span>{hint}</span></button>)}
        </div>
        <label className="bm2840-quality-toggle"><input type="checkbox" checked={preference.restoreFocus} onChange={(event: ChangeEvent<HTMLInputElement>) => updatePreference({ ...preference, restoreFocus: event.target.checked })}/><span><strong>Restaurar foco ao trocar de tela</strong><small>Ajuda teclado, TalkBack e navegação por acessibilidade.</small></span></label>
        <label className="bm2840-quality-toggle"><input type="checkbox" checked={preference.captureRuntimeIssues} onChange={(event: ChangeEvent<HTMLInputElement>) => updatePreference({ ...preference, captureRuntimeIssues: event.target.checked })}/><span><strong>Registrar falhas locais</strong><small>Guarda apenas mensagem técnica resumida, sem conteúdo pessoal.</small></span></label>
        <label className="bm2840-quality-toggle"><input type="checkbox" checked={preference.adaptiveEffects} onChange={(event: ChangeEvent<HTMLInputElement>) => updatePreference({ ...preference, adaptiveEffects: event.target.checked })}/><span><strong>Efeitos adaptativos</strong><small>Reduz efeitos pesados quando o aparelho precisa.</small></span></label>
      </section>

      <section>
        <h4>Auditoria da tela atual</h4>
        <p>Confere nomes acessíveis, campos, IDs duplicados e tamanho dos alvos de toque visíveis.</p>
        <button type="button" className="elite-button" onClick={() => setAudit(auditVisibleInterface())}><RefreshCw size={16}/> Verificar agora</button>
        {audit && <div className="bm2840-audit-results" role="status">
          <span><b>{audit.buttonsWithoutName}</b> botões sem nome</span>
          <span><b>{audit.fieldsWithoutName}</b> campos sem nome</span>
          <span><b>{audit.duplicateIds}</b> IDs duplicados</span>
          <span><b>{audit.smallTouchTargets}</b> alvos pequenos</span>
        </div>}
      </section>
    </div>

    <div className="bm2840-quality-actions">
      <button type="button" onClick={exportReport}><Download size={16}/> Exportar relatório</button>
      <button type="button" className="danger" onClick={clearDiagnostics} disabled={!issues.length && !longTasks.length}><Trash2 size={16}/> Limpar diagnóstico</button>
    </div>
  </section>;
}
