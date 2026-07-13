import { ATTRIBUTE_PT, PLAYSTYLE_OPTIONS, POSITION_PT, type AnalysisResult, type AttributeKey, type PositionCode } from './analyzer';
import { TRAINING_LABELS } from './trainingEngine';

export type ReliabilitySource = 'confirmado' | 'lido' | 'inferido' | 'fallback';
export type ReliabilityItem = { field: string; value: string; source: ReliabilitySource; confidence: number; impact: 'alto' | 'médio' | 'baixo'; note: string };
export type ReliabilityCenter = { score: number; level: 'alta' | 'média' | 'baixa'; confirmed: number; inferred: number; unresolved: number; items: ReliabilityItem[]; alerts: string[] };

export type Inconsistency = { severity: 'bloqueio' | 'revisão' | 'aviso'; code: string; title: string; detail: string; correction: string };
export type InconsistencyReport = { status: 'aprovado' | 'revisar' | 'bloqueado'; score: number; issues: Inconsistency[]; canGenerate: boolean };

export type BuildComparisonRow = { key: string; label: string; values: Array<{ title: string; value: string | number; best?: boolean }> };
export type BuildComparisonReport = { winner: string; reason: string; rows: BuildComparisonRow[]; variants: Array<{ title: string; score: number; efficiency: number; balance: number; points: number; risks: string[] }> };

export type PlayerComparisonItem = { id: string; name: string; originalPosition: string; targetPosition: string; score: number; adaptation: string; confidence: number; efficiency: number; physical: number; skills: number; goals: number; strengths: string[]; risks: string[] };
export type PlayerComparisonReport = { targetPosition: PositionCode; targetLabel: string; ranking: PlayerComparisonItem[]; winner: string | null; reason: string };

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const sourceScore: Record<ReliabilitySource, number> = { confirmado: 100, lido: 82, inferido: 58, fallback: 30 };

export function buildReliabilityCenter(result: AnalysisResult): ReliabilityCenter {
  const card = result.parsed;
  const items: ReliabilityItem[] = result.deepAnalysis.readingItems.map((item) => {
    const source = item.source as ReliabilitySource;
    const confidence = item.confidence === 'alta' ? 92 : item.confidence === 'media' ? 68 : 42;
    const impact: ReliabilityItem['impact'] = /posição|estilo|pontos|atributo/i.test(item.field) ? 'alto' : /altura|peso|habilidade/i.test(item.field) ? 'médio' : 'baixo';
    return { field: item.field, value: item.value, source, confidence: Math.min(confidence, sourceScore[source]), impact, note: item.note };
  });
  if (!items.some((x) => /posição escolhida/i.test(x.field))) items.push({ field: 'Posição escolhida', value: result.bestPosition.label, source: 'confirmado', confidence: 100, impact: 'alto', note: 'Definida pelo usuário e preservada pelo motor.' });
  if (!items.some((x) => /pontos/i.test(x.field))) items.push({ field: 'Orçamento de pontos', value: `${result.trainingPointsUsed}/${result.trainingPointsTotal}`, source: card.trainingPointSource === 'MANUAL' ? 'confirmado' : card.trainingPointSource === 'FALLBACK' ? 'fallback' : 'lido', confidence: card.trainingPointSource === 'MANUAL' ? 100 : card.trainingPointSource === 'FALLBACK' ? 30 : 82, impact: 'alto', note: 'Controla a validade de toda a ficha.' });
  const weighted = items.reduce((sum, item) => sum + item.confidence * (item.impact === 'alto' ? 3 : item.impact === 'médio' ? 2 : 1), 0);
  const weight = items.reduce((sum, item) => sum + (item.impact === 'alto' ? 3 : item.impact === 'médio' ? 2 : 1), 0) || 1;
  const score = clamp(weighted / weight);
  const unresolved = items.filter((x) => x.source === 'fallback' || x.confidence < 50).length + result.deepAnalysis.uncertainFields.length;
  const alerts = [
    ...result.deepAnalysis.uncertainFields.map((x) => `${x}: confirmar antes de tratar a ficha como definitiva.`),
    ...items.filter((x) => x.impact === 'alto' && x.confidence < 70).map((x) => `${x.field} tem alto impacto e confiança reduzida.`)
  ];
  return { score, level: score >= 85 ? 'alta' : score >= 65 ? 'média' : 'baixa', confirmed: items.filter((x) => x.source === 'confirmado').length, inferred: items.filter((x) => x.source === 'inferido').length, unresolved, items, alerts: Array.from(new Set(alerts)) };
}

