import type { AnalysisResult, AttributeKey, PositionCode, TrainingKey } from './analyzerDomain';
import { ATTRIBUTE_PT, POSITION_PT } from './analyzerDomain';

export const ATTRIBUTE_META_2027_V600_VERSION = '40.81-r1-attribute-meta-2027' as const;

export type AttributeMetaTarget2027 = {
  attribute: AttributeKey;
  label: string;
  current: number;
  targetMin: number;
  targetIdeal: number;
  usefulCeiling: number;
  priority: 'CRITICA' | 'ALTA' | 'MEDIA' | 'MANTER' | 'SATURADA';
  gap: number;
  weight: number;
  reason: string;
};

export type AttributeMeta2027Analysis = {
  engineVersion: typeof ATTRIBUTE_META_2027_V600_VERSION;
  position: PositionCode;
  positionLabel: string;
  playerPlaystyle: string | null;
  teamPlaystyle: string;
  targets: AttributeMetaTarget2027[];
  topPriorities: AttributeMetaTarget2027[];
  stopSpending: AttributeMetaTarget2027[];
  trainingBias: Partial<Record<TrainingKey, number>>;
  dnaRule: string;
  summary: string;
};

type TargetSeed = [AttributeKey, number, number, number, number, string];

const POSITION_TARGETS: Record<PositionCode, TargetSeed[]> = {
  GK: [
    ['goalkeeperAwareness',92,96,99,1.45,'Leitura e posicionamento do goleiro.'],
    ['goalkeeperReflexes',92,96,99,1.45,'Resposta em finalizações curtas.'],
    ['goalkeeperReach',90,95,98,1.25,'Cobertura de chutes distantes.'],
    ['goalkeeperParrying',88,94,97,1.05,'Reduz rebotes perigosos.'],
    ['goalkeeperCatching',87,93,96,.9,'Segurança para encerrar a jogada.']
  ],
  CB: [
    ['defensiveAwareness',92,96,99,1.5,'Posicionamento e leitura da última linha.'],
    ['tackling',89,94,98,1.32,'Qualidade do desarme manual.'],
    ['defensiveEngagement',89,94,98,1.25,'Reação sem bola e fechamento.'],
    ['physicalContact',87,93,97,1.15,'Duelo físico e proteção de área.'],
    ['speed',82,89,94,.95,'Recuperação contra ruptura.'],
    ['acceleration',78,86,92,.82,'Primeiros passos na correção.'],
    ['jump',84,91,96,.75,'Cobertura aérea.']
  ],
  LB: [
    ['speed',87,92,96,1.15,'Recuperação e cobertura do corredor.'],['acceleration',85,91,95,1.08,'Resposta a mudanças rápidas.'],
    ['stamina',88,93,97,1.05,'Mantém ida e volta durante a partida.'],['defensiveAwareness',83,90,95,1.0,'Posicionamento defensivo.'],
    ['tackling',81,88,94,.9,'Desarme no corredor.'],['lowPass',78,86,92,.65,'Saída curta segura.']
  ],
  RB: [
    ['speed',87,92,96,1.15,'Recuperação e cobertura do corredor.'],['acceleration',85,91,95,1.08,'Resposta a mudanças rápidas.'],
    ['stamina',88,93,97,1.05,'Mantém ida e volta durante a partida.'],['defensiveAwareness',83,90,95,1.0,'Posicionamento defensivo.'],
    ['tackling',81,88,94,.9,'Desarme no corredor.'],['lowPass',78,86,92,.65,'Saída curta segura.']
  ],
  DMF: [
    ['defensiveAwareness',90,95,99,1.45,'Proteção da frente da zaga.'],['defensiveEngagement',89,94,98,1.32,'Fecha linhas e reage à perda.'],
    ['tackling',87,93,97,1.22,'Recuperação limpa da posse.'],['physicalContact',84,91,96,1.0,'Duelo central.'],
    ['stamina',87,93,97,.95,'Cobertura contínua.'],['lowPass',80,88,94,.82,'Primeiro passe após recuperar.']
  ],
  CMF: [
    ['lowPass',84,91,96,1.22,'Circulação e progressão.'],['ballControl',84,91,96,1.1,'Recepção sob pressão.'],
    ['tightPossession',83,90,95,1.05,'Proteção da bola no centro.'],['stamina',86,93,97,1.0,'Presença nas duas fases.'],
    ['balance',82,90,95,.95,'Resposta em contato e giro.'],['acceleration',81,89,94,.82,'Aproximação e recomposição.']
  ],
  LMF: [
    ['lowPass',82,90,95,1.08,'Conexão por dentro e entrelinhas.'],['ballControl',84,91,96,1.08,'Primeiro toque.'],
    ['acceleration',85,92,96,1.02,'Progressão e recomposição.'],['balance',84,91,96,.98,'Mudança de direção.'],
    ['stamina',86,93,97,.95,'Trabalho de corredor/meio-lado.'],['dribbling',83,91,96,.9,'Condução quando há espaço.']
  ],
  RMF: [
    ['lowPass',82,90,95,1.08,'Conexão por dentro e entrelinhas.'],['ballControl',84,91,96,1.08,'Primeiro toque.'],
    ['acceleration',85,92,96,1.02,'Progressão e recomposição.'],['balance',84,91,96,.98,'Mudança de direção.'],
    ['stamina',86,93,97,.95,'Trabalho de corredor/meio-lado.'],['dribbling',83,91,96,.9,'Condução quando há espaço.']
  ],
  AMF: [
    ['ballControl',88,94,98,1.28,'Domínio entre linhas.'],['lowPass',87,94,98,1.25,'Último passe e tabelas.'],
    ['tightPossession',87,93,97,1.16,'Proteção em espaços curtos.'],['dribbling',85,92,97,1.05,'Criação individual.'],
    ['balance',85,92,97,1.0,'Giro sob contato.'],['acceleration',82,90,95,.92,'Primeiros metros após receber.']
  ],
  SS: [
    ['offensiveAwareness',87,93,97,1.16,'Movimento entre linhas e ataque ao espaço.'],['ballControl',88,94,98,1.2,'Recepção curta.'],
    ['dribbling',87,94,98,1.14,'Condução e 1x1.'],['acceleration',88,94,98,1.18,'Explosão em ruptura curta.'],
    ['balance',87,94,98,1.14,'Resposta em contato.'],['lowPass',82,90,95,.92,'Tabelas e assistência.'],['finishing',81,89,95,.84,'Conclusão das infiltrações.']
  ],
  CF: [
    ['offensiveAwareness',90,95,99,1.4,'Ataque ao espaço e posicionamento.'],['finishing',88,94,98,1.38,'Conversão das chances.'],
    ['acceleration',86,92,96,1.1,'Separação do marcador.'],['speed',84,91,95,.95,'Profundidade em transição.'],
    ['balance',80,89,95,.82,'Finalização sob contato.'],['physicalContact',76,87,94,.72,'Proteção e duelo quando necessário.']
  ],
  LWF: [
    ['acceleration',88,94,98,1.22,'Explosão no primeiro duelo.'],['dribbling',88,94,98,1.18,'Condução em 1x1.'],
    ['ballControl',87,93,97,1.08,'Primeiro toque.'],['balance',86,93,97,1.05,'Mudança de direção.'],
    ['speed',86,93,97,1.0,'Ataque ao espaço.'],['finishing',80,89,95,.8,'Conclusão por dentro.']
  ],
  RWF: [
    ['acceleration',88,94,98,1.22,'Explosão no primeiro duelo.'],['dribbling',88,94,98,1.18,'Condução em 1x1.'],
    ['ballControl',87,93,97,1.08,'Primeiro toque.'],['balance',86,93,97,1.05,'Mudança de direção.'],
    ['speed',86,93,97,1.0,'Ataque ao espaço.'],['finishing',80,89,95,.8,'Conclusão por dentro.']
  ]
};

