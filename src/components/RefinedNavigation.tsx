'use client';

import { ChevronRight, LayoutDashboard, Search, SlidersHorizontal, Target, Trophy, Users } from 'lucide-react';
import type { MainNavigationGroup, PlayerWorkspace } from '@/lib/appRefinement';

type Props = {
  group: MainNavigationGroup;
  workspace: PlayerWorkspace;
  hasResult: boolean;
  onGroupChange: (group: MainNavigationGroup) => void;
  onWorkspaceChange: (workspace: PlayerWorkspace) => void;
  onSearch: () => void;
};

const groups: Array<{ id: MainNavigationGroup; label: string; hint: string; icon: typeof LayoutDashboard }> = [
  { id: 'inicio', label: 'Início', hint: 'Resumo e próxima ação', icon: LayoutDashboard },
  { id: 'jogadores', label: 'Jogadores', hint: 'Leitura, ficha e Cofre', icon: Users },
  { id: 'time', label: 'Meu Time', hint: 'Elenco, escalação e tática', icon: Target },
  { id: 'partidas', label: 'Partidas', hint: 'Treino, jogo e evolução', icon: Trophy },
  { id: 'ajustes', label: 'Ajustes', hint: 'Conta, dados e aplicativo', icon: SlidersHorizontal }
];

const workspaces: Array<{ id: PlayerWorkspace; label: string; description: string }> = [
  { id: 'visao-geral', label: 'Visão geral', description: 'Banco integrado' },
  { id: 'leitor', label: 'Ler print', description: 'OCR guiado' },
  { id: 'manual', label: 'Manual Pro', description: 'Preenchimento controlado' },
  { id: 'resultado', label: 'Ficha atual', description: 'Resultado e fontes' },
  { id: 'cofre', label: 'Cofre', description: 'Organizar e proteger' }
];

export function RefinedNavigation({ group, workspace, hasResult, onGroupChange, onWorkspaceChange, onSearch }: Props) {
  return <>
    <nav className="refined-primary-nav luxury-panel" aria-label="Navegação principal">
      <div className="refined-brand"><span>BM</span><div><strong>BuildMaster</strong><small>Elite Tático</small></div></div>
      <div className="refined-nav-groups">
        {groups.map((item) => {
          const Icon = item.icon;
          return <button type="button" key={item.id} className={group === item.id ? 'active' : ''} aria-current={group === item.id ? 'page' : undefined} onClick={() => onGroupChange(item.id)}>
            <Icon size={19}/><span><strong>{item.label}</strong><small>{item.hint}</small></span>
          </button>;
        })}
      </div>
      <button type="button" className="refined-global-search" onClick={onSearch}><Search size={18}/><span><strong>Buscar</strong><small>Jogador, ficha ou módulo</small></span></button>
    </nav>

    {group === 'jogadores' && <nav className="refined-workspace-nav luxury-panel" aria-label="Áreas de Jogadores">
      {workspaces.map((item, index) => <button type="button" key={item.id} className={workspace === item.id ? 'active' : ''} aria-current={workspace === item.id ? 'page' : undefined} disabled={item.id === 'resultado' && !hasResult} onClick={() => onWorkspaceChange(item.id)}>
        <span>{index + 1}</span><div><strong>{item.label}</strong><small>{item.description}</small></div>{index < workspaces.length - 1 && <ChevronRight size={15}/>} 
      </button>)}
    </nav>}

    <nav className="refined-mobile-nav" aria-label="Navegação inferior">
      {groups.map((item) => {
        const Icon = item.icon;
        return <button type="button" key={item.id} className={group === item.id ? 'active' : ''} aria-current={group === item.id ? 'page' : undefined} onClick={() => onGroupChange(item.id)}><Icon size={20}/><span>{item.label}</span></button>;
      })}
    </nav>
  </>;
}
