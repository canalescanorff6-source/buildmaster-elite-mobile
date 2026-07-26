import type { TacticalStyle } from './analyzer';
import type { FormationBlueprint, FormationSlot, FormationRoleId } from './formationRoleEngine';
import { FORMATION_ROLE_CATALOG, styleLabel } from './formationRoleEngine';
import type { ManagerRecord } from './managers';

export type TacticalGuide = {
  identity: string;
  passing: string[];
  recycle: string[];
  attack: string[];
  defend: string[];
  offensive: string[];
  defensive: string[];
  avoid: string[];
  whyItWorks: string[];
  keys: string[];
};

export type ManagerFormationFit = {
  manager: ManagerRecord;
  score: number;
  activeProficiency: number;
  source: 'principal' | 'secundaria' | 'adaptada';
  dualProficiency: boolean;
  reasons: string[];
  warnings: string[];
};

function normalizedStyle(style: TacticalStyle): TacticalStyle {
  if (style === 'AUTO' || style === 'POR_FORA') return 'POSSE_DE_BOLA';
  if (style === 'PASSE_LONGO') return 'CONTRA_ATAQUE';
  return style;
}

export function scoreManagerForPlan(manager: ManagerRecord, formation: FormationBlueprint, style: TacticalStyle): ManagerFormationFit {
  const target = normalizedStyle(style);
  const primaryMatch = manager.primaryStyle === target;
  const secondaryMatch = manager.secondaryStyle === target;
  const proficiency = primaryMatch
    ? manager.primaryProficiency
    : secondaryMatch
      ? manager.secondaryProficiency ?? 0
      : Math.max(manager.primaryProficiency - 18, (manager.secondaryProficiency ?? 0) - 18);
  const formationIdeal = formation.idealStyles.map(normalizedStyle).includes(target);
  const dual = Boolean(manager.secondaryStyle && manager.secondaryProficiency);
  let score = Math.round(proficiency * .78 + (formationIdeal ? 16 : 8) + (dual ? 4 : 0));
  if (!primaryMatch && !secondaryMatch) score -= 20;
  score = Math.max(0, Math.min(100, score));
  const reasons = [
    primaryMatch
      ? `Proficiência principal em ${styleLabel(target)}.`
      : secondaryMatch
        ? `Segunda proficiência válida em ${styleLabel(target)}.`
        : 'O estilo escolhido não é uma proficiência cadastrada deste técnico.',
    formationIdeal ? 'O estilo combina com a estrutura da formação.' : 'A formação exige adaptação de cobertura.',
    dual ? 'Técnico híbrido: permite alternar o plano sem trocar o treinador.' : 'Técnico de especialidade única.'
  ];
  const warnings: string[] = [];
  if (!primaryMatch && !secondaryMatch) warnings.push('Use outro técnico para não perder eficiência do estilo coletivo.');
  if (proficiency < 85) warnings.push('Proficiência abaixo da faixa premium definida pelo app.');
  return {
    manager,
    score,
    activeProficiency: proficiency,
    source: primaryMatch ? 'principal' : secondaryMatch ? 'secundaria' : 'adaptada',
    dualProficiency: dual,
    reasons,
    warnings
  };
}

export function rankManagersForPlan(managers: ManagerRecord[], formation: FormationBlueprint, style: TacticalStyle): ManagerFormationFit[] {
  return managers.map((manager) => scoreManagerForPlan(manager, formation, style)).sort((a, b) => b.score - a.score || b.activeProficiency - a.activeProficiency);
}

function roleNames(slot: FormationSlot): string {
  return slot.primaryRoles.map((id) => FORMATION_ROLE_CATALOG[id].officialName).join(' ou ');
}

function hasPosition(formation: FormationBlueprint, position: string): boolean {
  return formation.slots.some((slot) => slot.position === position);
}

function countLine(formation: FormationBlueprint, line: FormationSlot['line']): number {
  return formation.slots.filter((slot) => slot.line === line).length;
}

