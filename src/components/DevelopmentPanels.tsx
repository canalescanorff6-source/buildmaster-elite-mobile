'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AnalysisResult } from '@/lib/analyzer';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { buildSpecialSkillUsage, buildWeeklyPlan, diagnoseDelay, ERROR_OPTIONS, summarizeTapSamples, TRAINING_DRILLS, type DelayContext, type DelaySymptom } from '@/lib/playerDevelopment';

const TRAINING_LOG_KEY='buildmaster_training_logs_v25_69';

type TrainingLog={at:string;drillId:string;score:number;errors:string[];note:string};

export function SkillAndTrainingPanel({result}:{result:AnalysisResult}){
  const skillUsage=useMemo(()=>buildSpecialSkillUsage(result),[result]);
  const [area,setArea]=useState<'defesa'|'ataque'>('defesa');
  const [selectedErrors,setSelectedErrors]=useState<string[]>([]);
  const [logs,setLogs]=useState<TrainingLog[]>([]);
  const [score,setScore]=useState(7);
  const [note,setNote]=useState('');
  const [sessions,setSessions]=useState(3);
  useEffect(()=>{try{setLogs(JSON.parse(readAccountStorage(TRAINING_LOG_KEY)??'[]'));}catch{}},[]);
  const errorCounts=useMemo(()=>{const c:Record<string,number>={};logs.flatMap(l=>l.errors).forEach(e=>c[e]=(c[e]??0)+1);selectedErrors.forEach(e=>c[e]=(c[e]??0)+1);return Object.entries(c).sort((a,b)=>b[1]-a[1]);},[logs,selectedErrors]);
  const weekly=useMemo(()=>buildWeeklyPlan(errorCounts.map(([e])=>e),sessions),[errorCounts,sessions]);
  function saveDrill(drillId:string){const next=[{at:new Date().toISOString(),drillId,score,errors:selectedErrors,note},...logs].slice(0,100);setLogs(next);writeAccountStorage(TRAINING_LOG_KEY,JSON.stringify(next));setNote('');}
  return <div className="result-section-grid">
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">v25.65 • Habilidades especiais</p><h3>Aproveitamento real na posição escolhida</h3></div><span>{skillUsage.overall}/100</span></div>
      <div className="skill-grid">{skillUsage.items.map(item=><div className="skill-check-card" key={item.name}><strong>{item.name} • {item.score}/100</strong><span>{item.activation} • {item.source}</span><small>Fortalecer: {item.helpfulAttributes.join(' • ')}</small><em>Uso: {item.bestUse}</em>{item.warning&&<b>{item.warning}</b>}</div>)}{!skillUsage.items.length&&<p className="panel-note">Nenhuma habilidade especial foi confirmada. Revise o print ou marque as habilidades existentes.</p>}</div>
      <p className="panel-note">{skillUsage.summary.join(' ')}</p>
    </article>
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">v25.66–v25.67 • Treinos repetíveis</p><h3>Defesa e ataque com erro, correção e meta</h3></div><span>{logs.length} registros</span></div>
      <div className="segmented"><button className={area==='defesa'?'active':''} onClick={()=>setArea('defesa')}>Defesa</button><button className={area==='ataque'?'active':''} onClick={()=>setArea('ataque')}>Ataque</button></div>
      <div className="skill-grid">{TRAINING_DRILLS.filter(d=>d.area===area).map(drill=><div className="skill-check-card" key={drill.id}><strong>{drill.title}</strong><span>{drill.duration} min • {drill.repetitions} repetições</span><small>{drill.objective}</small><em>Erro comum: {drill.commonError}</em><b>Correção: {drill.correction}</b><button onClick={()=>saveDrill(drill.id)}>Registrar treino • nota {score}/10</button></div>)}</div>
      <label><span>Nota do bloco: {score}/10</span><input type="range" min="0" max="10" value={score} onChange={e=>setScore(Number(e.target.value))}/></label>
      <label><span>Observação</span><input value={note} onChange={e=>setNote(e.target.value)} placeholder="O que melhorou ou ainda errou?"/></label>
    </article>
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">v25.68 • Erros e correção</p><h3>Marque o que aconteceu no treino ou partida</h3></div><span>{selectedErrors.length} selecionados</span></div>
      <div className="restore-check-grid">{ERROR_OPTIONS.map(error=><label key={error}><input type="checkbox" checked={selectedErrors.includes(error)} onChange={()=>setSelectedErrors(v=>v.includes(error)?v.filter(x=>x!==error):[...v,error])}/><span>{error}</span></label>)}</div>
      <div className="integrity-report-panel">{errorCounts.slice(0,5).map(([error,count])=><span key={error}><b>{count}x</b>{error}</span>)}{!errorCounts.length&&<span>Registre erros para o app encontrar padrões.</span>}</div>
    </article>
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">v25.69 • Plano semanal</p><h3>Rotina adaptada aos erros mais repetidos</h3></div><select value={sessions} onChange={e=>setSessions(Number(e.target.value))}><option value={2}>2 dias</option><option value={3}>3 dias</option><option value={4}>4 dias</option><option value={5}>5 dias</option></select></div>
      <div className="skill-grid">{weekly.map(day=><div className="skill-check-card" key={day.day}><strong>Dia {day.day}</strong><span>{day.drills.map(d=>d.title).join(' + ')}</span><small>{day.drills.reduce((s,d)=>s+d.duration,0)} minutos</small><em>{day.review}</em></div>)}</div>
    </article>
  </div>;
}

