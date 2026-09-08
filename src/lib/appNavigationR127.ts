import { safeStorageGetJson, safeStorageSetJson } from './safeLocalStorage';

export type MainNavigationGroup = 'inicio' | 'jogadores' | 'mapeamento' | 'time' | 'partidas' | 'ajustes';
export type PlayerWorkspace = 'visao-geral' | 'leitor' | 'manual' | 'resultado' | 'cofre';
export type CardVisionVaultView = 'jogadores' | 'organizar' | 'comparar' | 'backup';
export type CardVisionSettingsView = 'visao-geral' | 'evolucao' | 'experiencia' | 'aparencia' | 'desempenho' | 'seguranca' | 'suporte' | 'comunidade' | 'comercial' | 'publicacao' | 'backup' | 'atualizacoes' | 'contas';
export type NavigationSnapshot = {
  version: 2;
  group: MainNavigationGroup;
  playerWorkspace?: PlayerWorkspace;
  scrollY: number;
  updatedAt: string;
};

export const NAVIGATION_STATE_KEY = 'buildmaster_navigation_state_v2810';
const LEGACY_NAVIGATION_STATE_KEY = 'buildmaster_navigation_state_v2739';

export const APP_NAVIGATION_R127_VERSION = '40.80-r127-navigation-model-v1' as const;

export type MainSection = 'inicio' | 'jogadores' | 'mapeamento' | 'partidas' | 'leitor' | 'manual' | 'resultado' | 'cofre' | 'time' | 'ajustes' | 'menu' | 'buscar';
export type MainNavigationIcon = 'dashboard' | 'scan' | 'manual' | 'result' | 'vault' | 'team' | 'settings';
export type MainNavigationItem = { id: MainSection; label: string; hint: string; icon: MainNavigationIcon; disabled?: boolean };

export function navigationGroupFor(section: MainSection): MainNavigationGroup {
  if (section === 'inicio' || section === 'mapeamento' || section === 'time' || section === 'partidas' || section === 'ajustes') return section;
  if (section === 'menu') return 'ajustes';
  return 'jogadores';
}

export function playerWorkspaceFor(section: MainSection): PlayerWorkspace {
  if (section === 'leitor' || section === 'manual' || section === 'resultado' || section === 'cofre') return section;
  return 'visao-geral';
}

export function sectionForNavigation(group: MainNavigationGroup, workspace: PlayerWorkspace = 'visao-geral'): MainSection {
  if (group !== 'jogadores') return group;
  return workspace === 'visao-geral' ? 'jogadores' : workspace;
}

export function buildMainNavigationR127(input: { historyCount: number; matchCount: number; hasResult: boolean }): MainNavigationItem[] {
  const { historyCount, matchCount, hasResult } = input;
  return [
    { id: 'inicio', label: 'Central', hint: 'Resumo do app', icon: 'dashboard' },
    { id: 'jogadores', label: 'Jogadores', hint: `${historyCount} salvos`, icon: 'vault' },
    { id: 'mapeamento', label: 'Mapeamento', hint: 'Melhor time e reservas', icon: 'team' },
    { id: 'time', label: 'Meu Time', hint: 'Formação e elenco', icon: 'team' },
    { id: 'partidas', label: 'Partidas', hint: `${matchCount} análises`, icon: 'result' },
    { id: 'ajustes', label: 'Configurações', hint: 'Visual, conta e sistema', icon: 'settings' },
    { id: 'menu', label: 'Menu', hint: 'Atalhos e módulos', icon: 'settings' },
    { id: 'buscar', label: 'Buscar', hint: 'Pesquisa global', icon: 'vault' },
    { id: 'leitor', label: 'Ler print', hint: 'Importar e analisar', icon: 'scan' },
    { id: 'manual', label: 'Criar manual', hint: 'Preencher sem print', icon: 'manual' },
    { id: 'resultado', label: 'Resultado', hint: hasResult ? 'Ficha atual' : 'Sem ficha', icon: 'result', disabled: !hasResult },
    { id: 'cofre', label: 'Cofre', hint: `${historyCount} fichas salvas`, icon: 'vault' }
  ];
}

/** R176 — persistência/deep link leves junto ao modelo canônico de navegação. */
export function readNavigationSnapshot(): NavigationSnapshot | null {
  const value = safeStorageGetJson<NavigationSnapshot | null>(NAVIGATION_STATE_KEY, null);
  if (value?.version === 2) return value;
  const legacy = safeStorageGetJson<(Omit<NavigationSnapshot, 'version'> & { version: 1 }) | null>(LEGACY_NAVIGATION_STATE_KEY, null);
  if (!legacy || legacy.version !== 1) return null;
  const migrated: NavigationSnapshot = { ...legacy, version: 2 };
  safeStorageSetJson(NAVIGATION_STATE_KEY, migrated);
  return migrated;
}

export function writeNavigationSnapshot(snapshot: Omit<NavigationSnapshot, 'version' | 'updatedAt'>) {
  safeStorageSetJson(NAVIGATION_STATE_KEY, { version: 2, updatedAt: new Date().toISOString(), ...snapshot } satisfies NavigationSnapshot);
}

export function parseInternalDeepLink(hash: string): { group: MainNavigationGroup; workspace?: PlayerWorkspace } | null {
  const clean = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (!clean) return null;
  const [group, workspace] = clean.split('/');
  if (!['inicio', 'jogadores', 'mapeamento', 'time', 'partidas', 'ajustes'].includes(group)) return null;
  if (group !== 'jogadores') return { group: group as MainNavigationGroup };
  const validWorkspace = ['visao-geral', 'leitor', 'manual', 'resultado', 'cofre'].includes(workspace || '') ? workspace as PlayerWorkspace : 'visao-geral';
  return { group: 'jogadores', workspace: validWorkspace };
}

