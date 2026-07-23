'use client';

import { FileText, ScanText, ShieldCheck, Sparkles, Target, Trophy } from 'lucide-react';
import type { EvolutionTarget } from '@/lib/appEvolutionV2740';

export function SmartQuickDock({ hasResult, pendingReviewCount, mainArea, onOpenTarget, onOpenCurrentResult }: { hasResult: boolean; pendingReviewCount: number; mainArea: string; onOpenTarget: (target: EvolutionTarget) => void; onOpenCurrentResult: () => void }) {
  const recommended = pendingReviewCount > 0
    ? { label: `Revisar ${pendingReviewCount} ficha(s)`, target: 'vault' as EvolutionTarget, icon: <ShieldCheck size={18}/> }
    : mainArea === 'partidas'
      ? { label: 'Organizar o time', target: 'team' as EvolutionTarget, icon: <Target size={18}/> }
      : { label: 'Ler nova carta', target: 'reader' as EvolutionTarget, icon: <ScanText size={18}/> };

  return <nav className="smart-quick-dock luxury-panel" aria-label="Atalhos inteligentes">
    <button type="button" className="dock-recommended" onClick={() => onOpenTarget(recommended.target)}><Sparkles size={16}/>{recommended.icon}<span>{recommended.label}</span></button>
    {hasResult && <button type="button" onClick={onOpenCurrentResult}><FileText size={18}/><span>Ficha atual</span></button>}
    <button type="button" onClick={() => onOpenTarget('matches')}><Trophy size={18}/><span>Partidas</span></button>
  </nav>;
}
