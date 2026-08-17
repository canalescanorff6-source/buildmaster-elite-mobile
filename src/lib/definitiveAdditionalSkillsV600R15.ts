import type { AnalysisResult, PositionCode, SkillRecommendation, UnifiedSkillDecision } from './analyzerDomain';
import {
  officialAdditionalSkillPoolForPosition,
  resolveAdditionalSkillPosition,
  isRoleCompatibleAdditionalSkill
} from './skillIntelligenceV31';
import {
  buildOwnedSkillKeys,
  canonicalizeSkillList,
  filterComplementaryAdditionalSkills,
  skillIdentityKey
} from './officialSkillIdentity';

export const DEFINITIVE_ADDITIONAL_SKILLS_V600_R15_VERSION = '40.80-r15-definitive-top5-v600' as const;

type Category = UnifiedSkillDecision['category'];
type Tier = 'ESSENCIAL' | 'META_V6' | 'COMPLEMENTAR';

type Candidate = {
  name: string;
  category: Category;
  score: number;
  tier: Tier;
  reasons: string[];
};

const CATEGORY: Record<string, Category> = {
  'Pedalada simples': 'drible', 'Toque duplo': 'drible', 'Elástico': 'drible', 'Giro 360°': 'drible', 'Chapéu': 'drible',
  'Corte com virada': 'drible', 'Puxada de letra': 'drible', 'Finta de letra': 'drible', 'Controle com a sola': 'drible',
  'Cabeçada': 'aérea', 'Efeito de longe': 'finalização', 'Controle da cavadinha': 'finalização', 'Chute com o peito do pé': 'finalização',
  'Folha seca': 'finalização', 'Chute ascendente': 'finalização', 'Precisão à distância': 'finalização', 'Finalização acrobática': 'finalização',
  'Chute de primeira': 'finalização', 'Especialista em pênalti': 'finalização', 'Toque de calcanhar': 'passe', 'Passe de primeira': 'passe',
  'Passe em profundidade': 'passe', 'Passe na medida': 'passe', 'Cruzamento preciso': 'passe', 'Curva para fora': 'passe', 'De letra': 'passe',
  'Passe sem olhar': 'passe', 'Passe aéreo baixo': 'passe', 'Arremesso lateral longo': 'passe', 'Malícia': 'mental',
  'Marcação individual': 'defesa', 'Volta para marcar': 'defesa', 'Interceptação': 'defesa', 'Bloqueador': 'defesa', 'Carrinho': 'defesa',
  'Afastamento acrobático': 'defesa', 'Superioridade aérea': 'aérea', 'Liderança': 'mental', 'Super substituto': 'mental',
  'Espírito guerreiro': 'físico', 'Pegador de pênalti': 'goleiro', 'Arremesso longo do goleiro': 'goleiro',
  'Reposição alta do goleiro': 'goleiro', 'Reposição baixa do goleiro': 'goleiro'
};

const SLOT_BLUEPRINT: Record<PositionCode, readonly Category[]> = {
  GK: ['goleiro', 'goleiro', 'goleiro', 'mental', 'físico'],
  CB: ['defesa', 'defesa', 'aérea', 'passe', 'físico'],
  LB: ['defesa', 'defesa', 'passe', 'passe', 'físico'],
  RB: ['defesa', 'defesa', 'passe', 'passe', 'físico'],
  DMF: ['defesa', 'defesa', 'passe', 'passe', 'físico'],
  CMF: ['passe', 'passe', 'defesa', 'drible', 'físico'],
  LMF: ['passe', 'passe', 'drible', 'defesa', 'físico'],
  RMF: ['passe', 'passe', 'drible', 'defesa', 'físico'],
  AMF: ['passe', 'passe', 'drible', 'finalização', 'mental'],
  SS: ['passe', 'finalização', 'drible', 'finalização', 'físico'],
  LWF: ['drible', 'passe', 'finalização', 'drible', 'físico'],
  RWF: ['drible', 'passe', 'finalização', 'drible', 'físico'],
  CF: ['finalização', 'finalização', 'passe', 'aérea', 'físico']
};

