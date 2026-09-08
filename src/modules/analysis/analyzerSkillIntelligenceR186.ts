import { normalize } from './analyzerTextUtilsR130';
import { styleText } from './analyzerPositionCoreR142';
import { isGoalkeeperStyle } from '../builds/trainingOptimizer';
import { SKILL_PROFILES, SPECIAL_SKILL_NAMES, isOfficialAdditionalSkill } from './analyzerCatalog';
import { buildOwnedSkillKeys, canonicalizeSkillList, filterComplementaryAdditionalSkills, skillIdentityKey } from '../../lib/officialSkillIdentity';
import { type Attributes, type ImpetoRecommendation, type Objective, type ParsedCard, type PositionCode, type PositionRatings, type SkillRecommendation, POSITION_PT } from '../../lib/analyzerDomain';

function skillKey(skill: string): string {
  return skillIdentityKey(skill);
}

export function uniqueSkillList(skills: string[]) {
  return canonicalizeSkillList(skills).filter((skill) => Boolean(SKILL_PROFILES[skill]));
}

function skillPriority(position: PositionCode, objective: Objective) {
  const byPosition: Record<PositionCode, string[]> = {
    CF: ['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Efeito de longe', 'Cabeçada', 'Controle da cavadinha', 'Toque de calcanhar', 'Passe de primeira', 'Super substituto'],
    SS: ['Toque duplo', 'Controle com a sola', 'Passe de primeira', 'Passe em profundidade', 'Chute de primeira', 'Precisão à distância', 'Toque de calcanhar'],
    LWF: ['Toque duplo', 'Controle com a sola', 'Elástico', 'Cruzamento preciso', 'Curva para fora', 'Precisão à distância', 'Passe de primeira'],
    RWF: ['Toque duplo', 'Controle com a sola', 'Elástico', 'Cruzamento preciso', 'Curva para fora', 'Precisão à distância', 'Passe de primeira'],
    LMF: ['Cruzamento preciso', 'Passe de primeira', 'Passe na medida', 'Interceptação', 'Volta para marcar', 'Curva para fora'],
    RMF: ['Cruzamento preciso', 'Passe de primeira', 'Passe na medida', 'Interceptação', 'Volta para marcar', 'Curva para fora'],
    AMF: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe sem olhar', 'Controle com a sola', 'Curva para fora', 'Toque duplo'],
    CMF: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Interceptação', 'Espírito guerreiro', 'Volta para marcar'],
    DMF: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Passe de primeira', 'Espírito guerreiro'],
    CB: ['Bloqueador', 'Interceptação', 'Marcação individual', 'Superioridade aérea', 'Carrinho', 'Afastamento acrobático', 'Espírito guerreiro'],
    LB: ['Cruzamento preciso', 'Passe de primeira', 'Interceptação', 'Volta para marcar', 'Bloqueador', 'Curva para fora'],
    RB: ['Cruzamento preciso', 'Passe de primeira', 'Interceptação', 'Volta para marcar', 'Bloqueador', 'Curva para fora'],
    GK: ['Liderança', 'Espírito guerreiro']
  };
  if (position === 'GK') return byPosition.GK;
  const extras: Record<Objective, string[]> = {
    COMPETITIVE: ['Espírito guerreiro', 'Passe de primeira'],
    FINISHER: ['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Efeito de longe'],
    CREATOR: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida'],
    DRIBBLER: ['Toque duplo', 'Controle com a sola', 'Elástico'],
    PRESSING: ['Volta para marcar', 'Interceptação', 'Espírito guerreiro'],
    POSSESSION: ['Passe de primeira', 'Controle com a sola', 'Passe na medida'],
    QUICK_COUNTER: ['Passe em profundidade', 'Chute de primeira', 'Toque duplo'],
    DEFENSIVE: ['Interceptação', 'Bloqueador', 'Marcação individual'],
    AERIAL: ['Cabeçada', 'Superioridade aérea', 'Afastamento acrobático'],
    GOALKEEPER: ['Liderança', 'Espírito guerreiro'],
    META_2026: position === 'CB' || position === 'DMF' ? ['Interceptação', 'Bloqueador', 'Marcação individual', 'Passe de primeira'] : position === 'CF' ? ['Chute de primeira', 'Precisão à distância', 'Controle da cavadinha'] : ['Toque duplo', 'Controle com a sola', 'Passe de primeira', 'Precisão à distância']
  };
  return Array.from(new Set([...(extras[objective] ?? []), ...(byPosition[position] ?? [])]));
}

const DEFENSIVE_FIELD_SKILLS = ['Volta para marcar', 'Interceptação', 'Bloqueador', 'Marcação individual', 'Carrinho', 'Afastamento acrobático'];
const CROSSING_SIDE_SKILLS = ['Cruzamento preciso', 'Passe aéreo baixo', 'Arremesso lateral longo'];
const PURE_CF_FINISHER_STYLES = /artilheiro|goal poacher|homem de area|homem de área|atacante matador|fox in the box/;
export const TARGET_CF_STYLES = /pivo|pivô|atacante pivo|atacante pivô|target man|puxa marcacao|puxa marcação/;
const PRESSING_WING_STYLES = /ala produtivo|lateral movel|lateral móvel|ponta prolifico|ponta prolífico|flanco movel|flanco móvel|atacante surpresa|jogador de infiltracao|jogador de infiltração/;

function isPureFinisherCf(position: PositionCode, playstyle: string) {
  return position === 'CF' && PURE_CF_FINISHER_STYLES.test(playstyle) && !TARGET_CF_STYLES.test(playstyle);
}

function shouldRecommendTrackBack(position: PositionCode, playstyle: string, objective: Objective, attributes: Required<Attributes>) {
  if (position === 'GK' || position === 'CB') return false;
  if (isPureFinisherCf(position, playstyle)) return false;
  if (position === 'CF') {
    return objective === 'PRESSING' && TARGET_CF_STYLES.test(playstyle) && attributes.stamina >= 82 && attributes.aggression >= 76;
  }
  if (position === 'LWF' || position === 'RWF' || position === 'SS' || position === 'LMF' || position === 'RMF') {
    return objective === 'PRESSING' || PRESSING_WING_STYLES.test(playstyle) || attributes.stamina >= 83;
  }
  return position === 'DMF' || position === 'CMF' || position === 'LB' || position === 'RB' || objective === 'PRESSING';
}

