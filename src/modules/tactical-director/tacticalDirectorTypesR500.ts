import type { TacticalStyle } from '../../lib/analyzer';
import type { MatchValidationRecord } from '../../lib/appStartupContractsR200';
import type { TacticalTwinSnapshotR480, TacticalTwinScenarioIdR480 } from '../tactical-twin/tacticalTwinEngineR480';
import type { SquadBrainSnapshotR481 } from '../squad-brain/squadBrainEngineR481';
import type { MatchVisionSnapshotR482 } from '../matches/matchVisionEngineR482';
import type { BuildSimulatorSnapshotR483 } from '../build-simulator/buildSimulatorEngineR483';
import type { ChemistryGraphSnapshotR484 } from '../chemistry/chemistryGraphEngineR484';
import type { ExplainableDecisionR489 } from '../explainable-ai/explainableDecisionTypesR489';

export type TacticalDirectorAvailabilityR500 = 'READY' | 'PARTIAL' | 'INSUFFICIENT' | 'BLOCKED';
export type TacticalDirectorConflictLevelR500 = 'NONE' | 'LOW' | 'MATERIAL' | 'BLOCKING';
export type TacticalDirectorPhaseR500 = 'PRE_MATCH' | 'IN_MATCH_PREPARED' | 'POST_MATCH';
export type TacticalDirectorScenarioR500 = TacticalTwinScenarioIdR480;

export type TacticalDirectorLineupContextR500 = {
  slotId: string;
  cardFingerprint: string | null;
};

export type TacticalDirectorConfidenceR500 = {
  planConfidence: number;
  evidenceConfidence: number;
  executionConfidence: number;
};

export type TacticalDirectorActionR500 = {
  id: string;
  title: string;
  description: string;
  priority: number;
  evidenceIds: string[];
};

export type TacticalDirectorContingencyR500 = {
  scenario: TacticalDirectorScenarioR500;
  label: string;
  summary: string;
  actionIds: string[];
};

export type TacticalDirectorConflictR500 = {
  id: string;
  level: TacticalDirectorConflictLevelR500;
  title: string;
  description: string;
  sourceIds: string[];
  penalty: number;
};

export type TacticalDirectorEvidenceFamilyR500 =
  | 'OFFICIAL_CONTEXT'
  | 'STRUCTURAL_TEAM'
  | 'MATCH_CONFIRMED'
  | 'BUILD_ALTERNATIVE'
  | 'PRO_META';

export type TacticalDirectorEvidenceR500 = {
  id: string;
  family: TacticalDirectorEvidenceFamilyR500;
  source: 'R128' | 'R480' | 'R481' | 'R482' | 'R483' | 'R484' | 'PRO_META';
  claim: string;
  nativeConfidence: number;
  relevance: number;
  independence: number;
  completeness: number;
  contextCompatibility: number;
  effectiveWeight: number;
  fingerprint: string;
};

export type ProMetaPlatformR500 = 'MOBILE' | 'CONSOLE' | 'UNKNOWN';
export type ProMetaMatchFormatR500 = '1V1' | '2V2' | 'UNKNOWN';

export type ProMetaObservationR500 = {
  id: string;
  sourceUrl: string;
  sourceFingerprint: string;
  sourceType: 'OFFICIAL_MATCH' | 'OFFICIAL_EVENT' | 'VERIFIED_PRO_CONTENT' | 'VERIFIED_RANKED';
  competition: string;
  stage: string;
  playerLabel: string;
  platform: ProMetaPlatformR500;
  gameVersion: string;
  matchFormat: ProMetaMatchFormatR500;
  rulesetId: string;
  rulesetFingerprint: string;
  rulesetTags: string[];
  formation: string | null;
  teamStyle: TacticalStyle | null;
  tacticalTags: string[];
  observations: string[];
};

export type ProMetaDatasetR500 = {
  version: string;
  generatedAtBuild?: string;
  observations: ProMetaObservationR500[];
};

export type ProMetaCompatibilityR500 = {
  platform: number;
  patch: number;
  matchFormat: number;
  ruleset: number;
  tacticalContext: number;
  finalCompatibility: number;
};

export type TacticalDirectorProMetaSummaryR500 = {
  datasetVersion: string | null;
  datasetDigest: string | null;
  applicableObservations: number;
  strongestCompatibility: number;
  patterns: string[];
  limitations: string[];
};

export type TacticalDirectorMemoryStateR500 = 'SEM_EVIDENCIA' | 'EM_OBSERVACAO' | 'TENDENCIA' | 'CONFIRMADO';

export type TacticalDirectorMemoryR500 = {
  state: TacticalDirectorMemoryStateR500;
  compatibleMatches: number;
  confirmedSessions: number;
  patterns: string[];
  limitations: string[];
};

export type TacticalDirectorExplanationLinkR500 = {
  kind: ExplainableDecisionR489['kind'];
  fingerprint: string;
  verdict: string;
};

export type TacticalDirectorAuthorityR500 = {
  readOnly: true;
  canWriteTraining: false;
  canWriteSkills: false;
  canWriteImpetus: false;
  canChangePosition: false;
  canChangeLineupAutomatically: false;
  canConfirmMatchMarkersAutomatically: false;
  canWriteVault: false;
  canPersistTacticalMemory: false;
  canOverrideR119: false;
  canOverrideR126: false;
  canOverrideR128: false;
  optimizeOverall: false;
};

export type TacticalDirectorPlanR500 = {
  version: string;
  availability: TacticalDirectorAvailabilityR500;
  phase: TacticalDirectorPhaseR500;
  contextFingerprint: string;
  planFingerprint: string;
  scenario: TacticalDirectorScenarioR500;
  title: string;
  summary: string;
  priorities: string[];
  risks: string[];
  recommendedActions: TacticalDirectorActionR500[];
  contingencies: TacticalDirectorContingencyR500[];
  conflicts: TacticalDirectorConflictR500[];
  confidence: TacticalDirectorConfidenceR500;
  evidence: TacticalDirectorEvidenceR500[];
  proMeta: TacticalDirectorProMetaSummaryR500;
  memory: TacticalDirectorMemoryR500;
  explanations: TacticalDirectorExplanationLinkR500[];
  limitations: string[];
  authority: TacticalDirectorAuthorityR500;
  guardrails: string[];
};

export type TacticalDirectorInputR500 = {
  officialDecisionFingerprint: string;
  formation: string;
  teamStyle: TacticalStyle;
  lineupContext?: TacticalDirectorLineupContextR500[];
  tacticalTwin?: TacticalTwinSnapshotR480 | null;
  squadBrain?: SquadBrainSnapshotR481 | null;
  matchVision?: MatchVisionSnapshotR482 | null;
  buildSimulator?: BuildSimulatorSnapshotR483 | null;
  chemistry?: ChemistryGraphSnapshotR484 | null;
  explanations?: ExplainableDecisionR489[];
  confirmedMatchRecords: MatchValidationRecord[];
  proMetaDataset?: ProMetaDatasetR500 | null;
  currentScenario?: TacticalDirectorScenarioR500;
  previousPlan?: TacticalDirectorPlanR500 | null;
};
