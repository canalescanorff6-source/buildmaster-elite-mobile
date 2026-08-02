'use client';

import type { ChangeEvent } from 'react';
import type { ConnectionProfile, ControlProfile, GameplayMode } from '@/modules/analysis';

export function CalibrationProfileFields({
  gameplayMode,
  connectionProfile,
  controlProfile,
  onGameplayModeChange,
  onConnectionProfileChange,
  onControlProfileChange
}: {
  gameplayMode: GameplayMode;
  connectionProfile: ConnectionProfile;
  controlProfile: ControlProfile;
  onGameplayModeChange: (value: GameplayMode) => void;
  onConnectionProfileChange: (value: ConnectionProfile) => void;
  onControlProfileChange: (value: ControlProfile) => void;
}) {
  return (
    <>
      <label>
        <span>Modo da ficha</span>
        <select value={gameplayMode} onChange={(event: ChangeEvent<HTMLSelectElement>) => onGameplayModeChange(event.target.value as GameplayMode)}>
          <option value="UNIVERSAL">Universal — ranqueado e offline</option>
          <option value="RANKED">Ranqueado — robustez e resposta</option>
          <option value="OFFLINE">Offline — criatividade e domínio</option>
        </select>
      </label>
      <label>
        <span>Condição da conexão</span>
        <select value={connectionProfile} onChange={(event: ChangeEvent<HTMLSelectElement>) => onConnectionProfileChange(event.target.value as ConnectionProfile)}>
          <option value="VARIABLE">Variável — proteção contra oscilação</option>
          <option value="HIGH_DELAY">Delay alto — execução mais segura</option>
          <option value="STABLE">Estável — liberdade técnica</option>
        </select>
      </label>
      <label>
        <span>Seu jeito de jogar</span>
        <select value={controlProfile} onChange={(event: ChangeEvent<HTMLSelectElement>) => onControlProfileChange(event.target.value as ControlProfile)}>
          <option value="BALANCED">Equilibrado</option>
          <option value="PASSING">Passe e tabelas</option>
          <option value="DRIBBLE">Drible e condução</option>
          <option value="DIRECT">Vertical e direto</option>
        </select>
      </label>
    </>
  );
}
