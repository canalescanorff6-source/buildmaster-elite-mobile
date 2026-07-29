import type { AnalysisResult, PositionCode, TrainingKey, TrainingPlan, UnifiedSkillDecision } from './analyzerDomain';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES } from '@/modules/analysis/analyzerCatalog';
import { TRAINING_LABELS } from './trainingEngine';
import { buildOwnedSkillKeys, filterComplementaryAdditionalSkills, skillIdentityKey } from './officialSkillIdentity';

type SkillCategory = UnifiedSkillDecision['category'];
type Candidate = UnifiedSkillDecision & { rawScore: number; rolePosition: PositionCode };

export const ADDITIONAL_SKILL_ENGINE_VERSION = '31.82-position-style-formation-exact-five-1';

const CATEGORY_BY_SKILL: Record<string, SkillCategory> = {
  'Pedalada simples': 'drible', 'Toque duplo': 'drible', 'Elástico': 'drible', 'Giro 360°': 'drible', 'Chapéu': 'drible',
  'Corte com virada': 'drible', 'Puxada de letra': 'drible', 'Finta de letra': 'drible', 'Corte rápido': 'drible', 'Controle com a sola': 'drible',
  'Cabeçada': 'aérea', 'Efeito de longe': 'finalização', 'Controle da cavadinha': 'finalização', 'Chute com o peito do pé': 'finalização',
  'Folha seca': 'finalização', 'Chute ascendente': 'finalização', 'Precisão à distância': 'finalização',
  'Finalização acrobática': 'finalização', 'Chute de primeira': 'finalização', 'Especialista em pênalti': 'finalização',
  'Toque de calcanhar': 'passe', 'Passe de primeira': 'passe', 'Passe em profundidade': 'passe', 'Passe na medida': 'passe',
  'Cruzamento preciso': 'passe', 'Curva para fora': 'passe', 'De letra': 'passe', 'Passe sem olhar': 'passe',
  'Passe aéreo baixo': 'passe', 'Arremesso lateral longo': 'passe', 'Malícia': 'mental', 'Marcação individual': 'defesa',
  'Volta para marcar': 'defesa', 'Interceptação': 'defesa', 'Bloqueador': 'defesa', 'Superioridade aérea': 'aérea',
  'Carrinho': 'defesa', 'Afastamento acrobático': 'defesa', 'Liderança': 'mental', 'Super substituto': 'mental',
  'Espírito guerreiro': 'físico', 'Pegador de pênalti': 'goleiro', 'Arremesso longo do goleiro': 'goleiro',
  'Reposição alta do goleiro': 'goleiro', 'Reposição baixa do goleiro': 'goleiro'
};

const POSITION_SKILL_POOLS: Record<PositionCode, readonly string[]> = {
  // Os pools são deliberadamente maiores que cinco. Assim, mesmo quando a
  // carta já possui várias habilidades, o motor ainda consegue entregar cinco
  // opções adicionais úteis sem recorrer a habilidades de outra função.
  GK: [
    // Somente habilidades de goleiro, distribuição e liderança. Nenhuma
    // habilidade de finalização, drible ou defesa de jogador de linha entra.
    'Reposição baixa do goleiro', 'Reposição alta do goleiro', 'Arremesso longo do goleiro', 'Pegador de pênalti',
    'Espírito guerreiro', 'Liderança', 'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe aéreo baixo'
  ],
  CB: [
    'Interceptação', 'Bloqueador', 'Marcação individual', 'Superioridade aérea', 'Afastamento acrobático', 'Carrinho',
    'Espírito guerreiro', 'Liderança', 'Passe de primeira', 'Passe em profundidade', 'Passe na medida',
    'Passe aéreo baixo', 'Cabeçada', 'Volta para marcar', 'Controle com a sola', 'Toque de calcanhar'
  ],
  DMF: [
    'Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Espírito guerreiro', 'Superioridade aérea',
    'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe aéreo baixo', 'Controle com a sola',
    'Carrinho', 'Liderança', 'Afastamento acrobático', 'Toque de calcanhar', 'Cruzamento preciso'
  ],
  LB: [
    'Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Espírito guerreiro', 'Cruzamento preciso',
    'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe aéreo baixo', 'Curva para fora',
    'Controle com a sola', 'Superioridade aérea', 'Arremesso lateral longo', 'Carrinho', 'Afastamento acrobático',
    'Toque duplo', 'Toque de calcanhar'
  ],
  RB: [
    'Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Espírito guerreiro', 'Cruzamento preciso',
    'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe aéreo baixo', 'Curva para fora',
    'Controle com a sola', 'Superioridade aérea', 'Arremesso lateral longo', 'Carrinho', 'Afastamento acrobático',
    'Toque duplo', 'Toque de calcanhar'
  ],
  CMF: [
    'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe aéreo baixo', 'Controle com a sola',
    'Toque de calcanhar', 'Interceptação', 'Volta para marcar', 'Espírito guerreiro', 'Bloqueador',
    'Marcação individual', 'Passe sem olhar', 'Liderança', 'Toque duplo', 'Cruzamento preciso', 'Curva para fora'
  ],
  LMF: [
    'Cruzamento preciso', 'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe aéreo baixo',
    'Curva para fora', 'Volta para marcar', 'Espírito guerreiro', 'Controle com a sola', 'Toque duplo',
    'Interceptação', 'Arremesso lateral longo', 'Toque de calcanhar', 'Passe sem olhar', 'Corte rápido', 'Bloqueador'
  ],
  RMF: [
    'Cruzamento preciso', 'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe aéreo baixo',
    'Curva para fora', 'Volta para marcar', 'Espírito guerreiro', 'Controle com a sola', 'Toque duplo',
    'Interceptação', 'Arremesso lateral longo', 'Toque de calcanhar', 'Passe sem olhar', 'Corte rápido', 'Bloqueador'
  ],
  AMF: [
    'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe aéreo baixo', 'Controle com a sola',
    'Toque duplo', 'Toque de calcanhar', 'Passe sem olhar', 'Curva para fora', 'Precisão à distância',
    'Efeito de longe', 'Chute de primeira', 'Corte rápido', 'Espírito guerreiro', 'Cruzamento preciso',
    'Chute com o peito do pé', 'Giro 360°'
  ],
  SS: [
    'Chute de primeira', 'Passe de primeira', 'Passe em profundidade', 'Controle com a sola', 'Toque duplo',
    'Toque de calcanhar', 'Precisão à distância', 'Efeito de longe', 'Finalização acrobática', 'Corte rápido',
    'Espírito guerreiro', 'Passe na medida', 'Super substituto', 'Chute com o peito do pé',
    'Controle da cavadinha', 'Giro 360°', 'Passe sem olhar'
  ],
  LWF: [
    'Toque duplo', 'Controle com a sola', 'Corte rápido', 'Passe de primeira', 'Cruzamento preciso', 'Curva para fora',
    'Precisão à distância', 'Efeito de longe', 'Chute de primeira', 'Passe em profundidade', 'Passe na medida',
    'Passe aéreo baixo', 'Espírito guerreiro', 'Super substituto', 'Giro 360°', 'Chute com o peito do pé',
    'Toque de calcanhar', 'Finalização acrobática'
  ],
  RWF: [
    'Toque duplo', 'Controle com a sola', 'Corte rápido', 'Passe de primeira', 'Cruzamento preciso', 'Curva para fora',
    'Precisão à distância', 'Efeito de longe', 'Chute de primeira', 'Passe em profundidade', 'Passe na medida',
    'Passe aéreo baixo', 'Espírito guerreiro', 'Super substituto', 'Giro 360°', 'Chute com o peito do pé',
    'Toque de calcanhar', 'Finalização acrobática'
  ],
  CF: [
    'Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Cabeçada', 'Superioridade aérea',
    'Controle da cavadinha', 'Efeito de longe', 'Chute com o peito do pé', 'Folha seca', 'Chute ascendente',
    'Toque de calcanhar', 'Passe de primeira', 'Passe em profundidade', 'Espírito guerreiro',
    'Controle com a sola', 'Super substituto', 'Toque duplo', 'Especialista em pênalti'
  ]
};

