import type { AnalysisResult, TacticalStyle } from './analyzerDomain';
import { getManager } from './managers';
import { V600_TEAM_PLAYSTYLES, type V600TeamPlaystyleId } from './efootballV600LiveCatalog';

export const MANAGER_META_V600_VERSION = '40.80-r8-manager-meta-v600' as const;

export type ManagerCombinationObservationV600 = {
  name: string;
  condition: string;
  confidence: number;
};

export type ManagerMetaV600 = {
  teamStyle: V600TeamPlaystyleId;
  teamStyleLabel: string;
  primaryStyle: string | null;
  secondaryStyle: string | null;
  combinationSlotsSupported: 2;
  observedCombinations: ManagerCombinationObservationV600[];
  status: 'CONFIGURADO' | 'PARCIAL' | 'SEM_DADOS';
  note: string;
};

function styleToV600(style: TacticalStyle | string | null | undefined): V600TeamPlaystyleId {
  if (style === 'CONTRA_ATAQUE_RAPIDO') return 'CONTRA_ATAQUE_RAPIDO';
  if (style === 'CONTRA_ATAQUE') return 'CONTRA_ATAQUE';
  if (style === 'POR_FORA') return 'POR_FORA';
  if (style === 'PASSE_LONGO') return 'PASSE_LONGO';
  return 'POSSE_DE_BOLA';
}

export function buildManagerMetaV600(result: AnalysisResult, observedCombinations: ManagerCombinationObservationV600[] = []): ManagerMetaV600 {
  const manager = getManager(result.tacticalProfile.managerId);
  const selected = styleToV600(result.tacticalProfile.style);
  const entry = V600_TEAM_PLAYSTYLES.find((item)=>item.id === selected) ?? V600_TEAM_PLAYSTYLES[0];
  const primaryStyle = manager?.primaryStyle ?? (result.tacticalProfile.style === 'AUTO' ? null : result.tacticalProfile.style);
  const secondaryStyle = manager?.secondaryStyle ?? null;
  const observations = observedCombinations
    .filter((item)=>item?.name?.trim())
    .map((item)=>({ ...item, name:item.name.trim(), condition:item.condition.trim(), confidence:Math.max(0,Math.min(100,Math.round(item.confidence))) }))
    .slice(0,2);
  const status: ManagerMetaV600['status'] = manager || primaryStyle ? (observations.length ? 'CONFIGURADO' : 'PARCIAL') : 'SEM_DADOS';
  return {
    teamStyle:selected,
    teamStyleLabel:entry.label,
    primaryStyle:primaryStyle ? String(primaryStyle) : null,
    secondaryStyle:secondaryStyle ? String(secondaryStyle) : null,
    combinationSlotsSupported:2,
    observedCombinations:observations,
    status,
    note:observations.length
      ? `Duas Combinações podem ser consideradas; ${observations.length} foi/foram informada(s) para este técnico.`
      : 'A v6.0 permite técnicos com duas Combinações. Sem leitura/entrada da carta do técnico, o app não inventa condições de ativação.'
  };
}
