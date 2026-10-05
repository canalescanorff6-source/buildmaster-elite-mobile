import type { ReaderV2Zone } from './readerV2Types';

export const READER_V2_DEFAULT_ZONES: ReaderV2Zone[] = [
  { key: 'playerName', label: 'Nome do jogador', x: 0.01, y: 0.0, w: 0.4, h: 0.075, kind: 'identity' },
  { key: 'playstyle', label: 'Estilo de jogo', x: 0.01, y: 0.045, w: 0.44, h: 0.075 },
  { key: 'mainPosition', label: 'Posição principal', x: 0.04, y: 0.16, w: 0.22, h: 0.1, kind: 'identity' },
  { key: 'level', label: 'Nível máximo', x: 0.69, y: 0.0, w: 0.3, h: 0.12, kind: 'progression' },
  { key: 'points', label: 'Pontos de progresso', x: 0.67, y: 0.105, w: 0.32, h: 0.13, kind: 'progression' },
  { key: 'attributes', label: 'Atributos', x: 0.01, y: 0.31, w: 0.98, h: 0.4, kind: 'attributes' },
  { key: 'skills', label: 'Habilidades', x: 0.01, y: 0.87, w: 0.98, h: 0.12, kind: 'skills' },
  { key: 'impeto', label: 'Ímpeto', x: 0.43, y: 0.16, w: 0.55, h: 0.12 },
];

type LegacyCalibrationZone = Partial<ReaderV2Zone> & { id?: string; name?: string };

export function mapLegacyCalibrationToReaderV2(zones: LegacyCalibrationZone[]): ReaderV2Zone[] {
  return zones
    .filter((zone) => zone.enabled !== false)
    .map((zone, index) => ({
      key: String(zone.key ?? zone.id ?? `zone-${index}`),
      label: String(zone.label ?? zone.name ?? zone.key ?? zone.id ?? `Zona ${index + 1}`),
      x: Number(zone.x ?? 0),
      y: Number(zone.y ?? 0),
      w: Number(zone.w ?? 1),
      h: Number(zone.h ?? 1),
      enabled: zone.enabled !== false,
      kind: zone.kind,
    }))
    .filter((zone) => Number.isFinite(zone.x) && Number.isFinite(zone.y) && zone.w > 0 && zone.h > 0);
}
