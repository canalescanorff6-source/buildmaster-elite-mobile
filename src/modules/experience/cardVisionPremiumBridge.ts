'use client';

import { useEffect } from 'react';
import { readPremiumExperience2Preferences, removePremiumDraft, savePremiumDraft, type Premium2Target } from './premiumExperience2';

export type PremiumMainSection = 'inicio' | 'jogadores' | 'partidas' | 'leitor' | 'manual' | 'resultado' | 'cofre' | 'time' | 'ajustes' | 'menu' | 'buscar';
export type PremiumSettingsView = 'evolucao' | 'experiencia' | 'aparencia' | 'desempenho' | 'seguranca' | 'suporte' | 'backup' | 'atualizacoes' | 'contas';

export function premiumTargetForSection(section: PremiumMainSection): Premium2Target {
  if (section === 'inicio') return 'home';
  if (section === 'leitor') return 'reader';
  if (section === 'manual') return 'manual';
  if (section === 'cofre' || section === 'jogadores' || section === 'resultado') return 'vault';
  if (section === 'time') return 'team';
  if (section === 'partidas') return 'matches';
  if (section === 'menu') return 'home';
  if (section === 'buscar') return 'vault';
  return 'appearance';
}

export function sectionForPremiumTarget(target: Premium2Target): PremiumMainSection {
  if (target === 'home') return 'inicio';
  if (target === 'reader') return 'leitor';
  if (target === 'manual') return 'manual';
  if (target === 'vault') return 'cofre';
  if (target === 'team') return 'time';
  if (target === 'matches') return 'partidas';
  return 'ajustes';
}

export function settingsViewForPremiumTarget(target: Premium2Target): PremiumSettingsView | null {
  if (target === 'appearance') return 'aparencia';
  if (target === 'performance') return 'desempenho';
  if (target === 'security') return 'seguranca';
  if (target === 'support') return 'suporte';
  if (target === 'backup') return 'backup';
  if (target === 'updates') return 'atualizacoes';
  return null;
}

export function usePremiumDraftAutosave(input: {
  section: PremiumMainSection;
  preview: string | null;
  rawText: string;
  playerName: string;
  points: string;
  targetPosition: string;
  playstyle: string;
}) {
  useEffect(() => {
    const preferences = readPremiumExperience2Preferences();
    if (!preferences.autosaveDrafts || (input.section !== 'leitor' && input.section !== 'manual')) return;
    const hasInput = Boolean(input.preview || input.rawText.trim() || input.playerName.trim() || input.points.trim());
    if (!hasInput) return;
    const timer = window.setTimeout(() => {
      const signals = [Boolean(input.preview || input.rawText.trim()), Boolean(input.playerName.trim()), input.targetPosition !== 'AUTO', input.playstyle !== 'AUTO', Number(input.points || 0) > 0];
      savePremiumDraft({
        id: 'current-creation',
        target: input.section === 'leitor' ? 'reader' : 'manual',
        label: input.playerName.trim() ? `Ficha de ${input.playerName.trim()}` : 'Nova ficha em andamento',
        completion: Math.round((signals.filter(Boolean).length / signals.length) * 100),
        payload: { playerName: input.playerName, points: input.points, targetPosition: input.targetPosition, playstyle: input.playstyle, hasPrint: Boolean(input.preview) }
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [input.section, input.preview, input.rawText, input.playerName, input.points, input.targetPosition, input.playstyle]);
}

export function clearPremiumCreationDraft(): void {
  removePremiumDraft('current-creation');
  removePremiumDraft('current-reader');
  removePremiumDraft('current-manual');
}
