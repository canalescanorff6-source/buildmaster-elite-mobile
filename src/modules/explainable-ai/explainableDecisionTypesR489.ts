import type { AnalysisResult } from '../../lib/analyzer';
import type {
  TacticalTwinScenarioR480,
  TacticalTwinSnapshotR480
} from '../tactical-twin/tacticalTwinEngineR480';
import type {
  SquadBrainCorePlayerR481,
  SquadBrainRotationR481,
  SquadBrainSnapshotR481
} from '../squad-brain/squadBrainEngineR481';
import type { MatchVisionSnapshotR482 } from '../matches/matchVisionEngineR482';
import type { BuildSimulatorSnapshotR483 } from '../build-simulator/buildSimulatorEngineR483';
import type {
  ChemistryGraphSnapshotR484,
  ChemistryRotationImpactR484
} from '../chemistry/chemistryGraphEngineR484';

export type EvidenceSourceR489 = 'R128' | 'R480' | 'R481' | 'R482' | 'R483' | 'R484';

export type EvidenceFamilyR489 =
  | 'OFFICIAL_DECISION'
  | 'TACTICAL_STRUCTURE'
  | 'SQUAD_STRUCTURE'
  | 'MATCH_EVIDENCE'
  | 'BUILD_ALTERNATIVES'
  | 'CHEMISTRY';

export type EvidenceAvailabilityR489 = 'AVAILABLE' | 'BLOCKED' | 'UNAVAILABLE' | 'NOT_APPLICABLE';

export type ExplainableEvidenceR489 = {
  id: string;
  source: EvidenceSourceR489;
  family: EvidenceFamilyR489;
  claim: string;
  nativeConfidence: number;
  relevance: number;
  independence: number;
  completeness: number;
  effectiveWeight: number;
  fingerprint: string;
};

export type ExplainableReasonKindR489 = 'BENEFIT' | 'TRADE_OFF' | 'RISK' | 'CONTRADICTION';

export type ExplainableReasonR489 = {
  rank: number;
  type: ExplainableReasonKindR489;
  title: string;
  explanation: string;
  evidenceIds: string[];
  impact: number;
};

export type ExplainableCounterfactualR489 = {
  available: boolean;
  explanation: string | null;
  evidenceIds: string[];
};

export type ExplainableAvailabilityR489 = {
  r480: EvidenceAvailabilityR489;
  r481: EvidenceAvailabilityR489;
  r482: EvidenceAvailabilityR489;
  r483: EvidenceAvailabilityR489;
  r484: EvidenceAvailabilityR489;
};

export type ExplainableDecisionKindR489 = 'BUILD' | 'STARTER' | 'ROTATION' | 'TACTICAL' | 'MATCH';

export type ExplainableAuthorityR489 = {
  readOnly: true;
  canWriteTraining: false;
  canWriteSkills: false;
  canWriteImpetus: false;
  canChangePosition: false;
  canChangeLineupAutomatically: false;
  canConfirmMatchMarkersAutomatically: false;
  canWriteVault: false;
  canOverrideR119: false;
  canOverrideR126: false;
  canOverrideR128: false;
  optimizeOverall: false;
};

export type ExplainableDecisionR489 = {
  version: string;
  kind: ExplainableDecisionKindR489;
  verdict: string;
  decisionConfidence: number;
  performanceConfidence: number | null;
  evidenceState: 'FULL' | 'PARTIAL' | 'INSUFFICIENT';
  availability: ExplainableAvailabilityR489;
  reasons: ExplainableReasonR489[];
  evidence: ExplainableEvidenceR489[];
  benefits: string[];
  tradeOffs: string[];
  risks: string[];
  alternatives: string[];
  counterfactual: ExplainableCounterfactualR489;
  limitations: string[];
  fingerprint: string;
  authority: ExplainableAuthorityR489;
  guardrails: string[];
};

type ExplainableInputBaseR489<K extends ExplainableDecisionKindR489> = {
  kind: K;
  decisionId: string;
  verdict: string;
  availability: ExplainableAvailabilityR489;
};

export type ExplainableBuildInputR489 = ExplainableInputBaseR489<'BUILD'> & {
  result?: AnalysisResult;
  buildSimulator?: BuildSimulatorSnapshotR483 | null;
};

export type ExplainableStarterInputR489 = ExplainableInputBaseR489<'STARTER'> & {
  starter?: SquadBrainCorePlayerR481 | null;
  squadBrain?: SquadBrainSnapshotR481 | null;
  chemistry?: ChemistryGraphSnapshotR484 | null;
};

export type ExplainableRotationInputR489 = ExplainableInputBaseR489<'ROTATION'> & {
  rotation?: SquadBrainRotationR481 | null;
  scenario?: TacticalTwinScenarioR480 | null;
  tacticalTwin?: TacticalTwinSnapshotR480 | null;
  squadBrain?: SquadBrainSnapshotR481 | null;
  chemistry?: ChemistryGraphSnapshotR484 | null;
  chemistryImpact?: ChemistryRotationImpactR484 | null;
};

export type ExplainableTacticalInputR489 = ExplainableInputBaseR489<'TACTICAL'> & {
  scenario?: TacticalTwinScenarioR480 | null;
  tacticalTwin?: TacticalTwinSnapshotR480 | null;
  squadBrain?: SquadBrainSnapshotR481 | null;
  chemistry?: ChemistryGraphSnapshotR484 | null;
};

export type ExplainableMatchInputR489 = ExplainableInputBaseR489<'MATCH'> & {
  matchVision?: MatchVisionSnapshotR482 | null;
};

export type ExplainableDecisionInputR489 =
  | ExplainableBuildInputR489
  | ExplainableStarterInputR489
  | ExplainableRotationInputR489
  | ExplainableTacticalInputR489
  | ExplainableMatchInputR489;
