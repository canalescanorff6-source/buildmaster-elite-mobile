import type { Dispatch, SetStateAction } from 'react';
import { ensureProductionAnalysisR138, rebuildProductionAnalysisR138, type AnalysisResult } from '@/modules/analysis';
import type { GameplayDnaProfileId } from '@/lib/analyzerDomain';
import { applyGameplayDnaProfileSelection } from '@/lib/gameplayDnaSelection';
import { canonicalizeSkillList } from '@/lib/officialSkillIdentity';
import { regenerateSkillAfterOwnedConfirmation } from '@/lib/intelligentSkillReplacementV3830';
import type { PremiumCleanExportFormat } from '@/lib/premiumCleanResultV3810';
import {
  clearCorrectionsForResult,
  upsertCorrectionForResult,
} from '@/modules/builds/dynamicRules';
import {
  HISTORY_LIMIT,
  appendSavedEvent,
  ensureSkillProgress,
  memoryKey,
  resultHistoryKey,
  type ManualFields,
  type SavedAnalysis,
} from '@/modules/vault/cardHistoryStore';
import { deriveSkillVaultStatusR121, reconcileSkillProgressR121 } from '@/modules/vault/skillWorkflowR121';
import { sealSavedAnalysisIdentityR134 } from '@/modules/vault/vaultIdentitySealR134';
import { loadCardVisionExportRuntimeR168 } from '@/modules/runtime/cardVisionDeferredActionsR168';

export const CARDVISION_RESULT_ACTIONS_R188_VERSION = '40.80-r188-result-actions-lazy-v1' as const;

type VaultActionOptionsR188 = {
  key: string;
  label: string;
  duplicateMessage?: string;
};

type VaultMutationOutcomeR188<T> = {
  history: SavedAnalysis[];
  value?: T;
} | null;

type VaultMutationRunnerR188 = <T>(
  mutate: (current: SavedAnalysis[]) => { nextHistory: SavedAnalysis[]; value?: T },
  failureContext?: string,
  adoptState?: boolean,
  action?: VaultActionOptionsR188,
) => Promise<VaultMutationOutcomeR188<T>>;

export type CardVisionResultActionsInputR188 = {
  result: AnalysisResult | null;
  draftResult: AnalysisResult | null;
  activeSavedAnalysis: SavedAnalysis | null | undefined;
  playerImage: string | null;
  renderHistory: SavedAnalysis[];
  activeHistoryId: string | null;
  setResult: Dispatch<SetStateAction<AnalysisResult | null>>;
  setDraftResult: Dispatch<SetStateAction<AnalysisResult | null>>;
  setManualFields: Dispatch<SetStateAction<ManualFields>>;
  setActiveHistoryId: Dispatch<SetStateAction<string | null>>;
  setStatus: Dispatch<SetStateAction<string>>;
  runCanonicalVaultMutationR153: VaultMutationRunnerR188;
  pushCloudHistory: (items: SavedAnalysis[], silent?: boolean) => Promise<void>;
};

