'use client';

import { useEffect, useState } from 'react';
import {
  ChevronRight,
  FileText,
  Home,
  Menu,
  Plus,
  ScanText,
  Search,
  Settings2,
  ShieldCheck,
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
};

const playerSteps: Array<{ id: PlayerWorkspace; label: string; icon: typeof Users; requiresResult?: boolean }> = [
  { id: 'visao-geral', label: 'Meus jogadores', icon: Users },
  { id: 'leitor', label: 'Ler print', icon: ScanText },
  { id: 'manual', label: 'Manual', icon: ShieldCheck },
  { id: 'resultado', label: 'Ficha final', icon: FileText, requiresResult: true }
];

export function RefinedNavigation({
  group,
  workspace,
  hasResult,
  onGroupChange,
  onWorkspaceChange,
  onSearch,
  onCreate
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  function openGroup(next: MainNavigationGroup) {
    onGroupChange(next);
    setMenuOpen(false);
  }

  return (
    <>
      <aside className="bm-simple-sidebar" aria-label="Navegação principal">
        <div className="bm-simple-sidebar-brand">
          <span>BM</span><div><strong>BuildMaster</strong><small>Elite Tático</small></div>
        </div>
        <button type="button" className="bm-simple-sidebar-create" onClick={onCreate}>
          <Plus size={20} /><span><strong>Nova ficha</strong><small>Print ou manual</small></span>
        </button>
        <nav>
          <button type="button" className={group === 'inicio' ? 'active' : ''} onClick={() => openGroup('inicio')}><Home size={20}/><span>Início</span></button>
          <button type="button" className={group === 'jogadores' ? 'active' : ''} onClick={() => openGroup('jogadores')}><Users size={20}/><span>Jogadores</span></button>
          <button type="button" className={group === 'time' ? 'active' : ''} onClick={() => openGroup('time')}><Target size={20}/><span>Meu Time</span></button>
          <button type="button" className={group === 'partidas' ? 'active' : ''} onClick={() => openGroup('partidas')}><Trophy size={20}/><span>Partidas</span></button>
          <button type="button" className={group === 'ajustes' ? 'active' : ''} onClick={() => openGroup('ajustes')}><Settings2 size={20}/><span>Ajustes</span></button>
        </nav>
        <button type="button" className="bm-simple-sidebar-search" onClick={onSearch}><Search size={19}/><span>Buscar no app</span></button>
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
        <button type="button" className={group === 'inicio' ? 'active' : ''} onClick={() => openGroup('inicio')}><Home size={22}/><span>Início</span></button>
        <button type="button" className={group === 'jogadores' ? 'active' : ''} onClick={() => openGroup('jogadores')}><Users size={22}/><span>Jogadores</span></button>
        <button type="button" className="create" onClick={onCreate}><span><Plus size={25}/></span><b>Nova ficha</b></button>
        <button type="button" className={group === 'time' ? 'active' : ''} onClick={() => openGroup('time')}><Target size={22}/><span>Meu Time</span></button>
        <button type="button" className={group === 'partidas' || group === 'ajustes' ? 'active' : ''} aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={23}/><span>Menu</span></button>
      </nav>

      {menuOpen && (
        <div className="bm-simple-menu-backdrop" role="presentation" onClick={() => setMenuOpen(false)}>
          <section className="bm-simple-menu-sheet" role="dialog" aria-modal="true" aria-label="Menu" onClick={(event) => event.stopPropagation()}>
            <header><div><strong>Menu</strong><small>Escolha uma área</small></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={21}/></button></header>
            <div>
              <button type="button" onClick={() => openGroup('partidas')}><Trophy size={22}/><span><strong>Partidas e treinos</strong><small>Avalie o que funcionou em campo</small></span><ChevronRight size={18}/></button>
              <button type="button" onClick={() => openGroup('ajustes')}><Settings2 size={22}/><span><strong>Ajustes</strong><small>Conta, backup, tema e atualização</small></span><ChevronRight size={18}/></button>
              <button type="button" onClick={() => { onSearch(); setMenuOpen(false); }}><Search size={22}/><span><strong>Buscar</strong><small>Encontre uma função rapidamente</small></span><ChevronRight size={18}/></button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
