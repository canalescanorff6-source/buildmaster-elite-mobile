import type { AnalysisResult, TacticalFormation, TacticalStyle } from '@/lib/analyzer';
import { buildFormationLineup, FORMATION_BLUEPRINTS, getFormationBlueprint, scorePlayerForFormationSlot, styleAdviceForFormation } from '@/lib/formationRoleEngine';
import { cardFingerprint, type MatchValidationRecord } from '@/lib/appEvolution';

export const CENTRAL_SCHEMA_VERSION = 27;
export const CENTRAL_MIGRATION_STORAGE_KEY = 'buildmaster_central_intelligence_schema_v27';

export type RecommendationPriority = 'critical' | 'important' | 'opportunity' | 'info';

export type CentralPlayerInput = {
  id: string;
  updatedAt: string;
  favorite?: boolean;
  status?: 'completo' | 'pendente' | 'revisar';
  result: AnalysisResult;
};

export type IntegratedPlayerRecord = {
  id: string;
  fingerprint: string;
  name: string;
  cardPosition: string;
  targetPosition: string;
  targetPositionCode: string;
  playstyle: string;
  functionLabel: string;
  buildName: string;
  confidence: number;
  efficiency: number;
  favorite: boolean;
  status: 'completo' | 'pendente' | 'revisar';
  updatedAt: string;
  matchCount: number;
  matchAverage: number;
  bestFormations: Array<{ id: string; name: string; slot: string; score: number }>;
  strengths: string[];
  limitations: string[];
  result: AnalysisResult;
};

export type CentralRecommendation = {
  id: string;
  priority: RecommendationPriority;
  title: string;
  detail: string;
  action: 'players' | 'reader' | 'manual' | 'vault' | 'team' | 'matches' | 'settings' | 'result';
  playerId?: string;
};

export type TeamDiagnosis = {
  formation: string;
  styleFit: number;
  styleNote: string;
  globalScore: number;
  filledSlots: number;
  totalSlots: number;
  strongestLine: string;
  weakestLine: string;
  missingRoles: string[];
  repeatedFunctions: string[];
  lineup: ReturnType<typeof buildFormationLineup>;
  benchSuggestions: Array<{ id: string; name: string; role: string; score: number; reason: string }>;
  pairingNotes: string[];
  recommendations: CentralRecommendation[];
};

export type MatchScenarioPlan = {
  id: 'protect' | 'control' | 'chase';
  label: string;
  objective: string;
  formationAdvice: string;
  playerProfile: string;
  substitutions: string[];
  risks: string[];
};

export type CentralDashboard = {
  players: number;
  confirmed: number;
  needsReview: number;
  matchRecords: number;
  squadReadiness: number;
  latestPlayer: { id: string; name: string; targetPosition: string } | null;
  recommendations: CentralRecommendation[];
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function resultEfficiency(result: AnalysisResult) {
  const precision = Number(result.parsed.confidence ?? 0) * .72 + Number(result.maxPrecision?.antiCloneDistance ?? 60) * .28;
  const remainingPenalty = Math.min(25, Math.max(0, Number(result.trainingPointsRemaining || 0)) * 4);
  const blockedPenalty = result.validation?.level === 'blocked' ? 35 : result.validation?.level === 'review' ? 10 : 0;
  return clamp(precision - remainingPenalty - blockedPenalty);
}

function matchSummary(records: MatchValidationRecord[]) {
  if (!records.length) return { count: 0, average: 0 };
  return {
    count: records.length,
    average: Number((records.reduce((sum, record) => sum + record.overallRating, 0) / records.length).toFixed(1))
  };
}

export function buildIntegratedPlayers(inputs: CentralPlayerInput[], matches: MatchValidationRecord[]): IntegratedPlayerRecord[] {
  return inputs.map((entry) => {
    const result = entry.result;
    const fingerprint = cardFingerprint(result);
    const playerMatches = matches.filter((record) => record.cardFingerprint === fingerprint);
    const match = matchSummary(playerMatches);
    const formationFits = FORMATION_BLUEPRINTS.flatMap((formation) => formation.slots.map((slot) => ({
      id: formation.id,
      name: formation.name,
      slot: slot.label,
      score: scorePlayerForFormationSlot(result, slot).score
    }))).sort((a, b) => b.score - a.score).slice(0, 3);
    return {
      id: entry.id,
      fingerprint,
      name: result.parsed.playerName,
      cardPosition: result.parsed.mainPositionPt,
      targetPosition: result.bestPosition.label,
      targetPositionCode: result.bestPosition.code,
      playstyle: result.parsed.playstyle || 'Não confirmado',
      functionLabel: result.teamMap?.functionLabel || result.advancedTacticalFunction?.officialPlaystyle || result.buildName,
      buildName: result.buildName,
      confidence: clamp(result.parsed.confidence),
      efficiency: resultEfficiency(result),
      favorite: Boolean(entry.favorite),
      status: entry.status ?? (result.validation?.level === 'blocked' ? 'revisar' : result.trainingPointsRemaining === 0 ? 'completo' : 'pendente'),
      updatedAt: entry.updatedAt,
      matchCount: match.count,
      matchAverage: match.average,
      bestFormations: formationFits,
      strengths: (result.strengths || []).slice(0, 4),
      limitations: (result.weaknesses || []).slice(0, 3),
      result
    };
  }).sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt));
}

