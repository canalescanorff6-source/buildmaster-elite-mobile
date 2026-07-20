import fs from 'node:fs';
import { FORMATION_BLUEPRINTS, buildFormationLineup } from '../src/lib/formationRoleEngine';
import { createTacticalPosterSvg, defaultTacticalPosterInstructions } from '../src/lib/tacticalPoster';

const formation = FORMATION_BLUEPRINTS.find((item) => item.id === '4-2-2-2') ?? FORMATION_BLUEPRINTS[0];
const lineup = buildFormationLineup([], formation);
const style = 'POSSE_DE_BOLA' as const;
const svg = createTacticalPosterSvg({
  title: 'BuildMaster Elite Tático 2026',
  subtitle: `${formation.name} • Base curta`,
  focus: 'Segurança, construção curta e finalização inteligente.',
  formation,
  lineup,
  style,
  palette: 'ouro',
  orientation: 'vertical',
  options: { showScores: false, showPlayerNames: false },
  playerOverrides: Object.fromEntries(lineup.map((pick) => [pick.slot.id, { role: pick.slot.duty }])),
  instructions: defaultTacticalPosterInstructions(formation, style)
});
fs.writeFileSync('docs/current/AMOSTRA_ESTUDIO_TATICO_V27_32.svg', svg);
