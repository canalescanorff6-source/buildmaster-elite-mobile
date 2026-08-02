'use client';

import {
  BarChart3,
  ChevronRight,
  Cloud,
  Crown,
  FilePlus2,
  Heart,
  History,
  ImagePlus,
  LifeBuoy,
  LogOut,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserRoundCog,
  Users
} from 'lucide-react';

type MenuTarget =
  | 'players'
  | 'manual'
  | 'reader'
  | 'team'
  | 'matches'
  | 'settings'
  | 'accounts'
  | 'backup'
  | 'updates'
  | 'support'
  | 'search';

type Props = {
  username: string;
  role: string;
  playerCount: number;
  favoriteCount: number;
  level?: number;
  onNavigate: (target: MenuTarget) => void;
  onLogout: () => void;
};

const modules = [
  { target: 'players', icon: Users, title: 'Jogadores', detail: 'Gerencie e analise atletas' },
  { target: 'manual', icon: FilePlus2, title: 'Nova Ficha', detail: 'Crie fichas de jogadores' },
  { target: 'reader', icon: ImagePlus, title: 'Usar Imagem', detail: 'Importe, recorte e leia cartas' },
  { target: 'team', icon: Target, title: 'Meu Time', detail: 'Monte e gerencie seu elenco' },
  { target: 'team', icon: Sparkles, title: 'Formações', detail: 'Táticas e funções por posição' },
  { target: 'matches', icon: Trophy, title: 'Partidas e Treinos', detail: 'Valide o desempenho real' },
  { target: 'team', icon: BarChart3, title: 'Estúdio Tático', detail: 'Diagnóstico e planos de jogo' },
  { target: 'players', icon: History, title: 'Histórico', detail: 'Acompanhe fichas e alterações' }
] as const;

export function PremiumMenuScreen({ username, role, playerCount, favoriteCount, level = 31, onNavigate, onLogout }: Props) {
  return (
    <section className="bm32-menu-screen" aria-label="Menu">
      <header className="bm32-screen-heading">
        <div className="bm32-heading-icon"><Settings2 size={27}/></div>
        <div><h1>Menu</h1><p>Acesso rápido a todos os módulos do Marques Fichas.</p></div>
        <div className="bm32-heading-actions">
          <button type="button" onClick={() => onNavigate('search')} aria-label="Buscar"><Search size={21}/></button>
          <span className="bm32-elite-badge"><Crown size={17}/> ELITE</span>
        </div>
      </header>

      <section className="bm32-profile-banner">
        <div className="bm32-profile-shield"><span>BM</span><small>ELITE</small></div>
        <div className="bm32-profile-copy">
          <h2>Marques Fichas</h2>
          <span className="bm32-plan-badge"><Crown size={15}/> Plano Elite</span>
          <p><strong>{username}</strong> • {role === 'admin' ? 'Administrador' : 'Acesso completo'}</p>
          <small>{playerCount} jogador(es) • {favoriteCount} favorito(s)</small>
        </div>
        <div className="bm32-level-badge"><small>NÍVEL</small><strong>{level}</strong><i><b style={{ width: '69%' }}/></i><span>12.450 / 18.000 XP</span></div>
      </section>

      <section className="bm32-menu-section">
        <h2>Módulos principais</h2>
        <div className="bm32-module-grid">
          {modules.map(({ target, icon: Icon, title, detail }) => (
            <button type="button" key={`${target}-${title}`} onClick={() => onNavigate(target)}>
              <span><Icon size={25}/></span><div><strong>{title}</strong><small>{detail}</small></div><ChevronRight size={21}/>
            </button>
          ))}
        </div>
      </section>

      <section className="bm32-menu-section">
        <h2>Ferramentas</h2>
        <div className="bm32-tool-grid">
          <button type="button" onClick={() => onNavigate('backup')}><Cloud size={23}/><div><strong>Backup</strong><small>Salve e sincronize seus dados</small></div><ChevronRight size={19}/></button>
          <button type="button" onClick={() => onNavigate('updates')}><RefreshCcw size={23}/><div><strong>Atualizações</strong><small>Novidades e melhorias</small></div><ChevronRight size={19}/></button>
          <button type="button" onClick={() => onNavigate('support')}><LifeBuoy size={23}/><div><strong>Suporte</strong><small>Ajuda, diagnóstico e contato</small></div><ChevronRight size={19}/></button>
        </div>
      </section>

      <section className="bm32-menu-section">
        <h2>Atalhos</h2>
        <div className="bm32-shortcut-grid">
          <button type="button" onClick={() => onNavigate('players')}><Heart size={20}/><strong>Favoritos</strong><small>{favoriteCount} jogadores</small></button>
          <button type="button" onClick={() => onNavigate('players')}><ShieldCheck size={20}/><strong>Comparar</strong><small>Atletas lado a lado</small></button>
          <button type="button" onClick={() => onNavigate('matches')}><BarChart3 size={20}/><strong>Relatórios</strong><small>Desempenho e dados</small></button>
          <button type="button" onClick={() => onNavigate('settings')}><UserRoundCog size={20}/><strong>Configurações</strong><small>Conta e preferências</small></button>
        </div>
      </section>

      <section className="bm32-plan-callout"><Crown size={28}/><div><strong>Você está no plano Elite</strong><span>Aproveite todos os recursos premium do Marques Fichas.</span></div><button type="button" onClick={() => onNavigate('accounts')}>Ver benefícios <ChevronRight size={18}/></button></section>
      <button type="button" className="bm32-logout-button" onClick={onLogout}><LogOut size={18}/> Sair da conta</button>
    </section>
  );
}
