import type {
  AnalysisResult,
  ConnectionProfile,
  PositionCode,
  RealPerformance2027V4080R7Analysis,
  UnifiedSkillDecision
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { buildPersonalizedSkillPlan } from './skillIntelligenceV31';
import { buildOwnedSkillKeys, skillIdentityKey } from './officialSkillIdentity';

export const REAL_PERFORMANCE_2027_V4080_R7_VERSION = '40.80-r7-real-performance-2027' as const;

const CATEGORIES: UnifiedSkillDecision['category'][] = ['finalização','passe','drible','defesa','aérea','físico','goleiro','mental'];

const PHASE_WEIGHT: Record<PositionCode, { attack: number; defence: number }> = {
  GK:{attack:.08,defence:.92}, CB:{attack:.18,defence:.82}, LB:{attack:.4,defence:.6}, RB:{attack:.4,defence:.6},
  DMF:{attack:.38,defence:.62}, CMF:{attack:.55,defence:.45}, LMF:{attack:.64,defence:.36}, RMF:{attack:.64,defence:.36},
  AMF:{attack:.78,defence:.22}, SS:{attack:.8,defence:.2}, CF:{attack:.88,defence:.12}, LWF:{attack:.82,defence:.18}, RWF:{attack:.82,defence:.18}
};

const ATTACK_CATEGORY: Record<UnifiedSkillDecision['category'], number> = {
  finalização:100,passe:90,drible:94,defesa:18,aérea:66,físico:62,goleiro:5,mental:70
};
const DEFENCE_CATEGORY: Record<UnifiedSkillDecision['category'], number> = {
  finalização:8,passe:42,drible:28,defesa:100,aérea:78,físico:86,goleiro:100,mental:82
};
const DELAY_CATEGORY: Record<UnifiedSkillDecision['category'], number> = {
  finalização:54,passe:92,drible:88,defesa:76,aérea:58,físico:82,goleiro:78,mental:86
};

function clamp(value: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)) * 10) / 10;
}

function connection(result: AnalysisResult): ConnectionProfile {
  return result.efootballV600?.connectionProfile ?? result.tacticalProfile.connectionProfile ?? 'VARIABLE';
}

function phaseLabels(position: PositionCode) {
  const table: Record<PositionCode, { attack: string; defence: string }> = {
    GK:{attack:'início seguro da construção',defence:'proteção da baliza e cobertura de profundidade'},
    CB:{attack:'saída curta e sustentação',defence:'proteção da área e correção manual'},
    LB:{attack:'apoio por fora e saída limpa',defence:'fechar corredor e recompor a última linha'},
    RB:{attack:'apoio por fora e saída limpa',defence:'fechar corredor e recompor a última linha'},
    DMF:{attack:'apoio à circulação e passe de segurança',defence:'proteção central e corte de linhas'},
    CMF:{attack:'progressão, tabela e apoio entre linhas',defence:'compactação e segunda pressão'},
    LMF:{attack:'progressão pelo meio-lado',defence:'recomposição do corredor'},
    RMF:{attack:'progressão pelo meio-lado',defence:'recomposição do corredor'},
    AMF:{attack:'criação entrelinhas e último passe',defence:'fechar passe interior e primeira pressão'},
    SS:{attack:'aproximação por dentro, tabela e infiltração',defence:'fechar corredor interior e orientar a saída rival'},
    CF:{attack:'referência, ruptura e finalização',defence:'primeira pressão e saída para contra-ataque'},
    LWF:{attack:'condução, ruptura e criação do lado',defence:'recomposição curta e pressão exterior'},
    RWF:{attack:'condução, ruptura e criação do lado',defence:'recomposição curta e pressão exterior'}
  };
  return table[position];
}

function candidatePool(result: AnalysisResult): UnifiedSkillDecision[] {
  const plan = result.efootballV600?.finalTraining ?? result.training;
  const position = result.bestPosition.code;
  const map = new Map<string, UnifiedSkillDecision>();
  const blueprints: UnifiedSkillDecision['category'][][] = [
    CATEGORIES.slice(0,5),
    ['passe','drible','mental','físico','defesa'],
    ['defesa','físico','aérea','passe','mental'],
    ['drible','drible','passe','finalização','físico'],
    ['finalização','drible','físico','passe','aérea']
  ];
  for (const category of CATEGORIES) blueprints.push([category,category,'passe','físico','mental']);
  for (const preferredCategories of blueprints) {
    for (const item of buildPersonalizedSkillPlan(result, plan, { label:'Desempenho Real 2027 r7', preferredCategories, positionOverride: position })) {
      const key = skillIdentityKey(item.name);
      const existing = map.get(key);
      if (!existing || item.score > existing.score) map.set(key, item);
    }
  }
  return [...map.values()];
}

