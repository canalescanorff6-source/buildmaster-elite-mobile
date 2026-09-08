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

// R126/R128 permanecem internos para regressão/migração histórica.
// Código de aplicação deve entrar exclusivamente pela fachada R138 abaixo.

// R138: fachada obrigatória para criação/refresh/guarda de resultados de produção.
export { createProductionAnalysisR138, rebuildProductionAnalysisR138, ensureProductionAnalysisR138, productionUsagePositionR138 } from './productionOrchestratorR138';
