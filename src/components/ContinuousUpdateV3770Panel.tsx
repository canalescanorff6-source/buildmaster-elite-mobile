'use client';

import { useMemo } from 'react';
import {
  AlertTriangle,
  ArchiveRestore,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Download,
  History,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UploadCloud
} from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzerDomain';
import type { DynamicRulePack } from '@/modules/builds/dynamicRules';
import { buildContinuousRulesAnalysisV3770 } from '@/lib/continuousRulesV3770';

export type ContinuousUpdateV3770PanelProps = {
  result: AnalysisResult;
  rulesUrl: string;
  setRulesUrl: (value: string) => void;
  rulesStatus: string;
  rulePackInfo: DynamicRulePack;
  onLoadRulesFromUrl: () => void;
  onResetRules: () => void;
  onExportRulePack: () => void;
  onRestoreRulePackVersion: (version: string) => void;
};

function statusLabel(status: 'atual' | 'revisar' | 'bloqueado') {
  if (status === 'atual') return 'Atual e validado';
  if (status === 'revisar') return 'Revisão recomendada';
  return 'Bloqueado pela auditoria';
}

export function ContinuousUpdateV3770Panel({
  result,
  rulesUrl,
  setRulesUrl,
  rulesStatus,
  rulePackInfo,
  onLoadRulesFromUrl,
  onResetRules,
  onExportRulePack,
  onRestoreRulePackVersion
}: ContinuousUpdateV3770PanelProps) {
  const analysis = useMemo(() => buildContinuousRulesAnalysisV3770(result, rulePackInfo), [result, rulePackInfo]);
  const passedChecks = analysis.auditChecks.filter((item) => item.passed).length;

  return <div className="result-section-grid continuous-update-v3770">
    <article className={`luxury-panel wide-card continuous-rules-hero status-${analysis.status}`}>
      <div className="section-title-row">
        <div><p className="kicker"><RefreshCcw size={14}/> Atualização contínua v37.70</p><h3>Regras, habilidades e Boosters sem refazer o APK</h3></div>
        <span>{statusLabel(analysis.status)}</span>
      </div>
      <div className="health-score-grid continuous-rules-summary-grid">
        <article><strong>{analysis.confidence}%</strong><span>Confiança</span><small>{analysis.confidenceLabel}</small></article>
        <article><strong>{analysis.packVersion}</strong><span>Pacote ativo</span><small>{analysis.gameVersion}</small></article>
        <article><strong>{analysis.ageDays}</strong><span>Idade das regras</span><small>dia(s)</small></article>
        <article><strong>{analysis.applicableRules}</strong><span>Regras aplicáveis</span><small>nesta carta</small></article>
      </div>
      <div className="continuous-rules-verdict"><ShieldCheck size={20}/><div><strong>Auditoria automática</strong><span>{passedChecks}/{analysis.auditChecks.length} verificações aprovadas • checksum {analysis.computedChecksum}</span></div></div>
    </article>

    {analysis.alerts.length > 0 && <article className="luxury-panel wide-card continuous-rules-alerts">
      <div className="section-title-row"><div><p className="kicker"><AlertTriangle size={14}/> Alertas de atualização</p><h3>Regras que precisam de atenção</h3></div><span>{analysis.alerts.length}</span></div>
      <div className="continuous-alert-list">{analysis.alerts.map((alert) => <div key={alert.code} className={`level-${alert.level}`}><AlertTriangle size={18}/><div><strong>{alert.title}</strong><span>{alert.detail}</span></div></div>)}</div>
    </article>}

    <article className="luxury-panel wide-card continuous-rules-loader">
      <div className="section-title-row"><div><p className="kicker"><UploadCloud size={14}/> Pacote remoto</p><h3>Atualize as regras pela URL oficial</h3></div><span>JSON auditado</span></div>
      <p className="panel-note">O pacote remoto pode alterar regras por função, atualizar o catálogo de habilidades e Boosters, registrar a versão do eFootball e definir uma data de expiração. Um pacote crítico não substitui silenciosamente a base segura.</p>
      <label className="continuous-rules-url"><span>URL do pacote</span><input value={rulesUrl} onChange={(event: { target: { value: string } }) => setRulesUrl(event.target.value)} placeholder="https://seusite.com/buildmaster-regras-v37-70.json" /></label>
      <div className="export-pro-actions">
        <button type="button" onClick={onLoadRulesFromUrl}><UploadCloud size={18}/> Baixar e auditar</button>
        <button type="button" onClick={onResetRules}><RefreshCcw size={18}/> Restaurar base local</button>
        <button type="button" onClick={onExportRulePack}><Download size={18}/> Exportar pacote/modelo</button>
      </div>
      <p className="panel-note">{rulesStatus}</p>
    </article>

    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker"><Sparkles size={14}/> Catálogo efetivo</p><h3>Habilidades e Boosters reconhecidos pelo app</h3></div><span>{analysis.catalog.activeRemoteItems} remoto(s)</span></div>
      <div className="continuous-catalog-grid">
        <div><strong>{analysis.catalog.effectiveAdditionalSkills}</strong><span>Habilidades adicionais</span><small>base local {analysis.catalog.localAdditionalSkills}</small></div>
        <div><strong>{analysis.catalog.effectiveSpecialSkills}</strong><span>Habilidades especiais</span><small>base local {analysis.catalog.localSpecialSkills}</small></div>
        <div><strong>{analysis.catalog.effectiveBoosters}</strong><span>Ímpetos/Boosters</span><small>base local {analysis.catalog.localBoosters}</small></div>
        <div><strong>{analysis.catalog.deprecatedItems}</strong><span>Itens depreciados</span><small>bloqueados pelo pacote</small></div>
      </div>
    </article>

    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker"><BrainCircuit size={14}/> Auditoria do pacote</p><h3>Confiança calculada por evidência</h3></div><span>{analysis.confidenceLabel}</span></div>
      <div className="continuous-audit-grid">{analysis.auditChecks.map((check) => <div key={check.id} className={check.passed ? 'passed' : 'failed'}>{check.passed ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}<div><strong>{check.label}</strong><span>{check.detail}</span></div><b>{check.weight}</b></div>)}</div>
    </article>

    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker"><History size={14}/> Histórico por versão</p><h3>Volte para uma versão anterior quando necessário</h3></div><span>{analysis.history.length}</span></div>
      {analysis.history.length ? <div className="continuous-history-list">{analysis.history.map((item, index) => <div key={item.id}><span><b>{item.version}</b><small>{item.gameVersion} • {item.source}</small></span><span><b>{item.confidence}%</b><small>{new Date(item.activatedAt).toLocaleString('pt-BR')}</small></span><button type="button" disabled={index === 0 && item.version === analysis.packVersion} onClick={() => onRestoreRulePackVersion(item.version)}><ArchiveRestore size={16}/> Restaurar</button></div>)}</div> : <p className="panel-note">O histórico começa quando o primeiro pacote v37.70 é ativado nesta conta.</p>}
    </article>

    <article className="luxury-panel wide-card continuous-rules-notes">
      <div className="section-title-row"><div><p className="kicker"><Clock3 size={14}/> Notas e proteções</p><h3>O que mudou e o que permanece protegido</h3></div><span>{analysis.freshness}</span></div>
      {analysis.releaseNotes.length > 0 && <div className="skill-check-card"><strong>Notas desta versão</strong>{analysis.releaseNotes.map((item) => <span key={item}>✓ {item}</span>)}</div>}
      <div className="skill-check-card muted"><strong>Proteções permanentes</strong>{analysis.safeguards.map((item) => <span key={item}>• {item}</span>)}</div>
    </article>

    <article className="luxury-panel wide-card">
      <p className="kicker">Estrutura do pacote v37.70</p>
      <pre className="raw-text-box">{`{
  "schemaVersion": 3770,
  "version": "37.70.1-remoto",
  "gameVersion": "eFootball 2026",
  "publishedAt": "2026-08-01T00:00:00.000Z",
  "updatedAt": "2026-08-01T00:00:00.000Z",
  "expiresAt": "2026-10-01T00:00:00.000Z",
  "minimumAppVersion": "37.70.0",
  "source": "Pacote oficial do proprietário",
  "checksum": "fnv1a-xxxxxxxx",
  "releaseNotes": ["Mudanças desta versão"],
  "catalog": {
    "additionalSkills": [],
    "specialSkills": [],
    "boosters": []
  },
  "rules": []
}`}</pre>
    </article>
  </div>;
}
