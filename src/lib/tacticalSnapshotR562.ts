/**
 * R562 — Snapshot tático local, determinístico e somente leitura.
 * Nunca apresenta sugestões como treinamentos aplicados, converte OCR em
 * confirmação ou soma o bônus do técnico sobre os atributos do print.
 */
import type { TacticalStyle, AttributeKey, AnalysisResult } from './analyzerDomain';
import type { ManagerRecord } from './managers';
import { evaluateManagerLinksR560, type SquadMemberR560 } from './managerLinkEngineR560';
import { buildCardSlotsViewR561, buildManagerAttributeViewR561, type DisplaySlotR561 } from './cardVisualEvidenceR561';
import { cardIdentityFingerprintR126 } from './cardIdentityFingerprintR126';
import type { IntegratedPlayerRecord, TeamDiagnosis } from '@/modules/core/centralIntelligence';

export type TacticalSnapshotInputR562 = {
  team: TeamDiagnosis;
  teamStyle: TacticalStyle;
  selectedManager: ManagerRecord | null | undefined;
  squad: readonly SquadMemberR560[];
  lineupConfirmed: boolean;
  players: readonly IntegratedPlayerRecord[];
};

// No HTML nem comandos LLM injetados pelo OCR; valores são dados, não instruções.
function oneLine(value: unknown, maxLength = 140): string {
  const clean = String(value ?? '').replace(/[\r\n\t\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return clean ? clean.slice(0, maxLength) : 'PENDENTE';
}

function numeric(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? String(value) : 'PENDENTE';
}

const ATTRIBUTE_LABELS: Partial<Record<AttributeKey, string>> = {
  tightPossession: 'Condução firme', balance: 'Equilíbrio',
  ballControl: 'Controle de bola', dribbling: 'Drible', lowPass: 'Passe rasteiro',
  loftedPass: 'Passe alto', finishing: 'Finalização', speed: 'Velocidade',
  acceleration: 'Aceleração', defensiveAwareness: 'Consciência defensiva',
  offensiveAwareness: 'Consciência ofensiva'
};

const TRAINING_LABELS = {
  shooting:'Finalização', passing:'Passe', dribbling:'Drible', dexterity:'Destreza',
  lowerBodyStrength:'Força das pernas', aerialStrength:'Força aérea', defending:'Defesa',
  gk1:'Goleiro 1', gk2:'Goleiro 2', gk3:'Goleiro 3'
} as const;

function slotText(slot: DisplaySlotR561): string {
  const evidence = slot.source ? `, ${oneLine(slot.source, 30)}` : '';
  return `${oneLine(slot.label, 45)}=${slot.value ? oneLine(slot.value, 75) : '—'} [${slot.status}${evidence}]`;
}

function cardFromVault(result: AnalysisResult, players: readonly IntegratedPlayerRecord[]) {
  const byReference = players.find((item) => item.result === result);
  if (byReference) return byReference;
  // Nunca unir duas edições apenas pelo nome do jogador; quando a identidade
  // do Cofre não é unívoca, exporta-se o resultado escalado sem status inferido.
  const fingerprint = cardIdentityFingerprintR126(result.parsed);
  const matches = players.filter((item) => item.fingerprint === fingerprint);
  return matches.length === 1 ? matches[0] : null;
}

function buildPlayerLines(
  result: AnalysisResult,
  position: string,
  index: number,
  players: readonly IntegratedPlayerRecord[],
  manager: ManagerRecord | null | undefined,
  lineupConfirmed: boolean
): string[] {
  const card = result.parsed;
  const vaultRecord = cardFromVault(result, players);
  const slots = buildCardSlotsViewR561(card);
  const pending: string[] = [];
  if (!lineupConfirmed) pending.push('escalação não confirmada');
  if (!card.playerName?.trim()) pending.push('identidade do jogador');
  if (!card.playstyle?.trim() && !card.offensivePlaystyle?.trim()) pending.push('estilo de jogo');
  if (vaultRecord?.status && vaultRecord.status !== 'completo') pending.push(`Cofre: ${vaultRecord.status}`);
  if (!vaultRecord) pending.push('vínculo com ficha do Cofre não comprovado');
  if (result.validation?.confirmed !== true) pending.push('validação geral da carta não confirmada');
  if (result.validation?.level === 'review' || result.validation?.level === 'blocked') pending.push(`validação: ${result.validation.level}`);
  if (!Object.values(card.attributes ?? {}).some((value) => typeof value === 'number' && Number.isFinite(value))) pending.push('atributos sem valores lidos');
  if (!card.evidence || !Number.isFinite(card.evidence.attributeCount) || card.evidence.attributeCount < 1) pending.push('atributos sem comprovação da leitura');
  if (card.evidence?.criticalStateR419 && card.evidence.criticalStateR419 !== 'TRUSTED') pending.push(`OCR crítico: ${card.evidence.criticalStateR419}`);
  if (card.evidence?.levelStateR419 && card.evidence.levelStateR419 !== 'TRUSTED') pending.push('nível sem confirmação');
  if (card.evidence?.trainingBudgetStateR419 && card.evidence.trainingBudgetStateR419 !== 'TRUSTED') pending.push('pontos de progresso não confirmados');
  if (slots.pending > 0) pending.push(`${slots.pending} slot(s) de habilidades/ímpetos pendentes`);
  if (slots.recorded > 0) pending.push(`${slots.recorded} slot(s) registrados sem evidência individual`);

  const state = pending.length ? 'PENDENTE' : 'CONFIRMADO';
  const attributes = Object.entries(card.attributes ?? {})
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
    .map(([key, value]) => `${ATTRIBUTE_LABELS[key as AttributeKey] ?? key}=${value}`);
  const training = Object.entries(result.training ?? {})
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value) && value > 0)
    .map(([key, value]) => `${TRAINING_LABELS[key as keyof typeof TRAINING_LABELS] ?? key}=${value}`);
  const managerView = buildManagerAttributeViewR561(result, manager);
  const managerProjection = managerView?.rows?.length
    ? managerView.rows.map((row) => row.status === 'APLICADO'
      ? `${row.label}=${row.base} +${row.bonus} → ${row.projected} (PROJEÇÃO, não atributo observado)`
      : `${row.label}=PENDENTE (+${row.bonus} não somado ao print)`).join('; ')
    : 'Sem projeção verificada para este técnico';
  const levelVerified = card.evidence?.levelStateR419 === 'TRUSTED';
  const pointsVerified = card.evidence?.trainingBudgetStateR419 === 'TRUSTED' || card.trainingPointSource === 'MANUAL';
  return [
    `${index + 1}. ${oneLine(position, 30)} | ${oneLine(card.playerName, 90)} | CARTA: ${oneLine(card.cardType, 55)} | STATUS: ${state}`,
    `   Estilo lido: ${oneLine(card.offensivePlaystyle || card.playstyle, 70)} | Nível: ${numeric(card.level)} [${levelVerified ? 'CONFIRMADO' : 'PENDENTE/REVISAR'}] | GER lido: ${numeric(card.maxOverall ?? card.overall)} [NÃO comprova bônus]`,
    `   Pontos lidos: ${numeric(card.trainingPointsUsed)}/${numeric(card.trainingPointsTotal)} [${pointsVerified ? 'CONFIRMADO' : 'PENDENTE/REVISAR'}; origem=${oneLine(card.trainingPointSource, 24)}]`,
    `   Ficha calculada sugerida (NÃO comprova que foi aplicada): ${training.join(', ') || 'PENDENTE'}`,
    `   Atributos capturados (NÃO são base para novo bônus): ${attributes.join(', ') || 'PENDENTE'}`,
    `   Projeção do técnico: ${managerProjection}`,
    `   Habilidades adicionais (5): ${slots.skills.map(slotText).join('; ')}`,
    `   Ímpetos/Booster Crafting (2): ${slots.boosters.map(slotText).join('; ')}`,
    ...(pending.length ? [`   PENDÊNCIAS: ${pending.join('; ')}`] : [])
  ];
}

