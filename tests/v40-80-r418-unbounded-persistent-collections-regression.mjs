import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = path.resolve('scripts/apply-r418-unbounded-capacity.mjs');
const { applyR418UnboundedCapacity, validateNetworkMobilityContractR418 } = await import(pathToFileURL(modulePath).href);

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-r418-'));
const write = (relative, content) => {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
};
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

write('src/modules/vault/cardHistoryStore.ts', `
export const HISTORY_LIMIT = 200;
function normalizeHistoryList(list) { return list.filter(Boolean).slice(0, HISTORY_LIMIT); }
function mergeHistoryLists(map) { return Array.from(map.values()).slice(0, HISTORY_LIMIT); }
async function appendHistoryItem(item) { return [item, ...await loadHistoryStore()].slice(0, HISTORY_LIMIT); }
async function saveHistoryItem(item, withoutCurrent) { const next = [item, ...withoutCurrent].slice(0, HISTORY_LIMIT); return next; }
`);
write('src/modules/vault/vaultHistoryMutationsR129.ts', `
import {\n  HISTORY_LIMIT,\n  appendSavedEvent\n} from './cardHistoryStore';
export function prependHistoryEntryR129(history, item) { return [item, ...history].slice(0, HISTORY_LIMIT); }
`);
write('src/modules/tactical-studio/tacticalStudio2Storage.ts', `
const MAX_TACTICAL_SEQUENCE_PROJECTS = 40;
export function readProjects(raw) { return raw.slice(0, MAX_TACTICAL_SEQUENCE_PROJECTS); }
export function saveProjects(projects) { return projects.slice(0, MAX_TACTICAL_SEQUENCE_PROJECTS); }
export function saveProject(project, projects) { return [project, ...projects].slice(0, MAX_TACTICAL_SEQUENCE_PROJECTS); }
`);
write('src/modules/squad-mapping/squadMappingStorage.ts', `
const safeLabel = String('x').slice(0, 100);
const safeNote = String('y').slice(0, 500);
export function sanitizeMappingState(source) {
  const players = Array.isArray(source.players) ? source.players.map(sanitizePlayer).filter((item): item is SquadMappingPlayer => Boolean(item)).slice(0, 500) : [];
  const trials = Array.isArray(source.trials) ? source.trials.map(sanitizeTrial).filter((item): item is FormationTrial => Boolean(item)).slice(0, 100) : [];
  return { players, trials };
}
`);
write('supabase/functions/license-session/index.ts', `
async function verifyDeviceProof() {}
const deviceId = 'bm2-test';
await service.rpc('buildmaster_register_secure_device', { p_device_id: deviceId });
`);

const beforeVault = read('src/modules/vault/cardHistoryStore.ts');
assert.match(beforeVault, /slice\(0, HISTORY_LIMIT\)/, 'RED: fixture precisa começar com poda de histórico.');
const beforeTactical = read('src/modules/tactical-studio/tacticalStudio2Storage.ts');
assert.match(beforeTactical, /MAX_TACTICAL_SEQUENCE_PROJECTS = 40/, 'RED: fixture precisa começar com teto de projetos.');
const beforeSquad = read('src/modules/squad-mapping/squadMappingStorage.ts');
assert.match(beforeSquad, /slice\(0, 500\)/, 'RED: fixture precisa começar com teto do elenco.');

const first = applyR418UnboundedCapacity(root);
assert.equal(first.changed, true);
assert.equal(first.vaultCountCapsRemoved >= 5, true);
assert.equal(first.tacticalCountCapsRemoved >= 2, true);
assert.equal(first.squadCountCapsRemoved, 2);

const vault = read('src/modules/vault/cardHistoryStore.ts');
const mutations = read('src/modules/vault/vaultHistoryMutationsR129.ts');
const tactical = read('src/modules/tactical-studio/tacticalStudio2Storage.ts');
const squad = read('src/modules/squad-mapping/squadMappingStorage.ts');

assert.doesNotMatch(vault, /slice\(0, HISTORY_LIMIT\)/, 'Cofre não pode descartar fichas por quantidade.');
assert.doesNotMatch(mutations, /slice\(0, HISTORY_LIMIT\)/, 'Mutações do Cofre não podem descartar fichas por quantidade.');
assert.doesNotMatch(mutations, /\bHISTORY_LIMIT\b/, 'Import legado do teto não pode permanecer sem uso.');
assert.doesNotMatch(tactical, /\.slice\(0,\s*MAX_TACTICAL_SEQUENCE_PROJECTS\)/, 'Tactical Studio não pode podar projetos por quantidade.');
assert.doesNotMatch(squad, /source\.players[\s\S]{0,160}\.slice\(0,\s*500\)|source\.trials[\s\S]{0,160}\.slice\(0,\s*100\)/, 'Mapeamento não pode podar jogadores/testes por quantidade.');
assert.match(squad, /String\('x'\)\.slice\(0, 100\)/, 'R418 deve preservar limites de segurança de texto.');
assert.match(squad, /String\('y'\)\.slice\(0, 500\)/, 'R418 deve preservar limites de segurança que não são capacidade de coleção.');
assert.match(vault, /R418_UNBOUNDED_PERSISTENT_COLLECTIONS/, 'Fonte do Cofre precisa declarar contrato R418.');
assert.match(tactical, /R418_UNBOUNDED_PERSISTENT_COLLECTIONS/, 'Tactical Studio precisa declarar contrato R418.');
assert.match(squad, /R418_UNBOUNDED_PERSISTENT_COLLECTIONS/, 'Mapeamento precisa declarar contrato R418.');

const mobility = validateNetworkMobilityContractR418(root);
assert.equal(mobility.deviceBound, true);
assert.equal(mobility.ipBound, false);
assert.equal(mobility.vpnCompatible, true);

const second = applyR418UnboundedCapacity(root);
assert.equal(second.changed, false, 'R418 precisa ser idempotente.');

write('supabase/functions/license-session/index.ts', `
async function verifyDeviceProof() {}
const deviceId = 'bm2-test';
const sourceIp = request.headers.get('x-forwarded-for');
if (sourceIp !== previousIp) throw new Error('VPN blocked');
await service.rpc('buildmaster_register_secure_device', { p_device_id: deviceId });
`);
assert.throws(() => validateNetworkMobilityContractR418(root), /IP\/VPN/, 'Contrato deve impedir regressão futura para bloqueio por IP/VPN.');

console.log('R418 aprovado: Cofre, Tactical Studio e Mapeamento sem tetos artificiais; licença permanece vinculada ao aparelho, não ao IP/VPN.');