export function createCardVisionResultActionsR188(input: CardVisionResultActionsInputR188) {
  async function exportCurrentReport() {
    if (!input.result) return;
    const exportRuntime = await loadCardVisionExportRuntimeR168();
    exportRuntime.clientTextExport.downloadClientTextExportR129(
      exportRuntime.clientTextExport.buildCurrentHtmlExportR129(input.result, input.activeSavedAnalysis?.notes ?? ''),
    );
    input.setStatus('Relatório profissional em HTML exportado. Abra o arquivo para imprimir ou guardar junto com a ficha.');
  }

  async function exportCurrentMarkdownReport() {
    if (!input.result) return;
    const exportRuntime = await loadCardVisionExportRuntimeR168();
    exportRuntime.clientTextExport.downloadClientTextExportR129(
      exportRuntime.clientTextExport.buildCurrentMarkdownExportR129(input.result, input.activeSavedAnalysis?.notes ?? ''),
    );
    input.setStatus('Relatório técnico em texto exportado.');
  }

  async function exportCurrentVisualCard(format: PremiumCleanExportFormat = 'portrait') {
    if (!input.result) return;
    const exportRuntime = await loadCardVisionExportRuntimeR168();
    const svg = exportRuntime.premiumCleanResult.buildPremiumCleanCardSvg(input.result, {
      format,
      playerImage: input.playerImage,
    });
    const date = new Date().toISOString().slice(0, 10);
    const baseName = `buildmaster-${format === 'square' ? 'quadrada' : 'vertical'}-${memoryKey(input.result.parsed.playerName)}-${date}`;
    const dimensions = format === 'square' ? { width: 1080, height: 1080 } : { width: 1080, height: 1350 };
    try {
      const png = await exportRuntime.premiumCleanResult.premiumCleanSvgToPngBlob(svg, dimensions.width, dimensions.height);
      exportRuntime.buildReportExport.downloadBlobFile(`${baseName}.png`, png);
      input.setStatus(`Imagem ${format === 'square' ? 'quadrada' : 'vertical'} pronta para compartilhar.`);
    } catch {
      exportRuntime.buildReportExport.downloadBlobFile(
        `${baseName}.svg`,
        new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
      );
      input.setStatus('O aparelho não converteu para PNG; a ficha foi salva em SVG com a mesma qualidade.');
    }
  }

  async function printCurrentReport() {
    if (!input.result) return;
    try {
      const exportRuntime = await loadCardVisionExportRuntimeR168();
      const html = exportRuntime.buildReportExport.buildProfessionalReportHtml(
        input.result,
        input.activeSavedAnalysis?.notes ?? '',
        true,
      );
      const reportUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const popup = window.open(reportUrl, '_blank', 'width=980,height=1200');
      if (!popup) {
        URL.revokeObjectURL(reportUrl);
        window.print();
        input.setStatus('Relatório aberto para impressão/exportação em PDF.');
        return;
      }
      try {
        popup.opener = null;
        popup.focus();
      } catch {
      }
      window.setTimeout(() => URL.revokeObjectURL(reportUrl), 60_000);
      input.setStatus('Relatório profissional aberto. Escolha “Salvar como PDF” na tela de impressão.');
    } catch {
      await exportCurrentReport();
    }
  }

  function refreshResultWithCorrections(message: string) {
    input.setResult((current) => current ? rebuildProductionAnalysisR138(current) : current);
    input.setDraftResult((current) => current ? rebuildProductionAnalysisR138(current) : current);
    input.setStatus(message);
  }

  function applyGameplayProfile(profileId: GameplayDnaProfileId) {
    input.setResult((current) => current ? applyGameplayDnaProfileSelection(current, profileId) : current);
    input.setStatus('Perfil de Gameplay aplicado como comparação. A ficha final, os pontos, o Top 5 e o Ímpeto permanecem sob a autoridade única R128.');
  }

  async function replaceOwnedSkillIntelligently(skill: string) {
    const base = input.result ?? input.draftResult;
    if (!base) return;
    upsertCorrectionForResult(base, { blockedSkills: [skill], notes: [`Habilidade já possuída: ${skill}`] }, 'role');
    upsertCorrectionForResult(base, { blockedSkills: [skill], notes: [`Habilidade já possuída: ${skill}`] }, 'player');
    const replacement = regenerateSkillAfterOwnedConfirmation(base, skill);
    input.setManualFields((current) => ({
      ...current,
      nativeSkills: canonicalizeSkillList([...current.nativeSkills, replacement.removedSkill]),
    }));
    if (input.result) {
      const previousKey = resultHistoryKey(base);
      const nextKey = resultHistoryKey(replacement.result);
      const existing = input.renderHistory.find((entry) => entry.id === input.activeHistoryId || entry.saveKey === previousKey);
      if (existing) {
        const committed = await input.runCanonicalVaultMutationR153((current) => {
          const currentExisting = current.find((entry) => entry.id === input.activeHistoryId || entry.saveKey === previousKey);
          if (!currentExisting) return { nextHistory: current, value: null as SavedAnalysis | null };
          const inherited = ensureSkillProgress(currentExisting.skillProgress, replacement.result.recommendedSkills);
          const progress = reconcileSkillProgressR121(
            replacement.result.recommendedSkills,
            inherited,
          ) as SavedAnalysis['skillProgress'];
          const statusTag = deriveSkillVaultStatusR121(
            replacement.result.recommendedSkills,
            progress,
            currentExisting.statusTag,
          );
          const item = appendSavedEvent(
            sealSavedAnalysisIdentityR134({
              ...currentExisting,
              saveKey: nextKey,
              result: ensureProductionAnalysisR138(replacement.result),
              updatedAt: new Date().toLocaleString('pt-BR'),
              skillProgress: progress,
              statusTag,
            }),
            'habilidade já possuída confirmada',
            replacement.removedSkill,
          );
          const next = [
            item,
            ...current.filter((entry) => entry.id !== item.id && entry.saveKey !== previousKey && entry.saveKey !== nextKey),
          ].slice(0, HISTORY_LIMIT);
          return { nextHistory: next, value: item };
        }, `A confirmação de ${replacement.removedSkill} ficou apenas nesta sessão porque o Cofre não confirmou a gravação.`, true, {
          key: `replace-owned:${existing.id}:${replacement.removedSkill}`,
          label: `Recalculando após ${replacement.removedSkill}`,
        });
        if (!committed?.value) return;
        input.setActiveHistoryId(committed.value.id);
        void input.pushCloudHistory(committed.history, true);
      }
      input.setResult(replacement.result);
    } else {
      input.setDraftResult(replacement.result);
    }
    const replacementText = replacement.replacementSkill
      ? `${replacement.removedSkill} foi confirmada como habilidade da carta e ${replacement.replacementSkill} entrou após nova análise completa.`
      : `${replacement.removedSkill} foi confirmada como habilidade da carta. O app não encontrou outra opção oficial segura para preencher a vaga sem repetir ou fugir da função.`;
    input.setStatus(replacementText);
  }

  function applyLocalPreference(
    patch: Parameters<typeof upsertCorrectionForResult>[1],
    note: string,
    message: string,
  ) {
    const base = input.result ?? input.draftResult;
    if (!base) return;
    const correction = { ...patch, notes: [note] };
    upsertCorrectionForResult(base, correction, 'role');
    upsertCorrectionForResult(base, correction, 'player');
    refreshResultWithCorrections(message);
  }

  function rejectSkillLocally(skill: string) {
    applyLocalPreference({ blockedSkills: [skill] }, `Evitar habilidade: ${skill}`, `Correção salva: ${skill} não combina com esta função. O app vai evitar essa habilidade.`);
  }

  function promoteSkillLocally(skill: string) {
    applyLocalPreference({ promotedSkills: [skill] }, `Priorizar habilidade: ${skill}`, `Correção salva: ${skill} ganhou prioridade para esta função/jogador.`);
  }

  function rejectImpetoLocally(impeto: string) {
    applyLocalPreference({ blockedImpetos: [impeto] }, `Evitar ímpeto: ${impeto}`, `Correção salva: ${impeto} será evitado nesta função.`);
  }

  function promoteImpetoLocally(impeto: string) {
    applyLocalPreference({ promotedImpetos: [impeto] }, `Priorizar ímpeto: ${impeto}`, `Correção salva: ${impeto} ganhou prioridade nesta função.`);
  }

  function resetLocalCorrectionsForCurrent() {
    const base = input.result ?? input.draftResult;
    if (!base) return;
    clearCorrectionsForResult(base);
    refreshResultWithCorrections('Correções locais deste jogador/função foram apagadas. Recalcule a ficha para voltar ao padrão do motor.');
  }

  return {
    exportCurrentReport,
    exportCurrentMarkdownReport,
    exportCurrentVisualCard,
    printCurrentReport,
    applyGameplayProfile,
    replaceOwnedSkillIntelligently,
    rejectSkillLocally,
    promoteSkillLocally,
    rejectImpetoLocally,
    promoteImpetoLocally,
    resetLocalCorrectionsForCurrent,
  };
}