function marginalSkills(result: AnalysisResult): RealPerformance2027V4080R7Analysis['skillMarginal'] {
  const position = result.bestPosition.code;
  const phase = PHASE_WEIGHT[position];
  const profile = connection(result);
  const delayFactor = profile === 'HIGH_DELAY' ? 1 : profile === 'VARIABLE' ? .72 : .35;
  const v6Protected = new Set((result.efootballV600?.finalSkills ?? result.recommendedSkills).map(skillIdentityKey));
  const owned = buildOwnedSkillKeys(result.parsed.nativeSkills, result.parsed.specialSkills, result.parsed.additionalSkills ?? []);
  return candidatePool(result)
    .filter((item) => !owned.has(skillIdentityKey(item.name)))
    .map((item) => {
      const attackGain = clamp(ATTACK_CATEGORY[item.category] * phase.attack);
      const defenceGain = clamp(DEFENCE_CATEGORY[item.category] * phase.defence);
      const delayResilience = clamp(DELAY_CATEGORY[item.category] * delayFactor);
      const dnaGain = clamp(Math.min(100, item.identityBoost * 5 + item.score * .55 + (v6Protected.has(skillIdentityKey(item.name)) ? 12 : 0)));
      const marginalGain = clamp(item.score * .42 + attackGain * .2 + defenceGain * .2 + delayResilience * .1 + dnaGain * .08);
      return {
        name:item.name, category:item.category, marginalGain, attackGain, defenceGain, delayResilience, dnaGain,
        reason:`${item.gameplayImpact} Ganho marginal calculado depois da ficha final, considerando ataque, defesa e ${profile === 'HIGH_DELAY' ? 'alta latência' : profile === 'VARIABLE' ? 'conexão variável' : 'conexão estável'}.`
      };
    })
    .sort((a,b)=>b.marginalGain-a.marginalGain || b.dnaGain-a.dnaGain || a.name.localeCompare(b.name,'pt-BR'));
}

function finalSkillSelection(result: AnalysisResult, ranked: RealPerformance2027V4080R7Analysis['skillMarginal']): string[] {
  const selected: typeof ranked = [];
  const position = result.bestPosition.code;
  const cap = (category: UnifiedSkillDecision['category']) => {
    if (position === 'GK') return category === 'goleiro' ? 3 : 1;
    if (['CB','LB','RB','DMF'].includes(position)) return category === 'defesa' ? 2 : 1;
    if (['SS','AMF','LWF','RWF','LMF','RMF'].includes(position)) return category === 'drible' ? 2 : 1;
    if (position === 'CF') return category === 'finalização' || category === 'aérea' ? 2 : 1;
    return 1;
  };
  for (const item of ranked) {
    if (selected.length >= 5) break;
    const same = selected.filter((entry)=>entry.category === item.category).length;
    if (same >= cap(item.category)) continue;
    selected.push(item);
  }
  for (const item of ranked) {
    if (selected.length >= 5) break;
    if (!selected.some((entry)=>entry.name === item.name)) selected.push(item);
  }
  return selected.slice(0,5).map((item)=>item.name);
}

function scoreExistingImpeto(name: string, result: AnalysisResult): number {
  const normalized = name.toLocaleLowerCase('pt-BR');
  const pos = result.bestPosition.code;
  let score = 72;
  if (['CB','LB','RB','DMF'].includes(pos) && /defesa|roubo|duelo/.test(normalized)) score += 17;
  if (['CMF','AMF','SS','LMF','RMF'].includes(pos) && /agilidade|passe|t[eé]cnica|prote[cç][aã]o|motor/.test(normalized)) score += 15;
  if (pos === 'CF' && /artilheiro|agilidade|movimento/.test(normalized)) score += 16;
  if (pos === 'GK' && /goleiro|reflex|alcance/.test(normalized)) score += 18;
  if (connection(result) !== 'STABLE' && /agilidade|passe|t[eé]cnica|prote[cç][aã]o/.test(normalized)) score += 6;
  return clamp(score);
}

