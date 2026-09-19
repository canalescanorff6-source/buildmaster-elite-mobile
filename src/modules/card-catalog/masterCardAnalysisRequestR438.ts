import type { Objective, PositionCode, TacticalProfile } from '@/lib/analyzerDomain';
import { ATTRIBUTE_PT } from '@/lib/analyzerDomain';
import { createProductionAnalysisR138 } from '@/modules/analysis/productionOrchestratorR138';
import { masterCardGenerationReadinessR452, masterCardTrainingPointsR438, type MasterCardCatalogEntryR438 } from './masterCardCatalogR438';

export const MASTER_CARD_ANALYSIS_REQUEST_R438_VERSION = '40.80-r438-master-card-analysis-request-v1' as const;

export function buildMasterCardAnalysisRawTextR438(card: MasterCardCatalogEntryR438) {
  const readiness = masterCardGenerationReadinessR452(card);
  if (!readiness.canGenerate) throw new Error(`R452: identidade da edição e PP são obrigatórios para gerar ficha (${readiness.missing.join(', ')}).`);
  const points = readiness.points ?? masterCardTrainingPointsR438(card);
  if (points === null) throw new Error('R452: PP não confirmado nem derivável.');
  const lines = [
    '[AJUSTES MANUAIS]',
    'CONFIRMAÇÃO MANUAL: SIM',
    `NOME DO JOGADOR: ${card.playerName}`,
    `POSIÇÃO PRINCIPAL: ${card.mainPosition}`,
    `PONTOS TOTAIS: ${points}`
  ];
  if (card.level !== null) lines.push(`NÍVEL MÁXIMO: ${card.level}`);
  const style = card.offensivePlaystyle || card.playstyle;
  if (style) lines.push(`ESTILO DE JOGO: ${style}`, `ESTILO DE JOGO OFENSIVO: ${style}`);
  if (card.defensivePlaystyle) lines.push(`ESTILO DE JOGO DEFENSIVO: ${card.defensivePlaystyle}`);
  if (card.overall !== null) lines.push(`GER: ${Math.round(card.overall)}`);
  if (card.positions.length) lines.push(`POSIÇÕES: ${card.positions.join(', ')}`);
  const skills = Array.from(new Set([...card.nativeSkills, ...card.additionalSkills]));
  if (skills.length) lines.push(`HABILIDADES JÁ POSSUI: ${skills.join(', ')}`);
  if (card.specialSkills.length) lines.push(`HABILIDADES ESPECIAIS: ${card.specialSkills.join(', ')}`);
  if (card.impetos.length) lines.push(`ÍMPETOS: ${card.impetos.map((item) => item.name).join(', ')}`);
  for (const [key, value] of Object.entries(card.attributes)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    lines.push(`${ATTRIBUTE_PT[key as keyof typeof ATTRIBUTE_PT] ?? key}: ${Math.round(value)}`);
  }
  lines.push('[FIM AJUSTES]');
  return lines.join('\n');
}

export function createMasterCardProductionAnalysisR438(card: MasterCardCatalogEntryR438, input?: {
  objective?: Objective;
  targetPosition?: PositionCode | 'AUTO';
  tacticalProfile?: TacticalProfile;
}) {
  return createProductionAnalysisR138({
    rawText: buildMasterCardAnalysisRawTextR438(card),
    objective: input?.objective ?? 'COMPETITIVE',
    targetPosition: input?.targetPosition ?? card.mainPosition,
    imageFileName: `catalogo-r438-${card.catalogCardId}`,
    tacticalProfile: input?.tacticalProfile ?? { formation: 'AUTO', style: 'AUTO' }
  });
}
