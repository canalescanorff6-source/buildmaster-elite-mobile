import { analyzeCard, POSITION_LABELS, type PositionCode } from '../src/lib/analyzer';

function makeCard(name: string, position: PositionCode, style: string, special: string, attrs: string, objective: 'COMPETITIVE'|'META_2026' = 'COMPETITIVE') {
  return analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: ${name}
TIPO DA CARTA: Epic Booster
POSIÇÃO PRINCIPAL: ${position}
ESTILO DE JOGO: ${style}
HABILIDADE ESPECIAL: ${special}
ALTURA: ${position === 'CB' ? 190 : 178}
PESO: ${position === 'CB' ? 86 : 74}
NÍVEL: 32
PONTOS TOTAIS: 62
${attrs}
[FIM AJUSTES]
`, objective, position);
}

const creator = makeCard('Criador cirúrgico', 'AMF', 'Armador criativo', 'Phenomenal Pass', `
Controle de bola: 93
Drible: 88
Condução firme: 92
Passe rasteiro: 95
Passe alto: 92
Finalização: 73
Talento ofensivo: 84
Velocidade: 77
Aceleração: 82
Equilíbrio: 89
Resistência: 81
`);

const finisher = makeCard('Finalizador cirúrgico', 'AMF', 'Jogador de infiltração', 'Phenomenal Finishing', `
Controle de bola: 86
Drible: 88
Condução firme: 85
Passe rasteiro: 78
Passe alto: 74
Finalização: 94
Talento ofensivo: 93
Velocidade: 87
Aceleração: 91
Força do chute: 92
Equilíbrio: 84
Resistência: 82
`);

for (const result of [creator, finisher]) {
  const precision = result.maxPrecision;
  if (!precision) throw new Error('Análise de precisão máxima não foi gerada.');
  if (precision.alternatives.length !== 5) throw new Error('O Lote 17 deve comparar exatamente cinco alternativas.');
  if (precision.finalAttributes.length < 6) throw new Error('Atributos finais reais insuficientes.');
  if (precision.actions.length !== 12) throw new Error('Simulação de ações em campo incompleta.');
  if (!precision.pointAudit.length) throw new Error('Auditoria ponto por ponto ausente.');
  if (precision.meta2026.patchReference !== 'v5.5.0') throw new Error('Referência do meta atual incorreta.');
  if (precision.meta2026.classification !== 'tendência competitiva editável') throw new Error('Meta foi tratado como regra oficial.');
  if (precision.versionIdentity.signature.length < 8) throw new Error('Assinatura de versão inválida.');
  if (result.trainingPointsUsed > result.trainingPointsTotal) throw new Error('Orçamento excedido no Lote 17.');
  if (result.bestPosition.code !== 'AMF') throw new Error('Posição escolhida foi alterada.');
}

if (creator.maxPrecision!.versionIdentity.signature === finisher.maxPrecision!.versionIdentity.signature) throw new Error('Versões opostas receberam a mesma assinatura.');
if (JSON.stringify(creator.training) === JSON.stringify(finisher.training)) throw new Error('Cartas opostas ainda receberam ficha igual.');
const creatorPass = creator.maxPrecision!.finalAttributes.find(x=>x.attribute==='lowPass')!;
const finisherFinish = finisher.maxPrecision!.finalAttributes.find(x=>x.attribute==='finishing')!;
if (creatorPass.after <= finisher.maxPrecision!.finalAttributes.find(x=>x.attribute==='lowPass')!.after) throw new Error('Criador não manteve vantagem de passe.');
if (finisherFinish.after <= creator.maxPrecision!.finalAttributes.find(x=>x.attribute==='finishing')!.after) throw new Error('Finalizador não manteve vantagem de finalização.');
if (!creator.maxPrecision!.deepSkills.some(x=>x.name==='Phenomenal Pass')) throw new Error('Phenomenal Pass ausente da precisão profunda.');
if (!finisher.maxPrecision!.deepSkills.some(x=>x.name==='Phenomenal Finishing')) throw new Error('Phenomenal Finishing ausente da precisão profunda.');

const metaDefender = makeCard('Defensor meta', 'CB', 'O destruidor', 'Esticada de Perna', `
Talento defensivo: 90
Dedicação defensiva: 91
Desarme: 92
Agressividade: 88
Velocidade: 78
Aceleração: 77
Contato físico: 91
Cabeçada: 88
Salto: 87
Passe rasteiro: 75
Resistência: 86
`, 'META_2026');
if (!metaDefender.maxPrecision || metaDefender.maxPrecision.meta2026.playerMetaFit < 70) throw new Error('Encaixe meta do defensor não foi calculado.');
if (!metaDefender.maxPrecision.deepSkills.some(x=>x.name==='Esticada de Perna')) throw new Error('Esticada de Perna não foi aproveitada.');

for (const item of POSITION_LABELS.filter(x=>x.code!=='AUTO')) {
  const position=item.code as PositionCode;
  const result=analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Teste ${position}
POSIÇÃO PRINCIPAL: ${position}
ESTILO DE JOGO: ${position==='GK'?'Goleiro ofensivo':'Orquestrador'}
PONTOS TOTAIS: 62
Controle de bola: 82
Passe rasteiro: 84
Passe alto: 82
Finalização: 80
Talento ofensivo: 82
Talento defensivo: 82
Dedicação defensiva: 82
Desarme: 82
Velocidade: 82
Aceleração: 82
Contato físico: 82
Equilíbrio: 82
Resistência: 84
Talento de GO: 86
Firmeza de GO: 84
Defesa de GO: 85
Reflexos de GO: 88
Alcance de GO: 87
[FIM AJUSTES]
`, 'META_2026', position);
  if (!result.maxPrecision) throw new Error(`Precisão máxima ausente em ${position}.`);
  if (result.bestPosition.code!==position) throw new Error(`Posição ${position} não foi preservada.`);
  if (result.maxPrecision.alternatives.some(x=>Object.values(x.training).some(v=>v<0||v>16))) throw new Error(`Treino inválido em ${position}.`);
}

console.log('OK: v25.84–v25.96 entrega identidade da versão, atributos finais, faixas individuais, proteção, conversão, habilidades, ações, anticlone rígido, auditoria e Meta 2026 editável.');
