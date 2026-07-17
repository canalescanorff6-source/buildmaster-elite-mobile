export const BUILDMASTER_V27_MODULES = [
  { id: 'core', label: 'Central Inteligente', route: 'inicio', lazy: false },
  { id: 'players', label: 'Laboratório do Jogador', route: 'jogadores', lazy: true },
  { id: 'card-reader', label: 'Leitor Total', route: 'jogadores/leitor', lazy: true },
  { id: 'builds', label: 'Motor de Fichas', route: 'jogadores/ficha', lazy: true },
  { id: 'formations', label: 'Formações', route: 'time/formacoes', lazy: true },
  { id: 'squad', label: 'Laboratório do Time', route: 'time', lazy: true },
  { id: 'matches', label: 'Laboratório da Partida', route: 'partidas', lazy: true },
  { id: 'training', label: 'Treinos e validação', route: 'partidas/treinos', lazy: true },
  { id: 'vault', label: 'Cofre', route: 'jogadores/cofre', lazy: true },
  { id: 'backup', label: 'Backup', route: 'ajustes/backup', lazy: true },
  { id: 'updates', label: 'Atualizações', route: 'ajustes/atualizacoes', lazy: true },
  { id: 'administration', label: 'Administração', route: 'ajustes/contas', lazy: true },
  { id: 'assistant', label: 'Assistente BuildMaster', route: 'global', lazy: true }
] as const;
