import fs from 'node:fs';

const search = fs.readFileSync('src/components/PremiumSearchScreen.tsx', 'utf8');
const palette = fs.readFileSync('src/components/AppCommandPalette.tsx', 'utf8');
const appearance = fs.readFileSync('src/components/IdentityAppearancePanel.tsx', 'utf8');
const formation = fs.readFileSync('src/components/FormationRoleLabPanel.tsx', 'utf8');
const team = fs.readFileSync('src/modules/squad/IntegratedTeamLab.tsx', 'utf8');
const checker = fs.readFileSync('scripts/check-interactive-contracts.mjs', 'utf8');

const failures = [];
function expect(condition, message) { if (!condition) failures.push(message); }
expect(search.includes('readRecentCommandIdsR152'), 'Busca Premium precisa carregar histórico real por conta.');
expect(search.includes('recordRecentCommandR152'), 'Busca Premium precisa registrar comandos realmente executados.');
expect(search.includes('clearRecentCommandsR152'), 'Busca Premium precisa permitir limpar o histórico.');
expect(!search.includes('<button type="button">Ver todas</button>'), 'Botão morto "Ver todas" não pode retornar.');
expect(!search.includes('const suggestions = commands.slice(0, 4)'), 'Primeiros comandos não podem voltar a ser rotulados como buscas recentes.');
expect(palette.includes('recordRecentCommandR152(command.id)'), 'Paleta global também precisa alimentar o histórico recente.');
expect(appearance.includes('appearance-preview-action') && !appearance.includes('<button type="button" tabIndex={-1}>Ação principal</button>'), 'Prévia de aparência deve ser visual, não botão morto.');
expect(formation.includes('return <div key={pick.slot.id} className={`formation-pitch-slot'), 'Slots não interativos da formação devem usar elemento semântico não-botão.');
expect(team.includes('<div className={`bm32-squad-card'), 'Cards estáticos da escalação não devem fingir ser botões.');
expect(checker.includes('botão type="button" sem ação explícita'), 'Checker global precisa bloquear novos botões sem ação.');

if (failures.length) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log('R152 aprovado: fronteira contra botões mortos e busca recente real preservadas.');
