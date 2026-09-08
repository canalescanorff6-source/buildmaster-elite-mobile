import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildSkillWorkflowStateR121,
  deriveSkillVaultStatusR121,
  reconcileSkillProgressR121
} from '../src/modules/vault/skillWorkflowR121';

const skills = ['Interceptação', 'Bloqueador', 'Passe de primeira', 'Liderança', 'Super-sub'];
const state = buildSkillWorkflowStateR121(skills, { Interceptação: true, Bloqueador: true });
assert.equal(state.done, 2);
assert.equal(state.remaining, 3);
assert.equal(state.percent, 40);
assert.deepEqual(state.completed, ['Interceptação', 'Bloqueador']);
assert.deepEqual(state.pending, ['Passe de primeira', 'Liderança', 'Super-sub']);

const reconciled = reconcileSkillProgressR121(skills, { Interceptação: true, 'Chave antiga': true });
assert.equal(reconciled.Interceptação, true);
assert.equal(reconciled.Bloqueador, false);
assert.equal('Chave antiga' in reconciled, false, 'Progresso antigo não deve contaminar um Top 5 recalculado.');
assert.equal(deriveSkillVaultStatusR121(skills, Object.fromEntries(skills.map((skill) => [skill, true]))), 'completo');
assert.equal(deriveSkillVaultStatusR121(skills, { Interceptação: true }), 'pendente');
assert.equal(deriveSkillVaultStatusR121(skills, Object.fromEntries(skills.map((skill) => [skill, true])), 'revisar'), 'revisar');

const root = path.resolve(__dirname, '..');
const workspace = fs.readFileSync(path.join(root, 'src/components/result/ResultWorkspace.tsx'), 'utf8');
const unified = fs.readFileSync(path.join(root, 'src/components/UnifiedPerformanceV3920Panel.tsx'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
const vaultActionsR185 = fs.readFileSync(path.join(root, 'src/hooks/useCardVisionVaultActionsR185.ts'), 'utf8');
const resultActionsR188 = fs.readFileSync(path.join(root, 'src/modules/result/cardVisionResultActionsR188.ts'), 'utf8');

assert.match(workspace, /Você já adicionou esta habilidade\?/);
assert.match(workspace, /Cancelar/);
assert.match(workspace, /Confirmar/);
assert.match(workspace, /requestSkillToggle/);
assert.match(workspace, /requestOwnedSkillReplacement/);
assert.match(unified, /Habilidades adicionadas/);
assert.match(unified, /Habilidades para adicionar/);
assert.match(unified, /Central 2027/);
assert.match(unified, /Fase ofensiva/);
assert.match(unified, /Fase defensiva/);
assert.match(resultActionsR188, /deriveSkillVaultStatusR121/);
assert.match(vaultActionsR185, /Habilidade .* confirmada como adicionada/);
assert.match(resultActionsR188, /habilidade já possuída confirmada/);
assert.doesNotMatch(app, /deriveSkillVaultStatusR121/, 'R188 mantém a derivação de status fora do shell principal.');

console.log('r121 aprovada: confirmação antes de concluir, lista pendente/adicionada, progresso persistente, Cofre coerente e Central 2027 na tela principal.');