const POSITION_CATEGORY_WEIGHTS: Record<PositionCode, Record<SkillCategory, number>> = {
  CF: { finalização: 36, passe: 13, drible: 14, defesa: -70, aérea: 22, físico: 10, goleiro: -120, mental: 5 },
  SS: { finalização: 25, passe: 28, drible: 27, defesa: -55, aérea: 6, físico: 8, goleiro: -120, mental: 6 },
  LWF: { finalização: 22, passe: 23, drible: 35, defesa: -55, aérea: 2, físico: 7, goleiro: -120, mental: 5 },
  RWF: { finalização: 22, passe: 23, drible: 35, defesa: -55, aérea: 2, físico: 7, goleiro: -120, mental: 5 },
  LMF: { finalização: 5, passe: 32, drible: 20, defesa: 18, aérea: 3, físico: 13, goleiro: -120, mental: 8 },
  RMF: { finalização: 5, passe: 32, drible: 20, defesa: 18, aérea: 3, físico: 13, goleiro: -120, mental: 8 },
  AMF: { finalização: 16, passe: 37, drible: 29, defesa: -45, aérea: 1, físico: 5, goleiro: -120, mental: 6 },
  CMF: { finalização: 4, passe: 36, drible: 17, defesa: 23, aérea: 4, físico: 16, goleiro: -120, mental: 10 },
  DMF: { finalização: -70, passe: 26, drible: 4, defesa: 42, aérea: 18, físico: 17, goleiro: -120, mental: 9 },
  CB: { finalização: -100, passe: 11, drible: -80, defesa: 48, aérea: 35, físico: 19, goleiro: -120, mental: 9 },
  LB: { finalização: -65, passe: 26, drible: 10, defesa: 38, aérea: 10, físico: 16, goleiro: -120, mental: 8 },
  RB: { finalização: -65, passe: 26, drible: 10, defesa: 38, aérea: 10, físico: 16, goleiro: -120, mental: 8 },
  GK: { finalização: -140, passe: 22, drible: -100, defesa: -70, aérea: -50, físico: 18, goleiro: 65, mental: 20 }
};

const CATEGORY_SOFT_CAPS: Record<PositionCode, Partial<Record<SkillCategory, number>>> = {
  GK: { goleiro: 4, passe: 2, mental: 1, físico: 1 },
  CB: { defesa: 3, aérea: 2, passe: 2, físico: 1, mental: 1 },
  DMF: { defesa: 3, passe: 2, aérea: 1, físico: 1, mental: 1 },
  LB: { defesa: 3, passe: 2, drible: 1, físico: 1 },
  RB: { defesa: 3, passe: 2, drible: 1, físico: 1 },
  CMF: { passe: 3, defesa: 2, drible: 1, físico: 1 },
  LMF: { passe: 3, defesa: 2, drible: 2, físico: 1 },
  RMF: { passe: 3, defesa: 2, drible: 2, físico: 1 },
  AMF: { passe: 3, drible: 2, finalização: 2 },
  SS: { finalização: 2, passe: 2, drible: 2 },
  LWF: { drible: 2, passe: 2, finalização: 2 },
  RWF: { drible: 2, passe: 2, finalização: 2 },
  CF: { finalização: 3, aérea: 2, passe: 1, físico: 1, drible: 1 }
};

