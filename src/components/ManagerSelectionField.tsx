'use client';

import type { ChangeEvent } from 'react';
import { MANAGERS, getManager } from '@/lib/managers';
import type { TacticalStyle } from '@/modules/analysis';
import { tacticalStyleName } from '@/modules/architecture/appOptions';

export function ManagerSelectionField({ value, className, onChange }: {
  value: string;
  className?: string;
  onChange: (managerId: string, primaryStyle: TacticalStyle | null) => void;
}) {
  const groups = [
    ['LENDARIO_EPICO', 'Lendários e Épicos — Booster Duplo'],
    ['PACOTE_SELECAO', 'Pacotes especiais e seleções'],
    ['GP', 'Catálogo padrão (GP)']
  ] as const;
  return (
    <label className={className}>
      <span>Técnico e versão</span>
      <select value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => {
        const id = event.target.value;
        onChange(id, getManager(id)?.primaryStyle ?? null);
      }}>
        <option value="AUTO">Sem técnico definido — usar somente o estilo</option>
        {groups.map(([tier, label]) => (
          <optgroup key={tier} label={label}>
            {MANAGERS.filter((manager) => manager.tier === tier).map((manager) => (
              <option key={manager.id} value={manager.id}>{manager.name} • {manager.primaryProficiency} • {tacticalStyleName[manager.primaryStyle]}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
