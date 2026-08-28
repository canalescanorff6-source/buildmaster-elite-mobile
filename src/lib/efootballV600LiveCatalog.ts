import { CANONICAL_PLAYER_PLAYSTYLES } from './efootball2026Playstyles';
import { CONFIRMED_V600_DEFENSIVE_PLAYSTYLES } from './efootballV600Playstyles';
import { effectiveAdditionalSkillNamesV3770, effectiveSpecialSkillNamesV3770 } from './remoteCatalogV3770';
import { listProvisionalSpecialSkillsV4070 } from './provisionalSpecialSkillCatalogV4070';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES, SPECIAL_SKILL_NAMES } from '../modules/analysis/analyzerCatalog';

export const EFOOTBALL_V600_LIVE_CATALOG_VERSION = '40.80-r8-v600-live-catalog' as const;

export type V600TeamPlaystyleId =
  | 'POSSE_DE_BOLA'
  | 'CONTRA_ATAQUE_RAPIDO'
  | 'CONTRA_ATAQUE'
  | 'POR_FORA'
  | 'PASSE_LONGO'
  | 'SOBREPOSICAO';

export type V600TeamPlaystyleEntry = {
  id: V600TeamPlaystyleId;
  label: string;
  attack: string;
  defence: string;
  risk: string;
  v600New?: boolean;
};

export const V600_TEAM_PLAYSTYLES: readonly V600TeamPlaystyleEntry[] = [
  { id:'POSSE_DE_BOLA', label:'Posse de bola', attack:'Aproxima apoios e prioriza circulação curta.', defence:'Reorganiza o bloco depois da perda.', risk:'Pode sofrer transição se muitos jogadores ficarem à frente da bola.' },
  { id:'CONTRA_ATAQUE_RAPIDO', label:'Contra-ataque rápido', attack:'Acelera imediatamente após recuperar.', defence:'Pressiona e prepara saída vertical.', risk:'Exige timing de pressão e cobertura para não abrir a linha.' },
  { id:'CONTRA_ATAQUE', label:'Contra-ataque', attack:'Sai com segurança e procura profundidade.', defence:'Protege mais o bloco antes da transição.', risk:'Pode ceder território se a saída estiver isolada.' },
  { id:'POR_FORA', label:'Por fora', attack:'Dá amplitude e explora corredores.', defence:'Precisa recompor corredores e proteger inversões.', risk:'Laterais/alas expostos podem criar 2x1 contra sua defesa.' },
  { id:'PASSE_LONGO', label:'Bola longa / passe longo', attack:'Procura progressão direta e segunda bola.', defence:'Mantém referências para saída direta.', risk:'Perder a primeira disputa pode devolver a posse sem bloco montado.' },
  { id:'SOBREPOSICAO', label:'Sobreposição', attack:'Concentra jogadores no lado da bola para superioridade e passes curtos.', defence:'Compacta no lado da bola e permite pressão mais alta.', risk:'A inversão rápida para o lado oposto exige cobertura disciplinada.', v600New:true }
] as const;

export type V600SkillCatalogEntry = {
  name: string;
  kind: 'ADICIONAL_PADRAO' | 'ESPECIAL_RECONHECIDA' | 'REMOTA_ATIVA' | 'PROVISORIA';
  weightAllowed: boolean;
};

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((item)=>item.trim()).filter(Boolean)));
}

export function buildV600LiveCatalogSnapshot() {
  let effectiveAdditional = [...OFFICIAL_ADDITIONAL_SKILL_NAMES] as string[];
  let effectiveSpecial = [...SPECIAL_SKILL_NAMES];
  let provisional: ReturnType<typeof listProvisionalSpecialSkillsV4070> = [];
  try {
    effectiveAdditional = effectiveAdditionalSkillNamesV3770(OFFICIAL_ADDITIONAL_SKILL_NAMES);
    effectiveSpecial = effectiveSpecialSkillNamesV3770(SPECIAL_SKILL_NAMES);
    provisional = listProvisionalSpecialSkillsV4070();
  } catch {
    // SSR/testes sem storage: catálogo local segue funcional.
  }

  const localAdditionalSet = new Set<string>(OFFICIAL_ADDITIONAL_SKILL_NAMES);
  const localSpecialSet = new Set<string>(SPECIAL_SKILL_NAMES);
  const entries: V600SkillCatalogEntry[] = [
    ...OFFICIAL_ADDITIONAL_SKILL_NAMES.map((name)=>({ name, kind:'ADICIONAL_PADRAO' as const, weightAllowed:true })),
    ...SPECIAL_SKILL_NAMES.map((name)=>({ name, kind:'ESPECIAL_RECONHECIDA' as const, weightAllowed:true })),
    ...effectiveAdditional.filter((name)=>!localAdditionalSet.has(name)).map((name)=>({ name, kind:'REMOTA_ATIVA' as const, weightAllowed:true })),
    ...effectiveSpecial.filter((name)=>!localSpecialSet.has(name)).map((name)=>({ name, kind:'REMOTA_ATIVA' as const, weightAllowed:true })),
    ...provisional.map((item)=>({ name:item.name, kind:'PROVISORIA' as const, weightAllowed:item.status === 'confirmed' }))
  ];

  return {
    version:EFOOTBALL_V600_LIVE_CATALOG_VERSION,
    standardAdditionalSkills:OFFICIAL_ADDITIONAL_SKILL_NAMES.length,
    effectiveAdditionalSkills:unique(effectiveAdditional).length,
    recognizedSpecialSkills:SPECIAL_SKILL_NAMES.length,
    effectiveSpecialSkills:unique(effectiveSpecial).length,
    provisionalSpecialSkills:provisional.filter((item)=>item.status === 'provisional').length,
    offensivePlaystyles:CANONICAL_PLAYER_PLAYSTYLES.length,
    offensivePlaystyleNames:[...CANONICAL_PLAYER_PLAYSTYLES],
    confirmedDefensivePlaystyles:CONFIRMED_V600_DEFENSIVE_PLAYSTYLES.length,
    confirmedDefensivePlaystyleNames:[...CONFIRMED_V600_DEFENSIVE_PLAYSTYLES],
    teamPlaystyles:V600_TEAM_PLAYSTYLES.length,
    teamPlaystyleEntries:V600_TEAM_PLAYSTYLES,
    skillEntries:entries,
    safeguards:[
      'Habilidade provisória não recebe peso de gameplay até confirmação.',
      'Estilo defensivo desconhecido é preservado pelo OCR, mas não ganha peso competitivo inventado.',
      'Aliases apontam para uma identidade canônica para bloquear duplicações.'
    ]
  } as const;
}