const BASE_CATEGORY: Record<PositionCode, Record<Category, number>> = {
  GK:{finalização:-100,passe:12,drible:-100,defesa:-80,aérea:-50,físico:16,goleiro:52,mental:22},
  CB:{finalização:-70,passe:14,drible:-55,defesa:46,aérea:34,físico:20,goleiro:-100,mental:13},
  LB:{finalização:-35,passe:27,drible:12,defesa:37,aérea:10,físico:18,goleiro:-100,mental:9},
  RB:{finalização:-35,passe:27,drible:12,defesa:37,aérea:10,físico:18,goleiro:-100,mental:9},
  DMF:{finalização:-45,passe:31,drible:7,defesa:43,aérea:15,físico:20,goleiro:-100,mental:12},
  CMF:{finalização:8,passe:40,drible:19,defesa:24,aérea:4,físico:17,goleiro:-100,mental:12},
  LMF:{finalização:12,passe:35,drible:27,defesa:17,aérea:3,físico:13,goleiro:-100,mental:9},
  RMF:{finalização:12,passe:35,drible:27,defesa:17,aérea:3,físico:13,goleiro:-100,mental:9},
  AMF:{finalização:25,passe:43,drible:35,defesa:-30,aérea:2,físico:7,goleiro:-100,mental:10},
  SS:{finalização:34,passe:34,drible:32,defesa:-42,aérea:8,físico:10,goleiro:-100,mental:8},
  LWF:{finalização:27,passe:28,drible:42,defesa:-40,aérea:3,físico:9,goleiro:-100,mental:7},
  RWF:{finalização:27,passe:28,drible:42,defesa:-40,aérea:3,físico:9,goleiro:-100,mental:7},
  CF:{finalização:48,passe:16,drible:18,defesa:-70,aérea:25,físico:14,goleiro:-100,mental:7}
};

function norm(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }
function avg(...values: Array<number | null | undefined>) {
  const valid = values.map((value) => Number(value ?? 0)).filter((value) => value > 0);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}
function stableHash(value: string) {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) { output ^= value.charCodeAt(index); output = Math.imul(output, 16777619); }
  return output >>> 0;
}
function contains(list: readonly string[], skill: string) { return list.includes(skill); }

function styleName(result: AnalysisResult) {
  return norm(result.parsed.offensivePlaystyle ?? result.parsed.playstyle);
}