function lineScore(lineup: ReturnType<typeof buildFormationLineup>, line: 'ataque' | 'meio' | 'defesa' | 'goleiro') {
  const items = lineup.filter((item) => item.slot.line === line);
  return average(items.map((item) => item.score));
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function buildTeamDiagnosis(players: IntegratedPlayerRecord[], formation: TacticalFormation, style: TacticalStyle): TeamDiagnosis {
  const blueprint = getFormationBlueprint(formation === 'AUTO' ? '4-2-2-2' : formation);
  const lineup = buildFormationLineup(players.map((player) => player.result), blueprint);
  const styleFit = styleAdviceForFormation(blueprint, style);
  const filledSlots = lineup.filter((item) => item.player).length;
  const lineScores = [
    { label: 'Ataque', score: lineScore(lineup, 'ataque') },
    { label: 'Meio-campo', score: lineScore(lineup, 'meio') },
    { label: 'Defesa', score: lineScore(lineup, 'defesa') },
    { label: 'Goleiro', score: lineScore(lineup, 'goleiro') }
  ].sort((a, b) => b.score - a.score);
  const globalScore = clamp(average(lineup.map((item) => item.score)) * .82 + styleFit.fit * .18);
  const missingRoles = lineup.filter((item) => !item.player || item.score < 58).map((item) => `${item.slot.label}: ${item.slot.primaryRoles.join(' ou ')}`);
  const functionCounts = new Map<string, number>();
  lineup.forEach((item) => {
    if (!item.player) return;
    const label = item.player.teamMap?.functionLabel || item.player.buildName;
    functionCounts.set(label, (functionCounts.get(label) ?? 0) + 1);
  });
  const repeatedFunctions = [...functionCounts.entries()].filter(([, count]) => count >= 3).map(([label, count]) => `${label} (${count})`);
  const starterFingerprints = new Set(lineup.filter((item) => item.player).map((item) => item.player ? cardFingerprint(item.player) : ''));
  const benchSuggestions = players
    .filter((player) => !starterFingerprints.has(player.fingerprint))
    .sort((a, b) => (b.matchAverage || 0) - (a.matchAverage || 0) || b.efficiency - a.efficiency)
    .slice(0, 7)
    .map((player) => ({
      id: player.id,
      name: player.name,
      role: player.functionLabel,
      score: player.efficiency,
      reason: player.matchCount ? `Validado em ${player.matchCount} partida(s), média ${player.matchAverage}/5.` : `Cobertura para ${player.targetPosition}; ficha ${player.buildName}.`
    }));
  const attackRoles = lineup.filter((item) => item.slot.line === 'ataque' && item.player).map((item) => item.player?.teamMap?.functionLabel || item.player?.buildName || '').filter(Boolean);
  const midfieldRoles = lineup.filter((item) => item.slot.line === 'meio' && item.player).map((item) => item.player?.teamMap?.functionLabel || item.player?.buildName || '').filter(Boolean);
  const pairingNotes = [
    attackRoles.length >= 2 ? `Ataque: combinar ${attackRoles.slice(0, 2).join(' + ')} para evitar dois jogadores fazendo a mesma movimentação.` : 'Ataque: ainda falta uma dupla complementar confirmada.',
    midfieldRoles.length >= 2 ? `Meio: ${midfieldRoles.slice(0, 2).join(' + ')} formam a base; preserve ao menos uma função de cobertura.` : 'Meio: ainda falta equilíbrio entre criação e cobertura.',
    benchSuggestions.length ? `Banco: ${benchSuggestions.slice(0, 3).map((player) => player.name).join(', ')} são as primeiras alternativas pelo índice atual.` : 'Banco: não há alternativas suficientes fora dos titulares.'
  ];
  const recommendations: CentralRecommendation[] = [];
  if (filledSlots < blueprint.slots.length) recommendations.push({ id: 'missing-slots', priority: 'critical', title: 'Escalação incompleta', detail: `${blueprint.slots.length - filledSlots} espaço(s) não possuem encaixe seguro no Cofre.`, action: 'players' });
  if (missingRoles.length) recommendations.push({ id: 'missing-roles', priority: 'important', title: 'Funções sem encaixe ideal', detail: missingRoles.slice(0, 3).join(' • '), action: 'team' });
  if (repeatedFunctions.length) recommendations.push({ id: 'repeated-functions', priority: 'important', title: 'Funções repetidas', detail: `O time concentra funções semelhantes: ${repeatedFunctions.join(', ')}.`, action: 'team' });
  if (styleFit.fit < 80) recommendations.push({ id: 'style-fit', priority: 'opportunity', title: 'Estilo coletivo adaptado', detail: styleFit.note, action: 'team' });
  if (!recommendations.length) recommendations.push({ id: 'balanced-team', priority: 'info', title: 'Estrutura equilibrada', detail: `A ${blueprint.name} possui bons encaixes. Revise banco e planos de substituição antes da partida.`, action: 'matches' });
  return {
    formation: blueprint.name,
    styleFit: styleFit.fit,
    styleNote: styleFit.note,
    globalScore,
    filledSlots,
    totalSlots: blueprint.slots.length,
    strongestLine: lineScores[0]?.label ?? '—',
    weakestLine: lineScores.at(-1)?.label ?? '—',
    missingRoles,
    repeatedFunctions,
    lineup,
    benchSuggestions,
    pairingNotes,
    recommendations
  };
}

export function buildCentralDashboard(players: IntegratedPlayerRecord[], matches: MatchValidationRecord[], team: TeamDiagnosis): CentralDashboard {
  const recommendations: CentralRecommendation[] = [];
  const review = players.filter((player) => player.status === 'revisar' || player.confidence < 75);
  const withoutMatches = players.filter((player) => player.matchCount === 0 && player.status === 'completo');
  const unfinished = players.filter((player) => player.status === 'pendente');
  if (!players.length) recommendations.push({ id: 'first-player', priority: 'critical', title: 'Adicione a primeira carta', detail: 'Use a Leitura Total ou o Manual Pro para iniciar o banco unificado.', action: 'reader' });
  if (review.length) recommendations.push({ id: 'review-cards', priority: 'critical', title: `${review.length} carta(s) precisam de confirmação`, detail: 'Revise identidade, estilo ou confiança antes de confiar na ficha final.', action: 'vault' });
  if (unfinished.length) recommendations.push({ id: 'unfinished-builds', priority: 'important', title: `${unfinished.length} ficha(s) incompletas`, detail: 'Finalize os pontos ou confirme os campos pendentes.', action: 'vault' });
  if (withoutMatches.length) recommendations.push({ id: 'validate-builds', priority: 'opportunity', title: 'Valide fichas em partidas', detail: `${withoutMatches.length} ficha(s) completas ainda não possuem avaliação real.`, action: 'matches' });
  recommendations.push(...team.recommendations);
  const confirmed = players.filter((player) => player.status === 'completo' && player.confidence >= 75).length;
  return {
    players: players.length,
    confirmed,
    needsReview: review.length + unfinished.length,
    matchRecords: matches.length,
    squadReadiness: team.globalScore,
    latestPlayer: players[0] ? { id: players[0].id, name: players[0].name, targetPosition: players[0].targetPosition } : null,
    recommendations: recommendations.slice(0, 8)
  };
}

export function buildMatchScenarioPlans(team: TeamDiagnosis): MatchScenarioPlan[] {
  const weak = team.weakestLine.toLowerCase();
  const bench = team.benchSuggestions;
  const defensive = bench.filter((item) => /vol|defens|zague|lateral|cobertura/i.test(`${item.role} ${item.reason}`));
  const creative = bench.filter((item) => /meia|armador|orquestr|passe|cria/i.test(`${item.role} ${item.reason}`));
  const attacking = bench.filter((item) => /ca|atac|ponta|ala|final|veloc/i.test(`${item.role} ${item.reason}`));
  const named = (items: typeof bench, fallback: string) => items[0] ? `${items[0].name} — ${items[0].role}` : fallback;
  return [
    {
      id: 'protect', label: 'Segurar resultado', objective: 'Reduzir transições e proteger o setor mais vulnerável.',
      formationAdvice: `Mantenha a ${team.formation}, abaixe a agressividade do lado mais exposto e preserve cobertura em ${team.weakestLine}.`,
      playerProfile: 'Priorize 1º Volante, lateral defensivo, jogador resistente e atacante que segure a bola.',
      substitutions: [
        `Primeira opção do seu banco: ${named(defensive, 'meio-campista de cobertura')}.`,
        'Trocar o jogador mais cansado do corredor sem retirar toda a saída de bola.',
        `Manter uma válvula de escape: ${named(attacking, 'atacante que proteja a posse')}.`
      ],
      risks: [`Não recuar todos ao mesmo tempo; ${weak} já é o setor mais frágil.`, 'Evitar os dois laterais avançando juntos.']
    },
    {
      id: 'control', label: 'Controlar a partida', objective: 'Manter equilíbrio e escolher o momento de acelerar.',
      formationAdvice: `Use a estrutura base da ${team.formation} e preserve as funções complementares do meio.`,
      playerProfile: 'Orquestrador ou Armador Criativo para circulação, com um jogador de cobertura atrás.',
      substitutions: [
        `Renovar a criação entre 55 e 70 minutos com ${named(creative, 'um meia de passe seguro')}.`,
        'Trocar o atacante de menor participação, não apenas o de menor overall.',
        `Preservar transição com ${named(attacking, 'um reserva rápido')}.`
      ],
      risks: ['Não repetir três jogadores com a mesma função.', 'Não deixar o CA isolado sem aproximação.']
    },
    {
      id: 'chase', label: 'Buscar empate ou virada', objective: 'Aumentar presença ofensiva sem desmontar completamente a proteção.',
      formationAdvice: `Transforme um meio em Infiltração ou Armador Criativo e ataque o lado de melhor encaixe da ${team.formation}.`,
      playerProfile: 'Artilheiro, Ala Produtivo, Infiltração e um Pivô ou Puxa Marcação para criar espaços.',
      substitutions: [
        `Adicionar impacto ofensivo com ${named(attacking, 'o melhor finalizador disponível')}.`,
        `Aumentar criação com ${named(creative, 'um Armador Criativo ou Infiltração')}.`,
        `Manter proteção com ${named(defensive, 'um volante de cobertura')}.`
      ],
      risks: ['Não retirar toda a proteção central.', 'Evitar dois zagueiros lentos expostos em linha alta.']
    }
  ];
}

export function answerCentralAssistant(question: string, players: IntegratedPlayerRecord[], team: TeamDiagnosis): string {
  const query = normalize(question.trim());
  if (!query) return 'Digite uma pergunta sobre jogadores, fichas, formação, banco ou próxima partida.';
  if (!players.length) return 'Ainda não há jogadores no banco unificado. Adicione uma carta pelo Leitor Total ou Manual Pro para eu responder usando o seu elenco.';
  if (query.includes('melhor vol') || query.includes('volante')) {
    const ranked = players.filter((player) => ['DMF','CMF'].includes(player.targetPositionCode)).sort((a, b) => b.efficiency - a.efficiency || b.confidence - a.confidence);
    const best = ranked[0];
    return best ? `${best.name} é o melhor candidato atual para o meio defensivo: ficha ${best.buildName}, eficiência ${best.efficiency}/100 e melhor encaixe em ${best.bestFormations[0]?.name ?? team.formation}.` : 'Não encontrei uma carta preparada para VOL ou MLG. O elenco precisa de um meio-campista defensivo.';
  }
  if (query.includes('melhor ca') || query.includes('atacante')) {
    const ranked = players.filter((player) => ['CF','SS','LWF','RWF'].includes(player.targetPositionCode)).sort((a, b) => b.efficiency - a.efficiency || b.matchAverage - a.matchAverage);
    const best = ranked[0];
    return best ? `${best.name} lidera o ataque no momento: ${best.functionLabel}, eficiência ${best.efficiency}/100${best.matchCount ? ` e média ${best.matchAverage}/5 em ${best.matchCount} partida(s)` : ''}.` : 'Não há atacante com ficha completa no Cofre.';
  }
  if ((query.includes('ficha') && query.includes('4-2-2-2')) || query.includes('combina melhor com 4-2-2-2')) {
    const ranked = players
      .map((player) => ({ player, fit: player.bestFormations.find((formation) => formation.id === '4-2-2-2') }))
      .filter((item) => item.fit)
      .sort((a, b) => (b.fit?.score ?? 0) - (a.fit?.score ?? 0));
    const best = ranked[0];
    return best?.fit ? `${best.player.name} possui a ficha com melhor encaixe atual na 4-2-2-2: ${best.player.buildName}, para ${best.fit.slot}, com ${best.fit.score}% de compatibilidade.` : 'Ainda não há ficha com encaixe confirmado para a 4-2-2-2.';
  }
  if (query.includes('lado') && query.includes('artilheiro')) {
    const partner = players
      .filter((player) => /piv[oô]|puxa marca[cç][aã]o|apoio/i.test(`${player.functionLabel} ${player.playstyle} ${player.buildName}`))
      .sort((a, b) => b.efficiency - a.efficiency)[0];
    return partner ? `${partner.name} é o parceiro mais complementar para um Artilheiro: atua como ${partner.functionLabel}, tem eficiência ${partner.efficiency}/100 e ajuda a criar espaço ou sustentar a bola.` : 'Não encontrei um Pivô ou Puxa Marcação confirmado. Procure um atacante de apoio para evitar dois finalizadores atacando o mesmo espaço.';
  }
  if (query.includes('muito ofensivo') || query.includes('ofensivo demais')) {
    const defensiveCoverage = team.missingRoles.filter((role) => /volante|defens|cobertura|zagueiro/i.test(role)).length;
    const verdict = defensiveCoverage > 0 || team.weakestLine === 'Defesa' ? 'sim, há risco de desequilíbrio ofensivo' : 'não há sinal crítico de excesso ofensivo';
    return `Pela escalação atual, ${verdict}. Prontidão ${team.globalScore}/100, setor mais vulnerável: ${team.weakestLine}.${team.missingRoles[0] ? ` Falta prioritária: ${team.missingRoles[0]}.` : ' Mantenha uma função de cobertura no meio.'}`;
  }
  if (query.includes('segundo tempo') || query.includes('quem entra')) {
    const options = team.benchSuggestions.slice(0, 3);
    return options.length ? `Para o segundo tempo, as primeiras opções são ${options.map((player) => `${player.name} — ${player.role}`).join('; ')}. Escolha conforme o cenário: resistência para controlar, velocidade para buscar resultado ou cobertura para segurar.` : 'O banco ainda não possui alternativas suficientes fora dos titulares.';
  }
  if (query.includes('formacao') || query.includes('4-2-2-2') || query.includes('time')) {
    return `A ${team.formation} está com prontidão ${team.globalScore}/100. Melhor setor: ${team.strongestLine}. Setor para corrigir: ${team.weakestLine}. ${team.missingRoles[0] ? `Prioridade: ${team.missingRoles[0]}.` : team.styleNote}`;
  }
  if (query.includes('banco') || query.includes('substit')) {
    const validated = players.filter((player) => player.matchCount > 0).sort((a, b) => b.matchAverage - a.matchAverage);
    return validated.length ? `Para o banco, priorize cartas validadas e funções diferentes. Os melhores avaliados são ${validated.slice(0, 3).map((player) => `${player.name} (${player.matchAverage}/5)`).join(', ')}.` : 'Ainda não há partidas suficientes para ordenar o banco por desempenho real. Registre avaliações no Laboratório da Partida.';
  }
  if (query.includes('revis') || query.includes('erro') || query.includes('pendente')) {
    const review = players.filter((player) => player.status !== 'completo' || player.confidence < 75);
    return review.length ? `Revise primeiro: ${review.slice(0, 5).map((player) => `${player.name} (${player.confidence}% de confiança)`).join(', ')}.` : 'Nenhuma carta crítica está pendente. A próxima prioridade é validar as fichas em partidas reais.';
  }
  const top = [...players].sort((a, b) => b.efficiency - a.efficiency).slice(0, 3);
  return `Seu elenco tem ${players.length} jogador(es). Os três melhores índices de ficha são ${top.map((player) => `${player.name} ${player.efficiency}/100`).join(', ')}. A ${team.formation} está em ${team.globalScore}/100, com ${team.weakestLine} como principal ponto de atenção.`;
}

export type MigrationResult = {
  schemaVersion: number;
  migratedAt: string;
  preservedKeys: string[];
  note: string;
};

export function createCentralMigrationReport(existingKeys: string[]): MigrationResult {
  return {
    schemaVersion: CENTRAL_SCHEMA_VERSION,
    migratedAt: new Date().toISOString(),
    preservedKeys: existingKeys,
    note: 'Migração não destrutiva: fichas, Cofre, formações, preferências, partidas, login e atualização continuam nas chaves originais e passam a ser lidos pela Central Inteligente.'
  };
}