type SkillBlueprint = {
  label: string;
  essentials: string[];
  alternatives: string[];
  avoid: string[];
};

function knownStyleBlueprint(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>): SkillBlueprint | null {
  const style = normalize(parsed.playstyle ?? '').toLowerCase();
  const isAerial = attributes.heading >= 76 || attributes.jump >= 78 || attributes.physicalContact >= 80;
  const isCreatorPos = selectedPosition === 'AMF' || selectedPosition === 'CMF' || selectedPosition === 'SS' || selectedPosition === 'DMF';

  if (!style) return null;

  if (selectedPosition === 'GK' || parsed.mainPosition === 'GK' || /goleiro/.test(style)) return null;

  if (selectedPosition === 'CB') {
    if (/atacante surpresa|extra frontman/.test(style)) {
      return {
        label: 'ZAG atacante surpresa com segurança',
        essentials: ['Interceptação', 'Bloqueador', 'Superioridade aérea', 'Passe de primeira', 'Afastamento acrobático'],
        alternatives: ['Marcação individual', 'Cabeçada', 'Passe na medida', 'Espírito guerreiro'],
        avoid: ['Chute de primeira', 'Precisão à distância', 'Toque duplo', 'Controle da cavadinha', 'Volta para marcar']
      };
    }
    if (/defensor criativo|construtor|build up/.test(style)) {
      return {
        label: 'ZAG defensor criativo / saída de bola',
        essentials: ['Interceptação', 'Bloqueador', 'Passe de primeira', 'Passe na medida', 'Superioridade aérea'],
        alternatives: ['Marcação individual', 'Afastamento acrobático', 'Espírito guerreiro', 'Cabeçada'],
        avoid: ['Chute de primeira', 'Finalização acrobática', 'Controle da cavadinha', 'Volta para marcar', 'Toque duplo']
      };
    }
    if (/destruidor|destroyer/.test(style)) {
      return {
        label: 'ZAG destruidor de combate',
        essentials: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Carrinho', 'Superioridade aérea'],
        alternatives: ['Afastamento acrobático', 'Espírito guerreiro', 'Cabeçada', 'Passe de primeira'],
        avoid: ['Chute de primeira', 'Precisão à distância', 'Toque duplo', 'Controle da cavadinha', 'Cruzamento preciso']
      };
    }
  }

  if (selectedPosition === 'LB' || selectedPosition === 'RB' || selectedPosition === 'LMF' || selectedPosition === 'RMF') {
    if (/lateral defensivo|defensive full/.test(style)) {
      return {
        label: `${POSITION_PT[selectedPosition]} lateral defensivo de recomposição`,
        essentials: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Passe de primeira'],
        alternatives: ['Cruzamento preciso', 'Passe na medida', 'Espírito guerreiro', 'Carrinho'],
        avoid: ['Chute de primeira', 'Finalização acrobática', 'Controle da cavadinha']
      };
    }
    if (/perito em cruzamento|cross specialist/.test(style)) {
      return {
        label: `${POSITION_PT[selectedPosition]} especialista em cruzamento`,
        essentials: ['Cruzamento preciso', 'Passe na medida', 'Passe aéreo baixo', 'Curva para fora', 'Passe de primeira'],
        alternatives: ['Volta para marcar', 'Interceptação', 'Controle com a sola', 'Espírito guerreiro'],
        avoid: ['Chute de primeira', 'Finalização acrobática', 'Marcação individual', 'Carrinho']
      };
    }
    if (/lateral ofensivo|lateral atacante|offensive full|full back finisher/.test(style)) {
      return {
        label: `${POSITION_PT[selectedPosition]} lateral de apoio ofensivo`,
        essentials: ['Cruzamento preciso', 'Passe de primeira', 'Volta para marcar', 'Interceptação', 'Curva para fora'],
        alternatives: ['Passe na medida', 'Controle com a sola', 'Toque duplo', 'Bloqueador'],
        avoid: ['Chute de primeira', 'Finalização acrobática', 'Controle da cavadinha']
      };
    }
  }

  if (selectedPosition === 'DMF' || selectedPosition === 'CMF') {
    if (/primeiro volante|ancora|âncora|anchor/.test(style)) {
      return {
        label: '1º volante protetor da zaga',
        essentials: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Passe de primeira', 'Espírito guerreiro'],
        alternatives: ['Volta para marcar', 'Carrinho', 'Passe em profundidade', 'Passe na medida'],
        avoid: ['Chute de primeira', 'Finalização acrobática', 'Controle da cavadinha', 'Elástico']
      };
    }
    if (/destruidor|destroyer/.test(style)) {
      return {
        label: selectedPosition === 'DMF' ? 'VOL destruidor de contenção' : 'MLG marcador agressivo',
        essentials: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Passe de primeira'],
        alternatives: ['Carrinho', 'Espírito guerreiro', 'Passe em profundidade', 'Passe na medida'],
        avoid: ['Chute de primeira', 'Finalização acrobática', 'Controle da cavadinha', 'Cruzamento preciso']
      };
    }
    if (/orquestrador|orchestrator/.test(style)) {
      return {
        label: selectedPosition === 'DMF' ? 'VOL orquestrador de saída' : 'MLG orquestrador',
        essentials: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Controle com a sola', 'Interceptação'],
        alternatives: ['Passe sem olhar', 'Espírito guerreiro', 'Volta para marcar', 'Toque de calcanhar'],
        avoid: ['Carrinho', 'Chute de primeira', 'Finalização acrobática', 'Cruzamento preciso']
      };
    }
    if (/meia versatil|box-to-box|todo campo/.test(style)) {
      return {
        label: 'Meia versátil box-to-box',
        essentials: ['Passe de primeira', 'Interceptação', 'Volta para marcar', 'Passe em profundidade', 'Espírito guerreiro'],
        alternatives: ['Passe na medida', 'Controle com a sola', 'Precisão à distância', 'Toque de calcanhar'],
        avoid: ['Controle da cavadinha', 'Cruzamento preciso', 'Carrinho']
      };
    }
  }

  if (isCreatorPos) {
    if (/classico n[oº]? 10|clássico n[oº]? 10|classic/.test(style)) {
      return {
        label: 'Clássico 10 criador técnico',
        essentials: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Controle com a sola', 'Precisão à distância'],
        alternatives: ['Passe sem olhar', 'Toque de calcanhar', 'Chute de primeira', 'Efeito de longe'],
        avoid: ['Volta para marcar', 'Carrinho', 'Bloqueador', 'Marcação individual']
      };
    }
    if (/armador criativo|criador de jogadas|creative playmaker/.test(style)) {
      return {
        label: 'Armador criativo de último passe',
        essentials: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe sem olhar', 'Controle com a sola'],
        alternatives: ['Toque de calcanhar', 'Precisão à distância', 'Chute de primeira', 'Toque duplo'],
        avoid: ['Carrinho', 'Bloqueador', 'Marcação individual', 'Superioridade aérea']
      };
    }
    if (/jogador de infiltracao|jogador de infiltração|hole player|atacante surpresa/.test(style)) {
      return {
        label: 'Meia de infiltração / chegada',
        essentials: ['Chute de primeira', 'Passe de primeira', 'Passe em profundidade', 'Precisão à distância', 'Toque duplo'],
        alternatives: ['Finalização acrobática', 'Efeito de longe', 'Controle com a sola', 'Toque de calcanhar'],
        avoid: ['Carrinho', 'Bloqueador', 'Marcação individual', 'Afastamento acrobático']
      };
    }
  }

  if (selectedPosition === 'LWF' || selectedPosition === 'RWF' || selectedPosition === 'LMF' || selectedPosition === 'RMF') {
    if (/ala produtivo|ponta prolifico|ponta prolífico|prolific winger/.test(style)) {
      return {
        label: `${POSITION_PT[selectedPosition]} ala produtivo`,
        essentials: ['Toque duplo', 'Controle com a sola', 'Chute de primeira', 'Cruzamento preciso', 'Passe de primeira'],
        alternatives: ['Precisão à distância', 'Elástico', 'Curva para fora', 'Volta para marcar'],
        avoid: ['Carrinho', 'Marcação individual', 'Bloqueador', 'Afastamento acrobático']
      };
    }
    if (/lateral movel|lateral móvel|flanco movel|flanco móvel|roaming flank/.test(style)) {
      return {
        label: `${POSITION_PT[selectedPosition]} lateral móvel / diagonal`,
        essentials: ['Toque duplo', 'Controle com a sola', 'Passe de primeira', 'Precisão à distância', 'Cruzamento preciso'],
        alternatives: ['Chute de primeira', 'Passe em profundidade', 'Volta para marcar', 'Curva para fora'],
        avoid: ['Carrinho', 'Marcação individual', 'Superioridade aérea', 'Afastamento acrobático']
      };
    }
  }

  if (selectedPosition === 'CF' || selectedPosition === 'SS') {
    if (/atacante pivo|atacante pivô|pivo|pivô|target man/.test(style)) {
      return {
        label: selectedPosition === 'CF' ? 'CA pivô / referência' : 'SA pivô de apoio',
        essentials: ['Passe de primeira', 'Toque de calcanhar', 'Chute de primeira', ...(isAerial ? ['Cabeçada'] : ['Controle com a sola']), 'Espírito guerreiro'],
        alternatives: ['Precisão à distância', 'Superioridade aérea', 'Finalização acrobática', ...(shouldRecommendTrackBack(selectedPosition, style, objective, attributes) ? ['Volta para marcar'] : [])],
        avoid: ['Marcação individual', 'Interceptação', 'Carrinho', 'Bloqueador', 'Cruzamento preciso']
      };
    }
    if (/homem de area|homem de área|fox in the box/.test(style)) {
      return {
        label: 'Homem de Área',
        essentials: ['Chute de primeira', 'Cabeçada', 'Superioridade aérea', 'Finalização acrobática', 'Controle da cavadinha'],
        alternatives: ['Precisão à distância', 'Efeito de longe', 'Toque de calcanhar', 'Passe de primeira'],
        avoid: ['Volta para marcar', 'Marcação individual', 'Interceptação', 'Carrinho', 'Bloqueador']
      };
    }
    if (/puxa marcacao|puxa marcação|deep lying forward/.test(style)) {
      return {
        label: 'Atacante que puxa marcação',
        essentials: ['Passe de primeira', 'Toque de calcanhar', 'Chute de primeira', 'Controle com a sola', 'Precisão à distância'],
        alternatives: ['Espírito guerreiro', 'Finalização acrobática', 'Volta para marcar', 'Passe em profundidade'],
        avoid: ['Marcação individual', 'Carrinho', 'Bloqueador', 'Interceptação']
      };
    }
    if (/artilheiro|goal poacher|atacante matador/.test(style)) {
      return {
        label: selectedPosition === 'SS' ? 'SA artilheiro de ruptura' : 'CA artilheiro finalizador',
        essentials: ['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Efeito de longe', isAerial ? 'Cabeçada' : 'Controle da cavadinha'],
        alternatives: ['Passe de primeira', 'Toque de calcanhar', 'Super substituto', ...(isAerial ? ['Superioridade aérea'] : [])],
        avoid: ['Volta para marcar', 'Marcação individual', 'Interceptação', 'Carrinho', 'Bloqueador', 'Cruzamento preciso']
      };
    }
  }

  return null;
}

