'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AnalysisResult } from '@/lib/analyzer';
import type { ManagerRecord } from '@/lib/managers';
import type { MatchValidationRecord } from '@/lib/appEvolution';
import { readMatchValidationRepositoryR137 } from '@/modules/matches/matchValidationRepositoryR137';
import { buildFinalDecisionR570 } from '@/lib/finalDecisionR570';

function textualReportR570(report: ReturnType<typeof buildFinalDecisionR570>) {
  return [
    'BUILDMASTER ELITE | RELATÓRIO CONSULTIVO R570',
    'Carta: '+report.playerName+' | edição: '+report.editionFingerprint,
    'Posição: '+report.requestedPosition+' | Formação: '+report.formation+' | Estilo: '+report.style,
    'Técnico: '+(report.managerName??'PENDENTE'),
    'Progressão: '+(report.spent??'PENDENTE')+'/'+(report.budget??'PENDENTE')+
      ' | Restante: '+(report.remaining??'PENDENTE'),
    'Variantes: '+report.variantCount+' | Partidas: '+report.matchCount+' | Contextos A/B: '+report.comparableMatchContexts,
    ...report.checks.map(check=>check.label+' ['+check.status+'] '+check.detail),
    'DECISÃO FINAL: '+report.status+' | SEM ALTERAÇÃO AUTOMÁTICA | SEM VENCEDOR COMPROVADO',
    'As observações de partida não demonstram causalidade; confira a carta no jogo.'
  ].join('\n');
}

export function FinalDecisionPanelR570({ result, selectedManager }: {
  result: AnalysisResult;
  selectedManager?: ManagerRecord | null;
}) {
  const [matches,setMatches]=useState<MatchValidationRecord[]>([]);
  const [recordsReady,setRecordsReady]=useState(false);
  const [exportText,setExportText]=useState('');
  const [notice,setNotice]=useState('');
  useEffect(()=>{
    try {
      setMatches(readMatchValidationRepositoryR137());
    } catch {
      setMatches([]);
    } finally {
      setRecordsReady(true);
    }
  },[result.parsed.internalId, result.parsed.playerName]);
  const report=useMemo(()=>buildFinalDecisionR570({
    result,manager:selectedManager??null,matchRecords:matches
  }),[result,selectedManager,matches]);

  async function copyReport() {
    const value=textualReportR570(report);
    try {
      if(!navigator.clipboard?.writeText)throw new Error('clipboard disabled');
      await navigator.clipboard.writeText(value);
      setNotice('Relatório R570 copiado localmente, sem envio para API externa.');
      setExportText('');
    } catch {
      setExportText(value);
      setNotice('Permissão de cópia indisponível. Selecione o texto abaixo e copie manualmente.');
    }
  }
  return (
    <article className="luxury-panel" aria-label="R570 Painel de decisão final"
      style={{padding:14,marginBlock:12}}>
      <div className="section-title-row"><div>
        <p className="kicker">R570 — Painel Decisório Final</p>
        <h3>O que está comprovado antes da ficha final</h3>
      </div><span>{report.status}</span></div>
      <p className="panel-note">Posição {report.requestedPosition} • {report.formation} • {report.style}
        {' • '} Técnico: {report.managerName??'PENDENTE'}</p>
      <div className="health-score-grid match-summary-grid">
        <div><strong>{report.spent??'—'}/{report.budget??'—'}</strong><span>Treino / orçamento</span></div>
        <div><strong>{report.variantCount}</strong><span>Variantes comparáveis apenas por custo/evidência</span></div>
        <div><strong>{recordsReady?report.matchCount:'—'}</strong><span>Partidas vinculadas à edição e posição</span></div>
      </div>
      <div className="v27-pairing-list">
        {report.checks.map(check=>(
          <div key={check.key}>
            <strong>{check.label} — {check.status}</strong>
            <p>{check.detail}</p>
          </div>
        ))}
      </div>
      <p className="panel-note">Recomendações de habilidades e ímpetos podem ser planejadas na R567.
        A formação fluida e as ativações devem ser conferidas na R566; as partidas A/B na R568.</p>
      <p className="panel-note">Nenhuma ficha é aplicada automaticamente. Os bônus do técnico não são
        somados ao print e uma comparação descritiva não define o melhor jogador por si só.</p>
      <button type="button" className="elite-button" onClick={()=>void copyReport()}>
        Copiar relatório decisório
      </button>
      {notice&&<p className="inline-status-message" role="status">{notice}</p>}
      {exportText&&<label>Relatório para copiar manualmente
        <textarea aria-label="Relatório R570 para copiar" rows={10} value={exportText} readOnly
          onFocus={event=>event.currentTarget.select()} style={{width:'100%'}}/>
      </label>}
    </article>
  );
}
