import { readAccountStorage } from '@/lib/accountStorage';
import { readAccountJsonR141 } from '@/modules/backup/backupStorageJsonR165';
import { safeStorageGet } from '@/lib/safeLocalStorage';
import type { BackupEnvelope } from '@/lib/dataSafety';
import { ACTIVE_SESSION_KEY, CALIBRATION_KEY, RULE_PACK_URL_KEY, VAULT_FOLDERS_KEY } from '@/modules/architecture/appOptions';
import { readActiveSessionBackupPayloadR157 } from '@/modules/session/activeSessionRepositoryR137';
import { CALIBRATION_STORAGE_KEY } from '@/modules/matches/calibrationStorage';
import { LEARNING_KEY, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';
import { CORRECTION_KEY, RULE_PACK_KEY } from '@/modules/builds/dynamicRules';
import { RULE_PACK_HISTORY_V3770_KEY } from '@/lib/continuousRulesV3770';
import { REMOTE_CATALOG_V3770_STORAGE_KEY } from '@/lib/remoteCatalogV3770';
import { readOfficialRulePack } from '@/modules/rules/officialRuleRegistry';
import { ONBOARDING_STORAGE_KEY, CARD_REGISTRY_STORAGE_KEY } from '@/lib/appEvolution';
import { CENTRAL_MIGRATION_STORAGE_KEY } from '@/modules/core/centralIntelligence';
import { CENTRAL_INDEX_STORAGE_KEY } from '@/modules/core/centralRepository';
import { exportCreatorBuildResearch } from '@/lib/creatorBuildResearch';
import { readMatchValidationRepositoryR137 } from '@/modules/matches/matchValidationRepositoryR137';
import { exportTacticalPosterLibrary } from '@/lib/tacticalPosterLibrary';
import { readTacticalSequenceProjects } from '@/modules/tactical-studio/tacticalStudio2Storage';
import { readOpponentMatchPlans } from '@/modules/opponents/opponentPlanStorage';
import { readMetaFormationProjects } from '@/modules/tactical-studio/metaFormationStudioV3832';
import { exportTacticalImageLibrary } from '@/modules/images/accountImageLibrary';
import { COMPETITIVE_MATCH_STORAGE_KEY } from '@/modules/matches/competitivePerformanceEngine';
import { TRAINING_EVOLUTION_STORAGE_KEY, TRAINING_GOALS_STORAGE_KEY } from '@/modules/training/trainingEvolutionEngine';
import { ANTI_DELAY_LINK_STORAGE_KEY, ANTI_DELAY_PROFILE_STORAGE_KEY, ANTI_DELAY_STORAGE_KEY } from '@/modules/performance/antiDelayEngine';
import { SMART_COACH_PREFERENCES_KEY, SMART_COACH_REVIEW_STORAGE_KEY } from '@/modules/coaching/smartCoachEngine';
import { exportPremiumExperience2State } from '@/modules/experience/premiumExperience2';
import { exportObservabilityState } from '@/modules/observability/observabilityEngine';
import { readMatchTrainerSessions } from '@/modules/matches/matchTrainerEngine';
import { exportCommunityState } from '@/modules/community/communitySharing';
import { exportCommercialState } from '@/modules/commercial/commercialization';
import { exportPlayStorePublicationState } from '@/modules/publication/playStorePublication';
import { createEfhubCalibrationMap, type EfhubCalibrationZone } from '@/modules/card-reader/efhubCalibrationModelR164';
import { runtimeList } from '@/lib/localDatabase';
import type { OcrZone } from '@/lib/ocrZonesModelR164';
import type { VaultFolder } from '@/lib/vaultUsability';

export { readAccountJsonR141 } from '@/modules/backup/backupStorageJsonR165';

function calibration(ocrZones: OcrZone[], efhub: EfhubCalibrationZone[]) {
  return { matches: readAccountJsonR141(CALIBRATION_STORAGE_KEY, {}), ocrZones: readAccountJsonR141(CALIBRATION_KEY, ocrZones), efhubVisualMap: createEfhubCalibrationMap(efhub), learning: readAccountJsonR141(LEARNING_KEY, {}), corrections: readAccountJsonR141(CORRECTION_KEY, {}) };
}
function evolution() {
  return { onboarding: readAccountJsonR141(ONBOARDING_STORAGE_KEY, null), cardRegistry: readAccountJsonR141(CARD_REGISTRY_STORAGE_KEY, []), matchValidation: readMatchValidationRepositoryR137(), centralIntelligence: readAccountJsonR141(CENTRAL_MIGRATION_STORAGE_KEY, null), centralEntityIndex: readAccountJsonR141(CENTRAL_INDEX_STORAGE_KEY, null), creatorBuildResearch: exportCreatorBuildResearch() };
}

type Input = { history: SavedAnalysis[]; folders: VaultFolder[]; settings: Record<string, unknown>; profileAvatar: string | null; ocrZones: OcrZone[]; efhubCalibrationZones: EfhubCalibrationZone[] };

export async function collectFullBackupSectionsR141(input: Input): Promise<BackupEnvelope['sections']> {
  return {
    history: input.history,
    settings: { ...((readAccountJsonR141('buildmaster_ui_prefs_v24_24', input.settings) || {}) as Record<string, unknown>), profileAvatar: input.profileAvatar, autoUpdateCheck: (safeStorageGet('buildmaster_auto_update_check') ?? safeStorageGet('buildmaster_auto_update_check_v26_70')) !== '0' },
    calibration: { ...calibration(input.ocrZones, input.efhubCalibrationZones), ocrLexicon: (await runtimeList('ocr-lexicon', 500).catch(() => [])).map((entry) => entry.value) },
    plans: readAccountJsonR141('buildmaster_team_plans_v25_19', {}), folders: readAccountJsonR141(VAULT_FOLDERS_KEY, []),
    rules: { pack: readAccountJsonR141(RULE_PACK_KEY, null), historyV3770: readAccountJsonR141(RULE_PACK_HISTORY_V3770_KEY, []), remoteCatalogV3770: readAccountJsonR141(REMOTE_CATALOG_V3770_STORAGE_KEY, null), officialPack: readOfficialRulePack(), url: readAccountStorage(RULE_PACK_URL_KEY) || '' },
    evolution: evolution(), session: readActiveSessionBackupPayloadR157(ACTIVE_SESSION_KEY),
    tacticalStudio: { schema: 3832, posterProjects: exportTacticalPosterLibrary(), sequences: readTacticalSequenceProjects(), opponentPlans: readOpponentMatchPlans(), metaFormations: readMetaFormationProjects() },
    customFormations: readAccountJsonR141('buildmaster_custom_formations_v26_77', []), imageGallery: await exportTacticalImageLibrary(),
    performance: { competitiveMatches: readAccountJsonR141(COMPETITIVE_MATCH_STORAGE_KEY, []), trainingSessions: readAccountJsonR141(TRAINING_EVOLUTION_STORAGE_KEY, []), trainingGoals: readAccountJsonR141(TRAINING_GOALS_STORAGE_KEY, {}), guidedTrainingLogs: readAccountJsonR141('buildmaster_guided_training_logs_v2739', []), guidedWeeklyGoal: readAccountJsonR141('buildmaster_weekly_training_goal_v2739', 3), antiDelaySamples: readAccountJsonR141(ANTI_DELAY_STORAGE_KEY, []), antiDelayLinks: readAccountJsonR141(ANTI_DELAY_LINK_STORAGE_KEY, []), antiDelayProfile: readAccountJsonR141(ANTI_DELAY_PROFILE_STORAGE_KEY, null), smartCoachReviews: readAccountJsonR141(SMART_COACH_REVIEW_STORAGE_KEY, []), smartCoachPreferences: readAccountJsonR141(SMART_COACH_PREFERENCES_KEY, null), premiumExperience2: exportPremiumExperience2State(), observability: exportObservabilityState(), matchTrainerSessions: readMatchTrainerSessions() },
    community: exportCommunityState(), commercial: exportCommercialState(), publication: exportPlayStorePublicationState()
  };
}

export function collectPlayersBackupSectionsR141(input: Pick<Input,'history'|'folders'|'ocrZones'|'efhubCalibrationZones'>): BackupEnvelope['sections'] {
  return { history: input.history, folders: input.folders, calibration: calibration(input.ocrZones,input.efhubCalibrationZones), evolution: evolution() };
}