const POSITION_SLOT_BLUEPRINTS: Record<PositionCode, readonly SkillCategory[]> = {
  GK: ['goleiro', 'goleiro', 'goleiro', 'passe', 'mental'],
  CB: ['defesa', 'defesa', 'aérea', 'passe', 'mental'],
  DMF: ['defesa', 'defesa', 'passe', 'passe', 'físico'],
  LB: ['defesa', 'defesa', 'passe', 'passe', 'físico'],
  RB: ['defesa', 'defesa', 'passe', 'passe', 'físico'],
  CMF: ['passe', 'passe', 'defesa', 'físico', 'drible'],
  LMF: ['passe', 'passe', 'defesa', 'drible', 'físico'],
  RMF: ['passe', 'passe', 'defesa', 'drible', 'físico'],
  AMF: ['passe', 'passe', 'drible', 'drible', 'finalização'],
  SS: ['finalização', 'passe', 'passe', 'drible', 'físico'],
  LWF: ['drible', 'drible', 'passe', 'finalização', 'físico'],
  RWF: ['drible', 'drible', 'passe', 'finalização', 'físico'],
  CF: ['finalização', 'finalização', 'finalização', 'aérea', 'físico']
};

function slotBlueprintFor(result: AnalysisResult, position: PositionCode): readonly SkillCategory[] {
  const style = norm(result.parsed.playstyle);
  const formation = String(result.tacticalProfile.formation);
  if (position === 'GK') {
    if (/ofensivo|offensive/.test(style)) return ['goleiro', 'goleiro', 'passe', 'passe', 'mental'];
    return ['goleiro', 'goleiro', 'goleiro', 'mental', 'físico'];
  }
  if (['LB', 'RB', 'LMF', 'RMF'].includes(position) && ['3-4-3', '3-5-2', '5-3-2', '5-2-3'].includes(formation)) {
    return ['passe', 'defesa', 'passe', 'físico', 'drible'];
  }
  if (position === 'CB') {
    if (/defensor criativo|build up/.test(style)) return ['defesa', 'passe', 'passe', 'aérea', 'mental'];
    if (/destruidor|destroyer|atacante surpresa|extra frontman/.test(style)) return ['defesa', 'defesa', 'defesa', 'aérea', 'físico'];
  }
  if (position === 'DMF') {
    if (/orquestrador|orchestrator/.test(style)) return ['passe', 'passe', 'defesa', 'defesa', 'físico'];
    if (/primeiro volante|anchor man/.test(style)) return ['defesa', 'defesa', 'passe', 'físico', 'aérea'];
    if (['4-1-2-3', '4-1-3-2', '4-1-4-1'].includes(formation)) return ['defesa', 'defesa', 'passe', 'físico', 'aérea'];
  }
  if (position === 'AMF' || position === 'CMF') {
    if (/infiltra|hole player/.test(style)) return ['passe', 'passe', 'finalização', 'drible', 'físico'];
    if (/armador|creative|orquestrador|classic|cl[aá]ssico/.test(style)) return ['passe', 'passe', 'passe', 'drible', 'mental'];
  }
  if (['LB', 'RB', 'LMF', 'RMF', 'LWF', 'RWF'].includes(position) && /perito em cruzamento|cross specialist/.test(style)) {
    return ['passe', 'passe', 'passe', 'drible', 'físico'];
  }
  if (position === 'CF') {
    if (/piv[oô]|target man/.test(style)) return ['aérea', 'aérea', 'finalização', 'passe', 'físico'];
    if (/recuado|deep.lying forward/.test(style)) return ['passe', 'passe', 'finalização', 'drible', 'físico'];
    if (/homem de area|fox in the box/.test(style)) return ['finalização', 'finalização', 'aérea', 'aérea', 'físico'];
    if (['5-3-2', '3-5-2'].includes(formation)) return ['finalização', 'finalização', 'aérea', 'passe', 'físico'];
    if (['4-2-2-2', '4-3-1-2', '4-1-3-2', '4-4-2'].includes(formation)) return ['finalização', 'finalização', 'passe', 'drible', 'físico'];
    return ['finalização', 'finalização', 'finalização', 'drible', 'físico'];
  }
  return POSITION_SLOT_BLUEPRINTS[position];
}



