import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const panel=readFileSync(new URL('../src/components/UnifiedPerformanceV3920Panel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/app/v39-unified-performance.css',import.meta.url),'utf8');

assert.match(panel,/if \(cleanSlate\)/,'A UI deve priorizar r119 mesmo quando diagnósticos históricos existirem.');
assert.match(panel,/TrainingProgressionIconR106/,'A ficha final precisa reutilizar os ícones visuais de progressão já existentes no projeto.');
assert.match(panel,/5 habilidades adicionais/,'O Top 5 precisa ficar explícito, não escondido em chips genéricos.');
assert.match(panel,/OFFICIAL_ADDITIONAL_SKILL_DESCRIPTIONS/,'Cada habilidade precisa exibir sua descrição oficial cadastrada no projeto.');
assert.match(panel,/OfficialSkillIconR119/,'Cada habilidade deve usar o registro visual individual do r119.');
assert.doesNotMatch(panel,/function skillVisualKind/,'A UI não pode voltar ao mapeamento de apenas sete ícones genéricos por família.');
assert.match(panel,/impetoIdeal/,'A UI precisa mostrar o Ímpeto ideal mesmo quando a vaga ainda exige confirmação.');
assert.match(panel,/Confirmar vaga antes de gastar/,'Vaga desconhecida deve ser explicada sem apagar o candidato ideal.');
assert.match(panel,/Prioridade funcional estimada/,'Ações não podem ser apresentadas como frequência real se são uma estimativa funcional.');
assert.match(css,/\.r119-training-icons/);
assert.match(css,/\.r119-skill-list/);
assert.match(css,/\.r119-skill-glyph/);
assert.match(css,/\.r119-impeto-card/);

console.log('r119 UI aprovada: ícones da ficha, Top 5 explícito e Ímpeto ideal com estado de gasto.');
