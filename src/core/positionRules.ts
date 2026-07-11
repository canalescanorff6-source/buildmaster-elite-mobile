import type { PositionCode } from './analyzer';

export function isCentralDestroyerRole(playstyle?: string | null) {
  return /destruidor|destroyer|primeiro volante|anchor man|ancora/i.test(playstyle ?? '');
}

export function isImpossibleByCoreStyle(position: PositionCode, mainPosition: PositionCode, playstyle?: string | null): string | null {
  const style = playstyle ?? '';
  if (mainPosition !== 'GK' && position === 'GK') return 'Jogador de linha não deve ser tratado como goleiro.';
  if (mainPosition === 'GK' && position !== 'GK') return 'Goleiro não deve ser convertido para jogador de linha.';

  if (isCentralDestroyerRole(style)) {
    if (['CF', 'SS', 'LWF', 'RWF'].includes(position)) return 'Estilo de contenção central não combina com atacante/ponta.';
    if ((position === 'LB' || position === 'RB') && mainPosition !== 'LB' && mainPosition !== 'RB') return 'Volante destruidor central só deve ir para lateral se a carta for lateral de origem.';
  }

  if (/homem de area|fox in the box|pivo|target man|atacante matador|artilheiro|goal poacher/i.test(style)) {
    if (['CB', 'DMF', 'LB', 'RB'].includes(position)) return 'Estilo de atacante não deve ser convertido para posição defensiva.';
  }

  return null;
}