function styleBonus(result: AnalysisResult, position: PositionCode, skill: string) {
  const style = styleName(result);
  let score = 0;
  const reasons: string[] = [];
  const add = (pattern: RegExp, skills: readonly string[], points: number, reason: string) => {
    if (pattern.test(style) && contains(skills, skill)) { score += points; reasons.push(reason); }
  };

  add(/goleiro ofensivo|offensive goalkeeper/, ['Reposição baixa do goleiro','Reposição alta do goleiro','Arremesso longo do goleiro'], 28, 'Completa a saída do Goleiro Ofensivo.');
  add(/goleiro defensivo|defensive goalkeeper/, ['Pegador de pênalti','Espírito guerreiro','Liderança'], 30, 'Prioriza segurança e estabilidade do Goleiro Defensivo.');
  add(/defensor criativo|build up/, ['Interceptação','Bloqueador','Passe de primeira','Passe na medida','Passe aéreo baixo'], 18, 'Mantém defesa e melhora a primeira construção do Defensor Criativo.');
  add(/destruidor|destroyer/, ['Interceptação','Bloqueador','Marcação individual','Carrinho','Espírito guerreiro'], 21, 'Reforça duelo, corte e agressividade funcional do Destruidor.');
  add(/atacante surpresa|extra frontman/, ['Interceptação','Bloqueador','Superioridade aérea','Passe de primeira'], 16, 'Protege a subida sem perder recuperação e saída.');
  add(/primeiro volante|anchor man/, ['Interceptação','Bloqueador','Marcação individual','Passe de primeira','Espírito guerreiro'], 22, 'Completa proteção central e saída curta do Primeiro Volante.');
  add(/orquestrador|orchestrator/, ['Passe de primeira','Passe em profundidade','Passe na medida','Controle com a sola','Toque de calcanhar'], 22, 'Amplifica circulação e orientação corporal do Orquestrador.');
  add(/meia versatil|box.to.box/, ['Passe de primeira','Interceptação','Volta para marcar','Espírito guerreiro','Controle com a sola'], 19, 'Sustenta ida e volta sem descaracterizar o Meia Versátil.');
  add(/classico.*10|classic.*10/, ['Passe de primeira','Passe em profundidade','Passe na medida','Controle com a sola','Toque de calcanhar'], 20, 'Prioriza criação e primeiro toque do Clássico nº 10.');
  add(/jogador de infiltracao|hole player|infiltra/, ['Passe de primeira','Chute de primeira','Controle com a sola','Toque duplo','Precisão à distância'], 20, 'Converte chegada entre linhas em ação rápida.');
  add(/armador criativo|creative playmaker/, ['Passe de primeira','Passe em profundidade','Passe na medida','Controle com a sola','Toque de calcanhar','Passe sem olhar'], 22, 'Preserva a identidade criativa e a conexão curta.');
  add(/lateral defensivo|defensive full.back/, ['Interceptação','Bloqueador','Marcação individual','Espírito guerreiro','Passe de primeira'], 22, 'Mantém prioridade defensiva do lateral.');
  add(/lateral ofensivo|offensive full.back/, ['Passe de primeira','Passe em profundidade','Cruzamento preciso','Controle com a sola','Volta para marcar'], 19, 'Equilibra apoio ofensivo com recomposição.');
  add(/lateral atacante|full.back finisher/, ['Controle com a sola','Toque duplo','Passe de primeira','Cruzamento preciso','Precisão à distância'], 18, 'Apoia condução e chegada interior do lateral atacante.');
  add(/lateral movel|roaming flank/, ['Controle com a sola','Toque duplo','Passe de primeira','Passe em profundidade','Espírito guerreiro'], 18, 'Favorece condução e mobilidade do corredor para dentro.');
  add(/ala produtivo|prolific winger/, ['Toque duplo','Controle com a sola','Passe de primeira','Cruzamento preciso','Precisão à distância'], 18, 'Aumenta impacto em condução, passe e decisão no último terço.');
  add(/perito em cruzamento|cross specialist/, ['Cruzamento preciso','Passe na medida','Curva para fora','Passe aéreo baixo'], 25, 'Especializa entrega lateral sem gastar vaga em função alheia ao DNA.');
  add(/artilheiro|goal poacher/, ['Chute de primeira','Finalização acrobática','Precisão à distância','Controle da cavadinha','Chute com o peito do pé'], 23, 'Reduz o tempo de finalização do Artilheiro.');
  add(/homem de area|fox in the box/, ['Chute de primeira','Finalização acrobática','Cabeçada','Superioridade aérea'], 24, 'Maximiza ações curtas dentro da área.');
  add(/atacante pivo|deep.lying forward|recuado/, ['Passe de primeira','Passe em profundidade','Controle com a sola','Toque de calcanhar','Passe na medida'], 23, 'Reforça conexão do Atacante Pivô que recua para construir.');
  add(/^pivo$|^target man$/, ['Cabeçada','Superioridade aérea','Passe de primeira','Toque de calcanhar','Espírito guerreiro'], 24, 'Completa proteção, apoio e jogo aéreo do Pivô.');
  add(/puxa marcacao|dummy runner/, ['Passe de primeira','Passe em profundidade','Chute de primeira','Controle com a sola','Espírito guerreiro'], 20, 'Aproveita desmarque, apoio e abertura de espaço do Puxa Marcação.');

  if (position === 'GK' && !['Reposição baixa do goleiro','Reposição alta do goleiro','Arremesso longo do goleiro','Pegador de pênalti','Espírito guerreiro','Liderança'].includes(skill)) score -= 200;
  return { score, reasons };
}

