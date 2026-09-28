import {
  INTELLIGENT_LEARNING_R470_VERSION,
  type LearningProposalR470,
} from '../../lib/intelligentLearningR470';
import type {
  BuildOutcomeActionR460,
  BuildOutcomeCalibrationR460,
} from '../matches/buildOutcomeCalibrationR460';
import {
  GAMEPLAY_ENGINE_R510_CALIBRATION,
  GAMEPLAY_ENGINE_R510_VERSION,
  type GameplayActionIdR510,
} from './gameplayEngineR510';

export const GAMEPLAY_CALIBRATION_BRIDGE_R516_VERSION = '40.80-r516-real-match-calibration-bridge-v1' as const;
export const GAMEPLAY_CALIBRATION_BRIDGE_R516_MODE = 'READ_ONLY_EXPERIMENTAL' as const;
export const GAMEPLAY_CALIBRATION_BRIDGE_R516_MAX_MULTIPLIER = 1.06 as const;

type PrimitiveShareR516 = {
  action: GameplayActionIdR510;
  share: number;
};

/**
 * Tradução explícita entre o vocabulário histórico de evidência R460 e os
 * primitivos funcionais do Gameplay Engine 2 R510.
 *
 * A ausência de uma entrada é intencional: quando o R510 não possui um
 * primitivo semanticamente equivalente, a evidência é declarada como não
 * suportada em vez de receber um mapeamento aproximado/inventado.
 */
export const GAMEPLAY_CALIBRATION_BRIDGE_R516_MAP: Readonly<Record<string, readonly PrimitiveShareR516[]>> = {
  attack_space: [
    { action: 'attackingMovement', share: 1 },
  ],
  finish_box: [
    { action: 'finishingAction', share: 0.8 },
    { action: 'attackingMovement', share: 0.2 },
  ],
  turn_finish: [
    { action: 'finishingAction', share: 0.55 },
    { action: 'pressEscape', share: 0.25 },
    { action: 'centralCarry', share: 0.2 },
  ],
  long_finish: [
    { action: 'finishingAction', share: 1 },
  ],
  close_control: [
    { action: 'firstTouchUnderPressure', share: 0.45 },
    { action: 'centralCarry', share: 0.3 },
    { action: 'pressEscape', share: 0.25 },
  ],
  carry: [
    { action: 'centralCarry', share: 0.7 },
    { action: 'pressEscape', share: 0.3 },
  ],
  short_creation: [
    { action: 'shortCombination', share: 0.7 },
    { action: 'lineBreakingPass', share: 0.3 },
  ],
  through_creation: [
    { action: 'lineBreakingPass', share: 0.8 },
    { action: 'shortCombination', share: 0.2 },
  ],
  hold_up: [
    { action: 'duelShield', share: 0.7 },
    { action: 'firstTouchUnderPressure', share: 0.3 },
  ],
  aerial_finish: [
    { action: 'aerialDuel', share: 0.55 },
    { action: 'finishingAction', share: 0.45 },
  ],
  aerial_defend: [
    { action: 'aerialDuel', share: 0.55 },
    { action: 'defensiveDuel', share: 0.45 },
  ],
  press_recover: [
    { action: 'defensiveDuel', share: 1 },
  ],
  intercept: [
    { action: 'defensiveDuel', share: 1 },
  ],
  defensive_duel: [
    { action: 'defensiveDuel', share: 1 },
  ],
  build_out: [
    { action: 'shortCombination', share: 0.5 },
    { action: 'lineBreakingPass', share: 0.3 },
    { action: 'pressEscape', share: 0.2 },
  ],
};

export type GameplayCalibrationPrimitiveCandidateR516 = {
  action: GameplayActionIdR510;
  suggestedMultiplier: number;
  sourceMultiplier: number;
  confidence: number;
  evidenceActionIds: string[];
  reasons: string[];
};

