import type { AnalysisResult, PositionCode, TrainingKey } from './analyzer';

export type SpecialSkillUse = {
  name: string;
  source: 'habilidade especial' | 'habilidade oficial' | 'ímpeto';
  activation: 'muito aproveitada' | 'bem aproveitada' | 'aproveitamento parcial' | 'pouco aproveitada';
  score: number;
  helpfulAttributes: string[];
  trainingGroups: TrainingKey[];
  bestUse: string;
  warning?: string;
};

const SPECIAL_RULES: Record<string, { positions: PositionCode[]; attrs: string[]; groups: TrainingKey[]; use: string }> = {
  'Blitz Curler': { positions: ['LWF','RWF','SS','AMF','CF'], attrs: ['Curva','Finalização','Força do chute','Controle de bola'], groups: ['shooting','dribbling','dexterity'], use: 'receber de frente ou cortar para o pé dominante antes da finalização colocada' },
  'Esticada de Perna': { positions: ['CB','DMF','LB','RB','CMF'], attrs: ['Desarme','Engajamento defensivo','Agressividade','Contato físico'], groups: ['defending','lowerBodyStrength'], use: 'fechar linha de passe e disputar sem quebrar a estrutura defensiva' },
  'Sombra veloz': { positions: ['LWF','RWF','SS','CF','LMF','RMF'], attrs: ['Velocidade','Aceleração','Resistência'], groups: ['dexterity','lowerBodyStrength'], use: 'atacar espaço com mudança rápida de direção' },
  'Momentum Dribbling': { positions: ['LWF','RWF','SS','AMF'], attrs: ['Drible','Condução precisa','Equilíbrio','Aceleração'], groups: ['dribbling','dexterity'], use: 'duelo curto e condução em velocidade' },
  'Phenomenal Finishing': { positions: ['CF','SS','LWF','RWF','AMF'], attrs: ['Finalização','Força do chute','Equilíbrio'], groups: ['shooting','dexterity'], use: 'finalizar mesmo em postura corporal desfavorável' },
  'Phenomenal Pass': { positions: ['AMF','CMF','DMF','SS'], attrs: ['Passe rasteiro','Passe alto','Controle de bola'], groups: ['passing','dribbling'], use: 'executar passes difíceis sob pressão' },
  'Game-changing Pass': { positions: ['AMF','CMF','DMF','SS'], attrs: ['Passe rasteiro','Passe alto','Resistência'], groups: ['passing','lowerBodyStrength'], use: 'aumentar criação em momentos decisivos' },
  'Fortress': { positions: ['CB','DMF','LB','RB','GK'], attrs: ['Consciência defensiva','Desarme','Contato físico'], groups: ['defending','aerialStrength'], use: 'proteger a área e sustentar vantagem' },
  'Edged Crossing': { positions: ['LWF','RWF','LMF','RMF','LB','RB'], attrs: ['Passe alto','Curva','Força do chute'], groups: ['passing','lowerBodyStrength'], use: 'cruzar com trajetória rápida e agressiva' },
  'Bullet Header': { positions: ['CF','SS','CB'], attrs: ['Cabeceio','Impulsão','Contato físico'], groups: ['aerialStrength','shooting'], use: 'atacar cruzamentos e bolas paradas' }
};

export function buildSpecialSkillUsage(result: AnalysisResult): { items: SpecialSkillUse[]; overall: number; summary: string[] } {
  const names = Array.from(new Set([...(result.parsed.specialSkills ?? []), ...(result.parsed.nativeSkills ?? []), ...(result.parsed.impetos ?? []).map((item: any) => typeof item === 'string' ? item : item?.name).filter(Boolean), result.parsed.specialTag ?? ''].filter(Boolean)));
  const items = names.map((name) => {
    const rule = SPECIAL_RULES[name];
    const owned = result.specialSkillsAnalysis.usefulOwned.find((item) => item.name === name);
    const fits = rule ? rule.positions.includes(result.bestPosition.code) : Boolean(owned);
    const score = Math.max(30, Math.min(100, (rule ? (fits ? 88 : 58) : (owned?.score ?? 66)) + Math.round((result.advancedTacticalFunction.compatibilityScore - 70) * .18)));
    const activation: SpecialSkillUse['activation'] = score >= 88 ? 'muito aproveitada' : score >= 74 ? 'bem aproveitada' : score >= 58 ? 'aproveitamento parcial' : 'pouco aproveitada';
    return {
      name,
      source: (result.parsed.specialSkills?.includes(name) || name === result.parsed.specialTag ? 'habilidade especial' : result.parsed.nativeSkills.includes(name) ? 'habilidade oficial' : 'ímpeto') as SpecialSkillUse['source'],
      activation,
      score,
      helpfulAttributes: rule?.attrs ?? ['Atributos ligados à posição escolhida'],
      trainingGroups: rule?.groups ?? [],
      bestUse: rule?.use ?? `usar na posição ${result.bestPosition.label}, respeitando o contexto da carta`,
      warning: rule && !fits ? `A posição escolhida continua válida, mas ${name} tende a render mais nas posições: ${rule.positions.join(', ')}.` : undefined
    };
  }).sort((a,b)=>b.score-a.score);
  const overall = items.length ? Math.round(items.reduce((sum,item)=>sum+item.score,0)/items.length) : 0;
  return { items, overall, summary: items.length ? [`${items.filter(i=>i.score>=74).length} habilidade(s) bem aproveitada(s).`, `${items.filter(i=>i.warning).length} exige(m) atenção na posição escolhida.`] : ['Nenhuma habilidade especial foi confirmada na carta.'] };
}

