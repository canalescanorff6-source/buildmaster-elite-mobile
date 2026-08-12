import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import type { IntegratedPlayerRecord } from '@/modules/core/centralIntelligence';

export const META_FORMATION_STUDIO_VERSION = '40.60.0';
export const META_FORMATION_STORAGE_KEY = 'buildmaster_meta_formation_projects_v3832';

export const META_COACH_STYLES = ['Posse de bola', 'Contra-ataque normal', 'Contra-ataque rápido'] as const;
export type MetaCoachStyle = typeof META_COACH_STYLES[number];

export const META_OBJECTIVES = [
  'jogar pelo centro', 'jogar sem pontas', 'usar dois atacantes', 'controlar a posse', 'tocar rápido',
  'conduzir e tabelar', 'atacar em profundidade', 'pressionar depois da perda', 'proteger o resultado',
  'buscar o resultado', 'formação segura', 'formação equilibrada', 'formação agressiva',
  'proteger o corredor central', 'evitar contra-ataques', 'criar superioridade no meio'
] as const;
export type MetaObjective = typeof META_OBJECTIVES[number];

export const OFFICIAL_PLAYER_STYLES = [
  'Artilheiro', 'Puxa marcação', 'Homem de área', 'Pivô', 'Atacante pivô', 'Armador criativo',
  'Primeiro volante', 'O destruidor', 'Orquestrador', 'Clássico nº 10', 'Jogador de infiltração', 'Meia versátil',
  'Defensor criativo', 'Atacante surpresa', 'Lateral ofensivo', 'Lateral defensivo', 'Lateral atacante',
  'Ala produtivo', 'Lateral móvel', 'Perito em cruzamento', 'Goleiro ofensivo', 'Goleiro defensivo'
] as const;
export type OfficialPlayerStyle = typeof OFFICIAL_PLAYER_STYLES[number];

export type MetaFormationDifficulty = 'Fácil' | 'Intermediária' | 'Avançada';
export type MetaFormationRisk = 'Baixo' | 'Médio' | 'Alto';
export type MetaFormationClassification = 'Meta personalizada' | 'Estrutura competitiva' | 'Formação personalizada' | 'Fora do padrão predefinido';
export type MetaFormationMode = 'rapido' | 'personalizado' | 'inteligente';
export type TacticalArrowKind = 'short-pass' | 'vertical-pass' | 'run' | 'recovery' | 'cover' | 'rotation';

export type MetaFormationSlot = {
  id: string;
  position: string;
  side: 'esquerdo' | 'centro' | 'direito';
  label: string;
  x: number;
  y: number;
  recommendedStyles: OfficialPlayerStyle[];
  alternatives: OfficialPlayerStyle[];
};

export type MetaTacticalArrow = {
  id: string;
  fromSlotId: string;
  toSlotId?: string;
  kind: TacticalArrowKind;
  label: string;
  enabled: boolean;
};

export type MetaFormationScores = {
  attack: number;
  defense: number;
  creation: number;
  transition: number;
  control: number;
  compactness: number;
};

export type MetaFormationDefinition = {
  id: string;
  commercialName: string;
  structure: string;
  style: MetaCoachStyle;
  objectives: MetaObjective[];
  classification: MetaFormationClassification;
  difficulty: MetaFormationDifficulty;
  aggression: number;
  risk: MetaFormationRisk;
  scores: MetaFormationScores;
  slots: MetaFormationSlot[];
  arrows: MetaTacticalArrow[];
  strengths: string[];
  weaknesses: string[];
  startPlay: string[];
  accelerateWhen: string[];
  recycleWhen: string[];
  attackPlan: string[];
  defensePlan: string[];
  protectCenter: string[];
  exploreSpace: string[];
  avoid: string[];
  offensivePrinciples: string[];
  defensivePrinciples: string[];
  successKeys: string[];
  whyItWorks: string;
};

export type MetaFormationSlotAssignment = {
  slotId: string;
  style: OfficialPlayerStyle;
  playerId?: string;
  playerName?: string;
  x?: number;
  y?: number;
};

export type MetaFormationValidation = {
  level: 'recommended' | 'balanced' | 'attention' | 'high-risk';
  title: string;
  notes: Array<{ level: 'positive' | 'warning' | 'critical'; text: string }>;
};

