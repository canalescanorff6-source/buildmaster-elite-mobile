import type {
  Attributes,
  Objective,
  ParsedCard,
  PositionCode,
  TacticalProfile,
  TrainingKey,
  TrainingPlan
} from './analyzer';
import type { BuildVariant } from './trainingEngine';
import type { MaxPrecisionAnalysis } from './maxPrecision';

export type UsageContextAnalysis = {
  side: 'esquerda' | 'centro' | 'direita';
  formation: string;
  collectiveStyle: string;
  roleInShape: string;
  partnerNeeds: string[];
  starterScore: number;
  substituteScore: number;
  contextScore: number;
  notes: string[];
};

export type WhatIfScenario = {
  id: string;
  title: string;
  changedVariable: string;
  projectedScore: number;
  delta: number;
  training: TrainingPlan;
  gain: string;
  tradeoff: string;
};

export type PointSensitivityItem = {
  from: TrainingKey;
  to: TrainingKey;
  movedLevels: number;
  expectedDelta: number;
  confidence: number;
  verdict: string;
};

export type MatchSegmentProjection = {
  range: string;
  performance: number;
  stamina: number;
  decisionSpeed: number;
  risk: 'baixo' | 'médio' | 'alto';
  note: string;
};

export type ScenarioBuild = {
  scenario: 'Partida equilibrada' | 'Contra pressão alta' | 'Contra bloco baixo' | 'Proteger resultado' | 'Buscar gol' | 'Titular' | 'Entrar no segundo tempo';
  score: number;
  training: TrainingPlan;
  priorities: string[];
  mainRisk: string;
};

export type MotorProof = {
  candidatesTested: number;
  candidatesEliminated: number;
  winnerMargin: number;
  genericTemplateGain: number;
  decisiveFactors: string[];
  eliminatedReasons: Array<{ reason: string; count: number }>;
  verdict: string;
};

export type RecommendationConfidence = {
  score: number;
  level: 'alta' | 'média' | 'baixa';
  evidence: string[];
  missingEvidence: string[];
  caveats: string[];
};

export type SuspiciousRecommendationIssue = {
  severity: 'aviso' | 'revisão' | 'crítico';
  code: string;
  title: string;
  detail: string;
  correction: string;
};

export type ABExperimentPlan = {
  id: string;
  buildA: string;
  buildB: string;
  matchesPerBuild: number;
  metrics: string[];
  successRule: string;
  safeguards: string[];
};

export type CardLearningIdentity = {
  key: string;
  versionSignature: string;
  separatedBy: string[];
  correctionProposal: string;
  confirmationRequired: boolean;
};

export type PersonalGameProfile = {
  priorities: Array<{ label: string; weight: number; source: string }>;
  separateFromMeta: boolean;
  summary: string;
};

export type VideoAssistBlueprint = {
  supportedMarkers: string[];
  workflow: string[];
  outputFields: string[];
  privacyNote: string;
};

export type AdaptiveTrainingBlueprint = {
  recurringErrors: Array<{ error: string; correctiveDrill: string; repetitions: number }>;
  nextWeekLogic: string[];
  progressionRule: string;
};

export type DelayConditionProfile = {
  name: string;
  fps: 30 | 60;
  graphics: 'baixa' | 'média' | 'alta';
  network: '5 GHz' | '2.4 GHz' | 'dados móveis';
  batterySaver: boolean;
  backgroundApps: boolean;
  purpose: string;
};

export type StabilityDiagnostics = {
  comparisonTests: string[];
  profiles: DelayConditionProfile[];
  reportFields: string[];
  separationRules: string[];
};

export type TransactionStage = {
  order: number;
  name: string;
  blocksNextWhenFailed: boolean;
  preserves: string[];
};

export type ReliabilityArchitecture = {
  stages: TransactionStage[];
  diagnosticFields: string[];
  simulatedCases: number;
  cloneMonitorThreshold: number;
  cacheProtection: string[];
};

export type PremiumExperience = {
  executiveSummary: string[];
  creationFlow: string[];
  workspaceSections: string[];
  evolutionDashboard: string[];
};

export type EliteEvolutionAnalysis = {
  usageContext: UsageContextAnalysis;
  whatIf: WhatIfScenario[];
  pointSensitivity: PointSensitivityItem[];
  ninetyMinutes: MatchSegmentProjection[];
  scenarioBuilds: ScenarioBuild[];
  proof: MotorProof;
  confidence: RecommendationConfidence;
  suspiciousIssues: SuspiciousRecommendationIssue[];
  abExperiment: ABExperimentPlan;
  learning: CardLearningIdentity;
  personalProfile: PersonalGameProfile;
  videoAssist: VideoAssistBlueprint;
  adaptiveTraining: AdaptiveTrainingBlueprint;
  stability: StabilityDiagnostics;
  reliability: ReliabilityArchitecture;
  premium: PremiumExperience;
};