function skillBlueprint(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>): SkillBlueprint {
  const playstyle = normalize(parsed.playstyle ?? '').toLowerCase();
  const isAerial = attributes.heading >= 76 || attributes.jump >= 78 || attributes.physicalContact >= 80;
  const highPass = attributes.lowPass >= 78 || attributes.loftedPass >= 78;
  const highDribble = attributes.dribbling >= 80 || attributes.tightPossession >= 80 || attributes.ballControl >= 82;
  const highSpeed = attributes.speed >= 82 || attributes.acceleration >= 82;
  const pressingContext = objective === 'PRESSING' || attributes.stamina >= 84 || attributes.aggression >= 82;
  const styleBlueprint = knownStyleBlueprint(parsed, selectedPosition, objective, attributes);
  if (styleBlueprint) return styleBlueprint;

  if (selectedPosition === 'GK' || parsed.mainPosition === 'GK' || isGoalkeeperStyle(parsed.playstyle)) {
    const isOffensiveKeeper = /ofensivo|offensive/i.test(playstyle);
    return {
      label: isOffensiveKeeper ? 'Goleiro de saída rápida' : 'Goleiro seguro',
      essentials: isOffensiveKeeper
        ? ['Reposição baixa do goleiro', 'Reposição alta do goleiro', 'Arremesso longo do goleiro', 'Pegador de pênalti', 'Liderança']
        : ['Pegador de pênalti', 'Reposição baixa do goleiro', 'Reposição alta do goleiro', 'Arremesso longo do goleiro', 'Liderança'],
      alternatives: ['Espírito guerreiro'],
      avoid: ['Chute de primeira', 'Passe de primeira', 'Toque duplo', 'Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Carrinho']
    };
  }

  if (selectedPosition === 'CF') {
    if (TARGET_CF_STYLES.test(playstyle)) {
      return {
        label: 'CA pivô / referência',
        essentials: ['Passe de primeira', 'Toque de calcanhar', 'Chute de primeira', ...(isAerial ? ['Cabeçada', 'Superioridade aérea'] : ['Finalização acrobática'])],
        alternatives: ['Precisão à distância', 'Efeito de longe', 'Controle da cavadinha', 'Espírito guerreiro', ...(shouldRecommendTrackBack(selectedPosition, playstyle, objective, attributes) ? ['Volta para marcar'] : [])],
        avoid: ['Marcação individual', 'Interceptação', 'Carrinho', 'Bloqueador', 'Cruzamento preciso', 'Arremesso lateral longo']
      };
    }
    return {
      label: 'CA finalizador',
      essentials: ['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Efeito de longe', ...(isAerial ? ['Cabeçada'] : ['Controle da cavadinha'])],
      alternatives: ['Passe de primeira', 'Toque de calcanhar', 'Super substituto', ...(isAerial ? ['Superioridade aérea'] : ['Controle da cavadinha'])],
      avoid: ['Volta para marcar', 'Marcação individual', 'Interceptação', 'Carrinho', 'Bloqueador', 'Cruzamento preciso', 'Arremesso lateral longo', 'Passe aéreo baixo']
    };
  }

  if (selectedPosition === 'SS') {
    return {
      label: 'SA de apoio e ruptura',
      essentials: ['Passe de primeira', 'Chute de primeira', 'Passe em profundidade', ...(highDribble ? ['Toque duplo'] : ['Controle com a sola']), 'Toque de calcanhar'],
      alternatives: ['Precisão à distância', 'Finalização acrobática', 'Passe sem olhar', ...(pressingContext ? ['Volta para marcar'] : [])],
      avoid: ['Carrinho', 'Marcação individual', 'Afastamento acrobático', 'Arremesso lateral longo']
    };
  }

  if (selectedPosition === 'LWF' || selectedPosition === 'RWF') {
    return {
      label: 'Ponta de aceleração',
      essentials: ['Toque duplo', 'Controle com a sola', ...(highDribble ? ['Elástico'] : ['Pedalada simples']), ...(highPass ? ['Cruzamento preciso'] : ['Curva para fora']), 'Passe de primeira'],
      alternatives: ['Precisão à distância', 'Passe em profundidade', 'Finalização acrobática', ...(pressingContext ? ['Volta para marcar'] : [])],
      avoid: ['Carrinho', 'Marcação individual', 'Afastamento acrobático', 'Arremesso lateral longo']
    };
  }

  if (selectedPosition === 'AMF') {
    return {
      label: 'MAT criador',
      essentials: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe sem olhar', ...(highDribble ? ['Controle com a sola'] : ['Toque de calcanhar'])],
      alternatives: ['Curva para fora', 'Toque duplo', 'Precisão à distância', 'De letra'],
      avoid: ['Carrinho', 'Marcação individual', 'Bloqueador', 'Afastamento acrobático', 'Arremesso lateral longo']
    };
  }

  if (selectedPosition === 'CMF') {
    return {
      label: /orquestrador|armador|classico|clássico/i.test(playstyle) ? 'MLG organizador' : 'MLG ida e volta',
      essentials: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', ...(attributes.defensiveAwareness >= 76 ? ['Interceptação'] : ['Controle com a sola']), 'Espírito guerreiro'],
      alternatives: ['Volta para marcar', 'Marcação individual', 'Passe sem olhar', 'Toque de calcanhar'],
      avoid: ['Controle da cavadinha', 'Finalização acrobática', 'Chute ascendente', 'Folha seca', 'Arremesso lateral longo']
    };
  }

  if (selectedPosition === 'DMF') {
    return {
      label: /destruidor|primeiro volante|ancora|âncora|anchor/i.test(playstyle) ? 'VOL marcador' : 'VOL construtor',
      essentials: ['Interceptação', 'Bloqueador', 'Marcação individual', ...(shouldRecommendTrackBack(selectedPosition, playstyle, objective, attributes) ? ['Volta para marcar'] : ['Espírito guerreiro']), 'Passe de primeira'],
      alternatives: ['Passe em profundidade', 'Passe na medida', 'Superioridade aérea', 'Carrinho'],
      avoid: ['Controle da cavadinha', 'Finalização acrobática', 'Efeito de longe', 'Chute com o peito do pé', 'Folha seca', 'Chute ascendente']
    };
  }

  if (selectedPosition === 'CB') {
    return {
      label: 'ZAG de segurança',
      essentials: ['Bloqueador', 'Interceptação', 'Marcação individual', ...(isAerial ? ['Superioridade aérea'] : ['Afastamento acrobático']), 'Espírito guerreiro'],
      alternatives: ['Carrinho', 'Cabeçada', 'Passe de primeira', 'Passe na medida'],
      avoid: ['Toque duplo', 'Elástico', 'Controle da cavadinha', 'Precisão à distância', 'Finalização acrobática', 'Chute de primeira', 'Efeito de longe']
    };
  }

  if (selectedPosition === 'LB' || selectedPosition === 'RB' || selectedPosition === 'LMF' || selectedPosition === 'RMF') {
    const defensiveSide = selectedPosition === 'LB' || selectedPosition === 'RB';
    return {
      label: defensiveSide ? 'Lateral equilibrado' : 'Meia aberto',
      essentials: ['Cruzamento preciso', 'Passe de primeira', ...(defensiveSide ? ['Interceptação'] : ['Passe na medida']), ...(pressingContext ? ['Volta para marcar'] : ['Curva para fora']), highSpeed ? 'Controle com a sola' : 'Espírito guerreiro'],
      alternatives: ['Passe aéreo baixo', 'Bloqueador', 'Marcação individual', 'Toque duplo'],
      avoid: ['Controle da cavadinha', 'Finalização acrobática', 'Chute de primeira', 'Carrinho']
    };
  }

  return {
    label: 'Função híbrida',
    essentials: skillPriority(selectedPosition, objective).slice(0, 5),
    alternatives: skillPriority(selectedPosition, objective).slice(5),
    avoid: []
  };
}

