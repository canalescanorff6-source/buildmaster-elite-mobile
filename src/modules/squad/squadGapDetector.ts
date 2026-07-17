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

const PROFILE_RULES: Array<{ match: RegExp; styles: string[]; attributes: string[]; functionLabel: string }> = [
  { match: /vol|defens|cobertura|primeiro volante/i, styles: ['1º Volante', 'Volante Destruidor'], attributes: ['Consciência defensiva', 'Desarme', 'Contato físico', 'Passe rasteiro'], functionLabel: 'proteção central' },
  { match: /orquestr|saida|constr|passe/i, styles: ['Orquestrador', 'Meia versátil'], attributes: ['Passe rasteiro', 'Passe alto', 'Controle de bola', 'Resistência'], functionLabel: 'saída de bola' },
  { match: /artilheiro|homem de area|finaliz/i, styles: ['Artilheiro', 'Homem de Área'], attributes: ['Talento ofensivo', 'Finalização', 'Aceleração', 'Equilíbrio'], functionLabel: 'finalização' },
  { match: /pivo|puxa marcacao|apoio/i, styles: ['Pivô', 'Puxa Marcação'], attributes: ['Controle de bola', 'Contato físico', 'Passe rasteiro', 'Equilíbrio'], functionLabel: 'apoio ao ataque' },
  { match: /lateral|ala|corredor/i, styles: ['Lateral defensivo', 'Lateral móvel', 'Perito em Cruzamento'], attributes: ['Velocidade', 'Resistência', 'Passe alto', 'Consciência defensiva'], functionLabel: 'cobertura de corredor' },
  { match: /zagueiro|zag|defensor/i, styles: ['Defensor Criativo', 'Destruidor'], attributes: ['Consciência defensiva', 'Desarme', 'Velocidade', 'Contato físico'], functionLabel: 'proteção da área' },
  { match: /mat|criacao|armador|infiltr/i, styles: ['Armador Criativo', 'Infiltração', 'Clássico 10'], attributes: ['Controle de bola', 'Passe rasteiro', 'Condução firme', 'Aceleração'], functionLabel: 'criação entrelinhas' },
  { match: /goleiro|gol/i, styles: ['Goleiro Ofensivo', 'Goleiro Defensivo'], attributes: ['Talento de goleiro', 'Reflexo', 'Alcance', 'Espalmada'], functionLabel: 'proteção do gol' }
];

export function detectSquadGaps(team: TeamDiagnosis): SquadGap[] {
  const gaps: SquadGap[] = [];
  for (const [index, missing] of team.missingRoles.entries()) {
    const [slot, description = missing] = missing.split(':').map((item) => item.trim());
    const rule = PROFILE_RULES.find((item) => item.match.test(description)) ?? {
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
