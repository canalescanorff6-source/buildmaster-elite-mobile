import type { OcrZone, OcrZoneKey } from './ocr';
import type { PrintQualityReport } from './validation';

export type PremiumReadingStatus = 'confirmed' | 'review' | 'unread';
export type PremiumEnhancementMode = 'original' | 'adaptive' | 'contrast' | 'sharp';

export type PremiumZoneReading = {
  key: OcrZoneKey | 'full';
  label: string;
  text: string;
  confidence: number;
  status: PremiumReadingStatus;
  originPreview: string | null;
  enhancement: PremiumEnhancementMode;
};

export type ReadingConfirmationStage = {
  id: 'identity' | 'card' | 'attributes' | 'skills';
  title: string;
  description: string;
  zoneKeys: OcrZoneKey[];
  required: boolean;
};

export const READING_CONFIRMATION_STAGES: ReadingConfirmationStage[] = [
  {
    id: 'identity',
    title: '1. Identidade',
    description: 'Confirme nome e GER antes de usar os demais dados.',
    zoneKeys: ['name', 'overall'],
    required: true
  },
  {
    id: 'card',
    title: '2. Posição e estilo',
    description: 'Confirme a posição original e o Estilo de Jogo oficial da carta.',
    zoneKeys: ['mainPosition', 'playstyle', 'positionGrid'],
    required: true
  },
  {
    id: 'attributes',
    title: '3. Atributos e pontos',
    description: 'Revise atributos e ficha automática antes do cálculo final.',
    zoneKeys: ['attributes', 'autoTraining'],
    required: true
  },
  {
    id: 'skills',
    title: '4. Habilidades',
    description: 'Confirme apenas as habilidades que estiverem visíveis.',
    zoneKeys: ['skills'],
    required: false
  }
];

export function readingStatus(confidence: number, text: string): PremiumReadingStatus {
  if (!text.trim()) return 'unread';
  if (confidence >= 78) return 'confirmed';
  return 'review';
}

export function qualityScore(report: PrintQualityReport | null): number {
  if (!report) return 0;
  const resolution = Math.min(100, Math.round(((report.width / 1080) * 50) + ((report.height / 1400) * 50)));
  const sharpness = Math.min(100, Math.round(report.sharpness * 5.2));
  const contrast = Math.min(100, Math.round(report.contrast * 2.5));
  const brightnessDistance = Math.abs(report.brightness - 130);
  const brightness = Math.max(0, 100 - Math.round(brightnessDistance * 0.85));
  const penalty = report.issues.reduce((sum, issue) => sum + (issue.severity === 'block' ? 18 : 8), 0);
  return Math.max(0, Math.min(100, Math.round(resolution * 0.28 + sharpness * 0.3 + contrast * 0.24 + brightness * 0.18 - penalty)));
}

export function qualityLabel(score: number): string {
  if (score >= 85) return 'Excelente';
  if (score >= 70) return 'Boa';
  if (score >= 55) return 'Razoável';
  return 'Fraca';
}

export function suggestedEnhancement(report: PrintQualityReport | null): PremiumEnhancementMode {
  if (!report) return 'adaptive';
  if (report.sharpness < 10) return 'sharp';
  if (report.contrast < 25 || report.brightness < 55 || report.brightness > 205) return 'contrast';
  return 'adaptive';
}

export function buildStageSummary(readings: PremiumZoneReading[], stage: ReadingConfirmationStage) {
  const stageReadings = readings.filter((reading) => stage.zoneKeys.includes(reading.key as OcrZoneKey));
  const found = stageReadings.filter((reading) => reading.status !== 'unread').length;
  const review = stageReadings.filter((reading) => reading.status === 'review').length;
  const average = stageReadings.length
    ? Math.round(stageReadings.reduce((sum, reading) => sum + reading.confidence, 0) / stageReadings.length)
    : 0;
  return { found, total: stageReadings.length, review, average };
}

export function ensureZoneCoverage(zones: OcrZone[], readings: PremiumZoneReading[]): PremiumZoneReading[] {
  return zones.filter((zone) => zone.enabled).map((zone) => readings.find((reading) => reading.key === zone.key) ?? ({
    key: zone.key,
    label: zone.label,
    text: '',
    confidence: 0,
    status: 'unread' as const,
    originPreview: null,
    enhancement: 'original' as const
  }));
}