export type GameplayCalibrationBridgeR516 = {
  version: typeof GAMEPLAY_CALIBRATION_BRIDGE_R516_VERSION;
  mode: typeof GAMEPLAY_CALIBRATION_BRIDGE_R516_MODE;
  status: 'OBSERVE' | 'CANDIDATE';
  source: {
    r460: BuildOutcomeCalibrationR460['version'];
    r470: typeof INTELLIGENT_LEARNING_R470_VERSION;
  };
  target: {
    r510: typeof GAMEPLAY_ENGINE_R510_VERSION;
    r510CalibrationStatus: typeof GAMEPLAY_ENGINE_R510_CALIBRATION.status;
    certifiedForFinalWrite: typeof GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite;
  };
  productionWriteAllowed: false;
  automaticApplyAllowed: false;
  humanReviewRequired: true;
  primitiveCandidates: GameplayCalibrationPrimitiveCandidateR516[];
  unsupportedEvidenceActions: string[];
  reasons: string[];
  safeguards: string[];
};

export type GameplayCalibrationBridgeInputR516 = {
  outcome: BuildOutcomeCalibrationR460;
  proposal: Pick<
    LearningProposalR470,
    'kind' | 'status' | 'risk' | 'autoPromotionEligible' | 'reason' | 'evidence'
  >;
};

type MutableCandidateR516 = {
  action: GameplayActionIdR510;
  suggestedMultiplier: number;
  sourceMultiplier: number;
  confidence: number;
  evidenceActionIds: Set<string>;
  reasons: Set<string>;
};

const round = (value: number, digits = 4) => Number(value.toFixed(digits));
const clamp = (value: number, minimum: number, maximum: number) => (
  Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : minimum))
);

function persistentGapActionsR516(outcome: BuildOutcomeCalibrationR460): BuildOutcomeActionR460[] {
  if (outcome.status !== 'ACTIVE') return [];
  return outcome.actions.filter((action) => action.status === 'PERSISTENT_GAP');
}

function authoritativeSourceMultiplierR516(
  outcome: BuildOutcomeCalibrationR460,
  action: BuildOutcomeActionR460,
): number {
  const learned = Number(outcome.actionLearningMultipliers[action.id]);
  const fallback = Number(action.learningMultiplier);
  const requested = Number.isFinite(learned) ? learned : fallback;
  return clamp(requested, 1, GAMEPLAY_CALIBRATION_BRIDGE_R516_MAX_MULTIPLIER);
}

function gateIsOpenR516(input: GameplayCalibrationBridgeInputR516): boolean {
  return input.outcome.status === 'ACTIVE'
    && input.proposal.status === 'PROPOSED'
    && input.proposal.kind === 'CALIBRATION_WEIGHT';
}