const SKILL_IMPACT: Record<string, string> = {
  'Chute de primeira': 'Finaliza sem precisar dominar, reduzindo o tempo de resposta dentro da área.',
  'Precisão à distância': 'Aumenta a ameaça em chutes fortes de média e longa distância.',
  'Finalização acrobática': 'Cria soluções de finalização em bolas altas, cruzadas ou fora do eixo corporal.',
  'Efeito de longe': 'Melhora chutes colocados quando curva e força do chute sustentam a ação.',
  'Cabeçada': 'Transforma cruzamentos em finalizações mais consistentes.',
  'Passe de primeira': 'Acelera tabelas e reduz perdas quando o jogador recebe pressionado.',
  'Passe em profundidade': 'Melhora bolas verticais para companheiros atacando espaço.',
  'Passe na medida': 'Qualifica lançamentos, inversões e reposições de maior distância.',
  'Cruzamento preciso': 'Aumenta a utilidade de jogadores que chegam pelo corredor lateral.',
  'Controle com a sola': 'Melhora domínio orientado e pequenos ajustes antes do passe ou chute.',
  'Toque duplo': 'Entrega uma saída objetiva no primeiro duelo e combina com aceleração e drible.',
  'Toque de calcanhar': 'Permite tabelas e passes em ângulos nos quais girar faria a jogada morrer.',
  'Interceptação': 'Aumenta cortes automáticos em linhas de passe frequentes na função.',
  'Bloqueador': 'Melhora o fechamento de chutes e passes em zonas perigosas.',
  'Marcação individual': 'Mantém o defensor mais conectado ao adversário prioritário.',
  'Superioridade aérea': 'Reforça disputas pelo alto quando altura, salto e contato físico sustentam a habilidade.',
  'Afastamento acrobático': 'Amplia as soluções para cortar bolas difíceis dentro da área.',
  'Volta para marcar': 'Aumenta recomposição de jogadores de corredor e meias de apoio.',
  'Espírito guerreiro': 'Ajuda a manter ações úteis sob pressão e cansaço.',
  'Super substituto': 'É útil quando a carta entra com frequência durante o segundo tempo.',
  'Pegador de pênalti': 'Especializa o goleiro em cobranças de pênalti.',
  'Arremesso longo do goleiro': 'Acelera transições com reposição longa pelas mãos.',
  'Reposição alta do goleiro': 'Melhora reposições altas para iniciar ataques diretos.',
  'Reposição baixa do goleiro': 'Cria reposição tensa e rápida para iniciar a saída curta.'
};

const COMPLEMENTS: Array<[string, string]> = [
  ['Passe de primeira', 'Passe em profundidade'], ['Passe de primeira', 'Toque de calcanhar'],
  ['Controle com a sola', 'Toque duplo'], ['Precisão à distância', 'Efeito de longe'],
  ['Chute de primeira', 'Finalização acrobática'], ['Cabeçada', 'Superioridade aérea'],
  ['Interceptação', 'Bloqueador'], ['Marcação individual', 'Interceptação'],
  ['Cruzamento preciso', 'Passe na medida'], ['Reposição baixa do goleiro', 'Arremesso longo do goleiro']
];

