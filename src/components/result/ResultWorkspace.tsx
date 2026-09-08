'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  FileText,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  RotateCcw,
  Save,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  ThumbsUp,
  Trophy
} from 'lucide-react';
import {
  type AnalysisResult,
  type GameplayDnaProfileId,
  type PositionCode
} from '@/lib/analyzer';
import {
  buildOpponentPlans,
  buildUltimatePlayerCoach,
  getOneHundredUpgradeChecklist
} from '@/lib/ultimateCoach';
import { APP_RELEASE_VERSION } from '@/lib/appUpdates';
import { CLEAN_RESULT_PRIMARY_VIEWS } from '@/lib/cleanExperience';
import { canonicalizeSkillList } from '@/lib/officialSkillIdentity';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';
import { POSITION_PT, TACTICAL_STYLE_NAME } from '@/lib/analyzerDomain';
import type { DynamicRulePack } from '@/modules/builds/dynamicRules';
import {
  skillProgressInfo,
  type SavedSkillProgress
} from '@/modules/vault/cardHistoryStore';
import { UnifiedIntelligenceCard } from '@/components/result/UnifiedIntelligenceCard';
import { SupremeGameplayCard } from '@/components/result/SupremeGameplayCard';
import { CalibrationV32Card } from '@/components/result/CalibrationV32Card';
import { PremiumCleanResultV3810 } from '@/components/PremiumCleanResultV3810';
import type { PremiumCleanExportFormat } from '@/lib/premiumCleanResultV3810';
import { AdvancedMotorV3750Panel } from '@/components/AdvancedMotorV3750Panel';
import { GameplayDnaProfilesCard } from '@/components/result/GameplayDnaProfilesCard';
import {
  GOALKEEPER_PROGRESS_ORDER_R106,
  TRAINING_PROGRESS_ORDER_R106,
  TrainingProgressionIconR106,
  type TrainingProgressionKeyR106
} from '@/components/result/TrainingProgressionIconR106';
import { UnifiedPerformanceV3920Panel } from '@/components/UnifiedPerformanceV3920Panel';
import {
  CompactSharePanel,
  EliteEvolutionPanel,
  MetaBuildLabPanel,
  PrecisionBuildPanel,
  ProfessionalIntelligenceCenter,
} from '@/components/lazy/AppLazyPanels';


const trainingLabels: Record<string, string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  dexterity: 'Destreza',
  lowerBodyStrength: 'Força pernas',
  aerialStrength: 'Bola aérea',
  defending: 'Defesa',
  gk1: 'Goleiro 1',
  gk2: 'Goleiro 2',
  gk3: 'Goleiro 3'
};

const tacticalLabels: Record<string, string> = {
  possession: 'Posse de bola',
  quickCounter: 'Contra-ataque rápido',
  longBallCounter: 'Contra-ataque',
  outWide: 'Por fora',
  longBall: 'Passe longo'
};

const teamMapLabels: Record<string, string> = {
  marcacao: 'Marcação',
  cobertura: 'Cobertura',
  saidaDeBola: 'Saída de bola',
  passe: 'Passe',
  criacao: 'Criação',
  aceleracao: 'Aceleração',
  finalizacao: 'Ataque/finalização',
  jogoAereo: 'Jogo aéreo',
  fisico: 'Físico'
};

export type ResultTab = 'proglobal' | 'motor' | 'leitura' | 'confianca' | 'comparar' | 'calibracao' | 'partidas' | 'profissional' | 'ficha' | 'habilidades' | 'treino' | 'impetos' | 'treinador' | 'mapa' | 'exportar' | 'validacao' | 'correcao' | 'regras' | 'posicoes' | 'dados' | 'resumo' | 'comunidade' | 'fontes';

export type ResultPrimaryView = 'resumo' | 'proglobal' | 'profissional' | 'ficha' | 'habilidades' | 'impetos' | 'tatica' | 'exportar';

const RESULT_PRIMARY_TABS: Array<{ id: ResultPrimaryView; label: string; hint: string }> = [
  { id: 'resumo', label: 'Ficha Suprema', hint: 'Tudo unificado em uma tela' },
  { id: 'proglobal', label: 'Pro Global', hint: 'Benchmark mundial auditável' },
  { id: 'profissional', label: 'Análise Pro', hint: 'Leitura profissional completa' },
  { id: 'ficha', label: 'Ficha', hint: 'Progressão e alternativas' },
  { id: 'habilidades', label: 'Habilidades', hint: 'Top adicional oficial' },
  { id: 'impetos', label: 'Ímpeto', hint: 'Escolha ideal da IA' },
  { id: 'tatica', label: 'Tática', hint: 'Encaixe dentro do time' },
  { id: 'exportar', label: 'Exportar', hint: 'Imagem, relatório e texto' }
];

const UNIFIED_COMPACT_RESULT_V3920 = true;
const COMPACT_PRIMARY_TABS_V3920 = RESULT_PRIMARY_TABS.filter((item) => item.id === 'resumo');

const RESULT_ADVANCED_GROUPS: Array<{ label: string; tabs: Array<{ value: ResultTab; label: string }> }> = [
  { label: 'Análise e confiança', tabs: [{ value: 'leitura', label: 'Leitura' }, { value: 'confianca', label: 'Confiança' }, { value: 'validacao', label: 'Validação' }, { value: 'correcao', label: 'Correções' }] },
  { label: 'Desenvolvimento', tabs: [{ value: 'motor', label: 'IA por Carta' }, { value: 'partidas', label: 'Validação v37.60' }, { value: 'treino', label: 'Treino' }, { value: 'impetos', label: 'Ímpetos' }, { value: 'posicoes', label: 'Posições' }] },
  { label: 'Ferramentas técnicas', tabs: [{ value: 'comparar', label: 'Comparar' }, { value: 'calibracao', label: 'Calibração' }, { value: 'dados', label: 'Dados' }, { value: 'regras', label: 'Atualização v37.70' }, { value: 'comunidade', label: 'Comunidade' }, { value: 'proglobal', label: 'Laboratório Pro Global' }, { value: 'fontes', label: 'Fichas de criadores' }] }
];

function skillReason(skill: string) {
  const reasons: Record<string, string> = {
    'Toque duplo': 'melhora o 1 contra 1 e a saída curta',
    'Controle com a sola': 'giro e domínio mais limpos sob pressão',
    'Elástico': 'abre espaço em pontas e meias ofensivos',
    'Cruzamento preciso': 'qualifica criação pelos lados',
    'Curva para fora': 'melhora passes e chutes com efeito',
    'Passe de primeira': 'acelera tabelas, pivôs e contra-ataques',
    'Passe em profundidade': 'melhora rupturas e bolas verticais',
    'Passe na medida': 'qualifica lançamentos e inversões',
    'Interceptação': 'aumenta cortes automáticos de passe',
    'Bloqueador': 'melhora bloqueios de chute e passe',
    'Marcação individual': 'gruda melhor no alvo defensivo',
    'Volta para marcar': 'ajuda na pressão e recomposição',
    'Espírito guerreiro': 'mantém desempenho cansado ou pressionado',
    'Pegador de pênalti': 'melhora desempenho em cobranças de pênalti',
    'Arremesso longo do goleiro': 'ajuda reposição rápida com as mãos',
    'Reposição alta do goleiro': 'qualifica lançamento alto do goleiro',
    'Reposição baixa do goleiro': 'qualifica passe longo com trajetória baixa',
    'Chute de primeira': 'finaliza rápido sem dominar a bola',
    'Precisão à distância': 'melhora chute de fora da área',
    'Finalização acrobática': 'aumenta gols em posição difícil',
    'Efeito de longe': 'melhora chute colocado de média/longa distância',
    'Controle da cavadinha': 'ajuda a finalizar contra goleiro adiantado',
    'Toque de calcanhar': 'facilita pivôs, tabelas e passes em espaço curto',
    Cabeçada: 'melhora finalização aérea',
    'Superioridade aérea': 'vence duelos pelo alto com frequência',
    Carrinho: 'melhora desarme de emergência',
    'Super substituto': 'aumenta impacto vindo do banco',
  };
  return reasons[skill] ?? 'completa a função real da carta sem repetir habilidade nativa';
}

function copyBuildText(result: AnalysisResult) {
  const training = Object.entries(result.training)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${trainingLabels[key] ?? key} +${value} (${result.trainingCost[key as keyof typeof result.trainingCost]} pts)`)
    .join('\n');

  const text = [
    `BuildMaster Elite Tático v${APP_RELEASE_VERSION} — ${result.parsed.playerName}`,
    `Função: ${result.buildName}`,
    `Posição escolhida: ${positionPt(analysisUsagePositionR138(result))}`,
    `PRI: ${result.pri.GER}`,
    `Pontos: ${result.trainingPointsUsed}/${result.trainingPointsTotal}`,
    '',
    'Plano Elite:',
    training,
    '',
    'Mapeamento do time:',
    `Função real: ${result.teamMap?.functionLabel ?? result.buildName}`,
    `Marcação: ${result.teamMap?.sectorScores?.marcacao ?? '-'} | Passe: ${result.teamMap?.sectorScores?.passe ?? '-'} | Ataque: ${result.teamMap?.sectorScores?.finalizacao ?? '-'}`,
    result.teamMap?.matchPlan?.slice(0, 3).join('\n') ?? '',
    '',
    'Top 5 habilidades adicionais:',
    result.recommendedSkills.slice(0, 5).map((skill, index) => `${index + 1}. ${skill}`).join('\n'),
    '',
    'Evitar nesta função:',
    (result.avoidSkills ?? result.skillRecommendations?.filter((item) => item.tier === 'evitar').map((item) => item.name) ?? []).slice(0, 5).map((skill, index) => `${index + 1}. ${skill}`).join('\n') || 'Nenhuma restrição crítica.',
    '',
    'Ímpetos recomendados:',
    result.recommendedImpetos.filter((item) => item.tier !== 'evitar').slice(0, 5).map((item, index) => `${index + 1}. ${item.name} — ${item.attributes.join(', ')}`).join('\n'),
    '',
    'Como usar:',
    result.usageTips.join('\n')
  ].join('\n');

  void navigator.clipboard?.writeText(text);
}

function positionPt(code: string) { return POSITION_PT[code as PositionCode] ?? code; }

function trainingSummary(plan: Record<string, number>) {
  return Object.entries(plan)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${trainingLabels[key] ?? key} +${value}`)
    .join(' • ');
}

const R192_ADVANCED_SURFACE_TABS = new Set<ResultTab>(['leitura', 'confianca', 'comparar', 'partidas', 'motor', 'comunidade', 'proglobal', 'fontes', 'calibracao', 'treino', 'correcao', 'regras', 'validacao', 'posicoes', 'dados']);

const ResultAdvancedWorkspaceR192 = dynamic(
  () => import('@/components/result/ResultAdvancedWorkspaceR192').then((module) => module.ResultAdvancedWorkspaceR192),
  { ssr: false, loading: () => <article className="luxury-panel wide-card"><p className="panel-note">Carregando ferramentas avançadas…</p></article> }
);

export type ResultTabRequest = { tab: ResultTab; token: number };