function buildAvoidSkills(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>): string[] {
  const blueprint = skillBlueprint(parsed, selectedPosition, objective, attributes);
  return uniqueSkillList(blueprint.avoid).slice(0, 6);
}

function skillTierReason(_skill: string, tier: SkillRecommendation['tier'], blueprint: SkillBlueprint) {
  if (tier === 'essencial') return `prioridade para ${blueprint.label}: combina diretamente com posição, estilo e função real`;
  if (tier === 'alternativa') return `boa alternativa se você quiser variar a função sem fugir do desempenho em campo`;
  return `evite para ${blueprint.label}: gasta habilidade e entrega pouco para a função principal`;
}

export function buildSkillRecommendations(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>, recommendedSkills: string[]): SkillRecommendation[] {
  const blueprint = skillBlueprint(parsed, selectedPosition, objective, attributes);
  const result: SkillRecommendation[] = [];
  for (const skill of recommendedSkills) {
    const key = skillKey(skill);
    const essential = blueprint.essentials.some((item) => skillKey(item) === key);
    result.push({ name: skill, tier: essential ? 'essencial' : 'alternativa', reason: skillTierReason(skill, essential ? 'essencial' : 'alternativa', blueprint) });
  }
  for (const skill of buildAvoidSkills(parsed, selectedPosition, objective, attributes)) {
    if (result.some((item) => skillKey(item.name) === skillKey(skill))) continue;
    result.push({ name: skill, tier: 'evitar', reason: skillTierReason(skill, 'evitar', blueprint) });
  }
  return result;
}