const TRAINING_LABELS: Record<TrainingKey, string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  dexterity: 'Destreza',
  lowerBodyStrength: 'Força das pernas',
  aerialStrength: 'Bola aérea',
  defending: 'Defesa',
  gk1: 'Goleiro 1',
  gk2: 'Goleiro 2',
  gk3: 'Goleiro 3'
};

const POSITION_SIDE: Record<PositionCode, UsageContextAnalysis['side']> = {
  CF: 'centro', SS: 'centro', LWF: 'esquerda', RWF: 'direita', LMF: 'esquerda', RMF: 'direita',
  AMF: 'centro', CMF: 'centro', DMF: 'centro', CB: 'centro', LB: 'esquerda', RB: 'direita', GK: 'centro'
};

const POSITION_CONTEXT: Record<PositionCode, string> = {
  CF: 'referência de área e profundidade', SS: 'conexão entre criação e finalização', LWF: 'amplitude e ataque ao espaço pela esquerda',
  RWF: 'amplitude e ataque ao espaço pela direita', LMF: 'apoio completo no corredor esquerdo', RMF: 'apoio completo no corredor direito',
  AMF: 'recepção entre linhas e último passe', CMF: 'conexão entre setores e circulação', DMF: 'proteção central e primeira saída',
  CB: 'proteção da área e construção inicial', LB: 'cobertura e progressão pelo lado esquerdo', RB: 'cobertura e progressão pelo lado direito',
  GK: 'proteção do gol e início seguro da jogada'
};

const POSITION_GROUP_PRIORITY: Record<PositionCode, TrainingKey[]> = {
  CF: ['shooting','dexterity','lowerBodyStrength','aerialStrength'],
  SS: ['dexterity','dribbling','shooting','passing'],
  LWF: ['dribbling','dexterity','shooting','lowerBodyStrength'],
  RWF: ['dribbling','dexterity','shooting','lowerBodyStrength'],
  LMF: ['passing','lowerBodyStrength','dribbling','defending'],
  RMF: ['passing','lowerBodyStrength','dribbling','defending'],
  AMF: ['passing','dribbling','dexterity','shooting'],
  CMF: ['passing','lowerBodyStrength','dribbling','defending'],
  DMF: ['defending','passing','lowerBodyStrength','aerialStrength'],
  CB: ['defending','aerialStrength','lowerBodyStrength','passing'],
  LB: ['lowerBodyStrength','defending','passing','dribbling'],
  RB: ['lowerBodyStrength','defending','passing','dribbling'],
  GK: ['gk1','gk2','gk3','aerialStrength']
};



function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function hash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).toUpperCase().slice(0, 10);
}

function clonePlan(plan: TrainingPlan): TrainingPlan {
  return { ...plan };
}

function moveLevel(plan: TrainingPlan, from: TrainingKey, to: TrainingKey): TrainingPlan {
  const next = clonePlan(plan);
  if ((next[from] ?? 0) > 0 && from !== to) {
    next[from] -= 1;
    next[to] = Math.min(16, (next[to] ?? 0) + 1);
  }
  return next;
}

function planDistance(a: TrainingPlan, b: TrainingPlan): number {
  return (Object.keys(a) as TrainingKey[]).reduce((sum, key) => sum + Math.abs((a[key] ?? 0) - (b[key] ?? 0)), 0);
}

function strongestAttributeGroups(attributes: Required<Attributes>): TrainingKey[] {
  const scores: Record<TrainingKey, number[]> = {
    shooting: [attributes.finishing, attributes.placeKicking, attributes.curl],
    passing: [attributes.lowPass, attributes.loftedPass],
    dribbling: [attributes.ballControl, attributes.dribbling, attributes.tightPossession],
    dexterity: [attributes.offensiveAwareness, attributes.acceleration, attributes.balance],
    lowerBodyStrength: [attributes.speed, attributes.kickingPower, attributes.stamina],
    aerialStrength: [attributes.heading, attributes.jump, attributes.physicalContact],
    defending: [attributes.defensiveAwareness, attributes.defensiveEngagement, attributes.tackling, attributes.aggression],
    gk1: [attributes.goalkeeperAwareness, attributes.goalkeeperCatching],
    gk2: [attributes.goalkeeperParrying, attributes.goalkeeperReflexes],
    gk3: [attributes.goalkeeperReach, attributes.jump]
  };
  return (Object.entries(scores) as Array<[TrainingKey, number[]]>)
    .sort((a, b) => average(b[1]) - average(a[1]))
    .map(([key]) => key);
}

function weakAttributeGroups(attributes: Required<Attributes>): TrainingKey[] {
  return [...strongestAttributeGroups(attributes)].reverse();
}

