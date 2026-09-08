import { ATTRIBUTE_INPUTS, type AnalysisResult, type AttributeKey, type PositionCode } from '@/lib/analyzerDomain';
import { canonicalizeSkillList, isSpecialSkillIdentity } from '@/lib/officialSkillIdentity';
import type { LearnedCardMemory, ManualFields } from '@/modules/vault/cardHistoryStore';
import type { SinglePrintSession } from './singlePrintPro';

export const CARD_REVIEW_WORKFLOW_R131_VERSION = 'r131-review-evidence-boundary-1';

export function stripManualReviewBlockR131(text: string) {
  return String(text || '').replace(/\[AJUSTES MANUAIS\][\s\S]*?\[FIM AJUSTES\]\s*/gi, '').trimStart();
}

export function applyLearnedCardContextR131(text: string, learned: LearnedCardMemory | null | undefined) {
  if (!learned) return text;
  const lines = [
    '[APRENDIZADO LOCAL]',
    `NOME DO JOGADOR: ${learned.playerName}`,
    `POSIÇÃO PRINCIPAL: ${learned.mainPosition}`,
    learned.playstyle ? `ESTILO DE JOGO: ${learned.playstyle}` : '',
    learned.trainingPointsTotal ? `PONTOS TOTAIS: ${learned.trainingPointsTotal}` : '',
    '[FIM APRENDIZADO]'
  ].filter(Boolean);
  return `${lines.join('\n')}\n${text}`;
}

export function buildManualReviewTextR131(input: {
  text: string;
  confirmed?: boolean;
  learned?: LearnedCardMemory | null;
  manualFields: ManualFields;
  cardPositionOverride: PositionCode | 'AUTO';
  playstyleOverride: string;
  defensivePlaystyleOverride: string;
}) {
  const {
    text,
    confirmed = false,
    learned = null,
    manualFields,
    cardPositionOverride,
    playstyleOverride,
    defensivePlaystyleOverride
  } = input;

  const cleaned = stripManualReviewBlockR131(text)
    .replace(/^(POSIÇÃO PRINCIPAL|POSICAO PRINCIPAL|ESTILO DE JOGO OFENSIVO|ESTILO DE JOGO DEFENSIVO|ESTILO DE JOGO|NOME|NOME DO JOGADOR|NÍVEL MÁXIMO|NIVEL MAXIMO|PONTOS TOTAIS|HABILIDADES JÁ POSSUI|HABILIDADES JA POSSUI|HABILIDADES DO JOGADOR|HABILIDADES NATIVAS|HABILIDADES ESPECIAIS)\s*[:=\-].*$/gim, '')
    .replace(/^\s+/, '');

  const locks: string[] = ['[AJUSTES MANUAIS]'];
  if (confirmed) locks.push('CONFIRMAÇÃO MANUAL: SIM');
  const learnedName = learned?.playerName ?? '';
  const learnedPosition = learned?.mainPosition ?? 'AUTO';
  const learnedStyle = learned?.playstyle ?? 'AUTO';
  const learnedPoints = learned?.trainingPointsTotal ?? '';

  if (manualFields.playerName.trim() || learnedName) locks.push(`NOME DO JOGADOR: ${manualFields.playerName.trim() || learnedName}`);
  if (cardPositionOverride !== 'AUTO' || learnedPosition !== 'AUTO') locks.push(`POSIÇÃO PRINCIPAL: ${cardPositionOverride !== 'AUTO' ? cardPositionOverride : learnedPosition}`);
  if (playstyleOverride !== 'AUTO' || learnedStyle !== 'AUTO') locks.push(`ESTILO DE JOGO OFENSIVO: ${playstyleOverride !== 'AUTO' ? playstyleOverride : learnedStyle}`);
  if (defensivePlaystyleOverride !== 'AUTO') locks.push(`ESTILO DE JOGO DEFENSIVO: ${defensivePlaystyleOverride}`);
  if (manualFields.level.trim()) locks.push(`NÍVEL MÁXIMO: ${manualFields.level.trim()}`);
  if (manualFields.trainingPointsTotal.trim() || learnedPoints) locks.push(`PONTOS TOTAIS: ${manualFields.trainingPointsTotal.trim() || learnedPoints}`);

  // R131: somente habilidades explicitamente presentes em ManualFields são tratadas
  // como posse confirmada. Candidatos provisórios do OCR não entram aqui de forma
  // automática; o usuário ainda pode selecioná-los manualmente na revisão.
  const selectedOwnedSkills = canonicalizeSkillList(manualFields.nativeSkills ?? []);
  const selectedSpecialSkills = selectedOwnedSkills.filter((skill) => isSpecialSkillIdentity(skill));
  const selectedRegularSkills = selectedOwnedSkills.filter((skill) => !isSpecialSkillIdentity(skill));
  if (selectedRegularSkills.length) locks.push(`HABILIDADES JÁ POSSUI: ${selectedRegularSkills.join(', ')}`);
  if (selectedSpecialSkills.length) locks.push(`HABILIDADES ESPECIAIS: ${selectedSpecialSkills.join(', ')}`);

  for (const item of ATTRIBUTE_INPUTS) {
    const value = manualFields.attributes[item.key]?.trim();
    if (value) locks.push(`${item.label}: ${value}`);
  }
  locks.push('[FIM AJUSTES]');
  return `${locks.join('\n')}\n${cleaned}`.trim();
}

