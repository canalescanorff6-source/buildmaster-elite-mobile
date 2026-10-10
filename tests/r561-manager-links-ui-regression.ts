/**
 * R561 Item 1 — regressão leve dos estados e da ligação dos componentes.
 * Execute: node -r ./tests/_ts-require.cjs tests/r561-manager-links-ui-regression.ts
 * Renderização visual no navegador requer validação adicional (Next.js/React).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getManager } from '../src/lib/managers';
import { evaluateManagerLinksR560, type SquadMemberR560 } from '../src/lib/managerLinkEngineR560';

const manager = getManager('r-rodriguez-posse-88-2026-10-01');
assert.ok(manager, 'O treinador da R560 precisa existir');
const squad: SquadMemberR560[] = [
  { playerName: 'Volante', position: 'DMF', playstyle: 'Orquestrador' },
  { playerName: 'Meia', position: 'AMF', playstyle: 'Armador criativo' },
  { playerName: 'Centroavante', position: 'CF', playstyle: 'Artilheiro' },
  ...Array.from({ length: 8 }, (_, index) => ({ playerName: `Titular ${index + 4}`, position: 'CB' as const, playstyle: 'Defensor criativo' }))
];
assert.deepEqual(evaluateManagerLinksR560(manager, squad).map((v) => v.status), ['PENDENTE', 'PENDENTE']);
assert.deepEqual(evaluateManagerLinksR560(manager, squad, { lineupConfirmed: true }).map((v) => v.status), ['ATIVO', 'ATIVO']);
assert.deepEqual(evaluateManagerLinksR560(manager, squad.filter((member) => member.position !== 'DMF'), { lineupConfirmed: true }).map((v) => v.status), ['INATIVO', 'ATIVO']);

const component = readFileSync(resolve(__dirname, '../src/modules/squad/IntegratedTeamLab.tsx'), 'utf8');
const caller = readFileSync(resolve(__dirname, '../src/components/CardVisionApp.tsx'), 'utf8');
assert.match(component, /selectedManager\?: ManagerRecord \| null/, 'Prop de técnico deve ser retrocompatível');
assert.match(component, /evaluateManagerLinksR560\(selectedManager, squadR561/, 'UI deve usar o motor da R560');
assert.match(component, /lineupConfirmedR561 = squadCompleteR561 && confirmedLineupKeyR561 === confirmationKeyR561/, 'Confirmação vinculada à escalação');
assert.match(component, /cardIdentityFingerprintR126\(fit\.player\.parsed\)/, 'A confirmação deve depender da identidade da carta');
assert.match(component, /<ManagerLinksPanelR561/, 'Painel deve estar presente na tela Meu Time');
assert.match(component, /<div className="bm32-team-pitch"/, 'O campo original deve continuar presente');
assert.match(component, /className="bm32-team-bench-strip"/, 'O banco original deve continuar presente');
assert.match(caller, /<IntegratedTeamLab[^>]*selectedManager=\{selectedManager\}/, 'O técnico do estado principal deve chegar à tela');
assert.ok(component.indexOf('<ManagerLinksPanelR561') < component.indexOf('<section className="bm32-team-pitch-panel"'), 'O painel não pode se sobrepor ao campo');
console.log('R561 Item 1: estados do motor, confirmação e conexão do técnico GREEN (verificações sem renderização)');