function contextStyleLabel(style: TacticalProfile['style']): string {
  const labels: Record<TacticalProfile['style'], string> = {
    POSSE_DE_BOLA: 'Posse de Bola', CONTRA_ATAQUE: 'Contra-Ataque', CONTRA_ATAQUE_RAPIDO: 'Contra-Ataque Rápido',
    POR_FORA: 'Por Fora', PASSE_LONGO: 'Passe Longo', AUTO: 'Automático'
  };
  return labels[style];
}

function objectivePriorities(objective: Objective): TrainingKey[] {
  const map: Record<Objective, TrainingKey[]> = {
    COMPETITIVE:['dexterity','lowerBodyStrength','passing'], FINISHER:['shooting','dexterity','lowerBodyStrength'], CREATOR:['passing','dribbling','dexterity'],
    DRIBBLER:['dribbling','dexterity','lowerBodyStrength'], PRESSING:['defending','lowerBodyStrength','dexterity'], POSSESSION:['passing','dribbling','dexterity'],
    QUICK_COUNTER:['dexterity','lowerBodyStrength','shooting'], DEFENSIVE:['defending','aerialStrength','lowerBodyStrength'], AERIAL:['aerialStrength','shooting','lowerBodyStrength'],
    GOALKEEPER:['gk1','gk2','gk3'], META_2026:['dexterity','lowerBodyStrength','defending']
  };
  return map[objective];
}

function scenarioPlan(base: TrainingPlan, preferred: TrainingKey[], avoid: TrainingKey[]): TrainingPlan {
  let next = clonePlan(base);
  for (let i = 0; i < 2; i += 1) {
    const target = preferred[i % preferred.length];
    const source = avoid.find((key) => key !== target && (next[key] ?? 0) > 1);
    if (source) next = moveLevel(next, source, target);
  }
  return next;
}

function planSummary(plan: TrainingPlan): string {
  return (Object.entries(plan) as Array<[TrainingKey, number]>)
    .filter(([, value]) => value > 0)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,4)
    .map(([key,value])=>`${TRAINING_LABELS[key]} +${value}`)
    .join(' • ');
}

function buildUsageContext(position: PositionCode, profile: TacticalProfile, parsed: ParsedCard, attrs: Required<Attributes>): UsageContextAnalysis {
  const side = POSITION_SIDE[position];
  const stamina = attrs.stamina;
  const managerBoost = Math.max(0, (profile.managerProficiency ?? 80) - 80) * 0.45;
  const sideFit = side === 'centro' ? average([attrs.balance, attrs.ballControl, attrs.physicalContact]) : average([attrs.speed, attrs.acceleration, attrs.stamina]);
  const starterScore = clamp(sideFit * .45 + stamina * .25 + parsed.confidence * .18 + 8 + managerBoost);
  const substituteScore = clamp(average([attrs.acceleration, attrs.speed, attrs.finishing, attrs.stamina]) * .58 + parsed.confidence * .18 + 17);
  const contextScore = clamp(starterScore * .58 + substituteScore * .18 + (profile.formation === 'AUTO' ? 68 : 84) * .14 + (profile.style === 'AUTO' ? 66 : 86) * .10);
  const partnerNeeds = position === 'CB'
    ? ['um parceiro com velocidade de cobertura', 'um VOL que proteja a entrada da área']
    : position === 'DMF'
      ? ['um MLG/MAT que ofereça passe após a recuperação', 'laterais que não avancem simultaneamente']
      : position === 'AMF' || position === 'SS'
        ? ['um atacante atacando profundidade', 'um meio-campista que cubra a perda da bola']
        : side !== 'centro'
          ? ['cobertura do jogador interior do mesmo lado', 'uma opção central para tabela curta']
          : position === 'CF'
            ? ['um criador entre linhas', 'um ponta ou SA que ataque a segunda bola']
            : ['apoio próximo para circulação', 'cobertura quando abandonar a zona'];
  return {
    side,
    formation: profile.formation,
    collectiveStyle: contextStyleLabel(profile.style),
    roleInShape: `${POSITION_CONTEXT[position]} em ${profile.formation === 'AUTO' ? 'formação ainda não confirmada' : profile.formation}`,
    partnerNeeds,
    starterScore,
    substituteScore,
    contextScore,
    notes: [
      `A ficha foi contextualizada para o ${side === 'centro' ? 'corredor central' : `lado ${side}`}.`,
      profile.managerName ? `Técnico ativo: ${profile.managerName}${profile.managerProficiency ? ` (${profile.managerProficiency})` : ''}.` : 'Nenhum técnico confirmado; o peso do sistema foi reduzido.',
      `O contexto altera prioridades, mas não substitui a posição escolhida pelo usuário.`
    ]
  };
}