function attributeActivation(result: AnalysisResult, position: PositionCode, skill: string) {
  const a = result.parsed.attributes;
  const reasons: string[] = [];
  let score = 0;
  const add = (condition: boolean, points: number, reason: string) => { if (condition) { score += points; reasons.push(reason); } };
  const pass = avg(a.lowPass, a.loftedPass, a.ballControl);
  const carry = avg(a.ballControl, a.dribbling, a.tightPossession, a.balance, a.acceleration);
  const finish = avg(a.finishing, a.offensiveAwareness, a.kickingPower);
  const defend = avg(a.defensiveAwareness, a.defensiveEngagement, a.tackling, a.aggression);
  const aerial = avg(a.heading, a.jump, a.physicalContact);
  const stamina = Number(a.stamina ?? 0);

  add(['Passe de primeira','Passe em profundidade','Passe na medida','Passe aéreo baixo','Toque de calcanhar','Passe sem olhar'].includes(skill) && pass >= 74, 14, 'Os atributos de passe/controle sustentam uso frequente.');
  add(['Controle com a sola','Toque duplo','Giro 360°','Corte com virada'].includes(skill) && carry >= 76, 14, 'A condução e o equilíbrio sustentam a habilidade.');
  add(['Chute de primeira','Precisão à distância','Finalização acrobática','Efeito de longe','Chute com o peito do pé'].includes(skill) && finish >= 75, 15, 'A ameaça de finalização é real para esta carta.');
  add(['Interceptação','Bloqueador','Marcação individual','Carrinho','Afastamento acrobático'].includes(skill) && defend >= 74, 16, 'A base defensiva permite ativação recorrente.');
  add(['Cabeçada','Superioridade aérea'].includes(skill) && aerial >= 74, 16, 'Jogo aéreo e contato sustentam a habilidade.');
  add(skill === 'Volta para marcar' && stamina >= 78, 13, 'Resistência sustenta recomposição repetida.');
  add(skill === 'Espírito guerreiro' && (stamina >= 78 || Number(a.physicalContact ?? 0) >= 78), 11, 'Resistência/físico sustentam ações sob pressão.');
  if (skill === 'Superioridade aérea' && (Number(result.parsed.height ?? 0) < 176 || aerial < 68)) score -= 30;
  if (skill === 'Cabeçada' && aerial < 68) score -= 30;
  if (skill === 'Especialista em pênalti' && finish < 74) score -= 24;
  if (position === 'GK' && skill === 'Pegador de pênalti') add(avg(a.goalkeeperAwareness, a.goalkeeperReflexes) >= 78, 18, 'Consciência e reflexo sustentam especialização em pênalti.');
  return { score, reasons };
}

function metaV6Bonus(result: AnalysisResult, skill: string) {
  const meta = result.gameplayMetaV600R10?.scores;
  if (!meta) return { score: 0, reasons: [] as string[], meta: false };
  let score = 0;
  const reasons: string[] = [];
  const add = (condition: boolean, points: number, reason: string) => { if (condition) { score += points; reasons.push(reason); } };
  add(meta.shortPassing >= 78 && ['Passe de primeira','Passe em profundidade','Toque de calcanhar'].includes(skill), 10, 'META v6.0: acelera tocou-passou e terceiro homem.');
  add(meta.tikiTaka >= 78 && ['Passe de primeira','Controle com a sola','Toque de calcanhar','Passe em profundidade'].includes(skill), 10, 'META v6.0: melhora fluidez em apoio curto.');
  add(meta.ballCarry >= 78 && ['Controle com a sola','Toque duplo','Corte com virada'].includes(skill), 9, 'META v6.0: favorece condução sob pressão.');
  add(meta.manualDefence >= 72 && ['Interceptação','Bloqueador','Marcação individual','Volta para marcar'].includes(skill), 11, 'META v6.0: reforça defesa manual e fechamento de linhas.');
  add(meta.pressResistance >= 76 && ['Controle com a sola','Passe de primeira','Espírito guerreiro'].includes(skill), 8, 'META v6.0: aumenta robustez na pressão.');
  return { score, reasons, meta: reasons.length > 0 };
}


type FunctionalSkillRole =
  | 'GOLEIRO'
  | 'FINALIZADOR'
  | 'CRIADOR'
  | 'INFILTRADOR'
  | 'MEIA_DEFENSIVO'
  | 'MEIA_IDA_VOLTA'
  | 'MEIA_CRIADOR'
  | 'DEFENSOR'
  | 'LATERAL_DEFENSIVO'
  | 'LATERAL_APOIO'
  | 'PONTA';

