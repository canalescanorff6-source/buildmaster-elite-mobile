
import type { AnalysisResult } from './analyzerDomain';
import { buildV600LiveCatalogSnapshot } from './efootballV600LiveCatalog';
import { MANAGERS_V600_R11 } from './managersV600R11';
export const LIVE_EVOLUTION_V600_R11_VERSION='40.80-r11-live-evolution' as const;
export type Evidence='OFICIAL'|'OBSERVADO'|'PROVISORIO';
export type LiveEvolutionV600R11={
 engineVersion:typeof LIVE_EVOLUTION_V600_R11_VERSION;
 baselineVersion:'6.0.0';
 weeklyReady:true;
 playerStyles:{offensive:string|null;defensive:string|null;defensiveEvidence:Evidence};
 catalog:{teamPlaystyles:number;managerSeeds:number;unknownFields:string[];safeToWeight:boolean};
 rules:string[];
};
export function buildLiveEvolutionV600R11(r:AnalysisResult):LiveEvolutionV600R11{
 const c=buildV600LiveCatalogSnapshot();
 const offensive=r.parsed.offensivePlaystyle??r.parsed.playstyle??null;
 const defensive=r.parsed.defensivePlaystyle??null;
 const confirmed=Boolean(r.parsed.defensivePlaystyleConfirmed);
 const unknown:string[]=[];
 if(defensive&&!confirmed) unknown.push(`Estilo defensivo novo: ${defensive}`);
 const safeToWeight=!unknown.length;
 return {engineVersion:LIVE_EVOLUTION_V600_R11_VERSION,baselineVersion:'6.0.0',weeklyReady:true,
 playerStyles:{offensive,defensive,defensiveEvidence:defensive?(confirmed?'OFICIAL':'OBSERVADO'):'PROVISORIO'},
 catalog:{teamPlaystyles:c.teamPlaystyles,managerSeeds:MANAGERS_V600_R11.length,unknownFields:unknown,safeToWeight},
 rules:[
 'Campo novo lido pelo OCR é preservado; nunca é apagado só porque o catálogo local ainda não conhece o nome.',
 'Dado novo observado não altera pesos da ficha até confirmação; isso evita ensinar meta falso ao motor.',
 'Formação Fluída e estilo do jogador são tratados separadamente: mudar a posição entre fases não troca automaticamente o estilo da carta.',
 'Técnicos v6.0 podem ter duas Combinações; cada uma deve validar posição e estilo dos dois jogadores envolvidos.',
 'Todos por Um é tratado como estilo coletivo próprio, com passe curto, apoio próximo e compactação no lado da bola.'
 ]};
}
export function applyLiveEvolutionV600R11(r:AnalysisResult):AnalysisResult{
 const a=buildLiveEvolutionV600R11(r);
 return {...r,liveEvolutionV600R11:a,recommendationExplanation:[...a.rules,...r.recommendationExplanation].filter((x,i,arr)=>arr.indexOf(x)===i).slice(0,56)};
}
