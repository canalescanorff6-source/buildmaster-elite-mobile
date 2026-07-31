'use client';

import { useEffect, useState } from 'react';
import {
  ChevronRight,
  FileText,
  Home,
  Menu,
  Plus,
  Search,
  Settings2,
  Target,
  Trophy,
  Users,
  X
} from 'lucide-react';
import type { MainNavigationGroup, PlayerWorkspace } from '@/lib/appRefinement';

type Props = {
  group: MainNavigationGroup;
  workspace: PlayerWorkspace;
  hasResult: boolean;
  onGroupChange: (group: MainNavigationGroup) => void;
  onWorkspaceChange: (workspace: PlayerWorkspace) => void;
  onSearch: () => void;
  onCreate: () => void;
  onMenu: () => void;
  menuActive?: boolean;
  searchActive?: boolean;
};

type NavigationAction = () => void;



export function RefinedNavigation({
  group,
  workspace,
  hasResult,
  onGroupChange,
  onWorkspaceChange,
  onSearch,
  onCreate,
  onMenu,
  menuActive = false,
  searchActive = false
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [group, workspace, menuActive, searchActive]);

  useEffect(() => {
    if (!drawerOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [drawerOpen]);

  function run(action: NavigationAction) {
    setDrawerOpen(false);
    action();
  }

  const mainItems = [
    { id: 'inicio', label: 'Início', description: 'Visão geral', icon: Home, active: group === 'inicio', action: () => onGroupChange('inicio') },
    { id: 'jogadores', label: 'Jogadores', description: 'Cartas e fichas', icon: Users, active: group === 'jogadores', action: () => onWorkspaceChange('visao-geral') },
    { id: 'time', label: 'Meu Time', description: 'Elenco e tática', icon: Target, active: group === 'time', action: () => onGroupChange('time') },
    { id: 'partidas', label: 'Partidas', description: 'Treino e análise', icon: Trophy, active: group === 'partidas', action: () => onGroupChange('partidas') },
    { id: 'ajustes', label: 'Configurações', description: 'Conta e sistema', icon: Settings2, active: group === 'ajustes', action: () => onGroupChange('ajustes') }
  ] as const;

  const navigationContent = (mobile: boolean) => (
    <>
      <header className="bm-v33-nav-brand">
        <span>BM</span>
        <div><strong>BuildMaster</strong><small>Elite Tático · v34</small></div>
        {mobile && <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Fechar menu lateral"><X size={21}/></button>}
      </header>

      <button type="button" className="bm-v33-primary-action" onClick={() => run(onCreate)}>
        <Plus size={20}/><span><strong>Nova ficha</strong><small>Imagem ou manual</small></span><ChevronRight size={18}/>
      </button>

      <nav className="bm-v33-main-navigation" aria-label="Áreas principais">
        {mainItems.map((item) => {
          const Icon = item.icon;
          return (
            <button type="button" key={item.id} data-route={item.id} aria-current={item.active ? 'page' : undefined} className={item.active ? 'active' : ''} onClick={() => run(item.action)}>
              <span className="bm-v33-nav-icon"><Icon size={20}/></span>
              <span className="bm-v33-nav-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
              <ChevronRight size={17}/>
            </button>
          );
        })}
      </nav>

      <footer className="bm-v33-nav-footer">
        {hasResult && <button type="button" onClick={() => run(() => onWorkspaceChange('resultado'))}><FileText size={18}/><span>Abrir ficha atual</span></button>}
        <button type="button" className={searchActive ? 'active' : ''} onClick={() => run(onSearch)}><Search size={18}/><span>Buscar no aplicativo</span></button>
        <button type="button" className={menuActive ? 'active' : ''} onClick={() => run(onMenu)}><Menu size={18}/><span>Todos os módulos</span></button>
        <small>Studio Premium · v34.00</small>
      </footer>
    </>
  );

  return (
    <>
      <aside className="bm-v33-sidebar" aria-label="Navegação lateral principal">
        {navigationContent(false)}
      </aside>

      <button
        type="button"
        className="bm-v33-drawer-trigger"
        aria-label="Abrir menu lateral"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen(true)}
      >
        <Menu size={23}/><span>Menu</span>
      </button>

      {drawerOpen && (
        <div className="bm-v33-drawer-backdrop" role="presentation" onClick={() => setDrawerOpen(false)}>
          <aside className="bm-v33-drawer" role="dialog" aria-modal="true" aria-label="Menu lateral" onClick={(event) => event.stopPropagation()}>
            {navigationContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
