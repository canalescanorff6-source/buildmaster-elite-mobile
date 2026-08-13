import type { PositionCode } from './analyzerDomain';
import {
  FORMATION_ROLE_CATALOG,
  type FormationBlueprint,
  type FormationRoleId,
  type FormationSlot
} from './formationRoleEngine';
import { readAccountStorage, writeAccountStorage } from './accountStorage';

export const FLUID_FORMATION_V600_VERSION = '6.0.0-buildmaster-1' as const;
export const FLUID_FORMATION_STORAGE_KEY = 'buildmaster_fluid_formation_v600';

export type FluidFormationPhaseV600 = 'attack' | 'defense';
export type FluidDefensivePresetV600 = 'COMPACTO_CENTRAL' | 'MANUAL_SEGURO' | 'BLOCO_ALTO' | 'PERSONALIZADO';
export type FluidTeamPlaystyleV600 = 'LEGADO' | 'POSSE_DE_BOLA' | 'CONTRA_ATAQUE_RAPIDO' | 'CONTRA_ATAQUE' | 'POR_FORA' | 'PASSE_LONGO' | 'SOBREPOSICAO';

export type FluidFormationPlanV600 = {
  engineVersion: typeof FLUID_FORMATION_V600_VERSION;
  baseId: string;
  enabled: boolean;
  teamPlaystyle: FluidTeamPlaystyleV600;
  defensivePreset: FluidDefensivePresetV600;
  attack: FormationBlueprint;
  defense: FormationBlueprint;
  updatedAt: string;
};

const POSITION_LABELS: Record<PositionCode, string> = {
  CF:'CA', SS:'SA', LWF:'PE', RWF:'PD', LMF:'ME', RMF:'MD', AMF:'MAT', CMF:'MLG', DMF:'VOL', CB:'ZAG', LB:'LE', RB:'LD', GK:'GOL'
};

export function cloneFormationV600(source: FormationBlueprint): FormationBlueprint {
  return {
    ...source,
    family: 'personalizada',
    slots: source.slots.map((slot) => ({
      ...slot,
      alternatives: [...slot.alternatives],
      primaryRoles: [...slot.primaryRoles],
      complementaryRoles: [...slot.complementaryRoles],
      keyTraits: [...slot.keyTraits]
    }))
  };
}

function lineForPosition(position: PositionCode): FormationSlot['line'] {
  if (position === 'GK') return 'goleiro';
  if (['LB','CB','RB'].includes(position)) return 'defesa';
  if (['CF','SS','LWF','RWF'].includes(position)) return 'ataque';
  return 'meio';
}

function alternativesForPosition(position: PositionCode): PositionCode[] {
  const map: Partial<Record<PositionCode, PositionCode[]>> = {
    CF:['SS'], SS:['CF','AMF','LWF','RWF'], LWF:['SS','LMF'], RWF:['SS','RMF'],
    AMF:['SS','CMF'], LMF:['LWF','CMF'], RMF:['RWF','CMF'], CMF:['AMF','DMF','LMF','RMF'],
    DMF:['CMF'], LB:['LMF','CB'], RB:['RMF','CB'], CB:['LB','RB'], GK:[]
  };
  return [...(map[position] ?? [])];
}

function rolesForPosition(position: PositionCode): FormationRoleId[] {
  return Object.values(FORMATION_ROLE_CATALOG)
    .filter((role) => role.positions.includes(position) || role.usablePositions?.includes(position))
    .map((role) => role.id);
}

function labelForPosition(position: PositionCode, x: number): string {
  const side = x < 43 ? ' E' : x > 57 ? ' D' : '';
  if (position === 'CF') return `CA${side}`;
  if (position === 'SS') return `SA${side}`;
  if (position === 'AMF') return `MAT${side}`;
  if (position === 'CMF') return `MLG${side}`;
  if (position === 'DMF') return `VOL${side}`;
  if (position === 'CB') return x < 43 ? 'ZAG E' : x > 57 ? 'ZAG D' : 'ZAG C';
  return POSITION_LABELS[position];
}