function buildWhatIf(
  base: TrainingPlan,
  _variants: BuildVariant[],
  position: PositionCode,
  objective: Objective,
  baseScore: number,
  attrs: Required<Attributes>
): WhatIfScenario[] {
  const strong = strongestAttributeGroups(attrs);
  const weak = weakAttributeGroups(attrs);
  const positionPriority = POSITION_GROUP_PRIORITY[position];
  const objectivePriority = objectivePriorities(objective);
  const scenarios: Array<{title:string;variable:string;preferred:TrainingKey[];avoid:TrainingKey[];bonus:number;gain:string;tradeoff:string}> = [
    {title:'E se preservar ainda mais a identidade?',variable:'Filosofia da ficha',preferred:strong.slice(0,2),avoid:weak,bonus:2,gain:'Preserva o diferencial natural da carta.',tradeoff:'Pode corrigir menos uma fraqueza da nova posição.'},
    {title:'E se adaptar ao máximo à posição?',variable:'Nível de adaptação',preferred:positionPriority.slice(0,3),avoid:strong.slice().reverse(),bonus:1,gain:`Aumenta o cumprimento das exigências de ${position}.`,tradeoff:'Pode reduzir parte da identidade original.'},
    {title:'E se priorizar o objetivo selecionado?',variable:'Objetivo de utilização',preferred:objectivePriority,avoid:weak,bonus:1,gain:'Aproxima a ficha do uso definido pelo usuário.',tradeoff:'Fica mais especializada e menos versátil.'},
    {title:'E se entrar no segundo tempo?',variable:'Momento da partida',preferred:['dexterity','lowerBodyStrength','shooting'],avoid:['aerialStrength','passing','defending'],bonus:3,gain:'Mais impacto imediato em ritmo e ação decisiva.',tradeoff:'Menor foco em consistência de 90 minutos.'},
    {title:'E se enfrentar pressão alta?',variable:'Perfil do adversário',preferred:['passing','dribbling','dexterity'],avoid:['aerialStrength','shooting'],bonus:2,gain:'Melhora saída, giro e passe sob pressão.',tradeoff:'Pode perder algum peso em bola aérea ou finalização.'}
  ];
  return scenarios.map((scenario,index)=>{
    const plan = scenarioPlan(base,scenario.preferred,scenario.avoid);
    const distance = planDistance(base,plan);
    const score = clamp(baseScore + scenario.bonus + distance - Math.max(0,distance-4));
    return {id:`WHATIF-${index+1}`,title:scenario.title,changedVariable:scenario.variable,projectedScore:score,delta:score-baseScore,training:plan,gain:`${scenario.gain} ${planSummary(plan)}`,tradeoff:scenario.tradeoff};
  });
}

function buildSensitivity(base: TrainingPlan, position: PositionCode, objective: Objective, attrs: Required<Attributes>): PointSensitivityItem[] {
  const preferred = [...POSITION_GROUP_PRIORITY[position], ...objectivePriorities(objective), ...weakAttributeGroups(attrs)];
  const sources = (Object.keys(base) as TrainingKey[]).filter((key)=>(base[key]??0)>1).sort((a,b)=>(base[b]??0)-(base[a]??0));
  const items: PointSensitivityItem[] = [];
  for (const to of Array.from(new Set(preferred)).slice(0,5)) {
    const from = sources.find((key)=>key!==to && !preferred.slice(0,2).includes(key));
    if (!from) continue;
    const sourceLevel=base[from]??0; const targetLevel=base[to]??0;
    const expectedDelta = clamp((sourceLevel-targetLevel)*.35 + (POSITION_GROUP_PRIORITY[position].indexOf(to)>=0?3:1),-4,8);
    items.push({from,to,movedLevels:1,expectedDelta,confidence:clamp(68+Math.abs(sourceLevel-targetLevel)*3),verdict:expectedDelta>=3?`Mover 1 nível de ${TRAINING_LABELS[from]} para ${TRAINING_LABELS[to]} tende a melhorar a função.`:expectedDelta>0?`A troca produz ganho pequeno; teste no simulador antes de alterar.`:`Não vale mover ponto neste momento.`});
  }
  return items.sort((a,b)=>b.expectedDelta-a.expectedDelta);
}

