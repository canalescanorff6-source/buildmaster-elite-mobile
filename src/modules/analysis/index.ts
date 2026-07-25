/**
 * Fachada pública da análise. Novas telas devem importar deste módulo, não do arquivo legado gigante.
 * Isso permite mover os motores internos sem quebrar a interface do aplicativo.
 */
export {
  analyzeCard,
  parseCard,
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
  type TacticalStyle
} from '@/lib/analyzerDomain';

export { OFFICIAL_ADDITIONAL_SKILL_NAMES } from './analyzerCatalog';