export type TrainingDrill = { id: string; area: 'defesa'|'ataque'; title: string; objective: string; duration: number; repetitions: number; levels: string[]; commonError: string; correction: string; metrics: string[] };
export const TRAINING_DRILLS: TrainingDrill[] = [
  { id:'def-line', area:'defesa', title:'Não quebrar a linha defensiva', objective:'Defender primeiro com VOL/MLG e preservar os zagueiros.', duration:8, repetitions:10, levels:['iniciante','intermediário','avançado'], commonError:'Puxar o zagueiro cedo.', correction:'Feche a linha de passe com o volante antes de pressionar.', metrics:['botes errados','zagueiros puxados','interceptações'] },
  { id:'def-delay', area:'defesa', title:'Cercar sem dar bote', objective:'Atrasar a jogada até chegar cobertura.', duration:7, repetitions:12, levels:['iniciante','intermediário','avançado'], commonError:'Acelerar e dar bote de frente.', correction:'Acompanhe em diagonal e ataque a bola apenas no toque longo.', metrics:['botes vencidos','faltas','recuperações'] },
  { id:'def-cross', area:'defesa', title:'Defesa de cruzamentos', objective:'Proteger primeiro e segundo poste e disputar a sobra.', duration:10, repetitions:12, levels:['intermediário','avançado'], commonError:'Olhar apenas para a bola.', correction:'Selecione o defensor da zona de queda e mantenha outro na sobra.', metrics:['cruzamentos cortados','segundas bolas','gols sofridos'] },
  { id:'def-switch', area:'defesa', title:'Troca rápida de marcador', objective:'Selecionar o jogador mais próximo da ameaça sem desmontar o bloco.', duration:6, repetitions:15, levels:['iniciante','intermediário'], commonError:'Trocar repetidamente sem controlar ninguém.', correction:'Antecipe a próxima linha de passe antes da troca.', metrics:['trocas erradas','interceptações','atrasos'] },
  { id:'atk-one-touch', area:'ataque', title:'Passe de primeira e triangulação', objective:'Progredir com dois toques ou menos.', duration:8, repetitions:15, levels:['iniciante','intermediário','avançado'], commonError:'Segurar a bola até fechar a linha.', correction:'Observe a próxima opção antes de receber.', metrics:['passes atrasados','tabelas completas','perdas'] },
  { id:'atk-depth', area:'ataque', title:'Passe em profundidade', objective:'Acionar a corrida no momento correto.', duration:8, repetitions:12, levels:['intermediário','avançado'], commonError:'Passar quando o atacante já está impedido.', correction:'Solte no primeiro passo da corrida e varie força/direção.', metrics:['passes certos','impedimentos','chances criadas'] },
  { id:'atk-finish', area:'ataque', title:'Finalização equilibrada', objective:'Finalizar após orientar corpo e pé dominante.', duration:10, repetitions:15, levels:['iniciante','intermediário','avançado'], commonError:'Chutar desequilibrado ou sem preparar o corpo.', correction:'Reduza um toque, abra o ângulo e escolha o tipo de chute.', metrics:['finalizações no alvo','gols','chutes bloqueados'] },
  { id:'atk-wing', area:'ataque', title:'Ataque pelos corredores', objective:'Criar superioridade com ponta, lateral e meia.', duration:9, repetitions:10, levels:['intermediário','avançado'], commonError:'Subir os dois jogadores ao mesmo tempo sem cobertura.', correction:'Alterne apoio, profundidade e passe por dentro.', metrics:['cruzamentos úteis','inversões','contra-ataques sofridos'] }
];