const ATTRIBUTE_TO_TRAINING: Partial<Record<AttributeKey, TrainingKey>> = {
  finishing:'shooting', ballControl:'dribbling', dribbling:'dribbling', tightPossession:'dribbling',
  offensiveAwareness:'dexterity', acceleration:'dexterity', balance:'dexterity', speed:'lowerBodyStrength', stamina:'lowerBodyStrength',
  physicalContact:'aerialStrength', jump:'aerialStrength', heading:'aerialStrength', lowPass:'passing', loftedPass:'passing',
  defensiveAwareness:'defending', defensiveEngagement:'defending', tackling:'defending', aggression:'defending',
  goalkeeperAwareness:'gk1', goalkeeperCatching:'gk1', goalkeeperParrying:'gk2', goalkeeperReflexes:'gk2', goalkeeperReach:'gk3'
};

function normalize(text: string | null | undefined) {
  return (text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}

function styleAdjustments(result: AnalysisResult): Partial<Record<AttributeKey, { ideal?: number; ceiling?: number; weight?: number }>> {
  const s = normalize(result.parsed.offensivePlaystyle ?? result.parsed.playstyle);
  const out: Partial<Record<AttributeKey,{ideal?:number;ceiling?:number;weight?:number}>> = {};
  const add=(key:AttributeKey, ideal:number, weight:number, ceiling?:number)=>{out[key]={ideal,weight,ceiling};};
  if(/artilheiro/.test(s)){add('offensiveAwareness',96,1.55,99);add('finishing',95,1.5,99);add('acceleration',93,1.28,97);}
  if(/homem de area/.test(s)){add('offensiveAwareness',96,1.55,99);add('finishing',95,1.5,99);add('physicalContact',90,1.02,96);add('heading',91,.9,96);add('jump',91,.9,96);}
  if(/pivo|atacante pivo/.test(s)){add('physicalContact',92,1.32,97);add('ballControl',90,1.12,95);add('lowPass',86,.98,92);add('offensiveAwareness',93,1.2,97);}
  if(/armador criativo/.test(s)){add('ballControl',95,1.38,99);add('lowPass',94,1.34,98);add('tightPossession',94,1.28,98);add('balance',93,1.14,97);}
  if(/primeiro volante/.test(s)){add('defensiveAwareness',96,1.62,99);add('defensiveEngagement',95,1.48,99);add('tackling',94,1.38,98);add('physicalContact',91,1.12,96);}
  if(/destruidor/.test(s)){add('defensiveEngagement',95,1.5,99);add('aggression',94,1.32,98);add('acceleration',89,1.05,94);add('speed',90,1.02,95);add('physicalContact',92,1.15,97);}
  if(/orquestrador/.test(s)){add('lowPass',94,1.48,98);add('ballControl',92,1.22,97);add('tightPossession',91,1.1,96);}
  if(/meia versatil/.test(s)){add('stamina',95,1.38,99);add('lowPass',91,1.08,96);add('acceleration',90,1.02,95);add('defensiveEngagement',88,.9,94);}
  if(/jogador de infiltracao/.test(s)){add('offensiveAwareness',94,1.35,98);add('acceleration',94,1.32,98);add('balance',92,1.08,97);add('finishing',90,1.0,96);}
  if(/defensor criativo/.test(s)){add('defensiveAwareness',97,1.62,100);add('tackling',94,1.32,98);add('lowPass',84,.7,91);}
  if(/lateral defensivo/.test(s)){add('defensiveAwareness',92,1.34,97);add('tackling',90,1.18,96);add('speed',92,1.1,96);}
  if(/lateral ofensivo|lateral atacante|ala produtivo|lateral movel/.test(s)){add('speed',94,1.3,98);add('acceleration',93,1.25,98);add('stamina',95,1.22,99);add('lowPass',87,.86,93);}
  if(/goleiro ofensivo/.test(s)){add('goalkeeperAwareness',96,1.5,99);add('goalkeeperReflexes',96,1.5,99);add('goalkeeperReach',95,1.28,99);}
  if(/goleiro defensivo/.test(s)){add('goalkeeperAwareness',97,1.55,100);add('goalkeeperCatching',94,1.1,98);add('goalkeeperReach',96,1.3,99);}
  return out;
}

function managerBias(style: string): Partial<Record<TrainingKey,number>> {
  if(style==='POSSE_DE_BOLA') return {passing:.26,dribbling:.18,dexterity:.14};
  if(style==='CONTRA_ATAQUE_RAPIDO') return {dexterity:.28,lowerBodyStrength:.22,passing:.1};
  if(style==='CONTRA_ATAQUE') return {defending:.16,lowerBodyStrength:.18,passing:.14,dexterity:.1};
  if(style==='POR_FORA') return {lowerBodyStrength:.18,passing:.16,dribbling:.12};
  if(style==='PASSE_LONGO') return {passing:.2,lowerBodyStrength:.14,aerialStrength:.12};
  return {};
}

export function buildAttributeMeta2027(result: AnalysisResult): AttributeMeta2027Analysis {
  const style = String(result.tacticalProfile.style ?? 'POSSE_DE_BOLA');
  const seeds = POSITION_TARGETS[result.bestPosition.code];
  const adjustments = styleAdjustments(result);
  const targets = seeds.map(([attribute,min,ideal,ceiling,weight,reason])=>{
    const adj=adjustments[attribute];
    const current=Math.round(Number(result.parsed.attributes[attribute] ?? 0));
    const targetIdeal=Math.max(ideal,adj?.ideal ?? ideal);
    const usefulCeiling=Math.max(ceiling,adj?.ceiling ?? ceiling);
    const finalWeight=Math.max(weight,adj?.weight ?? weight);
    const gap=Math.max(0,targetIdeal-current);
    const priority:AttributeMetaTarget2027['priority']=current>=usefulCeiling?'SATURADA':current>=targetIdeal?'MANTER':gap>=10?'CRITICA':gap>=5?'ALTA':'MEDIA';
    return {attribute,label:ATTRIBUTE_PT[attribute],current,targetMin:min,targetIdeal,usefulCeiling,priority,gap,weight:finalWeight,reason};
  });
  // Inclui atributos adicionados pelo estilo que não estavam na matriz-base da posição.
  for(const [attribute,adj] of Object.entries(adjustments) as Array<[AttributeKey,{ideal?:number;ceiling?:number;weight?:number}]>){
    if(targets.some((t)=>t.attribute===attribute)) continue;
    const current=Math.round(Number(result.parsed.attributes[attribute] ?? 0));
    const targetIdeal=adj.ideal ?? 88; const usefulCeiling=adj.ceiling ?? Math.min(99,targetIdeal+5); const gap=Math.max(0,targetIdeal-current);
    targets.push({attribute,label:ATTRIBUTE_PT[attribute],current,targetMin:Math.max(70,targetIdeal-6),targetIdeal,usefulCeiling,priority:current>=usefulCeiling?'SATURADA':current>=targetIdeal?'MANTER':gap>=10?'CRITICA':gap>=5?'ALTA':'MEDIA',gap,weight:adj.weight ?? 1,reason:'Prioridade adicionada pelo estilo de jogo desta carta.'});
  }
  targets.sort((a,b)=>{
    const rank={CRITICA:5,ALTA:4,MEDIA:3,MANTER:2,SATURADA:1};
    return rank[b.priority]-rank[a.priority] || (b.gap*b.weight)-(a.gap*a.weight) || b.weight-a.weight;
  });
  const trainingBias:Partial<Record<TrainingKey,number>>={...managerBias(style)};
  for(const target of targets){
    const training=ATTRIBUTE_TO_TRAINING[target.attribute]; if(!training) continue;
    const deficit=target.current>=target.usefulCeiling?-0.18:target.current>=target.targetIdeal?-0.05:Math.min(.42,(target.gap/20)*.34+.08)*target.weight;
    trainingBias[training]=Number(trainingBias[training] ?? 0)+deficit;
  }
  const playerPlaystyle=result.parsed.offensivePlaystyle ?? result.parsed.playstyle ?? null;
  const topPriorities=targets.filter((t)=>t.priority==='CRITICA'||t.priority==='ALTA'||t.priority==='MEDIA').slice(0,6);
  const stopSpending=targets.filter((t)=>t.priority==='SATURADA'||t.priority==='MANTER').sort((a,b)=>b.current-a.current).slice(0,5);
  return {
    engineVersion:ATTRIBUTE_META_2027_V600_VERSION,position:result.bestPosition.code,positionLabel:POSITION_PT[result.bestPosition.code],playerPlaystyle,
    teamPlaystyle:style,targets,topPriorities,stopSpending,trainingBias,
    dnaRule:'O estilo do técnico ajusta o contexto, mas nunca pode apagar o DNA principal da carta. Ao atingir o teto útil, o próximo ponto perde prioridade para outro atributo com maior ganho marginal.',
    summary:`${POSITION_PT[result.bestPosition.code]} • ${playerPlaystyle ?? 'sem estilo confirmado'}: ${topPriorities.length ? `priorize ${topPriorities.slice(0,3).map((t)=>t.label).join(', ')}` : 'mantenha a base atual'}; atributos no teto útil deixam de receber investimento automático.`
  };
}

export function getAttributeMetaTrainingBias(result: AnalysisResult): Partial<Record<TrainingKey,number>> {
  return buildAttributeMeta2027(result).trainingBias;
}
