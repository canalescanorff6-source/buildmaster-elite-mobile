import type { AnalysisResult, AttributeKey, PositionCode, TacticalFormation, TacticalStyle } from '../../src/lib/analyzerDomain';

export type { AnalysisResult, AttributeKey, PositionCode, TacticalFormation, TacticalStyle };
export const ATTRIBUTE_PT = {} as Record<AttributeKey, string>;
export const ATTRIBUTE_INPUTS = [] as Array<{ key: AttributeKey; label: string }>;
export const POSITION_LABELS = [] as Array<{ code: PositionCode | 'AUTO'; label: string }>;
