'use client';

import {
  FileText,
  Home,
  LayoutTemplate,
  Menu,
  Plus,
  ScanText,
  Search,
  Settings2,
  ShieldCheck,
  Target,
  Trophy,
  Users
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

const playerSteps: Array<{ id: PlayerWorkspace; label: string; icon: typeof Users; requiresResult?: boolean }> = [
  { id: 'visao-geral', label: 'Meus jogadores', icon: Users },
  { id: 'leitor', label: 'Usar imagem', icon: ScanText },
  { id: 'manual', label: 'Nova ficha', icon: ShieldCheck },
  { id: 'resultado', label: 'Ficha final', icon: FileText, requiresResult: true }
];

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
  return (
    <>
      <aside className="bm-simple-sidebar" aria-label="Navegação principal">
        <div className="bm-simple-sidebar-brand">
          <span>M</span><div><strong>Marques Fichas</strong><small>Inteligência tática</small></div>
        </div>
        <button type="button" className="bm-simple-sidebar-create" onClick={onCreate}>
          <Plus size={20} /><span><strong>Nova ficha</strong><small>Imagem ou manual</small></span>
        </button>
        <nav>
          <button type="button" className={group === 'inicio' ? 'active' : ''} onClick={() => onGroupChange('inicio')}><Home size={20}/><span>Início</span></button>
          <button type="button" className={group === 'jogadores' ? 'active' : ''} onClick={() => onGroupChange('jogadores')}><Users size={20}/><span>Jogadores</span></button>
          <button type="button" className={group === 'time' ? 'active' : ''} onClick={() => onGroupChange('time')}><Target size={20}/><span>Meu Time</span></button>
          <button type="button" className={group === 'formacoes' ? 'active' : ''} onClick={() => onGroupChange('formacoes')}><LayoutTemplate size={20}/><span>Formações</span></button>
          <button type="button" className={group === 'partidas' ? 'active' : ''} onClick={() => onGroupChange('partidas')}><Trophy size={20}/><span>Partidas</span></button>
          <button type="button" className={group === 'ajustes' ? 'active' : ''} onClick={() => onGroupChange('ajustes')}><Settings2 size={20}/><span>Configurações</span></button>
          <button type="button" className={menuActive ? 'active' : ''} onClick={onMenu}><Menu size={20}/><span>Menu</span></button>
        </nav>
        <button type="button" className={`bm-simple-sidebar-search ${searchActive ? 'active' : ''}`} onClick={onSearch}><Search size={19}/><span>Buscar no app</span></button>
      </aside>

      {group === 'jogadores' && (
        <nav className="bm-simple-player-tabs" aria-label="Etapas de jogadores">
          {playerSteps.map((item) => {
            const Icon = item.icon;
            const active = workspace === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={active ? 'active' : ''}
                disabled={Boolean(item.requiresResult && !hasResult)}
                onClick={() => onWorkspaceChange(item.id)}
              >
                <Icon size={17}/><span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      <nav className="bm-simple-mobile-nav" aria-label="Navegação inferior">
        <button type="button" className={group === 'jogadores' && workspace === 'visao-geral' ? 'active' : ''} onClick={() => onGroupChange('jogadores')}><Users size={22}/><span>Jogadores</span></button>
        <button type="button" className={group === 'jogadores' && workspace === 'manual' ? 'active' : ''} onClick={() => onWorkspaceChange('manual')}><FileText size={22}/><span>Nova Ficha</span></button>
        <button type="button" className={group === 'jogadores' && workspace === 'leitor' ? 'active' : ''} onClick={() => onWorkspaceChange('leitor')}><ScanText size={22}/><span>Usar Imagem</span></button>
        <button type="button" className={group === 'time' ? 'active' : ''} onClick={() => onGroupChange('time')}><Target size={22}/><span>Meu Time</span></button>
        <button type="button" className={group === 'formacoes' ? 'active' : ''} onClick={() => onGroupChange('formacoes')}><LayoutTemplate size={22}/><span>Formações</span></button>
        <button type="button" className={menuActive ? 'active' : ''} onClick={onMenu}><Menu size={23}/><span>Menu</span></button>
      </nav>
    </>
  );
}
