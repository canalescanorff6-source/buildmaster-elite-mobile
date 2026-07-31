'use client';

import { ArrowLeft, FileText } from 'lucide-react';
import type { MainNavigationGroup, PlayerWorkspace } from '@/lib/appRefinement';

 type Props = {
  group: MainNavigationGroup;
  workspace: PlayerWorkspace;
  canGoBack: boolean;
  currentPlayer?: { name: string; points: string } | null;
  onBack: () => void;
  onOpenCurrentPlayer: () => void;
};

const groupTitles: Record<MainNavigationGroup, string> = {
  inicio: 'Início',
  jogadores: 'Jogadores',
  time: 'Meu Time',
  partidas: 'Partidas e treinos',
  ajustes: 'Ajustes'
};

const workspaceTitles: Record<PlayerWorkspace, string> = {
  'visao-geral': 'Meus jogadores',
  leitor: 'Criar ficha por print',
  manual: 'Criar ficha manualmente',
  resultado: 'Ficha recomendada',
  cofre: 'Jogadores salvos'
};

export function PremiumContextBar({
  group,
  workspace,
  canGoBack,
  currentPlayer,
  onBack,
  onOpenCurrentPlayer
}: Props) {
  const title = group === 'jogadores' ? workspaceTitles[workspace] : groupTitles[group];

  return (
    <section className="bm-simple-context" aria-label="Área atual">
      <div>
        {canGoBack && <button type="button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20}/></button>}
        <h1>{title}</h1>
      </div>
      <div>
        {currentPlayer && group !== 'inicio' && (
          <button type="button" className="bm-simple-current-player" onClick={onOpenCurrentPlayer}>
            <FileText size={16}/><span>{currentPlayer.name}</span><b>{currentPlayer.points}</b>
          </button>
        )}
      </div>
    </section>
  );
}
