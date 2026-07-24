'use client';

import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  LayoutDashboard,
  Menu,
  Plus,
  ScanText,
  Search,
  ShieldCheck,
  Settings2,
  SlidersHorizontal,
  Target,
  Trophy,
  Users,
  X
} from 'lucide-react';
import type { MainNavigationGroup, PlayerWorkspace } from '@/lib/appRefinement';
import { safeStorageGet, safeStorageSet } from '@/lib/safeLocalStorage';
import { PremiumBrand } from '@/components/PremiumBrand';

const NAV_COLLAPSED_KEY = 'buildmaster_navigation_collapsed_v2810';

type Props = {
  group: MainNavigationGroup;
  workspace: PlayerWorkspace;
  hasResult: boolean;
  onGroupChange: (group: MainNavigationGroup) => void;
  onWorkspaceChange: (workspace: PlayerWorkspace) => void;
  onSearch: () => void;
  onCreate: () => void;
};

type NavItem = {
  id: MainNavigationGroup;
  label: string;
  hint: string;
  icon: typeof LayoutDashboard;
  section: 'principal' | 'sistema';
};

const groups: NavItem[] = [
  { id: 'inicio', label: 'Visão geral', hint: 'Resumo e próxima ação', icon: LayoutDashboard, section: 'principal' },
  { id: 'jogadores', label: 'Jogadores', hint: 'Leitura, fichas e Cofre', icon: Users, section: 'principal' },
  { id: 'time', label: 'Meu Time', hint: 'Elenco, escalação e tática', icon: Target, section: 'principal' },
  { id: 'partidas', label: 'Performance', hint: 'Partidas, treinos e evolução', icon: Trophy, section: 'principal' },
  { id: 'ajustes', label: 'Sistema', hint: 'Conta, backup e aplicativo', icon: SlidersHorizontal, section: 'sistema' }
];

const workspaces: Array<{ id: PlayerWorkspace; label: string; description: string; icon: typeof LayoutDashboard }> = [
  { id: 'visao-geral', label: 'Central', description: 'Todos os jogadores', icon: LayoutDashboard },
  { id: 'leitor', label: 'Leitor', description: 'Importar e reconhecer', icon: ScanText },
  { id: 'manual', label: 'Manual Pro', description: 'Preencher com controle', icon: ShieldCheck },
  { id: 'resultado', label: 'Ficha atual', description: 'Revisar e evoluir', icon: FileText },
  { id: 'cofre', label: 'Cofre', description: 'Organizar e proteger', icon: History }
];

