'use client';

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
  RotateCcw,
  Save,
  ScanText,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  ThumbsUp,
  Trophy,
  UploadCloud
} from 'lucide-react';
import {
  ATTRIBUTE_INPUTS,
  ATTRIBUTE_PT,
  OFFICIAL_ADDITIONAL_SKILL_NAMES,
  PLAYSTYLE_OPTIONS,
  POSITION_LABELS,
  type AnalysisResult,
  type AttributeKey,
  type PositionCode,
  type TacticalStyle
} from '@/lib/analyzer';
import {
  READING_CONFIRMATION_STAGES,
  buildStageSummary,
  type PremiumZoneReading
} from '@/lib/premiumReading';
import {
  buildCalibrationReport,
  type MatchFeedback,
  type MatchFeedbackKey
} from '@/lib/realMatchCalibration';
import { buildAdvancedCalibration, signatureForResult } from '@/lib/advancedCalibration';
import {
  buildReliabilityCenter,
  compareBuildVariants,
  detectInconsistencies
} from '@/lib/confidenceComparison';
import {
  buildOpponentPlans,
  buildUltimatePlayerCoach,
  getOneHundredUpgradeChecklist
} from '@/lib/ultimateCoach';
import { buildBuildQualityGate, type BuildQualityTarget } from '@/lib/buildQualityGate';
import { APP_RELEASE_VERSION } from '@/lib/appUpdates';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { CALIBRATION_STORAGE_KEY } from '@/modules/matches/calibrationStorage';
import {
  getMergedCorrectionsForResult,
  type DynamicRulePack
} from '@/modules/builds/dynamicRules';
import {
  skillProgressInfo,
  type ManualFields,
  type SavedSkillProgress
} from '@/modules/vault/cardHistoryStore';
import type {
  SingleFieldEvidence,
  SinglePrintSession
} from '@/modules/card-reader/singlePrintPro';
import type { TotalReadingSession } from '@/lib/totalCardReader';
import { BuildQualityGatePanel } from '@/components/BuildQualityGatePanel';
import {
  CommunityIntelligencePanel,
  CompactSharePanel,
  CreatorBuildResearchPanel,
  DecisionWeightPanel,
  EliteEvolutionPanel,
  InvestmentTracePanel,
  MatchValidationCenter,
  MetaBuildLabPanel,
  PrecisionBuildPanel,
  SinglePrintEvidencePanel,
  SkillAndTrainingPanel,
  VerifiedCardRegistryPanel,
  VideoReviewPanel
} from '@/components/lazy/AppLazyPanels';

const playstyleOptions = PLAYSTYLE_OPTIONS;

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

const tacticalStyleName: Record<TacticalStyle, string> = {
  AUTO: 'Automático inteligente',
  POSSE_DE_BOLA: 'Posse de bola',
  CONTRA_ATAQUE: 'Contra-ataque normal',
  CONTRA_ATAQUE_RAPIDO: 'Contra-ataque rápido',
  POR_FORA: 'Por fora',
  PASSE_LONGO: 'Passe longo'
};

export type ResultTab = 'leitura' | 'confianca' | 'comparar' | 'calibracao' | 'partidas' | 'ficha' | 'habilidades' | 'treino' | 'impetos' | 'treinador' | 'mapa' | 'exportar' | 'validacao' | 'correcao' | 'regras' | 'posicoes' | 'dados' | 'resumo' | 'comunidade' | 'fontes';

export type ResultPrimaryView = 'resumo' | 'ficha' | 'habilidades' | 'tatica' | 'exportar';

const RESULT_PRIMARY_TABS: Array<{ id: ResultPrimaryView; label: string; hint: string }> = [
  { id: 'resumo', label: 'Resumo', hint: 'Visão principal' },
  { id: 'ficha', label: 'Ficha', hint: 'Distribuição de pontos' },
  { id: 'habilidades', label: 'Habilidades', hint: 'Top 5 oficial' },
  { id: 'tatica', label: 'Tática', hint: 'Função e uso' },
  { id: 'exportar', label: 'Exportar', hint: 'Imagem e relatório' }
];

