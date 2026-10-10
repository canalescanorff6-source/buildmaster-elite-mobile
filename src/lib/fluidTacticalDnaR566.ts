import type { TacticalFormation, TacticalStyle } from './analyzerDomain';
import type { TeamDiagnosis } from '../modules/core/centralIntelligence';
import { getFormationBlueprint } from './formationRoleEngine';
import { inspectPlaystyleActivationR124 } from './efootball2027PhaseCatalogR124';

export const FLUID_TACTICAL_DNA_R566_VERSION = 'r566-evidence-readonly-1' as const;

type PhaseFindingR566 = 'COMPATIVEL' | 'INCOMPATIVEL' | 'PENDENTE';
export type FluidPlayerR566 = {
  attackSlot: string;
  player: string | null;
  attackPosition: string;
  defenseSlot: string | null;
  defensePosition: string | null;
  offensiveStyle: string | null;
  defensiveStyle: string | null;
  offense: PhaseFindingR566;
  defense: PhaseFindingR566;
  notes: string[];
};
export type FluidAuditR566 = {
  version: typeof FLUID_TACTICAL_DNA_R566_VERSION;
  mode: 'SOMENTE_LEITURA';
  attackFormation: TacticalFormation;
  defenseFormation: TacticalFormation;
  teamStyle: TacticalStyle;
  assigned: number;
  required: number;
  status: 'PENDENTE' | 'REVISAR';
  players: FluidPlayerR566[];
  warnings: string[];
  canApplyInGame: false;
};

/** Não altera formação nem cartas. A posição defensiva só existe quando o usuário a atribui explicitamente. */
export function buildFluidTacticalAuditR566(args: {
  team: TeamDiagnosis;
  defenseFormation: TacticalFormation;
  teamStyle: TacticalStyle;
  defenseSlotByAttackSlot: Readonly<Record<string, string>>;
}): FluidAuditR566 {
  const { team, defenseFormation, teamStyle, defenseSlotByAttackSlot } = args;
  const fallback = team.formation === 'AUTO' ? '4-2-2-2' : team.formation;
  const defense = getFormationBlueprint(defenseFormation === 'AUTO' ? fallback : defenseFormation);
  const slotById = new Map(defense.slots.map(slot => [slot.id, slot]));
  const selected = new Set<string>();
  const warnings: string[] = [];
  if (defenseFormation === 'AUTO' || team.formation === 'AUTO')
    warnings.push('Formação automática: confirmar manualmente as duas estruturas antes de avaliar.');
  const players: FluidPlayerR566[] = team.lineup.map(fit => {
    const notes: string[] = [];
    const selectedSlot = String(defenseSlotByAttackSlot[fit.slot.id] ?? '').trim();
    const defenseSlot = selectedSlot ? slotById.get(selectedSlot) : null;
    if (selectedSlot && !defenseSlot) notes.push('Posição defensiva inválida para a formação escolhida.');
    if (defenseSlot) {
      if (selected.has(defenseSlot.id)) notes.push('Duas cartas atribuídas ao mesmo espaço defensivo.');
      selected.add(defenseSlot.id);
    }
    const card = fit.player?.parsed;
    const offensiveStyle = card?.offensivePlaystyle || card?.playstyle || null;
    const defensiveStyle = card?.defensivePlaystyle || null;
    const offense = card
      ? inspectPlaystyleActivationR124(offensiveStyle, 'OFFENSIVE', fit.slot.position)
      : null;
    const defenseFinding = card && defenseSlot
      ? inspectPlaystyleActivationR124(defensiveStyle, 'DEFENSIVE', defenseSlot.position)
      : null;
    function status(finding: typeof offense): PhaseFindingR566 {
      if (!finding) return 'PENDENTE';
      if (finding.status === 'LIKELY_ACTIVE') return 'COMPATIVEL';
      if (finding.status === 'LIKELY_INACTIVE') return 'INCOMPATIVEL';
      return 'PENDENTE';
    }
    if (!card) notes.push('Sem carta escalada neste espaço.');
    if (card?.defensivePlaystyleConfirmed !== true && defensiveStyle)
      notes.push('Estilo defensivo ainda não confirmado no cadastro.');
    if (!offensiveStyle) notes.push('Estilo ofensivo não identificado.');
    if (!defensiveStyle) notes.push('Estilo defensivo não identificado.');
    if (offense?.status === 'LIKELY_INACTIVE') notes.push(offense.message);
    if (defenseFinding?.status === 'LIKELY_INACTIVE') notes.push(defenseFinding.message);
    const rawDefense = status(defenseFinding);
    return {
      attackSlot: fit.slot.id,
      player: card?.playerName ?? null,
      attackPosition: fit.slot.position,
      defenseSlot: defenseSlot?.id ?? null,
      defensePosition: defenseSlot?.position ?? null,
      offensiveStyle,
      defensiveStyle,
      offense: status(offense),
      defense: card?.defensivePlaystyleConfirmed === true ? rawDefense : 'PENDENTE',
      notes,
    };
  });
  const assigned = players.filter(player => player.defenseSlot && player.player).length;
  if (assigned < team.totalSlots) warnings.push('Atribuir individualmente todas as posições sem a bola; não copiar posições por índice.');
  if (selected.size < players.filter(player => player.defenseSlot).length) warnings.push('Mapeamento defensivo contém espaços repetidos.');
  if (players.some(p => p.offense === 'INCOMPATIVEL' || p.defense === 'INCOMPATIVEL'))
    warnings.push('Há estilos possivelmente inativos nas posições escolhidas.');
  if (players.some(p => !p.player || p.offense === 'PENDENTE' || p.defense === 'PENDENTE'))
    warnings.push('Evidência de fase incompleta: dados pendentes não são convertidos em compatibilidade.');
  return {
    version: FLUID_TACTICAL_DNA_R566_VERSION,
    mode: 'SOMENTE_LEITURA',
    attackFormation: team.formation,
    defenseFormation,
    teamStyle,
    assigned,
    required: team.totalSlots,
    status: warnings.length || assigned !== team.totalSlots ? 'PENDENTE' : 'REVISAR',
    players,
    warnings,
    canApplyInGame: false,
  };
}