export function buildTacticalGuide(formation: FormationBlueprint, style: TacticalStyle): TacticalGuide {
  const safeStyle = normalizedStyle(style);
  const hasWingers = hasPosition(formation, 'LWF') || hasPosition(formation, 'RWF') || hasPosition(formation, 'LMF') || hasPosition(formation, 'RMF');
  const hasTwoStrikers = formation.slots.filter((slot) => slot.position === 'CF' || slot.position === 'SS').length >= 2;
  const backThree = formation.slots.filter((slot) => slot.position === 'CB').length === 3;
  const backFive = formation.slots.filter((slot) => ['CB', 'LB', 'RB'].includes(slot.position)).length >= 5;
  const hasDmf = hasPosition(formation, 'DMF');
  const midfielders = countLine(formation, 'meio');

  const stylePassing: Record<string, string[]> = {
    POSSE_DE_BOLA: ['Priorize passes curtos e seguros.', 'Use VOL e MLG para ligar os setores.', 'Encontre MAT ou SA entre as linhas.', 'Acelere somente quando surgir uma vantagem clara.'],
    CONTRA_ATAQUE_RAPIDO: ['Recupere e verticalize com 1 ou 2 toques.', 'Procure primeiro o jogador entre linhas.', 'Use o atacante para fixar a zaga e liberar a corrida dos parceiros.', 'Evite segurar a bola no próprio campo.'],
    CONTRA_ATAQUE: ['Saia com segurança após recuperar.', 'Use passe vertical apenas quando a frente estiver equilibrada.', 'Se o corredor fechar, volte no VOL ou no zagueiro criativo.', 'Aproxime os setores antes do passe longo.']
  };
  const styleRecycle: Record<string, string[]> = {
    POSSE_DE_BOLA: ['Se o centro fechar, volte no VOL ou GOL.', 'Inverta o lado antes de forçar um passe.', 'Reorganize a estrutura e mantenha distâncias curtas.'],
    CONTRA_ATAQUE_RAPIDO: ['Se a primeira bola vertical falhar, recicle imediatamente.', 'Não force passe em profundidade no primeiro toque.', 'Volte ao MLG ou VOL e recomece a transição.'],
    CONTRA_ATAQUE: ['Recolha o bloco quando não houver superioridade.', 'Use o primeiro volante como ponto seguro.', 'Troque o lado para tirar o rival da zona central.']
  };

  const attack = [
    hasTwoStrikers ? 'Combine aproximação e ataque à profundidade entre os atacantes.' : 'Use o CA para fixar os zagueiros e atacar a última linha.',
    hasWingers ? 'Dê amplitude por um lado e infiltre pelo lado oposto.' : 'Crie triângulos por dentro e ataque o espaço entre lateral e zagueiro.',
    midfielders >= 4 ? 'Um meio-campista deve chegar como homem surpresa.' : 'Não avance os dois meias ao mesmo tempo.',
    'Finalize quando a jogada abrir a janela; não chute por obrigação.'
  ];
  const defend = [
    hasDmf ? 'Controle primeiro o VOL para interceptar passes e proteger a entrada da área.' : 'Controle o meia mais recuado e feche o corredor central.',
    backThree ? 'Mantenha os três zagueiros alinhados e use os alas para fechar por fora.' : 'Não arraste os zagueiros; compacte a linha e force o rival para os lados.',
    backFive ? 'Saia da linha de cinco somente com cobertura confirmada.' : 'Os laterais devem retornar rapidamente para recompor a linha de quatro.',
    'Pressione depois da perda apenas quando houver jogadores próximos.'
  ];
  const offensive = [
    hasTwoStrikers ? 'Dois atacantes alternam apoio e profundidade.' : 'O atacante central fixa a última linha.',
    hasWingers ? 'Amplitude para abrir o campo e diagonais para finalizar.' : 'Superioridade numérica e tabelas no corredor central.',
    hasDmf ? 'O VOL sustenta a circulação e permite a chegada dos meias.' : 'A dupla central precisa alternar quem apoia e quem protege.',
    `Funções-chave: ${formation.slots.filter((slot) => slot.line !== 'goleiro').slice(0, 4).map((slot) => `${slot.label} ${roleNames(slot)}`).join(' • ')}.`
  ];
  const defensive = [
    hasDmf ? 'O primeiro volante protege o centro e cobre o lado da bola.' : 'O meia mais defensivo protege o centro.',
    backThree ? 'Três zagueiros compactos, sem perseguições longas.' : 'Linha defensiva curta e bem alinhada.',
    'Intercepte antes de pressionar de forma desordenada.',
    'Feche o centro e conduza o adversário para os corredores.'
  ];
  const avoid = [
    hasWingers ? 'Não ataque com os dois laterais ao mesmo tempo.' : 'Não abra os meias centrais cedo demais.',
    hasDmf ? 'Não retire o VOL do corredor central sem cobertura.' : 'Não deixe a frente da área vazia.',
    safeStyle === 'CONTRA_ATAQUE_RAPIDO' ? 'Não force o passe em profundidade no primeiro toque.' : 'Não acelere toda jogada; reconheça o momento de reciclar.'
  ];
  const why = [
    formation.behavior,
    hasTwoStrikers ? 'Mantém presença de área sem perder apoio entre linhas.' : 'Cria uma referência ofensiva clara.',
    hasDmf ? 'Protege o setor central e dá uma saída segura.' : 'Distribui a cobertura entre os meias.',
    `O plano de ${styleLabel(safeStyle)} recebe apoio da estrutura ${formation.name}.`
  ];
  const keys = safeStyle === 'POSSE_DE_BOLA'
    ? ['Paciência', 'Linhas curtas', 'Triângulos', 'Movimento sem bola']
    : safeStyle === 'CONTRA_ATAQUE_RAPIDO'
      ? ['Verticalidade', 'Aceleração', 'Pressão pós-perda', 'Finalização rápida']
      : ['Equilíbrio', 'Proteção central', 'Transição segura', 'Disciplina'];

  return {
    identity: `${formation.name} • ${styleLabel(safeStyle)} • ${formation.family === 'extra' ? 'personalizada/meta' : formation.family === 'personalizada' ? 'criada por você' : 'base do app'}`,
    passing: stylePassing[safeStyle] ?? stylePassing.POSSE_DE_BOLA,
    recycle: styleRecycle[safeStyle] ?? styleRecycle.POSSE_DE_BOLA,
    attack,
    defend,
    offensive,
    defensive,
    avoid,
    whyItWorks: why,
    keys
  };
}

export function recommendedRoleForSlot(slot: FormationSlot, style: TacticalStyle): FormationRoleId {
  const safeStyle = normalizedStyle(style);
  const primary = [...slot.primaryRoles];
  if (safeStyle === 'POSSE_DE_BOLA') {
    const preferred: FormationRoleId[] = ['armador-criativo', 'meia-versatil', 'defensor-criativo', 'primeiro-volante', 'infiltracao', 'artilheiro'];
    return preferred.find((role) => primary.includes(role)) ?? primary[0];
  }
  if (safeStyle === 'CONTRA_ATAQUE_RAPIDO') {
    const preferred: FormationRoleId[] = ['artilheiro', 'infiltracao', 'meia-versatil', 'primeiro-volante', 'zagueiro-destruidor', 'lateral-defensivo'];
    return preferred.find((role) => primary.includes(role)) ?? primary[0];
  }
  const preferred: FormationRoleId[] = ['primeiro-volante', 'lateral-defensivo', 'defensor-criativo', 'artilheiro', 'meia-versatil'];
  return preferred.find((role) => primary.includes(role)) ?? primary[0];
}