export function ResultCard({ result, playerImage, skillProgress, onSkillToggle, onSaveFicha, saveBusy = false, onRecalculate, onExportReport, onPrintReport, onExportImage, onExportText, onRejectSkill, onPromoteSkill, onReplaceOwnedSkill, onRejectImpeto, onPromoteImpeto, onResetCorrections, onApplyGameplayProfile, rulesUrl, setRulesUrl, rulesStatus, rulePackInfo, onLoadRulesFromUrl, onResetRules, onExportRulePack, onRestoreRulePackVersion, requestedTab, onRequestedTabHandled, advancedMode = false }: { result: AnalysisResult; playerImage: string | null; skillProgress?: SavedSkillProgress; onSkillToggle?: (skill: string) => void; onSaveFicha?: () => void; saveBusy?: boolean; onRecalculate?: () => void; onExportReport?: () => void; onPrintReport?: () => void; onExportImage?: (format?: PremiumCleanExportFormat) => void; onExportText?: () => void; onRejectSkill?: (skill: string) => void; onPromoteSkill?: (skill: string) => void; onReplaceOwnedSkill?: (skill: string) => void; onRejectImpeto?: (impeto: string) => void; onPromoteImpeto?: (impeto: string) => void; onResetCorrections?: () => void; onApplyGameplayProfile?: (profileId: GameplayDnaProfileId) => void; rulesUrl: string; setRulesUrl: (value: string) => void; rulesStatus: string; rulePackInfo: DynamicRulePack; onLoadRulesFromUrl: () => void; onResetRules: () => void; onExportRulePack: () => void; onRestoreRulePackVersion: (version: string) => void; requestedTab?: ResultTabRequest | null; onRequestedTabHandled?: () => void; advancedMode?: boolean }) {
  const [tab, setTab] = useState<ResultTab>('resumo');
  const [heroExpanded, setHeroExpanded] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [pendingSkillAction, setPendingSkillAction] = useState<{ skill: string; kind: 'complete' | 'owned' } | null>(null);

  useEffect(() => {
    if (!requestedTab) return;
    if (UNIFIED_COMPACT_RESULT_V3920) {
      setAdvancedOpen(false);
      setTab('resumo');
      onRequestedTabHandled?.();
      return;
    }
    setAdvancedOpen(true);
    setTab(requestedTab.tab);
    onRequestedTabHandled?.();
  }, [requestedTab]);
  const card = result.parsed;
  const usagePosition = analysisUsagePositionR138(result);
  const usagePositionLabel = positionPt(usagePosition);
  const GER = card.maxOverall ?? card.overall ?? '--';
  const goalkeeperProgressionR106 =
    card.mainPosition === 'GK' ||
    usagePosition === 'GK' ||
    Number(result.training.gk1 ?? 0) > 0 ||
    Number(result.training.gk2 ?? 0) > 0 ||
    Number(result.training.gk3 ?? 0) > 0;
  const trainingOrderR106 = goalkeeperProgressionR106
    ? GOALKEEPER_PROGRESS_ORDER_R106
    : TRAINING_PROGRESS_ORDER_R106;
  const trainingItems = trainingOrderR106.map((key) => [key, Number(result.training[key] ?? 0)] as const);
  const pointPercent = Math.min(100, Math.round((result.trainingPointsUsed / Math.max(1, result.trainingPointsTotal)) * 100));
  const nativeSkills = canonicalizeSkillList([...card.nativeSkills, ...(card.additionalSkills ?? []), ...card.specialSkills]).slice(0, 12);
  const skillRecommendations = result.skillRecommendations ?? result.recommendedSkills.map((skill) => ({ name: skill, tier: 'alternativa' as const, reason: skillReason(skill) }));
  const recommendedSkills = result.recommendedSkills.slice(0, 5);
  const avoidSkillItems = skillRecommendations.filter((item) => item.tier === 'evitar').slice(0, 5);
  const alternativeSkillItems = skillRecommendations.filter((item) => item.tier === 'alternativa' && !recommendedSkills.includes(item.name)).slice(0, 6);
  const skillInfo = skillProgressInfo(recommendedSkills, skillProgress);
  const completedRecommendedSkills = recommendedSkills.filter((skill) => Boolean(skillProgress?.[skill]));
  const pendingRecommendedSkills = recommendedSkills.filter((skill) => !skillProgress?.[skill]);
  const recommendedImpetos = result.recommendedImpetos.slice(0, 8);
  const impetoV4080 = result.maximumPerformanceV4080?.impeto;
  const canCraftImpeto = impetoV4080 ? impetoV4080.canCraft : true;
  const bestImpeto = canCraftImpeto ? (recommendedImpetos.find((item) => item.tier === 'ideal') ?? recommendedImpetos.find((item) => item.tier !== 'evitar')) : undefined;
  const existingImpetosV4080 = impetoV4080?.existing ?? card.impetos.filter((item) => item.active !== false).map((item) => item.name);
  const sourceLabel = card.trainingPointSource === 'MANUAL'
    ? 'Orçamento manual confirmado'
    : card.trainingPointSource === 'TRAINING_READ'
      ? 'Plano automático somado'
    : card.trainingPointSource === 'LEVEL_INFERRED'
      ? 'Calculado pelo nível'
      : card.trainingPointSource === 'OCR'
        ? 'Informado no registro técnico'
        : 'Padrão seguro';
  const ultimateCoach = useMemo(() => advancedMode ? buildUltimatePlayerCoach(result) : null, [advancedMode, result]);
  const opponentPlans = useMemo(() => advancedMode ? buildOpponentPlans(result.tacticalProfile.formation, result.tacticalProfile.style) : [], [advancedMode, result]);
  const upgradeChecklist = useMemo(() => advancedMode ? getOneHundredUpgradeChecklist() : [], [advancedMode]);
  const activeUpgradeCount = upgradeChecklist.filter((item) => item.status === 'ativo').length;
  const partialUpgradeCount = upgradeChecklist.filter((item) => item.status === 'parcial').length;
  const pointsAvailable = Math.max(0, result.trainingPointsTotal - result.trainingPointsUsed);
  const advancedTabs = RESULT_ADVANCED_GROUPS.flatMap((group) => group.tabs.map((item) => item.value));
  const advancedSelected = advancedTabs.includes(tab);
  const visiblePrimaryTabs = UNIFIED_COMPACT_RESULT_V3920
    ? COMPACT_PRIMARY_TABS_V3920
    : advancedMode
      ? RESULT_PRIMARY_TABS
      : RESULT_PRIMARY_TABS.filter((item) => CLEAN_RESULT_PRIMARY_VIEWS.includes(item.id as typeof CLEAN_RESULT_PRIMARY_VIEWS[number]));
  const advancedSurfaceActiveR192 = R192_ADVANCED_SURFACE_TABS.has(tab);

  function openPrimaryResult(view: ResultPrimaryView) {
    setAdvancedOpen(false);
    if (view === 'tatica') setTab('treinador');
    else setTab(view);
  }

  function primaryIsActive(view: ResultPrimaryView) {
    if (view === 'tatica') return tab === 'treinador' || tab === 'mapa';
    return tab === view;
  }

  function requestSkillToggle(skill: string) {
    if (!onSkillToggle) return;
    if (skillProgress?.[skill]) {
      onSkillToggle(skill);
      return;
    }
    setPendingSkillAction({ skill, kind: 'complete' });
  }

  function requestOwnedSkillReplacement(skill: string) {
    if (!onReplaceOwnedSkill) return;
    setPendingSkillAction({ skill, kind: 'owned' });
  }

  function confirmPendingSkillAction() {
    if (!pendingSkillAction) return;
    const action = pendingSkillAction;
    setPendingSkillAction(null);
    if (action.kind === 'owned') onReplaceOwnedSkill?.(action.skill);
    else onSkillToggle?.(action.skill);
  }

  async function shareCurrentResult() {
    const text = [
      `${card.playerName} • ${usagePositionLabel}`,
      `Estilo ofensivo: ${card.offensivePlaystyle ?? card.playstyle ?? 'Básico'}`,
      `Estilo defensivo: ${card.defensivePlaystyle ?? 'Básico'}`,
      `Pontos: ${result.trainingPointsUsed}/${result.trainingPointsTotal}`,
      `Habilidades pendentes: ${pendingRecommendedSkills.join(', ') || 'nenhuma'}`,
      `Habilidades adicionadas: ${completedRecommendedSkills.join(', ') || 'nenhuma'}`
    ].join('\n');
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: `Ficha BuildMaster • ${card.playerName}`, text });
        setShareMessage('Ficha enviada para o compartilhamento do aparelho.');
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareMessage('Resumo copiado. Agora você pode colar onde desejar.');
      } else {
        copyBuildText(result);
        setShareMessage('Plano copiado para a área de transferência.');
      }
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      copyBuildText(result);
      setShareMessage('Não foi possível abrir o compartilhamento; o plano foi copiado.');
    }
    window.setTimeout(() => setShareMessage(''), 3200);
  }

  return (
    <section className="result-panel bm2820-result-screen">
      <section className={`result-player-hero luxury-panel ${heroExpanded ? 'is-expanded' : ''} ${playerImage ? 'has-card-image' : ''}`}>
        <figure className={`result-player-art ${playerImage ? 'has-card-image' : 'is-empty'}`}>
          {playerImage ? <img src={playerImage} alt={`Carta recortada de ${card.playerName}`} /> : <div className="result-player-art-empty"><Trophy size={42} /><span>Sem imagem da carta</span></div>}
          {!playerImage && <div className="result-player-art-overlay" />}
          {!playerImage && <div className="result-player-rating"><strong>{GER}</strong><span>{card.mainPositionPt}</span></div>}
          {!playerImage && <figcaption>{card.playstyle ?? 'BuildMaster Elite'}</figcaption>}
        </figure>

        <div className="result-player-summary">
          <div className="result-player-heading">
            <div>
              <p className="kicker"><Sparkles size={14} /> Resultado validado</p>
              <h2>{card.playerName}</h2>
              <div className="result-identity-line">
                <span className="result-position-badge">{usagePositionLabel}</span>
                <span>Ataque: {card.offensivePlaystyle ?? card.playstyle ?? 'Básico'}</span>
                <span>Defesa: {card.defensivePlaystyle ?? 'Básico'}</span>
                <em>carta original: {card.mainPositionPt}</em>
              </div>
            </div>
            <button className="result-details-toggle" type="button" onClick={() => setHeroExpanded((value) => !value)} aria-expanded={heroExpanded}>
              {heroExpanded ? 'Ocultar detalhes' : 'Mais detalhes'} <ChevronDown size={16} />
            </button>
          </div>

          <div className="result-key-metrics">
            <article><span>Pontos usados</span><strong>{result.trainingPointsUsed}</strong><small>de {result.trainingPointsTotal}</small></article>
            <article><span>Disponíveis</span><strong>{pointsAvailable}</strong><small>pontos restantes</small></article>
            <article><span>Habilidades</span><strong>{skillInfo.done}/{skillInfo.total || 5}</strong><small>{skillInfo.total && skillInfo.done >= skillInfo.total ? 'Top 5 concluído' : `${Math.max(0, skillInfo.total - skillInfo.done)} pendente(s)`}</small></article>
            {advancedMode && <article><span>Confiança</span><strong>{card.confidence}%</strong><small>{result.validation?.level === 'blocked' ? 'revisão necessária' : 'análise liberada'}</small></article>}
            {advancedMode && <article><span>Qualidade</span><strong>{Math.round(result.buildVariants[0]?.qualityScore ?? result.bestPosition.score ?? 0)}</strong><small>de 100</small></article>}
          </div>

          <div className="result-budget-line">
            <div><span>Uso do orçamento</span><strong>{pointPercent}%</strong></div>
            <i><b style={{ width: `${pointPercent}%` }} /></i>
          </div>

          <div className="result-hero-actions">
            <button className="result-action-primary" type="button" onClick={onSaveFicha} disabled={!onSaveFicha || saveBusy} title={!result.validation.canGenerate ? 'A ficha será salva no Cofre como “Revisar”, sem perder o resultado.' : undefined}>{saveBusy ? <Loader2 className="spin" size={17} /> : <Save size={17} />} {saveBusy ? 'Confirmando...' : result.validation.canGenerate ? 'Salvar ficha' : 'Salvar para revisar'}</button>
            <button type="button" onClick={onRecalculate}><RotateCcw size={17} /> Recalcular</button>
            <button type="button" onClick={() => void shareCurrentResult()}><Share2 size={17} /> Compartilhar</button>
          </div>
          {shareMessage && <p className="result-share-feedback"><CheckCircle2 size={15} /> {shareMessage}</p>}

          {heroExpanded && (
            <div className="result-expanded-details">
              <div className="save-progress-card">
                <span>Habilidades concluídas</span>
                <strong>{skillInfo.done}/{skillInfo.total || recommendedSkills.length}</strong>
                <i><b style={{ width: `${skillInfo.percent}%` }} /></i>
              </div>
              <div className="result-detail-grid">
                <div><span>Função real</span><strong>{result.teamMap?.functionLabel ?? result.buildName}</strong></div>
                <div><span>PRI em campo</span><strong>{result.pri.GER}</strong></div>
                <div><span>Origem dos pontos</span><strong>{sourceLabel}</strong></div>
                <div><span>Habilidades oficiais</span><strong>{recommendedSkills.length}/5</strong></div>
              </div>
              <p className="identity-note">A posição escolhida continua soberana. O BuildMaster preserva a identidade original da carta e apenas explica o melhor aproveitamento.</p>
            </div>
          )}
        </div>
      </section>

      {card.warnings.length > 0 && (
        <div className="alert-strip result-alert-strip">
          {card.warnings.slice(0, 2).map((warning) => <span key={warning}>{warning}</span>)}
        </div>
      )}

      <section className="result-navigation-shell luxury-panel">
        <div className="result-navigation-head">
          <div><p className="kicker">Resultado unificado</p><strong>Ficha, habilidades, Ímpeto, encaixe e Pro Global em uma única tela.</strong></div>
          <span>{result.trainingPointsUsed}/{result.trainingPointsTotal} pts</span>
        </div>

        <nav className="result-primary-tabs" aria-label="Áreas principais do resultado">
          {visiblePrimaryTabs.map((item) => {
            const Icon = item.id === 'resumo' ? LayoutDashboard : item.id === 'profissional' ? BrainCircuit : item.id === 'ficha' ? Trophy : item.id === 'habilidades' ? Sparkles : item.id === 'impetos' ? BrainCircuit : item.id === 'tatica' ? Target : Download;
            return (
              <button key={item.id} className={primaryIsActive(item.id) ? 'active' : ''} type="button" onClick={() => openPrimaryResult(item.id)}>
                <Icon size={18} /><span><strong>{item.label}</strong><small>{item.hint}</small></span>
              </button>
            );
          })}
        </nav>

        {advancedMode && !UNIFIED_COMPACT_RESULT_V3920 && (tab === 'treinador' || tab === 'mapa') && (
          <nav className="result-context-tabs" aria-label="Áreas da tática">
            <button type="button" className={tab === 'treinador' ? 'active' : ''} onClick={() => setTab('treinador')}>Visão tática</button>
            <button type="button" className={tab === 'mapa' ? 'active' : ''} onClick={() => setTab('mapa')}>Mapa e posição</button>
          </nav>
        )}

        {advancedMode && !UNIFIED_COMPACT_RESULT_V3920 && (<>
        <div className="result-advanced-bar">
          <div><SlidersHorizontal size={17} /><span><strong>Área avançada</strong><small>Auditoria, treino, dados e ferramentas técnicas.</small></span></div>
          <button type="button" className={advancedOpen || advancedSelected ? 'active' : ''} onClick={() => setAdvancedOpen((value) => !value)} aria-expanded={advancedOpen}>
            {advancedOpen ? 'Fechar' : 'Abrir detalhes'} <ChevronDown size={16} />
          </button>
        </div>

        {advancedOpen && (
          <div className="result-advanced-panel">
            {RESULT_ADVANCED_GROUPS.map((group) => (
              <section key={group.label}>
                <strong>{group.label}</strong>
                <div>{group.tabs.map((item) => <button key={item.value} type="button" className={tab === item.value ? 'active' : ''} onClick={() => setTab(item.value)}>{item.label}</button>)}</div>
              </section>
            ))}
          </div>
        )}
        </>)}
      </section>





      {tab === 'resumo' && (
        <div className="result-section-grid bm-unified-result-v3920">
          <UnifiedPerformanceV3920Panel
            result={result}
            onSave={saveBusy ? undefined : onSaveFicha}
            onShare={() => void shareCurrentResult()}
            onExportImage={() => onExportImage?.('portrait')}
            onSkillToggle={requestSkillToggle}
            onReplaceOwnedSkill={requestOwnedSkillReplacement}
            skillProgress={skillProgress}
          />
          {advancedMode && result.deepCardIntelligence && (
            <details className="luxury-panel wide-card bm-v3920-technical-audit bm-v3780-analysis-entry">
              <summary>Auditoria técnica compacta • Ver análise completa</summary>
              <div className="result-section-grid">
                <p className="panel-note"><b>Inteligência Profunda da Carta</b> • IA local do BuildMaster • Sem serviço de IA pago.</p>
                <p className="panel-note">Ainda faltam adicionar: {Math.max(0, 5 - recommendedSkills.length)} • Já adicionadas: {skillInfo.done}.</p>
                <p className="panel-note">Ver por que este ímpeto venceu • Análise Pro • Motor v37.50.</p>
                {advancedMode && <SupremeGameplayCard result={result} />}
                {advancedMode && <UnifiedIntelligenceCard result={result} />}
                <AdvancedMotorV3750Panel result={result} />
                <ProfessionalIntelligenceCenter result={result} />
              </div>
            </details>
          )}
        </div>
      )}

      {tab === 'mapa' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div>
                <p className="kicker">Mapeamento do time</p>
                <h3>{result.teamMap?.tacticalIdentity ?? result.buildName}</h3>
              </div>
              <span>{usagePositionLabel}</span>
            </div>
            <p className="panel-note">{result.teamMap?.coachFit}</p>
            <div className="data-grid">
              {Object.entries(result.teamMap?.sectorScores ?? {}).map(([key, value]) => (
                <div key={key}>
                  <span>{teamMapLabels[key] ?? key}</span>
                  <strong>{value}/100</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Função em cada fase do jogo</p>
            <div className="skill-grid">
              {[
                ['Marcação', result.teamMap?.defensiveJob],
                ['Saída de bola', result.teamMap?.buildupJob],
                ['Ataque', result.teamMap?.attackingJob],
                ['Pressão', result.teamMap?.pressingJob]
              ].map(([title, text]) => (
                <div key={String(title)} className="skill-check-card">
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Melhores parceiros e plano de partida</p>
            <div className="chip-cloud purple">
              {(result.teamMap?.idealPartners ?? []).map((item) => <span key={item}>{item}</span>)}
            </div>
            <ul className="clean-list">
              {(result.teamMap?.matchPlan ?? []).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Alertas para não perder desempenho</p>
            <div className="skill-grid">
              {(result.teamMap?.riskAlerts ?? []).map((item) => (
                <div key={item} className="skill-check-card muted">
                  <strong>Atenção</strong>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}


      {tab === 'ficha' && (
        <div className="result-section-grid">
          <GameplayDnaProfilesCard result={result} onApplyProfile={onApplyGameplayProfile} />
          <CalibrationV32Card result={result} />
          <PrecisionBuildPanel result={result} />
          {result.playerIdentity && <article className="luxury-panel wide-card identity-card">
            <div className="section-title-row">
              <div><p className="kicker">Identidade da versão</p><h3>Ficha única desta carta</h3></div>
              <span>{result.playerIdentity.signature}</span>
            </div>
            <p className="panel-note"><b>{result.playerIdentity.profileLabel}</b> • Individualidade {result.playerIdentity.individualityScore}/100</p>
            <div className="skill-grid">
              <div className="skill-check-card"><strong>Pontos fortes naturais</strong>{result.playerIdentity.naturalStrengths.map((item) => <span key={item}>✓ {item}</span>)}</div>
              <div className="skill-check-card"><strong>Correções necessárias</strong>{result.playerIdentity.criticalCorrections.map((item) => <span key={item}>↗ {item}</span>)}</div>
            </div>
            <div className="chip-cloud">{result.playerIdentity.protectedCharacteristics.map((item) => <span key={item}>{item}</span>)}</div>
            {result.playerIdentity.decisiveFactors.map((item) => <p key={item} className="panel-note">• {item}</p>)}
            <p className="panel-note">{result.playerIdentity.note}</p>
          </article>}

          {result.cardDna && <article className="luxury-panel wide-card dna-card">
            <div className="section-title-row">
              <div><p className="kicker">DNA, precisão máxima e anticlone</p><h3>{result.cardDna.identityLabel}</h3></div>
              <span>{result.cardDna.antiClone.fingerprint}</span>
            </div>
            <div className="health-score-grid dna-score-grid">
              <article><strong>{result.cardDna.antiClone.individualityScore}</strong><span>Individualidade</span></article>
              <article><strong>{result.cardDna.antiClone.identityContribution}%</strong><span>DNA da carta</span></article>
              <article><strong>{result.cardDna.antiClone.distributionDiversity}</strong><span>Diversidade</span></article>
              <article><strong>{result.cardDna.antiClone.cloneRisk}</strong><span>Risco de clone</span></article>
            </div>
            <p className="panel-note">{result.cardDna.lifeLikeSummary}</p>
            <div className="stat-bars five-cols dna-behavior-bars">
              {[
                ['Passe sob pressão', result.cardDna.behavior.passUnderPressure],
                ['Giro e condução', result.cardDna.behavior.turnAndCarry],
                ['Movimentação', result.cardDna.behavior.offBallMovement],
                ['Recuperação', result.cardDna.behavior.defensiveRecovery],
                ['Consistência', result.cardDna.behavior.matchConsistency]
              ].map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value}</strong><i><b style={{ width: `${Math.min(100, Number(value))}%` }} /></i></div>)}
            </div>
            <div className="skill-grid">
              <div className="skill-check-card"><strong>Características protegidas</strong>{result.cardDna.protectedStrengths.slice(0,4).map((item) => <span key={item}>✓ {item}</span>)}</div>
              <div className="skill-check-card"><strong>Comportamento projetado</strong>{result.cardDna.behavior.strongestBehaviors.map((item) => <span key={item}>↑ {item}</span>)}{result.cardDna.behavior.limitingBehaviors.map((item) => <span key={item}>⚠ {item}</span>)}</div>
            </div>
            <details className="settings-details-card">
              <summary>Metas individuais desta carta</summary>
              <div className="dna-goal-list">{result.cardDna.individualGoals.map((goal) => <div key={goal.training}><strong>{goal.label}</strong><span>{goal.current} atual • mínimo {goal.functionalMin} • ideal {goal.personalizedIdeal} • teto {goal.recommendedCeiling}</span><em>{goal.priority}</em><small>{goal.reason}</small></div>)}</div>
            </details>
            <details className="settings-details-card">
              <summary>Correção seletiva de fraquezas</summary>
              <div className="dna-goal-list">{result.cardDna.weaknessStrategies.length ? result.cardDna.weaknessStrategies.map((item) => <div key={item.training}><strong>{item.label}</strong><span>Gap {item.gap} • correção {item.correctability} • limite {item.maxInvestment}</span><em>{item.importance}</em><small>{item.strategy}</small></div>) : <p className="panel-note">Nenhuma fraqueza estrutural importante foi detectada.</p>}</div>
            </details>
            <details className="settings-details-card">
              <summary>Aproveitamento profundo das habilidades</summary>
              <div className="dna-skill-list">{result.cardDna.skillSynergies.length ? result.cardDna.skillSynergies.map((item) => <div key={`${item.source}-${item.name}`}><strong>{item.name}</strong><span>{item.status} • ativação {item.activationScore}/100 • frequência {item.expectedFrequency}</span><small>{item.recommendation}</small>{item.wasteRisk && <em>⚠ {item.wasteRisk}</em>}</div>) : <p className="panel-note">Nenhuma habilidade foi confirmada para análise profunda.</p>}</div>
            </details>
            {result.cardDna.antiClone.reasons.map((item) => <p key={item} className="panel-note">• {item}</p>)}
            <p className="panel-note">{result.cardDna.note}</p>
          </article>}

          {result.maxPrecision && <article className="luxury-panel wide-card precision-max-card">
            <div className="section-title-row">
              <div><p className="kicker">Precisão máxima + Meta 2026</p><h3>Ficha cirúrgica desta versão</h3></div>
              <span>{result.maxPrecision.versionIdentity.signature}</span>
            </div>
            <p className="panel-note"><b>{result.maxPrecision.versionIdentity.detectedVersion}</b> • confiança {result.maxPrecision.versionIdentity.confidence}/100</p>
            <div className="health-score-grid dna-score-grid">
              <article><strong>{result.maxPrecision.signatureProtection.identityRetentionScore}</strong><span>Identidade preservada</span></article>
              <article><strong>{result.maxPrecision.conversion.score}</strong><span>Conversão</span></article>
              <article><strong>{result.maxPrecision.antiCloneDistance}</strong><span>Distância anticlone</span></article>
              <article><strong>{result.maxPrecision.meta2026.playerMetaFit}</strong><span>Base histórica 2026</span></article>
            </div>
            <p className="panel-note">Ficha recomendada: <b>{result.maxPrecision.recommendedVariantTitle}</b>. {result.maxPrecision.conversion.verdict}</p>
            <div className="chip-cloud">{result.maxPrecision.versionIdentity.differentiators.map((item)=><span key={item}>{item}</span>)}</div>
            <details className="settings-details-card" open>
              <summary>Atributos finais reais e faixas individuais</summary>
              <div className="dna-goal-list">{result.maxPrecision.finalAttributes.map((item)=><div key={item.attribute}><strong>{item.label}</strong><span>{item.before} → {item.after} • mínimo {item.functionalMin} • ideal {item.personalizedIdeal} • teto {item.usefulCeiling}</span><em>{item.status}</em><small>{item.note}</small></div>)}</div>
            </details>
            <details className="settings-details-card">
              <summary>Simulação de ações em campo</summary>
              <div className="comparison-table"><div><strong>Ação</strong><strong>Antes</strong><strong>Depois</strong><strong>Ganho</strong></div>{result.maxPrecision.actions.map((item)=><div key={item.action}><span>{item.action}</span><span>{item.before}</span><span>{item.after}</span><strong>{item.gain>0?`+${item.gain}`:item.gain}</strong></div>)}</div>
            </details>
            <details className="settings-details-card">
              <summary>Auditoria ponto por ponto</summary>
              <div className="dna-goal-list">{result.maxPrecision.pointAudit.map((item)=><div key={item.training}><strong>{item.label} +{item.level}</strong><span>Custo real {item.realCost} • ganho útil {item.usefulGain} • retorno {item.marginalReturn}</span><em>{item.affectedAttributes.join(' • ')}</em><small>{item.verdict}</small></div>)}</div>
            </details>
            <details className="settings-details-card">
              <summary>Cinco alternativas comparadas</summary>
              <div className="variant-grid">{result.maxPrecision.alternatives.map((item)=><div key={item.title}><strong>{item.title}</strong><span>Nota {item.score}/100 • identidade {item.identityScore} • adaptação {item.adaptationScore}</span><em>Habilidade {item.skillScore} • Meta {item.metaScore} • desperdício {item.wasteScore}</em><p>{item.why}</p></div>)}</div>
            </details>
            <details className="settings-details-card">
              <summary>Base histórica do eFootball 2026 — {result.maxPrecision.meta2026.patchReference}</summary>
              <p className="panel-note"><b>{result.maxPrecision.meta2026.classification}</b> • atualização {result.maxPrecision.meta2026.updatedAt} • encaixe {result.maxPrecision.meta2026.fitLabel}</p>
              <div className="skill-grid"><div className="skill-check-card"><strong>Mecânicas oficiais consideradas</strong>{result.maxPrecision.meta2026.officialMechanics.map((item)=><span key={item}>✓ {item}</span>)}</div><div className="skill-check-card"><strong>Tendências competitivas</strong>{result.maxPrecision.meta2026.competitiveTrends.map((item)=><span key={item.name}>{item.name} • confiança {item.confidence}: {item.note}</span>)}</div></div>
              <div className="skill-grid"><div className="skill-check-card"><strong>Pontos fortes no meta</strong>{result.maxPrecision.meta2026.strongestMetaTraits.map((item)=><span key={item}>↑ {item}</span>)}</div><div className="skill-check-card muted"><strong>O que ainda falta</strong>{result.maxPrecision.meta2026.missingMetaTraits.map((item)=><span key={item}>⚠ {item}</span>)}</div></div>
              <p className="panel-note">{result.maxPrecision.meta2026.recommendedMetaUse}</p><p className="panel-note">{result.maxPrecision.meta2026.disclaimer}</p>
            </details>
            {result.maxPrecision.explanation.map((item)=><p key={item} className="panel-note">• {item}</p>)}
          </article>}
          {result.efootballV600 && <article className="luxury-panel wide-card efootball-v600-result" data-testid="efootball-v600-result">
            <div className="section-title-row">
              <div><p className="kicker">eFootball 2027 • v6.0</p><h3>Adaptação competitiva ao novo gameplay</h3></div>
              <span>{Math.round(result.efootballV600.winnerScore)}/100</span>
            </div>
            <p className="panel-note">{result.efootballV600.summary}</p>
            <div className="health-score-grid dna-score-grid">
              <article><strong>{Math.round(result.efootballV600.responseScore)}</strong><span>Resposta / primeiro toque</span></article>
              <article><strong>{Math.round(result.efootballV600.manualDefenceScore)}</strong><span>Defesa manual</span></article>
              <article><strong>{result.efootballV600.candidatesEvaluated}</strong><span>Fichas comparadas</span></article>
              <article><strong>{result.efootballV600.exactBudget ? '100%' : '!'}</strong><span>Orçamento preservado</span></article>
            </div>
            <div className="skill-grid">
              <div className="skill-check-card"><strong>Função nas duas fases</strong><span>Atacando: {result.efootballV600.offensivePlaystyle ?? result.parsed.playstyle ?? 'sem estilo confirmado'}</span><span>Defendendo: {result.efootballV600.defensivePlaystyle ? `${result.efootballV600.defensivePlaystyle}${result.parsed.defensivePlaystyleConfirmed === false ? ' • provisório' : ''}` : 'sem estilo defensivo confirmado'}</span><span>Conexão: {result.efootballV600.connectionProfile === 'HIGH_DELAY' ? 'alta latência' : result.efootballV600.connectionProfile === 'VARIABLE' ? 'variável' : 'estável'}</span></div>
              <div className="skill-check-card"><strong>Formação v6</strong><span>✓ Formação fluída pronta</span><span>✓ Ataque e defesa avaliados separadamente</span><span>✓ Sobreposição disponível no editor</span></div>
            </div>
            <div className="chip-cloud">{result.efootballV600.finalSkills.map((skill)=><span key={skill}>{skill}</span>)}</div>
            <p className="panel-note"><b>Ímpeto:</b> {result.efootballV600.impetoPrimary ?? 'sem gasto recomendado nesta carta'}.</p>
            {result.efootballV600.previousSeasonMemoryDownweighted && <p className="panel-note">Partidas registradas antes da v6 continuam no histórico, mas perderam prioridade porque pertencem à jogabilidade 5.x.</p>}
            <p className="panel-note">O BuildMaster não altera ping, rota ou servidor. A adaptação busca reduzir a dependência de timing perfeito por meio da ficha, habilidades e estrutura tática.</p>
          </article>}

          {result.realPerformance2027V4080R7 && <article className="luxury-panel wide-card real-performance-2027-r7" data-testid="real-performance-2027-r7">
            <div className="section-title-row">
              <div><p className="kicker">Motor de Desempenho Real 2027 • r7</p><h3>Ficha final para ataque, defesa e resposta real</h3></div>
              <span>{Math.round(result.realPerformance2027V4080R7.phaseProfile.phaseBalanceScore)}/100</span>
            </div>
            <p className="panel-note">{result.realPerformance2027V4080R7.summary}</p>
            <div className="skill-grid">
              <div className="skill-check-card"><strong>Duas fases</strong><span>Atacando: {result.realPerformance2027V4080R7.phaseProfile.attackRole}</span><span>Defendendo: {result.realPerformance2027V4080R7.phaseProfile.defenceRole}</span><span>Peso: {Math.round(result.realPerformance2027V4080R7.phaseProfile.attackWeight)}% ataque • {Math.round(result.realPerformance2027V4080R7.phaseProfile.defenceWeight)}% defesa</span></div>
              <div className="skill-check-card"><strong>Ímpeto</strong><span>Decisão: {result.realPerformance2027V4080R7.impetoPolicy.decision.replaceAll('_',' ')}</span><span>Atual: {result.realPerformance2027V4080R7.impetoPolicy.current ?? 'nenhum confirmado'}</span><span>Ideal futuro: {result.realPerformance2027V4080R7.impetoPolicy.ideal ?? 'sem troca necessária'}</span></div>
            </div>
            <div className="chip-cloud">{result.realPerformance2027V4080R7.finalSkills.map((skill)=><span key={skill}>{skill}</span>)}</div>
            <details className="settings-details-card"><summary>Ganho marginal das habilidades</summary><div className="dna-goal-list">{result.realPerformance2027V4080R7.skillMarginal.slice(0,8).map((item)=><div key={item.name}><strong>{item.name} • {Math.round(item.marginalGain)}/100</strong><span>Ataque {Math.round(item.attackGain)} • Defesa {Math.round(item.defenceGain)} • Delay {Math.round(item.delayResilience)} • DNA {Math.round(item.dnaGain)}</span><small>{item.reason}</small></div>)}</div></details>
            <p className="panel-note"><b>Política de Ímpeto:</b> {result.realPerformance2027V4080R7.impetoPolicy.reason}</p>
            <p className="panel-note"><b>Aprendizado v6:</b> {result.realPerformance2027V4080R7.learning.recommendation}</p>
          </article>}

          {result.metaVivo2027V4080R8 && <article className="luxury-panel wide-card meta-vivo-2027-r8" data-testid="meta-vivo-2027-r8">
            <div className="section-title-row">
              <div><p className="kicker">Meta Vivo 2027 • r8</p><h3>Ficha final + defesa manual + catálogo vivo</h3></div>
              <span>{Math.round(result.metaVivo2027V4080R8.scores.finalFunctional)}/100</span>
            </div>
            <p className="panel-note">{result.metaVivo2027V4080R8.summary}</p>
            <div className="health-score-grid dna-score-grid">
              <article><strong>{Math.round(result.metaVivo2027V4080R8.scores.firstTouch)}</strong><span>Primeiro toque</span></article>
              <article><strong>{Math.round(result.metaVivo2027V4080R8.scores.commandResponse)}</strong><span>Resposta a comando</span></article>
              <article><strong>{Math.round(result.metaVivo2027V4080R8.scores.manualDefence)}</strong><span>Defesa manual</span></article>
              <article><strong>{Math.round(result.metaVivo2027V4080R8.scores.delayRobustness)}</strong><span>Robustez ao delay</span></article>
            </div>
            <div className="skill-grid">
              <div className="skill-check-card"><strong>Responsabilidade defensiva</strong><span>{result.metaVivo2027V4080R8.phaseRole.responsibility.replaceAll('_',' ')}</span><span>Risco de dupla pressão: {result.metaVivo2027V4080R8.phaseRole.doublePressRisk}</span><span>{result.metaVivo2027V4080R8.phaseRole.instruction}</span></div>
              <div className="skill-check-card"><strong>Ímpeto sem desperdício</strong><span>{result.metaVivo2027V4080R8.impetoInvestment.decision.replaceAll('_',' ')}</span><span>Atual: {result.metaVivo2027V4080R8.impetoInvestment.current ?? 'não confirmado'}</span><span>Ideal futuro: {result.metaVivo2027V4080R8.impetoInvestment.ideal ?? 'sem troca necessária'} • prioridade {result.metaVivo2027V4080R8.impetoInvestment.priority}</span></div>
            </div>
            <details className="settings-details-card"><summary>Atributos META 2027 • onde investir e onde parar</summary><div className="dna-goal-list"><div><strong>{result.metaVivo2027V4080R8.attributeMeta.positionLabel} • {result.metaVivo2027V4080R8.attributeMeta.playerPlaystyle ?? 'estilo não confirmado'}</strong><span>{result.metaVivo2027V4080R8.attributeMeta.summary}</span><small>{result.metaVivo2027V4080R8.attributeMeta.dnaRule}</small></div>{result.metaVivo2027V4080R8.attributeMeta.topPriorities.map((item)=><div key={`meta-${item.label}`}><strong>{item.priority} • {item.label} {item.current} → alvo {item.targetIdeal}</strong><span>Piso {item.targetMin} • teto útil {item.usefulCeiling} • falta {item.gap}</span><small>{item.reason}</small></div>)}{result.metaVivo2027V4080R8.attributeMeta.stopSpending.length>0&&<div><strong>Parar de forçar pontos</strong><span>{result.metaVivo2027V4080R8.attributeMeta.stopSpending.map((item)=>`${item.label} ${item.current}/${item.usefulCeiling}`).join(' • ')}</span><small>Quando o teto útil é alcançado, o motor procura outro atributo com maior retorno marginal.</small></div>}</div></details>
            <div className="chip-cloud">{result.metaVivo2027V4080R8.finalSkills.map((skill)=><span key={skill}>{skill}</span>)}</div>
            <details className="settings-details-card"><summary>Treino de defesa manual v6.0</summary><div className="dna-goal-list"><div><strong>Regra principal</strong><span>{result.metaVivo2027V4080R8.phaseRole.instruction}</span><small>{result.metaVivo2027V4080R8.phaseRole.secondaryInstruction}</small></div>{result.metaVivo2027V4080R8.phaseRole.drill.map((step)=><div key={step}><span>{step}</span></div>)}</div></details>
            <details className="settings-details-card"><summary>Por que essas 5 habilidades?</summary><div className="dna-goal-list">{result.metaVivo2027V4080R8.skillPortfolio.map((item)=><div key={item.name}><strong>{item.role.replaceAll('_',' ')} • {item.name}</strong><span>Ganho marginal {Math.round(item.marginalGain)}/100</span><small>{item.reason}</small></div>)}</div></details>
            <details className="settings-details-card"><summary>Catálogo vivo e estilos v6.0</summary><div className="dna-goal-list"><div><strong>{result.metaVivo2027V4080R8.catalog.standardAdditionalSkills} habilidades adicionais padrão</strong><span>{result.metaVivo2027V4080R8.catalog.effectiveAdditionalSkills} efetivas após catálogo remoto</span></div><div><strong>{result.metaVivo2027V4080R8.catalog.recognizedSpecialSkills} especiais reconhecidas</strong><span>{result.metaVivo2027V4080R8.catalog.provisionalSpecialSkills} provisória(s) sem peso inventado</span></div><div><strong>{result.metaVivo2027V4080R8.catalog.offensivePlaystyles} estilos ofensivos canônicos</strong><span>Defensivo desta carta: {result.metaVivo2027V4080R8.catalog.playerDefensiveStyleStatus}</span></div><div><strong>{result.metaVivo2027V4080R8.catalog.teamPlaystyles} estilos coletivos no catálogo tático</strong><span>Técnicos v6 podem ter até {result.metaVivo2027V4080R8.manager.combinationSlotsSupported} Combinações observadas sem inventar condição.</span></div></div></details>
            <p className="panel-note"><b>Ambiente:</b> {result.metaVivo2027V4080R8.environment.diagnosis}</p>
            <p className="panel-note"><b>Aprendizado:</b> {result.metaVivo2027V4080R8.learning.recommendation}</p>
          </article>}

          {result.gameplayMetaV600R10 && <article className="luxury-panel wide-card gameplay-meta-v600-r10" data-testid="gameplay-meta-v600-r10">
            <div className="section-title-row">
              <div><p className="kicker">Meta v6.0 • r10</p><h3>Passe, condução, tiki-taka e Formação Fluída</h3></div>
              <span>{Math.round(result.gameplayMetaV600R10.scores.metaReadiness)}/100</span>
            </div>
            <p className="panel-note"><b>Recomendação:</b> {result.gameplayMetaV600R10.formation.recommendation.replaceAll('_',' ')} • {result.gameplayMetaV600R10.formation.reason}</p>
            <div className="health-score-grid dna-score-grid">
              <article><strong>{Math.round(result.gameplayMetaV600R10.scores.shortPassing)}</strong><span>Passe curto</span></article>
              <article><strong>{Math.round(result.gameplayMetaV600R10.scores.ballCarry)}</strong><span>Condução</span></article>
              <article><strong>{Math.round(result.gameplayMetaV600R10.scores.tikiTaka)}</strong><span>Tiki-taka</span></article>
              <article><strong>{Math.round(result.gameplayMetaV600R10.scores.manualDefence)}</strong><span>Defesa manual</span></article>
              <article><strong>{Math.round(result.gameplayMetaV600R10.scores.pressResistance)}</strong><span>Resistência à pressão</span></article>
              <article><strong>{Math.round(result.gameplayMetaV600R10.scores.fluidCompatibility)}</strong><span>Compatibilidade fluída</span></article>
            </div>
            <div className="skill-grid">
              <div className="skill-check-card"><strong>Formação tradicional</strong><span>{Math.round(result.gameplayMetaV600R10.scores.traditionalCompatibility)}/100</span><span>Continua válida quando preservar a função-base gera mais consistência.</span></div>
              <div className="skill-check-card"><strong>Formação Fluída</strong><span>{Math.round(result.gameplayMetaV600R10.scores.fluidCompatibility)}/100</span><span>{result.gameplayMetaV600R10.formation.warning}</span></div>
            </div>
            <details className="settings-details-card"><summary>Mudanças de posição seguras entre ataque e defesa</summary><div className="dna-goal-list">{result.gameplayMetaV600R10.formation.safeMoves.length ? result.gameplayMetaV600R10.formation.safeMoves.map((move)=><div key={`${move.position}-${move.label}`}><strong>{move.label} • risco {move.risk}</strong><span>{move.reason}</span></div>) : <div><strong>Preservar posição</strong><span>Esta carta não precisa ser deslocada para outra função na fase defensiva.</span></div>}</div></details>
            <details className="settings-details-card"><summary>Prioridades do meta v6.0</summary><div className="dna-goal-list">{result.gameplayMetaV600R10.priorities.map((item)=><div key={item}><span>{item}</span></div>)}</div></details>
            <details className="settings-details-card"><summary>Treino prático para a nova jogabilidade</summary><div className="dna-goal-list">{result.gameplayMetaV600R10.drills.map((item)=><div key={item}><span>{item}</span></div>)}</div></details>
            <p className="panel-note">{result.gameplayMetaV600R10.salesSummary}</p>
          </article>}
          {result.liveEvolutionV600R11 && <article className="luxury-panel wide-card live-evolution-v600-r11" data-testid="live-evolution-v600-r11">
            <div className="section-title-row"><div><p className="kicker">Meta Vivo Semanal • r11</p><h3>Novidades da v6.0 sem congelar o catálogo</h3></div><span>{result.liveEvolutionV600R11.catalog.safeToWeight?'VALIDADO':'OBSERVADO'}</span></div>
            <div className="skill-check-grid">
              <div className="skill-check-card"><strong>Estilo ofensivo</strong><span>{result.liveEvolutionV600R11.playerStyles.offensive??'não lido'}</span></div>
              <div className="skill-check-card"><strong>Estilo defensivo</strong><span>{result.liveEvolutionV600R11.playerStyles.defensive??'não lido'} • {result.liveEvolutionV600R11.playerStyles.defensiveEvidence}</span></div>
              <div className="skill-check-card"><strong>Estilos coletivos</strong><span>{result.liveEvolutionV600R11.catalog.teamPlaystyles} no catálogo v6.0</span></div><div className="skill-check-card"><strong>Técnicos atuais</strong><span>{result.liveEvolutionV600R11.catalog.managerSeeds} registros verificados prontos para Link-Up</span></div>
            </div>
            <details className="settings-details-card"><summary>Novidades detectadas pelo OCR</summary><div className="dna-goal-list">{result.liveEvolutionV600R11.catalog.unknownFields.length?result.liveEvolutionV600R11.catalog.unknownFields.map(item=><div key={item}><strong>Novo dado observado</strong><span>{item}</span><small>Preservado sem inventar peso até confirmação.</small></div>):<div><strong>Catálogo consistente</strong><span>Nenhum campo desconhecido nesta carta.</span></div>}</div></details>
            <details className="settings-details-card"><summary>Regras de atualização semanal</summary><div className="dna-goal-list">{result.liveEvolutionV600R11.rules.map(item=><div key={item}><span>{item}</span></div>)}</div></details>
          </article>}

          {result.metaBuildUniverse && <MetaBuildLabPanel universe={result.metaBuildUniverse} />}

          <EliteEvolutionPanel result={result} />

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div>
                <p className="kicker">Distribuição de pontos</p>
                <h3>Plano Elite de desempenho</h3>
              </div>
              <span>{result.trainingPointsUsed}/{result.trainingPointsTotal}</span>
            </div>
            <div
              className="training-ribbon training-ribbon-r106"
              data-testid="training-progression-icons-r106"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${trainingItems.length}, minmax(70px, 1fr))`,
                gap: 8,
                overflowX: 'auto',
                padding: '4px 2px 8px',
                scrollbarWidth: 'thin'
              }}
            >
              {trainingItems.map(([key, value]) => {
                const label = trainingLabels[key] ?? key;
                const cost = result.trainingCost[key as keyof typeof result.trainingCost];
                return (
                  <div
                    key={key}
                    title={`${label}: ${value}${Number(cost) > 0 ? ` • ${cost} pts` : ''}`}
                    style={{
                      minWidth: 70,
                      display: 'grid',
                      justifyItems: 'center',
                      alignContent: 'start',
                      gap: 6,
                      padding: '10px 7px',
                      borderRadius: 14,
                      border: Number(value) > 0
                        ? '1px solid rgba(96,165,250,.34)'
                        : '1px solid rgba(255,255,255,.08)',
                      background: Number(value) > 0
                        ? 'linear-gradient(180deg, rgba(37,99,235,.15), rgba(3,12,24,.74))'
                        : 'rgba(3,12,24,.46)',
                      boxShadow: Number(value) > 0
                        ? 'inset 0 1px 0 rgba(255,255,255,.04), 0 8px 24px rgba(0,0,0,.12)'
                        : 'none'
                    }}
                  >
                    <strong
                      aria-label={`${label}: ${value}`}
                      style={{
                        fontSize: 20,
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                        color: Number(value) > 0 ? '#f8fafc' : 'rgba(226,232,240,.5)'
                      }}
                    >
                      {value}
                    </strong>
                    <TrainingProgressionIconR106
                      trainingKey={key as TrainingProgressionKeyR106}
                      title={label}
                      size={30}
                      style={{
                        color: Number(value) > 0 ? '#f8fafc' : 'rgba(226,232,240,.42)',
                        filter: Number(value) > 0 ? 'drop-shadow(0 2px 5px rgba(0,0,0,.28))' : 'none'
                      }}
                    />
                    <span
                      style={{
                        minHeight: 28,
                        textAlign: 'center',
                        fontSize: 10,
                        lineHeight: 1.25,
                        fontWeight: 700,
                        letterSpacing: '.01em',
                        color: Number(value) > 0 ? 'rgba(226,232,240,.92)' : 'rgba(148,163,184,.62)'
                      }}
                    >
                      {label}
                    </span>
                    <i style={{ width: '100%' }}>
                      <b style={{ width: `${Math.min(100, Number(value) * 7)}%` }} />
                    </i>
                  </div>
                );
              })}
            </div>
            <p className="panel-note" style={{ marginTop: 8 }}>
              Ícones no padrão visual da ficha do jogo. Valores zerados continuam visíveis para facilitar a cópia da progressão.
              {goalkeeperProgressionR106 ? ' GK1, GK2 e GK3 também aparecem para goleiros.' : ''}
            </p>
            <p className="panel-note">Custo real: {result.trainingCostRule}. Restante: {result.trainingPointsRemaining} ponto(s).</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Comparação com plano-base</p>
            <div className="comparison-table">
              <div><strong>Treino</strong><strong>Jogo</strong><strong>App</strong><strong>Dif.</strong></div>
              {result.trainingComparison.length ? result.trainingComparison.map((item) => (
                <div key={item.key}>
                  <span>{item.label}</span>
                  <span>{item.auto}</span>
                  <span>{item.recommended}</span>
                  <strong>{item.difference > 0 ? `+${item.difference}` : item.difference}</strong>
                </div>
              )) : <p className="panel-note">O plano automático não foi lido; comparação indisponível.</p>}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Três fichas DNA realmente personalizadas</p>
            <div className="variant-grid">
              {result.buildVariants.map((variant) => (
                <div key={variant.kind}>
                  <strong>{variant.title}</strong>
                  <span>{variant.positionLabel} • {variant.pointsUsed} pts{variant.qualityScore ? ` • Qualidade ${variant.qualityScore}/100` : ''}</span>
                  {variant.adaptationLabel && <b>{variant.adaptationLabel}</b>}
                  <em>{trainingSummary(variant.training)}</em>
                  <p>{variant.note}</p>
                  {variant.verdict && <small><b>Veredito:</b> {variant.verdict}</small>}
                  {(variant.efficiencyScore || variant.balanceScore) && (
                    <div className="variant-metrics">
                      <span>Eficiência <b>{variant.efficiencyScore}/100</b></span>
                      <span>Equilíbrio <b>{variant.balanceScore}/100</b></span>
                      <span>Simulações <b>{variant.simulationsTested}</b></span>
                    </div>
                  )}
                  {variant.scenarioScores && (
                    <div className="scenario-score-grid">
                      <span>Posse <b>{variant.scenarioScores.possession}</b></span>
                      <span>Contra-ataque <b>{variant.scenarioScores.counterAttack}</b></span>
                      <span>Pressão <b>{variant.scenarioScores.pressing}</b></span>
                      <span>Duelo físico <b>{variant.scenarioScores.physicalDuels}</b></span>
                      <span>Consistência <b>{variant.scenarioScores.consistency}</b></span>
                    </div>
                  )}
                  {variant.highlights?.map((item) => <small key={item}>✓ {item}</small>)}
                  {variant.tradeOffs?.map((item) => <small key={item}>↔ {item}</small>)}
                  {variant.risks?.map((item) => <small key={item}>⚠ {item}</small>)}
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Motor físico</p><h3>Corpo, mobilidade e resistência na posição escolhida</h3></div>
              <span>{result.physicalEngine.suitabilityScore}/100</span>
            </div>
            <div className="data-grid">
              <div><span>Altura</span><strong>{result.physicalEngine.heightCm ? `${result.physicalEngine.heightCm} cm` : 'Não confirmada'}</strong></div>
              <div><span>Peso</span><strong>{result.physicalEngine.weightKg ? `${result.physicalEngine.weightKg} kg` : 'Não confirmado'}</strong></div>
              <div><span>Perfil corporal</span><strong>{result.physicalEngine.bodyProfile}</strong></div>
              <div><span>Mobilidade</span><strong>{result.physicalEngine.mobilityScore}/100</strong></div>
              <div><span>Força funcional</span><strong>{result.physicalEngine.strengthScore}/100</strong></div>
              <div><span>Jogo aéreo</span><strong>{result.physicalEngine.aerialScore}/100</strong></div>
              <div><span>Resistência</span><strong>{result.physicalEngine.staminaScore}/100</strong></div>
              {result.matchStaminaV4080R44 && <div><span>Resistência 90 min</span><strong>{result.matchStaminaV4080R44.enduranceScore}/100</strong></div>}
              {result.matchStaminaV4080R44 && <div><span>Carga física</span><strong>{result.matchStaminaV4080R44.workload}</strong></div>}
              {result.matchStaminaV4080R44 && <div><span>Intensidade estimada</span><strong>~{result.matchStaminaV4080R44.projectedMinute} min</strong></div>}
              <div><span>Perna dominante</span><strong>{result.physicalEngine.dominantFoot ?? 'Não confirmada'}</strong></div>
            </div>
            <div className="chip-cloud">{result.physicalEngine.advantages.map((item) => <span key={item}>✓ {item}</span>)}</div>
            {result.physicalEngine.limitations.map((item) => <p key={item} className="panel-note">⚠ {item}</p>)}
            {result.matchStaminaV4080R44 && <p className="panel-note">{result.matchStaminaV4080R44.note} Alvo {result.matchStaminaV4080R44.targetStamina} • projetada {result.matchStaminaV4080R44.projectedStamina}.</p>}
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Metas de atributos</p><h3>Faixas necessárias para {usagePositionLabel}</h3></div>
              <span>{result.attributeGoals.readinessScore}/100</span>
            </div>
            <div className="comparison-table">
              <div><strong>Atributo</strong><strong>Atual</strong><strong>Mín.</strong><strong>Ideal</strong></div>
              {result.attributeGoals.goals.map((goal) => <div key={goal.attribute}><span>{goal.label}</span><span>{goal.current}</span><span>{goal.targetMin}</span><strong>{goal.targetIdeal}</strong><small>{goal.status} • {goal.reason}</small></div>)}
            </div>
            <p className="panel-note">{result.attributeGoals.summary} As metas são faixas de rendimento, não nomes inventados nem valores obrigatórios.</p>
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Otimizador avançado</p><h3>Auditoria da ficha vencedora</h3></div>
              <span>{result.advancedOptimizer.winnerScore}/100</span>
            </div>
            <div className="data-grid">
              <div><span>Ficha vencedora</span><strong>{result.advancedOptimizer.winnerTitle}</strong></div>
              <div><span>Combinações</span><strong>{result.advancedOptimizer.combinationsTested}</strong></div>
              <div><span>Eficiência</span><strong>{result.advancedOptimizer.efficiencyScore}/100</strong></div>
              <div><span>Desperdício estimado</span><strong>{result.advancedOptimizer.wasteScore}/100</strong></div>
              <div><span>Pontos sem uso</span><strong>{result.advancedOptimizer.unusedPoints}</strong></div>
              <div><span>Orçamento</span><strong>{result.advancedOptimizer.budgetRespected ? 'Respeitado' : 'Revisar'}</strong></div>
            </div>
            {result.advancedOptimizer.decisionReasons.map((item) => <p key={item} className="panel-note">✓ {item}</p>)}
            {result.advancedOptimizer.detectedWaste.map((item) => <p key={item} className="panel-note">⚙ {item}</p>)}
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Limite de correção</p><h3>Corrigir sem descaracterizar o jogador</h3></div>
              <span>{result.correctionLimit.score}/100</span>
            </div>
            <p className="panel-note">{result.correctionLimit.summary}</p>
            <div className="chip-cloud">{result.correctionLimit.protectedStrengths.map((item) => <span key={item}>✓ {item}</span>)}</div>
            {result.correctionLimit.correctionCaps.map((item) => <p key={item.training} className="panel-note">⚠ {item.label}: nível {item.currentLevel}; faixa recomendada até {item.recommendedMax}. {item.reason}</p>)}
            {result.correctionLimit.naturalLimits.map((item) => <p key={item} className="panel-note">◇ {item}</p>)}
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Retorno marginal</p><h3>Ganho do próximo ponto de treino</h3></div>
              <span>{result.marginalReturn[0]?.marginalGain ?? 0} melhor ganho</span>
            </div>
            <div className="comparison-table">
              <div><strong>Grupo</strong><strong>Nível</strong><strong>Custo</strong><strong>Retorno</strong></div>
              {result.marginalReturn.map((item) => <div key={item.training}><span>{item.label}</span><span>{item.currentLevel}</span><span>{item.nextPointCost}</span><strong>{item.returnLabel} • {item.marginalGain}</strong><small>{item.recommendation}</small></div>)}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Tolerância a erro</p><h3>Três cenários para dados incertos</h3></div>
              <span>Confiança {result.errorTolerance.confidence}</span>
            </div>
            <div className="build-variant-grid">
              {[['Conservador', result.errorTolerance.conservative], ['Provável', result.errorTolerance.probable], ['Otimista', result.errorTolerance.optimistic]].map(([title, plan]) => <div key={String(title)} className="build-variant-card"><strong>{String(title)}</strong><div className="variant-metrics">{Object.entries(plan as Record<string, number>).filter(([,value])=>value>0).map(([key,value])=><span key={key}>{trainingLabels[key] ?? key} <b>{value}</b></span>)}</div></div>)}
            </div>
            <p className="panel-note">{result.errorTolerance.note}</p>
            {result.errorTolerance.sensitiveGroups.map((item)=><p key={item} className="panel-note">⚠ {item}</p>)}
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Função tática avançada</p><h3>Posição escolhida + estilo oficial preservado</h3></div>
              <span>{result.advancedTacticalFunction.compatibilityScore}/100</span>
            </div>
            <p className="panel-note"><b>{result.advancedTacticalFunction.officialPlaystyle ?? 'Estilo não identificado'}</b> • adaptação {result.advancedTacticalFunction.fitLabel}. {result.advancedTacticalFunction.activationNote}</p>
            <div className="chip-cloud purple">{result.advancedTacticalFunction.priorities.map((item) => <span key={item}>{item}</span>)}</div>
            <small>{result.advancedTacticalFunction.officialNameGuard}</small>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Compatibilidade tática</p>
            <div className="data-grid">
              {Object.entries(result.tacticalFit).map(([key, value]) => (
                <div key={key}><span>{tacticalLabels[key] ?? key}</span><strong>{value}/10</strong></div>
              ))}
            </div>
          </article>
        </div>
      )}






      {tab === 'profissional' && <ProfessionalIntelligenceCenter result={result} />}


      {tab === 'habilidades' && result.skillIntegrity && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker"><ShieldCheck size={14} /> Top 5 por função v31.80</p><h3>{result.skillIntegrity.status === 'approved' ? 'Lista complementar aprovada' : 'Confirme as habilidades lidas antes de aplicar'}</h3></div><span>{result.skillIntegrity.recommendedSkills.length}/5 seguras</span></div>
            <div className="chip-cloud">{result.skillIntegrity.checks.map((check) => <span key={check}>{check}</span>)}</div>
            {result.skillIntegrity.removedDuplicates.length > 0 && <p className="panel-note">Removidas automaticamente por repetição ou conflito: {result.skillIntegrity.removedDuplicates.join(', ')}.</p>}
            {result.skillIntegrity.missingSlots > 0 && <p className="panel-note">{result.skillIntegrity.missingSlots} espaço(s) ficaram vazio(s) porque o motor não encontrou outra habilidade segura. Isso só acontece quando a carta já possui quase todo o pool seguro da função; o app não usa habilidades incompatíveis para preencher a vaga.</p>}
          </article>
        </div>
      )}

      {tab === 'habilidades' && !advancedMode && (
        <div className="result-section-grid bm-simple-skill-result">
          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker">Habilidades adicionais</p><h3>Somente o que ainda falta</h3></div><span>{pendingRecommendedSkills.length}/{recommendedSkills.length}</span></div>
            <p className="panel-note">Marque as que você adicionou. Se a carta já veio com uma delas, use “Já possui? Gerar outra” para recalcular uma substituta compatível.</p>
            <div className="bm-simple-skill-list">
              {pendingRecommendedSkills.length ? pendingRecommendedSkills.map((skill, index) => {
                const detail = skillRecommendations.find((item) => item.name === skill);
                return <div className="bm-simple-skill-item" key={skill}>
                  <button type="button" className="bm-simple-skill-main" onClick={() => requestSkillToggle(skill)}><span>{index + 1}</span><div><strong>{skill}</strong><small>{detail?.reason ?? skillReason(skill)}</small></div><em>Marcar como feita</em></button>
                  <button type="button" className="bm-simple-skill-replace" onClick={() => requestOwnedSkillReplacement(skill)} title="Confirmar que a carta já possui esta habilidade e recalcular uma substituta"><RotateCcw size={14} /> Já possui? Gerar outra</button>
                </div>;
              }) : recommendedSkills.length ? <div className="bm-skills-complete-message"><strong>✓ Lista concluída</strong><span>Todas as habilidades recomendadas já foram adicionadas.</span></div> : <p className="panel-note">Nenhuma habilidade adicional segura foi encontrada para esta carta.</p>}
            </div>
            {completedRecommendedSkills.length > 0 && <details className="bm-completed-skills-details"><summary>Ver {completedRecommendedSkills.length} já adicionada(s)</summary><div className="bm-simple-skill-list completed-list">{completedRecommendedSkills.map((skill) => <button type="button" key={skill} className="completed" onClick={() => requestSkillToggle(skill)}><span>✓</span><div><strong>{skill}</strong><small>Toque para voltar à lista pendente.</small></div><em>Desmarcar</em></button>)}</div></details>}
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Habilidades que a carta já possui</p>
            <div className="chip-cloud">{nativeSkills.length ? nativeSkills.map((skill) => <span key={skill}>{skill}</span>) : <span>Nenhuma habilidade confirmada</span>}</div>
          </article>
        </div>
      )}

      {tab === 'habilidades' && advancedMode && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Habilidades especiais</p><h3>Impacto das habilidades oficiais na posição escolhida</h3></div>
              <span>{result.specialSkillsAnalysis.coverageScore}/100</span>
            </div>
            <div className="skill-grid">
              {result.specialSkillsAnalysis.usefulOwned.slice(0,6).map((item) => <div key={item.name} className="skill-check-card completed"><strong>{item.name} • {item.score}</strong><span>{item.impact}</span></div>)}
              {!result.specialSkillsAnalysis.usefulOwned.length && <p className="panel-note">Nenhuma habilidade oficial existente foi confirmada na carta.</p>}
            </div>
            <p className="panel-note">Catálogo oficial validado: {result.specialSkillsAnalysis.officialCatalogOnly ? 'sim' : 'não'}. O app não cria nomes de habilidades.</p>
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Prioridade de habilidades</p><h3>Fila oficial por impacto real</h3></div>
              <span>{result.skillPriority.officialOnly ? 'Catálogo oficial' : 'Revisar catálogo'}</span>
            </div>
            <div className="skill-grid">
              {result.skillPriority.ordered.map((item, index)=><div key={item.name} className="skill-check-card"><strong>{index+1}. {item.name} • {item.score}/100</strong><span>{item.tier}</span><small>{item.reasons.join(' • ')}</small></div>)}
            </div>
            <p className="panel-note">Cobertura atual {result.skillPriority.ownedCoverage}/100. {result.skillPriority.context.join(' ')}</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Top 5 habilidades adicionais</p>
            <div className="skill-grid">
              {recommendedSkills.length ? recommendedSkills.map((skill, index) => {
                const completed = Boolean(skillProgress?.[skill]);
                const detail = skillRecommendations.find((item) => item.name === skill);
                return (
                  <div key={skill} className={completed ? 'skill-check-card completed' : 'skill-check-card'}>
                    <strong>{String(index + 1).padStart(2, '0')} • {skill}</strong>
                    <span>{detail?.reason ?? skillReason(skill)}</span>
                    <button type="button" onClick={() => requestSkillToggle(skill)}>
                      {completed ? '✓ Concluída' : 'Marcar como feita'}
                    </button>
                    <div className="correction-actions">
                      <button type="button" onClick={() => onPromoteSkill?.(skill)}><ThumbsUp size={14} /> Priorizar</button>
                      <button type="button" onClick={() => requestOwnedSkillReplacement(skill)}><RotateCcw size={14} /> Já possui — gerar outra</button>
                      <button type="button" onClick={() => onRejectSkill?.(skill)}><Ban size={14} /> Não combina</button>
                    </div>
                  </div>
                );
              }) : <p className="panel-note">Nenhuma habilidade adicional segura foi encontrada.</p>}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Boas alternativas</p>
            <div className="skill-grid">
              {alternativeSkillItems.length ? alternativeSkillItems.map((item) => (
                <div key={item.name} className="skill-check-card">
                  <strong>{item.name}</strong>
                  <span>{item.reason}</span>
                  <div className="correction-actions">
                    <button type="button" onClick={() => onPromoteSkill?.(item.name)}><ThumbsUp size={14} /> Subir para Top 5</button>
                    <button type="button" onClick={() => onRejectSkill?.(item.name)}><Ban size={14} /> Evitar</button>
                  </div>
                </div>
              )) : <p className="panel-note">O Top 5 já cobre as melhores opções. Sem alternativa extra segura.</p>}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Evitar nesta função</p>
            <div className="skill-grid">
              {avoidSkillItems.length ? avoidSkillItems.map((item) => (
                <div key={item.name} className="skill-check-card muted">
                  <strong>{item.name}</strong>
                  <span>{item.reason}</span>
                </div>
              )) : <p className="panel-note">Nenhuma restrição crítica para esta função.</p>}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Detectadas na carta</p>
            <div className="chip-cloud">
              {nativeSkills.length ? nativeSkills.map((skill) => <span key={skill}>{skill}</span>) : <span>Nenhuma habilidade lida</span>}
            </div>
          </article>
        </div>
      )}


      {tab === 'impetos' && (
        <div className="result-section-grid impeto-focus-grid bm-ai-impeto-workspace">
          <article className="luxury-panel wide-card bm-ai-impeto-winner">
            <div className="section-title-row">
              <div><p className="kicker"><BrainCircuit size={14} /> Escolha final da IA local</p><h3>{bestImpeto?.name ?? 'Ímpeto ainda não definido'}</h3></div>
              <span>{bestImpeto?.score ?? 0}/100 • {bestImpeto?.confidence ?? result.localAi?.confidence ?? 0}% confiança</span>
            </div>
            <p className="bm-local-ai-summary">{bestImpeto?.reason ?? (impetoV4080?.slotStatus === 'OCUPADO' ? `Vaga já ocupada. ${existingImpetosV4080.length ? `Ímpeto(s) preservado(s): ${existingImpetosV4080.join(', ')}.` : 'Nenhum gasto adicional é recomendado.'}` : impetoV4080?.slotStatus === 'SEM_VAGA' ? 'Esta carta foi lida sem Espaço/Vaga de Ímpeto. Não gaste Token nela.' : impetoV4080 ? 'A vaga de Ímpeto não foi confirmada pelo OCR. O gasto fica bloqueado por segurança.' : 'Confirme o print antes de gastar um Token de Ímpeto Selec.')}</p>
            {impetoV4080 && <div className="data-grid"><div><span>Vaga de Ímpeto</span><strong>{impetoV4080.slotStatus === 'DISPONIVEL' ? 'Disponível' : impetoV4080.slotStatus === 'OCUPADO' ? 'Ocupada' : impetoV4080.slotStatus === 'SEM_VAGA' ? 'Não possui' : 'Não confirmada'}</strong></div><div><span>Gasto de Token</span><strong>{impetoV4080.canCraft ? 'Liberado' : 'Bloqueado'}</strong></div><div><span>Tipos selecionáveis</span><strong>{impetoV4080.selectableOfficialCount}</strong></div><div><span>Ímpeto atual</span><strong>{impetoV4080.primary ?? '—'}</strong></div></div>}
            {bestImpeto && <>
              <div className="bm-impeto-attribute-grid">{bestImpeto.attributes.map((attribute) => <div key={attribute}><ShieldCheck size={15} /><span>{attribute}</span></div>)}</div>
              <div className="bm-impeto-evidence">{(bestImpeto.evidence ?? []).map((line) => <p key={line}><CheckCircle2 size={15} /> {line}</p>)}</div>
              {(bestImpeto.warnings ?? []).length > 0 && <div className="alert-strip">{bestImpeto.warnings?.map((warning) => <span key={warning}>{warning}</span>)}</div>}
              <div className="correction-actions">
                <button type="button" onClick={() => onPromoteImpeto?.(bestImpeto.name)}><ThumbsUp size={14} /> Confirmar que combina</button>
                <button type="button" onClick={() => onRejectImpeto?.(bestImpeto.name)}><Ban size={14} /> Não combina nesta carta</button>
              </div>
            </>}
            <p className="panel-note">A escolha cruza a carta exata, posição, função, atributos, distribuição final da ficha, habilidades e correções que você já ensinou ao aplicativo.</p>
          </article>

          <article className="luxury-panel wide-card impeto-master-card">
            <div className="section-title-row"><div><p className="kicker">Alternativas seguras</p><h3>Use apenas quando quiser mudar a função</h3></div><span>{recommendedImpetos.filter((item) => item.tier === 'alternativo').length}</span></div>
            <div className="impeto-rank-list">
              {canCraftImpeto && recommendedImpetos.filter((item) => item.tier === 'alternativo').map((item, index) => (
                <div key={`${item.name}-${index}`} className="impeto-row">
                  <strong>{String(index + 2).padStart(2, '0')} • {item.name} <small>{item.score ?? 0}/100</small></strong>
                  <span>{item.attributes.join(' • ')}</span>
                  <em>{item.reason}</em>
                  <div className="correction-actions"><button type="button" onClick={() => onPromoteImpeto?.(item.name)}><ThumbsUp size={14} /> Priorizar</button><button type="button" onClick={() => onRejectImpeto?.(item.name)}><Ban size={14} /> Não combina</button></div>
                </div>
              ))}
              {!canCraftImpeto && <p className="panel-note">Alternativas ocultadas porque a v40.80 não confirmou uma vaga livre para criação.</p>}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Ímpetos a evitar nesta carta</p>
            <div className="skill-grid">
              {recommendedImpetos.filter((item) => item.tier === 'evitar').length ? recommendedImpetos.filter((item) => item.tier === 'evitar').map((item) => (
                <div key={item.name} className="skill-check-card muted"><strong>{item.name} • {item.score ?? 0}/100</strong><span>{item.reason}</span><em>{item.attributes.join(' • ')}</em></div>
              )) : <p className="panel-note">Nenhum ímpeto crítico para evitar nesta função.</p>}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker">Como a IA decidiu</p><h3>Sem serviço de IA pago</h3></div><span>{result.localAi?.engineVersion ?? 'motor local'}</span></div>
            <div className="data-grid"><div><span>Função real</span><strong>{result.teamMap?.functionLabel ?? result.buildName}</strong></div><div><span>Formação</span><strong>Automática • não altera a ficha</strong></div><div><span>Modelo de jogo</span><strong>{TACTICAL_STYLE_NAME[result.tacticalProfile.style]}</strong></div><div><span>Posição escolhida</span><strong>{usagePositionLabel}</strong></div></div>
            {result.localAi && <><ul className="clean-list">{result.localAi.evidence.map((line) => <li key={line}>{line}</li>)}</ul><p className="panel-note">{result.localAi.privacyNote}</p></>}
          </article>
        </div>
      )}


      {tab === 'treinador' && !advancedMode && (
        <div className="result-section-grid bm-simple-tactical-result">
          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker">Como usar o jogador</p><h3>{result.teamMap?.functionLabel ?? result.buildName}</h3></div><span>{usagePositionLabel}</span></div>
            <div className="bm-simple-role-grid">
              <div><strong>Sem a bola</strong><span>{result.teamMap?.defensiveJob ?? 'Mantenha a posição e preserve o setor.'}</span></div>
              <div><strong>Saída de bola</strong><span>{result.teamMap?.buildupJob ?? 'Use passes seguros e ofereça linha de apoio.'}</span></div>
              <div><strong>No ataque</strong><span>{result.teamMap?.attackingJob ?? 'Ataque os espaços adequados à função.'}</span></div>
              <div><strong>Na pressão</strong><span>{result.teamMap?.pressingJob ?? 'Pressione sem abandonar a zona principal.'}</span></div>
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Durante a partida</p>
            <ul className="clean-list">{(result.teamMap?.matchPlan?.length ? result.teamMap.matchPlan : result.usageTips).slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          {(result.teamMap?.riskAlerts?.length ?? 0) > 0 && <article className="luxury-panel wide-card"><p className="kicker">Evite estes erros</p><ul className="clean-list">{result.teamMap?.riskAlerts.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul></article>}
        </div>
      )}

      {tab === 'treinador' && advancedMode && ultimateCoach && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card ultimate-hero-card">
            <div className="section-title-row">
              <div>
                <p className="kicker">Treinador Elite 100+</p>
                <h3>{ultimateCoach.title}</h3>
              </div>
              <span>{activeUpgradeCount} ativos • {partialUpgradeCount} parciais</span>
            </div>
            <p className="panel-note">{ultimateCoach.summary}</p>
            <div className="function-score-grid">
              {ultimateCoach.functionScores.map((item) => (
                <div key={item.role}>
                  <span>{item.role}</span>
                  <strong>{item.score}/100</strong>
                  <i><b style={{ width: `${item.score}%` }} /></i>
                  <em>{item.note}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Execução em campo</p>
            <div className="skill-grid">
              {ultimateCoach.executionPlan.map((item) => (
                <div key={item.title} className={`skill-check-card priority-${item.priority}`}>
                  <strong>{item.title}</strong>
                  <span>{item.details}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Travas anti-erro</p>
            <div className="skill-grid">
              {ultimateCoach.antiErrorLocks.map((item) => (
                <div key={item.title} className="skill-check-card validator-ok">
                  <strong>{item.title}</strong>
                  <span>{item.details}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Foco da evolução</p>
            <div className="skill-grid">
              {ultimateCoach.trainingFocus.map((item) => (
                <div key={item.title} className={`skill-check-card priority-${item.priority}`}>
                  <strong>{item.title}</strong>
                  <span>{item.details}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Planos contra adversários</p>
            <div className="opponent-plan-grid">
              {opponentPlans.map((plan) => (
                <div key={plan.opponent}>
                  <strong>{plan.opponent}</strong>
                  <span><b>Defesa:</b> {plan.defensivePlan}</span>
                  <span><b>Saída:</b> {plan.buildupPlan}</span>
                  <span><b>Ataque:</b> {plan.attackingPlan}</span>
                  <em>{plan.danger}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Notas do treinador</p>
            <ul className="clean-list">
              {ultimateCoach.coachNotes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Checklist 100 melhorias</p>
            <div className="upgrade-checklist-grid">
              {upgradeChecklist.slice(0, 30).map((item) => (
                <div key={`${item.group}-${item.title}`} className={`upgrade-chip status-${item.status}`}>
                  <span>{item.group}</span>
                  <strong>{item.title}</strong>
                  <em>{item.note}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">O pacote completo tem 100 itens organizados por leitura, ficha, habilidades, ímpetos, time, tática, cofre, design e profissionalização. A tela mostra os 30 principais para não poluir o celular.</p>
          </article>
        </div>
      )}





      {tab === 'exportar' && (
        <div className="result-section-grid export-pro-grid">
          <PremiumCleanResultV3810
            variant="export"
            result={result}
            playerImage={playerImage}
            onShare={() => void shareCurrentResult()}
            onExportImage={onExportImage}
          />
          <CompactSharePanel result={result} playerImage={playerImage} onExportImage={() => onExportImage?.()} />
          <article className="luxury-panel wide-card export-hero-card">
            <div className="section-title-row">
              <div>
                <p className="kicker">Exportação profissional</p>
                <h3>Compartilhe ou arquive esta ficha sem perder o visual premium.</h3>
              </div>
              <span>Ficha técnica</span>
            </div>
            <p className="panel-note">Todos os formatos usam a ficha validada, os pontos exatos, as 5 habilidades oficiais, os ímpetos e o plano de uso em campo.</p>
            <div className="export-pro-actions">
              <button type="button" onClick={() => onExportImage?.()}><ImagePlus size={18} /> Exportar imagem da ficha</button>
              <button type="button" onClick={onPrintReport}><Download size={18} /> Gerar PDF profissional</button>
              <button type="button" onClick={onExportReport}><FileText size={18} /> Relatório HTML</button>
              <button type="button" onClick={onExportText}><Copy size={18} /> Relatório técnico</button>
            </div>
          </article>

          <article className="luxury-panel wide-card printable-preview-card">
            <p className="kicker">Prévia do relatório</p>
            <div className="printable-report-preview">
              <div>
                <span>Jogador</span>
                <strong>{card.playerName}</strong>
              </div>
              <div>
                <span>Função real</span>
                <strong>{result.teamMap?.functionLabel ?? result.buildName}</strong>
              </div>
              <div>
                <span>Pontos</span>
                <strong>{result.trainingPointsUsed}/{result.trainingPointsTotal}</strong>
              </div>
              <div>
                <span>Top habilidades</span>
                <strong>{recommendedSkills.slice(0, 3).join(' • ') || '—'}</strong>
              </div>
            </div>
          </article>

          <article className="luxury-panel compact-card">
            <p className="kicker">Imagem SVG</p>
            <h3>Card visual</h3>
            <p className="panel-note">Bom para galeria, WhatsApp, Drive e comparação rápida.</p>
          </article>

          <article className="luxury-panel compact-card">
            <p className="kicker">PDF</p>
            <h3>Relatório de impressão</h3>
            <p className="panel-note">Abre uma tela limpa; no Android/PC escolha “Salvar como PDF”.</p>
          </article>
        </div>
      )}




      {advancedSurfaceActiveR192 && <ResultAdvancedWorkspaceR192
        tab={tab}
        result={result}
        onResetCorrections={onResetCorrections}
        onPromoteImpeto={onPromoteImpeto}
        onRejectImpeto={onRejectImpeto}
        rulesUrl={rulesUrl}
        setRulesUrl={setRulesUrl}
        rulesStatus={rulesStatus}
        rulePackInfo={rulePackInfo}
        onLoadRulesFromUrl={onLoadRulesFromUrl}
        onResetRules={onResetRules}
        onExportRulePack={onExportRulePack}
        onRestoreRulePackVersion={onRestoreRulePackVersion}
      />}

      {pendingSkillAction && <div className="bm-dialog-backdrop r121-skill-dialog-backdrop" role="presentation" onMouseDown={() => setPendingSkillAction(null)}>
        <div className="bm-admin-dialog r121-skill-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="r121-skill-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="bm-dialog-heading">
            <div>
              <p className="kicker"><Sparkles size={14} /> Habilidades adicionais</p>
              <h3 id="r121-skill-confirm-title">{pendingSkillAction.kind === 'owned' ? 'A carta já possui esta habilidade?' : 'Você já adicionou esta habilidade?'}</h3>
            </div>
          </div>
          <div className="bm-dialog-content">
            <div className="r121-skill-dialog-selected"><CheckCircle2 size={20} /><span><small>HABILIDADE</small><strong>{pendingSkillAction.skill}</strong></span></div>
            <p>{pendingSkillAction.kind === 'owned'
              ? 'Confirme somente se esta habilidade já existe na própria carta. O BuildMaster vai removê-la das vagas adicionais e recalcular outra opção oficial compatível.'
              : 'Confirme somente depois de adicionar esta habilidade no eFootball. Ela sairá da lista pendente e aparecerá em “Habilidades adicionadas”.'}</p>
          </div>
          <div className="bm-dialog-actions">
            <button type="button" onClick={() => setPendingSkillAction(null)}>Cancelar</button>
            <button type="button" className="r121-confirm-skill-action" onClick={confirmPendingSkillAction}><CheckCircle2 size={16} /> Confirmar</button>
          </div>
        </div>
      </div>}

      <div className="result-floating-actions result-clean-actions">
        <button className="copy-floating result-primary-action" type="button" onClick={onSaveFicha} disabled={!onSaveFicha || saveBusy} title={!result.validation.canGenerate ? 'Salvar no Cofre como ficha para revisar.' : undefined}>{saveBusy ? <Loader2 className="spin" size={16} /> : <Save size={16} />} {saveBusy ? 'Confirmando...' : result.validation.canGenerate ? 'Salvar' : 'Salvar para revisar'}</button>
        <button className="copy-floating" type="button" onClick={onRecalculate}><RotateCcw size={16} /> Recalcular</button>
        <button className="copy-floating" type="button" onClick={() => void shareCurrentResult()}><Share2 size={16} /> Compartilhar</button>
      </div>
    </section>
  );
}
