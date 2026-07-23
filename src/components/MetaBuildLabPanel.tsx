'use client';

import { useMemo, useState } from 'react';
import { Copy, Filter, Trophy } from 'lucide-react';
import type { MetaBuildEntry, MetaBuildUniverse } from '@/lib/metaBuildUniverse';

const LABELS: Record<string,string>={shooting:'Finalização',passing:'Passe',dribbling:'Drible',dexterity:'Destreza',lowerBodyStrength:'Força pernas',aerialStrength:'Bola aérea',defending:'Defesa',gk1:'Goleiro 1',gk2:'Goleiro 2',gk3:'Goleiro 3'};

function summary(entry:MetaBuildEntry){
  return Object.entries(entry.training).filter(([,value])=>value>0).map(([key,value])=>`${LABELS[key]??key} +${value}`).join(' • ');
}
function styleLabel(value:string){return value.replaceAll('_',' ').replace('HÍBRIDO SEGURO','Híbrido seguro');}

export function MetaBuildLabPanel({universe}:{universe:MetaBuildUniverse}){
  const [category,setCategory]=useState('TODAS');
  const [style,setStyle]=useState('TODOS');
  const [formation,setFormation]=useState('TODAS');
  const [scenario,setScenario]=useState('TODOS');
  const [selected,setSelected]=useState(universe.topBuilds[0]?.id??'');
  const categories=useMemo(()=>[...new Set(universe.topBuilds.map(item=>item.category))],[universe]);
  const styles=useMemo(()=>[...new Set(universe.topBuilds.map(item=>item.style))],[universe]);
  const formations=useMemo(()=>[...new Set(universe.topBuilds.map(item=>item.formation))],[universe]);
  const scenarios=useMemo(()=>[...new Set(universe.topBuilds.map(item=>item.scenario))],[universe]);
  const filtered=useMemo(()=>universe.topBuilds.filter(item=>(category==='TODAS'||item.category===category)&&(style==='TODOS'||item.style===style)&&(formation==='TODAS'||item.formation===formation)&&(scenario==='TODOS'||item.scenario===scenario)),[universe,category,style,formation,scenario]);
  const active=universe.topBuilds.find(item=>item.id===selected)??filtered[0]??universe.topBuilds[0];
  async function copyBuild(entry:MetaBuildEntry){
    const text=`${entry.title}\n${summary(entry)}\nNota ${entry.score}/100\n${entry.bestUse}\n${entry.whyItWon}`;
    try{await navigator.clipboard.writeText(text);}catch{/* WebViews antigos podem negar clipboard. */}
  }
  return <article className="luxury-panel wide-card meta-universe-card">
    <div className="section-title-row"><div><p className="kicker">Universo de Fichas Meta 2026</p><h3>Laboratório Meta desta carta</h3></div><span>{universe.candidatesAnalyzed.toLocaleString('pt-BR')} combinações</span></div>
    <p className="panel-note">{universe.verdict}</p>
    <div className="health-score-grid dna-score-grid">
      <article><strong>{universe.topBuilds[0]?.score??0}</strong><span>Melhor nota meta</span></article>
      <article><strong>{universe.uniqueDistributions}</strong><span>Fichas únicas</span></article>
      <article><strong>{universe.bestByCategory.length}</strong><span>Categorias</span></article>
      <article><strong>{universe.bestByScenario.length}</strong><span>Cenários</span></article>
    </div>
    {active&&<div className="meta-champion-card">
      <p className="kicker"><Trophy size={15}/> Ficha selecionada</p><h4>{active.title}</h4><strong>{summary(active)}</strong>
      <span>Nota {active.score}/100 • Meta {active.metaScore} • Identidade {active.identityScore} • Habilidade {active.skillScore} • Estabilidade {active.stabilityScore}</span>
      <p>{active.whyItWon}</p><button type="button" className="secondary-button" onClick={()=>copyBuild(active)}><Copy size={16}/> Copiar ficha</button>
    </div>}
    <div className="meta-filter-bar">
      <label><Filter size={15}/> Categoria<select value={category} onChange={event=>setCategory(event.target.value)}><option value="TODAS">Todas</option>{categories.map(item=><option key={item}>{item}</option>)}</select></label>
      <label>Estilo<select value={style} onChange={event=>setStyle(event.target.value)}><option value="TODOS">Todos</option>{styles.map(item=><option key={item} value={item}>{styleLabel(item)}</option>)}</select></label>
      <label>Formação<select value={formation} onChange={event=>setFormation(event.target.value)}><option value="TODAS">Todas</option>{formations.map(item=><option key={item}>{item}</option>)}</select></label>
      <label>Cenário<select value={scenario} onChange={event=>setScenario(event.target.value)}><option value="TODOS">Todos</option>{scenarios.map(item=><option key={item}>{item}</option>)}</select></label>
    </div>
    <div className="meta-result-count">{filtered.length} ficha(s) entre as 36 melhores distribuições competitivas.</div>
    <div className="variant-grid meta-build-grid">{filtered.map(item=><button type="button" key={item.id} className={`meta-build-option ${active?.id===item.id?'active':''}`} onClick={()=>setSelected(item.id)}>
      <strong>#{item.rank} • {item.category}</strong><span>{item.formation} • {styleLabel(item.style)} • {item.scenario}</span><em>{summary(item)}</em>
      <p>Nota {item.score}/100 • identidade {item.identityScore} • eficiência {item.efficiencyScore} • individualidade {item.individualityScore}</p><small>{item.bestUse}</small>{item.risks[0]&&<b>⚠ {item.risks[0]}</b>}
    </button>)}</div>
    {!filtered.length&&<p className="panel-note">Nenhuma das 36 melhores fichas corresponde a todos esses filtros. Remova um filtro para ampliar a busca.</p>}
    <details className="settings-details-card"><summary>Melhores fichas por categoria</summary><div className="dna-goal-list">{universe.bestByCategory.map(item=><div key={`cat-${item.id}`}><strong>{item.category}</strong><span>{summary(item)}</span><em>Nota {item.score}/100 • {item.formation} • {item.scenario}</em><small>{item.whyItWon}</small></div>)}</div></details>
    <details className="settings-details-card"><summary>Base oficial e tendências comunitárias</summary><div className="skill-grid"><div className="skill-check-card"><strong>Mecânicas oficiais</strong>{universe.officialMechanics.map(item=><span key={item}>✓ {item}</span>)}</div><div className="skill-check-card"><strong>Tendências editáveis</strong>{universe.communityTrends.map(item=><span key={item}>• {item}</span>)}</div></div>{universe.safeguards.map(item=><p key={item} className="panel-note">• {item}</p>)}</details>
  </article>;
}