function contextualSkillBans(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>) {
  const playstyle = normalize(parsed.playstyle ?? '').toLowerCase();
  const banned = new Set<string>();
  const ban = (skills: string[]) => skills.forEach((skill) => banned.add(skillKey(skill)));
  ban(skillBlueprint(parsed, selectedPosition, objective, attributes).avoid);

  if (selectedPosition === 'GK' || parsed.mainPosition === 'GK' || isGoalkeeperStyle(parsed.playstyle)) {
    ban(Object.keys(SKILL_PROFILES).filter((skill) => SKILL_PROFILES[skill].category !== 'GOLEIRO' && !['Liderança', 'Espírito guerreiro'].includes(skill)));
    return banned;
  }

  if (isPureFinisherCf(selectedPosition, playstyle)) {
    ban(DEFENSIVE_FIELD_SKILLS);
    ban(CROSSING_SIDE_SKILLS);
  }

  if ((selectedPosition === 'CF' || selectedPosition === 'SS') && !shouldRecommendTrackBack(selectedPosition, playstyle, objective, attributes)) {
    banned.add(skillKey('Volta para marcar'));
  }

  if (selectedPosition === 'CB') {
    ban(['Toque duplo', 'Elástico', 'Controle da cavadinha', 'Efeito de longe', 'Precisão à distância', 'Finalização acrobática', 'Chute de primeira']);
  }

  if (selectedPosition === 'DMF' && /destruidor|primeiro volante|anchor|ancora|âncora/.test(playstyle)) {
    ban(['Controle da cavadinha', 'Finalização acrobática', 'Efeito de longe', 'Chute com o peito do pé', 'Folha seca', 'Chute ascendente']);
  }

  return banned;
}

function finalSkillScoreAdjustments(skill: string, parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>) {
  const playstyle = normalize(parsed.playstyle ?? '').toLowerCase();
  let bonus = 0;

  if (selectedPosition === 'CF') {
    if (PURE_CF_FINISHER_STYLES.test(playstyle)) {
      if (['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Efeito de longe', 'Controle da cavadinha'].includes(skill)) bonus += 24;
      if (skill === 'Cabeçada' && (attributes.heading >= 74 || attributes.jump >= 76 || attributes.physicalContact >= 78)) bonus += 18;
      if (skill === 'Passe de primeira' && attributes.lowPass >= 74) bonus += 10;
      if (skill === 'Toque de calcanhar' && attributes.ballControl >= 75) bonus += 8;
    }
    if (TARGET_CF_STYLES.test(playstyle)) {
      if (['Passe de primeira', 'Toque de calcanhar', 'Cabeçada', 'Superioridade aérea', 'Chute de primeira'].includes(skill)) bonus += 18;
    }
  }

  if ((selectedPosition === 'LWF' || selectedPosition === 'RWF') && ['Toque duplo', 'Controle com a sola', 'Elástico', 'Cruzamento preciso', 'Curva para fora'].includes(skill)) bonus += 14;
  if ((selectedPosition === 'DMF' || selectedPosition === 'CB') && ['Interceptação', 'Bloqueador', 'Marcação individual', 'Superioridade aérea'].includes(skill)) bonus += 16;
  if (skill === 'Volta para marcar' && !shouldRecommendTrackBack(selectedPosition, playstyle, objective, attributes)) bonus -= 200;
  return bonus;
}

