import type { OcrZone } from '@/lib/ocr';
import { canonicalEfhubOcrZones, EFHUB_CANONICAL_HEIGHT, EFHUB_CANONICAL_WIDTH } from './efhubLayoutGeometry';
import { detectEfhubSkillCapsuleZones, type SkillCapsuleDetection } from './skillCapsuleDetector';

export const EFHUB_DETERMINISTIC_ZONES_VERSION = '31.82-manual-map-deterministic-fields-1';

function zone(key: OcrZone['key'], label: string, x1: number, y1: number, x2: number, y2: number): OcrZone {
  return {
    key,
    label,
    x: x1 / EFHUB_CANONICAL_WIDTH,
    y: y1 / EFHUB_CANONICAL_HEIGHT,
    w: (x2 - x1) / EFHUB_CANONICAL_WIDTH,
    h: (y2 - y1) / EFHUB_CANONICAL_HEIGHT,
    enabled: true
  };
}

/**
 * Mantém a imagem completa para o usuário e usa recortes internos determinísticos.
 * A tabela não é mais lida como um bloco único: atributos e modelo físico são
 * separados por coluna; habilidades são segmentadas por cápsula.
 */
export async function buildDeterministicEfhubOcrZones(file: File | Blob): Promise<{
  zones: OcrZone[];
  skillDetection: SkillCapsuleDetection;
}> {
  const base = canonicalEfhubOcrZones().filter((item) => !['attributes', 'physicalModel', 'skills'].includes(item.key));
  const attributes: OcrZone[] = [
    zone('attributes', 'Atributos • coluna esquerda', 15, 555, 470, 1085),
    zone('attributes', 'Atributos • coluna central', 455, 555, 930, 1085),
    zone('attributes', 'Atributos • coluna direita', 915, 555, 1385, 1085)
  ];
  const physical: OcrZone[] = [
    zone('physicalModel', 'Modelo físico • coluna esquerda', 15, 1085, 470, 1425),
    zone('physicalModel', 'Modelo físico • coluna central', 455, 1085, 930, 1425),
    zone('physicalModel', 'Modelo físico • indicadores', 915, 1085, 1385, 1425)
  ];
  const skillDetection = await detectEfhubSkillCapsuleZones(file);
  // As três linhas completas funcionam como rede de segurança. Mesmo quando
  // duas cápsulas ficam muito próximas, o extrator estrito separa os dois
  // nomes oficiais; as cápsulas individuais aumentam a precisão dos textos
  // pequenos sem tornar os recortes visíveis na interface.
  const skillRows: OcrZone[] = [
    zone('skills', 'Habilidades • linha completa 1', 15, 1428, 1270, 1498),
    zone('skills', 'Habilidades • linha completa 2', 15, 1482, 1270, 1554),
    zone('skills', 'Habilidades • linha completa 3', 15, 1534, 1270, 1595)
  ];
  return { zones: [...base, ...attributes, ...physical, ...skillRows, ...skillDetection.zones], skillDetection };
}
