export type SavedSkillProgress = Record<string, boolean>;

export function skillProgressInfo(skills: string[], progress: SavedSkillProgress | undefined) {
  const unique = Array.from(new Set(skills));
  const done = unique.filter((skill) => progress?.[skill]).length;
  return {
    done,
    total: unique.length,
    percent: unique.length ? Math.round((done / unique.length) * 100) : 0,
  };
}
