import type { TacticalFormation } from '@/lib/analyzerDomain';
import { FORMATION_BLUEPRINTS } from '@/lib/formationRoleEngine';

export const SETTINGS_COMMANDS_R195 = [
  ['evolution-360', 'Abrir Evolução 360', 'Pendências, metas, foco, rotinas guiadas, experiência adaptável, diagnóstico e manutenção.', ['evolução', 'metas', 'saúde', 'notificações', 'rotinas', 'diagnóstico', 'contraste', 'letras'], 'evolucao'],
  ['premium-experience', 'Experiência Premium 2.0', 'Atalhos, retomada, rascunhos, pesquisa e ajuda.', ['favoritos', 'continuar', 'rascunho', 'ajuda'], 'experiencia'],
  ['appearance', 'Aparência e acessibilidade', 'Tema, textos, contraste, animações e densidade.', ['visual', 'design'], 'aparencia'],
  ['performance', 'Desempenho do aplicativo', 'Ative o modo econômico e revise estabilidade.', ['rápido', 'leve', 'delay'], 'desempenho'],
  ['security', 'Segurança e integridade', 'Saúde local, diagnóstico e compatibilidade.', ['proteção', 'erros'], 'seguranca'],
  ['support', 'Observabilidade e suporte', 'Saúde da versão, falhas, lentidão e pacote técnico.', ['diagnóstico', 'erro', 'suporte', 'feature flags'], 'suporte'],
  ['backup', 'Backup e restauração', 'Proteja fichas e configurações antes de atualizar.', ['cofre', 'restaurar'], 'backup'],
  ['updates', 'Atualizações do APK', 'Verifique versão, manifesto e instalação segura.', ['apk', 'versão'], 'atualizacoes'],
] as const;

export const FORMATION_SELECTION_OPTIONS_R191 = [
  { value: 'AUTO' as TacticalFormation, label: 'Automático inteligente' },
  ...FORMATION_BLUEPRINTS.map((item) => ({
    value: item.id as TacticalFormation,
    label: item.name + ' — ' + (item.family === 'extra' ? 'meta/personalizada' : 'base do app')
  }))
];
