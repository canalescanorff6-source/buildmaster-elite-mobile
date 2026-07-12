import type { AnalysisResult, TacticalFormation, TacticalStyle } from './analyzer';
import { buildEliteTeamReport, type EliteLineupPick } from './teamOptimizer';
import { buildSquadChemistryReport } from './squadChemistry';

export type AssistedLineupOption = {
  id: 'usuario' | 'equilibrada' | 'especialista';
  title: string;
  subtitle: string;
  formation: TacticalFormation;
  style: TacticalStyle;
  score: number;
  chemistry: number;
  styleFit: number;
  complete: boolean;
  lineup: EliteLineupPick[];
  changes: string[];
  strengths: string[];
  risks: string[];
  reason: string;
  decisionNote: string;
};

export type AssistedLineupReport = {
  playerCount: number;
  generatedCount: number;
  options: AssistedLineupOption[];
  recommendation: string;
  warning: string | null;
};

const FORMATIONS: Exclude<TacticalFormation, 'AUTO'>[] = ['4-2-2-2','4-3-3','4-1-2-3','4-2-1-3','4-2-3-1','4-3-1-2','4-1-3-2','4-4-2','4-1-4-1','3-2-4-1','3-4-3','3-5-2','5-3-2','5-2-3'];
const STYLES: Exclude<TacticalStyle, 'AUTO'>[] = ['POSSE_DE_BOLA','CONTRA_ATAQUE','CONTRA_ATAQUE_RAPIDO','POR_FORA','PASSE_LONGO'];

const styleLabel: Record<TacticalStyle, string> = {
  AUTO: 'Automático inteligente', POSSE_DE_BOLA: 'Posse de bola', CONTRA_ATAQUE: 'Contra-ataque longo', CONTRA_ATAQUE_RAPIDO: 'Contra-ataque rápido', POR_FORA: 'Por fora', PASSE_LONGO: 'Passe longo'
};

function uniqueKey(formation: TacticalFormation, style: TacticalStyle) {
  return `${formation}|${style}`;
}

function buildCandidate(results: AnalysisResult[], formation: TacticalFormation, style: TacticalStyle) {
  const elite = buildEliteTeamReport(results, formation, style);
  const chemistry = buildSquadChemistryReport(results, formation, style);
  if (!elite || !chemistry) return null;
  const completeness = elite.lineup.filter((pick) => pick.playerName).length;
  const improvised = elite.lineup.filter((pick) => pick.warning).length;
  const combined = Math.round(elite.globalScore * .48 + chemistry.globalScore * .34 + chemistry.styleFit * .18 - improvised * 1.5 - Math.max(0, 11 - completeness) * 3);
  return { formation: elite.bestFormation, style: elite.bestStyle, elite, chemistry, combined, completeness, improvised };
}

function changesFrom(base: EliteLineupPick[] | null, next: EliteLineupPick[]) {
  if (!base) return ['Primeira escalação sugerida a partir dos jogadores salvos no Cofre.'];
  const baseBySlot = new Map(base.map((pick) => [pick.slot.label, pick.playerName]));
  const changes = next
    .filter((pick) => baseBySlot.get(pick.slot.label) !== pick.playerName)
    .slice(0, 5)
    .map((pick) => `${pick.slot.label}: ${pick.playerName ?? 'vaga aberta'} entra como melhor encaixe desta opção.`);
  return changes.length ? changes : ['Mantém a maior parte da base e altera apenas o comportamento coletivo.'];
}

export function buildAssistedLineupReport(results: AnalysisResult[], formation: TacticalFormation, style: TacticalStyle): AssistedLineupReport | null {
  if (!results.length) return null;
  const requestedFormation = formation === 'AUTO' ? '4-2-2-2' : formation;
  const requestedStyle = style === 'AUTO' ? 'CONTRA_ATAQUE_RAPIDO' : style;
  const user = buildCandidate(results, requestedFormation, requestedStyle);

  const pool = new Map<string, NonNullable<ReturnType<typeof buildCandidate>>>();
  for (const candidateFormation of FORMATIONS) {
    for (const candidateStyle of STYLES) {
      const candidate = buildCandidate(results, candidateFormation, candidateStyle);
      if (candidate) pool.set(uniqueKey(candidate.formation, candidate.style), candidate);
    }
  }
  const ranked = [...pool.values()].sort((a,b) => b.combined - a.combined);
  const balanced = ranked.find((item) => !user || uniqueKey(item.formation,item.style) !== uniqueKey(user.formation,user.style)) ?? ranked[0];
  const specialist = ranked.find((item) => balanced && uniqueKey(item.formation,item.style) !== uniqueKey(balanced.formation,balanced.style) && item.style !== balanced.style)
    ?? ranked.find((item) => balanced && uniqueKey(item.formation,item.style) !== uniqueKey(balanced.formation,balanced.style))
    ?? ranked[1];

  const selected = [user, balanced, specialist].filter(Boolean) as NonNullable<ReturnType<typeof buildCandidate>>[];
  const deduped = selected.filter((item,index,array) => array.findIndex((other) => uniqueKey(other.formation,other.style) === uniqueKey(item.formation,item.style)) === index);
  const baseLineup = user?.elite.lineup ?? null;
  const ids: AssistedLineupOption['id'][] = ['usuario','equilibrada','especialista'];
  const titles = ['Sua escolha assistida','Opção mais equilibrada','Alternativa especialista'];
  const subtitles = ['Respeita sua formação e seu estilo atuais.','Busca o melhor conjunto entre setores, funções e entrosamento.','Muda a proposta para explorar outra força do elenco.'];

  const options = deduped.slice(0,3).map((item,index): AssistedLineupOption => ({
    id: ids[index], title: titles[index], subtitle: subtitles[index], formation: item.formation, style: item.style,
    score: item.combined, chemistry: item.chemistry.globalScore, styleFit: item.chemistry.styleFit, complete: item.completeness === 11,
    lineup: item.elite.lineup, changes: changesFrom(baseLineup, item.elite.lineup),
    strengths: [...item.chemistry.strengths, ...item.elite.attackingPlan].slice(0,3),
    risks: [...item.chemistry.weaknesses, ...item.elite.tacticalAlerts].slice(0,3),
    reason: `${item.formation} com ${styleLabel[item.style]} alcançou ${item.combined}/100 após comparar encaixe individual, entrosamento, cobertura de funções e compatibilidade com o estilo.`,
    decisionNote: index === 0 ? 'O app não alterou sua decisão; esta opção apenas organiza os melhores encaixes dentro dela.' : 'Sugestão opcional: você pode usar inteira, trocar jogadores manualmente ou ignorar.'
  }));

  return {
    playerCount: results.length,
    generatedCount: pool.size,
    options,
    recommendation: options.length > 1 ? `A opção “${options[1].title}” obteve a melhor combinação automática, mas a escolha final continua sendo sua.` : 'Salve mais jogadores para gerar alternativas realmente diferentes.',
    warning: results.length < 11 ? `Há apenas ${results.length} jogador(es) salvo(s). As vagas restantes serão sinalizadas e nenhuma escalação incompleta será tratada como definitiva.` : null
  };
}