export type MetaFormationProject = {
  id: string;
  name: string;
  formationId: string;
  style: MetaCoachStyle;
  objective: MetaObjective;
  mode: MetaFormationMode;
  assignments: Record<string, MetaFormationSlotAssignment>;
  arrows: MetaTacticalArrow[];
  customTexts: Partial<Record<'passing' | 'construction' | 'accelerate' | 'recycle' | 'attack' | 'defense' | 'protect' | 'chase' | 'success' | 'offensive' | 'defensive' | 'alert' | 'why', string>>;
  appearance: {
    shirt: 'clássica' | 'moderna' | 'minimalista';
    background: 'marinho' | 'grafite' | 'campo';
    intensity: 'suave' | 'equilibrada' | 'forte';
    showNotes: boolean;
    showInstructions: boolean;
    showArrows: boolean;
    userName: string;
    teamName: string;
    logoDataUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
};

const GK_STYLES: OfficialPlayerStyle[] = ['Goleiro ofensivo', 'Goleiro defensivo'];

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

function slot(id: string, position: string, side: MetaFormationSlot['side'], x: number, y: number, recommendedStyles: OfficialPlayerStyle[], alternatives: OfficialPlayerStyle[] = []): MetaFormationSlot {
  return { id, position, side, label: `${position}${side === 'centro' ? '' : ` ${side}`}`, x, y, recommendedStyles, alternatives };
}

function backFour() {
  return [
    slot('LB', 'LE', 'esquerdo', 14, 75, ['Lateral defensivo', 'Perito em cruzamento'], ['Lateral ofensivo']),
    slot('LCB', 'ZAG', 'esquerdo', 37, 80, ['Defensor criativo', 'O destruidor'], ['Atacante surpresa']),
    slot('RCB', 'ZAG', 'direito', 63, 80, ['O destruidor', 'Defensor criativo'], ['Atacante surpresa']),
    slot('RB', 'LD', 'direito', 86, 75, ['Lateral defensivo', 'Perito em cruzamento'], ['Lateral atacante'])
  ];
}

function backThree() {
  return [
    slot('LCB', 'ZAG', 'esquerdo', 24, 80, ['Defensor criativo', 'O destruidor'], ['Atacante surpresa']),
    slot('CB', 'ZAG', 'centro', 50, 84, ['Defensor criativo', 'O destruidor'], ['Atacante surpresa']),
    slot('RCB', 'ZAG', 'direito', 76, 80, ['O destruidor', 'Defensor criativo'], ['Atacante surpresa'])
  ];
}

function backFive() {
  return [
    slot('LWB', 'ALA', 'esquerdo', 8, 69, ['Ala produtivo', 'Perito em cruzamento'], ['Lateral defensivo']),
    slot('LCB', 'ZAG', 'esquerdo', 29, 80, ['Defensor criativo', 'O destruidor'], ['Atacante surpresa']),
    slot('CB', 'ZAG', 'centro', 50, 84, ['Defensor criativo'], ['O destruidor']),
    slot('RCB', 'ZAG', 'direito', 71, 80, ['O destruidor', 'Defensor criativo'], ['Atacante surpresa']),
    slot('RWB', 'ALA', 'direito', 92, 69, ['Ala produtivo', 'Perito em cruzamento'], ['Lateral defensivo'])
  ];
}

function layout(structure: string): MetaFormationSlot[] {
  const gk = slot('GK', 'GOL', 'centro', 50, 94, GK_STYLES);
  switch (structure) {
    case '4-1-2-1-2': return [gk, ...backFour(), slot('DM', 'VOL', 'centro', 50, 65, ['Primeiro volante'], ['Meia versátil']), slot('LCM', 'MLG', 'esquerdo', 34, 53, ['Meia versátil', 'Orquestrador'], ['Jogador de infiltração']), slot('RCM', 'MLG', 'direito', 66, 53, ['Jogador de infiltração', 'Meia versátil'], ['Orquestrador']), slot('AM', 'MAT', 'centro', 50, 38, ['Jogador de infiltração', 'Armador criativo'], ['Clássico nº 10']), slot('LCF', 'CA', 'esquerdo', 38, 18, ['Puxa marcação', 'Pivô'], ['Artilheiro']), slot('RCF', 'CA', 'direito', 62, 18, ['Artilheiro', 'Homem de área'], ['Atacante pivô'])];
    case '4-3-3 com dois SA': return [gk, ...backFour(), slot('DM', 'VOL', 'centro', 50, 64, ['Primeiro volante'], ['Meia versátil']), slot('LCM', 'MLG', 'esquerdo', 34, 51, ['Meia versátil', 'Orquestrador'], ['Jogador de infiltração']), slot('RCM', 'MLG', 'direito', 66, 51, ['Jogador de infiltração', 'Meia versátil'], ['Armador criativo']), slot('LSA', 'SA', 'esquerdo', 31, 28, ['Armador criativo', 'Puxa marcação'], ['Jogador de infiltração']), slot('RSA', 'SA', 'direito', 69, 28, ['Jogador de infiltração', 'Armador criativo'], ['Puxa marcação']), slot('CF', 'CA', 'centro', 50, 13, ['Artilheiro', 'Homem de área'], ['Pivô'])];
    case '4-3-3 com dois CA': return [gk, ...backFour(), slot('DM', 'VOL', 'centro', 50, 64, ['Primeiro volante'], ['Meia versátil']), slot('LCM', 'MLG', 'esquerdo', 32, 50, ['Meia versátil', 'Orquestrador'], ['Jogador de infiltração']), slot('RCM', 'MLG', 'direito', 68, 50, ['Jogador de infiltração', 'Meia versátil'], ['Armador criativo']), slot('AM', 'MAT', 'centro', 50, 34, ['Armador criativo', 'Jogador de infiltração'], ['Clássico nº 10']), slot('LCF', 'CA', 'esquerdo', 38, 15, ['Puxa marcação', 'Pivô'], ['Artilheiro']), slot('RCF', 'CA', 'direito', 62, 15, ['Artilheiro', 'Homem de área'], ['Atacante pivô'])];
    case '4-3-2-1': return [gk, ...backFour(), slot('DM', 'VOL', 'centro', 50, 64, ['Primeiro volante'], ['Meia versátil']), slot('LCM', 'MLG', 'esquerdo', 32, 52, ['Meia versátil', 'Orquestrador'], ['Jogador de infiltração']), slot('RCM', 'MLG', 'direito', 68, 52, ['Jogador de infiltração', 'Meia versátil'], ['Orquestrador']), slot('LAM', 'MAT', 'esquerdo', 39, 34, ['Armador criativo', 'Jogador de infiltração'], ['Clássico nº 10']), slot('RAM', 'MAT', 'direito', 61, 34, ['Jogador de infiltração', 'Armador criativo'], ['Clássico nº 10']), slot('CF', 'CA', 'centro', 50, 14, ['Artilheiro', 'Homem de área'], ['Pivô'])];
    case '4-2-2-2': return [gk, ...backFour(), slot('LDM', 'VOL', 'esquerdo', 39, 62, ['Primeiro volante'], ['Meia versátil']), slot('RDM', 'MLG', 'direito', 61, 62, ['Meia versátil', 'Orquestrador'], ['Jogador de infiltração']), slot('LAM', 'MAT', 'esquerdo', 34, 40, ['Armador criativo', 'Jogador de infiltração'], ['Clássico nº 10']), slot('RAM', 'MAT', 'direito', 66, 40, ['Jogador de infiltração', 'Armador criativo'], ['Clássico nº 10']), slot('LCF', 'CA', 'esquerdo', 39, 17, ['Puxa marcação', 'Pivô'], ['Artilheiro']), slot('RCF', 'CA', 'direito', 61, 17, ['Artilheiro', 'Homem de área'], ['Atacante pivô'])];
    case '4-2-3-1 estreita': return [gk, ...backFour(), slot('LDM', 'VOL', 'esquerdo', 40, 63, ['Primeiro volante'], ['Meia versátil']), slot('RDM', 'MLG', 'direito', 60, 63, ['Meia versátil', 'Orquestrador'], ['Jogador de infiltração']), slot('LAM', 'MAT', 'esquerdo', 34, 40, ['Armador criativo', 'Jogador de infiltração'], ['Clássico nº 10']), slot('AM', 'MAT', 'centro', 50, 36, ['Jogador de infiltração', 'Armador criativo'], ['Clássico nº 10']), slot('RAM', 'MAT', 'direito', 66, 40, ['Armador criativo', 'Jogador de infiltração'], ['Clássico nº 10']), slot('CF', 'CA', 'centro', 50, 15, ['Artilheiro', 'Homem de área'], ['Pivô'])];
    case '3-4-2-1': return [gk, ...backThree(), slot('LWB', 'ALA', 'esquerdo', 10, 57, ['Ala produtivo', 'Perito em cruzamento'], ['Lateral defensivo']), slot('LCM', 'MLG', 'esquerdo', 38, 57, ['Primeiro volante', 'Meia versátil'], ['Orquestrador']), slot('RCM', 'MLG', 'direito', 62, 57, ['Meia versátil', 'Orquestrador'], ['Jogador de infiltração']), slot('RWB', 'ALA', 'direito', 90, 57, ['Ala produtivo', 'Perito em cruzamento'], ['Lateral defensivo']), slot('LAM', 'MAT', 'esquerdo', 39, 32, ['Armador criativo', 'Jogador de infiltração'], ['Puxa marcação']), slot('RAM', 'MAT', 'direito', 61, 32, ['Jogador de infiltração', 'Armador criativo'], ['Puxa marcação']), slot('CF', 'CA', 'centro', 50, 14, ['Artilheiro', 'Homem de área'], ['Pivô'])];
    case '3-2-4-1': return [gk, ...backThree(), slot('LDM', 'VOL', 'esquerdo', 39, 65, ['Primeiro volante'], ['Meia versátil']), slot('RDM', 'MLG', 'direito', 61, 65, ['Meia versátil', 'Orquestrador'], ['Primeiro volante']), slot('LM', 'MLG', 'esquerdo', 15, 43, ['Meia versátil', 'Armador criativo'], ['Ala produtivo']), slot('LAM', 'MAT', 'esquerdo', 39, 36, ['Armador criativo', 'Jogador de infiltração'], ['Clássico nº 10']), slot('RAM', 'MAT', 'direito', 61, 36, ['Jogador de infiltração', 'Armador criativo'], ['Clássico nº 10']), slot('RM', 'MLG', 'direito', 85, 43, ['Meia versátil', 'Armador criativo'], ['Ala produtivo']), slot('CF', 'CA', 'centro', 50, 14, ['Artilheiro', 'Homem de área'], ['Pivô'])];
    case '3-1-4-2': return [gk, ...backThree(), slot('DM', 'VOL', 'centro', 50, 66, ['Primeiro volante'], ['Meia versátil']), slot('LM', 'MLG', 'esquerdo', 16, 48, ['Meia versátil', 'Ala produtivo'], ['Perito em cruzamento']), slot('LCM', 'MLG', 'esquerdo', 39, 49, ['Orquestrador', 'Meia versátil'], ['Jogador de infiltração']), slot('RCM', 'MLG', 'direito', 61, 49, ['Jogador de infiltração', 'Meia versátil'], ['Orquestrador']), slot('RM', 'MLG', 'direito', 84, 48, ['Meia versátil', 'Ala produtivo'], ['Perito em cruzamento']), slot('LCF', 'CA', 'esquerdo', 39, 18, ['Puxa marcação', 'Pivô'], ['Artilheiro']), slot('RCF', 'CA', 'direito', 61, 18, ['Artilheiro', 'Homem de área'], ['Atacante pivô'])];
    case '4-1-4-1': return [gk, ...backFour(), slot('DM', 'VOL', 'centro', 50, 65, ['Primeiro volante'], ['Meia versátil']), slot('LM', 'MLG', 'esquerdo', 17, 45, ['Meia versátil', 'Armador criativo'], ['Ala produtivo']), slot('LCM', 'MLG', 'esquerdo', 39, 48, ['Orquestrador', 'Meia versátil'], ['Jogador de infiltração']), slot('RCM', 'MLG', 'direito', 61, 48, ['Jogador de infiltração', 'Meia versátil'], ['Orquestrador']), slot('RM', 'MLG', 'direito', 83, 45, ['Meia versátil', 'Armador criativo'], ['Ala produtivo']), slot('CF', 'CA', 'centro', 50, 16, ['Pivô', 'Artilheiro'], ['Homem de área'])];
    case '4-3-1-2': return [gk, ...backFour(), slot('DM', 'VOL', 'centro', 50, 65, ['Primeiro volante'], ['Meia versátil']), slot('LCM', 'MLG', 'esquerdo', 34, 52, ['Meia versátil', 'Orquestrador'], ['Jogador de infiltração']), slot('RCM', 'MLG', 'direito', 66, 52, ['Jogador de infiltração', 'Meia versátil'], ['Orquestrador']), slot('AM', 'MAT', 'centro', 50, 36, ['Jogador de infiltração', 'Armador criativo'], ['Clássico nº 10']), slot('LCF', 'CA', 'esquerdo', 39, 17, ['Puxa marcação', 'Pivô'], ['Artilheiro']), slot('RCF', 'CA', 'direito', 61, 17, ['Artilheiro', 'Homem de área'], ['Atacante pivô'])];
    case '5-2-1-2': return [gk, ...backFive(), slot('LCM', 'MLG', 'esquerdo', 40, 56, ['Primeiro volante', 'Meia versátil'], ['Orquestrador']), slot('RCM', 'MLG', 'direito', 60, 56, ['Meia versátil', 'Orquestrador'], ['Jogador de infiltração']), slot('AM', 'MAT', 'centro', 50, 36, ['Jogador de infiltração', 'Armador criativo'], ['Clássico nº 10']), slot('LCF', 'CA', 'esquerdo', 39, 17, ['Puxa marcação', 'Pivô'], ['Artilheiro']), slot('RCF', 'CA', 'direito', 61, 17, ['Artilheiro', 'Homem de área'], ['Atacante pivô'])];
    case '5-3-2': return [gk, ...backFive(), slot('DM', 'VOL', 'centro', 50, 62, ['Primeiro volante'], ['Meia versátil']), slot('LCM', 'MLG', 'esquerdo', 35, 50, ['Meia versátil', 'Orquestrador'], ['Jogador de infiltração']), slot('RCM', 'MLG', 'direito', 65, 50, ['Jogador de infiltração', 'Meia versátil'], ['Orquestrador']), slot('LCF', 'CA', 'esquerdo', 39, 18, ['Puxa marcação', 'Pivô'], ['Artilheiro']), slot('RCF', 'CA', 'direito', 61, 18, ['Artilheiro', 'Homem de área'], ['Atacante pivô'])];
    case '3-4-1-2': return [gk, ...backThree(), slot('LWB', 'ALA', 'esquerdo', 10, 56, ['Ala produtivo', 'Perito em cruzamento'], ['Lateral defensivo']), slot('LCM', 'MLG', 'esquerdo', 39, 56, ['Primeiro volante', 'Meia versátil'], ['Orquestrador']), slot('RCM', 'MLG', 'direito', 61, 56, ['Meia versátil', 'Orquestrador'], ['Primeiro volante']), slot('RWB', 'ALA', 'direito', 90, 56, ['Ala produtivo', 'Perito em cruzamento'], ['Lateral defensivo']), slot('AM', 'MAT', 'centro', 50, 36, ['Jogador de infiltração', 'Armador criativo'], ['Clássico nº 10']), slot('LCF', 'CA', 'esquerdo', 39, 17, ['Puxa marcação', 'Pivô'], ['Artilheiro']), slot('RCF', 'CA', 'direito', 61, 17, ['Artilheiro', 'Homem de área'], ['Atacante pivô'])];
    case '3-2-3-2': return [gk, ...backThree(), slot('LDM', 'VOL', 'esquerdo', 40, 65, ['Primeiro volante'], ['Meia versátil']), slot('RDM', 'MLG', 'direito', 60, 65, ['Meia versátil', 'Orquestrador'], ['Primeiro volante']), slot('LAM', 'MAT', 'esquerdo', 32, 39, ['Armador criativo', 'Jogador de infiltração'], ['Clássico nº 10']), slot('AM', 'MAT', 'centro', 50, 35, ['Jogador de infiltração', 'Armador criativo'], ['Clássico nº 10']), slot('RAM', 'MAT', 'direito', 68, 39, ['Armador criativo', 'Jogador de infiltração'], ['Clássico nº 10']), slot('LCF', 'CA', 'esquerdo', 39, 17, ['Puxa marcação', 'Pivô'], ['Artilheiro']), slot('RCF', 'CA', 'direito', 61, 17, ['Artilheiro', 'Homem de área'], ['Atacante pivô'])];
    case '4-4-2 losango': return layout('4-1-2-1-2');
    case '4-1-3-2': return [gk, ...backFour(), slot('DM', 'VOL', 'centro', 50, 65, ['Primeiro volante'], ['Meia versátil']), slot('LM', 'MLG', 'esquerdo', 25, 46, ['Meia versátil', 'Armador criativo'], ['Ala produtivo']), slot('AM', 'MAT', 'centro', 50, 39, ['Jogador de infiltração', 'Armador criativo'], ['Clássico nº 10']), slot('RM', 'MLG', 'direito', 75, 46, ['Meia versátil', 'Armador criativo'], ['Ala produtivo']), slot('LCF', 'CA', 'esquerdo', 39, 17, ['Puxa marcação', 'Pivô'], ['Artilheiro']), slot('RCF', 'CA', 'direito', 61, 17, ['Artilheiro', 'Homem de área'], ['Atacante pivô'])];
    case '4-2-1-3 estreita': return [gk, ...backFour(), slot('LDM', 'VOL', 'esquerdo', 40, 64, ['Primeiro volante'], ['Meia versátil']), slot('RDM', 'MLG', 'direito', 60, 64, ['Meia versátil', 'Orquestrador'], ['Primeiro volante']), slot('AM', 'MAT', 'centro', 50, 42, ['Jogador de infiltração', 'Armador criativo'], ['Clássico nº 10']), slot('LSA', 'SA', 'esquerdo', 32, 25, ['Armador criativo', 'Puxa marcação'], ['Jogador de infiltração']), slot('CF', 'CA', 'centro', 50, 14, ['Artilheiro', 'Homem de área'], ['Pivô']), slot('RSA', 'SA', 'direito', 68, 25, ['Jogador de infiltração', 'Armador criativo'], ['Puxa marcação'])];
    default: return layout('4-2-2-2');
  }
}

function arrow(fromSlotId: string, toSlotId: string | undefined, kind: TacticalArrowKind, label: string): MetaTacticalArrow {
  return { id: `${fromSlotId}-${toSlotId || kind}-${kind}`, fromSlotId, toSlotId, kind, label, enabled: true };
}

function arrowsFor(structure: string, style: MetaCoachStyle): MetaTacticalArrow[] {
  const slots = layout(structure);
  const byPosition = (position: string) => slots.find((item) => item.position === position)?.id;
  const gk = byPosition('GOL') || 'GK';
  const centerBack = slots.find((item) => item.position === 'ZAG' && item.side === 'centro')?.id || slots.find((item) => item.position === 'ZAG')?.id || 'LCB';
  const dm = byPosition('VOL') || byPosition('MLG') || 'DM';
  const am = byPosition('MAT') || byPosition('SA') || dm;
  const cf = byPosition('CA') || 'CF';
  const result = [
    arrow(gk, centerBack, 'short-pass', 'Saída curta'),
    arrow(centerBack, dm, style === 'Contra-ataque rápido' ? 'vertical-pass' : 'short-pass', 'Primeira progressão'),
    arrow(dm, am, style === 'Posse de bola' ? 'short-pass' : 'vertical-pass', 'Conectar o meio'),
    arrow(am, cf, 'vertical-pass', 'Último passe'),
    arrow(cf, undefined, 'run', 'Atacar a última linha'),
    arrow(dm, centerBack, 'cover', 'Cobertura central')
  ];
  const wide = slots.filter((item) => ['LE', 'LD', 'ALA'].includes(item.position));
  for (const item of wide) result.push(arrow(item.id, dm, 'recovery', 'Recompor e fechar por dentro'));
  if (style === 'Posse de bola') result.push(arrow(am, dm, 'rotation', 'Rotação de apoio'));
  return result;
}

const STYLE_TEXT: Record<MetaCoachStyle, { start: string; accelerate: string; recycle: string; attack: string; defend: string; why: string }> = {
  'Posse de bola': {
    start: 'Inicie com apoio curto entre goleiro, zagueiro e Primeiro volante. Só avance quando houver receptor de frente.',
    accelerate: 'Acelere após atrair a primeira pressão e abrir um jogador entre as linhas.',
    recycle: 'Volte a bola quando o passe vertical obrigar o receptor a dominar de costas ou sem apoio próximo.',
    attack: 'Use triangulações centrais, terceiro homem e chegada do Jogador de infiltração.',
    defend: 'Perdeu a bola: feche o centro primeiro, pressione com o jogador mais próximo e preserve a última linha.',
    why: 'A estrutura mantém distâncias curtas, oferece apoios sucessivos e reduz perdas sem cobertura.'
  },
  'Contra-ataque normal': {
    start: 'Saia com segurança e procure o meia livre depois do primeiro passe vertical controlado.',
    accelerate: 'Acelere quando o adversário adiantar um lateral ou romper a própria linha de meio.',
    recycle: 'Recue se o atacante estiver isolado ou se os dois meias chegarem atrasados à jogada.',
    attack: 'Combine Puxa marcação ou Pivô com Artilheiro para criar espaço e profundidade.',
    defend: 'Mantenha bloco médio, Primeiro volante protegendo a frente da área e laterais sem avançar juntos.',
    why: 'Equilibra saída segura e ataque ao espaço sem desmontar a proteção central.'
  },
  'Contra-ataque rápido': {
    start: 'Recupere, encontre o primeiro passe limpo e ataque o espaço antes de a defesa rival recompor.',
    accelerate: 'Acelere imediatamente quando houver atacante de frente e corredor central ou diagonal aberto.',
    recycle: 'Se a primeira transição não criar vantagem, retenha e reconstrua; não force o segundo passe.',
    attack: 'Use Artilheiro atacando a última linha, Puxa marcação abrindo espaço e meia chegando de trás.',
    defend: 'Pressione a perda por poucos segundos; sem recuperação, recue para o bloco e proteja o centro.',
    why: 'Mantém jogadores preparados para a ruptura e uma base de cobertura para sobreviver à perda.'
  }
};

const FORMATION_LISTS: Record<MetaCoachStyle, string[]> = {
  'Posse de bola': ['4-1-2-1-2', '4-3-3 com dois SA', '4-3-3 com dois CA', '4-3-2-1', '4-2-2-2', '4-2-3-1 estreita', '3-4-2-1', '3-2-4-1', '3-1-4-2', '4-1-4-1'],
  'Contra-ataque normal': ['4-2-2-2', '4-3-1-2', '4-1-2-1-2', '4-2-3-1 estreita', '4-3-2-1', '5-2-1-2', '5-3-2', '3-4-1-2', '3-2-3-2', '4-4-2 losango'],
  'Contra-ataque rápido': ['4-1-2-1-2', '4-2-2-2', '4-3-1-2', '4-3-3 com dois SA', '4-3-3 com dois CA', '4-1-3-2', '3-1-4-2', '3-2-3-2', '5-2-1-2', '4-2-1-3 estreita']
};

function commercialName(structure: string, style: MetaCoachStyle) {
  const suffix = style === 'Posse de bola' ? 'Controle Central' : style === 'Contra-ataque normal' ? 'Transição Equilibrada' : 'Ruptura Vertical';
  return `${structure} • ${suffix}`;
}

function objectivesFor(structure: string, style: MetaCoachStyle): MetaObjective[] {
  const objectives: MetaObjective[] = style === 'Posse de bola'
    ? ['controlar a posse', 'tocar rápido', 'criar superioridade no meio', 'jogar pelo centro']
    : style === 'Contra-ataque rápido'
      ? ['atacar em profundidade', 'tocar rápido', 'usar dois atacantes', 'buscar o resultado']
      : ['formação equilibrada', 'evitar contra-ataques', 'jogar pelo centro', 'conduzir e tabelar'];
  if (/4-1-2-1-2|4-3-1-2|4-2-2-2|3-1-4-2|5-2-1-2/.test(structure)) objectives.push('usar dois atacantes', 'jogar sem pontas');
  if (/5-|4-1-4-1/.test(structure)) objectives.push('proteger o resultado', 'formação segura');
  if (/3-2-4-1|3-2-3-2|4-2-1-3/.test(structure)) objectives.push('formação agressiva', 'pressionar depois da perda');
  return [...new Set(objectives)].slice(0, 7);
}

function buildDefinition(style: MetaCoachStyle, structure: string, index: number): MetaFormationDefinition {
  const styleText = STYLE_TEXT[style];
  const objectiveList = objectivesFor(structure, style);
  const isFive = structure.startsWith('5-');
  const isThree = structure.startsWith('3-');
  const aggressive = /3-2-4-1|3-2-3-2|4-2-1-3|4-3-3/.test(structure);
  const attack = clamp((style === 'Contra-ataque rápido' ? 84 : style === 'Posse de bola' ? 79 : 76) + (aggressive ? 6 : 0) - (isFive ? 7 : 0) - index * .4);
  const defense = clamp((isFive ? 87 : /4-1-|4-2-/.test(structure) ? 81 : 72) + (style === 'Contra-ataque normal' ? 3 : 0));
  const creation = clamp((style === 'Posse de bola' ? 88 : 76) + (/2-3-1|3-2-1|2-4-1/.test(structure) ? 4 : 0));
  const transition = clamp((style === 'Contra-ataque rápido' ? 91 : style === 'Contra-ataque normal' ? 84 : 73) + (aggressive ? 3 : 0));
  const control = clamp((style === 'Posse de bola' ? 92 : 76) + (/4-1-2-1-2|4-2-3-1|4-3-2-1/.test(structure) ? 3 : 0));
  const compactness = clamp((isFive ? 89 : /estreita|losango|4-1-2-1-2|4-3-1-2/.test(structure) ? 86 : 77) - (isThree && aggressive ? 5 : 0));
  const risk: MetaFormationRisk = aggressive || structure === '3-2-4-1' ? 'Alto' : isFive || structure === '4-1-4-1' ? 'Baixo' : 'Médio';
  const difficulty: MetaFormationDifficulty = isThree || /dois SA|dois CA|3-2-3-2/.test(structure) ? 'Avançada' : isFive ? 'Fácil' : 'Intermediária';
  return {
    id: `${style.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${structure.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    commercialName: commercialName(structure, style),
    structure,
    style,
    objectives: objectiveList,
    classification: index < 4 ? 'Meta personalizada' : index < 7 ? 'Estrutura competitiva' : index < 9 ? 'Formação personalizada' : 'Fora do padrão predefinido',
    difficulty,
    aggression: risk === 'Alto' ? 88 : risk === 'Baixo' ? 55 : 72,
    risk,
    scores: { attack, defense, creation, transition, control, compactness },
    slots: layout(structure),
    arrows: arrowsFor(structure, style),
    strengths: [
      objectiveList.includes('criar superioridade no meio') ? 'Superioridade numérica e linhas curtas no corredor central.' : 'Conexões claras entre defesa, meio e ataque.',
      style === 'Contra-ataque rápido' ? 'Atacantes preparados para atacar espaço logo após a recuperação.' : 'Apoios próximos para reduzir passes sem sequência.',
      /4-1-|5-/.test(structure) ? 'Proteção central com referência fixa à frente dos zagueiros.' : 'Flexibilidade para alternar controle e aceleração.'
    ],
    weaknesses: [
      isThree ? 'Exige recomposição disciplinada dos jogadores de corredor.' : 'Laterais não podem avançar juntos sem cobertura.',
      aggressive ? 'Uma perda central pode expor a última linha.' : 'Pode faltar profundidade se os atacantes vierem buscar a bola ao mesmo tempo.'
    ],
    startPlay: [styleText.start, 'Use o Primeiro volante como ponto de segurança quando a primeira linha estiver pressionada.'],
    accelerateWhen: [styleText.accelerate, 'Acelere apenas quando o recebedor puder jogar de frente ou em um toque.'],
    recycleWhen: [styleText.recycle, 'Ao perder vantagem posicional, volte ao volante ou zagueiro livre.'],
    attackPlan: [styleText.attack, 'Mantenha pelo menos dois jogadores protegendo a perda.'],
    defensePlan: [styleText.defend, 'A pressão deve orientar o adversário para fora, sem retirar o zagueiro da linha antes da hora.'],
    protectCenter: ['Primeiro volante entre a bola e os zagueiros.', 'Meias fecham linhas internas antes de perseguir lateralmente.'],
    exploreSpace: ['Puxa marcação retira um defensor; Artilheiro ataca o espaço criado.', 'Jogador de infiltração chega depois que o atacante fixa a última linha.'],
    avoid: ['Dois laterais avançando juntos.', 'Dois atacantes executando exatamente o mesmo movimento.', 'Passe vertical com receptor pressionado e sem apoio.'],
    offensivePrinciples: ['Criar triângulos.', 'Ter profundidade e apoio ao mesmo tempo.', 'Acelerar após gerar vantagem, não por ansiedade.'],
    defensivePrinciples: ['Fechar o centro.', 'Preservar a última linha.', 'Pressionar com cobertura.'],
    successKeys: ['Primeiro passe limpo.', 'Distâncias curtas entre setores.', 'Funções complementares no ataque.'],
    whyItWorks: styleText.why
  };
}

export const META_FORMATION_CATALOG: MetaFormationDefinition[] = META_COACH_STYLES.flatMap((style) => FORMATION_LISTS[style].map((structure, index) => buildDefinition(style, structure, index)));

export function getMetaFormation(id: string) {
  return META_FORMATION_CATALOG.find((item) => item.id === id) || META_FORMATION_CATALOG[0];
}

export function recommendMetaFormations(style: MetaCoachStyle, objective: MetaObjective, answers: { central?: boolean; usesWingers?: boolean; twoStrikers?: boolean; fast?: boolean; suffersCounters?: boolean; defensiveDifficulty?: boolean; protectResult?: boolean; risk?: 'segurança' | 'equilíbrio' | 'agressividade' } = {}) {
  return META_FORMATION_CATALOG.filter((item) => item.style === style).map((item) => {
    let score = item.objectives.includes(objective) ? 30 : 0;
    if (answers.central && item.objectives.includes('jogar pelo centro')) score += 14;
    if (answers.usesWingers === false && item.objectives.includes('jogar sem pontas')) score += 15;
    if (answers.twoStrikers && item.objectives.includes('usar dois atacantes')) score += 15;
    if (answers.fast && item.scores.transition >= 84) score += 12;
    if (answers.suffersCounters && item.scores.defense >= 80) score += 12;
    if (answers.defensiveDifficulty && item.risk === 'Baixo') score += 12;
    if (answers.protectResult && item.objectives.includes('proteger o resultado')) score += 14;
    if (answers.risk === 'segurança' && item.risk === 'Baixo') score += 10;
    if (answers.risk === 'equilíbrio' && item.risk === 'Médio') score += 10;
    if (answers.risk === 'agressividade' && item.risk === 'Alto') score += 10;
    score += (item.scores.control + item.scores.compactness + item.scores.creation) / 15;
    return { formation: item, score: clamp(score) };
  }).sort((a, b) => b.score - a.score || b.formation.scores.control - a.formation.scores.control);
}

function styleCount(assignments: Record<string, MetaFormationSlotAssignment>, value: OfficialPlayerStyle) {
  return Object.values(assignments).filter((item) => item.style === value).length;
}

export function validateMetaFormation(formation: MetaFormationDefinition, assignments: Record<string, MetaFormationSlotAssignment>, objective: MetaObjective): MetaFormationValidation {
  const notes: MetaFormationValidation['notes'] = [];
  const slots = formation.slots;
  const assigned = slots.map((slotItem) => assignments[slotItem.id]?.style || slotItem.recommendedStyles[0]);
  const count = (style: OfficialPlayerStyle) => assigned.filter((item) => item === style).length;
  if (count('O destruidor') >= 2 && slots.filter((item) => item.position === 'ZAG').some((item) => assignments[item.id]?.style === 'O destruidor')) notes.push({ level: 'critical', text: 'Dois zagueiros com O destruidor podem atacar a mesma bola e romper a última linha.' });
  const attackingFullbacks = count('Lateral ofensivo') + count('Lateral atacante');
  if (attackingFullbacks >= 2) notes.push({ level: 'critical', text: 'Os dois laterais estão muito ofensivos. Um dos corredores pode ficar sem cobertura.' });
  if (!assigned.includes('Primeiro volante') && !formation.structure.startsWith('5-')) notes.push({ level: 'warning', text: 'A estrutura não possui Primeiro volante. A proteção central depende mais da disciplina dos meias.' });
  if (count('Atacante surpresa') >= 1) notes.push({ level: 'warning', text: 'Atacante surpresa na defesa aumenta o risco de saída da linha. Use cobertura próxima.' });
  if (count('Clássico nº 10') >= 1 && !assigned.some((item) => ['Artilheiro', 'Jogador de infiltração', 'Homem de área'].includes(item))) notes.push({ level: 'warning', text: 'Clássico nº 10 precisa de jogadores atacando o espaço para transformar posse em profundidade.' });
  if (count('Orquestrador') >= 1 && assigned.filter((item) => ['Meia versátil', 'Armador criativo', 'Pivô'].includes(item)).length < 2) notes.push({ level: 'warning', text: 'Orquestrador tem poucas opções próximas para circular a bola.' });
  const attackers = slots.filter((item) => ['CA', 'SA'].includes(item.position)).map((item) => assignments[item.id]?.style || item.recommendedStyles[0]);
  if (attackers.length >= 2 && new Set(attackers).size === 1) notes.push({ level: 'warning', text: 'Os atacantes usam funções iguais. Falta complementaridade entre apoio, atração e profundidade.' });
  if (!attackers.some((item) => ['Artilheiro', 'Homem de área', 'Jogador de infiltração'].includes(item))) notes.push({ level: 'warning', text: 'O ataque tem pouca profundidade. Adicione um jogador que ataque a última linha.' });
  if (objective === 'proteger o resultado' && formation.risk === 'Alto') notes.push({ level: 'critical', text: 'A formação é ofensiva demais para proteger o resultado sem ajustes de cobertura.' });
  if (objective === 'buscar o resultado' && formation.scores.attack < 74) notes.push({ level: 'warning', text: 'A formação oferece controle, mas pode ser conservadora demais para buscar o resultado.' });
  if (styleCount(assignments, 'Lateral defensivo') >= 1 && attackingFullbacks >= 1) notes.push({ level: 'positive', text: 'Lateral defensivo oferece cobertura para o setor oposto mais ofensivo.' });
  if (assigned.includes('Primeiro volante')) notes.push({ level: 'positive', text: 'Proteção central adequada com Primeiro volante à frente dos zagueiros.' });
  if (attackers.includes('Puxa marcação') && attackers.some((item) => ['Artilheiro', 'Homem de área'].includes(item))) notes.push({ level: 'positive', text: 'Puxa marcação abre espaço enquanto Artilheiro ou Homem de área ataca a zona criada.' });
  if (attackers.includes('Pivô') && assigned.includes('Jogador de infiltração')) notes.push({ level: 'positive', text: 'Pivô oferece tabela para a chegada vertical do Jogador de infiltração.' });
  const critical = notes.filter((item) => item.level === 'critical').length;
  const warnings = notes.filter((item) => item.level === 'warning').length;
  const level: MetaFormationValidation['level'] = critical ? 'high-risk' : warnings >= 3 ? 'attention' : warnings ? 'balanced' : 'recommended';
  const title = level === 'recommended' ? 'Combinação recomendada' : level === 'balanced' ? 'Estrutura equilibrada' : level === 'attention' ? 'Atenção tática' : 'Risco alto';
  return { level, title, notes: notes.length ? notes : [{ level: 'positive', text: 'Estrutura sem conflito importante detectado.' }] };
}

export function scorePlayerForMetaSlot(player: IntegratedPlayerRecord, slotItem: MetaFormationSlot, selectedStyle: OfficialPlayerStyle) {
  let score = 35;
  const code = String(player.targetPositionCode || '').toUpperCase();
  const label = slotItem.position;
  const positionMatch = (label === 'GOL' && code === 'GK') || (label === 'ZAG' && code === 'CB') || (label === 'LE' && code === 'LB') || (label === 'LD' && code === 'RB') || (label === 'VOL' && code === 'DMF') || (label === 'MLG' && ['CMF', 'LMF', 'RMF'].includes(code)) || (label === 'MAT' && code === 'AMF') || (label === 'SA' && code === 'SS') || (label === 'CA' && code === 'CF') || (label === 'ALA' && ['LB', 'RB', 'LMF', 'RMF'].includes(code));
  if (positionMatch) score += 35;
  if (player.playstyle === selectedStyle || player.functionLabel === selectedStyle) score += 20;
  if (slotItem.recommendedStyles.includes(selectedStyle)) score += 7;
  score += Math.min(8, player.efficiency / 15);
  const normalized = clamp(score);
  const fitLabel = normalized >= 82 ? 'jogador ideal' : normalized >= 68 ? 'compatível' : normalized >= 52 ? 'adaptável' : 'jogador de risco';
  return { score: normalized, label: fitLabel };
}

export function createMetaFormationProject(formation: MetaFormationDefinition, objective: MetaObjective, mode: MetaFormationMode): MetaFormationProject {
  const now = new Date().toISOString();
  const assignments = Object.fromEntries(formation.slots.map((slotItem) => [slotItem.id, { slotId: slotItem.id, style: slotItem.recommendedStyles[0], x: slotItem.x, y: slotItem.y } satisfies MetaFormationSlotAssignment]));
  return {
    id: `meta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: formation.commercialName,
    formationId: formation.id,
    style: formation.style,
    objective,
    mode,
    assignments,
    arrows: formation.arrows.map((item) => ({ ...item })),
    customTexts: {},
    appearance: { shirt: 'moderna', background: 'marinho', intensity: 'equilibrada', showNotes: true, showInstructions: true, showArrows: true, userName: '', teamName: '', logoDataUrl: undefined },
    createdAt: now,
    updatedAt: now
  };
}

function isProject(value: unknown): value is MetaFormationProject {
  return Boolean(value && typeof value === 'object' && typeof (value as MetaFormationProject).formationId === 'string' && (value as MetaFormationProject).assignments);
}

export function readMetaFormationProjects(): MetaFormationProject[] {
  const raw = readAccountStorage(META_FORMATION_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isProject).slice(0, 40) : [];
  } catch {
    return [];
  }
}

