'use client';

import type { ChangeEvent } from 'react';
import type { ConnectionProfile, GameplayMode } from '@/modules/analysis';

export function CalibrationProfileFields({
  gameplayMode,
  connectionProfile,
  onGameplayModeChange,
  onConnectionProfileChange
}: {
  gameplayMode: GameplayMode;
  connectionProfile: ConnectionProfile;
  onGameplayModeChange: (value: GameplayMode) => void;
  onConnectionProfileChange: (value: ConnectionProfile) => void;
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
        <span>Jeito de jogar</span>
        <output className="automatic-card-gameplay-field" aria-label="Jeito de jogar definido automaticamente pela carta">
          <strong>Automático pela carta</strong>
          <small>O app combina atributos, posição, Estilo de Jogo e habilidades desta versão da carta.</small>
        </output>
      </label>
    </>
  );
}
