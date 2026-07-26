import type { AnalysisResult, PositionCode, TrainingKey, TrainingPlan, UnifiedSkillDecision } from './analyzerDomain';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES } from '@/modules/analysis/analyzerCatalog';
import { TRAINING_LABELS } from './trainingEngine';

type SkillCategory = UnifiedSkillDecision['category'];
type Candidate = UnifiedSkillDecision & { rawScore: number };

const CATEGORY_BY_SKILL: Record<string, SkillCategory> = {
  'Pedalada simples': 'drible', 'Toque duplo': 'drible', 'Elástico': 'drible', 'Giro 360°': 'drible', 'Chapéu': 'drible',
  'Corte com virada': 'drible', 'Puxada de letra': 'drible', 'Finta de letra': 'drible', 'Controle com a sola': 'drible',
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

const POSITION_CATEGORY_WEIGHTS: Record<PositionCode, Record<SkillCategory, number>> = {
  CF: { finalização: 34, passe: 17, drible: 18, defesa: -35, aérea: 18, físico: 8, goleiro: -100, mental: 7 },
  SS: { finalização: 22, passe: 27, drible: 26, defesa: -22, aérea: 5, físico: 7, goleiro: -100, mental: 6 },
  LWF: { finalização: 20, passe: 21, drible: 34, defesa: -18, aérea: 2, físico: 6, goleiro: -100, mental: 5 },
  RWF: { finalização: 20, passe: 21, drible: 34, defesa: -18, aérea: 2, físico: 6, goleiro: -100, mental: 5 },
  LMF: { finalização: 7, passe: 31, drible: 20, defesa: 18, aérea: 4, físico: 13, goleiro: -100, mental: 8 },
  RMF: { finalização: 7, passe: 31, drible: 20, defesa: 18, aérea: 4, físico: 13, goleiro: -100, mental: 8 },
  AMF: { finalização: 15, passe: 35, drible: 29, defesa: -10, aérea: 1, físico: 5, goleiro: -100, mental: 6 },
  CMF: { finalização: 6, passe: 35, drible: 18, defesa: 20, aérea: 5, físico: 15, goleiro: -100, mental: 9 },
  DMF: { finalização: -25, passe: 24, drible: 5, defesa: 38, aérea: 17, físico: 16, goleiro: -100, mental: 8 },
  CB: { finalização: -45, passe: 8, drible: -25, defesa: 44, aérea: 32, físico: 17, goleiro: -100, mental: 8 },
  LB: { finalização: -12, passe: 24, drible: 12, defesa: 35, aérea: 11, físico: 15, goleiro: -100, mental: 7 },
  RB: { finalização: -12, passe: 24, drible: 12, defesa: 35, aérea: 11, físico: 15, goleiro: -100, mental: 7 },
  GK: { finalização: -100, passe: -40, drible: -100, defesa: -40, aérea: -20, físico: 8, goleiro: 55, mental: 14 }
};

const SKILL_IMPACT: Record<string, string> = {
  'Chute de primeira': 'Finaliza sem precisar dominar, reduzindo o tempo de resposta dentro da área.',
  'Precisão à distância': 'Aumenta a ameaça em chutes fortes de média e longa distância.',
  'Finalização acrobática': 'Cria soluções de finalização em bolas altas, cruzadas ou fora do eixo corporal.',
  'Efeito de longe': 'Melhora chutes colocados quando curva e força do chute já sustentam a ação.',
  'Cabeçada': 'Transforma cruzamentos em finalizações mais consistentes.',
  'Passe de primeira': 'Acelera tabelas e reduz perdas quando o jogador recebe pressionado.',
  'Passe em profundidade': 'Melhora bolas verticais para companheiros atacando espaço.',
  'Passe na medida': 'Qualifica lançamentos, inversões e passes de maior distância.',
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
  'Super substituto': 'É útil apenas quando a carta entra com frequência durante o segundo tempo.',
  'Pegador de pênalti': 'Aumenta a especialização do goleiro em cobranças de pênalti.',
  'Arremesso longo do goleiro': 'Acelera transições com reposição longa pelas mãos.',
  'Reposição alta do goleiro': 'Melhora reposições altas para iniciar ataques diretos.',
  'Reposição baixa do goleiro': 'Cria reposição tensa e rápida para iniciar transições.'
};

const COMPLEMENTS: Array<[string, string]> = [
  ['Passe de primeira', 'Passe em profundidade'], ['Passe de primeira', 'Toque de calcanhar'],
  ['Controle com a sola', 'Toque duplo'], ['Precisão à distância', 'Efeito de longe'],
  ['Chute de primeira', 'Finalização acrobática'], ['Cabeçada', 'Superioridade aérea'],
  ['Interceptação', 'Bloqueador'], ['Marcação individual', 'Interceptação'],
  ['Cruzamento preciso', 'Passe na medida']
];

function clamp(value: number, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(value))); }
function norm(value: string | null | undefined) { return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function hash(value: string) { let output = 2166136261; for (let index = 0; index < value.length; index += 1) { output ^= value.charCodeAt(index); output = Math.imul(output, 16777619); } return output >>> 0; }


type CardSkillProfile = {
  aerialTarget: boolean;
  agileCarrier: boolean;
  creativeHub: boolean;
  distanceThreat: boolean;
  defensiveAnchor: boolean;
  progressiveDefender: boolean;
  wideProvider: boolean;
  pressingRunner: boolean;
};

function average(...values: Array<number | null | undefined>) {
  const valid = values.map((value) => Number(value ?? 0)).filter((value) => value > 0);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}

function cardSkillProfile(result: AnalysisResult): CardSkillProfile {
  const a = result.parsed.attributes;
  const position = result.bestPosition.code;
  const height = Number(result.parsed.height ?? 0);
  const wide = ['LB', 'RB', 'LMF', 'RMF', 'LWF', 'RWF'].includes(position);
  const defender = ['CB', 'DMF', 'LB', 'RB'].includes(position);
  return {
    aerialTarget: height >= 183 && average(a.heading, a.jump, a.physicalContact) >= 78,
    agileCarrier: average(a.ballControl, a.dribbling, a.tightPossession, a.balance, a.acceleration) >= 80,
    creativeHub: average(a.lowPass, a.loftedPass, a.ballControl) >= 80,
    distanceThreat: average(a.finishing, a.kickingPower, a.curl) >= 80,
    defensiveAnchor: defender && average(a.defensiveAwareness, a.tackling, a.defensiveEngagement, a.physicalContact) >= 77,
    progressiveDefender: defender && average(a.lowPass, a.loftedPass, a.ballControl) >= 73,
    wideProvider: wide && average(a.loftedPass, a.curl, a.speed, a.stamina) >= 76,
    pressingRunner: average(a.stamina, a.speed, a.acceleration, a.defensiveEngagement) >= 78
  };
}

function profileAdjustment(result: AnalysisResult, skill: string): { score: number; reasons: string[] } {
  const profile = cardSkillProfile(result);
  const a = result.parsed.attributes;
  const position = result.bestPosition.code;
  const reasons: string[] = [];
  let score = 0;
  const boost = (condition: boolean, points: number, reason: string) => {
    if (condition) { score += points; reasons.push(reason); }
  };
  const penalize = (condition: boolean, points: number) => { if (condition) score -= points; };

  boost(profile.aerialTarget && ['Cabeçada', 'Superioridade aérea', 'Finalização acrobática'].includes(skill), 14, 'O modelo corporal e os atributos aéreos tornam esta habilidade recorrente nas partidas.');
  boost(profile.agileCarrier && ['Toque duplo', 'Controle com a sola', 'Giro 360°', 'Elástico', 'Corte com virada'].includes(skill), 12, 'A carta possui controle corporal para transformar a habilidade em vantagem real no primeiro duelo.');
  boost(profile.creativeHub && ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe sem olhar', 'Toque de calcanhar', 'Passe aéreo baixo'].includes(skill), 13, 'O DNA criativo da carta sustenta passes rápidos e progressivos.');
  boost(profile.distanceThreat && ['Precisão à distância', 'Efeito de longe', 'Chute com o peito do pé', 'Chute ascendente', 'Folha seca'].includes(skill), 12, 'Finalização, força e curva sustentam ameaça real fora da área.');
  boost(profile.defensiveAnchor && ['Interceptação', 'Bloqueador', 'Marcação individual', 'Afastamento acrobático', 'Carrinho'].includes(skill), 14, 'O perfil defensivo ativa esta habilidade com frequência na zona de atuação.');
  boost(profile.progressiveDefender && ['Passe de primeira', 'Passe em profundidade', 'Passe aéreo baixo', 'Passe na medida'].includes(skill), 9, 'A carta pode recuperar e acelerar a saída de bola sem abandonar a função defensiva.');
  boost(profile.wideProvider && ['Cruzamento preciso', 'Passe na medida', 'Curva para fora', 'Passe aéreo baixo'].includes(skill), 13, 'A atuação pelo corredor e o passe alto tornam a habilidade diretamente útil.');
  boost(profile.pressingRunner && ['Volta para marcar', 'Espírito guerreiro'].includes(skill), 9, 'Velocidade e resistência permitem repetir ações de pressão e recomposição.');

  const fancyDribble = ['Chapéu', 'Elástico', 'Puxada de letra', 'Finta de letra', 'Pedalada simples', 'Giro 360°', 'Corte com virada'].includes(skill);
  penalize(fancyDribble && !profile.agileCarrier, 24);
  penalize(skill === 'Chapéu' && !['SS', 'LWF', 'RWF', 'AMF'].includes(position), 16);
  penalize(skill === 'Arremesso lateral longo' && !['LB', 'RB', 'LMF', 'RMF'].includes(position), 45);
  penalize(skill === 'Cruzamento preciso' && !['LB', 'RB', 'LMF', 'RMF', 'LWF', 'RWF'].includes(position), 24);
  penalize(['Carrinho', 'Marcação individual', 'Bloqueador', 'Interceptação', 'Afastamento acrobático'].includes(skill) && !['CB', 'DMF', 'LB', 'RB', 'CMF', 'LMF', 'RMF'].includes(position), 34);
  penalize(skill === 'Cabeçada' && average(a.heading, a.jump, a.physicalContact) < 70, 26);
  penalize(skill === 'Superioridade aérea' && (Number(result.parsed.height ?? 0) < 178 || average(a.jump, a.physicalContact) < 72), 26);
  penalize(skill === 'Especialista em pênalti' && Number(a.finishing ?? 0) < 76, 18);
  penalize(skill === 'Malícia' && ['GK', 'CB'].includes(position), 12);
  return { score, reasons };
}

function trainingSupport(skill: string): Array<{ key: TrainingKey; weight: number }> {
  const category = CATEGORY_BY_SKILL[skill] ?? 'mental';
  if (category === 'finalização') return [{ key: 'shooting', weight: 2.2 }, { key: 'dexterity', weight: 0.8 }];
  if (category === 'passe') return [{ key: 'passing', weight: 2.1 }, { key: 'dribbling', weight: 0.35 }];
  if (category === 'drible') return [{ key: 'dribbling', weight: 1.8 }, { key: 'dexterity', weight: 1.2 }];
  if (category === 'defesa') return [{ key: 'defending', weight: 2.3 }, { key: 'lowerBodyStrength', weight: 0.45 }];
  if (category === 'aérea') return [{ key: 'aerialStrength', weight: 2.1 }, { key: 'defending', weight: 0.45 }, { key: 'shooting', weight: 0.35 }];
  if (category === 'físico') return [{ key: 'lowerBodyStrength', weight: 1.7 }, { key: 'aerialStrength', weight: 0.8 }];
  if (category === 'goleiro') return [{ key: 'gk1', weight: 1 }, { key: 'gk2', weight: 1.4 }, { key: 'gk3', weight: 1.2 }];
  return [{ key: 'lowerBodyStrength', weight: 0.55 }];
}

function specificScore(result: AnalysisResult, skill: string): { score: number; reasons: string[]; supportedBy: string[] } {
  const a = result.parsed.attributes;
  const p = result.bestPosition.code;
  const style = norm(result.parsed.playstyle);
  const reasons: string[] = [];
  const supportedBy: string[] = [];
  let score = 0;
  const addAttribute = (label: string, value: number | null | undefined, threshold: number, bonus: number) => {
    if (Number(value ?? 0) >= threshold) { score += bonus; supportedBy.push(`${label} ${value}`); }
  };
  if (skill === 'Chute de primeira') { addAttribute('Finalização', a.finishing, 80, 14); addAttribute('Talento ofensivo', a.offensiveAwareness, 80, 10); }
  if (skill === 'Precisão à distância') { addAttribute('Força do chute', a.kickingPower, 82, 12); addAttribute('Finalização', a.finishing, 78, 8); }
  if (skill === 'Efeito de longe') { addAttribute('Curva', a.curl, 78, 12); addAttribute('Força do chute', a.kickingPower, 80, 7); }
  if (skill === 'Finalização acrobática') { addAttribute('Finalização', a.finishing, 78, 8); addAttribute('Salto', a.jump, 78, 7); }
  if (skill === 'Cabeçada' || skill === 'Superioridade aérea') { addAttribute('Cabeçada', a.heading, 76, 10); addAttribute('Salto', a.jump, 78, 9); addAttribute('Contato físico', a.physicalContact, 78, 7); if ((result.parsed.height ?? 0) >= 182) { score += 7; supportedBy.push(`Altura ${result.parsed.height} cm`); } }
  if (skill.includes('Passe') || skill === 'Toque de calcanhar' || skill === 'Cruzamento preciso' || skill === 'Curva para fora') { addAttribute('Passe rasteiro', a.lowPass, 72, 8); addAttribute('Passe alto', a.loftedPass, 74, 7); }
  if (skill === 'Cruzamento preciso') { if (['LB','RB','LMF','RMF','LWF','RWF'].includes(p)) { score += 13; reasons.push('A função usa o corredor lateral com frequência.'); } }
  if (skill === 'Controle com a sola' || skill === 'Toque duplo' || skill === 'Giro 360°') { addAttribute('Controle de bola', a.ballControl, 76, 7); addAttribute('Drible', a.dribbling, 76, 8); addAttribute('Equilíbrio', a.balance, 76, 6); }
  if (skill === 'Interceptação' || skill === 'Bloqueador' || skill === 'Marcação individual') { addAttribute('Talento defensivo', a.defensiveAwareness, 76, 10); addAttribute('Desarme', a.tackling, 76, 8); addAttribute('Dedicação defensiva', a.defensiveEngagement, 76, 7); }
  if (skill === 'Volta para marcar') { addAttribute('Resistência', a.stamina, 78, 10); if (['LB','RB','LMF','RMF','CMF'].includes(p)) score += 9; }
  if (skill === 'Espírito guerreiro') { addAttribute('Resistência', a.stamina, 78, 8); addAttribute('Contato físico', a.physicalContact, 76, 6); }
  if (skill === 'Super substituto' && !`${style} ${norm(result.note)} ${result.usageTips.map(norm).join(' ')}`.match(/banco|segundo tempo|substitut/)) score -= 18;
  if (style.includes('artilheiro') || style.includes('homem de area')) {
    if (['Chute de primeira','Precisão à distância','Finalização acrobática','Cabeçada','Toque de calcanhar'].includes(skill)) { score += 9; reasons.push(`Combina com o estilo ${result.parsed.playstyle}.`); }
  }
  if (style.includes('armador') || style.includes('orquestrador')) {
    if (['Passe de primeira','Passe em profundidade','Passe na medida','Controle com a sola','Toque de calcanhar'].includes(skill)) { score += 10; reasons.push(`Aumenta a influência criativa do estilo ${result.parsed.playstyle}.`); }
  }
  if (style.includes('destruidor') || style.includes('primeiro volante') || style.includes('lateral defensivo')) {
    if (['Interceptação','Bloqueador','Marcação individual','Superioridade aérea'].includes(skill)) { score += 10; reasons.push(`Reforça o comportamento defensivo do estilo ${result.parsed.playstyle}.`); }
  }
  return { score, reasons, supportedBy };
}

function buildCandidate(result: AnalysisResult, plan: TrainingPlan, skill: string): Candidate | null {
  const owned = new Set([...result.parsed.nativeSkills, ...result.parsed.specialSkills].map(norm));
  if (owned.has(norm(skill))) return null;
  const category = CATEGORY_BY_SKILL[skill] ?? 'mental';
  const base = POSITION_CATEGORY_WEIGHTS[result.bestPosition.code][category];
  if (base <= -80) return null;
  const specific = specificScore(result, skill);
  const profile = profileAdjustment(result, skill);
  const supports = trainingSupport(skill);
  const planScore = supports.reduce((sum, item) => sum + Number(plan[item.key] ?? 0) * item.weight, 0);
  const identityBoost = (hash(`${result.parsed.internalId}|${result.parsed.playerName}|${result.parsed.cardType}|${result.parsed.playstyle}|${skill}`) % 13) - 4;
  const prior = result.skillPriority.ordered.find((item) => norm(item.name) === norm(skill));
  const priorBoost = prior ? Math.max(4, (prior.score - 65) * 0.22) : 0;
  const rawScore = base + specific.score + profile.score + planScore + identityBoost + priorBoost;
  const score = clamp(42 + rawScore * 0.72);
  const reasons = [
    ...profile.reasons.slice(0, 1),
    ...(specific.reasons.length ? specific.reasons : [`Compatível com a função ${result.bestPosition.label}.`]),
    ...supports.filter((item) => Number(plan[item.key] ?? 0) >= 5).slice(0, 2).map((item) => `A ficha investe em ${TRAINING_LABELS[item.key]} +${plan[item.key]}, aumentando a frequência de ativação.`),
    specific.supportedBy.length ? `Atributos que sustentam: ${specific.supportedBy.slice(0, 3).join(', ')}.` : 'A recomendação foi escolhida pela função, estilo e lacunas da carta.',
    `Desempate individual da carta: ${Math.max(0, identityBoost)} ponto(s).`
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
    identityBoost
  };
}

function complementBonus(selected: Candidate[], candidate: Candidate) {
  let bonus = 0;
  for (const [left, right] of COMPLEMENTS) {
    if ((candidate.name === left && selected.some((item) => item.name === right)) || (candidate.name === right && selected.some((item) => item.name === left))) bonus += 7;
  }
  return bonus;
}

export function buildPersonalizedSkillPlan(result: AnalysisResult, plan: TrainingPlan): UnifiedSkillDecision[] {
  const candidates = OFFICIAL_ADDITIONAL_SKILL_NAMES
    .map((skill) => buildCandidate(result, plan, skill))
    .filter((item): item is Candidate => item !== null)
    .sort((a, b) => b.score - a.score || b.identityBoost - a.identityBoost || a.name.localeCompare(b.name, 'pt-BR'));
  const selected: Candidate[] = [];
  const categoryCounts = new Map<SkillCategory, number>();
  while (selected.length < 5) {
    const eligible = candidates
      .filter((candidate) => !selected.some((item) => item.name === candidate.name))
      .filter((candidate) => (categoryCounts.get(candidate.category) ?? 0) < (candidate.category === 'mental' ? 1 : 2));
    const bestAvailable = eligible[0]?.score ?? 0;
    const signatureSlot = selected.length >= 3;
    const next = eligible
      .filter((candidate) => candidate.score >= Math.max(54, bestAvailable - (signatureSlot ? 9 : 5)))
      .map((candidate) => ({
        candidate,
        combined: candidate.score + complementBonus(selected, candidate) + (signatureSlot ? candidate.identityBoost * 1.35 : candidate.identityBoost * 0.35)
      }))
      .sort((a, b) => b.combined - a.combined || b.candidate.score - a.candidate.score || a.candidate.name.localeCompare(b.candidate.name, 'pt-BR'))[0]?.candidate;
    if (!next) break;
    selected.push(next);
    categoryCounts.set(next.category, (categoryCounts.get(next.category) ?? 0) + 1);
  }
  return selected.map((item, index) => ({
    name: item.name,
    score: item.score,
    priority: index === 0 || item.score >= 88 ? 'essencial' : index < 3 ? 'alta' : 'complementar',
    category: item.category,
    gameplayImpact: item.gameplayImpact,
    reasons: item.reasons,
    supportedBy: item.supportedBy,
    identityBoost: item.identityBoost
  }));
}

export function skillPlanScore(plan: UnifiedSkillDecision[]) {
  if (!plan.length) return 0;
  const average = plan.reduce((sum, item) => sum + item.score, 0) / plan.length;
  const diversity = new Set(plan.map((item) => item.category)).size;
  return clamp(average * 0.88 + diversity * 3);
}