function readCollapsedPreference() {
  if (typeof window === 'undefined') return false;
  try {
    return safeStorageGet(NAV_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function saveCollapsedPreference(collapsed: boolean) {
  try {
    safeStorageSet(NAV_COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    // A preferência visual não pode bloquear a navegação.
  }
}

export function RefinedNavigation({ group, workspace, hasResult, onGroupChange, onWorkspaceChange, onSearch, onCreate }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const stored = readCollapsedPreference();
    setCollapsed(stored);
    document.body.classList.toggle('bm-nav-collapsed', stored);
    return () => document.body.classList.remove('bm-nav-collapsed');
  }, []);

  useEffect(() => {
    document.body.classList.toggle('bm-nav-collapsed', collapsed);
  }, [collapsed]);

  useEffect(() => {
    if (!moreOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [moreOpen]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      saveCollapsedPreference(next);
      return next;
    });
  }

  function openGroup(next: MainNavigationGroup) {
    onGroupChange(next);
    setMoreOpen(false);
  }

  return <>
    <aside className={`bm28-navigation-rail${collapsed ? ' is-collapsed' : ''}`} aria-label="Navegação principal">
      <div className="bm28-navigation-brand">
        <PremiumBrand variant="compact" />
        <button type="button" className="bm28-navigation-collapse" onClick={toggleCollapsed} aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'} title={collapsed ? 'Expandir menu' : 'Recolher menu'}>
          {collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
        </button>
      </div>

      <button type="button" className="bm28-navigation-create" onClick={onCreate}>
        <span><Plus size={20}/></span><div><strong>Nova ficha</strong><small>Print ou Manual Pro</small></div>
      </button>

      <div className="bm28-navigation-section">
        <small className="bm28-navigation-label">Principal</small>
        {groups.filter((item) => item.section === 'principal').map((item) => {
          const Icon = item.icon;
          const active = group === item.id;
          return <button type="button" key={item.id} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={() => openGroup(item.id)} title={collapsed ? item.label : undefined}>
            <span className="bm28-navigation-icon"><Icon size={20}/></span>
            <span className="bm28-navigation-copy"><strong>{item.label}</strong><small>{item.hint}</small></span>
            {!collapsed && active && <ChevronRight size={16} aria-hidden="true"/>}
          </button>;
        })}
      </div>

      <div className="bm28-navigation-section bm28-navigation-system">
        <small className="bm28-navigation-label">Sistema</small>
        {groups.filter((item) => item.section === 'sistema').map((item) => {
          const Icon = item.icon;
          const active = group === item.id;
          return <button type="button" key={item.id} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={() => openGroup(item.id)} title={collapsed ? item.label : undefined}>
            <span className="bm28-navigation-icon"><Icon size={20}/></span>
            <span className="bm28-navigation-copy"><strong>{item.label}</strong><small>{item.hint}</small></span>
            {!collapsed && active && <ChevronRight size={16} aria-hidden="true"/>}
          </button>;
        })}
        <button type="button" onClick={onSearch} title={collapsed ? 'Buscar' : undefined}>
          <span className="bm28-navigation-icon"><Search size={20}/></span>
          <span className="bm28-navigation-copy"><strong>Buscar</strong><small>Jogador, ficha ou ferramenta</small></span>
          {!collapsed && <kbd>Ctrl K</kbd>}
        </button>
      </div>

      <div className="bm28-navigation-footer">
        <span className="bm28-navigation-secure"><Settings2 size={16}/><b>Ambiente protegido</b></span>
        <small>Dados locais e conta isolada</small>
      </div>
    </aside>

    {group === 'jogadores' && <nav className="bm28-workspace-tabs" aria-label="Áreas de Jogadores">
      <div className="bm28-workspace-tabs-track">
        {workspaces.map((item) => {
          const Icon = item.icon;
          const active = workspace === item.id;
          return <button type="button" key={item.id} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} disabled={item.id === 'resultado' && !hasResult} onClick={() => onWorkspaceChange(item.id)}>
            <span><Icon size={17}/></span><div><strong>{item.label}</strong><small>{item.description}</small></div>
          </button>;
        })}
      </div>
    </nav>}

    <nav className="bm28-mobile-navigation" aria-label="Navegação inferior">
      <button type="button" className={group === 'inicio' ? 'active' : ''} aria-current={group === 'inicio' ? 'page' : undefined} onClick={() => openGroup('inicio')}><LayoutDashboard size={21}/><span>Início</span></button>
      <button type="button" className={group === 'jogadores' ? 'active' : ''} aria-current={group === 'jogadores' ? 'page' : undefined} onClick={() => openGroup('jogadores')}><Users size={21}/><span>Jogadores</span></button>
      <button type="button" className="bm28-mobile-create" onClick={onCreate} aria-label="Criar nova ficha"><span><Plus size={25}/></span><b>Criar</b></button>
      <button type="button" className={group === 'time' ? 'active' : ''} aria-current={group === 'time' ? 'page' : undefined} onClick={() => openGroup('time')}><Target size={21}/><span>Meu Time</span></button>
      <button type="button" className={group === 'partidas' || group === 'ajustes' ? 'active' : ''} aria-expanded={moreOpen} onClick={() => setMoreOpen(true)}><Menu size={22}/><span>Mais</span></button>
    </nav>

    {moreOpen && <div className="bm28-mobile-more-backdrop" role="presentation" onClick={() => setMoreOpen(false)}>
      <section className="bm28-mobile-more-sheet" role="dialog" aria-modal="true" aria-label="Mais áreas" onClick={(event) => event.stopPropagation()}>
        <header><div><span><Menu size={18}/></span><div><strong>Mais áreas</strong><small>Acesse performance e sistema</small></div></div><button type="button" onClick={() => setMoreOpen(false)} aria-label="Fechar"><X size={20}/></button></header>
        <div className="bm28-mobile-more-grid">
          <button type="button" className={group === 'partidas' ? 'active' : ''} onClick={() => openGroup('partidas')}><span><Trophy size={22}/></span><div><strong>Performance</strong><small>Partidas, treinos e evolução</small></div><ChevronRight size={17}/></button>
          <button type="button" className={group === 'ajustes' ? 'active' : ''} onClick={() => openGroup('ajustes')}><span><SlidersHorizontal size={22}/></span><div><strong>Sistema</strong><small>Conta, backup e atualização</small></div><ChevronRight size={17}/></button>
          <button type="button" onClick={() => { onSearch(); setMoreOpen(false); }}><span><Search size={22}/></span><div><strong>Buscar no app</strong><small>Encontre qualquer função</small></div><ChevronRight size={17}/></button>
        </div>
        <button type="button" className="bm28-mobile-more-back" onClick={() => setMoreOpen(false)}><ChevronLeft size={17}/> Voltar ao aplicativo</button>
      </section>
    </div>}
  </>;
}