export function DelayResponsePanel(){
  const [ctx,setCtx]=useState<DelayContext>({fps:60,graphics:'baixa',wifi:'5 GHz',signal:'forte',temperature:'morno',backgroundApps:false,batterySaver:false,symptoms:[]});
  const [samples,setSamples]=useState<number[]>([]);
  const diagnosis=useMemo(()=>diagnoseDelay(ctx),[ctx]);
  const tap=useMemo(()=>summarizeTapSamples(samples),[samples]);
  const symptoms:DelaySymptom[]=['passe atrasado','jogador demora a virar','chute não responde','troca lenta','comando duplo','imagem trava','fica pesado depois de minutos'];
  return <section className="luxury-panel wide-card">
    <div className="section-title-row"><div><p className="kicker">v25.70–v25.72 • Delay e resposta</p><h3>Configuração, teste local e diagnóstico</h3></div><span>Causa provável: {diagnosis.primary}</span></div>
    <div className="form-grid">
      <label><span>FPS</span><select value={ctx.fps} onChange={e=>setCtx({...ctx,fps:Number(e.target.value) as 30|60})}><option value={60}>60 FPS</option><option value={30}>30 FPS</option></select></label>
      <label><span>Gráficos</span><select value={ctx.graphics} onChange={e=>setCtx({...ctx,graphics:e.target.value as DelayContext['graphics']})}><option>baixa</option><option>média</option><option>alta</option></select></label>
      <label><span>Conexão</span><select value={ctx.wifi} onChange={e=>setCtx({...ctx,wifi:e.target.value as DelayContext['wifi']})}><option>5 GHz</option><option>2.4 GHz</option><option>dados móveis</option></select></label>
      <label><span>Sinal</span><select value={ctx.signal} onChange={e=>setCtx({...ctx,signal:e.target.value as DelayContext['signal']})}><option>forte</option><option>médio</option><option>fraco</option></select></label>
      <label><span>Temperatura</span><select value={ctx.temperature} onChange={e=>setCtx({...ctx,temperature:e.target.value as DelayContext['temperature']})}><option>frio</option><option>morno</option><option>quente</option></select></label>
      <label><span><input type="checkbox" checked={ctx.backgroundApps} onChange={e=>setCtx({...ctx,backgroundApps:e.target.checked})}/> Apps pesados abertos</span></label>
      <label><span><input type="checkbox" checked={ctx.batterySaver} onChange={e=>setCtx({...ctx,batterySaver:e.target.checked})}/> Economia de bateria</span></label>
    </div>
    <div className="restore-check-grid">{symptoms.map(s=><label key={s}><input type="checkbox" checked={ctx.symptoms.includes(s)} onChange={()=>setCtx({...ctx,symptoms:ctx.symptoms.includes(s)?ctx.symptoms.filter(x=>x!==s):[...ctx.symptoms,s]})}/><span>{s}</span></label>)}</div>
    <div className="health-score-grid">{diagnosis.ranked.map(([key,value])=><article key={key}><strong>{value}</strong><span>{key}</span></article>)}</div>
    <div className="health-alert-list">{diagnosis.recommendations.map(r=><span key={r}>{r}</span>)}</div>
    <div className="restore-select-panel"><strong>Teste local de consistência do toque</strong><p className="panel-note">Toque no botão 10 vezes no mesmo ritmo. Isto mede consistência do aparelho/navegador, não o ping do servidor.</p><button onClick={()=>setSamples(v=>v.length>=10?[performance.now()]:[...v,performance.now()])}>Toque aqui • {samples.length}/10</button><button onClick={()=>setSamples([])}>Reiniciar</button><p><b>{tap.label}</b> • intervalo médio {tap.average} ms • variação {tap.variation} ms</p><small>{tap.note}</small></div>
  </section>;
}
