export const SKILL_WORKFLOW_R121_VERSION = '40.80-r121-skill-workflow' as const;

export type SkillWorkflowProgress = Record<string, boolean>;

export type SkillWorkflowStateR121 = {
  skills: string[];
  pending: string[];
  completed: string[];
  total: number;
  done: number;
  remaining: number;
  percent: number;
};

export function buildSkillWorkflowStateR121(skills: string[], progress?: SkillWorkflowProgress): SkillWorkflowStateR121 {
  const unique = Array.from(new Set(skills.filter((skill) => typeof skill === 'string' && Boolean(skill.trim()))));
  const completed = unique.filter((skill) => Boolean(progress?.[skill]));
  const pending = unique.filter((skill) => !progress?.[skill]);
  const total = unique.length;
  const done = completed.length;
  return {
    skills: unique,
    pending,
    completed,
    total,
    done,
    remaining: Math.max(0, total - done),
    percent: total ? Math.round((done / total) * 100) : 0
  };
}

export function reconcileSkillProgressR121(skills: string[], progress?: SkillWorkflowProgress): SkillWorkflowProgress {
  const state = buildSkillWorkflowStateR121(skills, progress);
  return Object.fromEntries(state.skills.map((skill) => [skill, Boolean(progress?.[skill])])) as SkillWorkflowProgress;
}

export function deriveSkillVaultStatusR121(
  skills: string[],
  progress: SkillWorkflowProgress | undefined,
  currentStatus?: 'completo' | 'pendente' | 'revisar'
): 'completo' | 'pendente' | 'revisar' {
  if (currentStatus === 'revisar') return 'revisar';
  const state = buildSkillWorkflowStateR121(skills, progress);
  if (!state.total) return 'pendente';
  return state.done >= state.total ? 'completo' : 'pendente';
}
