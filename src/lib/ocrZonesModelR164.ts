/**
 * R164 — modelo leve das zonas OCR.
 *
 * Mantém tipos e defaults necessários no startup separados do processamento
 * de imagem de `ocr.ts`, para que o shell não carregue Canvas/bitmap antes do
 * usuário abrir o Leitor.
 */
export const OCR_ZONES_MODEL_R164_VERSION = '40.80-r164-ocr-zones-model-v1' as const;

export type OcrZoneKey = 'name' | 'overall' | 'mainPosition' | 'playstyle' | 'level' | 'points' | 'cardType' | 'attributes' | 'progression' | 'autoTraining' | 'positionGrid' | 'skills' | 'specialSkill' | 'identityMeta' | 'condition' | 'manager' | 'impetos' | 'physicalModel';

export type OcrZone = {
  key: OcrZoneKey;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  enabled: boolean;
};

export const DEFAULT_OCR_ZONES: OcrZone[] = [
  { key: 'name', label: 'Nome do jogador', x: 0.01, y: 0.00, w: 0.40, h: 0.075, enabled: true },
  { key: 'playstyle', label: 'Estilo de jogo', x: 0.01, y: 0.045, w: 0.44, h: 0.075, enabled: true },
  { key: 'overall', label: 'GER da carta', x: 0.045, y: 0.07, w: 0.16, h: 0.15, enabled: true },
  { key: 'mainPosition', label: 'Posição da carta', x: 0.04, y: 0.16, w: 0.22, h: 0.10, enabled: true },
  { key: 'cardType', label: 'Tipo da carta', x: 0.22, y: 0.075, w: 0.30, h: 0.11, enabled: true },
  { key: 'level', label: 'Nível máximo', x: 0.69, y: 0.00, w: 0.30, h: 0.12, enabled: true },
  { key: 'points', label: 'Pontos de progresso', x: 0.67, y: 0.105, w: 0.32, h: 0.13, enabled: true },
  { key: 'specialSkill', label: 'Habilidade especial', x: 0.43, y: 0.16, w: 0.55, h: 0.12, enabled: true },
  { key: 'positionGrid', label: 'Posições jogáveis', x: 0.66, y: 0.05, w: 0.33, h: 0.27, enabled: true },
  { key: 'attributes', label: 'Atributos principais', x: 0.01, y: 0.31, w: 0.98, h: 0.40, enabled: true },
  { key: 'progression', label: 'Progressão visível', x: 0.01, y: 0.68, w: 0.98, h: 0.19, enabled: true },
  { key: 'autoTraining', label: 'Ficha automática', x: 0.01, y: 0.54, w: 0.98, h: 0.33, enabled: true },
  { key: 'skills', label: 'Habilidades', x: 0.01, y: 0.87, w: 0.98, h: 0.12, enabled: true }
];
