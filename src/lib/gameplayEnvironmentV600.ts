import type { AnalysisResult, ConnectionProfile } from './analyzerDomain';
import { safeStorageGetJson } from './safeLocalStorage';

export const GAMEPLAY_ENVIRONMENT_V600_VERSION = '40.80-r8-gameplay-environment' as const;
const ANTI_DELAY_PROFILE_STORAGE_KEY = 'buildmaster_anti_delay_profile_v2960';

type StoredGameplayProfile = {
  gameQualityMode?: 'desempenho' | 'equilibrado' | 'qualidade';
  stadiumQuality?: 'baixo' | 'padrao' | 'alto';
  targetFps?: 30 | 60 | 90 | 120;
};

export type GameplayEnvironmentV600 = {
  connectionProfile: ConnectionProfile;
  reliabilityWeight: number;
  delayRobustnessTarget: number;
  graphicsPolicy: 'ESTABILIDADE_PRIMEIRO';
  savedGraphicsMode: string;
  targetFps: number;
  stadiumQuality: string;
  diagnosis: string;
};

export function reliabilityForConnectionV600(profile: ConnectionProfile): number {
  if (profile === 'STABLE') return 1;
  if (profile === 'VARIABLE') return 0.72;
  return 0.52;
}

function readGameplayProfile(): Required<StoredGameplayProfile> {
  const stored = safeStorageGetJson<StoredGameplayProfile>(ANTI_DELAY_PROFILE_STORAGE_KEY, {});
  return {
    gameQualityMode:stored.gameQualityMode === 'qualidade' || stored.gameQualityMode === 'equilibrado' ? stored.gameQualityMode : 'desempenho',
    stadiumQuality:stored.stadiumQuality === 'alto' || stored.stadiumQuality === 'padrao' ? stored.stadiumQuality : 'baixo',
    targetFps:[30,60,90,120].includes(Number(stored.targetFps)) ? Number(stored.targetFps) as 30|60|90|120 : 60
  };
}

export function buildGameplayEnvironmentV600(result: AnalysisResult): GameplayEnvironmentV600 {
  const profile = result.efootballV600?.connectionProfile ?? result.tacticalProfile.connectionProfile ?? 'VARIABLE';
  const reliabilityWeight = reliabilityForConnectionV600(profile);
  const delayRobustnessTarget = profile === 'HIGH_DELAY' ? 92 : profile === 'VARIABLE' ? 84 : 72;
  const saved=readGameplayProfile();
  const connectionDiagnosis = profile === 'STABLE'
    ? 'Cenário estável: preserve o DNA e use o timing normal como referência.'
    : profile === 'VARIABLE'
      ? 'Conexão variável: prefira ficha e habilidades que reduzam a dependência de vários comandos consecutivos.'
      : 'Alta latência percebida: priorize primeiro toque, passe simples, equilíbrio e decisões defensivas com menos correções bruscas.';
  const diagnosis=`${connectionDiagnosis} Perfil salvo: gráfico ${saved.gameQualityMode}, estádio ${saved.stadiumQuality}, alvo ${saved.targetFps} FPS. O app prioriza estabilidade; não assume que tudo no baixo é sempre melhor.`;
  return { connectionProfile:profile, reliabilityWeight, delayRobustnessTarget, graphicsPolicy:'ESTABILIDADE_PRIMEIRO', savedGraphicsMode:saved.gameQualityMode, targetFps:saved.targetFps, stadiumQuality:saved.stadiumQuality, diagnosis };
}
