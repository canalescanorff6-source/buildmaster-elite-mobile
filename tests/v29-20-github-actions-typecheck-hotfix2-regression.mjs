import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log(`✓ ${message}`);
};

const app = read('src/components/CardVisionApp.tsx');
const premium = read('src/components/PremiumExperienceLayer.tsx');
const central = read('src/modules/core/centralIntelligence.ts');

assert(
  app.includes('onCreateSnapshot={async () => { await createLocalRestorePoint(); }}'),
  'A ação de criar ponto de restauração resolve como Promise<void>'
);
assert(
  !app.includes('onCreateSnapshot={() => createLocalRestorePoint()}'),
  'O retorno com objeto do snapshot não é repassado ao componente visual'
);
assert(
  !/import\s*\{[^}]*\bCheck\b[^}]*\}\s*from\s*['"]lucide-react['"]/.test(premium),
  'PremiumExperienceLayer não importa o ícone Check sem uso'
);
assert(
  premium.includes('new CustomEvent(toast.actionEvent!)'),
  'O evento opcional do toast é estreitado dentro do callback'
);
assert(
  central.includes('formation: TacticalFormation;'),
  'TeamDiagnosis usa TacticalFormation em vez de string genérica'
);
assert(
  central.includes("formation: blueprint.id as Exclude<TacticalFormation, 'AUTO'>"),
  'O diagnóstico preserva o identificador oficial da formação'
);

console.log('Hotfix 2 do typecheck do GitHub Actions aprovado.');