const IMPETO_DB: Record<string, { attributes: string[]; groups: string[] }> = {
  'Chute': { attributes: ['Controle de bola', 'Finalização', 'Força do chute', 'Contato físico'], groups: ['finalizador', 'segundo-atacante'] },
  'Cobrança de falta': { attributes: ['Finalização', 'Bola parada', 'Curva', 'Força do chute'], groups: ['batedor', 'criador'] },
  'Disputa aérea': { attributes: ['Finalização', 'Cabeceio', 'Salto', 'Contato físico'], groups: ['finalizador-aereo', 'zagueiro-aereo'] },
  'Passe': { attributes: ['Passe rasteiro', 'Passe alto', 'Curva', 'Força do chute'], groups: ['criador', 'meia', 'volante-criador'] },
  'Condução de bola': { attributes: ['Drible', 'Condução firme', 'Velocidade', 'Equilíbrio'], groups: ['driblador', 'ponta', 'meia-ofensivo'] },
  'Técnica': { attributes: ['Controle de bola', 'Drible', 'Condução firme', 'Passe rasteiro'], groups: ['criador', 'meia', 'posse'] },
  'Defesa': { attributes: ['Talento defensivo', 'Desarme', 'Aceleração', 'Salto'], groups: ['defensor', 'volante-defensivo', 'lateral-defensivo'] },
  'Duelo': { attributes: ['Talento defensivo', 'Desarme', 'Velocidade', 'Resistência'], groups: ['defensor', 'volante-defensivo', 'lateral-defensivo'] },
  'Agilidade': { attributes: ['Velocidade', 'Aceleração', 'Equilíbrio', 'Resistência'], groups: ['ponta', 'lateral', 'pressao', 'meia-versatil'] },
  'Fisicalidade': { attributes: ['Salto', 'Contato físico', 'Equilíbrio', 'Resistência'], groups: ['defensor', 'pivo', 'volante-defensivo'] },
  'Goleiro': { attributes: ['Talento de GO', 'Firmeza do GO', 'Defesa do GO', 'Reflexos do GO'], groups: ['goleiro'] },
  'Instinto artilheiro': { attributes: ['Talento ofensivo', 'Controle de bola', 'Finalização', 'Aceleração'], groups: ['finalizador', 'segundo-atacante'] },
  'Guardião': { attributes: ['Talento defensivo', 'Desarme', 'Dedicação defensiva', 'Velocidade'], groups: ['defensor', 'volante-defensivo'] },
  'Motor do time': { attributes: ['Agressividade', 'Aceleração', 'Contato físico', 'Resistência'], groups: ['meia-versatil', 'pressao', 'volante-defensivo'] },
  'Defesaça': { attributes: ['Talento de GO', 'Defesa do GO', 'Reflexos do GO', 'Alcance do GO'], groups: ['goleiro'] },
  'Cruzamento': { attributes: ['Passe alto', 'Curva', 'Velocidade', 'Resistência'], groups: ['lateral', 'ponta', 'ala'] },
  'Fantasista': { attributes: ['Controle de bola', 'Drible', 'Finalização', 'Equilíbrio'], groups: ['meia-ofensivo', 'driblador', 'segundo-atacante'] },
  'Volante criativo': { attributes: ['Condução firme', 'Passe rasteiro', 'Talento defensivo', 'Desarme'], groups: ['volante-criador', 'meia', 'posse'] },
  'Reconstrução': { attributes: ['Passe rasteiro', 'Talento defensivo', 'Agressividade', 'Dedicação defensiva'], groups: ['volante-defensivo', 'zagueiro-construtor'] },
  'Precisão': { attributes: ['Passe rasteiro', 'Passe alto', 'Finalização', 'Força do chute'], groups: ['criador', 'batedor', 'finalizador'] },
  'Criador ofensivo': { attributes: ['Talento ofensivo', 'Controle de bola', 'Passe rasteiro', 'Força do chute'], groups: ['criador', 'meia-ofensivo'] },
  'Proteção de Posse': { attributes: ['Controle de bola', 'Condução firme', 'Contato físico', 'Equilíbrio'], groups: ['posse', 'pivo', 'meia'] },
  'Equilibrado': { attributes: ['Talento ofensivo', 'Talento defensivo', 'Aceleração', 'Resistência'], groups: ['meia-versatil', 'coringa'] },
  'Transição ofensiva': { attributes: ['Passe rasteiro', 'Desarme', 'Dedicação defensiva', 'Contato físico'], groups: ['pressao', 'volante-defensivo', 'meia-versatil'] },
  'Bloqueio Aéreo': { attributes: ['Cabeceio', 'Talento defensivo', 'Salto', 'Contato físico'], groups: ['zagueiro-aereo', 'defensor'] },
  'Rompe-barreira': { attributes: ['Drible', 'Velocidade', 'Força do chute', 'Contato físico'], groups: ['ponta', 'driblador', 'finalizador-fisico'] },
  'Força': { attributes: ['Velocidade', 'Força do chute', 'Salto', 'Contato físico'], groups: ['finalizador-fisico', 'pivo', 'defensor'] },
  'Movimento sem a bola': { attributes: ['Talento ofensivo', 'Velocidade', 'Aceleração', 'Resistência'], groups: ['infiltrador', 'ponta', 'finalizador'] },
  'Roubo de bola': { attributes: ['Desarme', 'Agressividade', 'Aceleração', 'Contato físico'], groups: ['volante-defensivo', 'defensor', 'pressao'] }
};

