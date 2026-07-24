'use client';

import { ArrowLeft, ChevronRight, FileText, Search } from 'lucide-react';
import type { MainNavigationGroup, PlayerWorkspace } from '@/lib/appRefinement';

type Props = {
  group: MainNavigationGroup;
  workspace: PlayerWorkspace;
  canGoBack: boolean;
  currentPlayer?: { name: string; points: string } | null;
  onBack: () => void;
  onSearch: () => void;
  onOpenCurrentPlayer: () => void;
};

const groupMeta: Record<MainNavigationGroup, { title: string; description: string }> = {
  inicio: { title: 'Visão geral', description: 'Prioridades, atalhos e saúde do seu trabalho.' },
  jogadores: { title: 'Jogadores', description: 'Leia cartas, construa fichas e organize o Cofre.' },
  time: { title: 'Meu Time', description: 'Elenco, formações, encaixes e planos táticos.' },
  partidas: { title: 'Performance', description: 'Partidas, treinos, validação e evolução real.' },
  ajustes: { title: 'Sistema', description: 'Conta, aparência, dados, backup e atualizações.' }
};

const workspaceMeta: Record<PlayerWorkspace, { title: string; description: string }> = {
  'visao-geral': { title: 'Central de jogadores', description: 'Seu banco unificado de cartas e fichas.' },
  leitor: { title: 'Leitor por print', description: 'Importe, reconheça e confira os dados da carta.' },
  manual: { title: 'Manual Pro', description: 'Preenchimento controlado com pontos exatos.' },
  resultado: { title: 'Ficha atual', description: 'Revise, compare, treine e exporte.' },
  cofre: { title: 'Cofre de jogadores', description: 'Organize, filtre, proteja e restaure fichas.' }
};

export function PremiumContextBar({ group, workspace, canGoBack, currentPlayer, onBack, onSearch, onOpenCurrentPlayer }: Props) {
  const section = group === 'jogadores' ? workspaceMeta[workspace] : groupMeta[group];
  return <section className="bm28-context-bar" aria-label="Contexto da área atual">
    <div className="bm28-context-main">
      {canGoBack && <button type="button" className="bm28-context-back" onClick={onBack} aria-label="Voltar para a área anterior"><ArrowLeft size={18}/></button>}
      <div className="bm28-context-copy">
        <nav aria-label="Caminho atual"><span>BuildMaster</span><ChevronRight size={13}/><span>{groupMeta[group].title}</span>{group === 'jogadores' && workspace !== 'visao-geral' && <><ChevronRight size={13}/><strong>{workspaceMeta[workspace].title}</strong></>}</nav>
        <h1>{section.title}</h1>
        <p>{section.description}</p>
      </div>
    </div>
    <div className="bm28-context-actions">
      {currentPlayer && group !== 'inicio' && <button type="button" className="bm28-context-player" onClick={onOpenCurrentPlayer}><FileText size={17}/><span><small>Ficha aberta</small><strong>{currentPlayer.name}</strong></span><b>{currentPlayer.points}</b></button>}
      <button type="button" className="bm28-context-search" onClick={onSearch}><Search size={18}/><span>Buscar</span><kbd>Ctrl K</kbd></button>
    </div>
  </section>;
}