function trustedSessionSkillsR131(session: SinglePrintSession | null | undefined) {
  if (!session) return null;
  return canonicalizeSkillList(
    session.detailedReading.skills
      .filter((item) => item.status === 'confirmed')
      .map((item) => item.value)
  );
}

export function buildReviewHydrationR131(nextResult: AnalysisResult, session?: SinglePrintSession | null) {
  const nextAttributes: Partial<Record<AttributeKey, string>> = {};
  for (const [key, value] of Object.entries(nextResult.parsed.attributes)) {
    if (Number.isFinite(value)) nextAttributes[key as AttributeKey] = String(value);
  }

  const detectedTrainingPoints = Number(nextResult.trainingPointsTotal || 0);
  const inferredMaximumLevel = !nextResult.parsed.level
    && detectedTrainingPoints > 0
    && detectedTrainingPoints % 2 === 0
    ? Math.floor(detectedTrainingPoints / 2) + 1
    : 0;

  const parsedOwnedSkills = canonicalizeSkillList([
    ...nextResult.parsed.nativeSkills,
    ...(nextResult.parsed.additionalSkills ?? []),
    ...nextResult.parsed.specialSkills
  ]);
  const trustedSessionSkills = trustedSessionSkillsR131(session);

  const manualFields: ManualFields = {
    playerName: nextResult.parsed.playerName !== 'Jogador não identificado' ? nextResult.parsed.playerName : '',
    level: nextResult.parsed.level ? String(nextResult.parsed.level) : inferredMaximumLevel ? String(inferredMaximumLevel) : '',
    trainingPointsTotal: nextResult.trainingPointsTotal ? String(nextResult.trainingPointsTotal) : '',
    attributes: nextAttributes,
    // Em fluxo OCR, apenas evidência individual confirmada vira seleção automática.
    // Em entrada manual/legada sem sessão de OCR, preservamos o inventário parseado.
    nativeSkills: trustedSessionSkills ?? parsedOwnedSkills
  };

  return {
    manualFields,
    suggestedCardPosition: nextResult.parsed.mainPosition,
    suggestedOffensivePlaystyle: nextResult.parsed.offensivePlaystyle ?? nextResult.parsed.playstyle ?? 'AUTO',
    suggestedDefensivePlaystyle: nextResult.parsed.defensivePlaystyle ?? 'AUTO'
  };
}

export function confirmedOcrSkillsForLearningR131(session: SinglePrintSession | null | undefined) {
  return trustedSessionSkillsR131(session) ?? [];
}
