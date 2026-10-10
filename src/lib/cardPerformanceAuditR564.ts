import type { AttributeKey, ParsedCard, TrainingKey, TrainingPlan } from './analyzerDomain';
import { TRAINING_KEYS, trainingPlanTotalCost } from './trainingPlanCore';

/**
 * R564 is a read-only certification boundary. It must not repair, clamp, save,
 * infer training budgets from player levels, or apply any manager boost.
 */
export type AuditSeverityR564 = 'BLOQUEIO' | 'REVISAO';
export type AuditIssueR564 = {
  code: string;
  severity: AuditSeverityR564;
  message: string;
};
export type BaseProvenanceR564 = 'PRE_MANAGER_CONFIRMED' | 'ALREADY_BOOSTED' | 'UNKNOWN';
export type BudgetProvenanceR564 = 'MANUAL_CONFIRMED' | 'OCR_UNREVIEWED' | 'LEVEL_INFERRED' | 'UNKNOWN';
export type CardAuditInputR564 = {
  card: Pick<ParsedCard, 'attributes' | 'nativeSkills' | 'impetos'> &
    Partial<Pick<ParsedCard, 'additionalSkills' | 'specialSkills' | 'trainingPointsTotal' | 'trainingPointSource' | 'evidence' | 'manualConfirmed'>>;
  plan: TrainingPlan;
  /** Explicit training-point budget; null means not verified. */
  budget: number | null;
  budgetProvenance: BudgetProvenanceR564;
  /** Do not infer this from a player screenshot or overall rating. */
  baseProvenance: BaseProvenanceR564;
  confirmedBaseAttributeKeys?: readonly AttributeKey[];
};
export type CardAuditR564 = {
  version: 'R564';
  status: 'APROVADO' | 'REVISAR' | 'BLOQUEADO';
  pointsUsed: number | null;
  budget: number | null;
  pointsRemaining: number | null;
  exactBudget: boolean;
  optimizationAllowed: boolean;
  /** Eligibility only; no +1 is applied to card.attributes here. */
  managerProjectionEligible: Partial<Record<'tightPossession' | 'balance', boolean>>;
  issues: AuditIssueR564[];
};

const REQUIRED_BOOSTER_KEYS = ['tightPossession', 'balance'] as const;
const MAX_ATTRIBUTES = 110;
const MAX_TRAINING_LEVEL = 16;