function impetoPolicy(result: AnalysisResult): RealPerformance2027V4080R7Analysis['impetoPolicy'] {
  const status = result.parsed.evidence.impetoSlotStatus ?? 'NAO_CONFIRMADO';
  const current = result.parsed.impetos.find((item)=>item.active !== false && !/sem\s+(?:ímpeto|impeto|booster)/i.test(item.name))?.name ?? null;
  const candidates = result.maximumPerformanceV4080?.impeto.candidates?.length ? result.maximumPerformanceV4080.impeto.candidates : result.recommendedImpetos;
  const idealItem = candidates.find((item)=>!current || skillIdentityKey(item.name) !== skillIdentityKey(current)) ?? candidates[0] ?? null;
  const currentScore = current ? scoreExistingImpeto(current,result) : null;
  const ideal = idealItem?.name ?? null;
  const idealScore = idealItem ? clamp(Number(idealItem.score ?? 72)) : null;
  const gain = currentScore !== null && idealScore !== null ? clamp(idealScore-currentScore,-100,100) : idealScore ?? 0;
  if (status === 'SEM_VAGA') return { slotStatus:status,current,currentScore,ideal:null,idealScore:null,gain:0,decision:'SEM_VAGA',reason:'A carta não mostra Vaga de Ímpeto. Preserve o que já existe e não gaste Token.' };
  if (status === 'NAO_CONFIRMADO') return { slotStatus:status,current,currentScore,ideal,idealScore,gain,decision:'CONFIRMAR_ANTES_DE_GASTAR',reason:'O OCR não confirmou a vaga. O app pode mostrar o melhor cenário futuro, mas não autoriza gasto.' };
  if (status === 'DISPONIVEL') return { slotStatus:status,current,currentScore,ideal,idealScore,gain,decision:'ADICIONAR_QUANDO_POSSIVEL',reason:ideal ? `Há vaga confirmada. ${ideal} é o melhor alvo futuro; não é necessário mexer no Ímpeto nativo já existente.` : 'Há vaga, mas nenhuma opção segura superou o filtro atual.' };
  if (!current) return { slotStatus:status,current:null,currentScore:null,ideal,idealScore,gain,decision:'MANTER',reason:'A vaga aparece ocupada, mas o nome atual não foi lido com confiança. Não recomendo troca sem identificar o Ímpeto existente.' };
  if (ideal && gain >= 8) return { slotStatus:status,current,currentScore,ideal,idealScore,gain,decision:'TROCAR_QUANDO_POSSIVEL',reason:`O Ímpeto atual continua utilizável, mas ${ideal} tem ganho funcional estimado ${gain.toFixed(1)} pontos maior. Troca é opcional e só vale quando o recurso estiver disponível.` };
  return { slotStatus:status,current,currentScore,ideal,idealScore,gain,decision:'MANTER',reason:`O Ímpeto atual entrega retorno próximo do ideal. A diferença estimada (${gain.toFixed(1)}) não justifica gastar recurso agora.` };
}

function learningPolicy(result: AnalysisResult): RealPerformance2027V4080R7Analysis['learning'] {
  const verifiedAt = result.longitudinalGameplayMemoryV4060?.verifiedAt;
  const current = verifiedAt ? Date.parse(verifiedAt) >= Date.parse('2026-08-13T00:00:00Z') : false;
  const state = current ? 'V6_ATUAL' : verifiedAt || result.longitudinalGameplayMemoryV4060?.applied ? 'LEGADO_5X' : 'SEM_DADOS';
  return {
    epoch:'V6', memoryState:state, currentMatchWeight:1, legacyMatchWeight:.35, minimumAbMatchesPerArm:5,
    recommendation: state === 'V6_ATUAL'
      ? 'Continue validando na v6.0. Compare A/B somente dentro da mesma posição, estilo, condição de conexão e formação de ataque/defesa.'
      : state === 'LEGADO_5X'
        ? 'A memória 5.x foi preservada como histórico, mas vale 35% do peso de uma partida v6.0. Faça pelo menos 5 partidas por variante para reconstruir a campeã.'
        : 'Sem memória v6.0 suficiente. Faça pelo menos 5 partidas por variante A/B antes de promover uma nova ficha.'
  };
}