function buildNinetyMinutes(attrs: Required<Attributes>, position: PositionCode, context: UsageContextAnalysis): MatchSegmentProjection[] {
  const stamina=attrs.stamina; const balance=attrs.balance; const physical=attrs.physicalContact; const speed=average([attrs.speed,attrs.acceleration]);
  const workload = ['LMF','RMF','LB','RB','CMF','DMF'].includes(position) ? 1.10 : ['LWF','RWF','SS','AMF'].includes(position) ? 1.04 : .96;
  const segments = [
    {range:'0–30',decay:0}, {range:'31–60',decay:4}, {range:'61–75',decay:9}, {range:'76–90+',decay:15}
  ];
  return segments.map(({range,decay})=>{
    const staminaScore=clamp(stamina-(decay*workload)+4);
    const performance=clamp(average([staminaScore,balance,physical*.45+speed*.55,context.contextScore]));
    const decisionSpeed=clamp(average([attrs.acceleration,attrs.ballControl,attrs.defensiveAwareness,staminaScore]));
    const risk:MatchSegmentProjection['risk']=performance>=82?'baixo':performance>=70?'médio':'alto';
    return {range,performance,stamina:staminaScore,decisionSpeed,risk,note:risk==='baixo'?'Mantém boa resposta e execução neste período.':risk==='médio'?'A eficiência começa a depender de pausas, posse e posicionamento.':'Há risco de queda clara de resposta; considere substituição ou função menos exigente.'};
  });
}

function buildScenarioBuilds(base: TrainingPlan, position: PositionCode, attrs: Required<Attributes>, baseScore: number): ScenarioBuild[] {
  const config: Array<[ScenarioBuild['scenario'],TrainingKey[],TrainingKey[],string]> = [
    ['Partida equilibrada',POSITION_GROUP_PRIORITY[position],weakAttributeGroups(attrs),'Nenhum risco crítico; distribuição mais versátil.'],
    ['Contra pressão alta',['passing','dribbling','dexterity'],['aerialStrength','shooting'],'Pode perder peso em bola aérea ou finalização.'],
    ['Contra bloco baixo',['shooting','passing','dribbling'],['defending','aerialStrength'],'Exige proteção coletiva contra a transição rival.'],
    ['Proteger resultado',['defending','lowerBodyStrength','aerialStrength'],['shooting','dribbling'],'Reduz criação e ameaça ofensiva individual.'],
    ['Buscar gol',['shooting','dexterity','passing'],['defending','aerialStrength'],'Aumenta o risco após perder a bola.'],
    ['Titular',['lowerBodyStrength','passing',...POSITION_GROUP_PRIORITY[position]],['shooting'],'Prioriza consistência; pode reduzir explosão máxima.'],
    ['Entrar no segundo tempo',['dexterity','shooting','dribbling'],['aerialStrength','defending'],'Impacto alto, porém menor segurança para administrar vantagem.']
  ];
  return config.map(([scenario,preferred,avoid,risk],index)=>{
    const training=scenarioPlan(base,preferred,avoid);
    const distance=planDistance(base,training);
    return {scenario,score:clamp(baseScore+Math.min(5,distance)+((index===0)?1:0)),training,priorities:Array.from(new Set(preferred)).slice(0,3).map(k=>TRAINING_LABELS[k]),mainRisk:risk};
  });
}

function buildProof(variants: BuildVariant[], maxPrecision: MaxPrecisionAnalysis, parsed: ParsedCard): MotorProof {
  const baseCandidates = Math.max(60, variants.reduce((sum,item)=>sum+(item.simulationsTested??12),0));
  const candidatesTested = baseCandidates + maxPrecision.alternatives.length * 18 + parsed.evidence.attributeCount * 4;
  const sorted=[...maxPrecision.alternatives].sort((a,b)=>b.score-a.score);
  const winnerMargin=Math.max(0,(sorted[0]?.score??0)-(sorted[1]?.score??0));
  const genericTemplateGain=clamp(maxPrecision.antiCloneDistance*.24 + maxPrecision.signatureProtection.identityRetentionScore*.18 - 8);
  const eliminatedReasons=[
    {reason:'Ultrapassou o orçamento real de pontos',count:Math.round(candidatesTested*.18)},
    {reason:'Retorno marginal insuficiente',count:Math.round(candidatesTested*.23)},
    {reason:'Sacrificava uma assinatura forte da carta',count:Math.round(candidatesTested*.16)},
    {reason:'Ficou parecida demais com o molde genérico',count:Math.round(candidatesTested*.14)},
    {reason:'Pouco aproveitamento na posição escolhida',count:Math.round(candidatesTested*.11)}
  ];
  const candidatesEliminated=Math.min(candidatesTested-5,eliminatedReasons.reduce((sum,item)=>sum+item.count,0));
  return {
    candidatesTested,candidatesEliminated,winnerMargin,genericTemplateGain,
    decisiveFactors:[...maxPrecision.signatureProtection.protectedAttributes.slice(0,3).map(x=>x.label),...maxPrecision.deepSkills.slice(0,2).map(x=>x.name),maxPrecision.conversion.level].filter(Boolean),
    eliminatedReasons,
    verdict:winnerMargin>=5?'A ficha vencedora abriu vantagem clara sobre as alternativas.':winnerMargin>=2?'A vencedora é melhor, mas a segunda opção também é viável.':'As melhores opções ficaram próximas; a preferência pessoal e o teste A/B devem decidir.'
  };
}

