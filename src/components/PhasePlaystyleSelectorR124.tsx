'use client';
import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldCheck, Swords } from 'lucide-react';
import type { PositionCode } from '@/lib/analyzerDomain';
import { inspectPlaystyleActivationR124, phasePlaystyleOptionsR124 } from '@/lib/efootball2027PhaseCatalogR124';
import { readLiveKnowledgeR124, syncLiveKnowledgeR124, type EfootballLiveKnowledgeR124 } from '@/lib/efootballLiveKnowledgeR124';

export function PhasePlaystyleSelectorR124({
  offensiveValue, defensiveValue, onOffensiveChange, onDefensiveChange, position='AUTO', compact=false
}:{
  offensiveValue:string; defensiveValue:string;
  onOffensiveChange:(value:string)=>void; onDefensiveChange:(value:string)=>void;
  position?:PositionCode|'AUTO'; compact?:boolean;
}) {
  const [catalog,setCatalog]=useState<EfootballLiveKnowledgeR124|null>(null);
  const [syncing,setSyncing]=useState(false); const [message,setMessage]=useState('');
  const offensiveOptions=useMemo(()=>phasePlaystyleOptionsR124('OFFENSIVE'),[catalog]);
  const defensiveOptions=useMemo(()=>phasePlaystyleOptionsR124('DEFENSIVE'),[catalog]);
  const offAudit=offensiveValue==='AUTO'?null:inspectPlaystyleActivationR124(offensiveValue,'OFFENSIVE',position);
  const defAudit=defensiveValue==='AUTO'?null:inspectPlaystyleActivationR124(defensiveValue,'DEFENSIVE',position);

  useEffect(()=>{
    const current=readLiveKnowledgeR124(); setCatalog(current);
    const age=current?.updatedAt?Date.now()-Date.parse(current.updatedAt):Number.POSITIVE_INFINITY;
    if (age>24*60*60*1000) void doSync(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  async function doSync(silent=false){
    if(syncing)return; setSyncing(true); if(!silent)setMessage('Consultando catálogo seguro...');
    try{const next=await syncLiveKnowledgeR124();setCatalog(next);setMessage(`Catálogo atualizado • ${next.sourceCount} fontes rastreadas`);}catch(error){if(!silent)setMessage(error instanceof Error?error.message:'Não foi possível atualizar agora.');}finally{setSyncing(false);}
  }
  const statusClass=(audit:typeof offAudit)=>audit?.status==='LIKELY_INACTIVE'?'warning':audit?.status==='LIKELY_ACTIVE'?'ok':'';
  return <section className={`r124-phase-selector${compact?' compact':''}`} data-testid="r124-phase-playstyle-selector">
    <header className="r124-phase-head"><div><span>Estilos 2027 por fase</span><strong>Ataque e defesa são independentes</strong><small>O detector só aceita cada estilo na família correta. Básico continua válido para cartas sem estilo naquela fase.</small></div><button type="button" onClick={()=>void doSync(false)} disabled={syncing} aria-label="Atualizar catálogo do eFootball"><RefreshCw size={16} className={syncing?'spin':''}/><span>{syncing?'Atualizando':'Atualizar catálogo'}</span></button></header>
    <div className="r124-phase-grid">
      <label className="r124-phase-card attack"><div className="r124-phase-title"><Swords size={18}/><span><em>COM A BOLA</em><strong>Estilo ofensivo</strong></span></div><select value={offensiveValue} onChange={(e)=>onOffensiveChange(e.target.value)}><option value="AUTO">Detectar na carta</option>{offensiveOptions.map((x)=><option key={x} value={x}>{x}</option>)}</select><small className={statusClass(offAudit)}>{offAudit?.message ?? 'O OCR procura somente estilos ofensivos neste campo.'}</small></label>
      <label className="r124-phase-card defence"><div className="r124-phase-title"><ShieldCheck size={18}/><span><em>SEM A BOLA</em><strong>Estilo defensivo</strong></span></div><select value={defensiveValue} onChange={(e)=>onDefensiveChange(e.target.value)}><option value="AUTO">Detectar / Básico em carta antiga</option>{defensiveOptions.map((x)=><option key={x} value={x}>{x}</option>)}</select><small className={statusClass(defAudit)}>{defAudit?.message ?? 'Goleiro Ofensivo, Sweeper GK e demais estilos defensivos não podem contaminar o ataque.'}</small></label>
    </div>
    <footer><span>{catalog?`Catálogo ${catalog.version} • ${catalog.playstyles.filter(x=>x.status==='confirmed').length} estilos confirmados • ${catalog.skills.filter(x=>x.status==='confirmed').length} habilidades confirmadas • ${catalog.observedCandidates?.length??0} candidato(s) em observação`:'Catálogo local protegido ativo'}</span>{message&&<em>{message}</em>}</footer>
  </section>;
}