export function normalizeFluidSlotV600(slot: FormationSlot, position: PositionCode, x: number, y: number): FormationSlot {
  const compatible = rolesForPosition(position);
  const primary = slot.primaryRoles.find((role) => compatible.includes(role)) ?? compatible[0] ?? slot.primaryRoles[0];
  return {
    ...slot,
    position,
    x: Math.max(5, Math.min(95, Math.round(x * 10) / 10)),
    y: position === 'GK' ? 93 : Math.max(7, Math.min(88, Math.round(y * 10) / 10)),
    label: labelForPosition(position, x),
    line: lineForPosition(position),
    alternatives: alternativesForPosition(position),
    primaryRoles: primary ? [primary] : slot.primaryRoles,
    complementaryRoles: compatible.filter((role) => role !== primary).slice(0, 4)
  };
}

function attackDescription(slots: FormationSlot[]): string {
  const attack = slots.filter((slot) => slot.y < 29 && slot.position !== 'GK');
  const counts = new Map<PositionCode, number>();
  for (const slot of attack) counts.set(slot.position, (counts.get(slot.position) ?? 0) + 1);
  return (['LWF','SS','CF','RWF'] as PositionCode[]).flatMap((position) => {
    const count = counts.get(position) ?? 0;
    return count ? [`${count > 1 ? `${count} ` : ''}${POSITION_LABELS[position]}`] : [];
  }).join(' + ') || 'estrutura personalizada';
}

export function inferFormationNameV600(slots: FormationSlot[]): string {
  const field = slots.filter((slot) => slot.position !== 'GK');
  const lines = [
    field.filter((slot) => slot.y >= 68).length,
    field.filter((slot) => slot.y >= 53 && slot.y < 68).length,
    field.filter((slot) => slot.y >= 29 && slot.y < 53).length,
    field.filter((slot) => slot.y < 29).length
  ].filter((value) => value > 0);
  return `${lines.join('-') || 'Personalizada'} • ${attackDescription(slots)}`;
}

export function inferPositionV600(x: number, y: number, current: PositionCode): PositionCode {
  if (current === 'GK') return 'GK';
  if (y >= 68) {
    if (x <= 22) return 'LB';
    if (x >= 78) return 'RB';
    return 'CB';
  }
  if (y >= 50) {
    if (x <= 15) return 'LMF';
    if (x >= 85) return 'RMF';
    return y >= 58 ? 'DMF' : 'CMF';
  }
  if (y >= 29) {
    if (x <= 15) return 'LMF';
    if (x >= 85) return 'RMF';
    return 'AMF';
  }
  if (x <= 18) return 'LWF';
  if (x >= 82) return 'RWF';
  if (x >= 38 && x <= 62 && y <= 18) return 'CF';
  return 'SS';
}