export const ERROR_OPTIONS = ['passei tarde','dei bote errado','puxei o zagueiro','troquei o marcador errado','finalizei sem equilíbrio','forcei passe','fiquei previsível','perdi a bola na saída','usei pouco as laterais','pressionei demais','demorei para soltar a bola'] as const;

export function buildWeeklyPlan(errors: string[], sessionsPerWeek = 3) {
  const defense = errors.filter(e=>/bote|zagueiro|marcador|pressionei|saída/.test(e)).length;
  const attack = errors.length-defense;
  const preferred = [...TRAINING_DRILLS].sort((a,b)=>((b.area==='defesa'?defense:attack)-(a.area==='defesa'?defense:attack)) || a.duration-b.duration);
  return Array.from({length:Math.max(2,Math.min(5,sessionsPerWeek))},(_,index)=>({ day:index+1, drills:[preferred[index%preferred.length], preferred[(index+2)%preferred.length]], review:index===sessionsPerWeek-1?'Revisar os 3 erros mais repetidos e repetir o exercício de menor nota.':'Registrar acertos e erros após cada bloco.' }));
}

export type DelaySymptom = 'passe atrasado'|'jogador demora a virar'|'chute não responde'|'troca lenta'|'comando duplo'|'imagem trava'|'fica pesado depois de minutos';
export type DelayContext = { fps: 30|60; graphics:'baixa'|'média'|'alta'; wifi:'2.4 GHz'|'5 GHz'|'dados móveis'; signal:'fraco'|'médio'|'forte'; temperature:'frio'|'morno'|'quente'; backgroundApps:boolean; batterySaver:boolean; symptoms:DelaySymptom[] };
export function diagnoseDelay(ctx: DelayContext) {
  const scores={rede:0,desempenho:0,aquecimento:0,configuracao:0,comando:0,servidor:0};
  if(ctx.signal==='fraco') scores.rede+=35; if(ctx.wifi!=='5 GHz') scores.rede+=18; if(ctx.temperature==='quente') scores.aquecimento+=40; if(ctx.graphics==='alta') scores.desempenho+=22; if(ctx.fps===30) scores.configuracao+=20; if(ctx.backgroundApps) scores.desempenho+=15; if(ctx.batterySaver) scores.configuracao+=18;
  for(const symptom of ctx.symptoms){ if(/imagem|pesado/.test(symptom)) scores.desempenho+=20; if(/comando duplo/.test(symptom)) scores.comando+=24; if(/passe|chute|troca/.test(symptom)){scores.rede+=8;scores.servidor+=8;} if(/minutos/.test(symptom)) scores.aquecimento+=18; }
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  const recommendations=[ctx.fps===30?'Use 60 FPS se o aparelho sustentar sem aquecer; caso contrário mantenha 30 FPS estáveis.':'Priorize FPS estável; reduza gráficos se houver quedas.',ctx.graphics!=='baixa'?'Teste qualidade gráfica baixa para diminuir carga e aquecimento.':'Gráficos baixos já favorecem resposta.',ctx.wifi!=='5 GHz'?'Use Wi‑Fi 5 GHz próximo do roteador quando possível.':'Mantenha o 5 GHz com sinal forte.',ctx.batterySaver?'Desative economia de bateria durante o jogo.':'Economia de bateria já está desativada.',ctx.backgroundApps?'Feche gravação, download e apps pesados em segundo plano.':'Poucos apps em segundo plano: bom.', 'Nenhuma configuração elimina atraso causado por servidor, rota ou conexão do adversário.'];
  return {scores,primary:ranked[0][0],ranked,recommendations};
}

export function summarizeTapSamples(samples:number[]){ if(samples.length<2) return {average:0,variation:0,label:'aguardando',note:'Faça pelo menos 5 toques.'}; const gaps=samples.slice(1).map((v,i)=>v-samples[i]); const average=Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length); const mean=average; const variation=Math.round(Math.sqrt(gaps.reduce((s,v)=>s+(v-mean)**2,0)/gaps.length)); return {average,variation,label:variation<=35?'estável':variation<=80?'variação média':'variação alta',note:variation>80?'Possível instabilidade de toque, queda de FPS ou aquecimento.':'Ritmo de toque consistente no teste local.'}; }