const RESULT_ADVANCED_GROUPS: Array<{ label: string; tabs: Array<{ value: ResultTab; label: string }> }> = [
  { label: 'Análise e confiança', tabs: [{ value: 'leitura', label: 'Leitura' }, { value: 'confianca', label: 'Confiança' }, { value: 'validacao', label: 'Validação' }, { value: 'correcao', label: 'Correções' }] },
  { label: 'Desenvolvimento', tabs: [{ value: 'partidas', label: 'Validação real' }, { value: 'treino', label: 'Treino' }, { value: 'impetos', label: 'Ímpetos' }, { value: 'posicoes', label: 'Posições' }] },
  { label: 'Ferramentas técnicas', tabs: [{ value: 'comparar', label: 'Comparar' }, { value: 'calibracao', label: 'Calibração' }, { value: 'dados', label: 'Dados' }, { value: 'regras', label: 'Regras' }, { value: 'comunidade', label: 'Comunidade' }, { value: 'fontes', label: 'Fichas de criadores' }] }
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
    `Posição escolhida: ${result.bestPosition.label}`,
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

function positionPt(code: string) {
  const labels: Record<string, string> = {
    CF: 'CA', SS: 'SA', LWF: 'PE', RWF: 'PD', LMF: 'ME', RMF: 'MD', AMF: 'MAT', CMF: 'MLG', DMF: 'VOL', CB: 'ZAG', LB: 'LE', RB: 'LD', GK: 'GOL'
  };
  return labels[code] ?? code;
}

function attributeNamePt(key: string) {
  return ATTRIBUTE_PT[key as AttributeKey] ?? key;
}

function trainingSummary(plan: Record<string, number>) {
  return Object.entries(plan)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${trainingLabels[key] ?? key} +${value}`)
    .join(' • ');
}


const FEEDBACK_LABELS: Array<{ key: MatchFeedbackKey; label: string }> = [
  { key: 'workedWell', label: 'Jogou bem' }, { key: 'feltSlow', label: 'Ficou lento' },
  { key: 'tiredEarly', label: 'Cansou cedo' }, { key: 'missedPasses', label: 'Errou passes' },
  { key: 'defendedWell', label: 'Defendeu bem' }, { key: 'lackedPhysical', label: 'Faltou físico' },
  { key: 'createdLittle', label: 'Criou pouco' }, { key: 'finishedPoorly', label: 'Finalizou mal' },
  { key: 'outOfPosition', label: 'Ficou fora de posição' }
];

function RealMatchCalibrationPanel({ result }: { result: AnalysisResult }) {
  const storageId = `${result.parsed.internalId}:${result.bestPosition.code}`;
  const [feedbacks, setFeedbacks] = useState<MatchFeedback[]>([]);
  const [draft, setDraft] = useState<MatchFeedback>({ rating: 7, minutes: 90 });
  useEffect(() => {
    try {
      const all = JSON.parse(readAccountStorage(CALIBRATION_STORAGE_KEY) || '{}') as Record<string, MatchFeedback[]>;
      setFeedbacks(Array.isArray(all[storageId]) ? all[storageId] : []);
    } catch { setFeedbacks([]); }
  }, [storageId]);
  const report = useMemo(() => buildCalibrationReport(result, feedbacks), [result, feedbacks]);
  const advanced = useMemo(() => buildAdvancedCalibration(result, feedbacks), [result, feedbacks]);
  function saveFeedback() {
    const item: MatchFeedback = { ...draft, createdAt: new Date().toISOString(), buildSignature: signatureForResult(result), buildLabel: result.buildName, managerId: result.tacticalProfile.managerId, managerName: result.tacticalProfile.managerName, formation: result.tacticalProfile.formation, tacticalStyle: result.tacticalProfile.style, predictedScore: Math.round(result.buildVariants[0]?.qualityScore ?? result.bestPosition.score ?? 0) };
    const next = [item, ...feedbacks].slice(0, 20);
    setFeedbacks(next);
    try {
      const all = JSON.parse(readAccountStorage(CALIBRATION_STORAGE_KEY) || '{}') as Record<string, MatchFeedback[]>;
      all[storageId] = next;
      writeAccountStorage(CALIBRATION_STORAGE_KEY, JSON.stringify(all));
    } catch {}
    setDraft({ rating: 7, minutes: 90 });
  }
  return <div className="result-section-grid">
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">Resultados reais</p><h3>Calibração pós-partida</h3></div><span>{report.sampleCount} jogo(s)</span></div>
      <p className="panel-note">Registre o que você realmente sentiu em campo. O app procura padrões repetidos, mas nunca altera sua ficha sem sua decisão.</p>
      <div className="chip-cloud purple">{FEEDBACK_LABELS.map(({key,label}) => <button type="button" key={key} className={draft[key] ? 'active' : ''} onClick={() => setDraft((current) => ({ ...current, [key]: !current[key] }))}>{draft[key] ? '✓ ' : ''}{label}</button>)}</div>
      <div className="data-grid">
        <label><span>Minutos jogados</span><input inputMode="numeric" value={draft.minutes ?? 90} onChange={(e) => setDraft((current) => ({...current, minutes: Number(e.target.value) || 0}))}/></label>
        <label><span>Nota pessoal (0–10)</span><input inputMode="decimal" value={draft.rating ?? 7} onChange={(e) => setDraft((current) => ({...current, rating: Math.max(0, Math.min(10, Number(e.target.value) || 0))}))}/></label>
      </div>
      <label className="wide-input"><span>Observação opcional</span><textarea value={draft.notes ?? ''} onChange={(e) => setDraft((current) => ({...current, notes: e.target.value}))} placeholder="Ex.: perdeu duelos no segundo tempo, mas passou bem..." /></label>
      <button type="button" className="elite-button" onClick={saveFeedback}><Save size={17}/> Salvar resultado da partida</button>
    </article>
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">Calibração avançada</p><h3>Ficha, técnico, formação e realidade</h3></div><span>Confiança {advanced.prediction.confidence}</span></div>
      <div className="data-grid">
        {[advanced.byBuild, advanced.byManager, advanced.byFormation].map((item) => <div key={item.label} className="skill-check-card"><strong>{item.label}</strong><span>{item.sampleCount} jogo(s) • nota média {item.averageRating || '--'}/10</span><small>Positivos {item.positiveRate}% • problemas {item.issueRate}% • confiança {item.confidence}</small></div>)}
      </div>
      <div className="skill-check-card"><strong>Previsão versus realidade</strong><span>Previsto {advanced.prediction.predicted}/100 • Real {advanced.prediction.actual ?? '--'}/100</span><small>{advanced.prediction.verdict}</small></div>
      <div className="section-title-row"><div><p className="kicker">Preferência pessoal</p><h3>O que seu histórico valoriza</h3></div><span>{advanced.preference.sampleCount} jogo(s)</span></div>
      {advanced.preference.priorities.map((item) => <div key={item.key} className="skill-check-card"><strong>{item.label} • evidência {item.score}</strong><span>{item.reason}</span></div>)}
      {!advanced.preference.priorities.length && <p className="panel-note">{advanced.preference.note}</p>}
      {advanced.preference.avoidances.map((item) => <small key={item}>• {item}</small>)}
    </article>
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">Aprendizado controlado</p><h3>Diagnóstico da ficha</h3></div><span>Confiança {report.confidence}</span></div>
      <p className="panel-note"><b>{report.verdict}</b></p>
      {report.positives.map((item) => <p key={item} className="panel-note">✓ {item}</p>)}
      {report.corrections.map((item) => <div key={item.title} className="skill-check-card"><strong>{item.title} • prioridade {item.priority}</strong><span>{item.reason}</span><small>Treinos relacionados: {item.trainingGroups.join(', ')}</small></div>)}
      {!report.corrections.length && <p className="panel-note">Continue registrando partidas para confirmar tendências e evitar ajustes baseados em uma única impressão.</p>}
      <div className="chip-cloud">{Object.entries(report.learnedWeights).map(([key,value]) => <span key={key}>{key}: +{value}</span>)}</div>
      {report.safeguards.map((item) => <small key={item}>• {item}</small>)}
    </article>
  </div>;
}

export type ResultTabRequest = { tab: ResultTab; token: number };

export function ResultCard({ result, playerImage, skillProgress, onSkillToggle, onSaveFicha, onRecalculate, onExportReport, onPrintReport, onExportImage, onExportText, onRejectSkill, onPromoteSkill, onRejectImpeto, onPromoteImpeto, onResetCorrections, rulesUrl, setRulesUrl, rulesStatus, rulePackInfo, onLoadRulesFromUrl, onResetRules, onExportRulePack, requestedTab, onRequestedTabHandled }: { result: AnalysisResult; playerImage: string | null; skillProgress?: SavedSkillProgress; onSkillToggle?: (skill: string) => void; onSaveFicha?: () => void; onRecalculate?: () => void; onExportReport?: () => void; onPrintReport?: () => void; onExportImage?: () => void; onExportText?: () => void; onRejectSkill?: (skill: string) => void; onPromoteSkill?: (skill: string) => void; onRejectImpeto?: (impeto: string) => void; onPromoteImpeto?: (impeto: string) => void; onResetCorrections?: () => void; rulesUrl: string; setRulesUrl: (value: string) => void; rulesStatus: string; rulePackInfo: DynamicRulePack; onLoadRulesFromUrl: () => void; onResetRules: () => void; onExportRulePack: () => void; requestedTab?: ResultTabRequest | null; onRequestedTabHandled?: () => void }) {
  const [tab, setTab] = useState<ResultTab>('resumo');
  const [heroExpanded, setHeroExpanded] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    if (!requestedTab) return;
    setAdvancedOpen(true);
    setTab(requestedTab.tab);
    onRequestedTabHandled?.();
  }, [requestedTab]);
  const reliabilityCenter = useMemo(() => buildReliabilityCenter(result), [result]);
  const inconsistencyReport = useMemo(() => detectInconsistencies(result), [result]);
  const buildComparison = useMemo(() => compareBuildVariants(result), [result]);
  const card = result.parsed;
  const GER = card.maxOverall ?? card.overall ?? '--';
  const trainingItems = Object.entries(result.training).filter(([, value]) => Number(value) > 0);
  const pointPercent = Math.min(100, Math.round((result.trainingPointsUsed / Math.max(1, result.trainingPointsTotal)) * 100));
  const positionItems = result.positionScores.slice(0, 8);
  const cardPositions = Array.from(new Set([card.mainPosition, ...card.positions])).slice(0, 10);
  const nativeSkills = card.nativeSkills.slice(0, 8);
  const skillRecommendations = result.skillRecommendations ?? result.recommendedSkills.map((skill) => ({ name: skill, tier: 'alternativa' as const, reason: skillReason(skill) }));
  const recommendedSkills = result.recommendedSkills.slice(0, 5);
  const avoidSkillItems = skillRecommendations.filter((item) => item.tier === 'evitar').slice(0, 5);
  const alternativeSkillItems = skillRecommendations.filter((item) => item.tier === 'alternativa' && !recommendedSkills.includes(item.name)).slice(0, 6);
  const duplicateRecommendedSkills = recommendedSkills.filter((skill) => card.nativeSkills.some((owned) => owned.toLowerCase() === skill.toLowerCase()));
  const finalValidatorItems = [
    { label: 'Pontos dentro do limite', ok: result.trainingPointsUsed <= result.trainingPointsTotal, note: `${result.trainingPointsUsed}/${result.trainingPointsTotal} pontos` },
    { label: 'Top 5 sem repetição', ok: duplicateRecommendedSkills.length === 0, note: duplicateRecommendedSkills.length ? `Revisar: ${duplicateRecommendedSkills.join(', ')}` : 'habilidades já existentes foram filtradas' },
    { label: 'Lista oficial de habilidades', ok: recommendedSkills.length > 0, note: recommendedSkills.length ? 'recomendações travadas na lista local oficial' : 'nenhuma habilidade segura encontrada' },
    { label: 'Ímpetos separados das habilidades', ok: result.recommendedImpetos.length > 0, note: 'ímpeto não é tratado como habilidade adicional' },
    { label: 'Função real detectada', ok: Boolean(result.teamMap?.functionLabel), note: result.teamMap?.functionLabel ?? result.buildName },
    { label: 'Conferência/OCR', ok: result.validation?.level !== 'blocked', note: result.validation?.level === 'blocked' ? 'precisa revisar dados antes de usar' : 'análise liberada' }
  ];
  const skillInfo = skillProgressInfo(recommendedSkills, skillProgress);
  const recommendedImpetos = result.recommendedImpetos.slice(0, 8);
  const positionRatings = Object.entries(card.positionRatings).filter(([, value]) => Number.isFinite(value));
  const attributes = Object.entries(card.attributes).filter(([, value]) => Number.isFinite(value));
  const sourceLabel = card.trainingPointSource === 'MANUAL'
    ? 'Orçamento manual confirmado'
    : card.trainingPointSource === 'TRAINING_READ'
      ? 'Plano automático somado'
    : card.trainingPointSource === 'LEVEL_INFERRED'
      ? 'Calculado pelo nível'
      : card.trainingPointSource === 'OCR'
        ? 'Informado no registro técnico'
        : 'Padrão seguro';
  const ultimateCoach = useMemo(() => buildUltimatePlayerCoach(result), [result]);
  const opponentPlans = useMemo(() => buildOpponentPlans(result.tacticalProfile.formation, result.tacticalProfile.style), [result]);
  const upgradeChecklist = useMemo(() => getOneHundredUpgradeChecklist(), []);
  const activeUpgradeCount = upgradeChecklist.filter((item) => item.status === 'ativo').length;
  const partialUpgradeCount = upgradeChecklist.filter((item) => item.status === 'parcial').length;
  const localCorrections = useMemo(() => getMergedCorrectionsForResult(result), [result]);
  const buildQualityGate = useMemo(() => buildBuildQualityGate(result), [result]);
  const hasLocalCorrections = Boolean(localCorrections.blockedSkills.length || localCorrections.promotedSkills.length || localCorrections.blockedImpetos.length || localCorrections.promotedImpetos.length);
  const pointsAvailable = Math.max(0, result.trainingPointsTotal - result.trainingPointsUsed);
  const advancedTabs = RESULT_ADVANCED_GROUPS.flatMap((group) => group.tabs.map((item) => item.value));
  const advancedSelected = advancedTabs.includes(tab);

  function openPrimaryResult(view: ResultPrimaryView) {
    setAdvancedOpen(false);
    if (view === 'tatica') setTab('treinador');
    else setTab(view);
  }

  function primaryIsActive(view: ResultPrimaryView) {
    if (view === 'tatica') return tab === 'treinador' || tab === 'mapa';
    return tab === view;
  }

  function openQualityTarget(target: BuildQualityTarget) {
    const isAdvanced = !['resumo', 'ficha', 'habilidades', 'treinador'].includes(target);
    setAdvancedOpen(isAdvanced);
    setTab(target);
  }

  async function shareCurrentResult() {
    const text = [
      `${card.playerName} • ${result.bestPosition.label}`,
      `Estilo: ${card.playstyle ?? 'não informado'}`,
      `Pontos: ${result.trainingPointsUsed}/${result.trainingPointsTotal}`,
      `Habilidades: ${recommendedSkills.join(', ') || 'sem recomendação segura'}`
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
      <section className={`result-player-hero luxury-panel ${heroExpanded ? 'is-expanded' : ''}`}>
        <figure className="result-player-art">
          {playerImage ? <img src={playerImage} alt={`Imagem de ${card.playerName}`} /> : <div className="result-player-art-empty"><Trophy size={42} /><span>Sem imagem da carta</span></div>}
          <div className="result-player-art-overlay" />
          <div className="result-player-rating"><strong>{GER}</strong><span>{card.mainPositionPt}</span></div>
          <figcaption>{card.playstyle ?? 'BuildMaster Elite'}</figcaption>
        </figure>

        <div className="result-player-summary">
          <div className="result-player-heading">
            <div>
              <p className="kicker"><Sparkles size={14} /> Resultado validado</p>
              <h2>{card.playerName}</h2>
              <div className="result-identity-line">
                <span className="result-position-badge">{result.bestPosition.label}</span>
                <span>{card.playstyle ?? 'Estilo não informado'}</span>
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
            <article><span>Confiança</span><strong>{card.confidence}%</strong><small>{result.validation?.level === 'blocked' ? 'revisão necessária' : 'análise liberada'}</small></article>
            <article><span>Qualidade</span><strong>{Math.round(result.buildVariants[0]?.qualityScore ?? result.bestPosition.score ?? 0)}</strong><small>de 100</small></article>
          </div>

          <div className="result-budget-line">
            <div><span>Uso do orçamento</span><strong>{pointPercent}%</strong></div>
            <i><b style={{ width: `${pointPercent}%` }} /></i>
          </div>

          <div className="result-hero-actions">
            <button className="result-action-primary" type="button" onClick={onSaveFicha}><Save size={17} /> Salvar ficha</button>
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
          <div><p className="kicker">Resultado completo</p><strong>O essencial primeiro; detalhes técnicos ficam separados.</strong></div>
          <span>{result.trainingPointsUsed}/{result.trainingPointsTotal} pts</span>
        </div>

        <nav className="result-primary-tabs" aria-label="Áreas principais do resultado">
          {RESULT_PRIMARY_TABS.map((item) => {
            const Icon = item.id === 'resumo' ? LayoutDashboard : item.id === 'ficha' ? Trophy : item.id === 'habilidades' ? Sparkles : item.id === 'tatica' ? Target : Download;
            return (
              <button key={item.id} className={primaryIsActive(item.id) ? 'active' : ''} type="button" onClick={() => openPrimaryResult(item.id)}>
                <Icon size={18} /><span><strong>{item.label}</strong><small>{item.hint}</small></span>
              </button>
            );
          })}
        </nav>

        {(tab === 'treinador' || tab === 'mapa') && (
          <nav className="result-context-tabs" aria-label="Áreas da tática">
            <button type="button" className={tab === 'treinador' ? 'active' : ''} onClick={() => setTab('treinador')}>Visão tática</button>
            <button type="button" className={tab === 'mapa' ? 'active' : ''} onClick={() => setTab('mapa')}>Mapa e posição</button>
          </nav>
        )}

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
      </section>

      {tab === 'leitura' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Análise profunda do print</p><h3>Separação entre leitura, inferência e recomendação</h3></div>
              <span>Confiança {result.deepAnalysis.confidenceLevel}</span>
            </div>
            <div className="data-grid">
              <div><span>Identidade original</span><strong>{result.deepAnalysis.originalIdentity}</strong></div>
              <div><span>Função recomendada</span><strong>{result.deepAnalysis.recommendedFunction}</strong></div>
              <div><span>Campos incertos</span><strong>{result.deepAnalysis.uncertainFields.length || 'Nenhum crítico'}</strong></div>
              <div><span>Confiança numérica</span><strong>{card.confidence}%</strong></div>
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Auditoria campo por campo</p>
            <div className="position-list">
              {result.deepAnalysis.readingItems.map((item) => (
                <div key={item.field}>
                  <strong>{item.field}: {item.value}</strong>
                  <span>{item.source} • confiança {item.confidence}</span>
                  <em>{item.note}</em>
                </div>
              ))}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Travas anti-invenção</p>
            <ul className="clean-list">{result.deepAnalysis.safeguards.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Por que os pontos foram usados assim</p>
            <ul className="clean-list">{result.deepAnalysis.pointRationale.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <VerifiedCardRegistryPanel result={result} />
        </div>
      )}

      {tab === 'confianca' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker">Central de confiabilidade</p><h3>O que sustenta esta ficha</h3></div><span>{reliabilityCenter.score}/100 • {reliabilityCenter.level}</span></div>
            <div className="data-grid">
              <div><span>Confirmados</span><strong>{reliabilityCenter.confirmed}</strong></div>
              <div><span>Inferidos</span><strong>{reliabilityCenter.inferred}</strong></div>
              <div><span>Pendentes</span><strong>{reliabilityCenter.unresolved}</strong></div>
              <div><span>Integridade</span><strong>{inconsistencyReport.score}/100</strong></div>
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Origem e impacto dos dados</p>
            <div className="position-list">{reliabilityCenter.items.map((item) => <div key={`${item.field}-${item.value}`}><strong>{item.field}: {item.value}</strong><span>{item.source} • {item.confidence}% • impacto {item.impact}</span><em>{item.note}</em></div>)}</div>
          </article>
          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker">Detector de incoerências</p><h3>{inconsistencyReport.status === 'aprovado' ? 'Nenhum erro crítico encontrado' : 'Itens que precisam de revisão'}</h3></div><span>{inconsistencyReport.canGenerate ? 'Pode gerar' : 'Bloqueado'}</span></div>
            {inconsistencyReport.issues.length ? <div className="position-list">{inconsistencyReport.issues.map((issue) => <div key={issue.code}><strong>{issue.severity.toUpperCase()} • {issue.title}</strong><span>{issue.detail}</span><em>{issue.correction}</em></div>)}</div> : <p>A posição escolhida, o orçamento, os atributos e os nomes oficiais passaram nas verificações.</p>}
          </article>
          {reliabilityCenter.alerts.length > 0 && <article className="luxury-panel wide-card"><p className="kicker">Atenção antes de finalizar</p><ul className="clean-list">{reliabilityCenter.alerts.map((x) => <li key={x}>{x}</li>)}</ul></article>}
        </div>
      )}

      {tab === 'comparar' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker">Comparador de fichas</p><h3>{buildComparison.winner}</h3></div><span>{result.buildVariants.length} opções</span></div>
            <p>{buildComparison.reason}</p>
          </article>
          <article className="luxury-panel wide-card comparison-table-card">
            <div className="comparison-table">
              <div className="comparison-row comparison-head"><strong>Critério</strong>{buildComparison.variants.map((v) => <b key={v.title}>{v.title}</b>)}</div>
              {buildComparison.rows.map((row) => <div className="comparison-row" key={row.key}><strong>{row.label}</strong>{row.values.map((cell) => <span className={cell.best ? 'comparison-best' : ''} key={`${row.key}-${cell.title}`}>{cell.value}</span>)}</div>)}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Riscos de cada opção</p>
            <div className="position-list">{buildComparison.variants.map((v) => <div key={v.title}><strong>{v.title} • {v.points} pts</strong><span>Qualidade {v.score} • eficiência {v.efficiency} • equilíbrio {v.balance}</span><em>{v.risks.length ? v.risks.join(' • ') : 'Sem risco crítico identificado.'}</em></div>)}</div>
          </article>
        </div>
      )}

      {tab === 'partidas' && <MatchValidationCenter result={result} />}

      {tab === 'resumo' && (
        <div className="result-section-grid">
          <BuildQualityGatePanel report={buildQualityGate} onOpenTarget={openQualityTarget} />
          <article className="luxury-panel elite-build-card">
            <p className="kicker">Plano Elite recomendado</p>
            <div className="section-title-row">
              <h3>{result.buildName}</h3>
              <span>Elite</span>
            </div>
            <div className="stat-bars five-cols">
              {[
                ['Finalização', result.pri.finishing],
                ['Drible', result.pri.dribbling],
                ['Passe', result.pri.creation],
                ['Força', result.pri.physical],
                ['Velocidade', result.pri.mobility]
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <i><b style={{ width: `${Math.min(100, Number(value))}%` }} /></i>
                </div>
              ))}
            </div>
          </article>

          <DecisionWeightPanel result={result} />
          <InvestmentTracePanel result={result} />

          <article className="luxury-panel wide-card">
            <p className="kicker">Mapa de desempenho no time</p>
            <div className="section-title-row">
              <h3>{result.teamMap?.functionLabel ?? result.buildName}</h3>
              <span>{result.teamMap?.coachFit ?? 'Função ajustada ao time'}</span>
            </div>
            <div className="stat-bars five-cols">
              {[
                ['Marcação', result.teamMap?.sectorScores?.marcacao],
                ['Saída', result.teamMap?.sectorScores?.saidaDeBola],
                ['Passe', result.teamMap?.sectorScores?.passe],
                ['Criação', result.teamMap?.sectorScores?.criacao],
                ['Ataque', result.teamMap?.sectorScores?.finalizacao]
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <span>{label}</span>
                  <strong>{value ?? '-'}</strong>
                  <i><b style={{ width: `${Math.min(100, Number(value ?? 0))}%` }} /></i>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel compact-card">
            <p className="kicker">Habilidades adicionais</p>
            <div className="chip-cloud purple">
              {recommendedSkills.length ? recommendedSkills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>) : <span>Nenhuma recomendação segura</span>}
            </div>
            <p className="panel-note">Exclui habilidades já presentes na carta.</p>
          </article>

          <article className="luxury-panel compact-card">
            <p className="kicker">Pontos detectados</p>
            <strong className="big-number">{result.trainingPointsUsed}/{result.trainingPointsTotal}</strong>
            <div className="mini-meter"><i style={{ width: `${pointPercent}%` }} /></div>
            <p className="panel-note">{sourceLabel}</p>
          </article>

          <article className="luxury-panel compact-card">
            <p className="kicker">Ímpeto ideal</p>
            <div className="chip-cloud purple">
              {recommendedImpetos.filter((item) => item.tier !== 'evitar').slice(0, 3).map((item) => <span key={item.name}>{item.name}</span>)}
            </div>
            <p className="panel-note">Escolhido por posição + estilo + função real.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Como jogar</p>
            <ul className="clean-list">
              {result.usageTips.slice(0, 4).map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Por que esta recomendação?</p>
            <ul className="clean-list">
              {result.recommendationExplanation.slice(0, 5).map((line) => <li key={line}>{line}</li>)}
            </ul>
          </article>
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
              <span>{result.bestPosition.label}</span>
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
              <article><strong>{result.maxPrecision.meta2026.playerMetaFit}</strong><span>Meta 2026</span></article>
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
              <summary>Meta atual do eFootball 2026 — v5.5.0</summary>
              <p className="panel-note"><b>{result.maxPrecision.meta2026.classification}</b> • atualização {result.maxPrecision.meta2026.updatedAt} • encaixe {result.maxPrecision.meta2026.fitLabel}</p>
              <div className="skill-grid"><div className="skill-check-card"><strong>Mecânicas oficiais consideradas</strong>{result.maxPrecision.meta2026.officialMechanics.map((item)=><span key={item}>✓ {item}</span>)}</div><div className="skill-check-card"><strong>Tendências competitivas</strong>{result.maxPrecision.meta2026.competitiveTrends.map((item)=><span key={item.name}>{item.name} • confiança {item.confidence}: {item.note}</span>)}</div></div>
              <div className="skill-grid"><div className="skill-check-card"><strong>Pontos fortes no meta</strong>{result.maxPrecision.meta2026.strongestMetaTraits.map((item)=><span key={item}>↑ {item}</span>)}</div><div className="skill-check-card muted"><strong>O que ainda falta</strong>{result.maxPrecision.meta2026.missingMetaTraits.map((item)=><span key={item}>⚠ {item}</span>)}</div></div>
              <p className="panel-note">{result.maxPrecision.meta2026.recommendedMetaUse}</p><p className="panel-note">{result.maxPrecision.meta2026.disclaimer}</p>
            </details>
            {result.maxPrecision.explanation.map((item)=><p key={item} className="panel-note">• {item}</p>)}
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
            <div className="training-ribbon">
              {trainingItems.map(([key, value]) => (
                <div key={key}>
                  <span>{trainingLabels[key] ?? key}</span>
                  <strong>{value}</strong>
                  <i><b style={{ width: `${Math.min(100, Number(value) * 7)}%` }} /></i>
                </div>
              ))}
            </div>
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
              <div><span>Perna dominante</span><strong>{result.physicalEngine.dominantFoot ?? 'Não confirmada'}</strong></div>
            </div>
            <div className="chip-cloud">{result.physicalEngine.advantages.map((item) => <span key={item}>✓ {item}</span>)}</div>
            {result.physicalEngine.limitations.map((item) => <p key={item} className="panel-note">⚠ {item}</p>)}
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Metas de atributos</p><h3>Faixas necessárias para {result.bestPosition.label}</h3></div>
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


      {tab === 'comunidade' && <CommunityIntelligencePanel result={result} />}

      {tab === 'fontes' && <CreatorBuildResearchPanel result={result} />}

      {tab === 'calibracao' && <RealMatchCalibrationPanel result={result} />}

      {tab === 'treino' && <div className="result-section-grid"><SkillAndTrainingPanel result={result} /><VideoReviewPanel result={result} /></div>}

      {tab === 'habilidades' && (
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
                    <button type="button" onClick={() => onSkillToggle?.(skill)}>
                      {completed ? '✓ Concluída' : 'Marcar como feita'}
                    </button>
                    <div className="correction-actions">
                      <button type="button" onClick={() => onPromoteSkill?.(skill)}><ThumbsUp size={14} /> Priorizar</button>
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
        <div className="result-section-grid impeto-focus-grid">
          <article className="luxury-panel wide-card impeto-master-card">
            <div className="section-title-row">
              <div>
                <p className="kicker">Ímpetos principais</p>
                <h3>Prioridade para máximo desempenho</h3>
              </div>
              <span>{recommendedImpetos.filter((item) => item.tier !== 'evitar').length} opções</span>
            </div>
            <div className="impeto-rank-list">
              {recommendedImpetos.filter((item) => item.tier !== 'evitar').slice(0, 6).map((item, index) => (
                <div key={`${item.name}-${index}`} className={item.tier === 'ideal' ? 'impeto-row ideal' : 'impeto-row'}>
                  <strong>{String(index + 1).padStart(2, '0')} • {item.name}</strong>
                  <span>{item.attributes.join(' • ')}</span>
                  <em>{item.reason}</em>
                  <div className="correction-actions">
                    <button type="button" onClick={() => onPromoteImpeto?.(item.name)}><ThumbsUp size={14} /> Priorizar</button>
                    <button type="button" onClick={() => onRejectImpeto?.(item.name)}><Ban size={14} /> Não combina</button>
                  </div>
                </div>
              ))}
            </div>
            <p className="panel-note">Os ímpetos são calculados separados das habilidades adicionais, usando posição, estilo de jogo, função real, formação e modelo de jogo.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Ímpetos a evitar</p>
            <div className="skill-grid">
              {recommendedImpetos.filter((item) => item.tier === 'evitar').length ? recommendedImpetos.filter((item) => item.tier === 'evitar').slice(0, 6).map((item) => (
                <div key={item.name} className="skill-check-card muted">
                  <strong>{item.name}</strong>
                  <span>{item.reason}</span>
                  <em>{item.attributes.join(' • ')}</em>
                </div>
              )) : <p className="panel-note">Nenhum ímpeto crítico para evitar nesta função.</p>}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Resumo de encaixe</p>
            <div className="data-grid">
              <div><span>Função real</span><strong>{result.teamMap?.functionLabel ?? result.buildName}</strong></div>
              <div><span>Formação</span><strong>{result.tacticalProfile.formation}</strong></div>
              <div><span>Modelo de jogo</span><strong>{tacticalStyleName[result.tacticalProfile.style]}</strong></div>
              <div><span>Posição escolhida</span><strong>{result.bestPosition.label}</strong></div>
            </div>
          </article>
        </div>
      )}


      {tab === 'treinador' && (
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


      {tab === 'correcao' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card correction-hero-card">
            <div className="section-title-row">
              <div>
                <p className="kicker"><BrainCircuit size={14} /> Regras atualizáveis</p>
                <h3>O app aprende quando você diz que uma habilidade ou ímpeto não combina.</h3>
              </div>
              <span>{hasLocalCorrections ? 'Ativo' : 'Sem correções'}</span>
            </div>
            <p className="panel-note">As correções ficam salvas somente neste aparelho/navegador. Quando você marcar “Não combina” ou “Priorizar”, o BuildMaster evita repetir o erro para este jogador e para a função real parecida.</p>
            <div className="correction-summary-grid">
              <div><span>Habilidades bloqueadas</span><strong>{localCorrections.blockedSkills.length}</strong></div>
              <div><span>Habilidades priorizadas</span><strong>{localCorrections.promotedSkills.length}</strong></div>
              <div><span>Ímpetos bloqueados</span><strong>{localCorrections.blockedImpetos.length}</strong></div>
              <div><span>Ímpetos priorizados</span><strong>{localCorrections.promotedImpetos.length}</strong></div>
            </div>
            <button type="button" className="secondary-action" onClick={onResetCorrections} disabled={!hasLocalCorrections}><RotateCcw size={16} /> Limpar correções deste jogador/função</button>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Regras locais aplicadas</p>
            <div className="skill-grid">
              <div className="skill-check-card muted"><strong>Evitar habilidades</strong><span>{localCorrections.blockedSkills.length ? localCorrections.blockedSkills.join(' • ') : 'Nenhuma habilidade bloqueada.'}</span></div>
              <div className="skill-check-card"><strong>Priorizar habilidades</strong><span>{localCorrections.promotedSkills.length ? localCorrections.promotedSkills.join(' • ') : 'Nenhuma habilidade priorizada.'}</span></div>
              <div className="skill-check-card muted"><strong>Evitar ímpetos</strong><span>{localCorrections.blockedImpetos.length ? localCorrections.blockedImpetos.join(' • ') : 'Nenhum ímpeto bloqueado.'}</span></div>
              <div className="skill-check-card"><strong>Priorizar ímpetos</strong><span>{localCorrections.promotedImpetos.length ? localCorrections.promotedImpetos.join(' • ') : 'Nenhum ímpeto priorizado.'}</span></div>
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Como usar</p>
            <ul className="clean-list">
              <li>Na aba Habilidades, toque em <b>Não combina</b> quando o app recomendar algo errado para a função.</li>
              <li>Toque em <b>Priorizar</b> quando uma alternativa fizer mais sentido para seu estilo de jogo.</li>
              <li>Na área de ímpetos, bloqueie um ímpeto incompatível para o app ajustar a próxima ficha.</li>
              <li>Isso não usa IA paga; é memória local do seu próprio app.</li>
            </ul>
          </article>
        </div>
      )}


      {tab === 'regras' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card correction-hero-card">
            <div className="section-title-row">
              <div>
                <p className="kicker"><BrainCircuit size={14} /> Regras atualizáveis sem refazer APK</p>
                <h3>Atualize habilidade, ímpeto e bloqueios por função usando um JSON online.</h3>
              </div>
              <span>Ficha técnica</span>
            </div>
            <p className="panel-note">Essa área permite ajustar recomendações depois que o APK já estiver instalado. Você hospeda um arquivo JSON público, cola a URL e toca em atualizar. O app salva o pacote no aparelho e aplica nas próximas fichas.</p>
            <div className="input-row">
              <label>
                URL do pacote de regras
                <input value={rulesUrl} onChange={(event) => setRulesUrl(event.target.value)} placeholder="https://seusite.com/buildmaster-regras.json" />
              </label>
            </div>
            <div className="export-pro-actions">
              <button type="button" onClick={onLoadRulesFromUrl}><UploadCloud size={18} /> Atualizar regras</button>
              <button type="button" onClick={onResetRules}><RotateCcw size={18} /> Restaurar pacote local</button>
              <button type="button" onClick={onExportRulePack}><Download size={18} /> Exportar modelo JSON</button>
            </div>
            <p className="panel-note">{rulesStatus}</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Pacote ativo</p>
            <div className="correction-summary-grid">
              <div><span>Versão</span><strong>{rulePackInfo.version}</strong></div>
              <div><span>Regras</span><strong>{rulePackInfo.rules.length}</strong></div>
              <div><span>Fonte</span><strong>{rulePackInfo.source}</strong></div>
              <div><span>Atualizado</span><strong>{new Date(rulePackInfo.updatedAt).toLocaleDateString('pt-BR')}</strong></div>
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Regras ativas principais</p>
            <div className="upgrade-checklist-grid">
              {rulePackInfo.rules.slice(0, 12).map((rule) => (
                <div key={rule.id} className="upgrade-chip status-ativo">
                  <span>{rule.id}</span>
                  <strong>{rule.title}</strong>
                  <em>{rule.note ?? 'Regra dinâmica aplicada quando posição/estilo/função combinarem.'}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">Use isso para corrigir rapidamente casos como CA recebendo habilidade defensiva, goleiro recebendo habilidade de linha, VOL orquestrador recebendo ficha de destruidor puro ou lateral ofensivo sem prioridade de corredor.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Formato do JSON</p>
            <pre className="raw-text-box">{`{
  "version": "minhas-regras-1",
  "updatedAt": "2026-07-12T00:00:00.000Z",
  "source": "Meu pacote online",
  "rules": [
    {
      "id": "ca-finalizador",
      "title": "CA finalizador",
      "match": { "position": "CF", "playstyleIncludes": ["artilheiro"] },
      "promoteSkills": ["Chute de primeira", "Precisão à distância"],
      "blockSkills": ["Volta para marcar", "Interceptação"],
      "promoteImpetos": ["Chute", "Instinto artilheiro"],
      "note": "Foco total em finalização."
    }
  ]
}`}</pre>
          </article>
        </div>
      )}

      {tab === 'validacao' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <p className="kicker">Validador final de precisão</p>
            <div className="squad-leader-grid">
              {finalValidatorItems.map((item) => (
                <div key={item.label} className={item.ok ? 'squad-leader-item validator-ok' : 'squad-leader-item validator-bad'}>
                  <span>{item.ok ? '✓ Aprovado' : '⚠ Revisar'}</span>
                  <strong>{item.label}</strong>
                  <em>{item.note}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">Esta etapa bloqueia os erros mais comuns: pontos acima do orçamento, habilidade inexistente, habilidade repetida e ímpeto usado como habilidade.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Habilidades por prioridade</p>
            <div className="skill-grid">
              <div className="skill-check-card">
                <strong>Essenciais</strong>
                <span>{recommendedSkills.length ? recommendedSkills.join(' • ') : 'Nenhuma essencial segura encontrada'}</span>
              </div>
              <div className="skill-check-card">
                <strong>Boas alternativas</strong>
                <span>{alternativeSkillItems.length ? alternativeSkillItems.map((item) => item.name).join(' • ') : 'Sem alternativa extra após o Top 5'}</span>
              </div>
              <div className="skill-check-card muted">
                <strong>Evitar</strong>
                <span>{avoidSkillItems.length ? avoidSkillItems.map((item) => item.name).join(' • ') : 'Nenhuma restrição crítica'}</span>
              </div>
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Checklist da ficha</p>
            <ul className="clean-list">
              <li>Ficha usa custo progressivo real e respeita o orçamento manual quando você digita pontos.</li>
              <li>Top 5 habilidades considera posição, estilo de jogo, função real, atributos e habilidades que o jogador já possui.</li>
              <li>Ímpetos são ranqueados por função e aparecem separados das habilidades adicionais.</li>
              <li>Goleiro usa motor separado com Pegador de pênalti, Arremesso longo do goleiro e reposições oficiais.</li>
            </ul>
          </article>
        </div>
      )}

      {tab === 'exportar' && (
        <div className="result-section-grid export-pro-grid">
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
              <button type="button" onClick={onExportImage}><ImagePlus size={18} /> Exportar imagem da ficha</button>
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

      {tab === 'posicoes' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <p className="kicker">Identidade da carta</p>
            <div className="position-list">
              {cardPositions.map((code, index) => (
                <div key={code}>
                  <strong>{positionPt(code)}</strong>
                  <span>{index === 0 ? 'Posição da carta' : 'Compatível'}</span>
                  <em>{code === card.mainPosition ? `Preservada na carta • ${card.playstyle ?? 'estilo não lido'}` : `Registrada no painel${card.positionRatings[code] ? ` • ${card.positionRatings[code]}` : ''}`}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">Esta seção não é ranking: ela mostra a posição/estilo originais da carta e as posições compatíveis lidas.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Ranking de rendimento real</p>
            <div className="position-list">
              {positionItems.map((item, index) => (
                <div key={item.code}>
                  <strong>{item.label}</strong>
                  <span>{index === 0 ? 'Melhor uso' : item.score >= 90 ? 'Ótima' : item.score >= 82 ? 'Boa' : 'Alternativa'}</span>
                  <em>{item.role}{item.cardRating ? ` • ${item.cardRating}` : ''}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">Aqui sim o app pode recomendar outra posição, mas sem alterar a identidade original da carta.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">GERs lidos</p>
            <div className="data-grid">
              {positionRatings.length ? positionRatings.map(([code, value]) => (
                <div key={code}><span>{positionPt(code)}</span><strong>{value}</strong></div>
              )) : <p className="panel-note">Nenhum GER por posição lido com segurança.</p>}
            </div>
          </article>
        </div>
      )}

      {tab === 'dados' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <p className="kicker">Dados técnicos lidos</p>
            <div className="data-grid">
              <div><span>Posição da carta</span><strong>{card.mainPositionPt}</strong></div>
              <div><span>Estilo de jogo</span><strong>{card.playstyle ?? '—'}</strong></div>
              <div><span>Posição escolhida</span><strong>{result.bestPosition.label}</strong></div>
              <div><span>Nível máximo</span><strong>{card.level ?? '—'}</strong></div>
              <div><span>Total de pontos</span><strong>{result.trainingPointsUsed}/{result.trainingPointsTotal}</strong></div>
              <div><span>Origem dos pontos</span><strong>{sourceLabel}</strong></div>
              <div><span>Altura</span><strong>{card.height ? `${card.height} cm` : '—'}</strong></div>
              <div><span>Peso</span><strong>{card.weight ? `${card.weight} kg` : '—'}</strong></div>
              <div><span>Idade</span><strong>{card.age ?? '—'}</strong></div>
              <div><span>Entrada</span><strong>Manual de precisão</strong></div>
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Melhores ímpetos e alertas</p>
            <div className="skill-grid">
              {recommendedImpetos.length ? recommendedImpetos.map((item) => (
                <div key={`${item.name}-${item.tier}`}>
                  <strong>{item.tier === 'ideal' ? 'Ideal' : item.tier === 'alternativo' ? 'Alternativo' : 'Evitar'} • {item.name}</strong>
                  <span>{item.attributes.join(', ')} — {item.reason}</span>
                  <div className="correction-actions">
                    <button type="button" onClick={() => onPromoteImpeto?.(item.name)}><ThumbsUp size={14} /> Priorizar</button>
                    <button type="button" onClick={() => onRejectImpeto?.(item.name)}><Ban size={14} /> Não combina</button>
                  </div>
                </div>
              )) : <p className="panel-note">Nenhum ímpeto recomendado com segurança.</p>}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Ímpetos lidos</p>
            <div className="chip-cloud purple">
              {card.impetos.length ? card.impetos.map((item) => (
                <span key={`${item.name}-${item.value ?? ''}`}>{item.name}{item.value ? ` +${item.value}` : ''}{item.active === false ? ' — inativo' : ''}</span>
              )) : <span>Nenhum ímpeto lido</span>}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Atributos</p>
            <div className="data-grid attributes-grid">
              {attributes.length ? attributes.map(([key, value]) => (
                <div key={key}><span>{attributeNamePt(key)}</span><strong>{value}</strong></div>
              )) : <p className="panel-note">Nenhum atributo lido com segurança.</p>}
            </div>
          </article>
        </div>
      )}

      <div className="result-floating-actions result-clean-actions">
        <button className="copy-floating result-primary-action" type="button" onClick={onSaveFicha}><Save size={16} /> Salvar</button>
        <button className="copy-floating" type="button" onClick={onRecalculate}><RotateCcw size={16} /> Recalcular</button>
        <button className="copy-floating" type="button" onClick={() => void shareCurrentResult()}><Share2 size={16} /> Compartilhar</button>
      </div>
    </section>
  );
}

export function ReviewPanel({
  draft,
  playerImage,
  originalPreview,
  manualFields,
  setManualFields,
  cardPositionOverride,
  setCardPositionOverride,
  playstyleOverride,
  setPlaystyleOverride,
  targetPosition,
  setTargetPosition,
  premiumReadings,
  totalReadingSession,
  singlePrintSession,
  onUseSingleCandidate,
  readingConfirmations,
  setReadingConfirmations,
  onRefresh,
  onConfirm
}: {
  draft: AnalysisResult;
  playerImage: string | null;
  originalPreview: string | null;
  manualFields: ManualFields;
  setManualFields: (updater: ManualFields | ((current: ManualFields) => ManualFields)) => void;
  cardPositionOverride: PositionCode | 'AUTO';
  setCardPositionOverride: (value: PositionCode | 'AUTO') => void;
  playstyleOverride: string;
  setPlaystyleOverride: (value: string) => void;
  targetPosition: PositionCode | 'AUTO';
  setTargetPosition: (value: PositionCode | 'AUTO') => void;
  premiumReadings: PremiumZoneReading[];
  totalReadingSession: TotalReadingSession | null;
  singlePrintSession: SinglePrintSession | null;
  onUseSingleCandidate: (field: SingleFieldEvidence['key'], value: string) => void;
  readingConfirmations: Record<string, boolean>;
  setReadingConfirmations: (value: Record<string, boolean> | ((current: Record<string, boolean>) => Record<string, boolean>)) => void;
  onRefresh: () => void;
  onConfirm: () => void;
}) {
  const card = draft.parsed;
  const criticalIssues = draft.validation.issues.filter((issue) => issue.severity === 'block');
  const reviewIssues = draft.validation.issues.filter((issue) => issue.severity === 'review');
  const updateAttribute = (key: AttributeKey, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 3);
    setManualFields((current) => ({
      ...current,
      attributes: { ...current.attributes, [key]: cleaned }
    }));
  };

  const toggleNativeSkill = (skill: string) => {
    setManualFields((current) => {
      const selected = new Set(current.nativeSkills ?? []);
      if (selected.has(skill)) selected.delete(skill);
      else selected.add(skill);
      return { ...current, nativeSkills: Array.from(selected) };
    });
  };

  const nativeSkillSet = new Set(manualFields.nativeSkills ?? []);
  const typedPoints = Number(manualFields.trainingPointsTotal || draft.trainingPointsTotal || 0);
  const usedPoints = draft.trainingPointsUsed;
  const remainingPoints = Math.max(0, typedPoints - usedPoints);
  const budgetPercent = Math.min(100, Math.round((usedPoints / Math.max(1, typedPoints || draft.trainingPointsTotal)) * 100));
  const sameCardConfirmed = !totalReadingSession || totalReadingSession.mismatchRisk === 'none' || Boolean(readingConfirmations.sameCard);
  const allRequiredConfirmed = READING_CONFIRMATION_STAGES.filter((stage) => stage.required).every((stage) => readingConfirmations[stage.id]) && sameCardConfirmed;
  const identityConfirmed = Boolean(manualFields.playerName.trim() || (card.playerName && card.playerName !== 'Jogador não identificado'));
  const positionConfirmed = cardPositionOverride !== 'AUTO';
  const styleConfirmed = playstyleOverride !== 'AUTO' || Boolean(card.playstyle);
  const pointsConfirmed = typedPoints > 0;
  const reviewConfirmationCount = [identityConfirmed, positionConfirmed, styleConfirmed, pointsConfirmed].filter(Boolean).length;
  const reviewProgress = reviewConfirmationCount * 25;

  return (
    <section className="review-panel result-panel creation-review-panel bm2820-review-screen">
      <div className="review-workflow-banner luxury-panel">
        <div><span className="creation-stage-number">3</span><div><p className="kicker">Revisão obrigatória</p><h2>Confirme os dados essenciais</h2><p>Nada será tratado como ficha final até você revisar identidade, posição, estilo e pontos.</p></div></div>
        <div className="review-progress-summary"><strong>{reviewProgress}%</strong><span>{reviewConfirmationCount}/4 confirmações</span><i><b style={{ width: `${reviewProgress}%` }} /></i></div>
        <div className="review-essential-checks">
          <span className={identityConfirmed ? 'confirmed' : ''}>{identityConfirmed ? <CheckCircle2 size={15} /> : '1'} Identidade</span>
          <span className={positionConfirmed ? 'confirmed' : ''}>{positionConfirmed ? <CheckCircle2 size={15} /> : '2'} Posição</span>
          <span className={styleConfirmed ? 'confirmed' : ''}>{styleConfirmed ? <CheckCircle2 size={15} /> : '3'} Estilo</span>
          <span className={pointsConfirmed ? 'confirmed' : ''}>{pointsConfirmed ? <CheckCircle2 size={15} /> : '4'} Pontos</span>
        </div>
      </div>

      <div className="result-head luxury-panel">
        <div className="premium-card-art compact-art">
          {playerImage && <img src={playerImage} alt={`Imagem de ${card.playerName}`} />}
          <div className="card-shine" />
          <div className="card-number">
            <strong>{card.maxOverall ?? card.overall ?? '--'}</strong>
            <span>{card.mainPositionPt}</span>
          </div>
          <em>{card.playerName}</em>
        </div>
        <div className="result-intro">
          <p className="kicker"><ShieldCheck size={16} /> Auditoria Elite</p>
          <h2>Revise antes do plano final</h2>
          <p className="review-copy">Fluxo de precisão: você confirma posição, estilo, pontos e atributos antes de finalizar. Assim o programa não depende de leitura automática e reduz erros de ficha.</p>
          <div className="metric-grid">
            <div><span>Confiança</span><strong>{card.confidence}%</strong></div>
            <div><span>Posição lida</span><strong>{card.mainPositionPt}</strong></div>
            <div><span>Estilo</span><strong>{card.playstyle ?? 'revisar'}</strong></div>
            <div><span>Pontos</span><strong>{draft.trainingPointsTotal}</strong></div>
          </div>
          <div className="budget-simulator">
            <span>Simulador de orçamento</span>
            <strong>{usedPoints}/{typedPoints || draft.trainingPointsTotal} pts</strong>
            <i><b style={{ width: `${budgetPercent}%` }} /></i>
            <em>{remainingPoints ? `${remainingPoints} ponto(s) livres depois do recálculo` : 'Orçamento fechado ou usando total detectado'}</em>
          </div>
        </div>
      </div>

      <article className="luxury-panel wide-card review-alert-card">
        <p className="kicker">Validação sem IA paga</p>
        <div className="alert-strip strong-alert">
          {criticalIssues.length ? criticalIssues.map((issue) => <span key={issue.code}>⚠ {issue.message}</span>) : <span>✓ Nenhum bloqueio crítico encontrado.</span>}
          {reviewIssues.map((issue) => <span key={issue.code}>• {issue.message}</span>)}
        </div>
        <p className="panel-note">A ficha final deve usar posição, estilo, nível/pontos e atributos corretos. As habilidades que o jogador já possui são opcionais: elas só ajudam o app a não recomendar habilidade repetida.</p>
      </article>

      {singlePrintSession && (
        <SinglePrintEvidencePanel session={singlePrintSession} originalPreview={originalPreview} onUseCandidate={onUseSingleCandidate} />
      )}

      {totalReadingSession && (
        <article className="luxury-panel wide-card total-reading-audit">
          <div className="total-reading-audit-head">
            <div><p className="kicker"><ScanText size={16} /> Cruzamento das telas</p><h3>Leitura completa da mesma carta</h3><p>O app comparou identidade, tipo de tela, qualidade e campos críticos antes de liberar a ficha.</p></div>
            <strong>{totalReadingSession.mergedConfidence}%<span>confiança combinada</span></strong>
          </div>
          <div className="total-reading-coverage">
            {totalReadingSession.coverage.map((item) => (
              <span key={item.type} className={item.present ? 'covered' : item.required ? 'missing required' : 'missing'}>{item.present ? <CheckCircle2 size={14} /> : '—'} {item.label}{item.required ? ' • obrigatória' : ''}</span>
            ))}
          </div>
          <div className="total-reading-capture-list">
            {totalReadingSession.captures.map((capture) => (
              <details key={capture.id} className={capture.warnings.length ? 'capture-audit-card has-warning' : 'capture-audit-card'}>
                <summary><span><strong>{capture.label}</strong><small>Detectado: {capture.detectedType === 'unknown' ? capture.declaredType : capture.detectedType}</small></span><b>{capture.confidence}%</b></summary>
                <div className="capture-audit-details">
                  <span>Nome: {capture.identity.playerName || 'não confirmado'}</span>
                  <span>Posição: {capture.identity.position || 'não confirmada'}</span>
                  <span>Nível: {capture.identity.level ?? 'não confirmado'}</span>
                  <span>Tipo: {capture.identity.cardType || 'não confirmado'}</span>
                </div>
                {capture.warnings.map((warning) => <em key={warning}>⚠ {warning}</em>)}
              </details>
            ))}
          </div>
          <div className="total-critical-field-grid">
            {totalReadingSession.criticalFields.map((field) => (
              <div key={field.key} className={`critical-field status-${field.status}`}><strong>{field.label}</strong><span>{field.reason}</span></div>
            ))}
          </div>
          {totalReadingSession.mismatchRisk !== 'none' && (
            <label className={`same-card-confirmation risk-${totalReadingSession.mismatchRisk}`}>
              <input type="checkbox" checked={Boolean(readingConfirmations.sameCard)} onChange={() => setReadingConfirmations((current) => ({ ...current, sameCard: !current.sameCard }))} />
              <span><strong>Confirmo que todos os prints são da mesma versão da carta</strong><em>{totalReadingSession.mismatchReasons.join(' ') || 'O leitor encontrou uma divergência que precisa de confirmação humana.'}</em></span>
            </label>
          )}
        </article>
      )}

      {premiumReadings.length > 0 && (
        <article className="luxury-panel wide-card premium-confirmation-card">
          <p className="kicker"><ScanText size={16} /> Confirmação em etapas</p>
          <p className="panel-note no-top">Revise a origem visual e confirme cada etapa obrigatória. Habilidades continuam opcionais quando não estiverem visíveis.</p>
          <div className="confirmation-stage-grid">
            {READING_CONFIRMATION_STAGES.map((stage) => {
              const summary = buildStageSummary(premiumReadings, stage);
              const checked = Boolean(readingConfirmations[stage.id]);
              return (
                <label key={stage.id} className={checked ? 'confirmation-stage confirmed' : 'confirmation-stage'}>
                  <input type="checkbox" checked={checked} onChange={() => setReadingConfirmations((current) => ({ ...current, [stage.id]: !current[stage.id] }))} />
                  <span>
                    <strong>{stage.title}{stage.required ? ' • obrigatória' : ' • opcional'}</strong>
                    <em>{stage.description}</em>
                    <small>{summary.found}/{summary.total} áreas lidas • confiança média {summary.average}%{summary.review ? ` • ${summary.review} para revisar` : ''}</small>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="zone-origin-grid">
            {premiumReadings.map((reading) => (
              <details key={reading.id ?? `${reading.sourceId ?? 'single'}-${reading.key}-${reading.label}`} className={`zone-origin-card status-${reading.status}`}>
                <summary><strong>{reading.sourceLabel ? `${reading.sourceLabel} • ${reading.label}` : reading.label}</strong><span>{reading.confidence}% • {reading.status === 'confirmed' ? 'boa' : reading.status === 'review' ? 'revisar' : 'não lida'}</span></summary>
                {reading.originPreview && <img src={reading.originPreview} alt={`Origem visual: ${reading.label}`} loading="lazy" decoding="async" />}
                <pre>{reading.text || 'Nenhum texto confirmado nesta área.'}</pre>
                <em>Origem: {reading.sourceLabel ? `${reading.sourceLabel} • ` : ''}recorte da área • tratamento {reading.enhancement}{reading.passCount && reading.passCount > 1 ? ` • ${reading.passCount} passagens` : ''}</em>
              </details>
            ))}
          </div>
        </article>
      )}

      <div className="review-grid">
        <article className={`luxury-panel review-step-card ${identityConfirmed ? 'is-confirmed' : ''}`}>
          <div className="review-step-heading"><span>1</span><div><p className="kicker">Identidade da carta</p><h3>Quem é o jogador?</h3></div>{identityConfirmed && <CheckCircle2 size={19} />}</div>
          <label className="review-featured-field">
            <span>Nome do jogador</span>
            <input value={manualFields.playerName} onChange={(event) => setManualFields((current) => ({ ...current, playerName: event.target.value }))} placeholder={card.playerName} />
            <small>Confira a grafia para manter o Cofre organizado.</small>
          </label>
        </article>

        <article className={`luxury-panel review-step-card ${positionConfirmed ? 'is-confirmed' : ''}`}>
          <div className="review-step-heading"><span>2</span><div><p className="kicker">Confirmação da posição</p><h3>Origem e função final</h3></div>{positionConfirmed && <CheckCircle2 size={19} />}</div>
          <div className="review-form-grid review-position-grid">
            <label>
              <span>Posição principal correta</span>
              <select value={cardPositionOverride} onChange={(event) => setCardPositionOverride(event.target.value as PositionCode | 'AUTO')}>
                {POSITION_LABELS.filter((item) => item.code !== 'AUTO').map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
              <small>Posição oficial mostrada na carta.</small>
            </label>
            <label>
              <span>Função alvo da ficha</span>
              <select value={targetPosition} onChange={(event) => setTargetPosition(event.target.value as PositionCode | 'AUTO')}>
                {POSITION_LABELS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
              <small>Sua escolha é soberana e não será trocada.</small>
            </label>
          </div>
        </article>

        <article className={`luxury-panel review-step-card ${styleConfirmed ? 'is-confirmed' : ''}`}>
          <div className="review-step-heading"><span>3</span><div><p className="kicker">Confirmação do estilo</p><h3>Como a carta se movimenta?</h3></div>{styleConfirmed && <CheckCircle2 size={19} />}</div>
          <label className="review-featured-field">
            <span>Estilo de jogo correto</span>
            <select value={playstyleOverride} onChange={(event) => setPlaystyleOverride(event.target.value)}>
              <option value="AUTO">Automático / não sei</option>
              {playstyleOptions.map((style) => <option key={style} value={style}>{style}</option>)}
            </select>
            <small>O estilo altera prioridades, movimentação e habilidades recomendadas.</small>
          </label>
        </article>

        <article className={`luxury-panel review-step-card ${pointsConfirmed ? 'is-confirmed' : ''}`}>
          <div className="review-step-heading"><span>4</span><div><p className="kicker">Definição dos pontos</p><h3>Feche o orçamento exato</h3></div>{pointsConfirmed && <CheckCircle2 size={19} />}</div>
          <div className="review-form-grid review-points-grid">
            <label>
              <span>Nível máximo</span>
              <input inputMode="numeric" value={manualFields.level} onChange={(event) => setManualFields((current) => ({ ...current, level: event.target.value.replace(/[^0-9]/g, '').slice(0, 2) }))} placeholder={card.level ? String(card.level) : 'Ex.: 32'} />
            </label>
            <label>
              <span>Pontos de progresso disponíveis</span>
              <input inputMode="numeric" value={manualFields.trainingPointsTotal} onChange={(event) => setManualFields((current) => ({ ...current, trainingPointsTotal: event.target.value.replace(/[^0-9]/g, '').slice(0, 3) }))} placeholder={manualFields.level ? String((Number(manualFields.level) - 1) * 2) : String(draft.trainingPointsTotal)} />
            </label>
          </div>
          <div className="review-budget-inline"><div><span>Distribuição atual</span><strong>{usedPoints}/{typedPoints || draft.trainingPointsTotal} pts</strong></div><i><b style={{ width: `${budgetPercent}%` }} /></i><small>{remainingPoints ? `${remainingPoints} ponto(s) ainda livres` : 'Orçamento fechado ou usando o total detectado'}</small></div>
        </article>

        <article className="luxury-panel wide-card review-optional-card">
          <p className="kicker">Habilidades que o jogador já possui</p>
          <p className="panel-note no-top">Opcional: marque somente as habilidades que já aparecem na carta. Isso serve para o app não recomendar habilidade repetida e escolher as 5 melhores habilidades que ainda faltam. Se não souber, pode finalizar sem marcar nada.</p>
          <div className="skill-picker-grid">
            {OFFICIAL_ADDITIONAL_SKILL_NAMES.map((skill) => (
              <button
                key={skill}
                type="button"
                className={nativeSkillSet.has(skill) ? 'skill-picker-chip selected' : 'skill-picker-chip'}
                onClick={() => toggleNativeSkill(skill)}
              >
                {nativeSkillSet.has(skill) ? '✓ ' : ''}{skill}
              </button>
            ))}
          </div>
        </article>

        <article className="luxury-panel wide-card review-optional-card">
          <p className="kicker">Atributos revisáveis</p>
          <div className="attribute-editor-grid">
            {ATTRIBUTE_INPUTS.map((item) => (
              <label key={item.key}>
                <span>{item.label}</span>
                <input
                  inputMode="numeric"
                  value={manualFields.attributes[item.key] ?? ''}
                  onChange={(event) => updateAttribute(item.key, event.target.value)}
                  placeholder={card.attributes[item.key] ? String(card.attributes[item.key]) : '--'}
                />
              </label>
            ))}
          </div>
          <p className="panel-note">Preencha os valores que você deseja usar na ficha. Os demais dados seguem o motor local, banco de cartas e regras premium de desempenho em campo.</p>
        </article>

        <article className="luxury-panel wide-card review-optional-card">
          <p className="kicker">Funções separadas</p>
          <div className="position-list">
            {draft.permittedPositions.map((item) => (
              <div key={item.code}>
                <strong>{item.label}</strong>
                <span>{item.reason}</span>
                <em>{item.rating ? `Nota lida ${item.rating}` : 'Sem depender de GER'}</em>
              </div>
            ))}
          </div>
          {draft.avoidPositions.length > 0 && (
            <>
              <p className="kicker avoid-kicker">Evitar</p>
              <div className="position-list avoid-list">
                {draft.avoidPositions.map((item) => (
                  <div key={item.code}>
                    <strong>{item.label}</strong>
                    <span>{item.reason}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </div>

      <div className="review-finalize-shell luxury-panel">
        <div className="review-finalize-copy"><span className="creation-stage-number">4</span><div><p className="kicker">Gerar ficha</p><h3>{reviewProgress === 100 ? 'Dados essenciais confirmados' : 'Revise os itens pendentes'}</h3><p>{reviewProgress === 100 ? 'Você pode recalcular ou gerar o plano final com os dados confirmados.' : 'O aplicativo permite continuar, mas os itens não confirmados podem reduzir a precisão.'}</p></div></div>
        <div className="review-actions">
          <button type="button" className="secondary-action" onClick={onRefresh}>Recalcular prévia</button>
          <button type="button" className="elite-button" onClick={onConfirm} disabled={premiumReadings.length > 0 && !allRequiredConfirmed}><CheckCircle2 size={18} /> {premiumReadings.length > 0 && !allRequiredConfirmed ? 'Confirme as etapas obrigatórias' : 'Gerar ficha final'}</button>
        </div>
      </div>
    </section>
  );
}
