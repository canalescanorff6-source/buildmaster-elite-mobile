/**
 * Fachada pública da análise. Novas telas devem importar deste módulo, não do arquivo legado gigante.
 * Isso permite mover os motores internos sem quebrar a interface do aplicativo.
 */
export {
  ATTRIBUTE_INPUTS,
  POSITION_LABELS
} from '@/lib/analyzer';
export {
  normalizeObjective,
  PLAYSTYLE_OPTIONS,
  POSITION_PT,
  ATTRIBUTE_PT,
  type AnalysisResult,
  type AttributeKey,
  type Objective,
  type PositionCode,
  type TacticalFormation,
  type TacticalProfile,
  type TacticalStyle,
  type GameplayMode,
  type ConnectionProfile,
  type ControlProfile
} from '@/lib/analyzerDomain';

export { ALL_RECOGNIZABLE_PLAYER_SKILL_NAMES, OFFICIAL_ADDITIONAL_SKILL_NAMES, SPECIAL_SKILL_NAMES } from './analyzerCatalog';

// R510 / Fase 3: diagnóstico read-only sobre o estado projetado R504.
// Não grava ficha, Top 5 ou Ímpeto e não substitui a autoridade final R138/R119.
export {
  analyzeGameplayEngineR510,
  GAMEPLAY_ENGINE_R510_VERSION,
  type GameplayActionIdR510,
  type GameplayEngineContextR510,
  type GameplayEngineResultR510,
  type GameplayActionScoreR510,
  type GameplayBottleneckR510,
  type MarginalTrainingOptionR510,
} from './gameplayEngineR510';

// R511 / Fase 4: Posse central por função sobre o R510.
// Continua somente diagnóstico; calibração permanece provisória e sem escrita final.
export {
  analyzePossessionR511,
  POSSESSION_ACTION_IDS_R511,
  POSSESSION_ENGINE_R511_VERSION,
  POSSESSION_ENGINE_R511_CALIBRATION,
  type PossessionActionIdR511,
  type PossessionUsageFunctionR511,
  type PossessionActionScoreR511,
  type PossessionAnalysisInputR511,
  type PossessionEngineResultR511,
} from './possessionEngineR511';

// R126/R128 permanecem internos para regressão/migração histórica.
// Código de aplicação deve entrar exclusivamente pela fachada R138 abaixo.

// R138: fachada obrigatória para criação/refresh/guarda de resultados de produção.
export { createProductionAnalysisR138, rebuildProductionAnalysisR138, ensureProductionAnalysisR138, productionUsagePositionR138 } from './productionOrchestratorR138';