export function buildTacticalSnapshotR562(input: TacticalSnapshotInputR562): string {
  const { team, teamStyle, selectedManager: manager, squad, lineupConfirmed, players } = input;
  const fullLineupConfirmed = lineupConfirmed === true &&
    squad.length === 11 && team.filledSlots === 11 && team.totalSlots === 11 &&
    squad.every((item) => Boolean(item.playerName?.trim() && item.playstyle?.trim()));
  const links = evaluateManagerLinksR560(manager, squad, { lineupConfirmed:fullLineupConfirmed });
  const boostDescription = manager?.attributeBoostsR560
    ? Object.entries(manager.attributeBoostsR560).map(([key, n]) =>
      `${ATTRIBUTE_LABELS[key as AttributeKey] ?? key} +${n} (regra do técnico; não somar em OCR)`).join('; ')
    : 'PENDENTE: não há bônus por atributo comprovado para esta edição';
  const header = [
    'BUILDMASTER | SNAPSHOT TÁTICO R562 | TEXTO LOCAL, SEM API PAGA',
    `Formação: ${oneLine(team.formation)} | Estilo coletivo: ${oneLine(teamStyle)}`,
    `Técnico: ${manager ? `${oneLine(manager.name)} (${oneLine(manager.version)})` : 'PENDENTE — não selecionado'}`,
    `Bônus por atributo: ${boostDescription}`,
    `Escalação: ${fullLineupConfirmed ? 'CONFIRMADA no BuildMaster' : 'PENDENTE de confirmação'} | Titulares: ${team.filledSlots}/${team.totalSlots}`,
    'VÍNCULOS TÁTICOS (confirmação local, não detecção dentro do jogo):',
    ...(links.length ? links.map((link) => `- ${oneLine(link.name)}: ${link.status}${link.status === 'ATIVO' ? ' (requisitos confirmados; ativação no jogo não verificada)' : ''}${link.missing.length ? ` | Faltam: ${link.missing.map((item) => oneLine(item)).join(', ')}` : ''}`) : ['- PENDENTE: técnico sem regras de vínculos cadastradas ou não selecionado']),
    'TITULARES (posição efetivamente escalada):'
  ];
  const lineup = team.lineup.flatMap((item, index) => {
    if (!item.player) return [`${index + 1}. ${oneLine(item.slot.label)} | PENDENTE — posição sem jogador confirmado`];
    return buildPlayerLines(item.player, item.slot.label, index, players, manager, fullLineupConfirmed);
  });
  return [...header, ...lineup,
    'REGRAS PARA ANÁLISE: PENDENTE e REGISTRADO não equivalem a CONFIRMADO. Não inventar skills, ímpetos, níveis, progresso nem valores faltantes. Ficha calculada é sugestão, não treinamento aplicado. Atributos capturados podem conter bônus; não aplicar +1 de novo. Projeção é estimativa independente, não valor lido no jogo.',
    'Este snapshot não contém imagens, tokens, dados de conta ou chamadas de API.'
  ].join('\n');
}