export function detectInconsistencies(result: AnalysisResult): InconsistencyReport {
  const c = result.parsed;
  const issues: Inconsistency[] = [];
  const add = (severity: Inconsistency['severity'], code: string, title: string, detail: string, correction: string) => issues.push({ severity, code, title, detail, correction });
  if (result.trainingPointsUsed > result.trainingPointsTotal) add('bloqueio', 'BUDGET_EXCEEDED', 'Orçamento ultrapassado', `${result.trainingPointsUsed} usados para ${result.trainingPointsTotal} disponíveis.`, 'Reduza a distribuição antes de salvar.');
  if (result.trainingPointsRemaining < 0) add('bloqueio', 'NEGATIVE_REMAINING', 'Saldo negativo', 'O cálculo resultou em pontos restantes negativos.', 'Recalcule a ficha com o orçamento confirmado.');
  if (c.playstyle && !PLAYSTYLE_OPTIONS.includes(c.playstyle as typeof PLAYSTYLE_OPTIONS[number])) add('bloqueio', 'UNKNOWN_PLAYSTYLE', 'Estilo fora do catálogo', `“${c.playstyle}” não está no catálogo oficial interno.`, 'Escolha o nome já cadastrado no app.');
  if (new Set(c.nativeSkills.map((x) => x.toLowerCase())).size !== c.nativeSkills.length) add('revisão', 'DUPLICATE_SKILL', 'Habilidade duplicada', 'A mesma habilidade aparece mais de uma vez.', 'Revise a lista antes de recomendar habilidades adicionais.');
  if (c.height != null && (c.height < 140 || c.height > 220)) add('revisão', 'HEIGHT_RANGE', 'Altura suspeita', `${c.height} cm está fora da faixa segura.`, 'Confirme manualmente a altura.');
  if (c.weight != null && (c.weight < 40 || c.weight > 130)) add('revisão', 'WEIGHT_RANGE', 'Peso suspeito', `${c.weight} kg está fora da faixa segura.`, 'Confirme manualmente o peso.');
  if (c.overall != null && (c.overall < 40 || c.overall > 110)) add('revisão', 'OVERALL_RANGE', 'Overall suspeito', `Overall ${c.overall} parece incoerente.`, 'Revise a leitura do overall.');
  Object.entries(c.attributes).forEach(([key, value]) => { if (value != null && (value < 30 || value > 110)) add('revisão', `ATTR_${key}`, 'Atributo fora da faixa', `${ATTRIBUTE_PT[key as AttributeKey]} = ${value}.`, 'Confirme o valor no print.'); });
  if (!c.manualConfirmed && c.evidence.attributeCount < 6) add('revisão', 'LOW_ATTRIBUTE_COVERAGE', 'Poucos atributos confirmados', `Somente ${c.evidence.attributeCount} atributos foram reconhecidos.`, 'Use a revisão manual rápida.');
  if (result.bestPosition.code === 'GK' && c.mainPosition !== 'GK') add('aviso', 'LINE_TO_GK', 'Conversão extrema', 'Jogador de linha foi escolhido como goleiro.', 'A escolha é mantida, mas os atributos de goleiro precisam ser confirmados.');
  if (result.bestPosition.code !== 'GK' && c.mainPosition === 'GK') add('aviso', 'GK_TO_LINE', 'Conversão extrema', 'Goleiro foi escolhido como jogador de linha.', 'A escolha é mantida, mas os atributos de linha precisam ser confirmados.');
  const blockers = issues.filter((x) => x.severity === 'bloqueio').length;
  const reviews = issues.filter((x) => x.severity === 'revisão').length;
  const score = clamp(100 - blockers * 35 - reviews * 12 - issues.filter((x) => x.severity === 'aviso').length * 5);
  return { status: blockers ? 'bloqueado' : reviews ? 'revisar' : 'aprovado', score, issues, canGenerate: blockers === 0 };
}

