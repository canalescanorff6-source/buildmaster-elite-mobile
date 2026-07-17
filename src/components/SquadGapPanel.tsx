'use client';

import { AlertTriangle, Search, ShieldCheck } from 'lucide-react';
import type { TeamDiagnosis } from '@/modules/core/centralIntelligence';
import { detectSquadGaps } from '@/modules/squad/squadGapDetector';

export function SquadGapPanel({ team }: { team: TeamDiagnosis }) {
  const gaps = detectSquadGaps(team);
  return <article className="luxury-panel v27-gap-panel">
    <div className="v27-panel-heading"><div><p className="kicker"><Search size={14}/> Lacunas do elenco</p><h3>Qual perfil ainda falta</h3></div><span>{gaps.length}</span></div>
    {gaps.length ? <div className="v27-gap-list">{gaps.map((gap) => <div key={gap.id} className={`severity-${gap.severity}`}>
      <span>{gap.severity === 'critical' ? <AlertTriangle size={18}/> : <ShieldCheck size={18}/>}</span>
      <div><strong>{gap.slot} — {gap.missingFunction}</strong><p>{gap.why}</p><small>Estilos: {gap.idealStyles.join(' • ')}</small><em>Atributos: {gap.requiredAttributes.join(' • ')}</em></div>
    </div>)}</div> : <div className="v27-empty"><ShieldCheck size={25}/><strong>Sem lacuna crítica</strong><span>A formação possui cobertura mínima em todas as vagas.</span></div>}
  </article>;
}
