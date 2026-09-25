'use client';

import {
  ChevronRight,
  Cloud,
  Download,
  Palette,
  UserRound,
  Zap
} from 'lucide-react';

type SettingsTarget = 'contas' | 'aparencia' | 'desempenho' | 'backup' | 'atualizacoes';

type Props = {
  username: string;
  version: string;
  playerCount: number;
  healthScore: number;
  cloudEnabled: boolean;
  themeLabel: string;
  onOpen: (target: SettingsTarget) => void;
};

export function PremiumSettingsOverview({ username, version, playerCount, healthScore, cloudEnabled, themeLabel, onOpen }: Props) {
  const items = [
    { id: 'contas', icon: UserRound, title: 'Conta', text: username || 'Usuário', meta: 'Licença e dispositivos' },
    { id: 'aparencia', icon: Palette, title: 'Aparência', text: themeLabel, meta: 'Tema, contraste e acessibilidade' },
    { id: 'desempenho', icon: Zap, title: 'Desempenho', text: `${healthScore}% de saúde local`, meta: 'Interface e estabilidade' },
    { id: 'backup', icon: Cloud, title: 'Backup', text: `${playerCount} ficha(s) protegíveis`, meta: cloudEnabled ? 'Nuvem conectada' : 'Modo local' },
    { id: 'atualizacoes', icon: Download, title: 'Atualizações', text: `Versão ${version}`, meta: 'APK e novas versões' }
  ] as const;

  return (
    <section className="bm32-settings-overview" aria-label="Configurações">
      <header className="bm32-screen-heading">
        <div>
          <h1>Configurações</h1>
          <p>Somente o essencial para usar e manter o BuildMaster.</p>
        </div>
      </header>

      <div className="bm32-settings-grid">
        {items.map(({ id, icon: Icon, title, text, meta }) => (
          <button type="button" key={id} onClick={() => onOpen(id)}>
            <span><Icon size={25}/></span>
            <div><strong>{title}</strong><p>{text}</p><em>{meta}</em></div>
            <ChevronRight size={20}/>
          </button>
        ))}
      </div>
    </section>
  );
}