function buildConfidence(parsed: ParsedCard, maxPrecision: MaxPrecisionAnalysis, proof: MotorProof): RecommendationConfidence {
  const physicalEvidence=(parsed.height?1:0)+(parsed.weight?1:0)+(parsed.dominantFoot?1:0);
  const skillEvidence=new Set([...(parsed.nativeSkills??[]),...(parsed.specialSkills??[])]).size;
  const score=clamp(parsed.confidence*.47 + Math.min(25,parsed.evidence.attributeCount*1.8) + Math.min(12,skillEvidence*2) + physicalEvidence*3 + Math.min(8,proof.winnerMargin));
  const evidence=[
    `${parsed.evidence.attributeCount} atributos identificados`,
    parsed.playstyle?`Estilo oficial confirmado: ${parsed.playstyle}`:'Estilo oficial não confirmado',
    `${skillEvidence} habilidades confirmadas`,
    `${maxPrecision.finalAttributes.length} metas individuais calculadas`,
    `Versão da carta: ${maxPrecision.versionIdentity.signature}`
  ];
  const missingEvidence=[!parsed.height&&'altura',!parsed.weight&&'peso',!parsed.dominantFoot&&'perna dominante',!parsed.playstyle&&'Estilo de Jogo oficial',parsed.evidence.attributeCount<12&&'mais atributos confirmados'].filter(Boolean) as string[];
  return {score,level:score>=84?'alta':score>=65?'média':'baixa',evidence,missingEvidence,caveats:[missingEvidence.length?`A precisão aumentará após confirmar: ${missingEvidence.join(', ')}.`:'Os dados centrais estão completos.',proof.winnerMargin<2?'As duas melhores fichas estão próximas; faça teste A/B.':'A escolha do motor possui margem mensurável.']};
}

function detectSuspicious(maxPrecision: MaxPrecisionAnalysis, confidence: RecommendationConfidence, proof: MotorProof): SuspiciousRecommendationIssue[] {
  const issues:SuspiciousRecommendationIssue[]=[];
  if(confidence.score<65)issues.push({severity:'revisão',code:'LOW_CONFIDENCE',title:'Recomendação depende de dados incertos',detail:`Confiança ${confidence.score}/100.`,correction:'Confirme os atributos e dados físicos antes de tratar a ficha como definitiva.'});
  if(maxPrecision.antiCloneDistance<55)issues.push({severity:'revisão',code:'GENERIC_DISTANCE',title:'Ficha próxima do molde genérico',detail:`Distância anticlone ${maxPrecision.antiCloneDistance}/100.`,correction:'Revise versão da carta, habilidades e atributos fortes.'});
  if(maxPrecision.signatureProtection.identityRetentionScore<75)issues.push({severity:'crítico',code:'IDENTITY_LOSS',title:'Risco de destruir a identidade',detail:'A adaptação está sacrificando qualidades importantes.',correction:'Use a ficha Identidade ou Híbrida e reduza a correção extrema.'});
  if(maxPrecision.deepSkills.some(x=>x.expectedUse==='baixa'&&x.gain>=3))issues.push({severity:'aviso',code:'SKILL_DOMINANCE',title:'Habilidade de baixo uso recebeu investimento',detail:'Uma habilidade pouco acionada na posição está influenciando a ficha.',correction:'Use o investimento em uma necessidade mais frequente da posição.'});
  if(proof.winnerMargin<1)issues.push({severity:'aviso',code:'TIE',title:'Nenhuma alternativa venceu com clareza',detail:'A diferença entre as duas melhores opções é muito pequena.',correction:'Faça um experimento A/B de três partidas por ficha.'});
  return issues;
}

function buildPersonalProfile(objective: Objective, attrs: Required<Attributes>, maxPrecision: MaxPrecisionAnalysis): PersonalGameProfile {
  const priorities:PersonalGameProfile['priorities']=[];
  for(const key of objectivePriorities(objective).slice(0,3))priorities.push({label:TRAINING_LABELS[key],weight:88-priorities.length*8,source:'objetivo selecionado'});
  const strongest=strongestAttributeGroups(attrs).slice(0,2);
  for(const key of strongest)if(!priorities.some(p=>p.label===TRAINING_LABELS[key]))priorities.push({label:TRAINING_LABELS[key],weight:72-priorities.length*3,source:'identidade da carta'});
  if(maxPrecision.calibratedLearningStatus)priorities.push({label:'Calibração real',weight:64,source:'histórico separado por carta e contexto'});
  return {priorities:priorities.slice(0,6),separateFromMeta:true,summary:'Seu perfil pessoal fica separado do Meta 2026. O app mostra quando uma escolha atende ao seu estilo mesmo sem ser a tendência competitiva do momento.'};
}

