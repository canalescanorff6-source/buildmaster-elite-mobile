import type { AttributeKey } from '../../lib/analyzerDomain';
import type { ProjectedPlayerStateR504 } from './projectedPlayerStateR504';
import {
  analyzePossessionR511,
  type PossessionUsageFunctionR511,
} from './possessionEngineR511';

export const GOLDEN_CARD_LAB_R513_VERSION = '40.80-r513-golden-card-lab-v1' as const;

export type GoldenScenarioR513 =
  | 'ORCHESTRATOR_POSSESSION'
  | 'ANCHOR_DMF_POSSESSION'
  | 'BOX_STRIKER'
  | 'INFILTRATOR'
  | 'BOX_TO_BOX'
  | 'DESTROYER'
  | 'BUILD_UP_CB'
  | 'DEFENSIVE_FULLBACK';

export type GoldenReferenceR513 = {
  id: string;
  scenario: GoldenScenarioR513;
  label: string;
  position: 'CMF' | 'DMF' | 'CF' | 'AMF' | 'CB' | 'RB';
  style: 'POSSESSION_CENTRAL';
  usageFunction: PossessionUsageFunctionR511;
  referenceKind: 'SYNTHETIC_ARCHETYPE';
  officialGameData: false;
  purpose: string;
};

export const GOLDEN_CARD_LAB_R513_REFERENCES: readonly GoldenReferenceR513[] = [
  {
    id: 'golden-r513-orchestrator-possession-001',
    scenario: 'ORCHESTRATOR_POSSESSION',
    label: 'Orquestrador em Posse',
    position: 'CMF',
    style: 'POSSESSION_CENTRAL',
    usageFunction: 'CMF_ORGANIZER',
    referenceKind: 'SYNTHETIC_ARCHETYPE',
    officialGameData: false,
    purpose: 'Linha curta, passe seguro, ruptura e saída sob pressão.',
  },
  {
    id: 'golden-r513-anchor-dmf-possession-001',
    scenario: 'ANCHOR_DMF_POSSESSION',
    label: '1º volante em Posse',
    position: 'DMF',
    style: 'POSSESSION_CENTRAL',
    usageFunction: 'DMF_PROTECTOR',
    referenceKind: 'SYNTHETIC_ARCHETYPE',
    officialGameData: false,
    purpose: 'Proteção central, linha curta, segurança e contrapressão.',
  },
  {
    id: 'golden-r513-box-striker-001',
    scenario: 'BOX_STRIKER',
    label: 'Homem de área',
    position: 'CF',
    style: 'POSSESSION_CENTRAL',
    usageFunction: 'CF_FINISHER',
    referenceKind: 'SYNTHETIC_ARCHETYPE',
    officialGameData: false,
    purpose: 'Recepção, giro, reposicionamento e conclusão da jogada central.',
  },
  {
    id: 'golden-r513-infiltrator-001',
    scenario: 'INFILTRATOR',
    label: 'Infiltração',
    position: 'AMF',
    style: 'POSSESSION_CENTRAL',
    usageFunction: 'AMF_INFILTRATOR',
    referenceKind: 'SYNTHETIC_ARCHETYPE',
    officialGameData: false,
    purpose: 'Primeiro toque, progressão central, ruptura e reposicionamento.',
  },
  {
    id: 'golden-r513-box-to-box-001',
    scenario: 'BOX_TO_BOX',
    label: 'Meia versátil',
    position: 'CMF',
    style: 'POSSESSION_CENTRAL',
    usageFunction: 'CMF_BOX_TO_BOX',
    referenceKind: 'SYNTHETIC_ARCHETYPE',
    officialGameData: false,
    purpose: 'Progressão, apoio, reposicionamento e contrapressão.',
  },
  {
    id: 'golden-r513-destroyer-001',
    scenario: 'DESTROYER',
    label: 'Destruidor',
    position: 'DMF',
    style: 'POSSESSION_CENTRAL',
    usageFunction: 'DMF_PROTECTOR',
    referenceKind: 'SYNTHETIC_ARCHETYPE',
    officialGameData: false,
    purpose: 'Proteção, duelo, contrapressão e passe seguro após recuperação.',
  },
  {
    id: 'golden-r513-build-up-cb-001',
    scenario: 'BUILD_UP_CB',
    label: 'Defensor criativo',
    position: 'CB',
    style: 'POSSESSION_CENTRAL',
    usageFunction: 'CB_BUILDER',
    referenceKind: 'SYNTHETIC_ARCHETYPE',
    officialGameData: false,
    purpose: 'Saída limpa, passe seguro, ruptura e reposicionamento defensivo.',
  },
  {
    id: 'golden-r513-defensive-fullback-001',
    scenario: 'DEFENSIVE_FULLBACK',
    label: 'Lateral defensivo',
    position: 'RB',
    style: 'POSSESSION_CENTRAL',
    usageFunction: 'FULLBACK_DEFENSIVE',
    referenceKind: 'SYNTHETIC_ARCHETYPE',
    officialGameData: false,
    purpose: 'Segurança lateral, apoio curto, proteção e saída sob pressão.',
  },
] as const;

