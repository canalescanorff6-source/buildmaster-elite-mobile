import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const trainingKeys = fs.readFileSync('src/modules/training/trainingStorageKeysR167.ts', 'utf8');
const coachKeys = fs.readFileSync('src/modules/coaching/smartCoachStorageKeysR167.ts', 'utf8');
const trainingEngine = fs.readFileSync('src/modules/training/trainingEvolutionEngine.ts', 'utf8');
const coachEngine = fs.readFileSync('src/modules/coaching/smartCoachEngine.ts', 'utf8');

assert.match(app, /from ['"]@\/modules\/training\/trainingStorageKeysR167['"]/, 'CardVisionApp deve usar contrato leve de storage do treino.');
assert.match(app, /from ['"]@\/modules\/coaching\/smartCoachStorageKeysR167['"]/, 'CardVisionApp deve usar contrato leve de storage do Smart Coach.');
assert.doesNotMatch(app, /^\s*import\s+(?!type\b)[^\n]+from ['"]@\/modules\/training\/trainingEvolutionEngine['"]/m, 'Motor completo de treino não pode voltar ao startup por uma chave.');
assert.doesNotMatch(app, /^\s*import\s+(?!type\b)[^\n]+from ['"]@\/modules\/coaching\/smartCoachEngine['"]/m, 'Motor completo do Smart Coach não pode voltar ao startup por uma chave.');

assert.match(trainingKeys, /TRAINING_EVOLUTION_STORAGE_KEY\s*=\s*['"]buildmaster_training_evolution_sessions_v2880['"]/, 'Chave de sessões de treino deve permanecer canônica.');
assert.match(trainingKeys, /TRAINING_GOALS_STORAGE_KEY\s*=\s*['"]buildmaster_training_evolution_goals_v2880['"]/, 'Chave de metas de treino deve permanecer canônica.');
assert.match(coachKeys, /SMART_COACH_REVIEW_STORAGE_KEY\s*=\s*['"]buildmaster_smart_coach_reviews_v2960['"]/, 'Chave de reviews do Smart Coach deve permanecer canônica.');
assert.match(coachKeys, /SMART_COACH_PREFERENCES_KEY\s*=\s*['"]buildmaster_smart_coach_preferences_v2960['"]/, 'Chave de preferências do Smart Coach deve permanecer canônica.');

assert.match(trainingEngine, /export \{ TRAINING_EVOLUTION_STORAGE_KEY, TRAINING_GOALS_STORAGE_KEY \} from ['"]\.\/trainingStorageKeysR167['"]/, 'Motor de treino deve preservar exports legados via contrato leve.');
assert.match(coachEngine, /export \{ SMART_COACH_REVIEW_STORAGE_KEY, SMART_COACH_PREFERENCES_KEY \} from ['"]\.\/smartCoachStorageKeysR167['"]/, 'Smart Coach deve preservar exports legados via contrato leve.');
assert.match(app, /readAccountJsonR141\(TRAINING_GOALS_STORAGE_KEY, \{\}\)/, 'Payload de compartilhamento deve continuar lendo metas pela mesma chave canônica via leitor de conta R141.');
assert.match(app, /readAccountJsonR141\(SMART_COACH_REVIEW_STORAGE_KEY, \[\]\)/, 'Payload de compartilhamento deve continuar lendo reviews pela mesma chave canônica via leitor de conta R141.');

console.log('R167 aprovada: chaves de treino/Smart Coach ficaram leves sem alterar storage, motores ou compatibilidade de exports.');
