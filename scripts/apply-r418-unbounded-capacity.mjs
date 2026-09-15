import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R418_UNBOUNDED_CAPACITY_VERSION = '40.80-r418-unbounded-persistent-collections-v1';

const FILES = {
  vault: 'src/modules/vault/cardHistoryStore.ts',
  mutations: 'src/modules/vault/vaultHistoryMutationsR129.ts',
  tactical: 'src/modules/tactical-studio/tacticalStudio2Storage.ts',
  squad: 'src/modules/squad-mapping/squadMappingStorage.ts',
  license: 'supabase/functions/license-session/index.ts',
};

const MARKER = '// R418_UNBOUNDED_PERSISTENT_COLLECTIONS: conteúdo do usuário não é descartado por teto artificial de quantidade.';

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R418: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function addMarker(source) {
  if (source.includes('R418_UNBOUNDED_PERSISTENT_COLLECTIONS')) return source;
  return `${MARKER}\n${source}`;
}

function countMatches(source, regex) {
  return [...source.matchAll(regex)].length;
}

function patchVault(source) {
  const before = countMatches(source, /\.slice\(0,\s*HISTORY_LIMIT\)/g);
  let next = source.replace(/\.slice\(0,\s*HISTORY_LIMIT\)/g, '');
  next = addMarker(next);
  if (/\.slice\(0,\s*HISTORY_LIMIT\)/.test(next)) {
    throw new Error('R418: poda por HISTORY_LIMIT permaneceu no Cofre.');
  }
  return { source: next, removed: before };
}

function patchVaultMutations(source) {
  const before = countMatches(source, /\.slice\(0,\s*HISTORY_LIMIT\)/g);
  let next = source.replace(/\.slice\(0,\s*HISTORY_LIMIT\)/g, '');
  if (!/\bHISTORY_LIMIT\b/.test(next.replace(/HISTORY_LIMIT/g, ''))) {
    // no-op; branch kept only for readability
  }
  if (!/\.slice\(0,\s*HISTORY_LIMIT\)/.test(next)) {
    next = next.replace(/^\s*HISTORY_LIMIT,\r?\n/m, '');
  }
  if (/\bHISTORY_LIMIT\b/.test(next)) {
    throw new Error('R418: referência ativa a HISTORY_LIMIT permaneceu em vaultHistoryMutationsR129.');
  }
  return { source: next, removed: before };
}

function patchTactical(source) {
  const projectCaps = countMatches(source, /\.slice\(0,\s*MAX_TACTICAL_SEQUENCE_PROJECTS\)/g);
  let next = source.replace(/\.slice\(0,\s*MAX_TACTICAL_SEQUENCE_PROJECTS\)/g, '');
  next = next.replace(
    /\/\/ Contrato histórico do Estúdio Tático: até 40 projetos por conta\.\r?\n\/\/ O módulo de sequências não pode reduzir silenciosamente esse limite\.\r?\n/,
    '// R418: MAX_TACTICAL_SEQUENCE_PROJECTS permanece exportado só por compatibilidade histórica; não poda projetos.\n'
  );
  next = addMarker(next);
  if (/\.slice\(0,\s*MAX_TACTICAL_SEQUENCE_PROJECTS\)/.test(next)) {
    throw new Error('R418: teto artificial permaneceu no Tactical Studio 2.');
  }
  return { source: next, removed: projectCaps };
}

function patchSquad(source) {
  const playerCap = /source\.players\.map\(sanitizePlayer\)\.filter\(\(item\): item is SquadMappingPlayer => Boolean\(item\)\)\.slice\(0,\s*500\)/;
  const trialCap = /source\.trials\.map\(sanitizeTrial\)\.filter\(\(item\): item is FormationTrial => Boolean\(item\)\)\.slice\(0,\s*100\)/;
  const genericPlayerCap = /source\.players\.map\(sanitizePlayer\)\.filter\(Boolean\)\.slice\(0,\s*500\)/;
  const genericTrialCap = /source\.trials\.map\(sanitizeTrial\)\.filter\(Boolean\)\.slice\(0,\s*100\)/;
  let removed = 0;
  let next = source;
  for (const [pattern, replacement] of [
    [playerCap, 'source.players.map(sanitizePlayer).filter((item): item is SquadMappingPlayer => Boolean(item))'],
    [trialCap, 'source.trials.map(sanitizeTrial).filter((item): item is FormationTrial => Boolean(item))'],
    [genericPlayerCap, 'source.players.map(sanitizePlayer).filter(Boolean)'],
    [genericTrialCap, 'source.trials.map(sanitizeTrial).filter(Boolean)'],
  ]) {
    if (pattern.test(next)) {
      next = next.replace(pattern, replacement);
      removed += 1;
    }
  }
  next = addMarker(next);
  if (/source\.players[\s\S]{0,160}\.slice\(0,\s*500\)/.test(next)
      || /source\.trials[\s\S]{0,160}\.slice\(0,\s*100\)/.test(next)) {
    throw new Error('R418: teto artificial permaneceu no Mapeamento de Elenco.');
  }
  return { source: next, removed };
}