function functionalSkillRole(result: AnalysisResult, position: PositionCode): FunctionalSkillRole {
  const style = styleName(result);
  const a = result.parsed.attributes;
  const attack = avg(a.offensiveAwareness, a.finishing, a.kickingPower);
  const creation = avg(a.lowPass, a.loftedPass, a.ballControl, a.tightPossession, a.dribbling);
  const defence = avg(a.defensiveAwareness, a.defensiveEngagement, a.tackling, a.aggression);
  const mobility = avg(a.speed, a.acceleration, a.balance, a.stamina);

  if (position === 'GK') return 'GOLEIRO';
  if (position === 'CB' || /defensor criativo|destruidor|atacante surpresa/.test(style)) return 'DEFENSOR';
  if ((position === 'LB' || position === 'RB') && /lateral defensivo/.test(style)) return 'LATERAL_DEFENSIVO';
  if (position === 'LB' || position === 'RB') return 'LATERAL_APOIO';
  if (position === 'LWF' || position === 'RWF') return 'PONTA';
  if (position === 'CF') return /puxa marcacao|atacante pivo|pivo/.test(style) ? 'CRIADOR' : 'FINALIZADOR';
  if (position === 'SS' || position === 'AMF') {
    if (/infiltra|atacante surpresa/.test(style) || attack >= creation + 3) return 'INFILTRADOR';
    return 'CRIADOR';
  }
  if (position === 'DMF') return 'MEIA_DEFENSIVO';

  if (position === 'CMF' || position === 'LMF' || position === 'RMF') {
    if (/destruidor|primeiro volante|anchor man/.test(style) || defence >= Math.max(76, creation - 1)) return 'MEIA_DEFENSIVO';
    if (/meia versatil|box.to.box/.test(style) || (defence >= 70 && creation >= 76 && mobility >= 76)) return 'MEIA_IDA_VOLTA';
    if (/infiltra|hole player/.test(style) || attack >= 80 && attack >= defence + 8) return 'INFILTRADOR';
    return 'MEIA_CRIADOR';
  }
  return 'MEIA_CRIADOR';
}

const EXOTIC_SHOOTING_SKILLS = new Set([
  'Efeito de longe',
  'Controle da cavadinha',
  'Chute com o peito do pé',
  'Folha seca',
  'Chute ascendente',
  'Precisão à distância',
  'Finalização acrobática',
  'Especialista em pênalti'
]);

const DEFENSIVE_SKILLS = new Set(['Marcação individual','Volta para marcar','Interceptação','Bloqueador','Carrinho','Afastamento acrobático']);

function hardSkillMismatch(result: AnalysisResult, position: PositionCode, skill: string): boolean {
  const role = functionalSkillRole(result, position);
  const a = result.parsed.attributes;
  const finishing = Number(a.finishing ?? 0);
  const power = Number(a.kickingPower ?? 0);

  if (['CF','SS','LWF','RWF','AMF'].includes(position) && DEFENSIVE_SKILLS.has(skill)) return true;
  if (position === 'CB' && (EXOTIC_SHOOTING_SKILLS.has(skill) || ['Toque duplo','Giro 360°','Chapéu','Elástico'].includes(skill))) return true;
  if ((role === 'MEIA_DEFENSIVO' || role === 'LATERAL_DEFENSIVO') && EXOTIC_SHOOTING_SKILLS.has(skill)) return true;
  if (role === 'MEIA_IDA_VOLTA' && EXOTIC_SHOOTING_SKILLS.has(skill) && (finishing < 78 || power < 80)) return true;
  if (role === 'MEIA_CRIADOR' && ['Chute ascendente','Folha seca','Finalização acrobática','Especialista em pênalti'].includes(skill)) return true;
  if (role === 'MEIA_CRIADOR' && skill === 'Precisão à distância' && (finishing < 78 || power < 82)) return true;
  if (role === 'DEFENSOR' && CATEGORY[skill] === 'finalização') return true;
  if (role === 'GOLEIRO' && CATEGORY[skill] !== 'goleiro' && !['Espírito guerreiro','Liderança'].includes(skill)) return true;

  return false;
}