export function buildRealPerformance2027V4080R7(result: AnalysisResult): RealPerformance2027V4080R7Analysis {
  const ranked = marginalSkills(result);
  const finalSkills = finalSkillSelection(result, ranked);
  const phase = PHASE_WEIGHT[result.bestPosition.code];
  const labels = phaseLabels(result.bestPosition.code);
  const impeto = impetoPolicy(result);
  const learning = learningPolicy(result);
  const phaseBalanceScore = clamp((result.efootballV600?.responseScore ?? 80) * phase.attack + (result.efootballV600?.manualDefenceScore ?? 80) * phase.defence);
  return {
    engineVersion:REAL_PERFORMANCE_2027_V4080_R7_VERSION,
    mode:'DESEMPENHO_REAL_2027',
    selectedPosition:result.bestPosition.code,
    connectionProfile:connection(result),
    phaseProfile:{ attackRole:labels.attack, defenceRole:labels.defence, attackWeight:clamp(phase.attack*100), defenceWeight:clamp(phase.defence*100), phaseBalanceScore },
    skillMarginal:ranked.slice(0,12), finalSkills, impetoPolicy:impeto, learning,
    guarantees:{ gerIsNotOptimizationTarget:true, networkIsNotModified:true, existingImpetoNotAutoReplaced:true, onlyOwnedSafeSkills:true, attackAndDefenceEvaluated:true, v5HistoryDownweighted:true },
    reasons:[
      `A ficha é julgada nas duas fases: ${Math.round(phase.attack*100)}% ataque e ${Math.round(phase.defence*100)}% defesa para ${POSITION_PT[result.bestPosition.code]}.`,
      `As cinco habilidades são escolhidas pelo ganho marginal individual depois da progressão final; conexão ${connection(result)} entra como robustez, não como promessa de reduzir ping.`,
      impeto.reason,
      learning.recommendation,
      'Configuração gráfica não é tratada como “quanto mais baixo, melhor”: o app prioriza estabilidade e repetibilidade do cenário usado nos testes.'
    ],
    summary:`${result.parsed.playerName}: Desempenho Real 2027 fechou ${POSITION_PT[result.bestPosition.code]} com equilíbrio de fases ${Math.round(phaseBalanceScore)}/100, Top 5 por ganho marginal e política de Ímpeto “${impeto.decision}”.`
  };
}

export function applyRealPerformance2027V4080R7(result: AnalysisResult): AnalysisResult {
  const analysis = buildRealPerformance2027V4080R7(result);
  if (result.objective !== 'COMPETITIVE') return { ...result, realPerformance2027V4080R7:analysis };
  const finalSkills = analysis.finalSkills.length ? analysis.finalSkills : result.recommendedSkills;
  return {
    ...result,
    recommendedSkills:finalSkills,
    // A política r7 é informativa para Ímpeto: não reordena nem substitui a lista
    // persistida pela posição. Isso mantém estabilidade entre trocas de função.
    recommendedImpetos:result.recommendedImpetos,
    buildName:`Ficha Automática v40.80 r7 — Desempenho Real 2027 — ${result.parsed.playerName}`,
    buildVariants: result.buildVariants.length ? result.buildVariants.map((variant,index)=>index===0?{
      ...variant,
      title:`Ficha Final r7 — Desempenho Real 2027 — ${result.parsed.playerName}`,
      adaptationLabel:'ATAQUE + DEFESA • TOP 5 MARGINAL • ÍMPETO SEM DESPERDÍCIO',
      note:analysis.summary,
      qualityScore:analysis.phaseProfile.phaseBalanceScore
    }:variant):result.buildVariants,
    recommendationExplanation:[analysis.summary,...analysis.reasons,...result.recommendationExplanation].filter((item,index,all)=>all.indexOf(item)===index).slice(0,36),
    strengths:[
      'Top 5 escolhido por ganho marginal individual depois da ficha final, sem apagar o DNA da carta.',
      'Ímpeto atual recebe decisão explícita de manter, adicionar ou trocar no futuro; nenhuma troca é automática.',
      'A mesma carta é avaliada pelo papel no ataque e pelo papel na defesa da Formação Fluída v6.0.',
      ...result.strengths
    ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,24),
    note:`${analysis.summary} ${analysis.impetoPolicy.reason}`,
    realPerformance2027V4080R7:analysis
  };
}
