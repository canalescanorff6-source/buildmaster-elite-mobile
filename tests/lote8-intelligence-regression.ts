import { analyzeCard, OFFICIAL_ADDITIONAL_SKILL_NAMES, type PositionCode } from '../src/lib/analyzer';

const sample = `
CONFIRMAÇÃO MANUAL: SIM
NOME: Jogador Teste Elite
POSIÇÃO PRINCIPAL: VOL
ESTILO DE JOGO: O destruidor
PONTOS DE TREINO: 64
Talento ofensivo 71
Controle de bola 80
Drible 76
Condução firme 78
Passe rasteiro 84
Passe alto 82
Finalização 68
Cabeçada 75
Talento defensivo 86
Dedicação defensiva 88
Desarme 87
Agressividade 89
Velocidade 77
Aceleração 75
Força do chute 80
Salto 79
Contato físico 84
Equilíbrio 76
Resistência 88
HABILIDADES: Interceptação, Bloqueador, Passe de primeira
`;

for (const target of ['CB','DMF','AMF','CF'] as PositionCode[]) {
  const result = analyzeCard(sample, 'COMPETITIVE', target);
  if (result.bestPosition.code !== target) throw new Error(`Posição escolhida não preservada: ${target}`);
  if (!result.marginalReturn.length) throw new Error('Retorno marginal vazio');
  if (result.marginalReturn.some(i => i.marginalGain < 1 || i.nextPointCost < 1)) throw new Error('Retorno marginal inválido');
  if (!result.errorTolerance.conservative || !result.errorTolerance.probable || !result.errorTolerance.optimistic) throw new Error('Cenários de tolerância ausentes');
  if (result.skillPriority.ordered.some(i => !OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(i.name as any))) throw new Error('Habilidade não oficial na prioridade');
  if (!result.skillPriority.officialOnly) throw new Error('Guarda oficial falhou');
  if (result.correctionLimit.score < 1 || result.correctionLimit.score > 100) throw new Error('Nota limite inválida');
}
console.log('Lote 8 aprovado: limite, retorno marginal, tolerância e habilidades oficiais.');