export type GoldenDeterminismInputR513 = {
  referenceId: string;
  state: ProjectedPlayerStateR504;
  repetitions: number;
};

export type GoldenDeterminismResultR513 = {
  version: typeof GOLDEN_CARD_LAB_R513_VERSION;
  referenceId: string;
  scenario: GoldenScenarioR513;
  repetitions: number;
  uniqueOutputs: number;
  deterministic: boolean;
  status: 'PASS' | 'FAIL';
  certifiedForFinalWrite: false;
};

export type GoldenPerturbationInputR513 = {
  referenceId: string;
  state: ProjectedPlayerStateR504;
  perturbation: {
    attribute: AttributeKey;
    from: number;
    to: number;
    maxExpectedPossessionDelta: number;
  };
};

export type GoldenPerturbationResultR513 = {
  version: typeof GOLDEN_CARD_LAB_R513_VERSION;
  referenceId: string;
  scenario: GoldenScenarioR513;
  status: 'PASS' | 'REVIEW';
  changedAttributes: AttributeKey[];
  baseline: {
    attributeValue: number;
    possessionScore: number;
    calibrationStatus: 'PROVISIONAL_UNCALIBRATED';
  };
  perturbed: {
    attributeValue: number;
    possessionScore: number;
    calibrationStatus: 'PROVISIONAL_UNCALIBRATED';
  };
  possessionScoreDelta: number;
  maxExpectedPossessionDelta: number;
  certifiedForFinalWrite: false;
  reason: string;
};

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function goldenReferenceR513(referenceId: string): GoldenReferenceR513 {
  const reference = GOLDEN_CARD_LAB_R513_REFERENCES.find(item => item.id === referenceId);
  if (!reference) {
    throw new Error(`Referência Golden R513 desconhecida: ${referenceId}. Nenhum fallback foi aplicado.`);
  }
  return reference;
}

function normalizedRepetitionsR513(repetitions: number): number {
  const value = Number(repetitions);
  if (!Number.isInteger(value) || value < 2 || value > 100) {
    throw new Error('Golden R513: repetitions deve ser inteiro entre 2 e 100.');
  }
  return value;
}

function stablePossessionFingerprintR513(
  state: ProjectedPlayerStateR504,
  usageFunction: PossessionUsageFunctionR511,
): string {
  return JSON.stringify(analyzePossessionR511(state, { usageFunction }));
}

function changedAttributesR513(
  before: ProjectedPlayerStateR504,
  after: ProjectedPlayerStateR504,
): AttributeKey[] {
  const keys = new Set<AttributeKey>([
    ...(Object.keys(before.finalAttributes) as AttributeKey[]),
    ...(Object.keys(after.finalAttributes) as AttributeKey[]),
  ]);
  return [...keys]
    .filter(key => Number(before.finalAttributes[key]) !== Number(after.finalAttributes[key]))
    .sort((left, right) => left.localeCompare(right));
}