function desiredImpetoGroups(position: PositionCode, playstyle?: string | null, objective: Objective = 'COMPETITIVE') {
  const style = styleText(playstyle);
  const groups: string[] = [];

  if (position === 'GK') return ['goleiro'];
  if (position === 'CB') groups.push('defensor', 'zagueiro-aereo');
  if (position === 'DMF') groups.push('volante-defensivo', 'volante-criador', 'pressao');
  if (position === 'CMF') groups.push('meia-versatil', 'meia', 'volante-criador');
  if (position === 'AMF') groups.push('criador', 'meia-ofensivo', 'posse');
  if (position === 'LMF' || position === 'RMF') groups.push('ala', 'lateral', 'meia-versatil', 'ponta');
  if (position === 'LB' || position === 'RB') groups.push('lateral', 'lateral-defensivo', 'defensor');
  if (position === 'LWF' || position === 'RWF') groups.push('ponta', 'driblador', 'finalizador');
  if (position === 'SS') groups.push('segundo-atacante', 'criador', 'infiltrador');

  if (position === 'CF') {
    if (/homem de area|homem de área|pivo|pivô|atacante pivo|atacante pivô|target man|puxa marcacao|puxa marcação/.test(style)) {
      groups.push('pivo', 'finalizador-aereo', 'finalizador-fisico', 'finalizador');
    } else {
      groups.push('finalizador', 'infiltrador', 'finalizador-fisico');
    }
  }

  if (/destruidor|primeiro volante|ancora|anchor man|destroyer/.test(style)) groups.unshift('volante-defensivo', 'defensor', 'pressao');
  if (/meia versatil|box-to-box|todo campo/.test(style)) groups.unshift('meia-versatil', 'pressao');
  if (/orquestrador|armador criativo|criador de jogadas|classico/.test(style)) groups.unshift('criador', 'posse', 'meia');
  if (/jogador de infiltracao|jogador sem bola|hole player|atacante surpresa/.test(style)) groups.unshift('infiltrador', 'finalizador');
  if (/homem de area|homem de área|pivo|pivô|atacante pivo|atacante pivô|target man|puxa marcacao|puxa marcação/.test(style)) groups.unshift('pivo', 'finalizador-aereo', 'finalizador-fisico');
  if (/artilheiro|goal poacher|atacante matador/.test(style)) groups.unshift('finalizador', 'infiltrador');
  if (/lateral ofensivo|lateral atacante|perito em cruzamento/.test(style)) groups.unshift('lateral', 'ala');
  if (/ala produtivo|lateral movel|lateral móvel|ponta prolifico|ponta prolífico|flanco movel|flanco móvel/.test(style)) groups.unshift('ponta', 'ala', 'driblador');

  if (objective === 'DEFENSIVE' || (objective === 'PRESSING' && !isPureFinisherCf(position, style))) groups.unshift('volante-defensivo', 'defensor', 'pressao');
  if (objective === 'CREATOR' || objective === 'POSSESSION') groups.unshift('criador', 'posse', 'meia');
  if (objective === 'FINISHER' || objective === 'AERIAL') groups.unshift('finalizador', 'finalizador-aereo');
  if (objective === 'DRIBBLER') groups.unshift('driblador', 'ponta');
  if (objective === 'QUICK_COUNTER') groups.unshift(position === 'CF' ? 'infiltrador' : 'ponta', 'driblador');

  return Array.from(new Set(groups));
}

