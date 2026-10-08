import type {OcrZone,OcrZoneKey} from '../../lib/ocrZonesModelR164';
export function zone(key: OcrZoneKey, label: string, x: number, y: number, w: number, h: number): OcrZone {
  return { key, label, x, y, w, h, enabled: true };
}

export const CLASSIC_ZONES: OcrZone[] = [
  zone('name', 'Nome do jogador', 0.01, 0.00, 0.40, 0.075),
  zone('playstyle', 'Estilo de jogo', 0.01, 0.045, 0.44, 0.075),
  zone('overall', 'GER da carta', 0.045, 0.07, 0.16, 0.15),
  zone('mainPosition', 'Posição da carta', 0.04, 0.16, 0.22, 0.10),
  zone('cardType', 'Tipo da carta', 0.22, 0.075, 0.30, 0.11),
  zone('level', 'Nível máximo', 0.69, 0.00, 0.30, 0.12),
  zone('points', 'Pontos de progresso', 0.67, 0.105, 0.32, 0.13),
  zone('specialSkill', 'Habilidade especial', 0.43, 0.16, 0.55, 0.12),
  zone('positionGrid', 'Posições jogáveis', 0.66, 0.05, 0.33, 0.27),
  zone('attributes', 'Atributos visíveis', 0.01, 0.31, 0.98, 0.40),
  zone('progression', 'Progressão visível', 0.01, 0.68, 0.98, 0.19),
  zone('autoTraining', 'Ficha automática', 0.01, 0.54, 0.98, 0.33),
  zone('skills', 'Habilidades visíveis', 0.01, 0.87, 0.98, 0.12)
];

export const TALL_ZONES: OcrZone[] = [
  zone('name', 'Nome do jogador', 0.02, 0.015, 0.62, 0.055),
  zone('playstyle', 'Estilo de jogo', 0.02, 0.065, 0.62, 0.055),
  zone('overall', 'GER da carta', 0.04, 0.12, 0.24, 0.13),
  zone('mainPosition', 'Posição da carta', 0.04, 0.225, 0.30, 0.075),
  zone('cardType', 'Tipo da carta', 0.30, 0.12, 0.34, 0.10),
  zone('level', 'Nível máximo', 0.63, 0.02, 0.35, 0.08),
  zone('points', 'Pontos de progresso', 0.62, 0.10, 0.36, 0.10),
  zone('specialSkill', 'Habilidade especial', 0.38, 0.21, 0.60, 0.09),
  zone('positionGrid', 'Posições jogáveis', 0.61, 0.19, 0.37, 0.20),
  zone('attributes', 'Atributos visíveis', 0.02, 0.36, 0.96, 0.31),
  zone('progression', 'Progressão visível', 0.02, 0.65, 0.96, 0.19),
  zone('autoTraining', 'Ficha automática', 0.02, 0.52, 0.96, 0.32),
  zone('skills', 'Habilidades visíveis', 0.02, 0.84, 0.96, 0.15)
];

export const LANDSCAPE_ZONES: OcrZone[] = [
  zone('name', 'Nome do jogador', 0.02, 0.02, 0.32, 0.10),
  zone('playstyle', 'Estilo de jogo', 0.02, 0.10, 0.33, 0.10),
  zone('overall', 'GER da carta', 0.04, 0.20, 0.12, 0.25),
  zone('mainPosition', 'Posição da carta', 0.13, 0.26, 0.16, 0.16),
  zone('cardType', 'Tipo da carta', 0.18, 0.18, 0.20, 0.18),
  zone('level', 'Nível máximo', 0.78, 0.02, 0.20, 0.15),
  zone('points', 'Pontos de progresso', 0.77, 0.16, 0.21, 0.18),
  zone('specialSkill', 'Habilidade especial', 0.38, 0.03, 0.38, 0.16),
  zone('positionGrid', 'Posições jogáveis', 0.74, 0.28, 0.24, 0.35),
  zone('attributes', 'Atributos visíveis', 0.36, 0.18, 0.39, 0.70),
  zone('progression', 'Progressão visível', 0.36, 0.58, 0.61, 0.36),
  zone('autoTraining', 'Ficha automática', 0.36, 0.35, 0.61, 0.55),
  zone('skills', 'Habilidades visíveis', 0.02, 0.76, 0.32, 0.20)
];


