'use client';

import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { CheckCircle2, Download, History, RefreshCcw, ShieldAlert, ShieldCheck, UploadCloud, X } from 'lucide-react';
import {
  EMBEDDED_OFFICIAL_RULE_PACK,
  activateOfficialRulePack,
  compareOfficialRulePacks,
  readOfficialRuleAudit,
  readOfficialRuleHistory,
  readOfficialRulePack,
  resetOfficialRulePack,
  reviewOfficialRulePack,
  rollbackOfficialRulePack,
  sanitizeOfficialRulePack,
  type OfficialRulePack,
  type RulePackReview
} from './officialRuleRegistry';

function downloadPack(pack: OfficialRulePack) {
  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `buildmaster-regras-${pack.version}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function OfficialRulesCenter() {
  const [pack, setPack] = useState<OfficialRulePack>(() => readOfficialRulePack());
  const [history, setHistory] = useState(() => readOfficialRuleHistory());
  const [audit, setAudit] = useState(() => readOfficialRuleAudit());
  const [pendingPack, setPendingPack] = useState<OfficialRulePack | null>(null);
  const [pendingReview, setPendingReview] = useState<RulePackReview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState('Atualização revisada no painel administrativo.');
  const [message, setMessage] = useState('A base embutida continua disponível mesmo sem internet.');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const comparison = useMemo(() => compareOfficialRulePacks(EMBEDDED_OFFICIAL_RULE_PACK, pack), [pack]);

  function refreshState(nextPack = readOfficialRulePack()) {
    setPack(nextPack);
    setHistory(readOfficialRuleHistory());
    setAudit(readOfficialRuleAudit());
  }

  async function importPack(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const sanitized = sanitizeOfficialRulePack(parsed);
      const review = reviewOfficialRulePack(parsed, pack);
      setPendingReview(review);
      setPendingPack(sanitized);
      setConfirmed(false);
      if (!sanitized || !review.validation.valid) {
        setMessage(`Importação bloqueada: ${review.validation.errors.join(' ')}`);
        return;
      }
      setMessage(`Pacote ${sanitized.version} validado. Revise as mudanças e confirme antes de ativar.`);
    } catch {
      setPendingPack(null);
      setPendingReview(null);
      setMessage('O arquivo selecionado não contém um pacote JSON válido.');
    }
  }

  function activatePending() {
    if (!pendingPack || !pendingReview) return;
    const activated = activateOfficialRulePack(pendingPack, { confirmed, reason });
    if (!activated.valid) {
      setMessage(`Não foi possível ativar: ${activated.errors.join(' ')}`);
      setAudit(readOfficialRuleAudit());
      return;
    }
    refreshState();
    setPendingPack(null);
    setPendingReview(null);
    setConfirmed(false);
    setMessage(`Pacote ${pendingPack.version} ativado. A versão anterior foi preservada para rollback.`);
  }

  function cancelPreview() {
    setPendingPack(null);
    setPendingReview(null);
    setConfirmed(false);
    setMessage('Pré-visualização cancelada. A base ativa não foi alterada.');
  }

  return (
    <section className="bm2930-rules-center bm2940-rules-center luxury-panel" aria-labelledby="bm2940-rules-title">
      <div className="bm2930-panel-heading bm2940-heading">
        <div><p className="kicker"><ShieldCheck size={15} /> Bloco 18 aprimorado</p><h3 id="bm2940-rules-title">Banco oficial e regras atualizáveis</h3><span>Validação semântica, prévia obrigatória, compatibilidade, auditoria e rollback protegido.</span></div>
        <strong className="state-ready">v{pack.version}</strong>
      </div>

      <div className="bm2930-rules-metrics">
        <article><strong>{pack.positions.length}</strong><span>Posições</span><small>lista fechada controlada</small></article>
        <article><strong>{pack.playstyles.length}</strong><span>Estilos</span><small>compatibilidade por posição</small></article>
        <article><strong>{pack.additionalSkills.length}</strong><span>Habilidades</span><small>nomes controlados</small></article>
        <article><strong>{history.length}</strong><span>Versões protegidas</span><small>rollback local</small></article>
      </div>

      <div className="bm2930-rule-info bm2940-rule-info">
        <span><b>Temporada:</b> {pack.season}</span>
        <span><b>Origem:</b> {pack.source}</span>
        <span><b>Confiança:</b> {pack.integrity.trust}</span>
        <span><b>Publicador:</b> {pack.publisher.name}</span>
        <span><b>Compatível desde:</b> v{pack.compatibility.minAppVersion}</span>
        <span><b>Checksum:</b> {pack.checksum}</span>
      </div>

      <div className="bm2930-rule-actions">
        <button type="button" onClick={() => downloadPack(pack)}><Download size={17} /><div><strong>Exportar pacote</strong><span>Salva a base ativa em JSON.</span></div></button>
        <button type="button" onClick={() => inputRef.current?.click()}><UploadCloud size={17} /><div><strong>Importar para revisão</strong><span>O arquivo não é ativado automaticamente.</span></div></button>
        <button type="button" disabled={!history.length} onClick={() => { const next = rollbackOfficialRulePack(); refreshState(next); setMessage(`Rollback concluído para ${next.version}.`); }}><History size={17} /><div><strong>Voltar versão</strong><span>Restaura o pacote anterior protegido.</span></div></button>
        <button type="button" onClick={() => { const next = resetOfficialRulePack(); refreshState(next); setMessage('Base embutida restaurada.'); }}><RefreshCcw size={17} /><div><strong>Restaurar base interna</strong><span>Funciona offline e remove o pacote importado.</span></div></button>
        <input ref={inputRef} hidden type="file" accept="application/json,.json" onChange={(event: ChangeEvent<HTMLInputElement>) => void importPack(event)} />
      </div>

      {pendingReview && <div className={`bm2940-rule-preview ${pendingReview.validation.valid ? 'is-valid' : 'is-blocked'}`}>
        <div className="bm2940-card-title"><div>{pendingReview.validation.valid ? <CheckCircle2 size={18}/> : <ShieldAlert size={18}/>}<strong>Prévia do pacote {pendingPack?.version ?? 'inválido'}</strong></div><button type="button" aria-label="Fechar prévia" onClick={cancelPreview}><X size={17}/></button></div>
        <div className="bm2940-preview-metrics">
          {pendingReview.summary.map((item) => <span key={item}>{item}</span>)}
          <span><b>Confiança:</b> {pendingReview.trust}</span>
          <span><b>Compatibilidade:</b> {pendingReview.compatible ? 'aprovada' : 'bloqueada'}</span>
        </div>
        {pendingReview.validation.warnings.length > 0 && <div className="bm2940-rule-warnings">{pendingReview.validation.warnings.map((warning) => <span key={warning}>{warning}</span>)}</div>}
        {pendingReview.blockers.length > 0 && <div className="bm2940-rule-blockers">{pendingReview.blockers.map((blocker) => <span key={blocker}>{blocker}</span>)}</div>}
        {pendingReview.validation.valid && pendingPack && <>
          <label className="bm2940-reason"><span>Justificativa da ativação</span><input value={reason} onChange={(event: ChangeEvent<HTMLInputElement>) => setReason(event.target.value)} maxLength={180}/></label>
          <label className="bm2940-confirm"><input type="checkbox" checked={confirmed} onChange={(event: ChangeEvent<HTMLInputElement>) => setConfirmed(event.target.checked)}/><span>Revisei a versão, a compatibilidade, o publicador e as alterações. Quero ativar este pacote.</span></label>
          <div className="bm2940-preview-actions"><button type="button" onClick={cancelPreview}>Cancelar</button><button type="button" className="elite-button" disabled={!confirmed || reason.trim().length < 8} onClick={activatePending}><ShieldCheck size={16}/> Ativar pacote revisado</button></div>
        </>}
      </div>}

      <div className="bm2930-rule-comparison bm2940-rule-comparison">
        <strong>Comparação com a base embutida</strong>
        <span>+{comparison.addedSkills.length} / −{comparison.removedSkills.length} habilidades • {comparison.changedPlaystyles.length} estilos alterados • {comparison.changedCardRules.length} regras alteradas</span>
      </div>

      <div className="bm2940-rules-history">
        <article><div className="bm2940-card-title"><div><History size={17}/><strong>Histórico protegido</strong></div><span>{history.length}</span></div>{history.slice(0, 5).map((item) => <span key={item.checksum}><b>v{item.version}</b><em>{item.publisher.name}</em><small>{new Date(item.publishedAt).toLocaleDateString('pt-BR')} • {item.integrity.trust}</small></span>)}{!history.length && <p>Nenhuma versão anterior armazenada.</p>}</article>
        <article><div className="bm2940-card-title"><div><ShieldCheck size={17}/><strong>Auditoria</strong></div><span>{audit.length}</span></div>{audit.slice(0, 5).map((item) => <span key={item.id}><b>{item.action}</b><em>{item.fromVersion} → {item.toVersion}</em><small>{item.reason}</small></span>)}{!audit.length && <p>Nenhuma alteração administrativa registrada.</p>}</article>
      </div>

      <p className="bm2930-rule-message" role="status">{message}</p>
    </section>
  );
}