export function runGoldenDeterminismR513(
  input: GoldenDeterminismInputR513,
): GoldenDeterminismResultR513 {
  const reference = goldenReferenceR513(input.referenceId);
  const repetitions = normalizedRepetitionsR513(input.repetitions);
  const outputs = new Set<string>();

  for (let index = 0; index < repetitions; index += 1) {
    outputs.add(stablePossessionFingerprintR513(input.state, reference.usageFunction));
  }

  const deterministic = outputs.size === 1;
  return {
    version: GOLDEN_CARD_LAB_R513_VERSION,
    referenceId: reference.id,
    scenario: reference.scenario,
    repetitions,
    uniqueOutputs: outputs.size,
    deterministic,
    status: deterministic ? 'PASS' : 'FAIL',
    certifiedForFinalWrite: false,
  };
}

export function runGoldenPerturbationR513(
  input: GoldenPerturbationInputR513,
): GoldenPerturbationResultR513 {
  const reference = goldenReferenceR513(input.referenceId);
  const attribute = input.perturbation.attribute;
  const actualFrom = Number(input.state.finalAttributes[attribute]);
  const expectedFrom = Number(input.perturbation.from);
  const target = Number(input.perturbation.to);
  const maxExpectedDelta = Number(input.perturbation.maxExpectedPossessionDelta);

  if (!Number.isFinite(actualFrom) || actualFrom !== expectedFrom) {
    throw new Error(
      `Golden R513: valor inicial de ${attribute} é ${actualFrom}; cenário declarou ${expectedFrom}.`,
    );
  }
  if (!Number.isFinite(target) || target < 1 || target > 99) {
    throw new Error(`Golden R513: valor perturbado inválido para ${attribute}: ${target}.`);
  }
  if (!Number.isFinite(maxExpectedDelta) || maxExpectedDelta < 0) {
    throw new Error('Golden R513: maxExpectedPossessionDelta deve ser finito e não negativo.');
  }

  const perturbedState: ProjectedPlayerStateR504 = {
    ...input.state,
    finalAttributes: {
      ...input.state.finalAttributes,
      [attribute]: target,
    },
  };

  const changedAttributes = changedAttributesR513(input.state, perturbedState);
  const baselineAnalysis = analyzePossessionR511(input.state, {
    usageFunction: reference.usageFunction,
  });
  const perturbedAnalysis = analyzePossessionR511(perturbedState, {
    usageFunction: reference.usageFunction,
  });
  const delta = round6(perturbedAnalysis.possessionScore - baselineAnalysis.possessionScore);
  const onlyDeclaredAttributeChanged =
    changedAttributes.length === 1 && changedAttributes[0] === attribute;
  const monotonicDirectionOk = target < expectedFrom || delta >= -1e-9;
  const withinDeclaredBand = Math.abs(delta) <= maxExpectedDelta + 1e-9;
  const pass = onlyDeclaredAttributeChanged && monotonicDirectionOk && withinDeclaredBand;

  return {
    version: GOLDEN_CARD_LAB_R513_VERSION,
    referenceId: reference.id,
    scenario: reference.scenario,
    status: pass ? 'PASS' : 'REVIEW',
    changedAttributes,
    baseline: {
      attributeValue: actualFrom,
      possessionScore: round6(baselineAnalysis.possessionScore),
      calibrationStatus: baselineAnalysis.calibration.status,
    },
    perturbed: {
      attributeValue: target,
      possessionScore: round6(perturbedAnalysis.possessionScore),
      calibrationStatus: perturbedAnalysis.calibration.status,
    },
    possessionScoreDelta: delta,
    maxExpectedPossessionDelta: maxExpectedDelta,
    certifiedForFinalWrite: false,
    reason: pass
      ? `Perturbação ${attribute} ${expectedFrom}→${target} ficou estável dentro da faixa declarada (${maxExpectedDelta}).`
      : `Perturbação requer revisão: atributoÚnico=${onlyDeclaredAttributeChanged}; direçãoRacional=${monotonicDirectionOk}; dentroDaFaixa=${withinDeclaredBand}.`,
  };
}