function functionalRoleBonus(result: AnalysisResult, position: PositionCode, skill: string) {
  const role = functionalSkillRole(result, position);
  let score = 0;
  const reasons: string[] = [];
  const add = (skills: string[], points: number, reason: string) => {
    if (skills.includes(skill)) { score += points; reasons.push(reason); }
  };

  if (role === 'MEIA_DEFENSIVO') {
    add(['Interceptação','Bloqueador','Marcação individual','Volta para marcar','Passe de primeira','Passe em profundidade','Espírito guerreiro'], 26, 'Função real defensiva: prioriza corte, cobertura e saída limpa.');
  } else if (role === 'MEIA_IDA_VOLTA') {
    add(['Passe de primeira','Interceptação','Volta para marcar','Espírito guerreiro','Controle com a sola','Passe em profundidade'], 23, 'Função box-to-box: precisa funcionar nos dois sentidos sem gastar vaga em chute situacional.');
  } else if (role === 'MEIA_CRIADOR') {
    add(['Passe de primeira','Passe em profundidade','Passe na medida','Controle com a sola','Toque duplo','Toque de calcanhar'], 25, 'Meia criador: primeiro toque, orientação, passe e condução têm maior frequência real.');
  } else if (role === 'INFILTRADOR') {
    add(['Passe de primeira','Chute de primeira','Controle com a sola','Toque duplo','Passe em profundidade'], 23, 'Infiltrador: acelera chegada, domínio e conclusão sem transformar a carta em chutador genérico.');
  } else if (role === 'FINALIZADOR') {
    add(['Chute de primeira','Controle com a sola','Toque duplo','Finalização acrobática','Passe de primeira'], 22, 'Finalizador: reduz tempo entre domínio, ruptura e chute.');
  } else if (role === 'DEFENSOR' || role === 'LATERAL_DEFENSIVO') {
    add(['Interceptação','Bloqueador','Marcação individual','Passe de primeira','Espírito guerreiro'], 25, 'Defensor: habilidades de repetição alta em corte, bloqueio e saída.');
  } else if (role === 'LATERAL_APOIO' || role === 'PONTA') {
    add(['Controle com a sola','Toque duplo','Passe de primeira','Passe em profundidade','Cruzamento preciso'], 20, 'Corredor: condução, aceleração e passe útil têm prioridade.');
  } else if (role === 'CRIADOR') {
    add(['Passe de primeira','Passe em profundidade','Controle com a sola','Toque de calcanhar','Toque duplo'], 22, 'Criador: conexão curta e domínio orientado são ações recorrentes.');
  }
  return { role, score, reasons };
}

function candidateFor(result: AnalysisResult, position: PositionCode, skill: string, poolRank: number): Candidate {
  const category = CATEGORY[skill] ?? 'mental';
  const style = styleBonus(result, position, skill);
  const attr = attributeActivation(result, position, skill);
  const meta = metaV6Bonus(result, skill);
  const role = functionalRoleBonus(result, position, skill);
  const categoryBase = BASE_CATEGORY[position][category];
  const stable = stableHash(`${result.parsed.playerName}|${result.parsed.cardType}|${result.parsed.mainPosition}|${result.parsed.playstyle ?? ''}|${skill}`) % 4;
  const raw = 30 + categoryBase + style.score + attr.score + meta.score + role.score + Math.max(0, 12 - poolRank) + stable;
  const score = clamp(raw);
  const tier: Tier = role.score >= 23 || style.score >= 18 || attr.score >= 16 ? 'ESSENCIAL' : meta.meta && meta.score >= 9 ? 'META_V6' : 'COMPLEMENTAR';
  return { name: skill, category, score, tier, reasons: [...role.reasons, ...style.reasons, ...attr.reasons, ...meta.reasons].slice(0, 3) };
}