export function recommendImpetos(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective): ImpetoRecommendation[] {
  const groups = desiredImpetoGroups(selectedPosition, parsed.playstyle, objective);
  const owned = new Set(parsed.impetos.filter((i) => i.active !== false).map((i) => skillKey(i.name)));
  const scored = Object.entries(IMPETO_DB).map(([name, info]) => {
    let score = 0;
    for (const group of groups) {
      const idx = info.groups.indexOf(group);
      if (idx >= 0) score += 120 - Math.min(80, groups.indexOf(group) * 7 + idx * 4);
    }
    if (owned.has(skillKey(name))) return { name, info, score: Number.NEGATIVE_INFINITY };
    return { name, info, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored.filter((item) => item.score > 0).slice(0, 5).map((item, index) => ({
    name: item.name,
    tier: index === 0 ? 'ideal' as const : 'alternativo' as const,
    attributes: item.info.attributes,
    reason: index === 0
      ? 'melhor impacto para a posição, estilo e função real da carta'
      : 'boa alternativa se você quiser variar a função sem fugir da gameplay da carta'
  }));

  const avoid = scored.filter((item) => item.score <= 0).slice(-3).reverse().map((item) => ({
    name: item.name,
    tier: 'evitar' as const,
    attributes: item.info.attributes,
    reason: 'não conversa bem com a posição principal e o estilo fixo desta carta'
  }));

  return [...best, ...avoid];
}

function topRatedPositions(positionRatings: PositionRatings): PositionCode[] {
  return Object.entries(positionRatings)
    .filter((entry): entry is [PositionCode, number] => Number.isFinite(entry[1]))
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([position]) => position);
}

export function recommendAdditionalSkills(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>): string[] {
  const candidateScores = new Map<string, number>();
  const ownedSkillKeys = buildOwnedSkillKeys(parsed.nativeSkills, parsed.specialSkills, parsed.additionalSkills ?? []);
  const bannedAdditional = new Set(SPECIAL_SKILL_NAMES.map(skillKey));
  const contextualBans = contextualSkillBans(parsed, selectedPosition, objective, attributes);
  const blueprint = skillBlueprint(parsed, selectedPosition, objective, attributes);

  const add = (skill: string, score: number) => {
    if (!SKILL_PROFILES[skill]) return;
    if (!isOfficialAdditionalSkill(skill)) return;
    const key = skillKey(skill);
    if (ownedSkillKeys.has(key)) return;
    if (bannedAdditional.has(key)) return;
    if (contextualBans.has(key)) return;
    const adjusted = score + finalSkillScoreAdjustments(skill, parsed, selectedPosition, objective, attributes);
    if (adjusted <= 0) return;
    candidateScores.set(skill, Math.max(candidateScores.get(skill) ?? 0, adjusted));
  };

  if (selectedPosition === 'GK' || parsed.mainPosition === 'GK' || isGoalkeeperStyle(parsed.playstyle)) {
    blueprint.essentials.forEach((skill, index) => add(skill, 130 - index * 8));
    blueprint.alternatives.forEach((skill, index) => add(skill, 82 - index * 5));
    return filterComplementaryAdditionalSkills(
      Array.from(candidateScores.entries()).sort((left, right) => right[1] - left[1]).map(([skill]) => skill),
      parsed.nativeSkills,
      parsed.specialSkills,
      5,
      parsed.additionalSkills ?? []
    );
  }

  blueprint.essentials.forEach((skill, index) => add(skill, 145 - index * 7));
  blueprint.alternatives.forEach((skill, index) => add(skill, 96 - index * 5));

  skillPriority(selectedPosition, objective).forEach((skill, index) => add(skill, 84 - index * 5));

  const ratedPositions = topRatedPositions(parsed.positionRatings);
  const cardPositions = ratedPositions.length ? ratedPositions : parsed.positions;
  const playstyle = normalize(parsed.playstyle ?? '').toLowerCase();
  const useCrossPositionHints = !isPureFinisherCf(selectedPosition, playstyle);
  if (useCrossPositionHints) {
    cardPositions.slice(0, 3).forEach((position, posIndex) => {
      skillPriority(position, objective).forEach((skill, index) => add(skill, 66 - posIndex * 8 - index * 4));
    });
  }

  const isDestroyer = /destruidor|destroyer/.test(playstyle);
  const isFullback = selectedPosition === 'LB' || selectedPosition === 'RB' || cardPositions.includes('LB') || cardPositions.includes('RB');
  const isMidfielder = selectedPosition === 'DMF' || selectedPosition === 'CMF' || selectedPosition === 'AMF' || cardPositions.some((p) => ['DMF', 'CMF', 'AMF'].includes(p));
  const isForward = ['CF', 'SS', 'LWF', 'RWF'].includes(selectedPosition) || cardPositions.some((p) => ['CF', 'SS', 'LWF', 'RWF'].includes(p));

  if (isDestroyer) {
    add('Interceptação', 112);
    add('Bloqueador', 108);
    add('Marcação individual', 104);
    if (shouldRecommendTrackBack(selectedPosition, playstyle, objective, attributes)) add('Volta para marcar', 98);
    add('Passe de primeira', 92);
    add('Espírito guerreiro', 88);
    add('Passe em profundidade', 84);
    add('Passe na medida', 78);
    add('Superioridade aérea', 70);
  }

  if (/criador|orquestrador|creative|orchestrator/.test(playstyle)) {
    add('Passe de primeira', 112);
    add('Passe em profundidade', 108);
    add('Passe na medida', 102);
    add('Passe sem olhar', 86);
    add('Controle com a sola', 82);
  }

  if (/artilheiro|goal poacher|homem de area|homem de área|atacante matador|pivo|pivô|target man|fox/.test(playstyle)) {
    add('Chute de primeira', 116);
    add('Precisão à distância', 106);
    add('Finalização acrobática', 98);
    add('Efeito de longe', 94);
    add('Controle da cavadinha', 84);
    if (attributes.heading >= 74 || attributes.jump >= 76 || attributes.physicalContact >= 78) add('Cabeçada', 90);
    if (attributes.heading >= 76 || attributes.jump >= 78 || attributes.physicalContact >= 80) add('Superioridade aérea', 84);
  }

  if (attributes.defensiveAwareness >= 78 || attributes.tackling >= 78 || attributes.defensiveEngagement >= 78) {
    add('Interceptação', 106);
    add('Bloqueador', 102);
    add('Marcação individual', 96);
  }
  if (attributes.aggression >= 78 || attributes.stamina >= 80) {
    if (shouldRecommendTrackBack(selectedPosition, playstyle, objective, attributes)) add('Volta para marcar', 92);
    add('Espírito guerreiro', 84);
  }
  if (attributes.lowPass >= 76 || isMidfielder) {
    add('Passe de primeira', 96);
    add('Passe em profundidade', 90);
  }
  if (attributes.loftedPass >= 74 || isFullback) {
    add('Passe na medida', 84);
    add('Cruzamento preciso', isFullback ? 88 : 74);
    add('Passe aéreo baixo', 66);
  }
  if (attributes.ballControl >= 76 || attributes.tightPossession >= 76 || attributes.dribbling >= 76) {
    add('Controle com a sola', 78);
    add('Toque duplo', 74);
  }
  if (attributes.speed >= 82 || attributes.acceleration >= 82) {
    add('Toque duplo', 82);
    if (isForward) add('Elástico', 74);
  }
  if (attributes.finishing >= 78 || isForward) {
    add('Chute de primeira', 96);
    add('Precisão à distância', 86);
    add('Finalização acrobática', 78);
    if (attributes.curl >= 72 || attributes.kickingPower >= 78) add('Efeito de longe', 76);
  }
  if (attributes.heading >= 76 || attributes.jump >= 76 || attributes.physicalContact >= 80) {
    add('Superioridade aérea', 86);
    add('Cabeçada', 78);
  }
  if (selectedPosition === 'CB') {
    add('Afastamento acrobático', 80);
    add('Carrinho', 76);
  }
  return filterComplementaryAdditionalSkills(
    Array.from(candidateScores.entries()).sort((left, right) => right[1] - left[1]).map(([skill]) => skill),
    parsed.nativeSkills,
    parsed.specialSkills,
    5,
    parsed.additionalSkills ?? []
  );
}

