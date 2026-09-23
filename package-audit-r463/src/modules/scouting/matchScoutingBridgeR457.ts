import type { AnalysisResult } from '@/lib/analyzerDomain';
import type { MatchEvidenceCalibrationR136 } from '@/modules/matches/matchEvidenceCalibrationR136';
import { CURRENT_EFOOTBALL_GAME_VERSION_R457, type GameplayScoutingConfidenceR454, type GameplayScoutingSourceR454 } from './gameplayScoutingR454';
import { readGameplayScoutingForResultR454, upsertGameplayScoutingR454 } from './gameplayScoutingRepositoryR454';

export const MATCH_SCOUTING_BRIDGE_R457_VERSION='40.80-r457-match-scouting-bridge-v1' as const;
export const MATCH_SCOUTING_SOURCE_PREFIX_R457='match-r136:' as const;

function confidence(score:number):GameplayScoutingConfidenceR454{
  return score>=82?'ALTA':score>=60?'MEDIA':'BAIXA';
}
export function buildMatchScoutingSourceR457(calibration:MatchEvidenceCalibrationR136):GameplayScoutingSourceR454|null{
  if(!calibration.rawMatches)return null;
  return {
    id:`${MATCH_SCOUTING_SOURCE_PREFIX_R457}${calibration.evidenceFingerprint}`,
    type:'USER_GAMEPLAY',
    label:`Partidas reais R136 • ${calibration.rawMatches} jogo(s) • ${calibration.distinctSessions} sessão(ões)`,
    gameVersion:CURRENT_EFOOTBALL_GAME_VERSION_R457,
    observedAt:calibration.latestMatchAt??new Date(0).toISOString(),
    confidence:confidence(calibration.confidenceScore),
    note:[
      `Status ${calibration.status}; ${calibration.effectiveMatches.toFixed(2)} partida(s) efetiva(s).`,
      `Recência ${calibration.recencyScore}/100; patch atual ${calibration.currentPatchShare}/100.`,
      calibration.reasons[1]??''
    ].filter(Boolean).join(' ')
  };
}

export function syncMatchEvidenceIntoScoutingR457(result:AnalysisResult):AnalysisResult{
  const calibration=result.matchEvidenceCalibrationR136;
  if(!calibration)return result;
  const current=readGameplayScoutingForResultR454(result);
  const source=buildMatchScoutingSourceR457(calibration);
  const preserved=(current.sources??[]).filter(item=>!String(item.id).startsWith(MATCH_SCOUTING_SOURCE_PREFIX_R457));
  const sources=source?[...preserved,source]:preserved;
  const changed=JSON.stringify(sources)!==JSON.stringify(current.sources??[]);
  const next=changed?upsertGameplayScoutingR454({
    ...current,
    sources,
    testedByUser:calibration.rawMatches>0||current.testedByUser,
    lastReviewed:calibration.latestMatchAt??current.lastReviewed
  }):current;
  return {...result,gameplayScoutingR454:next} as AnalysisResult;
}
