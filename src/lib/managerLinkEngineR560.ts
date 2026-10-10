import type { AttributeKey, Attributes, PositionCode, TacticalStyle } from './analyzerDomain';
import { getManager, type ManagerLinkParticipantR560, type ManagerRecord } from './managers';

export const MANAGER_LINK_ENGINE_R560_VERSION = '40.80-r560-manager-dynamic-links-v1' as const;

/** Posição efetiva na escalação, não posição natural impressa na carta. */
export type SquadMemberR560 = {
  playerName: string;
  position: PositionCode;
  playstyle: string | null;
  additionalSkills?: string[];
  boosters?: string[];
};

export type LinkStatusR560 = 'ATIVO' | 'INATIVO' | 'PENDENTE';
export type ManagerLinkEvaluationR560 = {
  id: string;
  name: string;
  status: LinkStatusR560;
  centerpiece: ManagerLinkParticipantR560;
  keyman: ManagerLinkParticipantR560;
  centerpiecePlayer: string | null;
  keymanPlayer: string | null;
  missing: string[];
};

const normalize = (value: string | null | undefined) => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Só equivalências exatas conhecidas; sem inferir o estilo por nome do jogador. */
const PLAYSTYLE_ALIASES: Readonly<Record<string, string>> = {
  'orquestrador':'orquestrador', 'orchestrator':'orquestrador',
  'armador criativo':'armador criativo', 'creative playmaker':'armador criativo',
  'artilheiro':'artilheiro', 'goal poacher':'artilheiro',
};
const normalizedStyle = (style: string | null) => PLAYSTYLE_ALIASES[normalize(style)] ?? normalize(style);

export function evaluateManagerLinksR560(
  manager: Pick<ManagerRecord, 'linkUpsR560'> | null | undefined,
  squad: readonly SquadMemberR560[],
  options: { lineupConfirmed?: boolean } = {}
): ManagerLinkEvaluationR560[] {
  if (!manager?.linkUpsR560?.length) return [];
  const confirmed = options.lineupConfirmed === true;
  return manager.linkUpsR560.map((link) => {
    const find = (requirement: ManagerLinkParticipantR560) => squad.find((member) =>
      member.position === requirement.position &&
      normalizedStyle(member.playstyle) === normalizedStyle(requirement.playstyle) &&
      Boolean(normalizedStyle(member.playstyle))
    );
    const center = find(link.centerpiece);
    const keyman = find(link.keyman);
    const differentPlayers = !center || !keyman || center !== keyman;
    const active = Boolean(center && keyman && differentPlayers);
    const missing: string[] = [];
    if (!center) missing.push(`${link.centerpiece.playstyle} em ${link.centerpiece.position}`);
    if (!keyman) missing.push(`${link.keyman.playstyle} em ${link.keyman.position}`);
    const status: LinkStatusR560 = !confirmed ? 'PENDENTE' : active ? 'ATIVO' : 'INATIVO';
    return {
      id:link.id, name:link.name, status,
      centerpiece:link.centerpiece, keyman:link.keyman,
      centerpiecePlayer:center?.playerName ?? null,
      keymanPlayer:keyman?.playerName ?? null, missing
    };
  });
}

export type ManagerAttributeProjectionR560 = {
  attributes: Attributes;
  status: 'APLICADO' | 'SEM_BONUS' | 'NAO_APLICADO';
  reason: string;
};

/**
 * Nunca somar bônus diretamente ao atributo lido do print: o jogo pode exibir
 * os efeitos do técnico e dos ímpetos já aplicados. A projeção só é liberada
 * com a procedência explícita "BASE_SEM_BONUS_TECNICO".
 */
export function projectManagerAttributesR560(
  attributes: Attributes,
  manager: Pick<ManagerRecord, 'attributeBoostsR560'> | null | undefined,
  source: 'BASE_SEM_BONUS_TECNICO' | 'PRINT_JA_COM_BONUS' | 'INDETERMINADO'
): ManagerAttributeProjectionR560 {
  const output: Attributes = { ...attributes };
  if (source !== 'BASE_SEM_BONUS_TECNICO') return {
    attributes:output, status:'NAO_APLICADO',
    reason:'O print pode conter bônus do técnico; preservar valores originais para evitar dupla contagem.'
  };
  const boosts = manager?.attributeBoostsR560;
  if (!boosts || !Object.keys(boosts).length) return { attributes:output, status:'SEM_BONUS', reason:'Não há bônus por atributo confirmado para esta edição do técnico.' };
  let appliedCount = 0;
  for (const [key, value] of Object.entries(boosts) as [AttributeKey, number][]) {
    if (typeof output[key] !== 'number' || !Number.isFinite(output[key])) continue;
    if (!Number.isFinite(value)) continue;
    output[key] = output[key]! + value;
    appliedCount += 1;
  }
  if (appliedCount === 0) return {attributes:output,status:'NAO_APLICADO',reason:'Nenhum atributo relacionado ao bônus estava disponível para uma projeção segura.'};
  return { attributes:output, status:'APLICADO', reason:'Projeção calculada a partir de atributos base sem bônus de técnico; sem alterar a carta salva.' };
}

/** Exportação determinística de escalação, sem API externa ou suposições. */
export function formatSquadForChatR560(
  squad: readonly SquadMemberR560[],
  managerId: string | null,
  style: TacticalStyle,
  formation: string,
  options: { manager?: ManagerRecord | null; lineupConfirmed?: boolean } = {}
): string {
  const manager = options.manager ?? getManager(managerId);
  const confirmed = Boolean(options.lineupConfirmed && squad.length === 11 && squad.every((member)=>Boolean(member.playerName)));
  const links = evaluateManagerLinksR560(manager, squad, {lineupConfirmed:confirmed});
  return [
    'BUILDMASTER — ELENCO PARA ANÁLISE (SEM API)',
    `Formação: ${formation}`,
    `Estilo coletivo: ${style}`,
    `Técnico: ${manager?.name ?? 'não confirmado'}`,
    manager?.attributeBoostsR560 ? `Bônus confirmados do técnico: ${Object.entries(manager.attributeBoostsR560).map(([k, v])=>`${k} +${v}`).join(', ')}` : 'Bônus do técnico: não confirmados',
    'Jogadores (posição escalada; não presumir habilidades/ímpetos ausentes):',
    ...squad.map((player,index)=>`${index + 1}. ${player.position} — ${player.playerName || 'PENDENTE'} | estilo ${player.playstyle || 'PENDENTE'} | adicionais ${(player.additionalSkills?.length ? player.additionalSkills.join('; ') : 'PENDENTE')} | ímpetos ${(player.boosters?.length ? player.boosters.join('; ') : 'PENDENTE')}`),
    ...links.map((link)=>`Vínculo ${link.name}: ${link.status === 'PENDENTE' ? 'PENDENTE DE CONFIRMAÇÃO DA ESCALAÇÃO' : link.status}${link.missing.length ? `; requisitos não identificados: ${link.missing.join(' + ')}` : ''}`),
    'Não inferir atributos não lidos, habilidades não possuídas, ímpetos ou posições treinadas.'
  ].join('\n');
}
