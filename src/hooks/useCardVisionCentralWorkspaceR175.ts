'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TacticalFormation, TacticalStyle } from '@/lib/analyzerDomain';
import { CARD_REGISTRY_STORAGE_KEY, MATCH_VALIDATION_STORAGE_KEY, ONBOARDING_STORAGE_KEY } from '@/lib/appEvolution';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { cancelIdleTask, scheduleIdleTask } from '@/lib/performanceScheduler';
import { recordSafeRuntimeError } from '@/lib/safeDiagnostics';
import { ACTIVE_SESSION_KEY, VAULT_FOLDERS_KEY } from '@/modules/architecture/appOptions';
import { readAccountJsonR141 } from '@/modules/backup/backupStorageJsonR165';
import {
  CENTRAL_MIGRATION_STORAGE_KEY,
  buildMatchScenarioPlans,
  createCentralMigrationReport,
  type IntegratedPlayerRecord,
} from '@/modules/core/centralIntelligence';
import {
  safeCentralDashboardR130,
  safeIntegratedPlayersR130,
  safeTeamDiagnosisR130,
  safeViewComputationR130,
} from '@/modules/core/centralSafeViewR130';
import { CENTRAL_INDEX_STORAGE_KEY, buildCentralEntityIndex } from '@/modules/core/centralRepository';
import { syncStructuredRepository } from '@/modules/core/structuredRepository';
import { useCentralMatchRecordsR135 } from '@/modules/matches/useCentralMatchRecordsR135';
import type { SavedAnalysis } from '@/modules/vault/cardHistoryStore';
import { HISTORY_KEY_R200 as HISTORY_KEY, savedStatusLabelR200 as savedStatusLabel } from '@/modules/vault/cardHistoryStartupModelR200';

export type CardVisionCentralWorkspaceInputR175 = {
  renderHistory: SavedAnalysis[];
  formation: TacticalFormation;
  teamStyle: TacticalStyle;
  performanceMode: 'economy' | 'balanced';
  startupGateReady: boolean;
  startupSafeMode: boolean;
  sessionHydrated: boolean;
};

/**
 * R175 — boundary da Central Profissional.
 * Somente deriva/espelha dados para a UI e para índices auxiliares.
 * Não é writer do Cofre e não altera a autoridade R138/R140/R153/R154.
 */
export function useCardVisionCentralWorkspaceR175(input: CardVisionCentralWorkspaceInputR175) {
  const {
    renderHistory,
    formation,
    teamStyle,
    performanceMode,
    startupGateReady,
    startupSafeMode,
    sessionHydrated,
  } = input;

  const centralMatchRecords = useCentralMatchRecordsR135({
    enabled: startupGateReady && sessionHydrated && !startupSafeMode,
    performanceMode,
  });
  const [centralMigrationNote, setCentralMigrationNote] = useState('');

  useEffect(() => {
    if (!startupGateReady || startupSafeMode) return;
    const handle = scheduleIdleTask(() => {
      try {
        const existing = readAccountStorage(CENTRAL_MIGRATION_STORAGE_KEY);
        if (existing) {
          const parsed = JSON.parse(existing) as { note?: string };
          setCentralMigrationNote(parsed.note || 'Dados anteriores integrados à Central Inteligente.');
          return;
        }
        const preservedKeys = [HISTORY_KEY, ACTIVE_SESSION_KEY, ONBOARDING_STORAGE_KEY, CARD_REGISTRY_STORAGE_KEY, MATCH_VALIDATION_STORAGE_KEY, VAULT_FOLDERS_KEY];
        const report = createCentralMigrationReport(preservedKeys.filter((key) => Boolean(readAccountStorage(key))));
        writeAccountStorage(CENTRAL_MIGRATION_STORAGE_KEY, JSON.stringify(report));
        setCentralMigrationNote(report.note);
      } catch {
        setCentralMigrationNote('A Central Inteligente usa migração não destrutiva e mantém os dados nas chaves originais.');
      }
    }, performanceMode === 'economy' ? 1800 : 700);
    return () => cancelIdleTask(handle);
  }, [performanceMode, startupGateReady, startupSafeMode]);

  const integratedPlayers = useMemo(() => safeViewComputationR130(
    'integrated-players',
    () => safeIntegratedPlayersR130(renderHistory.map((item) => ({
      id: item.id,
      updatedAt: item.updatedAt || item.savedAt,
      favorite: item.favorite,
      status: savedStatusLabel(item),
      playerImage: item.playerImage,
      result: item.result,
    })), centralMatchRecords),
    [] as IntegratedPlayerRecord[],
  ), [renderHistory, centralMatchRecords]);

  const integratedTeam = useMemo(
    () => safeTeamDiagnosisR130(integratedPlayers, formation, teamStyle),
    [integratedPlayers, formation, teamStyle],
  );

  const centralDashboard = useMemo(
    () => safeCentralDashboardR130(integratedPlayers, centralMatchRecords, integratedTeam),
    [integratedPlayers, centralMatchRecords, integratedTeam],
  );

  const centralMatchPlans = useMemo(() => {
    try {
      return buildMatchScenarioPlans(integratedTeam);
    } catch (cause) {
      void recordSafeRuntimeError({
        area: 'match-scenario-plans',
        code: 'plans_failed',
        message: cause instanceof Error ? cause.message : 'Falha ao gerar planos de partida',
      });
      return [];
    }
  }, [integratedTeam]);

  const centralEntityIndex = useMemo(() => {
    try {
      return buildCentralEntityIndex(integratedPlayers, integratedTeam, centralMatchRecords);
    } catch (cause) {
      void recordSafeRuntimeError({
        area: 'central-entity-index',
        code: 'index_failed',
        message: cause instanceof Error ? cause.message : 'Falha ao montar índice central',
      });
      return buildCentralEntityIndex([], safeTeamDiagnosisR130([], formation, teamStyle), []);
    }
  }, [integratedPlayers, integratedTeam, centralMatchRecords, formation, teamStyle]);

  useEffect(() => {
    if (!startupGateReady || startupSafeMode) return;
    const handle = scheduleIdleTask(() => {
      try {
        writeAccountStorage(CENTRAL_INDEX_STORAGE_KEY, JSON.stringify(centralEntityIndex));
      } catch {
      }
    }, performanceMode === 'economy' ? 2400 : 900);
    return () => cancelIdleTask(handle);
  }, [centralEntityIndex, performanceMode, startupGateReady, startupSafeMode]);

  useEffect(() => {
    if (!startupGateReady || startupSafeMode) return;
    const handle = scheduleIdleTask(() => {
      const cards = readAccountJsonR141(CARD_REGISTRY_STORAGE_KEY, []) as unknown[];
      void syncStructuredRepository({
        cards: Array.isArray(cards) ? cards : [],
        builds: renderHistory,
        formations: [centralEntityIndex.team],
        matches: centralMatchRecords,
      }).catch((cause) => recordSafeRuntimeError({
        area: 'structured-repository',
        code: 'sync_failed',
        message: cause instanceof Error ? cause.message : 'Falha ao sincronizar banco estruturado',
      }));
    }, performanceMode === 'economy' ? 3200 : 1200);
    return () => cancelIdleTask(handle);
  }, [renderHistory, centralMatchRecords, centralEntityIndex, performanceMode, startupGateReady, startupSafeMode]);

  return {
    centralMatchRecords,
    centralMigrationNote,
    integratedPlayers,
    integratedTeam,
    centralDashboard,
    centralMatchPlans,
    centralEntityIndex,
  };
}
