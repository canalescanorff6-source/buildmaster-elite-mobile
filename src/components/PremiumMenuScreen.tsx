'use client';

import {
  ChevronRight,
  FilePlus2,
  ImagePlus,
  LogOut,
  Settings2,
  Target,
  Trophy,
  Users
} from 'lucide-react';

type MenuTarget =
  | 'players'
  | 'manual'
  | 'reader'
  | 'mapping'
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
  { target: 'players', icon: Users, title: 'Jogadores', detail: 'Cartas, fichas, histórico e comparação' },
  { target: 'reader', icon: ImagePlus, title: 'Analisar carta', detail: 'Importe um print e gere a ficha' },
  { target: 'manual', icon: FilePlus2, title: 'Criar manual', detail: 'Preencha a carta sem usar print' },
  { target: 'team', icon: Target, title: 'Time', detail: 'Elenco, formações, funções e tática' },
  { target: 'matches', icon: Trophy, title: 'Partidas', detail: 'Validação real e evolução' },
  { target: 'settings', icon: Settings2, title: 'Configurações', detail: 'Conta, aparência, backup e atualizações' }
] as const;

export function PremiumMenuScreen({ username, role, playerCount, onNavigate, onLogout }: Props) {
  return (
    <section className="bm32-menu-screen" aria-label="Menu">
      <header className="bm32-screen-heading">
        <div className="bm32-heading-icon"><Settings2 size={27}/></div>
        <div>
          <h1>Menu</h1>
          <p>Acesso direto ao que você realmente usa.</p>
        </div>
      </header>

      <section className="bm32-profile-banner">
        <div className="bm32-profile-shield"><span>BM</span></div>
        <div className="bm32-profile-copy">
          <h2>{username || 'BuildMaster'}</h2>
          <p>{role === 'admin' ? 'Administrador' : 'Conta ativa'} • {playerCount} jogador(es)</p>
        </div>
      </section>

      <section className="bm32-menu-section">
        <div className="bm32-module-grid">
          {modules.map(({ target, icon: Icon, title, detail }) => (
            <button type="button" key={target} onClick={() => onNavigate(target)}>
              <span><Icon size={25}/></span>
              <div><strong>{title}</strong><small>{detail}</small></div>
              <ChevronRight size={21}/>
            </button>
          ))}
        </div>
      </section>

      <button type="button" className="bm32-logout-button" onClick={onLogout}>
        <LogOut size={18}/> Sair da conta
      </button>
    </section>
  );
}
