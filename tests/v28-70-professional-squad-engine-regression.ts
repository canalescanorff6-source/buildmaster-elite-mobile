import assert from 'node:assert/strict';
import { analyzeCard, type PositionCode } from '../src/lib/analyzer';
import { PROFESSIONAL_SQUAD_VERSION, buildProfessionalSquadReport } from '../src/lib/professionalSquadEngine';

const specs: Array<[string, PositionCode, string]> = [
  ['Goleiro Titular', 'GK', 'Goleiro defensivo'],
  ['Goleiro Reserva', 'GK', 'Goleiro ofensivo'],
  ['Zagueiro Criativo Alfa', 'CB', 'Defensor Criativo'],
  ['Zagueiro Criativo Beta', 'CB', 'Defensor Criativo'],
  ['Zagueiro Criativo Gama', 'CB', 'Defensor Criativo'],
  ['Zagueiro Combate', 'CB', 'Destruidor'],
  ['Lateral Esquerdo', 'LB', 'Lateral Defensivo'],
  ['Lateral Esquerdo Banco', 'LB', 'Perito em Cruzamento'],
  ['Lateral Direito', 'RB', 'Lateral Defensivo'],
  ['Lateral Direito Banco', 'RB', 'Perito em Cruzamento'],
  ['Volante Âncora', 'DMF', '1º Volante'],
  ['Volante Reserva', 'DMF', 'Meia versátil'],
  ['Meia Completo', 'CMF', 'Meia versátil'],
  ['Meia Organizador', 'CMF', 'Orquestrador'],
  ['Armador Central', 'AMF', 'Armador Criativo'],
  ['Meia Infiltrador', 'AMF', 'Infiltração'],
  ['Segundo Atacante', 'SS', 'Puxa Marcação'],
  ['Centroavante Artilheiro', 'CF', 'Artilheiro'],
  ['Centroavante Pivô', 'CF', 'Pivô'],
  ['Centroavante Área', 'CF', 'Homem de Área'],
  ['Ponta Esquerda', 'LWF', 'Ala Produtivo'],
  ['Ponta Direita', 'RWF', 'Ala Produtivo']
];

function makeResult([name, position, playstyle]: [string, PositionCode, string], index: number) {
  const attackBoost = ['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(position) ? 8 : 0;
  const defenseBoost = ['CB', 'LB', 'RB', 'DMF'].includes(position) ? 9 : 0;
  const keeperBoost = position === 'GK' ? 12 : 0;
  return analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: ${name}
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: ${position}
ESTILO DE JOGO: ${playstyle}
PONTOS TOTAIS: 60
Talento ofensivo: ${80 + attackBoost}
Controle de bola: ${82 + Math.min(5, attackBoost)}
Drible: ${79 + Math.min(6, attackBoost)}
Condução firme: 82
Passe rasteiro: ${83 + (['CMF','AMF','DMF'].includes(position) ? 5 : 0)}
Passe alto: 82
Finalização: ${78 + attackBoost}
Cabeçada: ${80 + (position === 'CB' || position === 'CF' ? 7 : 0)}
Talento defensivo: ${77 + defenseBoost}
Dedicação defensiva: ${77 + defenseBoost}
Desarme: ${78 + defenseBoost}
Velocidade: ${82 + (['LWF','RWF','LB','RB'].includes(position) ? 5 : 0)}
Aceleração: ${82 + (['CF','SS','LWF','RWF','AMF'].includes(position) ? 5 : 0)}
Força do chute: 84
Salto: 83
Contato físico: ${82 + (position === 'CB' || position === 'CF' ? 5 : 0)}
Equilíbrio: 82
Resistência: 86
Consciência de goleiro: ${78 + keeperBoost}
Defesa do goleiro: ${78 + keeperBoost}
Alcance do goleiro: ${78 + keeperBoost}
Reflexos do goleiro: ${78 + keeperBoost}
Cobertura do goleiro: ${78 + keeperBoost}
HABILIDADES: Passe de primeira, Interceptação, Chute de primeira
[FIM AJUSTES]
`, position === 'GK' ? 'GOALKEEPER' : 'COMPETITIVE', position, `v2870-${index}.png`, {
    formation: '4-2-2-2',
    style: 'POSSE_DE_BOLA'
  });
}

const results = specs.map(makeResult);
const startedAt = Date.now();
const report = buildProfessionalSquadReport(results, '4-2-2-2', 'POSSE_DE_BOLA');
const elapsed = Date.now() - startedAt;

assert.ok(report);
assert.equal(PROFESSIONAL_SQUAD_VERSION, '28.70.0');
assert.equal(report!.version, '28.70.0');
assert.equal(report!.playerCount, specs.length);
assert.equal(report!.current.formation, '4-2-2-2');
assert.equal(report!.current.style, 'POSSE_DE_BOLA');
assert.equal(report!.current.filledSlots, 11);
assert.ok(report!.current.naturalFits >= 8);
assert.ok(report!.formationRanking.length >= 6);
assert.equal(new Set(report!.formationRanking.map((item) => item.formation)).size, report!.formationRanking.length);
assert.ok(report!.formationRanking.every((item) => item.score >= 0 && item.score <= 100));
assert.ok(report!.formationRanking.every((item) => item.filledSlots <= 11));
assert.ok(report!.bestFormation.score >= report!.formationRanking.at(-1)!.score);

assert.deepEqual(report!.sectors.map((item) => item.id), ['goleiro', 'defesa', 'meio', 'ataque']);
assert.ok(report!.sectors.every((item) => item.starters.length > 0));
assert.ok(report!.sectors.every((item) => item.score >= 0 && item.score <= 100));
assert.ok(report!.repeatedFunctions.some((item) => /Defensor Criativo/i.test(item.role)));

assert.deepEqual(report!.benchUnits.map((item) => item.id), ['goleiro', 'defesa', 'meio', 'criacao', 'ataque']);
assert.ok(report!.benchUnits.some((item) => item.players.length > 0));
assert.deepEqual(report!.scenarios.map((item) => item.id), ['controlar', 'buscar', 'proteger']);
assert.ok(report!.scenarios.every((item) => item.objective.length > 20));
assert.ok(report!.scenarios.some((item) => item.substitutions.length > 0));

assert.deepEqual(report!.plans.map((item) => item.id), ['A', 'B', 'C']);
for (const plan of report!.plans) {
  assert.equal(plan.lineup.length, 11);
  const ids = plan.lineup.map((item) => item.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, `Plano ${plan.id} não pode repetir a mesma carta.`);
  assert.ok(plan.objective.length > 20);
}
assert.deepEqual(report!.opponentPlans.map((item) => item.id), ['POSSE', 'CONTRA_RAPIDO', 'BLOCO_BAIXO', 'POR_FORA']);
assert.ok(report!.opponentPlans.every((item) => item.adjustments.length === 3));
assert.ok(report!.safeguards.some((item) => item.includes('posição escolhida')));
assert.ok(report!.safeguards.some((item) => item.includes('Nenhuma formação')));
assert.ok(elapsed < 12000, `Motor profissional demorou ${elapsed} ms no teste controlado.`);

const autoReport = buildProfessionalSquadReport(results, 'AUTO', 'AUTO');
assert.ok(autoReport);
assert.equal(autoReport!.current.formation, '4-2-2-2');
assert.equal(autoReport!.current.style, 'POSSE_DE_BOLA');

console.log(`v28.70 professional squad engine regression: ok (${elapsed} ms)`);
