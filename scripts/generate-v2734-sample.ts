import fs from 'node:fs';
import { FORMATION_BLUEPRINTS, buildFormationLineup } from '../src/lib/formationRoleEngine';
import {
  createDefaultTacticalPosterArrows,
  createTacticalPosterSvg,
  defaultTacticalPosterInstructions
} from '../src/lib/tacticalPoster';

const formation = FORMATION_BLUEPRINTS.find((item) => item.id === '4-2-2-2') ?? FORMATION_BLUEPRINTS[0];
const lineup = buildFormationLineup([], formation);
const style = 'POSSE_DE_BOLA' as const;
const manualArrows = createDefaultTacticalPosterArrows(lineup).slice(0, 12).map((arrow, index) => ({
  ...arrow,
  label: index === 0 ? 'apoio curto' : index === 3 ? 'reciclar' : arrow.label
}));

const svg = createTacticalPosterSvg({
  title: 'BuildMaster Elite Tático 2026',
  subtitle: `${formation.name} • Estilos oficiais • v27.35`,
  focus: 'Meta 2026: segurança, construção curta, compactação e finalização inteligente.',
  formation,
  lineup,
  style,
  palette: 'ouro',
  orientation: 'vertical',
  options: {
    showArrows: true,
    showLegend: true,
    showInstructionPanels: true,
    showPrinciples: true,
    showPlayerNames: false,
    showScores: false,
    showFooter: true
  },
  customColors: {
    accent: '#f4c542',
    secondary: '#20d7e4',
    danger: '#ff5c63',
    field: '#24532d'
  },
  useAutomaticArrows: false,
  manualArrows,
  instructions: defaultTacticalPosterInstructions(formation, style)
});

fs.writeFileSync('docs/current/AMOSTRA_ESTUDIO_TATICO_V27_34.svg', svg);
console.log('Amostra SVG v27.35 gerada com estilos oficiais do jogador.');
