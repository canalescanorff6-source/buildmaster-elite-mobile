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
  { target: 'players', icon: Users, title: 'Jogadores', detail: 'Banco, análise e comparação' },
  { target: 'manual', icon: FilePlus2, title: 'Criar manual', detail: 'Monte fichas sem usar print' },
  { target: 'reader', icon: ImagePlus, title: 'Ler print', detail: 'Importe, recorte e leia a carta' },
  { target: 'team', icon: Target, title: 'Meu Time', detail: 'Formação, elenco e funções' },
  { target: 'team', icon: Sparkles, title: 'Formações', detail: 'Táticas meta e funções' },
  { target: 'matches', icon: Trophy, title: 'Partidas e treinos', detail: 'Validação real de desempenho' },
  { target: 'team', icon: BarChart3, title: 'Estúdio tático', detail: 'Diagnóstico, setores e planos' },
  { target: 'players', icon: History, title: 'Histórico', detail: 'Fichas salvas e alterações' }
] as const;

export function PremiumMenuScreen({ username, role, playerCount, favoriteCount, level = 31, onNavigate, onLogout }: Props) {
  return (
    <section className="bm32-menu-screen" aria-label="Menu">
      <header className="bm32-screen-heading">
        <div className="bm32-heading-icon"><Settings2 size={27}/></div>
        <div><h1>Menu</h1><p>Atalhos para as áreas principais do BuildMaster.</p></div>
        <div className="bm32-heading-actions">
          <button type="button" onClick={() => onNavigate('search')} aria-label="Buscar"><Search size={21}/></button>
          <span className="bm32-elite-badge"><Crown size={17}/> ELITE</span>
        </div>
      </header>

      <section className="bm32-profile-banner">
        <div className="bm32-profile-shield"><span>BM</span><small>ELITE</small></div>
        <div className="bm32-profile-copy">
          <h2>BuildMaster Elite Tático</h2>
          <span className="bm32-plan-badge"><Crown size={15}/> Plano Elite</span>
          <p><strong>{username}</strong> • {role === 'admin' ? 'Administrador' : 'Acesso completo'}</p>
          <small>{playerCount} jogador(es) • {favoriteCount} favorito(s)</small>
        </div>
        <div className="bm32-level-badge"><small>NÍVEL</small><strong>{level}</strong><i><b style={{ width: '69%' }}/></i><span>12.450 / 18.000 XP</span></div>
      </section>

      <section className="bm32-menu-section">
        <h2>Principais áreas</h2>
        <div className="bm32-module-grid">
          {modules.map(({ target, icon: Icon, title, detail }) => (
            <button type="button" key={`${target}-${title}`} onClick={() => onNavigate(target)}>
              <span><Icon size={25}/></span><div><strong>{title}</strong><small>{detail}</small></div><ChevronRight size={21}/>
            </button>
          ))}
        </div>
      </section>

      <section className="bm32-menu-section">
        <h2>Ferramentas do sistema</h2>
        <div className="bm32-tool-grid">
          <button type="button" onClick={() => onNavigate('backup')}><Cloud size={23}/><div><strong>Backup</strong><small>Salvar, exportar e restaurar</small></div><ChevronRight size={19}/></button>
          <button type="button" onClick={() => onNavigate('updates')}><RefreshCcw size={23}/><div><strong>Atualizações</strong><small>Versão, APK e novidades</small></div><ChevronRight size={19}/></button>
          <button type="button" onClick={() => onNavigate('support')}><LifeBuoy size={23}/><div><strong>Suporte</strong><small>Ajuda, diagnóstico e suporte técnico</small></div><ChevronRight size={19}/></button>
        </div>
      </section>

      <section className="bm32-menu-section">
        <h2>Atalhos úteis</h2>
        <div className="bm32-shortcut-grid">
          <button type="button" onClick={() => onNavigate('players')}><Heart size={20}/><strong>Favoritos</strong><small>{favoriteCount} jogador(es)</small></button>
          <button type="button" onClick={() => onNavigate('players')}><ShieldCheck size={20}/><strong>Comparar</strong><small>Jogadores lado a lado</small></button>
          <button type="button" onClick={() => onNavigate('matches')}><BarChart3 size={20}/><strong>Relatórios</strong><small>Desempenho, erros e dados</small></button>
          <button type="button" onClick={() => onNavigate('settings')}><UserRoundCog size={20}/><strong>Configurações</strong><small>Conta e preferências</small></button>
        </div>
      </section>

      <section className="bm32-plan-callout"><Crown size={28}/><div><strong>Plano Elite ativo</strong><span>Use todos os recursos premium do BuildMaster.</span></div><button type="button" onClick={() => onNavigate('accounts')}>Ver benefícios <ChevronRight size={18}/></button></section>
      <button type="button" className="bm32-logout-button" onClick={onLogout}><LogOut size={18}/> Sair da conta</button>
    </section>
  );
}
