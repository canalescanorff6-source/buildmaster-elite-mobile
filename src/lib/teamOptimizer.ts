import type { AnalysisResult, PositionCode, TacticalFormation, TacticalStyle, TeamMapPhaseScores } from './analyzer';

export type EliteTeamSlot = {
  id: string;
  label: string;
  accepted: PositionCode[];
  desired: string[];
  phase: keyof TeamMapPhaseScores;
};

export type EliteLineupPick = {
  slot: EliteTeamSlot;
  playerName: string | null;
  position: string | null;
  functionLabel: string | null;
  score: number;
  reason: string;
  warning?: string;
};

export type EliteTeamReport = {
  globalScore: number;
  bestFormation: TacticalFormation;
  bestFormationReason: string;
  bestStyle: TacticalStyle;
  bestStyleReason: string;
  lineup: EliteLineupPick[];
  bench: Array<{ playerName: string; position: string; functionLabel: string; score: number; use: string }>;
  roleCoverage: Array<{ label: string; ok: boolean; count: number; note: string }>;
  validators: Array<{ label: string; ok: boolean; note: string }>;
  tacticalAlerts: string[];
  upgradePriorities: string[];
  defensivePlan: string[];
  buildupPlan: string[];
  attackingPlan: string[];
  pressingPlan: string[];
};

const AUTO_FORMATION: TacticalFormation = '4-2-2-2';

const positionPt: Record<PositionCode, string> = {
  CF: 'CA', SS: 'SA', LWF: 'PE', RWF: 'PD', LMF: 'ME', RMF: 'MD', AMF: 'MAT', CMF: 'MLG', DMF: 'VOL', CB: 'ZAG', LB: 'LE', RB: 'LD', GK: 'GOL'
};

const styleName: Record<TacticalStyle, string> = {
  AUTO: 'Automático inteligente',
  POSSE_DE_BOLA: 'Posse de bola',
  CONTRA_ATAQUE: 'Contra-ataque normal',
  CONTRA_ATAQUE_RAPIDO: 'Contra-ataque rápido',
  POR_FORA: 'Por fora',
  PASSE_LONGO: 'Passe longo'
};