function clamp(value: number, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(value))); }
function norm(value: string | null | undefined) { return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function hash(value: string) { let output = 2166136261; for (let index = 0; index < value.length; index += 1) { output ^= value.charCodeAt(index); output = Math.imul(output, 16777619); } return output >>> 0; }
function average(...values: Array<number | null | undefined>) { const valid = values.map((value) => Number(value ?? 0)).filter((value) => value > 0); return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0; }

export function resolveAdditionalSkillPosition(result: AnalysisResult): PositionCode {
  // A posição escolhida pelo usuário é autoritativa no resultado final. Nem a
  // posição original da carta nem uma leitura isolada de atributos pode trocar
  // GOL por ZAG/CA ou o contrário durante a recomendação das cinco habilidades.
  return result.bestPosition.code;
}

export function isRoleCompatibleAdditionalSkill(skill: string, position: PositionCode) {
  return POSITION_SKILL_POOLS[position].includes(skill);
}

type CardSkillProfile = {
  aerialTarget: boolean;
  agileCarrier: boolean;
  creativeHub: boolean;
  distanceThreat: boolean;
  defensiveAnchor: boolean;
  progressiveDefender: boolean;
  wideProvider: boolean;
  pressingRunner: boolean;
  goalkeeperDistributor: boolean;
};

function cardSkillProfile(result: AnalysisResult, position: PositionCode): CardSkillProfile {
  const a = result.parsed.attributes;
  const height = Number(result.parsed.height ?? 0);
  const wide = ['LB', 'RB', 'LMF', 'RMF', 'LWF', 'RWF'].includes(position);
  const defender = ['CB', 'DMF', 'LB', 'RB'].includes(position);
  return {
    aerialTarget: height >= 181 && average(a.heading, a.jump, a.physicalContact) >= 76,
    agileCarrier: average(a.ballControl, a.dribbling, a.tightPossession, a.balance, a.acceleration) >= 79,
    creativeHub: average(a.lowPass, a.loftedPass, a.ballControl) >= 78,
    distanceThreat: average(a.finishing, a.kickingPower, a.curl) >= 79,
    defensiveAnchor: defender && average(a.defensiveAwareness, a.tackling, a.defensiveEngagement, a.physicalContact) >= 76,
    progressiveDefender: defender && average(a.lowPass, a.loftedPass, a.ballControl) >= 72,
    wideProvider: wide && average(a.loftedPass, a.curl, a.speed, a.stamina) >= 75,
    pressingRunner: average(a.stamina, a.speed, a.acceleration, a.defensiveEngagement) >= 77,
    goalkeeperDistributor: position === 'GK' && average(a.lowPass, a.loftedPass, a.kickingPower) >= 67
  };
}

function profileAdjustment(result: AnalysisResult, position: PositionCode, skill: string): { score: number; reasons: string[] } {
  const profile = cardSkillProfile(result, position);
  const a = result.parsed.attributes;
  const reasons: string[] = [];
  let score = 0;
  const boost = (condition: boolean, points: number, reason: string) => { if (condition) { score += points; reasons.push(reason); } };
  const penalize = (condition: boolean, points: number) => { if (condition) score -= points; };

  boost(profile.aerialTarget && ['Cabeçada', 'Superioridade aérea', 'Finalização acrobática'].includes(skill), 14, 'O modelo corporal e os atributos aéreos tornam esta habilidade recorrente.');
  boost(profile.agileCarrier && ['Toque duplo', 'Controle com a sola', 'Giro 360°', 'Elástico', 'Corte com virada', 'Corte rápido'].includes(skill), 12, 'A carta possui controle corporal para transformar o drible em vantagem real.');
  boost(profile.creativeHub && ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe sem olhar', 'Toque de calcanhar', 'Passe aéreo baixo'].includes(skill), 13, 'O DNA criativo da carta sustenta passes rápidos e progressivos.');
  boost(profile.distanceThreat && ['Precisão à distância', 'Efeito de longe', 'Chute com o peito do pé', 'Chute ascendente', 'Folha seca'].includes(skill), 12, 'Finalização, força e curva sustentam ameaça real fora da área.');
  boost(profile.defensiveAnchor && ['Interceptação', 'Bloqueador', 'Marcação individual', 'Afastamento acrobático', 'Carrinho'].includes(skill), 15, 'O perfil defensivo ativa esta habilidade com frequência na zona de atuação.');
  boost(profile.progressiveDefender && ['Passe de primeira', 'Passe em profundidade', 'Passe aéreo baixo', 'Passe na medida'].includes(skill), 10, 'A carta recupera e acelera a saída de bola sem abandonar a função defensiva.');
  boost(profile.wideProvider && ['Cruzamento preciso', 'Passe na medida', 'Curva para fora', 'Passe aéreo baixo'].includes(skill), 13, 'A atuação pelo corredor e o passe alto tornam a habilidade diretamente útil.');
  boost(profile.pressingRunner && ['Volta para marcar', 'Espírito guerreiro'].includes(skill), 9, 'Velocidade e resistência permitem repetir ações de pressão e recomposição.');
  boost(profile.goalkeeperDistributor && ['Reposição baixa do goleiro', 'Reposição alta do goleiro', 'Arremesso longo do goleiro', 'Passe de primeira', 'Passe na medida', 'Passe aéreo baixo'].includes(skill), 15, 'O goleiro possui recursos para acelerar a primeira fase da construção.');

  const fancyDribble = ['Chapéu', 'Elástico', 'Puxada de letra', 'Finta de letra', 'Pedalada simples', 'Giro 360°', 'Corte com virada'].includes(skill);
  penalize(fancyDribble && !profile.agileCarrier, 28);
  penalize(skill === 'Arremesso lateral longo' && !['LB', 'RB', 'LMF', 'RMF'].includes(position), 60);
  penalize(skill === 'Cruzamento preciso' && !['LB', 'RB', 'LMF', 'RMF', 'LWF', 'RWF'].includes(position), 38);
  penalize(['Carrinho', 'Marcação individual', 'Bloqueador', 'Interceptação', 'Afastamento acrobático'].includes(skill) && !['CB', 'DMF', 'LB', 'RB', 'CMF', 'LMF', 'RMF'].includes(position), 70);
  penalize(skill === 'Cabeçada' && average(a.heading, a.jump, a.physicalContact) < 70, 28);
  penalize(skill === 'Superioridade aérea' && (Number(result.parsed.height ?? 0) < 176 || average(a.jump, a.physicalContact) < 70), 28);
  penalize(skill === 'Especialista em pênalti' && Number(a.finishing ?? 0) < 76, 22);
  penalize(skill === 'Super substituto' && !`${norm(result.note)} ${result.usageTips.map(norm).join(' ')}`.match(/banco|segundo tempo|substitut/), 20);
  return { score, reasons };
}

function trainingSupport(skill: string): Array<{ key: TrainingKey; weight: number }> {
  const category = CATEGORY_BY_SKILL[skill] ?? 'mental';
  if (category === 'finalização') return [{ key: 'shooting', weight: 2.2 }, { key: 'dexterity', weight: 0.8 }];
  if (category === 'passe') return [{ key: 'passing', weight: 2.1 }, { key: 'dribbling', weight: 0.25 }];
  if (category === 'drible') return [{ key: 'dribbling', weight: 1.8 }, { key: 'dexterity', weight: 1.2 }];
  if (category === 'defesa') return [{ key: 'defending', weight: 2.3 }, { key: 'lowerBodyStrength', weight: 0.45 }];
  if (category === 'aérea') return [{ key: 'aerialStrength', weight: 2.1 }, { key: 'defending', weight: 0.45 }, { key: 'shooting', weight: 0.35 }];
  if (category === 'físico') return [{ key: 'lowerBodyStrength', weight: 1.7 }, { key: 'aerialStrength', weight: 0.8 }];
  if (category === 'goleiro') return [{ key: 'gk1', weight: 1 }, { key: 'gk2', weight: 1.4 }, { key: 'gk3', weight: 1.2 }];
  return [{ key: 'lowerBodyStrength', weight: 0.55 }];
}

function styleScore(result: AnalysisResult, position: PositionCode, skill: string) {
  const style = norm(result.parsed.playstyle);
  let score = 0;
  const reasons: string[] = [];
  const add = (patterns: RegExp, skills: string[], points: number, reason: string) => {
    if (patterns.test(style) && skills.includes(skill)) { score += points; reasons.push(reason); }
  };

  add(/goleiro ofensivo|offensive goalkeeper/, ['Reposição baixa do goleiro', 'Reposição alta do goleiro', 'Arremesso longo do goleiro', 'Passe de primeira', 'Passe na medida', 'Passe aéreo baixo'], 18, 'A habilidade reforça a saída rápida do Goleiro Ofensivo.');
  add(/goleiro defensivo|defensive goalkeeper/, ['Pegador de pênalti', 'Reposição alta do goleiro', 'Espírito guerreiro', 'Liderança'], 15, 'A habilidade reforça segurança e resposta do Goleiro Defensivo.');
  add(/destruidor|destroyer|primeiro volante|anchor man|lateral defensivo|atacante surpresa|extra frontman/, ['Interceptação', 'Bloqueador', 'Marcação individual', 'Carrinho', 'Superioridade aérea', 'Espírito guerreiro'], 16, 'Reforça o comportamento defensivo do estilo oficial.');
  add(/defensor criativo|build up/, ['Passe de primeira', 'Passe na medida', 'Passe aéreo baixo', 'Interceptação', 'Bloqueador'], 15, 'Melhora a saída de bola sem enfraquecer a defesa.');
  add(/perito em cruzamento|cross specialist/, ['Cruzamento preciso', 'Passe na medida', 'Curva para fora', 'Passe aéreo baixo'], 17, 'Amplifica a função de cruzamento do estilo oficial.');
  add(/armador criativo|creative playmaker|orquestrador|orchestrator|cl[aá]ssico 10|classic no.? 10|meia vers[aá]til|box.to.box/, ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Controle com a sola', 'Toque de calcanhar', 'Passe sem olhar'], 16, 'Aumenta a influência criativa do estilo oficial.');
  add(/infiltra|hole player/, ['Chute de primeira', 'Passe de primeira', 'Controle com a sola', 'Toque duplo', 'Precisão à distância'], 14, 'A habilidade combina com entradas entre linhas e na área.');
  add(/artilheiro|goal poacher/, ['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Chute com o peito do pé', 'Controle da cavadinha'], 18, 'A habilidade reduz o tempo de finalização do Artilheiro.');
  add(/homem de area|fox in the box/, ['Chute de primeira', 'Finalização acrobática', 'Cabeçada', 'Superioridade aérea'], 18, 'A habilidade reforça a decisão curta e o jogo aéreo do Homem de Área.');
  add(/piv[oô]|target man/, ['Cabeçada', 'Superioridade aérea', 'Toque de calcanhar', 'Passe de primeira', 'Espírito guerreiro'], 20, 'A habilidade reforça proteção, apoio e conclusão do Pivô.');
  add(/recuado|deep.lying forward/, ['Passe de primeira', 'Passe em profundidade', 'Controle com a sola', 'Toque de calcanhar', 'Passe na medida'], 19, 'A habilidade reforça conexão e criação do atacante recuado.');
  add(/ponta prol[ií]fico|prolific winger|flanco movel|roaming flank|lateral finalizador|full.back finisher/, ['Toque duplo', 'Controle com a sola', 'Corte rápido', 'Cruzamento preciso', 'Curva para fora', 'Precisão à distância'], 15, 'A habilidade combina com condução, aceleração e decisão pelo corredor.');

  if (position === 'GK' && !POSITION_SKILL_POOLS.GK.includes(skill)) score -= 200;
  return { score, reasons };
}

function tacticalSkillScore(result: AnalysisResult, position: PositionCode, skill: string) {
  const formation = String(result.tacticalProfile.formation);
  const collectiveStyle = result.tacticalProfile.style;
  let score = 0;
  const reasons: string[] = [];
  const add = (condition: boolean, skills: string[], points: number, reason: string) => {
    if (condition && skills.includes(skill)) { score += points; reasons.push(reason); }
  };

  add(collectiveStyle === 'POSSE_DE_BOLA', ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Controle com a sola', 'Toque de calcanhar'], 9, 'Combina com a circulação curta e o apoio exigidos pela Posse de Bola.');
  add(collectiveStyle === 'CONTRA_ATAQUE_RAPIDO', ['Passe de primeira', 'Passe em profundidade', 'Chute de primeira', 'Controle com a sola', 'Volta para marcar'], 9, 'Acelera a ação decisiva no Contra-Ataque Rápido.');
  add(collectiveStyle === 'CONTRA_ATAQUE', ['Passe em profundidade', 'Passe na medida', 'Superioridade aérea', 'Espírito guerreiro', 'Interceptação'], 8, 'Reforça transição, duelo e ataque direto no Contra-Ataque.');

  const narrowAttack = ['4-2-2-2', '4-3-1-2', '4-1-3-2', '4-4-2'].includes(formation);
  const wideFront = ['4-3-3', '4-1-2-3', '4-2-1-3', '3-4-3', '5-2-3'].includes(formation);
  const backThreeOrFive = ['3-2-4-1', '3-4-3', '3-5-2', '5-3-2', '5-2-3'].includes(formation);

  add((position === 'CF' || position === 'SS') && narrowAttack, ['Chute de primeira', 'Passe de primeira', 'Passe em profundidade', 'Toque de calcanhar'], 11, 'A formação estreita exige tabelas rápidas e conclusão com pouco espaço.');
  add((position === 'CF' || position === 'SS') && ['5-3-2', '3-5-2'].includes(formation), ['Cabeçada', 'Superioridade aérea', 'Espírito guerreiro', 'Finalização acrobática'], 12, 'No ataque de dois homens, apoio físico e jogo aéreo ganham valor.');
  add(['LWF', 'RWF'].includes(position) && wideFront, ['Toque duplo', 'Controle com a sola', 'Corte rápido', 'Cruzamento preciso', 'Passe de primeira'], 11, 'O corredor aberto da formação aumenta o uso de condução, corte e cruzamento.');
  add(['LB', 'RB', 'LMF', 'RMF'].includes(position) && backThreeOrFive, ['Cruzamento preciso', 'Passe de primeira', 'Volta para marcar', 'Interceptação', 'Espírito guerreiro'], 12, 'A função de ala exige ida e volta, passe e recomposição na linha de três/cinco.');
  add(position === 'DMF' && ['4-1-2-3', '4-1-3-2', '4-1-4-1'].includes(formation), ['Interceptação', 'Bloqueador', 'Marcação individual', 'Passe de primeira', 'Passe na medida'], 12, 'Como volante único, precisa proteger o centro e iniciar a saída sem perder tempo.');
  add(position === 'CB' && backThreeOrFive, ['Bloqueador', 'Interceptação', 'Superioridade aérea', 'Afastamento acrobático', 'Passe na medida'], 11, 'A linha de três/cinco aumenta coberturas, bloqueios e responsabilidade aérea.');
  add(position === 'AMF' && ['4-2-3-1', '4-3-1-2', '4-2-2-2'].includes(formation), ['Passe de primeira', 'Passe em profundidade', 'Controle com a sola', 'Toque de calcanhar', 'Chute de primeira'], 10, 'O meia entrelinhas precisa conectar e decidir antes do fechamento da defesa.');

  return { score, reasons };
}

function specificScore(result: AnalysisResult, position: PositionCode, skill: string): { score: number; reasons: string[]; supportedBy: string[] } {
  const a = result.parsed.attributes;
  const reasons: string[] = [];
  const supportedBy: string[] = [];
  let score = 0;
  const addAttribute = (label: string, value: number | null | undefined, threshold: number, bonus: number) => {
    if (Number(value ?? 0) >= threshold) { score += bonus; supportedBy.push(`${label} ${value}`); }
  };

  if (skill === 'Chute de primeira') { addAttribute('Finalização', a.finishing, 78, 14); addAttribute('Talento ofensivo', a.offensiveAwareness, 78, 10); }
  if (skill === 'Precisão à distância') { addAttribute('Força do chute', a.kickingPower, 80, 12); addAttribute('Finalização', a.finishing, 76, 8); }
  if (skill === 'Efeito de longe') { addAttribute('Curva', a.curl, 76, 12); addAttribute('Força do chute', a.kickingPower, 78, 7); }
  if (skill === 'Finalização acrobática') { addAttribute('Finalização', a.finishing, 76, 8); addAttribute('Salto', a.jump, 76, 7); }
  if (skill === 'Cabeçada' || skill === 'Superioridade aérea') { addAttribute('Cabeçada', a.heading, 74, 10); addAttribute('Salto', a.jump, 76, 9); addAttribute('Contato físico', a.physicalContact, 76, 7); }
  if (skill.includes('Passe') || skill === 'Toque de calcanhar' || skill === 'Cruzamento preciso' || skill === 'Curva para fora') { addAttribute('Passe rasteiro', a.lowPass, position === 'GK' ? 60 : 70, 8); addAttribute('Passe alto', a.loftedPass, position === 'GK' ? 62 : 72, 7); }
  if (['Controle com a sola', 'Toque duplo', 'Giro 360°', 'Corte rápido'].includes(skill)) { addAttribute('Controle de bola', a.ballControl, 74, 7); addAttribute('Drible', a.dribbling, 74, 8); addAttribute('Equilíbrio', a.balance, 74, 6); }
  if (['Interceptação', 'Bloqueador', 'Marcação individual'].includes(skill)) { addAttribute('Talento defensivo', a.defensiveAwareness, 74, 10); addAttribute('Desarme', a.tackling, 74, 8); addAttribute('Dedicação defensiva', a.defensiveEngagement, 74, 7); }
  if (skill === 'Volta para marcar') { addAttribute('Resistência', a.stamina, 76, 10); }
  if (skill === 'Espírito guerreiro') { addAttribute('Resistência', a.stamina, 76, 8); addAttribute('Contato físico', a.physicalContact, 74, 6); }
  if (skill === 'Pegador de pênalti') { addAttribute('Reflexos de GO', a.goalkeeperReflexes, 80, 12); addAttribute('Talento de GO', a.goalkeeperAwareness, 80, 8); }
  if (['Reposição baixa do goleiro', 'Reposição alta do goleiro', 'Arremesso longo do goleiro'].includes(skill)) { addAttribute('Força do chute', a.kickingPower, 70, 7); addAttribute('Talento de GO', a.goalkeeperAwareness, 78, 5); }

  const style = styleScore(result, position, skill);
  const tactical = tacticalSkillScore(result, position, skill);
  score += style.score + tactical.score;
  reasons.push(...style.reasons, ...tactical.reasons);
  return { score, reasons, supportedBy };
}

function buildCandidate(result: AnalysisResult, plan: TrainingPlan, position: PositionCode, skill: string, owned: Set<string>): Candidate | null {
  if (!isRoleCompatibleAdditionalSkill(skill, position)) return null;
  if (owned.has(skillIdentityKey(skill))) return null;
  const category = CATEGORY_BY_SKILL[skill] ?? 'mental';
  const base = POSITION_CATEGORY_WEIGHTS[position][category];
  if (base <= -100) return null;
  const specific = specificScore(result, position, skill);
  const profile = profileAdjustment(result, position, skill);
  const supports = trainingSupport(skill);
  const planScore = supports.reduce((sum, item) => sum + Number(plan[item.key] ?? 0) * item.weight, 0);
  const identityBoost = hash(`${result.parsed.internalId}|${result.parsed.playerName}|${result.parsed.cardType}|${result.parsed.playstyle}|${skill}`) % 3;
  // Recomendações antigas não participam da nota: elas poderiam trazer de
  // volta uma habilidade incompatível gerada por versões anteriores.
  const rawScore = base + specific.score + profile.score + planScore + identityBoost;
  const score = clamp(42 + rawScore * 0.72);
  const reasons = [
    ...specific.reasons.slice(0, 1),
    ...profile.reasons.slice(0, 1),
    supports.find((item) => Number(plan[item.key] ?? 0) >= 5) ? `A ficha investe em ${TRAINING_LABELS[supports.find((item) => Number(plan[item.key] ?? 0) >= 5)!.key]}, aumentando a frequência de uso.` : '',
    specific.supportedBy.length ? `Atributos que sustentam: ${specific.supportedBy.slice(0, 3).join(', ')}.` : `Compatível com a função ${position} e com o estilo da carta.`
  ].filter(Boolean).slice(0, 4);
  return {
    name: skill,
    score,
    rawScore,
    priority: score >= 86 ? 'essencial' : score >= 74 ? 'alta' : 'complementar',
    category,
    gameplayImpact: SKILL_IMPACT[skill] ?? 'Melhora uma ação recorrente da função sem repetir habilidade já existente.',
    reasons,
    supportedBy: specific.supportedBy,
    identityBoost,
    rolePosition: position
  };
}

function complementBonus(selected: Candidate[], candidate: Candidate) {
  let bonus = 0;
  for (const [left, right] of COMPLEMENTS) {
    if ((candidate.name === left && selected.some((item) => item.name === right)) || (candidate.name === right && selected.some((item) => item.name === left))) bonus += 7;
  }
  return bonus;
}

function categoryDiversityAdjustment(position: PositionCode, selected: Candidate[], candidate: Candidate) {
  const count = selected.filter((item) => item.category === candidate.category).length;
  const cap = CATEGORY_SOFT_CAPS[position][candidate.category] ?? 1;
  if (count < cap) return count === 0 ? 3 : 0;
  return -(count - cap + 1) * 8;
}

/** Sempre produz cinco opções treináveis quando existem cinco habilidades não possuídas no pool seguro da função. */
export function buildPersonalizedSkillPlan(result: AnalysisResult, plan: TrainingPlan): UnifiedSkillDecision[] {
  const position = resolveAdditionalSkillPosition(result);
  const owned = buildOwnedSkillKeys(result.parsed.nativeSkills, result.parsed.specialSkills);
  const orderedPool = POSITION_SKILL_POOLS[position].filter((skill) => OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(skill as (typeof OFFICIAL_ADDITIONAL_SKILL_NAMES)[number]));
  const candidates = orderedPool
    .map((skill) => buildCandidate(result, plan, position, skill, owned))
    .filter((item): item is Candidate => item !== null)
    .sort((a, b) => b.score - a.score || b.rawScore - a.rawScore || a.name.localeCompare(b.name, 'pt-BR'));

  const selected: Candidate[] = [];
  const rankedFor = (pool: Candidate[]) => pool
    .filter((candidate) => !selected.some((item) => item.name === candidate.name))
    .map((candidate) => ({
      candidate,
      combined: candidate.score + complementBonus(selected, candidate) + categoryDiversityAdjustment(position, selected, candidate)
    }))
    .sort((a, b) => b.combined - a.combined || b.candidate.score - a.candidate.score || a.candidate.name.localeCompare(b.candidate.name, 'pt-BR'));

  // Primeiro preenche os cinco papéis funcionais da posição. Isso impede que
  // uma nota alta concentre 5 passes em um zagueiro ou 5 finalizações em um SA.
  for (const category of slotBlueprintFor(result, position)) {
    const next = rankedFor(candidates.filter((candidate) => candidate.category === category))[0]?.candidate;
    if (next) selected.push(next);
  }

  // Se a carta já possuir todas as opções de uma categoria, completa apenas
  // com habilidades do pool seguro da mesma posição.
  while (selected.length < 5) {
    const next = rankedFor(candidates)[0]?.candidate;
    if (!next) break;
    selected.push(next);
  }

  const finalNames = filterComplementaryAdditionalSkills(
    selected.map((item) => item.name),
    result.parsed.nativeSkills,
    result.parsed.specialSkills,
    5
  );

  return finalNames.map((name, index) => {
    const item = selected.find((candidate) => candidate.name === name)!;
    return {
      name: item.name,
      score: item.score,
      priority: index === 0 || item.score >= 88 ? 'essencial' : index < 3 ? 'alta' : 'complementar',
      category: item.category,
      gameplayImpact: item.gameplayImpact,
      reasons: [`Função travada para ${position}; habilidades incompatíveis foram excluídas.`, ...item.reasons].slice(0, 4),
      supportedBy: item.supportedBy,
      identityBoost: item.identityBoost
    };
  });
}

export function skillPlanScore(plan: UnifiedSkillDecision[]) {
  if (!plan.length) return 0;
  const averageScore = plan.reduce((sum, item) => sum + item.score, 0) / plan.length;
  const diversity = new Set(plan.map((item) => item.category)).size;
  return clamp(averageScore * 0.88 + diversity * 3);
}