export function buildGameplayCalibrationBridgeR516(
  input: GameplayCalibrationBridgeInputR516,
): GameplayCalibrationBridgeR516 {
  const primitiveRows = new Map<GameplayActionIdR510, MutableCandidateR516>();
  const unsupported = new Set<string>();
  const persistent = persistentGapActionsR516(input.outcome);
  const gateOpen = gateIsOpenR516(input);

  if (gateOpen) {
    for (const evidenceAction of persistent) {
      const mapping = GAMEPLAY_CALIBRATION_BRIDGE_R516_MAP[evidenceAction.id];
      if (!mapping?.length) {
        unsupported.add(evidenceAction.id);
        continue;
      }

      const sourceMultiplier = authoritativeSourceMultiplierR516(input.outcome, evidenceAction);
      if (sourceMultiplier <= 1) continue;

      for (const primitive of mapping) {
        const share = clamp(Number(primitive.share), 0, 1);
        if (share <= 0) continue;

        // Pressões concorrentes nunca são somadas/compostas. Mantemos apenas a
        // maior pressão já sustentada por evidência para preservar o teto R460.
        const suggestedMultiplier = round(
          1 + (sourceMultiplier - 1) * share,
          4,
        );
        const previous = primitiveRows.get(primitive.action);

        if (!previous) {
          primitiveRows.set(primitive.action, {
            action: primitive.action,
            suggestedMultiplier,
            sourceMultiplier,
            confidence: clamp(Number(evidenceAction.confidence), 0, 100),
            evidenceActionIds: new Set([evidenceAction.id]),
            reasons: new Set([evidenceAction.reason]),
          });
          continue;
        }

        previous.suggestedMultiplier = Math.max(previous.suggestedMultiplier, suggestedMultiplier);
        previous.sourceMultiplier = Math.max(previous.sourceMultiplier, sourceMultiplier);
        previous.confidence = Math.max(previous.confidence, clamp(Number(evidenceAction.confidence), 0, 100));
        previous.evidenceActionIds.add(evidenceAction.id);
        previous.reasons.add(evidenceAction.reason);
      }
    }
  }

  const primitiveCandidates = [...primitiveRows.values()]
    .map((candidate): GameplayCalibrationPrimitiveCandidateR516 => ({
      action: candidate.action,
      suggestedMultiplier: clamp(
        round(candidate.suggestedMultiplier, 4),
        1,
        GAMEPLAY_CALIBRATION_BRIDGE_R516_MAX_MULTIPLIER,
      ),
      sourceMultiplier: clamp(
        round(candidate.sourceMultiplier, 4),
        1,
        GAMEPLAY_CALIBRATION_BRIDGE_R516_MAX_MULTIPLIER,
      ),
      confidence: round(candidate.confidence, 1),
      evidenceActionIds: [...candidate.evidenceActionIds].sort(),
      reasons: [...candidate.reasons],
    }))
    .sort((left, right) => (
      right.suggestedMultiplier - left.suggestedMultiplier
      || left.action.localeCompare(right.action)
    ));

  const status: GameplayCalibrationBridgeR516['status'] = gateOpen && primitiveCandidates.length
    ? 'CANDIDATE'
    : 'OBSERVE';

  const reasons = !gateOpen
    ? [
        input.outcome.status !== 'ACTIVE'
          ? `R460 está ${input.outcome.status}; nenhuma pressão de calibração é derivada.`
          : `R470 está ${input.proposal.status}/${input.proposal.kind}; o gate de calibração permanece fechado.`,
      ]
    : primitiveCandidates.length
      ? [
          `${primitiveCandidates.length} primitivo(s) R510 receberam pressão experimental limitada por evidência R460/R470.`,
          input.proposal.autoPromotionEligible
            ? 'A evidência pode seguir para revisão R472; isso não autoriza aplicação automática.'
            : 'A evidência ainda não atingiu elegibilidade de revisão R470.',
        ]
      : ['Há lacuna persistente, mas nenhuma possui tradução semântica segura para os primitivos R510 atuais.'];

  return {
    version: GAMEPLAY_CALIBRATION_BRIDGE_R516_VERSION,
    mode: GAMEPLAY_CALIBRATION_BRIDGE_R516_MODE,
    status,
    source: {
      r460: input.outcome.version,
      r470: INTELLIGENT_LEARNING_R470_VERSION,
    },
    target: {
      r510: GAMEPLAY_ENGINE_R510_VERSION,
      r510CalibrationStatus: GAMEPLAY_ENGINE_R510_CALIBRATION.status,
      certifiedForFinalWrite: GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite,
    },
    productionWriteAllowed: false,
    automaticApplyAllowed: false,
    humanReviewRequired: true,
    primitiveCandidates,
    unsupportedEvidenceActions: [...unsupported].sort(),
    reasons,
    safeguards: [
      'R516 é read-only e experimental; não escreve ficha, treino, skill ou Ímpeto.',
      'R460 precisa estar ACTIVE e R470 precisa propor CALIBRATION_WEIGHT.',
      'Multiplicadores herdados são limitados a 1.06 e nunca são compostos entre evidências.',
      'Ações sem equivalente semântico no R510 permanecem explicitamente não suportadas.',
      'R472 continua responsável pelo gate de revisão humana antes de qualquer promoção.',
      'R119/R126/R128 permanecem autoridades de produção.',
    ],
  };
}