export function replaceMetaFormationProjects(value: unknown) {
  const next = Array.isArray(value) ? value.filter((item): item is MetaFormationProject => Boolean(item && typeof item === 'object' && typeof (item as MetaFormationProject).id === 'string' && typeof (item as MetaFormationProject).formationId === 'string')).slice(0, 40) : [];
  writeAccountStorage(META_FORMATION_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function saveMetaFormationProject(project: MetaFormationProject) {
  const list = readMetaFormationProjects();
  const next = [{ ...project, updatedAt: new Date().toISOString() }, ...list.filter((item) => item.id !== project.id)].slice(0, 40);
  writeAccountStorage(META_FORMATION_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteMetaFormationProject(id: string) {
  const next = readMetaFormationProjects().filter((item) => item.id !== id);
  writeAccountStorage(META_FORMATION_STORAGE_KEY, JSON.stringify(next));
  return next;
}

function escapeXml(value: unknown) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

const ARROW_COLOR: Record<TacticalArrowKind, string> = {
  'short-pass': '#f4cf55', 'vertical-pass': '#f4cf55', run: '#38d07b', recovery: '#63c8ff', cover: '#2268b8', rotation: '#d9e5f2'
};

export type MetaFormationExportFormat = 'vertical' | 'square' | 'story' | 'whatsapp' | 'field-only' | 'complete';

export function metaFormationOutputSize(format: MetaFormationExportFormat) {
  if (format === 'square') return { width: 1080, height: 1080 };
  if (format === 'story') return { width: 1080, height: 1920 };
  if (format === 'whatsapp') return { width: 1080, height: 1350 };
  if (format === 'field-only') return { width: 1080, height: 1080 };
  return { width: 1080, height: 1350 };
}

export function renderMetaFormationSvg(project: MetaFormationProject, format: MetaFormationExportFormat = 'complete') {
  const formation = getMetaFormation(project.formationId);
  const { width, height } = metaFormationOutputSize(format);
  const fieldOnly = format === 'field-only';
  const full = format === 'complete' || format === 'vertical' || format === 'story' || format === 'whatsapp';
  const headerHeight = fieldOnly ? 40 : 150;
  const footerHeight = fieldOnly ? 58 : 100;
  const panelWidth = full && project.appearance.showInstructions ? Math.round(width * .31) : 0;
  const fieldX = 40;
  const fieldY = headerHeight;
  const fieldW = width - 80 - panelWidth;
  const fieldH = height - headerHeight - footerHeight;
  const bg = project.appearance.background === 'grafite' ? '#071017' : project.appearance.background === 'campo' ? '#07190f' : '#04101f';
  const fieldBg = project.appearance.intensity === 'forte' ? '#0a4b34' : project.appearance.intensity === 'suave' ? '#12382d' : '#0d4935';
  const slotById = new Map(formation.slots.map((item) => [item.id, item]));
  const position = (slotItem: MetaFormationSlot) => {
    const assigned = project.assignments[slotItem.id];
    return { x: assigned?.x ?? slotItem.x, y: assigned?.y ?? slotItem.y };
  };
  const arrowSvg = project.appearance.showArrows ? project.arrows.filter((item) => item.enabled).map((item) => {
    const from = slotById.get(item.fromSlotId);
    if (!from) return '';
    const to = item.toSlotId ? slotById.get(item.toSlotId) : undefined;
    const a = position(from);
    const b = to ? position(to) : { x: a.x, y: Math.max(4, a.y - 15) };
    const x1 = fieldX + fieldW * a.x / 100;
    const y1 = fieldY + fieldH * a.y / 100;
    const x2 = fieldX + fieldW * b.x / 100;
    const y2 = fieldY + fieldH * b.y / 100;
    const dash = item.kind === 'vertical-pass' || item.kind === 'recovery' || item.kind === 'rotation' ? '12 9' : '';
    return `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ARROW_COLOR[item.kind]}" stroke-width="5" stroke-linecap="round" ${dash ? `stroke-dasharray="${dash}"` : ''} marker-end="url(#arrow-${item.kind})" opacity=".9"/><text x="${(x1+x2)/2}" y="${(y1+y2)/2-8}" text-anchor="middle" fill="#eef7ff" font-size="18" font-weight="700">${escapeXml(item.label)}</text></g>`;
  }).join('') : '';
  const playersSvg = formation.slots.map((slotItem) => {
    const assigned = project.assignments[slotItem.id];
    const point = position(slotItem);
    const x = fieldX + fieldW * point.x / 100;
    const y = fieldY + fieldH * point.y / 100;
    const style = assigned?.style || slotItem.recommendedStyles[0];
    const name = assigned?.playerName || slotItem.label;
    return `<g transform="translate(${x} ${y})"><circle r="31" fill="#071422" stroke="#7dd7ff" stroke-width="4"/><text y="7" text-anchor="middle" fill="#ffffff" font-size="20" font-weight="900">${escapeXml(slotItem.position)}</text><rect x="-78" y="37" width="156" height="52" rx="12" fill="#06101b" fill-opacity=".92" stroke="#28465d"/><text y="57" text-anchor="middle" fill="#ffffff" font-size="17" font-weight="800">${escapeXml(name)}</text><text y="78" text-anchor="middle" fill="#a7c5d9" font-size="14">${escapeXml(style)}</text></g>`;
  }).join('');
  const text = (key: keyof MetaFormationProject['customTexts'], fallback: string) => project.customTexts[key] || fallback;
  const instructions = full && project.appearance.showInstructions ? `<g transform="translate(${width-panelWidth+18} ${headerHeight+20})"><text fill="#7dd7ff" font-size="22" font-weight="900">PASSE CERTO</text><foreignObject x="0" y="34" width="${panelWidth-36}" height="170"><div xmlns="http://www.w3.org/1999/xhtml" style="font: 18px Arial; color:#eaf4fb; line-height:1.45">${escapeXml(text('passing', formation.startPlay[0]))}</div></foreignObject><text y="230" fill="#7dd7ff" font-size="22" font-weight="900">COMO ATACAR</text><foreignObject x="0" y="250" width="${panelWidth-36}" height="180"><div xmlns="http://www.w3.org/1999/xhtml" style="font: 18px Arial; color:#eaf4fb; line-height:1.45">${escapeXml(text('attack', formation.attackPlan[0]))}</div></foreignObject><text y="455" fill="#7dd7ff" font-size="22" font-weight="900">COMO DEFENDER</text><foreignObject x="0" y="475" width="${panelWidth-36}" height="180"><div xmlns="http://www.w3.org/1999/xhtml" style="font: 18px Arial; color:#eaf4fb; line-height:1.45">${escapeXml(text('defense', formation.defensePlan[0]))}</div></foreignObject><text y="680" fill="#d9b95b" font-size="22" font-weight="900">POR QUE RENDE</text><foreignObject x="0" y="700" width="${panelWidth-36}" height="210"><div xmlns="http://www.w3.org/1999/xhtml" style="font: 18px Arial; color:#eaf4fb; line-height:1.45">${escapeXml(text('why', formation.whyItWorks))}</div></foreignObject></g>` : '';
  const notes = full && project.appearance.showNotes ? `<g transform="translate(48 ${height-footerHeight+18})"><text fill="#f4cf55" font-size="19" font-weight="900">CHAVES DO SUCESSO</text><text y="30" fill="#d8e7f2" font-size="16">${escapeXml(text('success', formation.successKeys.join(' • ')))}</text></g>` : '';
  const markers = Object.keys(ARROW_COLOR).map((kind) => `<marker id="arrow-${kind}" markerWidth="12" markerHeight="12" refX="10" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${ARROW_COLOR[kind as TacticalArrowKind]}"/></marker>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${markers}<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#02070d"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#bg)"/><rect x="0" y="0" width="${width}" height="${headerHeight}" fill="#071421"/><text x="48" y="52" fill="#7dd7ff" font-family="Arial" font-size="22" font-weight="800">eFootball 2026 • ${escapeXml(project.style)}</text><text x="48" y="100" fill="#ffffff" font-family="Arial" font-size="38" font-weight="900">${escapeXml(project.name)}</text>${!fieldOnly ? `<rect x="${width-280}" y="35" width="230" height="52" rx="26" fill="#18354a" stroke="#d9b95b"/><text x="${width-165}" y="69" text-anchor="middle" fill="#f5dc8b" font-size="19" font-weight="900">Meta personalizada</text>` : ''}<g><rect x="${fieldX}" y="${fieldY}" width="${fieldW}" height="${fieldH}" rx="28" fill="${fieldBg}" stroke="#6dbf9e" stroke-width="4"/><line x1="${fieldX+fieldW/2}" y1="${fieldY}" x2="${fieldX+fieldW/2}" y2="${fieldY+fieldH}" stroke="#d8f4e7" stroke-width="3" opacity=".7"/><circle cx="${fieldX+fieldW/2}" cy="${fieldY+fieldH/2}" r="${fieldW*.12}" fill="none" stroke="#d8f4e7" stroke-width="3" opacity=".7"/><rect x="${fieldX+fieldW*.28}" y="${fieldY}" width="${fieldW*.44}" height="${fieldH*.16}" fill="none" stroke="#d8f4e7" stroke-width="3" opacity=".7"/><rect x="${fieldX+fieldW*.28}" y="${fieldY+fieldH*.84}" width="${fieldW*.44}" height="${fieldH*.16}" fill="none" stroke="#d8f4e7" stroke-width="3" opacity=".7"/>${arrowSvg}${playersSvg}</g>${instructions}${notes}<rect x="0" y="${height-46}" width="${width}" height="46" fill="#030912"/><text x="48" y="${height-16}" fill="#c9d8e4" font-size="18" font-weight="800">Marques Fichas • inteligência tática e desempenho</text>${project.appearance.teamName ? `<text x="${width-48}" y="${height-16}" text-anchor="end" fill="#7dd7ff" font-size="18">${escapeXml(project.appearance.teamName)}</text>` : ''}</svg>`;
}