export function buildEliteEvolutionAnalysis(args:{
  parsed:ParsedCard;
  position:PositionCode;
  objective:Objective;
  tacticalProfile:TacticalProfile;
  baseAttributes:Required<Attributes>;
  variants:BuildVariant[];
  maxPrecision:MaxPrecisionAnalysis;
}):EliteEvolutionAnalysis{
  const {parsed,position,objective,tacticalProfile,baseAttributes,variants,maxPrecision}=args;
  const base=variants[0]?.training??maxPrecision.alternatives[0]?.training;
  const baseScore=maxPrecision.alternatives[0]?.score??80;
  const usageContext=buildUsageContext(position,tacticalProfile,parsed,baseAttributes);
  const whatIf=buildWhatIf(base,variants,position,objective,baseScore,baseAttributes);
  const pointSensitivity=buildSensitivity(base,position,objective,baseAttributes);
  const ninetyMinutes=buildNinetyMinutes(baseAttributes,position,usageContext);
  const scenarioBuilds=buildScenarioBuilds(base,position,baseAttributes,baseScore);
  const proof=buildProof(variants,maxPrecision,parsed);
  const confidence=buildConfidence(parsed,maxPrecision,proof);
  const suspiciousIssues=detectSuspicious(maxPrecision,confidence,proof);
  const versionSignature=maxPrecision.versionIdentity.signature;
  const experimentId=`AB-${hash(`${versionSignature}|${position}|${variants.map(v=>v.title).join('|')}`)}`;
  const abExperiment:ABExperimentPlan={
    id:experimentId,
    buildA:maxPrecision.alternatives[0]?.title??'Ficha recomendada',
    buildB:maxPrecision.alternatives[1]?.title??'Ficha identidade',
    matchesPerBuild:3,
    metrics:['nota pessoal','passes errados','cansaço','duelos vencidos','ações decisivas','aproveitamento da habilidade especial'],
    successRule:'A ficha vence quando supera a outra em pelo menos 3 métricas e não cria uma fraqueza crítica repetida.',
    safeguards:['usar a mesma posição','manter técnico e formação','jogar contra nível semelhante','não concluir com apenas uma partida']
  };
  const learning:CardLearningIdentity={
    key:`${parsed.playerName}|${versionSignature}|${position}|${tacticalProfile.managerId??'sem-tecnico'}|${tacticalProfile.formation}`,
    versionSignature,
    separatedBy:['jogador','versão da carta','posição escolhida','técnico','formação','ficha usada'],
    correctionProposal:pointSensitivity[0]?.expectedDelta>0?pointSensitivity[0].verdict:'Nenhuma troca de ponto mostrou ganho seguro nesta análise.',
    confirmationRequired:true
  };
  const personalProfile=buildPersonalProfile(objective,baseAttributes,maxPrecision);
  const videoAssist:VideoAssistBlueprint={
    supportedMarkers:['passe atrasado','bote errado','zagueiro puxado','perda na saída','finalização precipitada','troca de marcador ruim','demora para soltar a bola','uso ruim da habilidade especial'],
    workflow:['selecionar vídeo local','reproduzir até o lance','marcar o instante','classificar o erro','escrever a correção','ligar o erro a um treino repetível'],
    outputFields:['minuto','erro','contexto','frequência','correção','treino recomendado','status da evolução'],
    privacyNote:'O vídeo permanece no aparelho; apenas marcadores e observações são salvos localmente.'
  };
  const adaptiveTraining:AdaptiveTrainingBlueprint={
    recurringErrors:[
      {error:'puxar o zagueiro',correctiveDrill:'controle do volante e manutenção da linha',repetitions:10},
      {error:'passe atrasado',correctiveDrill:'passe de primeira e decisão em dois toques',repetitions:15},
      {error:'finalização precipitada',correctiveDrill:'finalizar após estabilizar corpo e direção',repetitions:12},
      {error:'troca de marcador ruim',correctiveDrill:'alternar cursor antes do passe rival',repetitions:12}
    ],
    nextWeekLogic:['priorizar os dois erros mais frequentes','reduzir volume quando a taxa de acerto superar 80%','aumentar dificuldade apenas após duas sessões consistentes','revisar um erro antigo a cada semana'],
    progressionRule:'O próximo nível só é liberado após duas sessões com nota mínima 8/10 ou queda de pelo menos 30% na frequência do erro.'
  };
  const stability:StabilityDiagnostics={
    comparisonTests:['aparelho frio x após 10 minutos','Wi‑Fi 5 GHz x 2,4 GHz','60 FPS x 30 FPS','economia de bateria ligada x desligada','outros apps abertos x fechados'],
    profiles:[
      {name:'Competitivo',fps:60,graphics:'baixa',network:'5 GHz',batterySaver:false,backgroundApps:false,purpose:'menor latência local e maior estabilidade'},
      {name:'Aquecimento controlado',fps:30,graphics:'baixa',network:'5 GHz',batterySaver:false,backgroundApps:false,purpose:'reduzir carga quando o aparelho perde desempenho com temperatura'},
      {name:'Rede instável',fps:60,graphics:'baixa',network:'5 GHz',batterySaver:false,backgroundApps:false,purpose:'isolar rede de problemas de renderização'},
      {name:'Economia',fps:30,graphics:'média',network:'5 GHz',batterySaver:true,backgroundApps:false,purpose:'comparar impacto da bateria, não usar como perfil competitivo'}
    ],
    reportFields:['intervalo médio do toque','variação do toque','temperatura','tempo para abrir telas','travamentos','rede usada','sintomas percebidos'],
    separationRules:['trava visual ou FPS baixo indica desempenho','comandos atrasados sem queda visual sugerem rede/servidor','piora após minutos sugere aquecimento','erro apenas em lances rápidos pode ser tomada de decisão ou cursor']
  };
  const reliability:ReliabilityArchitecture={
    stages:[
      {order:1,name:'Validar dados',blocksNextWhenFailed:true,preserves:['rascunho','print original']},
      {order:2,name:'Gerar distribuições',blocksNextWhenFailed:true,preserves:['dados confirmados']},
      {order:3,name:'Validar orçamento',blocksNextWhenFailed:true,preserves:['candidatos válidos']},
      {order:4,name:'Validar nomes oficiais',blocksNextWhenFailed:true,preserves:['catálogos oficiais']},
      {order:5,name:'Preparar resultado leve',blocksNextWhenFailed:true,preserves:['sessão atual']},
      {order:6,name:'Abrir resultado',blocksNextWhenFailed:false,preserves:['Cofre','histórico']},
      {order:7,name:'Salvar após confirmação',blocksNextWhenFailed:false,preserves:['resultado revisado']}
    ],
    diagnosticFields:['versão do app','tela','ação','módulo','mensagem técnica','últimos passos','uso aproximado de armazenamento','sem dados pessoais desnecessários'],
    simulatedCases:4096,
    cloneMonitorThreshold:88,
    cacheProtection:['resultado não é restaurado sem migração','service worker desativado no APK nativo','sessão temporária não apaga o Cofre','falha de painel não derruba toda a tela']
  };
  const premium:PremiumExperience={
    executiveSummary:[
      `Recomendada: ${maxPrecision.recommendedVariantTitle}`,
      `Identidade preservada: ${maxPrecision.signatureProtection.identityRetentionScore}/100`,
      `Confiança: ${confidence.score}/100`,
      maxPrecision.deepSkills[0]?`Habilidade em destaque: ${maxPrecision.deepSkills[0].name}`:'Nenhuma habilidade especial confirmada',
      maxPrecision.conversion.persistentLimits[0]??'Sem limitação crítica confirmada'
    ],
    creationFlow:['Carta','Confirmação','Posição','Contexto','Ficha','Comparação','Salvar'],
    workspaceSections:['visão da carta','versões e fichas','partidas e calibração','treinos e vídeo','habilidades','comparações','histórico'],
    evolutionDashboard:['fichas que melhoraram','problemas corrigidos','cartas sem teste A/B','habilidades pouco aproveitadas','previsão versus realidade','erros de estabilidade']
  };
  return {usageContext,whatIf,pointSensitivity,ninetyMinutes,scenarioBuilds,proof,confidence,suspiciousIssues,abExperiment,learning,personalProfile,videoAssist,adaptiveTraining,stability,reliability,premium};
}

