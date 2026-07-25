export const ARCHITECTURE_VERSION = '29.30.0';

export type BuildMasterDomain = 'shell' | 'reader' | 'analysis' | 'rules' | 'vault' | 'squad' | 'training' | 'matches' | 'backup' | 'administration' | 'updates' | 'quality';

export type ArchitectureModuleDefinition = {
  id: string;
  domain: BuildMasterDomain;
  label: string;
  load: 'eager' | 'lazy';
  owns: string[];
  dependsOn: BuildMasterDomain[];
  failureBoundary: string;
};

export const ARCHITECTURE_MODULES: readonly ArchitectureModuleDefinition[] = [
  { id: 'app-shell', domain: 'shell', label: 'Navegação e sessão', load: 'eager', owns: ['rotas', 'preferências', 'sessão ativa'], dependsOn: [], failureBoundary: 'app-shell' },
  { id: 'ocr-vision', domain: 'reader', label: 'OCR Vision 2.0', load: 'lazy', owns: ['imagem', 'zonas', 'duas passagens', 'evidências'], dependsOn: ['rules'], failureBoundary: 'ocr-vision' },
  { id: 'analysis-facade', domain: 'analysis', label: 'Motor de análise', load: 'lazy', owns: ['posição escolhida', 'pontos', 'habilidades', 'justificativas'], dependsOn: ['rules'], failureBoundary: 'analysis' },
  { id: 'official-rules', domain: 'rules', label: 'Base oficial versionada', load: 'lazy', owns: ['posições', 'estilos', 'habilidades', 'regras por carta'], dependsOn: [], failureBoundary: 'official-rules' },
  { id: 'vault', domain: 'vault', label: 'Cofre', load: 'lazy', owns: ['fichas salvas', 'pastas', 'histórico'], dependsOn: ['analysis'], failureBoundary: 'vault' },
  { id: 'squad', domain: 'squad', label: 'Meu Time', load: 'lazy', owns: ['elenco', 'escalações', 'planos'], dependsOn: ['vault'], failureBoundary: 'squad' },
  { id: 'training', domain: 'training', label: 'Treinos', load: 'lazy', owns: ['sessões', 'metas', 'evolução'], dependsOn: ['matches'], failureBoundary: 'training' },
  { id: 'matches', domain: 'matches', label: 'Partidas', load: 'lazy', owns: ['resultados', 'erros', 'relatórios'], dependsOn: ['squad'], failureBoundary: 'matches' },
  { id: 'backup', domain: 'backup', label: 'Backup e nuvem', load: 'lazy', owns: ['exportação', 'restauração', 'sincronização'], dependsOn: ['vault', 'training', 'matches'], failureBoundary: 'backup' },
  { id: 'administration', domain: 'administration', label: 'Administração', load: 'lazy', owns: ['contas', 'aparelhos', 'auditoria'], dependsOn: [], failureBoundary: 'administration' },
  { id: 'updates', domain: 'updates', label: 'Atualização', load: 'lazy', owns: ['manifesto', 'rollout', 'rollback'], dependsOn: ['quality'], failureBoundary: 'updates' },
  { id: 'quality', domain: 'quality', label: 'Qualidade', load: 'lazy', owns: ['testes', 'diagnóstico', 'prontidão'], dependsOn: [], failureBoundary: 'quality' }
] as const;

export type ArchitectureHealth = {
  version: string;
  totalModules: number;
  lazyModules: number;
  eagerModules: number;
  isolatedDomains: number;
  cycles: string[];
  score: number;
};

function dependencyCycles(): string[] {
  const graph = new Map<BuildMasterDomain, BuildMasterDomain[]>();
  for (const module of ARCHITECTURE_MODULES) graph.set(module.domain, module.dependsOn);
  const cycles = new Set<string>();
  const visit = (node: BuildMasterDomain, path: BuildMasterDomain[]) => {
    const index = path.indexOf(node);
    if (index >= 0) {
      cycles.add([...path.slice(index), node].join(' → '));
      return;
    }
    for (const dependency of graph.get(node) ?? []) visit(dependency, [...path, node]);
  };
  for (const node of graph.keys()) visit(node, []);
  return [...cycles];
}

export function buildArchitectureHealth(): ArchitectureHealth {
  const cycles = dependencyCycles();
  const lazyModules = ARCHITECTURE_MODULES.filter((module) => module.load === 'lazy').length;
  const isolatedDomains = new Set(ARCHITECTURE_MODULES.map((module) => module.domain)).size;
  const score = Math.max(0, Math.min(100, 100 - cycles.length * 20 - (ARCHITECTURE_MODULES.length - isolatedDomains) * 3));
  return {
    version: ARCHITECTURE_VERSION,
    totalModules: ARCHITECTURE_MODULES.length,
    lazyModules,
    eagerModules: ARCHITECTURE_MODULES.length - lazyModules,
    isolatedDomains,
    cycles,
    score
  };
}

export function modulesForDomain(domain: BuildMasterDomain): readonly ArchitectureModuleDefinition[] {
  return ARCHITECTURE_MODULES.filter((module) => module.domain === domain);
}
