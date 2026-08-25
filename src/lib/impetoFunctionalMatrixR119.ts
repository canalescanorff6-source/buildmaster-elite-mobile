import type { AttributeKey, PositionCode } from './analyzerDomain';
import type { RecognizableImpetoName } from './officialImpetoCatalog';

export type ImpetoFunctionalDomainR119 =
  | 'finishing' | 'passing' | 'dribble' | 'movement' | 'defense'
  | 'physical' | 'aerial_attack' | 'aerial_defense' | 'stamina' | 'goalkeeper';

export type ImpetoFunctionalProfileR119 = {
  name: RecognizableImpetoName;
  nature: 'offensive' | 'defensive' | 'creative' | 'physical' | 'transition' | 'goalkeeper' | 'mixed';
  domains: Partial<Record<ImpetoFunctionalDomainR119, number>>;
  actions: Partial<Record<string, number>>;
  positions: Partial<Record<PositionCode, number>>;
  attributes: AttributeKey[];
  explanation: string;
};

const p = (name: RecognizableImpetoName, profile: Omit<ImpetoFunctionalProfileR119, 'name'>): ImpetoFunctionalProfileR119 => ({ name, ...profile });

/**
 * Matriz funcional do r119.
 *
 * Não é uma receita de ficha. Ela serve somente para decidir Ímpeto depois que
 * o Clean Slate já calculou as ações da carta. A compatibilidade considera
 * natureza da ação, posição natural, atributos que sustentam aquela ação e
 * frequência funcional estimada. Assim, capacidade aérea ofensiva não vira
 * automaticamente Bloqueio Aéreo defensivo.
 */
