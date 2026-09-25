import type { TacticalFormation } from '@/lib/analyzerDomain';
import { FORMATION_BLUEPRINTS } from '@/lib/formationRoleEngine';

export const SETTINGS_COMMANDS_R195 = [
  ['appearance', 'Aparência e acessibilidade', 'Tema, textos, contraste, animações e densidade.', ['visual', 'design'], 'aparencia'],
  ['performance', 'Desempenho do aplicativo', 'Modo econômico, estabilidade e resposta.', ['rápido', 'leve', 'desempenho'], 'desempenho'],
  ['backup', 'Backup e restauração', 'Proteja fichas e configurações antes de atualizar.', ['cofre', 'restaurar'], 'backup'],
  ['updates', 'Atualizações do APK', 'Verifique versão e instalação segura.', ['apk', 'versão'], 'atualizacoes'],
] as const;

export const FORMATION_SELECTION_OPTIONS_R191 = [
  { value: 'AUTO' as TacticalFormation, label: 'Automático inteligente' },
  ...FORMATION_BLUEPRINTS.map((item) => ({
    value: item.id as TacticalFormation,
    label: item.name + ' — ' + (item.family === 'extra' ? 'meta/personalizada' : 'base do app')
  }))
];
