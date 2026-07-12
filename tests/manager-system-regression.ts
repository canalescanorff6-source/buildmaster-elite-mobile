import assert from 'node:assert/strict';
import { MANAGERS, getManager } from '../src/lib/managers';
import { analyzeCard } from '../src/lib/analyzer';

assert.ok(MANAGERS.length >= 20, 'A base inicial deve conter os técnicos informados.');
assert.equal(new Set(MANAGERS.map((item) => item.id)).size, MANAGERS.length, 'Cada versão precisa de ID único.');
for (const manager of MANAGERS) {
  assert.ok(manager.primaryProficiency >= 80 && manager.primaryProficiency <= 100);
  assert.equal(getManager(manager.id)?.name, manager.name);
}
const manager = getManager('martinez-qc-90')!;
const text = 'Nome: Jogador Teste\nPosição: VOL\nEstilo: O Destruidor\nPontos de treino: 40\nVelocidade: 78\nAceleração: 77\nConsciência defensiva: 82\nDesarme: 83\nContato físico: 80\nPasse rasteiro: 76';
const result = analyzeCard(text, 'COMPETITIVE', 'CB', 'teste.png', { formation:'4-2-2-2', style:manager.primaryStyle, managerId:manager.id, managerName:manager.name, managerProficiency:manager.primaryProficiency, managerBooster:manager.booster });
assert.equal(result.bestPosition.code, 'CB', 'O técnico não pode trocar a posição escolhida.');
assert.match(result.teamMap.coachFit, /Roberto Martínez/);
assert.ok(result.profileTips.some((tip) => tip.includes('Roberto Martínez')));
console.log(`Manager regression OK: ${MANAGERS.length} versões validadas.`);