export const IMPETO_FUNCTIONAL_MATRIX_R119: ImpetoFunctionalProfileR119[] = [
  p('Chute',{nature:'offensive',domains:{finishing:.72,physical:.28},actions:{finish_box:.5,long_finish:.5},positions:{CF:1,SS:.92,LWF:.78,RWF:.78,AMF:.72,CMF:.38},attributes:['finishing','kickingPower','offensiveAwareness'],explanation:'Conclusão e potência de chute.'}),
  p('Cobrança de falta',{nature:'creative',domains:{finishing:.55,passing:.45},actions:{long_finish:.55,through_creation:.45},positions:{AMF:1,CMF:.88,SS:.82,LWF:.72,RWF:.72},attributes:['placeKicking','curl','kickingPower'],explanation:'Bola parada, curva e precisão.'}),
  p('Disputa aérea',{nature:'offensive',domains:{aerial_attack:.58,physical:.24,finishing:.18},actions:{aerial_finish:1},positions:{CF:1,CB:.72,SS:.48,DMF:.36,AMF:.16},attributes:['heading','jump','physicalContact','offensiveAwareness'],explanation:'Duelo aéreo ofensivo, presença na área e cabeceio.'}),
  p('Passe',{nature:'creative',domains:{passing:.78,dribble:.22},actions:{short_creation:.52,through_creation:.48},positions:{AMF:1,CMF:1,DMF:.86,LMF:.82,RMF:.82,LB:.68,RB:.68,SS:.66},attributes:['lowPass','loftedPass','ballControl'],explanation:'Circulação e criação por passe.'}),
  p('Condução de bola',{nature:'offensive',domains:{dribble:.62,movement:.38},actions:{carry:.72,close_control:.28},positions:{LWF:1,RWF:1,SS:.94,AMF:.94,LMF:.88,RMF:.88,CF:.56,CMF:.72},attributes:['dribbling','tightPossession','acceleration','balance'],explanation:'Condução, aceleração e domínio em movimento.'}),
  p('Técnica',{nature:'creative',domains:{dribble:.55,passing:.45},actions:{close_control:.56,short_creation:.44},positions:{AMF:1,CMF:.92,SS:1,LWF:.82,RWF:.82,DMF:.5},attributes:['ballControl','tightPossession','lowPass'],explanation:'Controle técnico e conexão curta.'}),
  p('Defesa',{nature:'defensive',domains:{defense:.72,movement:.28},actions:{intercept:.42,cover_space:.34,defensive_duel:.24},positions:{CB:1,DMF:1,LB:.88,RB:.88,CMF:.62},attributes:['defensiveAwareness','tackling','defensiveEngagement'],explanation:'Posicionamento, desarme e cobertura.'}),
  p('Duelo',{nature:'defensive',domains:{defense:.52,physical:.32,movement:.16},actions:{defensive_duel:.68,press_recover:.32},positions:{CB:1,DMF:.96,LB:.82,RB:.82,CMF:.72},attributes:['tackling','physicalContact','aggression','balance'],explanation:'Contato e recuperação em duelos.'}),
  p('Agilidade',{nature:'mixed',domains:{movement:.64,dribble:.36},actions:{attack_space:.36,carry:.34,close_control:.3},positions:{SS:1,LWF:1,RWF:1,AMF:.94,LMF:.88,RMF:.88,LB:.78,RB:.78,CMF:.8,CF:.7,GK:.34},attributes:['speed','acceleration','balance'],explanation:'Mudança de direção e resposta corporal.'}),
  p('Fisicalidade',{nature:'physical',domains:{physical:.62,aerial_attack:.2,aerial_defense:.18},actions:{hold_up:.42,defensive_duel:.3,aerial_finish:.14,aerial_defend:.14},positions:{CF:.92,CB:1,DMF:.96,CMF:.72,SS:.5,GK:.46},attributes:['physicalContact','balance','stamina','jump'],explanation:'Contato, equilíbrio e imposição física.'}),
  p('Goleiro',{nature:'goalkeeper',domains:{goalkeeper:1},actions:{gk_position:.4,gk_reflex:.32,gk_secure:.28},positions:{GK:1},attributes:['goalkeeperAwareness','goalkeeperCatching','goalkeeperReflexes'],explanation:'Fundamentos gerais de goleiro.'}),
  p('Instinto artilheiro',{nature:'offensive',domains:{finishing:.62,movement:.38},actions:{finish_box:.48,attack_space:.4,turn_finish:.12},positions:{CF:1,SS:.92,LWF:.66,RWF:.66,AMF:.48},attributes:['offensiveAwareness','finishing','acceleration'],explanation:'Ataque de espaço e definição.'}),
  p('Guardião',{nature:'defensive',domains:{defense:.68,movement:.2,physical:.12},actions:{cover_space:.42,intercept:.38,defensive_duel:.2},positions:{CB:1,DMF:.94,LB:.66,RB:.66,CMF:.48},attributes:['defensiveAwareness','defensiveEngagement','tackling'],explanation:'Proteção defensiva de zona e cobertura.'}),
  p('Motor do time',{nature:'transition',domains:{stamina:.42,movement:.28,defense:.18,passing:.12},actions:{press_recover:.4,cover_space:.24,short_creation:.18,attack_space:.18},positions:{CMF:1,DMF:.9,LMF:.9,RMF:.9,AMF:.54},attributes:['stamina','acceleration','defensiveEngagement','lowPass'],explanation:'Volume, recomposição e continuidade.'}),
  p('Defesaça',{nature:'goalkeeper',domains:{goalkeeper:1},actions:{gk_reflex:.5,gk_secure:.3,gk_position:.2},positions:{GK:1},attributes:['goalkeeperReflexes','goalkeeperReach','goalkeeperParrying'],explanation:'Reflexo e defesa de finalizações.'}),
  p('Cruzamento',{nature:'creative',domains:{passing:.62,movement:.38},actions:{cross_support:.72,through_creation:.28},positions:{LB:1,RB:1,LMF:.96,RMF:.96,LWF:.82,RWF:.82},attributes:['loftedPass','curl','speed','stamina'],explanation:'Apoio lateral e bola cruzada.'}),
  p('Fantasista',{nature:'offensive',domains:{dribble:.46,finishing:.3,passing:.24},actions:{close_control:.34,carry:.28,turn_finish:.2,short_creation:.18},positions:{AMF:1,SS:1,LWF:.86,RWF:.86,CMF:.56},attributes:['ballControl','dribbling','finishing','balance'],explanation:'Criação individual, condução e conclusão.'}),
  p('Volante criativo',{nature:'creative',domains:{passing:.55,defense:.3,dribble:.15},actions:{build_out:.46,short_creation:.34,intercept:.2},positions:{DMF:1,CMF:.94,CB:.42},attributes:['lowPass','ballControl','defensiveAwareness'],explanation:'Saída de bola com segurança defensiva.'}),
  p('Reconstrução',{nature:'defensive',domains:{passing:.5,defense:.5},actions:{build_out:.58,intercept:.22,cover_space:.2},positions:{CB:1,DMF:1,CMF:.62,LB:.48,RB:.48},attributes:['lowPass','defensiveAwareness','ballControl'],explanation:'Primeira fase de construção desde trás.'}),
  p('Precisão',{nature:'offensive',domains:{finishing:.5,passing:.5},actions:{long_finish:.32,finish_box:.24,through_creation:.24,short_creation:.2},positions:{AMF:1,CMF:.88,SS:.94,CF:.86,LWF:.84,RWF:.84},attributes:['finishing','lowPass','loftedPass','kickingPower'],explanation:'Execução precisa em passe e finalização.'}),
  p('Criador ofensivo',{nature:'creative',domains:{passing:.46,dribble:.3,finishing:.24},actions:{short_creation:.34,through_creation:.3,close_control:.2,turn_finish:.16},positions:{AMF:1,SS:.96,CMF:.82,LWF:.82,RWF:.82},attributes:['lowPass','ballControl','tightPossession','offensiveAwareness'],explanation:'Criação entre linhas com ameaça de conclusão.'}),
  p('Proteção de Posse',{nature:'physical',domains:{dribble:.38,physical:.42,passing:.2},actions:{hold_up:.5,close_control:.3,short_creation:.2},positions:{CF:1,SS:.78,AMF:.74,CMF:.76,DMF:.72},attributes:['physicalContact','balance','ballControl','tightPossession'],explanation:'Proteção corporal e retenção da posse.'}),
  p('Equilibrado',{nature:'mixed',domains:{movement:.24,defense:.22,finishing:.2,passing:.18,physical:.16},actions:{attack_space:.18,press_recover:.18,short_creation:.18,finish_box:.16,defensive_duel:.15,carry:.15},positions:{CMF:1,DMF:.86,SS:.82,AMF:.86,LMF:.9,RMF:.9},attributes:['stamina','balance','acceleration'],explanation:'Contribuição equilibrada em várias fases.'}),
  p('Transição ofensiva',{nature:'transition',domains:{passing:.34,movement:.3,defense:.2,physical:.16},actions:{press_recover:.28,short_creation:.24,attack_space:.24,through_creation:.24},positions:{DMF:.92,CMF:1,LMF:.9,RMF:.9,LB:.82,RB:.82,AMF:.62},attributes:['lowPass','acceleration','stamina','defensiveEngagement'],explanation:'Recuperação e aceleração da saída ofensiva.'}),
  p('Bloqueio Aéreo',{nature:'defensive',domains:{aerial_defense:.45,defense:.35,physical:.2},actions:{aerial_defend:.62,defensive_duel:.22,cover_space:.16},positions:{CB:1,DMF:.82,LB:.38,RB:.38,CMF:.22},attributes:['heading','jump','physicalContact','defensiveAwareness'],explanation:'Bloqueio e domínio aéreo em ações defensivas; não é um Ímpeto de ataque aéreo.'}),
  p('Rompe-barreira',{nature:'offensive',domains:{dribble:.34,movement:.3,finishing:.2,physical:.16},actions:{carry:.38,attack_space:.28,turn_finish:.2,hold_up:.14},positions:{LWF:1,RWF:1,CF:.86,SS:.96,AMF:.78},attributes:['dribbling','speed','kickingPower','physicalContact'],explanation:'Progressão agressiva com bola e ruptura.'}),
  p('Força',{nature:'physical',domains:{physical:.54,movement:.22,aerial_attack:.14,aerial_defense:.1},actions:{hold_up:.38,defensive_duel:.26,attack_space:.16,aerial_finish:.1,aerial_defend:.1},positions:{CF:.94,CB:1,DMF:.92,CMF:.66,SS:.48,GK:.38},attributes:['physicalContact','kickingPower','jump','stamina'],explanation:'Potência corporal aplicada à função natural.'}),
  p('Movimento sem a bola',{nature:'offensive',domains:{movement:.58,finishing:.42},actions:{attack_space:.58,finish_box:.3,press_recover:.12},positions:{CF:1,SS:1,LWF:.9,RWF:.9,AMF:.76},attributes:['offensiveAwareness','speed','acceleration','stamina'],explanation:'Ruptura, ataque de espaço e chegada.'}),
  p('Roubo de bola',{nature:'defensive',domains:{defense:.52,physical:.26,movement:.22},actions:{intercept:.38,defensive_duel:.34,press_recover:.28},positions:{CB:1,DMF:1,CMF:.84,LB:.88,RB:.88,LMF:.48,RMF:.48},attributes:['tackling','aggression','defensiveEngagement','acceleration'],explanation:'Recuperação ativa e tomada de bola.'})
];

export function impetoProfileR119(name: string): ImpetoFunctionalProfileR119 | null {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return IMPETO_FUNCTIONAL_MATRIX_R119.find((item) => item.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === normalized) ?? null;
}