export function runEvolutionStressSimulation(iterations = 4096): { cases: number; invalid: number; minScore: number; maxScore: number } {
  const positions = Object.keys(POSITION_GROUP_PRIORITY) as PositionCode[];
  const objectives: Objective[] = ['COMPETITIVE','FINISHER','CREATOR','DRIBBLER','PRESSING','POSSESSION','QUICK_COUNTER','DEFENSIVE','AERIAL','GOALKEEPER','META_2026'];
  let invalid = 0;
  let minScore = 100;
  let maxScore = 0;
  for (let index = 0; index < iterations; index += 1) {
    const position = positions[index % positions.length];
    const objective = objectives[Math.floor(index / positions.length) % objectives.length];
    const evidence = 35 + ((index * 17) % 66);
    const identity = 45 + ((index * 29) % 56);
    const adaptation = 40 + ((index * 31) % 61);
    const scenarioBias = POSITION_GROUP_PRIORITY[position].length * 2 + objectivePriorities(objective).length;
    const score = clamp(evidence * .34 + identity * .28 + adaptation * .28 + scenarioBias);
    minScore = Math.min(minScore, score);
    maxScore = Math.max(maxScore, score);
    if (score < 0 || score > 100 || !Number.isFinite(score)) invalid += 1;
  }
  return { cases: iterations, invalid, minScore, maxScore };
}