const FORMATION_SLOTS: Record<Exclude<TacticalFormation, 'AUTO'>, EliteTeamSlot[]> = {
  '4-2-2-2': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura', 'defensor'], 'cobertura'), slot('ZAG D', ['CB'], ['combate', 'bloqueio'], 'marcacao'),
    slot('LE', ['LB', 'LMF'], ['lateral', 'defensivo'], 'cobertura'), slot('LD', ['RB', 'RMF'], ['lateral', 'defensivo'], 'cobertura'),
    slot('VOL', ['DMF', 'CMF'], ['primeiro volante', 'destruidor', 'proteção'], 'marcacao'), slot('MLG', ['CMF', 'DMF'], ['orquestrador', 'box', 'construtor'], 'saidaDeBola'),
    slot('MAT/ME', ['AMF', 'CMF', 'LMF', 'LWF'], ['criador', 'passe', 'armador'], 'criacao'), slot('MAT/MD', ['AMF', 'CMF', 'RMF', 'RWF'], ['criador', 'passe', 'armador'], 'criacao'),
    slot('CA 1', ['CF', 'SS'], ['finalizador', 'artilheiro'], 'finalizacao'), slot('CA 2', ['CF', 'SS'], ['pivô', 'puxa', 'apoio'], 'finalizacao')
  ],
  '4-3-3': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('LE', ['LB', 'LMF'], ['lateral', 'cruzamento'], 'cobertura'), slot('LD', ['RB', 'RMF'], ['lateral', 'cruzamento'], 'cobertura'),
    slot('VOL', ['DMF', 'CMF'], ['proteção', 'primeiro volante'], 'marcacao'), slot('MLG E', ['CMF', 'AMF', 'DMF'], ['orquestrador', 'passe'], 'saidaDeBola'), slot('MLG D', ['CMF', 'AMF'], ['meia versátil', 'infiltração'], 'criacao'),
    slot('PE', ['LWF', 'LMF', 'SS'], ['ponta', 'drible', 'ala'], 'aceleracao'), slot('PD', ['RWF', 'RMF', 'SS'], ['ponta', 'drible', 'ala'], 'aceleracao'), slot('CA', ['CF', 'SS'], ['finalizador', 'homem de área'], 'finalizacao')
  ],
  '4-1-2-3': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('LE', ['LB', 'LMF'], ['apoio'], 'cobertura'), slot('LD', ['RB', 'RMF'], ['apoio'], 'cobertura'),
    slot('VOL', ['DMF'], ['primeiro volante', 'proteção'], 'marcacao'), slot('MLG', ['CMF', 'AMF'], ['passe', 'orquestrador'], 'saidaDeBola'), slot('MAT', ['AMF', 'CMF', 'SS'], ['armador', 'criador'], 'criacao'),
    slot('PE', ['LWF', 'LMF'], ['ala', 'drible'], 'aceleracao'), slot('PD', ['RWF', 'RMF'], ['ala', 'drible'], 'aceleracao'), slot('CA', ['CF', 'SS'], ['finalizador'], 'finalizacao')
  ],
  '4-2-1-3': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('LE', ['LB'], ['lateral'], 'cobertura'), slot('LD', ['RB'], ['lateral'], 'cobertura'),
    slot('VOL', ['DMF', 'CMF'], ['proteção'], 'marcacao'), slot('MLG', ['CMF', 'DMF'], ['construtor'], 'saidaDeBola'), slot('MAT', ['AMF', 'SS', 'CMF'], ['criador'], 'criacao'),
    slot('PE', ['LWF', 'LMF'], ['ponta'], 'aceleracao'), slot('PD', ['RWF', 'RMF'], ['ponta'], 'aceleracao'), slot('CA', ['CF'], ['finalizador'], 'finalizacao')
  ],
  '4-2-3-1': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('LE', ['LB'], ['lateral'], 'cobertura'), slot('LD', ['RB'], ['lateral'], 'cobertura'),
    slot('VOL', ['DMF', 'CMF'], ['proteção'], 'marcacao'), slot('MLG', ['CMF', 'DMF'], ['orquestrador'], 'saidaDeBola'), slot('MEI E', ['AMF', 'LMF', 'LWF'], ['criador'], 'criacao'), slot('MAT', ['AMF', 'SS'], ['armador'], 'criacao'), slot('MEI D', ['AMF', 'RMF', 'RWF'], ['criador'], 'criacao'), slot('CA', ['CF'], ['pivô', 'finalizador'], 'finalizacao')
  ],
  '4-3-1-2': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('LE', ['LB'], ['lateral'], 'cobertura'), slot('LD', ['RB'], ['lateral'], 'cobertura'),
    slot('VOL', ['DMF', 'CMF'], ['proteção'], 'marcacao'), slot('MLG E', ['CMF', 'DMF'], ['box', 'passe'], 'saidaDeBola'), slot('MLG D', ['CMF', 'AMF'], ['versátil'], 'criacao'), slot('MAT', ['AMF', 'SS'], ['criador'], 'criacao'), slot('CA 1', ['CF', 'SS'], ['finalizador'], 'finalizacao'), slot('CA 2', ['CF', 'SS'], ['pivô', 'apoio'], 'finalizacao')
  ],
  '4-1-3-2': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('LE', ['LB'], ['lateral'], 'cobertura'), slot('LD', ['RB'], ['lateral'], 'cobertura'),
    slot('VOL', ['DMF'], ['proteção'], 'marcacao'), slot('ME', ['LMF', 'LWF', 'CMF'], ['apoio'], 'aceleracao'), slot('MAT', ['AMF', 'CMF'], ['criador'], 'criacao'), slot('MD', ['RMF', 'RWF', 'CMF'], ['apoio'], 'aceleracao'), slot('CA 1', ['CF', 'SS'], ['finalizador'], 'finalizacao'), slot('CA 2', ['CF', 'SS'], ['apoio'], 'finalizacao')
  ],
  '4-4-2': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('LE', ['LB'], ['lateral'], 'cobertura'), slot('LD', ['RB'], ['lateral'], 'cobertura'),
    slot('ME', ['LMF', 'LWF', 'CMF'], ['cruzamento'], 'aceleracao'), slot('VOL/MLG', ['DMF', 'CMF'], ['proteção'], 'marcacao'), slot('MLG', ['CMF', 'AMF'], ['passe'], 'saidaDeBola'), slot('MD', ['RMF', 'RWF', 'CMF'], ['cruzamento'], 'aceleracao'), slot('CA 1', ['CF', 'SS'], ['finalizador'], 'finalizacao'), slot('CA 2', ['CF', 'SS'], ['pivô'], 'finalizacao')
  ],
  '4-1-4-1': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('LE', ['LB'], ['lateral'], 'cobertura'), slot('LD', ['RB'], ['lateral'], 'cobertura'),
    slot('VOL', ['DMF'], ['primeiro volante'], 'marcacao'), slot('ME', ['LMF', 'LWF', 'CMF'], ['apoio'], 'aceleracao'), slot('MLG E', ['CMF', 'AMF'], ['passe'], 'saidaDeBola'), slot('MLG D', ['CMF', 'AMF'], ['criação'], 'criacao'), slot('MD', ['RMF', 'RWF', 'CMF'], ['apoio'], 'aceleracao'), slot('CA', ['CF'], ['pivô', 'finalizador'], 'finalizacao')
  ],
  '3-2-4-1': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG C', ['CB', 'DMF'], ['saída', 'defensor criativo'], 'saidaDeBola'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('VOL', ['DMF', 'CMF'], ['proteção'], 'marcacao'), slot('MLG', ['CMF', 'DMF'], ['orquestrador'], 'saidaDeBola'),
    slot('Ala E', ['LMF', 'LWF', 'LB'], ['ala', 'cruzamento'], 'aceleracao'), slot('MEI E', ['AMF', 'SS', 'CMF'], ['criador'], 'criacao'), slot('MEI D', ['AMF', 'SS', 'CMF'], ['criador'], 'criacao'), slot('Ala D', ['RMF', 'RWF', 'RB'], ['ala', 'cruzamento'], 'aceleracao'), slot('CA', ['CF'], ['finalizador'], 'finalizacao')
  ],
  '3-4-3': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG C', ['CB'], ['defensor'], 'marcacao'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('Ala E', ['LMF', 'LWF', 'LB'], ['cruzamento'], 'aceleracao'), slot('MLG', ['CMF', 'DMF'], ['passe'], 'saidaDeBola'), slot('VOL', ['DMF', 'CMF'], ['proteção'], 'marcacao'), slot('Ala D', ['RMF', 'RWF', 'RB'], ['cruzamento'], 'aceleracao'), slot('PE', ['LWF', 'SS'], ['ponta'], 'aceleracao'), slot('CA', ['CF'], ['finalizador'], 'finalizacao'), slot('PD', ['RWF', 'SS'], ['ponta'], 'aceleracao')
  ],
  '3-5-2': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG C', ['CB'], ['defensor'], 'marcacao'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('Ala E', ['LMF', 'LWF', 'LB'], ['cruzamento'], 'aceleracao'), slot('VOL', ['DMF', 'CMF'], ['proteção'], 'marcacao'), slot('MLG', ['CMF', 'AMF'], ['orquestrador'], 'saidaDeBola'), slot('MAT', ['AMF', 'SS'], ['criador'], 'criacao'), slot('Ala D', ['RMF', 'RWF', 'RB'], ['cruzamento'], 'aceleracao'), slot('CA 1', ['CF', 'SS'], ['finalizador'], 'finalizacao'), slot('CA 2', ['CF', 'SS'], ['pivô'], 'finalizacao')
  ],
  '5-3-2': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG C', ['CB'], ['defensor'], 'marcacao'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('ALA E', ['LB', 'LMF'], ['recomposição'], 'cobertura'), slot('ALA D', ['RB', 'RMF'], ['recomposição'], 'cobertura'), slot('VOL', ['DMF', 'CMF'], ['proteção'], 'marcacao'), slot('MLG', ['CMF', 'AMF'], ['passe'], 'saidaDeBola'), slot('MAT/MLG', ['AMF', 'CMF', 'SS'], ['criador'], 'criacao'), slot('CA 1', ['CF', 'SS'], ['finalizador'], 'finalizacao'), slot('CA 2', ['CF', 'SS'], ['pivô'], 'finalizacao')
  ],
  '5-2-3': [
    slot('GOL', ['GK'], ['goleiro'], 'cobertura'), slot('ZAG E', ['CB'], ['cobertura'], 'cobertura'), slot('ZAG C', ['CB'], ['defensor'], 'marcacao'), slot('ZAG D', ['CB'], ['combate'], 'marcacao'), slot('ALA E', ['LB', 'LMF'], ['recomposição'], 'cobertura'), slot('ALA D', ['RB', 'RMF'], ['recomposição'], 'cobertura'), slot('VOL', ['DMF', 'CMF'], ['proteção'], 'marcacao'), slot('MLG', ['CMF', 'DMF'], ['saída'], 'saidaDeBola'), slot('PE', ['LWF', 'SS'], ['ponta'], 'aceleracao'), slot('CA', ['CF'], ['finalizador'], 'finalizacao'), slot('PD', ['RWF', 'SS'], ['ponta'], 'aceleracao')
  ]
};

