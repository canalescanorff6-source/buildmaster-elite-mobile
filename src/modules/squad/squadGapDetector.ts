import type { TeamDiagnosis } from '@/modules/core/centralIntelligence';

export type SquadGap = {
  id: string;
  severity: 'critical' | 'important' | 'opportunity';
  slot: string;
  missingFunction: string;
  idealStyles: string[];
  requiredAttributes: string[];
  why: string;
};

type ProfileRule = {
  match: RegExp;
  styles: string[];
  attributes: string[];
  functionLabel: string;
};

const GOALKEEPER_RULE: ProfileRule = {
  match: /goleiro|gol|gk/i,
  styles: ['Goleiro ofensivo', 'Goleiro defensivo'],
  attributes: ['Talento de goleiro', 'Reflexo', 'Alcance', 'Firmeza de goleiro'],
  functionLabel: 'segurança no gol'
};

const FULLBACK_RULE: ProfileRule = {
  match: /lateral|ala|corredor/i,
  styles: ['Lateral defensivo', 'Lateral ofensivo', 'Lateral móvel'],
  attributes: ['Velocidade', 'Resistência', 'Consciência defensiva', 'Passe rasteiro'],
  functionLabel: 'proteção e saída pelo corredor'
};

const CENTRE_BACK_RULE: ProfileRule = {
  match: /zagueiro|zag|defensor criativo/i,
  styles: ['Defensor criativo', 'O destruidor'],
  attributes: ['Consciência defensiva', 'Desarme', 'Velocidade', 'Contato físico'],
  functionLabel: 'proteção da área'
};

const DEFENSIVE_MIDFIELD_RULE: ProfileRule = {
  match: /(^|\s)vol($|\s)|primeiro volante|volante destruidor|cobertura/i,
  styles: ['Primeiro volante', 'O destruidor'],
  attributes: ['Consciência defensiva', 'Desarme', 'Contato físico', 'Passe rasteiro'],
  functionLabel: 'proteção central'
};

const PROFILE_RULES: ProfileRule[] = [
  GOALKEEPER_RULE,
  FULLBACK_RULE,
  CENTRE_BACK_RULE,
  DEFENSIVE_MIDFIELD_RULE,
  { match: /orquestr|saida|constr|passe/i, styles: ['Orquestrador', 'Meia versátil'], attributes: ['Passe rasteiro', 'Passe alto', 'Controle de bola', 'Resistência'], functionLabel: 'saída de bola' },
  { match: /artilheiro|homem de area|homem de área|finaliz/i, styles: ['Artilheiro', 'Homem de área'], attributes: ['Talento ofensivo', 'Finalização', 'Aceleração', 'Equilíbrio'], functionLabel: 'finalização' },
  { match: /pivo|pivô|puxa marcacao|puxa marcação|apoio/i, styles: ['Pivô', 'Puxa marcação'], attributes: ['Controle de bola', 'Contato físico', 'Passe rasteiro', 'Equilíbrio'], functionLabel: 'apoio ao ataque' },
  { match: /mat|criacao|criação|armador|infiltr/i, styles: ['Armador criativo', 'Jogador de infiltração', 'Clássico nº 10'], attributes: ['Controle de bola', 'Passe rasteiro', 'Condução firme', 'Aceleração'], functionLabel: 'criação entrelinhas' }
];

function ruleForSlot(slot: string): ProfileRule | null {
  const normalized = slot.trim().toUpperCase().replace(/\s+/g, ' ');
  if (/^(GOL|GK)$/.test(normalized)) return GOALKEEPER_RULE;
  if (/^(LE|LD|LB|RB)$/.test(normalized)) return FULLBACK_RULE;
  if (/^(ZAG|ZAG E|ZAG D|ZAG C|CB|LCB|RCB)$/.test(normalized)) return CENTRE_BACK_RULE;
  if (/^(VOL|VOL E|VOL D|DMF)$/.test(normalized)) return DEFENSIVE_MIDFIELD_RULE;
  return null;
}

export function detectSquadGaps(team: TeamDiagnosis): SquadGap[] {
  const gaps: SquadGap[] = [];
  for (const [index, missing] of team.missingRoles.entries()) {
    const [slot, description = missing] = missing.split(':').map((item) => item.trim());
    // A posição da vaga é autoritativa. O texto descritivo só entra como
    // segunda evidência; assim "Goleiro defensivo" nunca cai em "proteção central".
    const rule = ruleForSlot(slot) ?? PROFILE_RULES.find((item) => item.match.test(description)) ?? {
      styles: ['Meia versátil'],
      attributes: ['Controle de bola', 'Resistência', 'Velocidade', 'Passe rasteiro'],
      functionLabel: description || 'função complementar'
    };
    gaps.push({
      id: `gap-${index}-${slot}`,
      severity: index === 0 || team.filledSlots < team.totalSlots ? 'critical' : 'important',
      slot,
      missingFunction: rule.functionLabel,
      idealStyles: rule.styles,
      requiredAttributes: rule.attributes,
      why: `A vaga ${slot} está vazia ou abaixo do encaixe seguro. Um perfil de ${rule.functionLabel} corrige o equilíbrio sem obrigar mudança da formação.`
    });
  }
  if (!gaps.length && team.styleFit < 85) {
    gaps.push({
      id: 'gap-style-fit', severity: 'opportunity', slot: 'Estrutura coletiva', missingFunction: 'compatibilidade com o estilo',
      idealStyles: ['Funções complementares ao estilo coletivo'], requiredAttributes: ['Resistência', 'Passe', 'Mobilidade', 'Posicionamento'],
      why: team.styleNote
    });
  }
  return gaps.slice(0, 6);
}
