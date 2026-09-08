/**
 * R167 — contrato leve de persistência do Training Evolution.
 *
 * Este módulo contém somente chaves estáveis de storage. Ele pode ser usado
 * no bootstrap/compartilhamento sem puxar o motor de treino para o startup.
 */
export const TRAINING_EVOLUTION_STORAGE_KEY = 'buildmaster_training_evolution_sessions_v2880';
export const TRAINING_GOALS_STORAGE_KEY = 'buildmaster_training_evolution_goals_v2880';
