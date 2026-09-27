import type { TacticalDirectorConflictR500, TacticalDirectorInputR500 } from './tacticalDirectorTypesR500';

export type TacticalDirectorContextValidationR500 = {
  blockedSources: Set<'R480' | 'R482' | 'R483' | 'R484'>;
  conflicts: TacticalDirectorConflictR500[];
  limitations: string[];
};

export function validateDirectorContextR500(input: TacticalDirectorInputR500): TacticalDirectorContextValidationR500 {
  const blockedSources = new Set<'R480' | 'R482' | 'R483' | 'R484'>();
  const conflicts: TacticalDirectorConflictR500[] = [];
  const limitations: string[] = [];

  function block(source: 'R480' | 'R482' | 'R483' | 'R484', description: string) {
    blockedSources.add(source);
    conflicts.push({
      id: `context:${source}:${conflicts.length + 1}`,
      level: 'BLOCKING',
      title: `Contexto incompatível em ${source}`,
      description,
      sourceIds: [source],
      penalty: 0
    });
    limitations.push(description);
  }

  if (input.tacticalTwin) {
    if (input.tacticalTwin.formation !== input.formation) {
      block('R480', `R480 pertence à formação ${input.tacticalTwin.formation}, diferente do contexto atual ${input.formation}.`);
    } else if (input.teamStyle !== 'AUTO' && input.tacticalTwin.teamStyle !== 'AUTO' && input.tacticalTwin.teamStyle !== input.teamStyle) {
      block('R480', `R480 pertence ao estilo ${input.tacticalTwin.teamStyle}, diferente do contexto atual ${input.teamStyle}.`);
    }
  }

  if (input.chemistry) {
    if (input.chemistry.formation !== input.formation) {
      block('R484', `R484 pertence à formação ${input.chemistry.formation}, diferente do contexto atual ${input.formation}.`);
    } else if (input.teamStyle !== 'AUTO' && input.chemistry.teamStyle !== 'AUTO' && input.chemistry.teamStyle !== input.teamStyle) {
      block('R484', `R484 pertence ao estilo ${input.chemistry.teamStyle}, diferente do contexto atual ${input.teamStyle}.`);
    }
  }

  if (input.matchVision) {
    if (input.matchVision.configuredContext.formation !== input.formation) {
      block('R482', `R482 pertence à formação ${input.matchVision.configuredContext.formation}, diferente do contexto atual ${input.formation}.`);
    } else if (input.teamStyle !== 'AUTO' && input.matchVision.configuredContext.teamStyle !== 'AUTO' && input.matchVision.configuredContext.teamStyle !== input.teamStyle) {
      block('R482', `R482 pertence ao estilo ${input.matchVision.configuredContext.teamStyle}, diferente do contexto atual ${input.teamStyle}.`);
    }
  }

  if (input.buildSimulator?.baselineFingerprint) {
    const baseline = String(input.buildSimulator.baselineFingerprint).trim();
    const official = String(input.officialDecisionFingerprint || '').trim();
    if (baseline && official && baseline !== official) {
      block('R483', `R483 usa baseline ${baseline}, diferente da decisão oficial ${official}.`);
    }
  }

  return { blockedSources, conflicts, limitations };
}
