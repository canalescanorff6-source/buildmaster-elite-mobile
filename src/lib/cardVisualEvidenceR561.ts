import type { AnalysisResult, ParsedCard } from './analyzerDomain';
import type { ManagerRecord } from './managers';
import { projectManagerAttributesR560 } from './managerLinkEngineR560';
import { deriveProjectedPlayerStateR504, verifiedTrainingBaseAttributes } from '@/modules/analysis/projectedPlayerStateR504';

/** R561: never turn a recommendation or an unverified OCR guess into an owned skill/booster. */
export type SlotEvidenceStatusR561 = 'CONFIRMADO' | 'REGISTRADO' | 'PENDENTE' | 'LIVRE_CONFIRMADA' | 'SEM_VAGA';
export type DisplaySlotR561 = {
  id: string;
  label: string;
  value: string | null;
  status: SlotEvidenceStatusR561;
  source: string | null;
};
export type CardSlotsViewR561 = {
  skills: DisplaySlotR561[];
  boosters: DisplaySlotR561[];
  confirmed: number;
  recorded: number;
  pending: number;
};

const hasName = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const verifiedSource = (value: unknown): value is string =>
  value === 'OCR' || value === 'MANUAL' || value === 'CATALOGO_VERIFICADO';

export function buildCardSlotsViewR561(parsed: ParsedCard): CardSlotsViewR561 {
  const explicit = Array.isArray(parsed.additionalSkillSlotsR560) ? parsed.additionalSkillSlotsR560 : [];
  const legacy = Array.isArray(parsed.additionalSkills) ? parsed.additionalSkills.filter(hasName) : [];
  const skills: DisplaySlotR561[] = [1, 2, 3, 4, 5].map((index): DisplaySlotR561 => {
    const slot = explicit.find((item) => item?.slot === index);
    const value = hasName(slot?.skill) ? slot!.skill!.trim() : null;
    if (slot) {
      const source = verifiedSource(slot.source) ? slot.source : null;
      return {
        id: `skill-${index}`, label: `Habilidade ${index}`, value,
        status: value ? (source ? 'CONFIRMADO' : 'REGISTRADO') : source ? 'LIVRE_CONFIRMADA' : 'PENDENTE',
        source
      };
    }
    // Legacy slots have no slot-level provenance. Even a manually confirmed
    // card does not establish that every additional skill was individually confirmed.
    return {
      id: `skill-${index}`, label: `Habilidade ${index}`,
      value: legacy[index - 1]?.trim() || null,
      status: legacy[index - 1] ? 'REGISTRADO' : 'PENDENTE',
      source: null
    };
  });

  const slots = parsed.boosterSlotsR560;
  const legacyImpetos = Array.isArray(parsed.impetos)
    ? parsed.impetos.filter((item) => hasName(item?.name) && item.active !== false)
    : [];
  const primary = slots ? slots.primary?.name : legacyImpetos[0]?.name;
  const secondary = slots ? slots.secondary?.name : legacyImpetos[1]?.name;
  const primarySource = slots && verifiedSource(slots.source) ? slots.source : null;
  const boosters: DisplaySlotR561[] = [
    {
      id: 'booster-primary', label: 'Ímpeto principal', value: hasName(primary) ? primary.trim() : null,
      status: hasName(primary) ? (primarySource ? 'CONFIRMADO' : 'REGISTRADO') : 'PENDENTE',
      source: primarySource
    },
    {
      id: 'booster-secondary', label: 'Booster Crafting', value: hasName(secondary) ? secondary.trim() : null,
      status: hasName(secondary)
        ? primarySource ? 'CONFIRMADO' : 'REGISTRADO'
        : primarySource && slots?.secondaryStatus === 'DISPONIVEL' ? 'LIVRE_CONFIRMADA'
        : primarySource && slots?.secondaryStatus === 'SEM_VAGA' ? 'SEM_VAGA'
        : 'PENDENTE',
      source: primarySource
    }
  ];
  const all = [...skills, ...boosters];
  return {
    skills, boosters,
    confirmed: all.filter((item) => item.status === 'CONFIRMADO' || item.status === 'LIVRE_CONFIRMADA' || item.status === 'SEM_VAGA').length,
    recorded: all.filter((item) => item.status === 'REGISTRADO').length,
    pending: all.filter((item) => item.status === 'PENDENTE').length
  };
}

export type ManagerAttributeRowR561 = {
  key: 'tightPossession' | 'balance';
  label: string;
  base: number | null;
  bonus: number;
  projected: number | null;
  status: 'APLICADO' | 'PENDENTE';
};
export type ManagerAttributeViewR561 = {
  managerName: string;
  status: 'APLICADO' | 'PENDENTE';
  rows: ManagerAttributeRowR561[];
  note: string;
};

/**
 * Visual-only projection. The result, parsed attributes and saved history are
 * NEVER mutated. A screenshot alone is not a trustworthy pre-manager baseline.
 * We accept only exact, independently verified card base + the proposed training
 * as the baseline, and label it as an estimate (not an observed in-game stat).
 */
export function buildManagerAttributeViewR561(
  result: AnalysisResult,
  manager: ManagerRecord | null | undefined
): ManagerAttributeViewR561 | null {
  if (!manager?.attributeBoostsR560 || !Object.keys(manager.attributeBoostsR560).length) return null;
  const canInspectBase = Array.isArray(result.parsed?.trainingBase?.sources);
  const verifiedBase = canInspectBase ? verifiedTrainingBaseAttributes(result.parsed) : null;
  const proposed = verifiedBase && result.training
    ? deriveProjectedPlayerStateR504(result.parsed, result.training).finalAttributes
    : null;
  const projection = projectManagerAttributesR560(
    proposed ?? {}, manager, proposed ? 'BASE_SEM_BONUS_TECNICO' : 'INDETERMINADO'
  );
  const labels: Array<{ key: 'tightPossession' | 'balance'; label: string }> = [
    { key: 'tightPossession', label: 'Condução Firme' },
    { key: 'balance', label: 'Equilíbrio' }
  ];
  const rows = labels
    .filter(({ key }) => typeof manager.attributeBoostsR560?.[key] === 'number')
    .map(({ key, label }) => {
      const rawBase = proposed?.[key];
      const rawProjected = projection.attributes[key];
      const isSafe = projection.status === 'APLICADO' &&
        typeof rawBase === 'number' && Number.isFinite(rawBase) &&
        typeof rawProjected === 'number' && Number.isFinite(rawProjected);
      return {
        key, label, base: isSafe ? rawBase : null,
        bonus: Number(manager.attributeBoostsR560?.[key] ?? 0),
        projected: isSafe ? rawProjected : null,
        status: isSafe ? 'APLICADO' as const : 'PENDENTE' as const
      };
    });
  return {
    managerName: manager.name,
    status: rows.length > 0 && rows.every((row) => row.status === 'APLICADO') ? 'APLICADO' : 'PENDENTE',
    rows,
    note: proposed
      ? 'Projeção visual: edição exata verificada + treino proposto + bônus do técnico. Não altera o valor do print nem a ficha salva.'
      : 'Atributo-base sem bônus não comprovado. O print pode já incluir o técnico ou ímpetos: +1 não aplicado para evitar duplicação.'
  };
}
