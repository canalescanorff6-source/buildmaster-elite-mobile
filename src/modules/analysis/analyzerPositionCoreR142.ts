// R142 — núcleo de posição/atributos extraído do analyzer monolítico.
// Não escreve ficha, Top 5 ou Ímpeto: somente calcula evidência/score funcional.
import { normalize } from '../analysis/analyzerTextUtilsR130';
import { BASE_BY_POSITION, SKILL_PROFILES } from '../analysis/analyzerCatalog';
import type { Attributes, ParsedCard, PositionCode, PositionRatings } from '../../lib/analyzerDomain';

export function clamp(value: number, min = 1, max = 110) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function clampDecimal(value: number, min = 1, max = 110) {
  return Math.max(min, Math.min(max, Number(value.toFixed(1))));
}

export function avg(...values: Array<number | undefined>) {
  const usable = values.filter((value): value is number => Number.isFinite(value));
  if (!usable.length) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

export function styleText(playstyle?: string | null) {
  return normalize(playstyle ?? '').toLowerCase();
}

export function preferredPositionsByPlaystyle(playstyle?: string | null): PositionCode[] {
  const style = styleText(playstyle);

  if (/homem de area|fox in the box|pivo|atacante pivo|target man|atacante matador|artilheiro|goal poacher|puxa marcacao|puxa marcação/.test(style)) return ['CF', 'SS'];
  if (/destruidor|destroyer/.test(style)) return ['DMF', 'CMF', 'CB'];
  if (/1(?:º|o)?\s*volante|primeiro volante|ancora|anchor man/.test(style)) return ['DMF', 'CMF', 'CB'];
  if (/meia versatil|box-to-box|todo campo/.test(style)) return ['CMF', 'DMF', 'AMF', 'LMF', 'RMF'];
  if (/orquestrador|orchestrator/.test(style)) return ['CMF', 'DMF', 'AMF'];
  if (/defensor criativo|construtor|build up/.test(style)) return ['CB', 'DMF', 'CMF'];
  if (/lateral defensivo|defensive full/.test(style)) return ['LB', 'RB', 'CB', 'DMF'];
  if (/lateral ofensivo|lateral atacante|offensive full/.test(style)) return ['LB', 'RB', 'LMF', 'RMF'];
  if (/ala produtivo|lateral movel|ponta prolifico|prolific winger|flanco movel|roaming flank|perito em cruzamento/.test(style)) return ['LWF', 'RWF', 'LMF', 'RMF', 'LB', 'RB'];
  if (/armador criativo|criador de jogadas|creative playmaker|classico n[oº]?\s*10/.test(style)) return ['AMF', 'CMF', 'SS'];
  if (/jogador de infiltracao|jogador sem bola|hole player|atacante surpresa/.test(style)) return ['AMF', 'SS', 'CMF', 'CF'];
  if (/goleiro ofensivo|goleiro defensivo/.test(style)) return ['GK'];
  return [];
}

export function midfieldPriority(mainPosition: PositionCode, style: string): PositionCode[] {
  // MLG/VOL/MAT/ME/MD podem vir com vários estilos. O estilo orienta a função, mas a posição da carta continua forte.
  if (/destruidor|destroyer/.test(style)) {
    if (mainPosition === 'CB') return ['CB', 'DMF', 'CMF'];
    if (mainPosition === 'CMF') return ['CMF', 'DMF', 'CB'];
    if (mainPosition === 'DMF') return ['DMF', 'CMF', 'CB'];
    if (mainPosition === 'AMF') return ['CMF', 'AMF', 'DMF'];
    if (mainPosition === 'LMF' || mainPosition === 'RMF') return [mainPosition, 'CMF', 'DMF'];
  }
  if (/1(?:º|o)?\s*volante|primeiro volante|ancora|anchor man/.test(style)) {
    if (mainPosition === 'CB') return ['CB', 'DMF', 'CMF'];
    if (mainPosition === 'CMF') return ['CMF', 'DMF', 'CB'];
    return ['DMF', 'CMF', 'CB'];
  }
  if (/meia versatil|box-to-box|todo campo/.test(style)) {
    if (mainPosition === 'LMF' || mainPosition === 'RMF') return [mainPosition, 'CMF', 'AMF', 'DMF'];
    if (mainPosition === 'DMF') return ['DMF', 'CMF', 'AMF'];
    return ['CMF', 'AMF', 'DMF', 'LMF', 'RMF'];
  }
  if (/orquestrador|orchestrator/.test(style)) {
    if (mainPosition === 'DMF') return ['DMF', 'CMF', 'CB'];
    return ['CMF', 'DMF', 'AMF'];
  }
  if (/armador criativo|criador de jogadas|creative playmaker|classico n[oº]?\s*10/.test(style)) {
    if (mainPosition === 'CMF') return ['CMF', 'AMF', 'SS'];
    if (mainPosition === 'LMF' || mainPosition === 'RMF') return [mainPosition, 'AMF', 'CMF'];
    return ['AMF', 'CMF', 'SS'];
  }
  if (/jogador de infiltracao|jogador sem bola|hole player|atacante surpresa/.test(style)) {
    if (mainPosition === 'CMF') return ['CMF', 'AMF', 'SS'];
    if (mainPosition === 'LMF' || mainPosition === 'RMF') return [mainPosition, 'AMF', 'CMF'];
    return ['AMF', 'SS', 'CMF', 'CF'];
  }
  return [];
}

export function gameplayPriorityByMainPosition(mainPosition: PositionCode, playstyle?: string | null): PositionCode[] {
  const style = styleText(playstyle);

  const midfield = midfieldPriority(mainPosition, style);
  if (midfield.length) return midfield;

  if (/homem de area|fox in the box|pivo|atacante pivo|target man|puxa marcacao|puxa marcação|atacante matador|artilheiro|goal poacher/.test(style)) {
    if (mainPosition === 'SS') return ['SS', 'CF', 'AMF'];
    return ['CF', 'SS'];
  }

  if (/defensor criativo|construtor|build up/.test(style)) {
    if (mainPosition === 'DMF') return ['DMF', 'CB', 'CMF'];
    if (mainPosition === 'CMF') return ['CMF', 'DMF', 'CB'];
    return ['CB', 'DMF', 'CMF'];
  }

  if (/lateral defensivo|defensive full/.test(style)) {
    if (mainPosition === 'LB' || mainPosition === 'RB') return [mainPosition, 'CB', 'DMF'];
    return [mainPosition, 'DMF', 'CB'];
  }

  if (/lateral ofensivo|lateral atacante|offensive full/.test(style)) {
    if (mainPosition === 'LB' || mainPosition === 'RB') return [mainPosition, mainPosition === 'LB' ? 'LMF' : 'RMF', 'CMF'];
    return [mainPosition, 'LMF', 'RMF', 'LB', 'RB'];
  }

  if (/ala produtivo|lateral movel|ponta prolifico|prolific winger|flanco movel|roaming flank|perito em cruzamento/.test(style)) {
    if (mainPosition === 'LWF' || mainPosition === 'RWF') return [mainPosition, mainPosition === 'LWF' ? 'LMF' : 'RMF', 'SS'];
    if (mainPosition === 'LMF' || mainPosition === 'RMF') return [mainPosition, mainPosition === 'LMF' ? 'LWF' : 'RWF', mainPosition === 'LMF' ? 'LB' : 'RB'];
    if (mainPosition === 'LB' || mainPosition === 'RB') return [mainPosition, mainPosition === 'LB' ? 'LMF' : 'RMF'];
  }

  if (/goleiro ofensivo|goleiro defensivo/.test(style)) return ['GK'];

  return preferredPositionsByPlaystyle(playstyle);
}

export function gameplayPositionWeight(position: PositionCode, mainPosition: PositionCode, playstyle?: string | null) {
  const preferred = gameplayPriorityByMainPosition(mainPosition, playstyle);
  const primaryBonus = position === mainPosition ? 135 : 0;
  const preferredIndex = preferred.indexOf(position);
  const functionBonus = preferredIndex >= 0 ? 110 - preferredIndex * 24 : 0;
  const style = styleText(playstyle);

  let penalty = 0;
  const centralPositions: PositionCode[] = ['DMF', 'CMF', 'AMF', 'CB'];
  const widePositions: PositionCode[] = ['LB', 'RB', 'LMF', 'RMF', 'LWF', 'RWF'];

  if (/destruidor|primeiro volante|ancora|anchor man|destroyer/.test(style)) {
    if ((position === 'LB' || position === 'RB') && mainPosition !== 'LB' && mainPosition !== 'RB') penalty -= 95;
    if (position === 'LWF' || position === 'RWF' || position === 'CF' || position === 'SS') penalty -= 95;
  }

  if (/meia versatil|box-to-box|todo campo/.test(style)) {
    if ((position === 'LB' || position === 'RB') && mainPosition !== 'LB' && mainPosition !== 'RB') penalty -= 55;
    if (position === 'CF' || position === 'GK') penalty -= 90;
  }

  if (/orquestrador|armador criativo|criador de jogadas|classico n[oº]?\s*10/.test(style)) {
    if (position === 'LB' || position === 'RB' || position === 'CB' || position === 'GK') penalty -= 70;
    if (position === 'CF' && mainPosition !== 'CF') penalty -= 55;
  }

  if (/jogador de infiltracao|jogador sem bola|hole player|atacante surpresa/.test(style)) {
    if (position === 'LB' || position === 'RB' || position === 'CB' || position === 'GK') penalty -= 80;
  }

  if (/homem de area|fox in the box|pivo|atacante pivo|target man|atacante matador|artilheiro|goal poacher|puxa marcacao|puxa marcação/.test(style)) {
    if (widePositions.includes(position) && mainPosition !== 'LWF' && mainPosition !== 'RWF') penalty -= 65;
    if (['LB', 'RB', 'CB', 'DMF', 'GK'].includes(position)) penalty -= 90;
  }

  if (/lateral ofensivo|lateral defensivo|lateral atacante|ala produtivo|lateral movel|perito em cruzamento/.test(style)) {
    if (centralPositions.includes(position) && mainPosition !== 'CMF' && mainPosition !== 'DMF') penalty -= 35;
    if (position === 'CF' || position === 'GK') penalty -= 85;
  }

  return primaryBonus + functionBonus + penalty;
}

export function fillAttributes(parsed: Pick<ParsedCard, 'mainPosition' | 'maxOverall' | 'overall' | 'attributes'>): Required<Attributes> {
  const base = BASE_BY_POSITION[parsed.mainPosition];

  // Regra canônica v39.20: GER/Overall é somente metadado visual da carta.
  // Ele nunca pode preencher, aumentar ou diminuir atributos ausentes, porque
  // pequenas variações do OCR criariam fichas, habilidades e Ímpetos diferentes
  // para a mesma versão. A base determinística da posição cobre apenas campos
  // realmente ausentes; todo atributo lido continua soberano.
  const deterministicBase = Object.fromEntries(
    Object.entries(base).map(([key, value]) => [key, clamp(Number(value))])
  ) as Required<Attributes>;
  return { ...deterministicBase, ...parsed.attributes } as Required<Attributes>;
}

function applySkillBoosts(scores: Record<string, number>, skills: string[]) {
  const boosted = { ...scores };
  for (const skill of skills) {
    const boosts = SKILL_PROFILES[skill]?.boosts ?? {};
    for (const [key, value] of Object.entries(boosts)) {
      boosted[key] = clampDecimal((boosted[key] ?? 0) + Number(value), 1, 110);
    }
  }
  return boosted;
}

export function playstylePositionBonus(position: PositionCode, playstyle?: string | null) {
  const style = normalize(playstyle ?? '').toLowerCase();
  if (!style) return 0;

  // O motor local não pode jogar um centroavante de área para PE só porque o OCR confundiu a grade.
  if (/homem de area|atacante matador|pivo|target man|fox/.test(style)) {
    if (position === 'CF') return 26;
    if (position === 'SS') return 10;
    if (position === 'LWF' || position === 'RWF' || position === 'LMF' || position === 'RMF') return -20;
    return -8;
  }

  if (/artilheiro|goal poacher/.test(style)) {
    if (position === 'CF') return 18;
    if (position === 'SS') return 8;
    if (position === 'LWF' || position === 'RWF') return -8;
  }

  if (/ponta prolifico|flanco movel|roaming flank|prolific winger/.test(style)) {
    if (position === 'LWF' || position === 'RWF') return 18;
    if (position === 'LMF' || position === 'RMF') return 10;
    if (position === 'CF') return -8;
  }

  if (/criador de jogadas|jogador sem bola|creative|hole player/.test(style)) {
    if (position === 'AMF' || position === 'SS') return 16;
    if (position === 'CMF') return 8;
  }

  if (/orquestrador|ancora|anchor|box-to-box|todo campo/.test(style)) {
    if (position === 'CMF' || position === 'DMF') return 16;
    if (position === 'AMF') return 5;
  }

  if (/destruidor|destroyer/.test(style)) {
    if (position === 'DMF') return 22;
    if (position === 'CMF') return 22;
    if (position === 'CB') return 12;
    if (position === 'LB' || position === 'RB') return -10;
    if (position === 'LWF' || position === 'RWF' || position === 'CF' || position === 'SS') return -20;
  }

  if (/construtor|build up/.test(style)) {
    if (position === 'CB') return 18;
    if (position === 'DMF') return 8;
  }

  if (/lateral ofensivo|lateral defensivo|full/.test(style)) {
    if (position === 'LB' || position === 'RB') return 18;
    if (position === 'LMF' || position === 'RMF') return 6;
  }

  return 0;
}

export function preferredPositionFromPlaystyle(playstyle: string | null | undefined, ratings: PositionRatings, attributes: Attributes): PositionCode | null {
  const style = normalize(playstyle ?? '').toLowerCase();
  const hasGoodRating = (code: PositionCode) => Number(ratings[code] ?? 0) >= 75;
  const rating = (code: PositionCode) => Number(ratings[code] ?? 0);

  // Esta função só é usada quando o OCR não conseguiu ler claramente a posição grande da carta.
  // Por isso ela prefere FUNÇÃO REAL antes do maior overall da grade. Ex.: Gattuso/Tchouaméni
  // podem ter CB/LE com nota maior, mas DMF/VOL continua sendo a função principal de gameplay.
  if (/homem de area|atacante matador|pivo|target man|fox|artilheiro|goal poacher|puxa marcacao|puxa marcação/.test(style)) return 'CF';

  if (/destruidor|destroyer/.test(style)) {
    if (hasGoodRating('DMF')) return 'DMF';
    if (hasGoodRating('CMF')) return 'CMF';
    if (hasGoodRating('CB')) return 'CB';
    return 'DMF';
  }

  if (/primeiro volante|ancora|anchor/.test(style)) {
    if (hasGoodRating('DMF')) return 'DMF';
    if (hasGoodRating('CMF')) return 'CMF';
    if (hasGoodRating('CB')) return 'CB';
    return 'DMF';
  }

  if (/meia versatil|box-to-box|todo campo/.test(style)) {
    if (hasGoodRating('CMF')) return 'CMF';
    if (hasGoodRating('DMF')) return 'DMF';
    if (hasGoodRating('AMF')) return 'AMF';
    return 'CMF';
  }

  if (/orquestrador|orchestrator/.test(style)) {
    if (hasGoodRating('DMF') && rating('DMF') >= rating('CMF') - 3) return 'DMF';
    if (hasGoodRating('CMF')) return 'CMF';
    if (hasGoodRating('AMF')) return 'AMF';
    return 'CMF';
  }

  if (/armador criativo|criador de jogadas|creative|classico n[oº]?\s*10/.test(style)) {
    if (hasGoodRating('AMF')) return 'AMF';
    if (hasGoodRating('SS')) return 'SS';
    if (hasGoodRating('CMF')) return 'CMF';
    return 'AMF';
  }

  if (/jogador de infiltracao|jogador sem bola|hole player|atacante surpresa/.test(style)) {
    if (hasGoodRating('AMF')) return 'AMF';
    if (hasGoodRating('SS')) return 'SS';
    if (hasGoodRating('CMF')) return 'CMF';
    return 'AMF';
  }

  if (/ala produtivo|lateral movel|ponta prolifico|flanco movel|roaming flank|prolific winger/.test(style)) {
    if (hasGoodRating('RWF') && rating('RWF') >= rating('LWF')) return 'RWF';
    if (hasGoodRating('LWF')) return 'LWF';
    if (hasGoodRating('RMF') && rating('RMF') >= rating('LMF')) return 'RMF';
    if (hasGoodRating('LMF')) return 'LMF';
    return 'RWF';
  }

  if (/perito em cruzamento|cross specialist/.test(style)) {
    if (hasGoodRating('RMF') && rating('RMF') >= rating('LMF')) return 'RMF';
    if (hasGoodRating('LMF')) return 'LMF';
    if (hasGoodRating('RWF') && rating('RWF') >= rating('LWF')) return 'RWF';
    if (hasGoodRating('LWF')) return 'LWF';
    return 'RMF';
  }

  if (/lateral ofensivo|lateral atacante|offensive full|full\s*back\s*finisher/.test(style)) return hasGoodRating('RB') && rating('RB') >= rating('LB') ? 'RB' : 'LB';
  if (/lateral defensivo|defensive full/.test(style)) return hasGoodRating('RB') && rating('RB') >= rating('LB') ? 'RB' : 'LB';
  if (/goleiro/.test(style)) return 'GK';
  if ((attributes.finishing ?? 0) >= 82 && (attributes.defensiveAwareness ?? 0) < 70) return 'CF';
  return null;
}

export function positionScore(position: PositionCode, a: Required<Attributes>, skills: string[], positionRatings: PositionRatings) {
  const skillBonus = (names: string[]) => names.reduce((sum, skill) => sum + (skills.includes(skill) ? 1.5 : 0), 0);
  const scores: Record<PositionCode, number> = {
    CF: avg(a.offensiveAwareness, a.finishing, a.kickingPower, a.heading, a.physicalContact, a.speed) + skillBonus(['Chute de primeira', 'Precisão à distância', 'Cabeçada', 'Superioridade aérea', 'Finalização acrobática']),
    SS: avg(a.offensiveAwareness, a.ballControl, a.dribbling, a.tightPossession, a.finishing, a.acceleration, a.balance, a.lowPass) + skillBonus(['Toque duplo', 'Controle com a sola', 'Passe de primeira', 'Chute de primeira']),
    LWF: avg(a.speed, a.acceleration, a.dribbling, a.ballControl, a.tightPossession, a.curl, a.finishing, a.balance) + skillBonus(['Toque duplo', 'Controle com a sola', 'Elástico', 'Cruzamento preciso']),
    RWF: avg(a.speed, a.acceleration, a.dribbling, a.ballControl, a.tightPossession, a.curl, a.finishing, a.balance) + skillBonus(['Toque duplo', 'Controle com a sola', 'Elástico', 'Cruzamento preciso']),
    LMF: avg(a.speed, a.acceleration, a.stamina, a.dribbling, a.loftedPass, a.lowPass, a.defensiveAwareness) + skillBonus(['Cruzamento preciso', 'Passe de primeira', 'Volta para marcar']),
    RMF: avg(a.speed, a.acceleration, a.stamina, a.dribbling, a.loftedPass, a.lowPass, a.defensiveAwareness) + skillBonus(['Cruzamento preciso', 'Passe de primeira', 'Volta para marcar']),
    AMF: avg(a.lowPass, a.loftedPass, a.ballControl, a.tightPossession, a.dribbling, a.offensiveAwareness, a.curl) + skillBonus(['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe sem olhar']),
    CMF: avg(a.lowPass, a.loftedPass, a.ballControl, a.stamina, a.defensiveAwareness, a.tackling, a.physicalContact) + skillBonus(['Passe de primeira', 'Interceptação', 'Espírito guerreiro']),
    DMF: avg(a.defensiveAwareness, a.tackling, a.defensiveEngagement, a.aggression, a.physicalContact, a.stamina, a.lowPass) + skillBonus(['Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar']),
    CB: avg(a.defensiveAwareness, a.tackling, a.defensiveEngagement, a.physicalContact, a.heading, a.jump, a.aggression) + skillBonus(['Bloqueador', 'Interceptação', 'Superioridade aérea', 'Marcação individual']),
    LB: avg(a.speed, a.acceleration, a.stamina, a.defensiveAwareness, a.tackling, a.loftedPass, a.dribbling) + skillBonus(['Cruzamento preciso', 'Interceptação', 'Volta para marcar']),
    RB: avg(a.speed, a.acceleration, a.stamina, a.defensiveAwareness, a.tackling, a.loftedPass, a.dribbling) + skillBonus(['Cruzamento preciso', 'Interceptação', 'Volta para marcar']),
    GK: avg(a.goalkeeperAwareness, a.goalkeeperCatching, a.goalkeeperParrying, a.goalkeeperReflexes, a.goalkeeperReach, a.jump) + skillBonus(['Liderança', 'Espírito guerreiro'])
  };
  const cardRating = positionRatings[position];
  // GER por posição é apenas desempate leve. O ranking principal vem de atributos + função.
  const ratingBlend = cardRating ? (scores[position] * 0.88 + cardRating * 0.12) : scores[position];
  return clampDecimal(ratingBlend, 1, 100);
}

export function roleName(position: PositionCode, a: Required<Attributes>) {
  if (position === 'CF') return a.heading >= 80 && a.physicalContact >= 78 ? 'finalizador de área' : 'atacante móvel';
  if (position === 'SS') return a.lowPass >= 80 ? 'segundo atacante criativo' : 'segundo atacante agressivo';
  if (position === 'AMF') return 'armador ofensivo';
  if (position === 'CMF') return a.defensiveAwareness >= 75 ? 'meia box-to-box' : 'meia de distribuição';
  if (position === 'DMF') return a.tackling >= 80 ? 'volante destruidor' : 'volante construtor';
  if (position === 'CB') return a.speed >= 78 ? 'zagueiro de cobertura' : 'zagueiro físico';
  if (position === 'LB' || position === 'RB') return a.loftedPass >= 80 ? 'lateral de apoio' : 'lateral marcador';
  if (position === 'LMF' || position === 'RMF') return 'meia lateral intenso';
  if (position === 'LWF' || position === 'RWF') return a.finishing >= 80 ? 'ponta finalizador' : 'ponta criador';
  return 'goleiro';
}

export function calculatePri(position: PositionCode, a: Required<Attributes>, skills: string[]) {
  const scores = {
    finishing: avg(a.finishing, a.offensiveAwareness, a.kickingPower, a.heading, a.curl),
    creation: avg(a.lowPass, a.loftedPass, a.ballControl, a.tightPossession, a.curl),
    dribbling: avg(a.dribbling, a.ballControl, a.tightPossession, a.balance),
    mobility: avg(a.speed, a.acceleration, a.balance, a.stamina),
    pressure: avg(a.stamina, a.aggression, a.defensiveEngagement, a.speed),
    defense: avg(a.defensiveAwareness, a.tackling, a.defensiveEngagement, a.aggression, a.physicalContact),
    physical: avg(a.physicalContact, a.jump, a.balance, a.stamina),
    stamina: a.stamina,
    aerial: avg(a.heading, a.jump, a.physicalContact)
  };
  const boosted = applySkillBoosts(scores, skills);
  const weights: Record<PositionCode, Record<string, number>> = {
    CF: { finishing: 2, aerial: 1.15, physical: 1, mobility: .8, creation: .45 },
    SS: { finishing: 1.2, creation: 1.1, dribbling: 1.25, mobility: 1 },
    LWF: { dribbling: 1.3, mobility: 1.25, finishing: .95, creation: .85 },
    RWF: { dribbling: 1.3, mobility: 1.25, finishing: .95, creation: .85 },
    LMF: { mobility: 1.15, creation: 1.05, pressure: 1, defense: .8, stamina: 1 },
    RMF: { mobility: 1.15, creation: 1.05, pressure: 1, defense: .8, stamina: 1 },
    AMF: { creation: 1.7, dribbling: 1.15, finishing: .8, mobility: .75 },
    CMF: { creation: 1.05, defense: 1.0, pressure: 1, stamina: 1.2, physical: .75 },
    DMF: { defense: 1.8, pressure: 1.25, physical: 1, creation: .6, stamina: 1 },
    CB: { defense: 2, physical: 1.1, aerial: 1, mobility: .55, pressure: .8 },
    LB: { mobility: 1.15, defense: 1.0, creation: .95, pressure: .95, stamina: 1.05 },
    RB: { mobility: 1.15, defense: 1.0, creation: .95, pressure: .95, stamina: 1.05 },
    GK: { defense: 1 }
  };
  const weight = weights[position];
  const totalWeight = Object.values(weight).reduce((sum, value) => sum + value, 0);
  const overall = Object.entries(weight).reduce((sum, [key, value]) => sum + (boosted[key] ?? 0) * value, 0) / Math.max(1, totalWeight);
  return Object.fromEntries([...Object.entries(boosted), ['overall', clampDecimal(overall)]].map(([key, value]) => [key, clampDecimal(Number(value))]));
}

export function calculateTacticalFit(position: PositionCode, a: Required<Attributes>, pri: Record<string, number>) {
  return {
    possession: clampDecimal(avg(pri.creation, pri.dribbling, a.lowPass, a.ballControl) / 10, 1, 10),
    quickCounter: clampDecimal(avg(pri.mobility, pri.finishing, a.speed, a.acceleration) / 10, 1, 10),
    longBallCounter: clampDecimal(avg(pri.physical, pri.aerial, pri.defense, a.speed) / 10, 1, 10),
    outWide: clampDecimal(avg(position === 'CF' ? pri.aerial : pri.creation, a.loftedPass, a.speed, a.stamina) / 10, 1, 10),
    longBall: clampDecimal(avg(pri.physical, pri.aerial, a.kickingPower, a.loftedPass) / 10, 1, 10)
  };
}

export function detectMainPosition(positions: PositionCode[], positionRatings: PositionRatings, attributes: Attributes, playstyle?: string | null): PositionCode {
  const preferred = preferredPositionFromPlaystyle(playstyle, positionRatings, attributes);
  const validRatings = Object.entries(positionRatings)
    .filter((entry): entry is [PositionCode, number] => Number.isFinite(entry[1]) && Number(entry[1]) >= 40 && Number(entry[1]) <= 110)
    .sort((a, b) => Number(b[1]) - Number(a[1]));

  const bestRating = validRatings[0]?.[1] ?? 0;

  // Se a função real indica uma posição e ela aparece com nota plausível, usamos ela antes do maior overall.
  // Isso impede casos como DMF/VOL destruidor ir para LE/ZAG só porque a grade deu rating maior.
  if (preferred) {
    const preferredRating = Number(positionRatings[preferred] ?? 0);
    if (!positions.length || positions.includes(preferred) || preferredRating >= 70) {
      if (!bestRating || preferredRating >= bestRating - 16) return preferred;
    }
  }

  const stylePriority = gameplayPriorityByMainPosition(preferred ?? (positions[0] ?? 'SS'), playstyle);
  for (const code of stylePriority) {
    const rating = Number(positionRatings[code] ?? 0);
    if (rating >= 70 && (!bestRating || rating >= bestRating - 14)) return code;
  }

  const fromRatings = validRatings[0]?.[0];
  if (fromRatings) return fromRatings;
  if (positions[0]) return positions[0];
  if (preferred) return preferred;
  if ((attributes.defensiveAwareness ?? 0) >= 76 && (attributes.lowPass ?? 0) >= 72) return 'DMF';
  if ((attributes.finishing ?? 0) >= 80) return 'CF';
  return 'SS';
}
