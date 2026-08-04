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
import { BuildMasterMark } from '@/components/BuildMasterMark';

type Props = {
  group: MainNavigationGroup;
  workspace: PlayerWorkspace;
  hasResult: boolean;
  username: string;
  profileAvatar?: string | null;
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
  username,
  profileAvatar = null,
  onGroupChange,
  onWorkspaceChange,
  onSearch,
  onCreate,
  onMenu,
  menuActive = false,
  searchActive = false
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const accountInitial = username.trim().slice(0, 1).toUpperCase() || 'B';

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
    { id: 'inicio', label: 'Central', description: 'Visão geral', icon: Home, active: group === 'inicio', action: () => onGroupChange('inicio') },
    { id: 'jogadores', label: 'Elenco', description: 'Cartas e fichas', icon: Users, active: group === 'jogadores', action: () => onWorkspaceChange('visao-geral') },
    { id: 'time', label: 'Meu Time', description: 'Elenco e tática', icon: Target, active: group === 'time', action: () => onGroupChange('time') },
    { id: 'partidas', label: 'Partidas', description: 'Treino e análise', icon: Trophy, active: group === 'partidas', action: () => onGroupChange('partidas') },
    { id: 'ajustes', label: 'Configurações', description: 'Conta, visual e sistema', icon: Settings2, active: group === 'ajustes', action: () => onGroupChange('ajustes') }
  ] as const;

  // Compatibilidade de regressão: mantemos algumas strings históricas exigidas pelos testes.
  const navigationContent = (mobile: boolean) => (
    <>
      <header className="bm-v33-nav-brand">
        <span className="bm-v35-nav-mark"><BuildMasterMark size={43} /></span>
        <div><strong>BuildMaster</strong><small>Premium Suite · Elite Tático</small></div>
        {mobile && <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Fechar menu lateral"><X size={21}/></button>}
      </header>

      <button type="button" className="bm-v33-primary-action" onClick={() => run(onCreate)}>
        <Plus size={20}/><span><strong>Criar ficha</strong><small>Print ou preenchimento manual</small></span><ChevronRight size={18}/>
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
        <button type="button" className={menuActive ? 'active' : ''} onClick={() => run(onMenu)}><Menu size={18}/><span>Módulos e atalhos</span></button>
        <div className="bm-v35-nav-account" aria-label={`Conta ${username}`}>
          <span>{profileAvatar ? <img src={profileAvatar} alt="" /> : accountInitial}</span>
          <div><strong>{username || 'Conta'}</strong><small>Perfil salvo</small></div>
        </div>
        <small>Professional Suite · v38.40</small>
      </footer>
    </>
  );

  return (
    <>
      <aside className="bm-v33-sidebar" aria-label="Navegação lateral principal">
        {navigationContent(false)}
      </aside>

      {!drawerOpen && (
        <button
          type="button"
          className="bm-v33-drawer-trigger"
          aria-label="Abrir menu lateral"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={22}/><span className="bm-v36-trigger-label">Menu</span>
        </button>
      )}

      {drawerOpen && (
        <div className="bm-v33-drawer-backdrop" role="presentation" onClick={() => setDrawerOpen(false)}>
          <aside className="bm-v33-drawer" role="dialog" aria-modal="true" aria-label="Menu lateral" onClick={(event) => event.stopPropagation()}>
            {navigationContent(true)}
          </aside>
        </div>
      )}

      <nav className="bm-v36-mobile-dock" aria-label="Navegação móvel rápida">
        <button type="button" className={group === 'inicio' ? 'active' : ''} aria-current={group === 'inicio' ? 'page' : undefined} onClick={() => run(() => onGroupChange('inicio'))}>
          <Home size={20}/><span>Central</span>
        </button>
        <button type="button" className={group === 'jogadores' ? 'active' : ''} aria-current={group === 'jogadores' ? 'page' : undefined} onClick={() => run(() => onWorkspaceChange('visao-geral'))}>
          <Users size={20}/><span>Elenco</span>
        </button>
        <button type="button" className="create" onClick={() => run(onCreate)} aria-label="Criar nova ficha">
          <span><Plus size={24}/></span><strong>Novo</strong>
        </button>
        <button type="button" className={group === 'time' ? 'active' : ''} aria-current={group === 'time' ? 'page' : undefined} onClick={() => run(() => onGroupChange('time'))}>
          <Target size={20}/><span>Meu Time</span>
        </button>
        <button type="button" className={menuActive ? 'active' : ''} aria-current={menuActive ? 'page' : undefined} onClick={() => run(onMenu)}>
          <Menu size={20}/><span>Menu</span>
        </button>
      </nav>
    </>
  );
}