function keyName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function auditCardBuildR564(input: CardAuditInputR564): CardAuditR564 {
  const issues: AuditIssueR564[] = [];
  const push = (code: string, severity: AuditSeverityR564, message: string) => {
    if (!issues.some(issue => issue.code === code)) issues.push({ code, severity, message });
  };
  const allowedKeys = new Set<string>(TRAINING_KEYS);
  for (const key of Object.keys(input.plan)) {
    if (!allowedKeys.has(key)) push('TREINO_GRUPO_DESCONHECIDO', 'BLOQUEIO', 'Plano contém grupo de treino não reconhecido.');
  }
  for (const key of TRAINING_KEYS) {
    const level = input.plan[key];
    if (!Number.isInteger(level) || level < 0 || level > MAX_TRAINING_LEVEL) {
      push('TREINO_NIVEL_INVALIDO', 'BLOQUEIO', 'Os níveis de treino devem ser inteiros entre 0 e 16.');
    }
  }
  const validPlan = !issues.some(issue => issue.code.startsWith('TREINO_'));
  const pointsUsed = validPlan ? trainingPlanTotalCost(input.plan) : null;
  const budget = input.budget;
  const validBudget = budget !== null && Number.isSafeInteger(budget) && budget >= 0;
  if (!validBudget) push('ORCAMENTO_DESCONHECIDO', 'REVISAO', 'Orçamento não confirmado; não concluir recomendação.');
  if (input.budgetProvenance !== 'MANUAL_CONFIRMED') {
    push('ORCAMENTO_SEM_CONFERENCIA', 'REVISAO', 'Confirmar os pontos no jogo antes de otimizar.');
  }
  if (validBudget && pointsUsed !== null) {
    if (pointsUsed > budget!) push('TREINO_EXCEDE_ORCAMENTO', 'BLOQUEIO', 'O custo progressivo ultrapassa os pontos disponíveis.');
    else if (pointsUsed < budget!) push('TREINO_PONTOS_NAO_USADOS', 'REVISAO', 'Há pontos não usados; pode ser intencional.');
  }

  for (const [key, value] of Object.entries(input.card.attributes)) {
    if (value !== undefined && (!Number.isSafeInteger(value) || value < 1 || value > MAX_ATTRIBUTES)) {
      push('ATRIBUTO_FORA_DA_FAIXA', 'BLOQUEIO', 'Atributo inválido: ' + key + '.');
    }
  }
  const actualAttributeCount = Object.values(input.card.attributes)
    .filter(value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= MAX_ATTRIBUTES).length;
  if (actualAttributeCount < 26) push('ATRIBUTOS_INCOMPLETOS', 'REVISAO', 'A leitura não comprovou os 26 atributos da carta.');
  if (input.card.evidence?.criticalStateR419 === 'CONFLICTING') {
    push('EVIDENCIA_CONFLITANTE', 'BLOQUEIO', 'Há evidência crítica conflitante.');
  } else if (input.card.evidence?.criticalStateR419 === 'UNCERTAIN') {
    push('EVIDENCIA_INCERTA', 'REVISAO', 'Há dados críticos ainda pendentes de revisão.');
  }
  if ((input.card.additionalSkills ?? []).length > 5) {
    push('HABILIDADES_ACIMA_DO_LIMITE', 'BLOQUEIO', 'A carta excede cinco habilidades adicionais.');
  }
  const seen = new Set<string>();
  for (const skill of [...input.card.nativeSkills, ...(input.card.specialSkills ?? []), ...(input.card.additionalSkills ?? [])]) {
    const normalized = keyName(skill);
    if (!normalized) continue;
    if (seen.has(normalized)) push('HABILIDADE_DUPLICADA', 'REVISAO', 'Habilidade repetida entre listas da carta.');
    seen.add(normalized);
  }
  const impetos = (input.card.impetos ?? []).filter(item => item.active !== false);
  if (impetos.length > 2) push('IMPETOS_ACIMA_DO_LIMITE', 'BLOQUEIO', 'Mais de dois ímpetos ativos precisam de revisão.');
  if ((input.card.evidence?.impetoSlotStatus ?? 'NAO_CONFIRMADO') === 'NAO_CONFIRMADO') {
    push('IMPETO_SEM_EVIDENCIA', 'REVISAO', 'Vagas de ímpeto não comprovadas; não recomendar consumo de tokens.');
  }

  const confirmedBase = new Set(input.confirmedBaseAttributeKeys ?? []);
  const managerProjectionEligible: CardAuditR564['managerProjectionEligible'] = {};
  for (const key of REQUIRED_BOOSTER_KEYS) {
    const value = input.card.attributes[key];
    managerProjectionEligible[key] = input.baseProvenance === 'PRE_MANAGER_CONFIRMED'
      && confirmedBase.has(key) && Number.isSafeInteger(value) && value! >= 1 && value! <= MAX_ATTRIBUTES;
    if (!managerProjectionEligible[key]) {
      push('BONUS_BASE_PENDENTE_' + key, 'REVISAO',
        'Bônus de técnico pendente em ' + key + ': a origem sem bônus não está comprovada.');
    }
  }
  const blocked = issues.some(issue => issue.severity === 'BLOQUEIO');
  const status: CardAuditR564['status'] = blocked ? 'BLOQUEADO' : issues.length ? 'REVISAR' : 'APROVADO';
  const exactBudget = validBudget && pointsUsed !== null && pointsUsed === budget;
  return {
    version: 'R564',
    status,
    pointsUsed,
    budget: validBudget ? budget : null,
    pointsRemaining: validBudget && pointsUsed !== null ? budget! - pointsUsed : null,
    exactBudget,
    optimizationAllowed: !blocked && exactBudget && input.budgetProvenance === 'MANUAL_CONFIRMED'
      && input.baseProvenance === 'PRE_MANAGER_CONFIRMED'
      && actualAttributeCount === 26
      && Object.keys(input.card.attributes).every(key => confirmedBase.has(key as AttributeKey))
      && !issues.some(issue => issue.code === 'EVIDENCIA_INCERTA'),
    managerProjectionEligible,
    issues,
  };
}
