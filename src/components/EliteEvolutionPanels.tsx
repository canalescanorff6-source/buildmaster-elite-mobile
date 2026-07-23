'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnalysisResult } from '@/lib/analyzer';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { createStableId } from '@/lib/stableId';

const TRAINING_LABELS: Record<string,string> = {
  shooting:'Finalização', passing:'Passe', dribbling:'Drible', dexterity:'Destreza', lowerBodyStrength:'Força pernas',
  aerialStrength:'Bola aérea', defending:'Defesa', gk1:'Goleiro 1', gk2:'Goleiro 2', gk3:'Goleiro 3'
};

function trainingSummary(plan: Record<string,number>): string {
  return Object.entries(plan).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${TRAINING_LABELS[k]??k} +${v}`).join(' • ');
}

type AbRecord={at:string;build:'A'|'B';rating:number;note:string};

function AbExperimentPanel({result}:{result:AnalysisResult}){
  const evolution=result.eliteEvolution;
  const experiment=evolution?.abExperiment;
  const storageKey=experiment?`buildmaster_ab_${experiment.id}`:'buildmaster_ab_none';
  const [records,setRecords]=useState<AbRecord[]>([]);
  const [build,setBuild]=useState<'A'|'B'>('A');
  const [rating,setRating]=useState(7);
  const [note,setNote]=useState('');
  useEffect(()=>{if(!experiment)return;try{setRecords(JSON.parse(readAccountStorage(storageKey)??'[]'));}catch{setRecords([]);}},[experiment,storageKey]);
  const summary=useMemo(()=>{
    const avg=(key:'A'|'B')=>{const rows=records.filter(r=>r.build===key);return rows.length?rows.reduce((s,r)=>s+r.rating,0)/rows.length:0;};
    return {a:avg('A'),b:avg('B'),countA:records.filter(r=>r.build==='A').length,countB:records.filter(r=>r.build==='B').length};
  },[records]);
  if(!experiment)return null;
  function save(){const next=[{at:new Date().toISOString(),build,rating,note},...records].slice(0,40);setRecords(next);writeAccountStorage(storageKey,JSON.stringify(next));setNote('');}
  return <article className="luxury-panel wide-card">
    <div className="section-title-row"><div><p className="kicker">Aprendizado por carta</p><h3>Experimento A/B controlado</h3></div><span>{experiment.id}</span></div>
    <div className="skill-grid">
      <div className="skill-check-card"><strong>Ficha A</strong><span>{experiment.buildA}</span><em>{summary.countA} jogo(s) • média {summary.a?summary.a.toFixed(1):'—'}</em></div>
      <div className="skill-check-card"><strong>Ficha B</strong><span>{experiment.buildB}</span><em>{summary.countB} jogo(s) • média {summary.b?summary.b.toFixed(1):'—'}</em></div>
    </div>
    <div className="form-grid">
      <label><span>Ficha usada</span><select value={build} onChange={e=>setBuild(e.target.value as 'A'|'B')}><option value="A">A — {experiment.buildA}</option><option value="B">B — {experiment.buildB}</option></select></label>
      <label><span>Nota real: {rating}/10</span><input type="range" min="0" max="10" value={rating} onChange={e=>setRating(Number(e.target.value))}/></label>
      <label className="wide-field"><span>Observação da partida</span><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Passe, defesa, cansaço, habilidade especial..."/></label>
    </div>
    <button type="button" onClick={save}>Registrar partida A/B</button>
    <p className="panel-note">{experiment.successRule}</p>
    <div className="chip-cloud">{experiment.metrics.map(item=><span key={item}>{item}</span>)}</div>
  </article>;
}

export function EliteEvolutionPanel({result}:{result:AnalysisResult}){
  const e=result.eliteEvolution;
  if(!e)return null;
  return <>
    <article className="luxury-panel wide-card evolution-executive-card">
      <div className="section-title-row"><div><p className="kicker">Evolução total</p><h3>Resumo executivo desta ficha</h3></div><span>Confiança {e.confidence.score}/100</span></div>
      <div className="health-score-grid dna-score-grid">
        <article><strong>{e.usageContext.contextScore}</strong><span>Contexto real</span></article>
        <article><strong>{e.proof.candidatesTested}</strong><span>Fichas testadas</span></article>
        <article><strong>+{e.proof.genericTemplateGain}</strong><span>Sobre o molde genérico</span></article>
        <article><strong>{e.confidence.level}</strong><span>Confiança</span></article>
      </div>
      <div className="skill-grid"><div className="skill-check-card"><strong>Decisão rápida</strong>{e.premium.executiveSummary.map(item=><span key={item}>✓ {item}</span>)}</div><div className="skill-check-card"><strong>Contexto</strong><span>{e.usageContext.roleInShape}</span><span>{e.usageContext.collectiveStyle}</span><em>Titular {e.usageContext.starterScore} • reserva {e.usageContext.substituteScore}</em></div></div>
      {e.suspiciousIssues.length>0&&<div className="health-alert-list">{e.suspiciousIssues.map(issue=><span key={issue.code}><b>{issue.severity.toUpperCase()}:</b> {issue.title}. {issue.correction}</span>)}</div>}
    </article>

    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">Lote 18 • Contexto e cenários</p><h3>Como a ficha muda conforme a utilização</h3></div><span>{e.scenarioBuilds.length} cenários</span></div>
      <details className="settings-details-card" open><summary>Simulador “E se?”</summary><div className="variant-grid">{e.whatIf.map(item=><div key={item.id}><strong>{item.title}</strong><span>Nota projetada {item.projectedScore} ({item.delta>=0?'+':''}{item.delta})</span><em>{trainingSummary(item.training)}</em><p>{item.gain}</p><small>Troca: {item.tradeoff}</small></div>)}</div></details>
      <details className="settings-details-card"><summary>Ficha por cenário</summary><div className="variant-grid">{e.scenarioBuilds.map(item=><div key={item.scenario}><strong>{item.scenario}</strong><span>Nota {item.score}/100</span><em>{trainingSummary(item.training)}</em><p>Prioridades: {item.priorities.join(' • ')}</p><small>Risco: {item.mainRisk}</small></div>)}</div></details>
      <details className="settings-details-card"><summary>Simulação de 90 minutos</summary><div className="comparison-table"><div><strong>Período</strong><strong>Rendimento</strong><strong>Stamina</strong><strong>Risco</strong></div>{e.ninetyMinutes.map(item=><div key={item.range}><span>{item.range}</span><span>{item.performance}</span><span>{item.stamina}</span><strong>{item.risk}</strong><small>{item.note}</small></div>)}</div></details>
      <details className="settings-details-card"><summary>Sensibilidade dos pontos</summary><div className="dna-goal-list">{e.pointSensitivity.map(item=><div key={`${item.from}-${item.to}`}><strong>{TRAINING_LABELS[item.from]} → {TRAINING_LABELS[item.to]}</strong><span>1 nível • ganho estimado {item.expectedDelta>=0?'+':''}{item.expectedDelta} • confiança {item.confidence}</span><small>{item.verdict}</small></div>)}</div></details>
    </article>

    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">Lote 19 • Precisão comprovável</p><h3>Prova da escolha do motor</h3></div><span>Margem {e.proof.winnerMargin}</span></div>
      <div className="data-grid"><div><span>Candidatas testadas</span><strong>{e.proof.candidatesTested}</strong></div><div><span>Eliminadas</span><strong>{e.proof.candidatesEliminated}</strong></div><div><span>Ganho sobre genérica</span><strong>+{e.proof.genericTemplateGain}</strong></div><div><span>Confiança</span><strong>{e.confidence.score}/100</strong></div></div>
      <p className="panel-note">{e.proof.verdict}</p>
      <div className="skill-grid"><div className="skill-check-card"><strong>Fatores decisivos</strong>{e.proof.decisiveFactors.map(item=><span key={item}>✓ {item}</span>)}</div><div className="skill-check-card"><strong>Por que outras perderam</strong>{e.proof.eliminatedReasons.map(item=><span key={item.reason}>{item.count} • {item.reason}</span>)}</div></div>
      <details className="settings-details-card"><summary>Confiança da recomendação</summary><div className="skill-grid"><div className="skill-check-card"><strong>Evidências</strong>{e.confidence.evidence.map(item=><span key={item}>✓ {item}</span>)}</div><div className="skill-check-card muted"><strong>Ainda falta confirmar</strong>{e.confidence.missingEvidence.length?e.confidence.missingEvidence.map(item=><span key={item}>⚠ {item}</span>):<span>Dados centrais completos.</span>}</div></div>{e.confidence.caveats.map(item=><p className="panel-note" key={item}>• {item}</p>)}</details>
    </article>

    <AbExperimentPanel result={result}/>

    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">Lotes 20, 23 e 24</p><h3>Aprendizado, segurança e experiência premium</h3></div><span>{e.learning.versionSignature}</span></div>
      <details className="settings-details-card" open><summary>Aprendizado específico desta carta</summary><p className="panel-note">Chave separada: {e.learning.key}</p><div className="chip-cloud">{e.learning.separatedBy.map(item=><span key={item}>{item}</span>)}</div><p className="panel-note">Próxima correção proposta: {e.learning.correctionProposal}</p></details>
      <details className="settings-details-card"><summary>Perfil pessoal separado do Meta</summary><div className="comparison-table"><div><strong>Prioridade</strong><strong>Peso</strong><strong>Origem</strong><strong>Status</strong></div>{e.personalProfile.priorities.map(item=><div key={`${item.label}-${item.source}`}><span>{item.label}</span><span>{item.weight}</span><span>{item.source}</span><strong>ativo</strong></div>)}</div><p className="panel-note">{e.personalProfile.summary}</p></details>
      <details className="settings-details-card"><summary>Geração transacional e diagnóstico</summary><div className="dna-goal-list">{e.reliability.stages.map(stage=><div key={stage.order}><strong>{stage.order}. {stage.name}</strong><span>{stage.blocksNextWhenFailed?'Bloqueia a próxima etapa se falhar':'Pode ser repetida sem perder os dados'}</span><small>Preserva: {stage.preserves.join(' • ')}</small></div>)}</div><p className="panel-note">Teste de estresse planejado: {e.reliability.simulatedCases} combinações • monitor anticlone em {e.reliability.cloneMonitorThreshold}%.</p></details>
      <details className="settings-details-card"><summary>Espaço de trabalho premium</summary><div className="skill-grid"><div className="skill-check-card"><strong>Fluxo de criação</strong>{e.premium.creationFlow.map((item,index)=><span key={item}>{index+1}. {item}</span>)}</div><div className="skill-check-card"><strong>Página do jogador</strong>{e.premium.workspaceSections.map(item=><span key={item}>• {item}</span>)}</div><div className="skill-check-card"><strong>Painel de evolução</strong>{e.premium.evolutionDashboard.map(item=><span key={item}>• {item}</span>)}</div></div></details>
    </article>
  </>;
}

type VideoMarker={id:string;at:string;seconds:number;error:string;note:string};

export function VideoReviewPanel({result}:{result:AnalysisResult}){
  const e=result.eliteEvolution;
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const [videoUrl,setVideoUrl]=useState<string|null>(null);
  const [markerType,setMarkerType]=useState(e?.videoAssist.supportedMarkers[0]??'passe atrasado');
  const [note,setNote]=useState('');
  const key=e?`buildmaster_video_markers_${e.learning.versionSignature}_${result.bestPosition.code}`:'buildmaster_video_markers';
  const [markers,setMarkers]=useState<VideoMarker[]>([]);
  useEffect(()=>{try{setMarkers(JSON.parse(readAccountStorage(key)??'[]'));}catch{setMarkers([]);}},[key]);
  useEffect(()=>()=>{if(videoUrl)URL.revokeObjectURL(videoUrl);},[videoUrl]);
  if(!e)return null;
  function chooseVideo(file?:File){if(!file)return;if(videoUrl)URL.revokeObjectURL(videoUrl);setVideoUrl(URL.createObjectURL(file));}
  function addMarker(){const seconds=Math.round(videoRef.current?.currentTime??0);const row={id:createStableId('video-marker'),at:new Date().toISOString(),seconds,error:markerType,note};const next=[...markers,row].sort((a,b)=>a.seconds-b.seconds);setMarkers(next);writeAccountStorage(key,JSON.stringify(next));setNote('');}
  function remove(id:string){const next=markers.filter(x=>x.id!==id);setMarkers(next);writeAccountStorage(key,JSON.stringify(next));}
  return <article className="luxury-panel wide-card video-review-card">
    <div className="section-title-row"><div><p className="kicker">Vídeo e treino adaptativo</p><h3>Análise assistida da jogabilidade</h3></div><span>{markers.length} lance(s)</span></div>
    <label className="file-picker"><span>Selecionar vídeo do aparelho</span><input type="file" accept="video/*" onChange={event=>chooseVideo(event.target.files?.[0])}/></label>
    {videoUrl?<video ref={videoRef} controls playsInline src={videoUrl}/>:<p className="panel-note">O vídeo não é enviado. Ele é aberto localmente e apenas os marcadores são salvos.</p>}
    <div className="form-grid"><label><span>Erro ou ação</span><select value={markerType} onChange={e2=>setMarkerType(e2.target.value)}>{e.videoAssist.supportedMarkers.map(item=><option key={item}>{item}</option>)}</select></label><label className="wide-field"><span>Correção/observação</span><input value={note} onChange={e2=>setNote(e2.target.value)} placeholder="O que deveria fazer neste lance?"/></label></div>
    <button type="button" disabled={!videoUrl} onClick={addMarker}>Marcar instante atual</button>
    <div className="position-list">{markers.map(item=><div key={item.id}><strong>{Math.floor(item.seconds/60)}:{String(item.seconds%60).padStart(2,'0')} • {item.error}</strong><span>{item.note||'Sem observação'}</span><button type="button" onClick={()=>remove(item.id)}>Remover</button></div>)}{!markers.length&&<p className="panel-note">Nenhum lance marcado.</p>}</div>
    <details className="settings-details-card"><summary>Como o plano adaptativo funciona</summary>{e.adaptiveTraining.nextWeekLogic.map(item=><p className="panel-note" key={item}>• {item}</p>)}<p className="panel-note"><b>Regra de progressão:</b> {e.adaptiveTraining.progressionRule}</p></details>
  </article>;
}

type StabilityRecord={at:string;profile:string;rating:number;symptom:string;note:string};

export function StabilityDiagnosticsPanel({result}:{result?:AnalysisResult}){
  const e=result?.eliteEvolution;
  const storageKey='buildmaster_stability_records_v26_17';
  const [records,setRecords]=useState<StabilityRecord[]>([]);
  const [profile,setProfile]=useState(e?.stability.profiles[0]?.name??'Competitivo');
  const [rating,setRating]=useState(7);
  const [symptom,setSymptom]=useState('sem atraso perceptível');
  const [note,setNote]=useState('');
  useEffect(()=>{try{setRecords(JSON.parse(readAccountStorage(storageKey)??'[]'));}catch{setRecords([]);}},[]);
  const profiles=e?.stability.profiles??[
    {name:'Competitivo',fps:60 as const,graphics:'baixa' as const,network:'5 GHz' as const,batterySaver:false,backgroundApps:false,purpose:'menor latência local'},
    {name:'Aquecimento controlado',fps:30 as const,graphics:'baixa' as const,network:'5 GHz' as const,batterySaver:false,backgroundApps:false,purpose:'reduzir carga térmica'}
  ];
  function save(){const row={at:new Date().toISOString(),profile,rating,symptom,note};const next=[row,...records].slice(0,60);setRecords(next);writeAccountStorage(storageKey,JSON.stringify(next));setNote('');}
  function exportReport(){const payload={version:'26.25',createdAt:new Date().toISOString(),records,notice:'Relatório local; não mede diretamente o servidor do eFootball.'};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='buildmaster-diagnostico-estabilidade.json';a.click();URL.revokeObjectURL(url);}
  return <section className="luxury-panel wide-card">
    <div className="section-title-row"><div><p className="kicker">Estabilidade comparativa</p><h3>Teste condições, salve perfis e separe as causas</h3></div><span>{records.length} teste(s)</span></div>
    <div className="skill-grid">{profiles.map(item=><div className="skill-check-card" key={item.name}><strong>{item.name}</strong><span>{item.fps} FPS • gráfico {item.graphics} • {item.network}</span><small>{item.batterySaver?'Economia ligada':'Economia desligada'} • {item.backgroundApps?'apps abertos':'apps fechados'}</small><em>{item.purpose}</em></div>)}</div>
    <div className="form-grid"><label><span>Perfil testado</span><select value={profile} onChange={ev=>setProfile(ev.target.value)}>{profiles.map(item=><option key={item.name}>{item.name}</option>)}</select></label><label><span>Resposta percebida: {rating}/10</span><input type="range" min="0" max="10" value={rating} onChange={ev=>setRating(Number(ev.target.value))}/></label><label><span>Sintoma</span><select value={symptom} onChange={ev=>setSymptom(ev.target.value)}><option>sem atraso perceptível</option><option>passe atrasado</option><option>queda visual/FPS</option><option>piora após alguns minutos</option><option>troca de marcador lenta</option><option>comando duplo</option></select></label><label className="wide-field"><span>Observação</span><input value={note} onChange={ev=>setNote(ev.target.value)} placeholder="Temperatura, rede, horário, partida..."/></label></div>
    <button type="button" onClick={save}>Salvar teste comparativo</button> <button type="button" onClick={exportReport}>Exportar diagnóstico</button>
    <div className="position-list">{records.slice(0,8).map((item,index)=><div key={`${item.at}-${index}`}><strong>{item.profile} • {item.rating}/10</strong><span>{item.symptom}</span><em>{item.note||new Date(item.at).toLocaleString('pt-BR')}</em></div>)}</div>
    {e&&<details className="settings-details-card"><summary>Regras de separação das causas</summary>{e.stability.separationRules.map(item=><p key={item} className="panel-note">• {item}</p>)}</details>}
  </section>;
}