function styleBlueprint(result: AnalysisResult, position: PositionCode): readonly Category[] {
  const style = styleName(result);
  if (position === 'GK') return /ofensivo|offensive/.test(style) ? ['goleiro','goleiro','goleiro','passe','mental'] : SLOT_BLUEPRINT.GK;
  if (position === 'CB' && /defensor criativo|build up/.test(style)) return ['defesa','defesa','passe','aérea','físico'];
  if (position === 'CB' && /destruidor|destroyer|atacante surpresa|extra frontman/.test(style)) return ['defesa','defesa','defesa','aérea','físico'];
  if (position === 'DMF' && /orquestrador|orchestrator/.test(style)) return ['passe','passe','defesa','defesa','físico'];
  if (position === 'DMF' && /primeiro volante|anchor man|destruidor|destroyer/.test(style)) return ['defesa','defesa','passe','físico','aérea'];
  if (position === 'CMF') {
    const role = functionalSkillRole(result, position);
    if (role === 'MEIA_DEFENSIVO') return ['defesa','passe','defesa','físico','passe'];
    if (role === 'MEIA_IDA_VOLTA') return ['passe','defesa','passe','físico','drible'];
    if (role === 'INFILTRADOR') return ['passe','drible','finalização','passe','físico'];
    return ['passe','passe','drible','passe','físico'];
  }
  if (position === 'AMF' && /armador criativo|creative playmaker|orquestrador|classic|classico/.test(style)) return ['passe','passe','passe','drible','físico'];
  if (position === 'AMF' && /infiltra|hole player/.test(style)) return ['passe','finalização','drible','passe','físico'];
  if (['LB','RB','LMF','RMF','LWF','RWF'].includes(position) && /perito em cruzamento|cross specialist/.test(style)) return ['passe','passe','passe','drible','físico'];
  if (position === 'CF' && /atacante pivo|deep.lying|recuado|puxa marcacao|dummy runner/.test(style)) return ['passe','passe','finalização','drible','físico'];
  if (position === 'CF' && (/^pivo$|^target man$/).test(style)) return ['aérea','finalização','passe','físico','mental'];
    if (position === 'CF' && /homem de area|fox in the box/.test(style)) return ['finalização','finalização','aérea','aérea','físico'];
  return SLOT_BLUEPRINT[position];
}

function pickTopFive(result: AnalysisResult) {
  const position = resolveAdditionalSkillPosition(result);
  const owned = buildOwnedSkillKeys(result.parsed.nativeSkills, result.parsed.specialSkills, result.parsed.additionalSkills ?? []);
  const pool = officialAdditionalSkillPoolForPosition(position).filter((skill) =>
    !owned.has(skillIdentityKey(skill))
    && isRoleCompatibleAdditionalSkill(skill, position)
    && !hardSkillMismatch(result, position, skill)
  );
  const candidates = pool.map((skill, index) => candidateFor(result, position, skill, index));
  const blueprint = styleBlueprint(result, position);
  const selected: Candidate[] = [];

  const ranked = (category?: Category) => candidates
    .filter((candidate) => !selected.some((current) => skillIdentityKey(current.name) === skillIdentityKey(candidate.name)))
    .filter((candidate) => !category || candidate.category === category)
    .map((candidate) => {
      const sameCategory = selected.filter((current) => current.category === candidate.category).length;
      const diversity = sameCategory === 0 ? 5 : sameCategory >= 2 ? -7 * (sameCategory - 1) : 0;
      return { candidate, adjusted: candidate.score + diversity };
    })
    .sort((a, b) => b.adjusted - a.adjusted || b.candidate.score - a.candidate.score || a.candidate.name.localeCompare(b.candidate.name, 'pt-BR'));

  for (const category of blueprint) {
    const next = ranked(category)[0]?.candidate;
    if (next) selected.push(next);
  }
  while (selected.length < 5) {
    const next = ranked()[0]?.candidate;
    if (!next) break;
    selected.push(next);
  }
  const names = filterComplementaryAdditionalSkills(selected.map((candidate) => candidate.name), result.parsed.nativeSkills, result.parsed.specialSkills, 5, result.parsed.additionalSkills ?? []);
  return { position, selected: names.map((name) => selected.find((candidate) => skillIdentityKey(candidate.name) === skillIdentityKey(name))!).filter(Boolean) };
}