export function compareBuildVariants(result: AnalysisResult): BuildComparisonReport {
  const variants = result.buildVariants.map((v) => ({ title: v.title, score: v.qualityScore ?? 0, efficiency: v.efficiencyScore ?? 0, balance: v.balanceScore ?? 0, points: v.pointsUsed, risks: v.risks ?? [] }));
  const winner = [...variants].sort((a,b) => (b.score + b.efficiency + b.balance) - (a.score + a.efficiency + a.balance))[0];
  const trainingKeys = Object.keys(result.training) as Array<keyof typeof result.training>;
  const rows: BuildComparisonRow[] = [
    { key: 'quality', label: 'Qualidade', values: variants.map((v) => ({ title: v.title, value: v.score, best: v.score === Math.max(...variants.map((x) => x.score)) })) },
    { key: 'efficiency', label: 'Eficiência', values: variants.map((v) => ({ title: v.title, value: v.efficiency, best: v.efficiency === Math.max(...variants.map((x) => x.efficiency)) })) },
    { key: 'balance', label: 'Equilíbrio', values: variants.map((v) => ({ title: v.title, value: v.balance, best: v.balance === Math.max(...variants.map((x) => x.balance)) })) },
    ...trainingKeys.map((key) => ({ key, label: TRAINING_LABELS[key], values: result.buildVariants.map((v) => ({ title: v.title, value: v.training[key], best: v.training[key] === Math.max(...result.buildVariants.map((x) => x.training[key])) })) }))
  ];
  return { winner: winner?.title ?? result.buildName, reason: winner ? `Venceu pela melhor combinação de qualidade, eficiência e equilíbrio, sem ultrapassar ${result.trainingPointsTotal} pontos.` : 'Ficha principal mantida.', rows, variants };
}

export function comparePlayers(entries: Array<{ id: string; result: AnalysisResult }>, targetPosition: PositionCode): PlayerComparisonReport {
  const ranking = entries.map(({ id, result }) => {
    const physical = result.physicalEngine?.suitabilityScore ?? 50;
    const skills = result.specialSkillsAnalysis?.coverageScore ?? 50;
    const goals = result.attributeGoals?.readinessScore ?? 50;
    const efficiency = result.advancedOptimizer?.efficiencyScore ?? 50;
    const sameTarget = result.bestPosition.code === targetPosition;
    const adaptation = sameTarget ? (result.advancedTacticalFunction?.fitLabel ?? 'boa') : 'requer nova ficha';
    const score = clamp((physical * .2) + (skills * .18) + (goals * .25) + (efficiency * .22) + (result.parsed.confidence * .15) + (sameTarget ? 8 : -8));
    return { id, name: result.parsed.playerName, originalPosition: result.parsed.mainPositionPt, targetPosition: POSITION_PT[targetPosition], score, adaptation, confidence: result.parsed.confidence, efficiency, physical, skills, goals, strengths: result.strengths.slice(0,3), risks: result.weaknesses.slice(0,3) };
  }).sort((a,b) => b.score - a.score);
  return { targetPosition, targetLabel: POSITION_PT[targetPosition], ranking, winner: ranking[0]?.name ?? null, reason: ranking[0] ? `${ranking[0].name} apresentou o melhor conjunto para ${POSITION_PT[targetPosition]} entre os jogadores comparados.` : 'Selecione jogadores do Cofre para comparar.' };
}