function slot(id: string, accepted: PositionCode[], desired: string[], phase: keyof TeamMapPhaseScores): EliteTeamSlot {
  return { id, label: id, accepted, desired, phase };
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function avg(values: number[]) {
  const usable = values.filter((value) => Number.isFinite(value));
  if (!usable.length) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function textOf(result: AnalysisResult) {
  return `${result.bestPosition.label} ${result.buildName} ${result.teamMap?.functionLabel ?? ''} ${result.parsed.playstyle ?? ''}`.toLowerCase();
}

function slotScore(result: AnalysisResult, target: EliteTeamSlot, alreadyPicked: Set<string>) {
  if (alreadyPicked.has(result.parsed.internalId)) return -999;
  const positionMatch = target.accepted.includes(result.bestPosition.code) ? 38 : target.accepted.includes(result.parsed.mainPosition) ? 22 : 0;
  const phaseScore = Number(result.teamMap?.sectorScores?.[target.phase] ?? 55) * 0.38;
  const roleText = textOf(result);
  const desiredScore = target.desired.reduce((score, key) => score + (roleText.includes(key.toLowerCase()) ? 10 : 0), 0);
  const confidence = Number(result.parsed.confidence ?? 60) * 0.08;
  const pointValid = result.trainingPointsUsed <= result.trainingPointsTotal ? 5 : -25;
  return clamp(positionMatch + phaseScore + desiredScore + confidence + pointValid, -100, 100);
}

function formationScore(results: AnalysisResult[], formation: Exclude<TacticalFormation, 'AUTO'>) {
  const picked = new Set<string>();
  const slots = FORMATION_SLOTS[formation];
  let score = 0;
  for (const target of slots) {
    const best = results
      .map((result) => ({ result, score: slotScore(result, target, picked) }))
      .sort((left, right) => right.score - left.score)[0];
    if (best && best.score > 0) {
      picked.add(best.result.parsed.internalId);
      score += best.score;
    }
  }
  return clamp(score / Math.max(1, slots.length));
}

function styleScore(results: AnalysisResult[], style: TacticalStyle) {
  if (style === 'AUTO') return 70;
  const scores = results.map((result) => {
    const phases = result.teamMap?.sectorScores;
    if (!phases) return 60;
    if (style === 'POSSE_DE_BOLA') return avg([phases.passe, phases.criacao, phases.saidaDeBola]);
    if (style === 'CONTRA_ATAQUE_RAPIDO') return avg([phases.aceleracao, phases.finalizacao, phases.passe]);
    if (style === 'CONTRA_ATAQUE') return avg([phases.marcacao, phases.saidaDeBola, phases.finalizacao]);
    if (style === 'POR_FORA') return avg([phases.aceleracao, phases.passe, phases.jogoAereo]);
    if (style === 'PASSE_LONGO') return avg([phases.saidaDeBola, phases.jogoAereo, phases.fisico]);
    return 60;
  });
  return clamp(avg(scores));
}

function chooseBestFormation(results: AnalysisResult[], requested: TacticalFormation): TacticalFormation {
  if (requested !== 'AUTO') return requested;
  return (Object.keys(FORMATION_SLOTS) as Array<Exclude<TacticalFormation, 'AUTO'>>)
    .map((formation) => ({ formation, score: formationScore(results, formation) }))
    .sort((left, right) => right.score - left.score)[0]?.formation ?? AUTO_FORMATION;
}

function chooseBestStyle(results: AnalysisResult[], requested: TacticalStyle): TacticalStyle {
  if (requested !== 'AUTO') return requested;
  return (['POSSE_DE_BOLA', 'CONTRA_ATAQUE', 'CONTRA_ATAQUE_RAPIDO', 'POR_FORA', 'PASSE_LONGO'] as TacticalStyle[])
    .map((style) => ({ style, score: styleScore(results, style) }))
    .sort((left, right) => right.score - left.score)[0]?.style ?? 'CONTRA_ATAQUE_RAPIDO';
}

function buildLineup(results: AnalysisResult[], formation: Exclude<TacticalFormation, 'AUTO'>): EliteLineupPick[] {
  const picked = new Set<string>();
  return FORMATION_SLOTS[formation].map((target) => {
    const best = results
      .map((result) => ({ result, score: slotScore(result, target, picked) }))
      .sort((left, right) => right.score - left.score)[0];
    if (!best || best.score < 35) {
      return {
        slot: target,
        playerName: null,
        position: null,
        functionLabel: null,
        score: 0,
        reason: `faltou jogador salvo para ${target.label}`,
        warning: `salve um jogador ${target.accepted.map((code) => positionPt[code]).join('/')} para fechar essa função`
      };
    }
    picked.add(best.result.parsed.internalId);
    const accepted = target.accepted.includes(best.result.bestPosition.code);
    return {
      slot: target,
      playerName: best.result.parsed.playerName,
      position: best.result.bestPosition.label,
      functionLabel: best.result.teamMap?.functionLabel ?? best.result.buildName,
      score: best.score,
      reason: accepted ? `encaixe natural para ${target.label}` : `encaixe alternativo; confira se a posição é permitida no jogo`,
      warning: accepted ? undefined : 'encaixe improvisado'
    };
  });
}

function countWhere(results: AnalysisResult[], check: (result: AnalysisResult) => boolean) {
  return results.filter(check).length;
}

export function buildEliteTeamReport(results: AnalysisResult[], formation: TacticalFormation, teamStyle: TacticalStyle): EliteTeamReport | null {
  if (!results.length) return null;
  const bestFormation = chooseBestFormation(results, formation);
  const concreteFormation = (bestFormation === 'AUTO' ? AUTO_FORMATION : bestFormation) as Exclude<TacticalFormation, 'AUTO'>;
  const bestStyle = chooseBestStyle(results, teamStyle);
  const lineup = buildLineup(results, concreteFormation);
  const usedNames = new Set(lineup.map((pick) => pick.playerName).filter(Boolean));
  const bench = results
    .filter((result) => !usedNames.has(result.parsed.playerName))
    .map((result) => ({
      playerName: result.parsed.playerName,
      position: result.bestPosition.label,
      functionLabel: result.teamMap?.functionLabel ?? result.buildName,
      score: clamp(Number(result.pri?.GER ?? 70)),
      use: result.teamMap?.matchPlan?.[0] ?? 'usar como alternativa quando precisar mudar o ritmo da partida'
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);

  const phaseAverages = results.map((result) => result.teamMap?.sectorScores).filter(Boolean) as TeamMapPhaseScores[];
  const marcacao = avg(phaseAverages.map((score) => score.marcacao));
  const saida = avg(phaseAverages.map((score) => score.saidaDeBola));
  const criacao = avg(phaseAverages.map((score) => score.criacao));
  const finalizacao = avg(phaseAverages.map((score) => score.finalizacao));
  const cobertura = avg(phaseAverages.map((score) => score.cobertura));
  const fisico = avg(phaseAverages.map((score) => score.fisico));
  const jogoAereo = avg(phaseAverages.map((score) => score.jogoAereo));
  const lineupScore = avg(lineup.map((pick) => pick.score));

  const roleCoverage = [
    coverage('Goleiro salvo', countWhere(results, (r) => r.bestPosition.code === 'GK'), 'necessário para mapa completo e fichas de GOL'),
    coverage('Zagueiros/cobertura', countWhere(results, (r) => ['CB', 'LB', 'RB'].includes(r.bestPosition.code)), 'mínimo de 3 defensores para medir proteção'),
    coverage('VOL de proteção', countWhere(results, (r) => r.bestPosition.code === 'DMF' || /primeiro volante|destruidor|proteção|marcador/i.test(textOf(r))), 'segura contra-ataque e cobre laterais'),
    coverage('Construtor/orquestrador', countWhere(results, (r) => /orquestrador|criativo|armador|clássico|passe|saída/i.test(textOf(r))), 'melhora saída de bola e passe'),
    coverage('Criador final', countWhere(results, (r) => ['AMF', 'SS', 'CMF'].includes(r.bestPosition.code) && Number(r.teamMap?.sectorScores?.criacao ?? 0) >= 74), 'alimenta CA e pontas'),
    coverage('Finalizador claro', countWhere(results, (r) => ['CF', 'SS', 'LWF', 'RWF'].includes(r.bestPosition.code) && Number(r.teamMap?.sectorScores?.finalizacao ?? 0) >= 76), 'transforma criação em gol'),
    coverage('Amplitude/lados', countWhere(results, (r) => ['LWF', 'RWF', 'LMF', 'RMF', 'LB', 'RB'].includes(r.bestPosition.code)), 'abre defesa, cruza e estica campo'),
    coverage('Jogo aéreo/físico', countWhere(results, (r) => Number(r.teamMap?.sectorScores?.jogoAereo ?? 0) >= 76 || Number(r.teamMap?.sectorScores?.fisico ?? 0) >= 80), 'importante para bolas paradas e passe longo')
  ];

  const badPoints = results.filter((result) => result.trainingPointsUsed > result.trainingPointsTotal);
  const duplicateSkills = results.filter((result) => {
    const owned = new Set(result.parsed.nativeSkills.map((skill) => skill.toLowerCase()));
    return result.recommendedSkills.some((skill) => owned.has(skill.toLowerCase()));
  });
  const missingSkills = results.filter((result) => result.recommendedSkills.length < 5);
  const validators = [
    { label: 'Pontos das fichas', ok: badPoints.length === 0, note: badPoints.length ? `${badPoints.length} ficha(s) precisam recalcular pontos` : 'todas as fichas respeitam o orçamento disponível' },
    { label: 'Habilidades repetidas', ok: duplicateSkills.length === 0, note: duplicateSkills.length ? `${duplicateSkills.length} jogador(es) podem ter habilidade repetida` : 'top 5 evita habilidade que a carta já possui' },
    { label: 'Top 5 habilidades', ok: missingSkills.length === 0, note: missingSkills.length ? `${missingSkills.length} jogador(es) têm menos de 5 sugestões seguras` : 'todos têm lista completa de habilidades adicionais' },
    { label: 'Escalação da formação', ok: lineup.every((pick) => pick.playerName), note: lineup.every((pick) => pick.playerName) ? 'os 11 espaços foram preenchidos pelo Cofre' : 'salve mais jogadores para fechar todos os espaços' }
  ];

  const tacticalAlerts: string[] = [];
  if (marcacao < 72) tacticalAlerts.push('Marcação baixa: falta VOL/ZAG com Interceptação, Bloqueador e ímpeto Defesa/Roubo de bola.');
  if (saida < 72) tacticalAlerts.push('Saída de bola baixa: use um defensor criativo, orquestrador ou MLG com passe.');
  if (criacao < 72) tacticalAlerts.push('Criação baixa: falta Armador criativo, Clássico 10, Orquestrador ou SA de apoio.');
  if (finalizacao < 72) tacticalAlerts.push('Finalização baixa: falta CA artilheiro/homem de área com habilidades de chute.');
  if (jogoAereo < 68) tacticalAlerts.push('Jogo aéreo vulnerável: use ZAG/CA com Superioridade aérea, Cabeçada ou ímpeto Bloqueio Aéreo.');
  if (bestStyle === 'POR_FORA' && countWhere(results, (r) => ['LWF', 'RWF', 'LMF', 'RMF', 'LB', 'RB'].includes(r.bestPosition.code)) < 4) tacticalAlerts.push('Por fora exige laterais, alas ou pontas suficientes; salve mais jogadores de lado.');
  if (bestStyle === 'PASSE_LONGO' && jogoAereo < 74) tacticalAlerts.push('Passe longo precisa de alvo físico e segunda bola; hoje o time ainda não sustenta bem essa proposta.');

  const upgradePriorities = [
    marcacao < 76 ? 'Prioridade 1: melhorar VOL/ZAG de marcação e cobertura.' : 'Prioridade 1: manter base defensiva; ela já sustenta o time.',
    saida < 76 ? 'Prioridade 2: adicionar saída de bola com VOL orquestrador ou ZAG defensor criativo.' : 'Prioridade 2: saída de bola está boa; use passes mais verticais.',
    criacao < 76 ? 'Prioridade 3: colocar um criador entre linhas para abastecer o ataque.' : 'Prioridade 3: criação suficiente; foque em finalizador.',
    finalizacao < 76 ? 'Prioridade 4: melhorar CA/SA finalizador com habilidades de chute.' : 'Prioridade 4: ataque tem poder de gol; ajuste só habilidades finas.',
    fisico < 72 ? 'Prioridade 5: falta contato físico para duelos e pressão.' : 'Prioridade 5: físico aceitável para competir.'
  ];

  return {
    globalScore: clamp(avg([lineupScore, marcacao, cobertura, saida, criacao, finalizacao, fisico])),
    bestFormation,
    bestFormationReason: formation === 'AUTO' ? `o app escolheu ${bestFormation} pelo melhor encaixe dos jogadores salvos` : `você escolheu ${bestFormation}; o app mapeou os melhores encaixes dentro dela`,
    bestStyle,
    bestStyleReason: teamStyle === 'AUTO' ? `o estilo mais compatível pelo elenco é ${styleName[bestStyle]}` : `análise ajustada para ${styleName[bestStyle]}`,
    lineup,
    bench,
    roleCoverage,
    validators,
    tacticalAlerts: tacticalAlerts.length ? tacticalAlerts : ['Não há buraco crítico no mapa atual. Continue salvando titulares e reservas para aumentar a precisão.'],
    upgradePriorities,
    defensivePlan: [
      'Defenda primeiro o corredor central: GOL + ZAG + VOL precisam formar a espinha dorsal.',
      'Laterais/alas só sobem juntos se houver VOL de proteção cobrindo.',
      'Use pressão alta apenas com jogadores de fôlego; caso contrário, faça bloco médio.'
    ],
    buildupPlan: [
      'Saída segura começa em ZAG defensor criativo, VOL construtor ou MLG orquestrador.',
      'Evite conduzir com jogador de baixa posse sob pressão; solte no primeiro passe.',
      'Se o adversário pressiona alto, verticalize no SA/CA ou inverta para o lado oposto.'
    ],
    attackingPlan: [
      'Ataque precisa de um finalizador claro e um criador que entregue o último passe.',
      'Se usar Por fora, tenha cruzamento + presença de área; se usar Contra-ataque, tenha aceleração + chute de primeira.',
      'Não tire o CA finalizador da área com habilidade defensiva se a função dele é decidir.'
    ],
    pressingPlan: [
      'Pressione por gatilho: passe ruim, domínio de costas ou lateral sem apoio.',
      'Volta para marcar só sobe no ranking para pontas/SA/meias de recomposição, não para CA artilheiro puro.',
      'A pressão funciona quando o segundo jogador cobre a linha de passe, não quando todo mundo corre sem estrutura.'
    ]
  };
}

function coverage(label: string, count: number, note: string) {
  return { label, count, ok: count > 0, note };
}
