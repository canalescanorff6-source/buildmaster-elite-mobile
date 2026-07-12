import { strict as assert } from 'node:assert';
import { readOpponentPrintText } from '../src/lib/opponentPrintReader';

const clear = readOpponentPrintText(`Roberto Martínez\nContra-Ataque Rápido\n4-2-3-1\nVelocidade\nFinalização`);
assert.equal(clear.formation.value, '4-2-3-1');
assert.equal(clear.profile.value, 'CONTRA_RAPIDO');
assert.equal(clear.manager.value, 'Roberto Martínez');
assert.ok(['alta','média'].includes(clear.overallConfidence));

const uncertain = readOpponentPrintText('print ruim sem dados úteis');
assert.equal(uncertain.formation.value, null);
assert.equal(uncertain.profile.value, null);
assert.ok(uncertain.warnings.length >= 1);
console.log('opponent print regression ok');