export function applyDefinitiveAdditionalSkillsV600R15(result: AnalysisResult): AnalysisResult {
  const { position, selected } = pickTopFive(result);
  if (!selected.length) return result;
  const recommendedSkills = selected.map((item) => item.name);
  const previousAvoid = result.skillRecommendations.filter((item: SkillRecommendation) => item.tier === 'evitar' && !recommendedSkills.some((name) => skillIdentityKey(name) === skillIdentityKey(item.name)));
  const skillRecommendations = [
    ...selected.map((item, index) => ({
      name: item.name,
      tier: index === 0 || item.tier === 'ESSENCIAL' ? 'essencial' as const : 'alternativa' as const,
      reason: `[${item.tier === 'META_V6' ? 'META v6.0' : item.tier}] ${item.reasons[0] ?? `Complementa a função ${position} sem repetir habilidade existente.`}`
    })),
    ...previousAvoid
  ];
  const decisions: UnifiedSkillDecision[] = selected.map((item, index) => ({
    name: item.name,
    score: item.score,
    priority: index === 0 || item.tier === 'ESSENCIAL' ? 'essencial' : index < 3 ? 'alta' : 'complementar',
    category: item.category,
    gameplayImpact: item.reasons[0] ?? 'Complementa a função sem alterar o DNA da carta.',
    reasons: [
      `Top 5 Definitivo v6.0 • ${item.tier === 'META_V6' ? 'otimização de meta' : item.tier.toLowerCase()}.`,
      `Identidade-base travada em ${position}; a posição tática não pode transformar o jogador em outro perfil.`,
      ...item.reasons
    ].slice(0, 4),
    supportedBy: [],
    identityBoost: 0
  }));
  const owned = canonicalizeSkillList([...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills]);
  const style = result.parsed.offensivePlaystyle ?? result.parsed.playstyle ?? 'não confirmado';
  const metaCount = selected.filter((item) => item.tier === 'META_V6').length;
  const essentialCount = selected.filter((item) => item.tier === 'ESSENCIAL').length;
  const functionalRole = functionalSkillRole(result, position);

  return {
    ...result,
    recommendedSkills,
    skillRecommendations,
    skillPriority: {
      ...result.skillPriority,
      ordered: selected.map((item, index) => ({
        name: item.name,
        score: item.score,
        tier: index === 0 ? 'prioridade máxima' as const : index < 3 ? 'alta' as const : 'útil' as const,
        reasons: [`${item.tier === 'META_V6' ? 'META v6.0' : item.tier}: ${item.reasons[0] ?? 'complemento funcional da carta.'}`, `Posição-base ${position}; estilo ${style}.`]
      })),
      officialOnly: true,
      context: [
        'Top 5 Definitivo v6.0: essenciais primeiro, meta como refinamento e redundância controlada por categoria.',
        ...result.skillPriority.context
      ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 12)
    },
    specialSkillsAnalysis: {
      ...result.specialSkillsAnalysis,
      missingRecommended: selected.map((item) => ({ name: item.name, impact: item.reasons[0] ?? 'Complemento funcional da carta.', score: item.score })),
      officialCatalogOnly: true
    },
    unifiedIntelligence: result.unifiedIntelligence ? { ...result.unifiedIntelligence, skillPlan: decisions } : result.unifiedIntelligence,
    deepCardIntelligence: result.deepCardIntelligence ? {
      ...result.deepCardIntelligence,
      skillPlan: selected.map((item, index) => ({
        name: item.name,
        priority: index === 0 || item.tier === 'ESSENCIAL' ? 'máxima' as const : index < 3 ? 'alta' as const : 'útil' as const,
        reason: `${item.tier === 'META_V6' ? 'META v6.0' : item.tier}: ${item.reasons[0] ?? 'complemento funcional da carta.'}`
      }))
    } : result.deepCardIntelligence,
    recommendationExplanation: [
      `Top 5 Definitivo v6.0: ${recommendedSkills.join(', ')}.`,
      `${essentialCount} habilidade(s) essencial(is), ${metaCount} otimização(ões) META v6.0; estilo ${style}; função-base ${position}; função real ${functionalRole}.`,
      `Filtro universal: ${owned.length} habilidade(s) já possuída(s) foram bloqueadas contra repetição; nenhum estilo desconhecido recebe peso inventado.`,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 18),
    strengths: [
      `Top 5 estabilizado para ${position}/${style}: complementa DNA + função + Meta v6.0 sem perseguir overall.`,
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 32)
  };
}