export function validateNetworkMobilityContractR418(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const { source } = readRequired(root, FILES.license);
  const deviceBound = /verifyDeviceProof/.test(source)
    && /\bdeviceId\b/.test(source)
    && /buildmaster_register_secure_device/.test(source);
  if (!deviceBound) {
    throw new Error('R418: licença deixou de usar identidade/prova segura do aparelho.');
  }

  const forbiddenIpVpnBinding = [
    /headers\.get\(\s*['"]x-forwarded-for['"]\s*\)/i,
    /headers\.get\(\s*['"]cf-connecting-ip['"]\s*\)/i,
    /headers\.get\(\s*['"]x-real-ip['"]\s*\)/i,
    /\bpreviousIp\b/i,
    /\b(?:vpn|proxy)\b[^\n]{0,80}\b(?:block|blocked|deny|denied|reject|forbid)/i,
    /\b(?:block|blocked|deny|denied|reject|forbid)[^\n]{0,80}\b(?:vpn|proxy)\b/i,
  ];
  const ipBound = forbiddenIpVpnBinding.some((pattern) => pattern.test(source));
  if (ipBound) {
    throw new Error('R418: autenticação/licença não pode bloquear o mesmo aparelho apenas por mudança de IP/VPN.');
  }
  return { deviceBound: true, ipBound: false, vpnCompatible: true };
}

export function applyR418UnboundedCapacity(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const targets = [
    [FILES.vault, patchVault],
    [FILES.mutations, patchVaultMutations],
    [FILES.tactical, patchTactical],
    [FILES.squad, patchSquad],
  ];

  let changed = false;
  let vaultCountCapsRemoved = 0;
  let tacticalCountCapsRemoved = 0;
  let squadCountCapsRemoved = 0;
  const patched = [];

  for (const [relative, patcher] of targets) {
    const { file, source } = readRequired(root, relative);
    const result = patcher(source);
    if (relative === FILES.vault || relative === FILES.mutations) vaultCountCapsRemoved += result.removed;
    if (relative === FILES.tactical) tacticalCountCapsRemoved += result.removed;
    if (relative === FILES.squad) squadCountCapsRemoved += result.removed;
    if (result.source !== source) {
      fs.writeFileSync(file, result.source, 'utf8');
      changed = true;
      patched.push(relative);
    }
  }

  // Guardrail: a mobilidade de rede é permitida porque a autoridade de segurança é o aparelho assinado,
  // não IP, geolocalização, proxy ou VPN. Rate limiting por infraestrutura pode continuar existindo,
  // mas não pode virar identidade/licença do usuário.
  const networkMobility = validateNetworkMobilityContractR418(root);

  const activeVaultRefs = [];
  const srcRoot = path.join(root, 'src');
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) {
        const text = fs.readFileSync(full, 'utf8');
        if (/\.slice\(0,\s*HISTORY_LIMIT\)/.test(text)) activeVaultRefs.push(path.relative(root, full));
      }
    }
  };
  if (fs.existsSync(srcRoot)) walk(srcRoot);
  if (activeVaultRefs.length) {
    throw new Error(`R418: poda de Cofre ainda ativa em: ${activeVaultRefs.join(', ')}`);
  }

  return {
    changed,
    patched,
    vaultCountCapsRemoved,
    tacticalCountCapsRemoved,
    squadCountCapsRemoved,
    networkMobility,
  };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR418UnboundedCapacity(process.cwd());
  console.log(result.changed
    ? `R418: coleções persistentes sem tetos artificiais (${result.patched.length} arquivo(s) ajustado(s)).`
    : 'R418: coleções persistentes já estavam sem tetos artificiais.');
  console.log('R418: licença vinculada ao aparelho; mudança de IP/VPN não é identidade de autorização.');
}