export function deriveCompactDefenseV600(attack: FormationBlueprint, preset: Exclude<FluidDefensivePresetV600, 'PERSONALIZADO'> = 'COMPACTO_CENTRAL'): FormationBlueprint {
  const high = preset === 'BLOCO_ALTO';
  const manualSafe = preset === 'MANUAL_SEGURO';
  const fieldAttackers = attack.slots.filter((slot) => ['CF','SS','LWF','RWF'].includes(slot.position));
  const centralCf = fieldAttackers.find((slot) => slot.position === 'CF') ?? fieldAttackers.slice().sort((a,b) => Math.abs(a.x - 50) - Math.abs(b.x - 50))[0];
  const slots = attack.slots.map((slot) => {
    if (slot.position === 'GK') return normalizeFluidSlotV600(slot, 'GK', 50, 93);
    if (slot.position === 'CB') return normalizeFluidSlotV600(slot, 'CB', slot.x, high ? 72 : manualSafe ? 80 : 79);
    if (slot.position === 'LB') return normalizeFluidSlotV600(slot, 'LB', 10, high ? 67 : manualSafe ? 76 : 74);
    if (slot.position === 'RB') return normalizeFluidSlotV600(slot, 'RB', 90, high ? 67 : manualSafe ? 76 : 74);
    if (slot.position === 'DMF') return normalizeFluidSlotV600(slot, 'DMF', slot.x, high ? 53 : manualSafe ? 60 : 61);
    if (slot.position === 'CMF') return normalizeFluidSlotV600(slot, 'CMF', slot.x, high ? 46 : manualSafe ? 53 : 54);
    if (slot.position === 'LMF') return normalizeFluidSlotV600(slot, 'LMF', 15, high ? 42 : manualSafe ? 50 : 49);
    if (slot.position === 'RMF') return normalizeFluidSlotV600(slot, 'RMF', 85, high ? 42 : manualSafe ? 50 : 49);
    if (centralCf && slot.id === centralCf.id) return normalizeFluidSlotV600(slot, 'CF', 50, high ? 20 : manualSafe ? 27 : 24);
    if (slot.x < 24) return normalizeFluidSlotV600(slot, 'LMF', 15, high ? 35 : manualSafe ? 46 : 43);
    if (slot.x > 76) return normalizeFluidSlotV600(slot, 'RMF', 85, high ? 35 : manualSafe ? 46 : 43);
    return normalizeFluidSlotV600(slot, manualSafe ? 'CMF' : 'AMF', slot.x < 50 ? Math.max(28, slot.x) : Math.min(72, slot.x), high ? 31 : manualSafe ? 46 : 40);
  });
  const name = inferFormationNameV600(slots);
  return {
    ...cloneFormationV600(attack),
    id: `${attack.id}-def-v600`,
    name: `${name} • ${high ? 'Bloco alto' : manualSafe ? 'Manual seguro' : 'Bloco compacto'}`,
    description: high
      ? 'Fase defensiva v6.0 com linha mais alta e pressão coordenada; exige boa Dedicação defensiva e recuperação.'
      : manualSafe
        ? 'Fase defensiva v6.0 para controle manual: bloco um pouco mais baixo, VOL/MLG próximos e apenas uma referência principal de pressão.'
        : 'Fase defensiva v6.0 compacta, reduzindo distâncias e mantendo apoios centrais para marcação mais manual.',
    behavior: high ? 'Pressiona mais alto sem abrir mão da compactação central.' : manualSafe ? 'Marca o espaço antes da bola e reduz o risco de dois jogadores saírem juntos.' : 'Fecha o centro e mantém coberturas curtas entre meio e defesa.',
    slots
  };
}

export function createFluidFormationPlanV600(baseId: string, attack: FormationBlueprint): FluidFormationPlanV600 {
  const cleanAttack = cloneFormationV600(attack);
  return {
    engineVersion: FLUID_FORMATION_V600_VERSION,
    baseId,
    enabled: true,
    teamPlaystyle: 'LEGADO',
    defensivePreset: 'COMPACTO_CENTRAL',
    attack: cleanAttack,
    defense: deriveCompactDefenseV600(cleanAttack, 'COMPACTO_CENTRAL'),
    updatedAt: new Date().toISOString()
  };
}

export function readFluidFormationPlanV600(): FluidFormationPlanV600 | null {
  try {
    const parsed = JSON.parse(readAccountStorage(FLUID_FORMATION_STORAGE_KEY) || 'null') as FluidFormationPlanV600 | null;
    if (!parsed?.attack?.slots?.length || !parsed?.defense?.slots?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeFluidFormationPlanV600(plan: FluidFormationPlanV600): void {
  writeAccountStorage(FLUID_FORMATION_STORAGE_KEY, JSON.stringify({ ...plan, updatedAt: new Date().toISOString() }));
}
