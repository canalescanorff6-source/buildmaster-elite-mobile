import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R421_SQUAD_VIDEO_TACTICAL_VERSION = '40.80-r421-squad-video-tactical-closure-v1';

const FILES = {
  matchEngine: 'src/modules/matches/matchTrainerEngine.ts',
  matchCenter: 'src/modules/matches/MatchTrainerCenter.tsx',
  tacticalEngine: 'src/modules/tactical-studio/tacticalStudio2Engine.ts',
  tacticalStorage: 'src/modules/tactical-studio/tacticalStudio2Storage.ts',
  squadEngine: 'src/modules/squad-mapping/squadMappingEngine.ts',
};

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R421: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R421: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}

function replaceRegexRequired(source, pattern, replacement, label) {
  if (typeof replacement === 'string' && source.includes(replacement)) return { source, changed: false };
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const matches = [...source.matchAll(new RegExp(pattern.source, flags))];
  if (matches.length !== 1) throw new Error(`R421: contrato inesperado em ${label}; ocorrências=${matches.length}`);
  return { source: source.replace(pattern, replacement), changed: true };
}

function appendSetMember(source, setName, member) {
  const pattern = new RegExp(`const ${setName} = new Set<MatchEventKind>\\(\\[([^\\]]*)\\]\\);`);
  const match = source.match(pattern);
  if (!match) throw new Error(`R421: conjunto ${setName} não encontrado.`);
  if (new RegExp(`['\"]${member}['\"]`).test(match[1])) return { source, changed: false };
  const current = match[1].trim();
  const nextMembers = current ? `${current}, '${member}'` : `'${member}'`;
  return { source: source.replace(pattern, `const ${setName} = new Set<MatchEventKind>([${nextMembers}]);`), changed: true };
}

function patchMatchEngine(source) {
  let next = source;
  let changed = false;

  let r = replaceRequired(
    next,
    "  | 'second-ball-failure'\n  | 'command-pass-early'",
    "  | 'second-ball-failure'\n  | 'interception'\n  | 'command-pass-early'",
    'MatchEventKind/interception',
  );
  next = r.source; changed ||= r.changed;

  r = replaceRequired(
    next,
    '  playerId?: string | null;\n  phase?: MatchPhase;',
    '  playerId?: string | null;\n  playerLabel?: string | null;\n  playerCardFingerprint?: string | null;\n  playerHistoryId?: string | null;\n  phase?: MatchPhase;',
    'identidade do jogador no marcador',
  );
  next = r.source; changed ||= r.changed;

  const interceptionTemplate = `  'interception': {\n    label: 'Interceptação bem executada', shortLabel: 'Interceptação', group: 'positive', phase: 'defense', severity: 'positive',\n    observed: 'A linha de passe foi lida e cortada antes de o adversário receber em vantagem.',\n    why: 'O defensor protegeu o espaço e antecipou a intenção do passe sem quebrar a estrutura por um bote isolado.',\n    consequence: 'A posse adversária foi interrompida e a equipe ganhou uma oportunidade segura de transição ou reciclagem.',\n    betterDecision: 'Após interceptar, confirmar a primeira opção curta antes de acelerar para não devolver a posse imediatamente.',\n    correction: 'Repetir a leitura de linha de passe mantendo corpo orientado e cobertura atrás da ação.',\n    drill: { title: 'Interceptar e sair jogando', objective: 'Transformar leitura defensiva em recuperação limpa da posse.', rule: 'Fechar a linha antes de atacar a bola e usar o primeiro passe seguro após recuperar.', repetitions: '15 leituras de passe', successCriteria: 'Interceptar ou desviar 10 de 15 e manter a posse na ação seguinte.', estimatedMinutes: 12 }\n  },\n`;
  if (!next.includes("  'interception': {")) {
    const anchor = "const EVENT_TEMPLATES: Record<MatchEventKind, EventTemplate> = {\n  'pass-error': {";
    if (!next.includes(anchor)) throw new Error('R421: início de EVENT_TEMPLATES não encontrado.');
    next = next.replace(anchor, `const EVENT_TEMPLATES: Record<MatchEventKind, EventTemplate> = {\n${interceptionTemplate}  'pass-error': {`);
    changed = true;
  }

  r = appendSetMember(next, 'POSITIVE_KINDS', 'interception'); next = r.source; changed ||= r.changed;
  r = appendSetMember(next, 'DEFENSE_KINDS', 'interception'); next = r.source; changed ||= r.changed;

  const safeguard = "        'Passe, marcação, finalização e interceptação só viram diagnóstico específico após confirmação humana; candidatos automáticos continuam neutros.',\n";
  if (!next.includes('Passe, marcação, finalização e interceptação só viram diagnóstico específico após confirmação humana')) {
    const anchor = "        'Momentos automáticos são candidatos para revisão; não entram como erro confirmado.',\n";
    if (!next.includes(anchor)) {
      const fallback = "  'Momentos automáticos são candidatos para revisão; não entram como erro confirmado.',\n";
      if (!next.includes(fallback)) throw new Error('R421: safeguard automático não encontrado.');
      next = next.replace(fallback, `${fallback}  'Passe, marcação, finalização e interceptação só viram diagnóstico específico após confirmação humana; candidatos automáticos continuam neutros.',\n`);
    } else {
      next = next.replace(anchor, `${anchor}${safeguard}`);
    }
    changed = true;
  }

  return { source: next, changed };
}

function patchMatchCenter(source) {
  let next = source;
  let changed = false;

  if (!next.includes("@/modules/squad-mapping/squadMappingStorage")) {
    const anchor = "import type { TeamDiagnosis } from '@/modules/core/centralIntelligence';\n";
    if (!next.includes(anchor)) throw new Error('R421: import TeamDiagnosis não encontrado no MatchTrainerCenter.');
    next = next.replace(anchor, `${anchor}import { loadSquadMappingState } from '@/modules/squad-mapping/squadMappingStorage';\nimport type { SquadMappingPlayer } from '@/modules/squad-mapping/squadMappingEngine';\n`);
    changed = true;
  }

  if (!next.includes("{ kind: 'interception', label: 'Boa interceptação' }")) {
    const anchors = [
      "  { kind: 'good-build-up', label: 'Boa construção' },\n",
      "  { kind: 'marking-error', label: 'Erro de marcação' },\n",
    ];
    const anchor = anchors.find((candidate) => next.includes(candidate));
    if (!anchor) throw new Error('R421: ponto de inserção de interceptação não encontrado no MARKER_ACTIONS.');
    next = next.replace(anchor, `${anchor}  { kind: 'interception', label: 'Boa interceptação' },\n`);
    changed = true;
  }

  if (!next.includes('mappedPlayersR421')) {
    const anchor = "  const [markerPlayer, setMarkerPlayer] = useState('');\n";
    const compactAnchor = "  const [markerPlayer,setMarkerPlayer]=useState('');\n";
    if (next.includes(anchor)) {
      next = next.replace(anchor, `${anchor}  const [mappedPlayersR421, setMappedPlayersR421] = useState<SquadMappingPlayer[]>([]);\n`);
    } else if (next.includes(compactAnchor)) {
      next = next.replace(compactAnchor, `${compactAnchor}  const [mappedPlayersR421, setMappedPlayersR421] = useState<SquadMappingPlayer[]>([]);\n`);
    } else {
      throw new Error('R421: estado markerPlayer não encontrado.');
    }
    changed = true;
  }

  if (!next.includes('void loadSquadMappingState()')) {
    const anchors = [
      "  const clipTimerRef = useRef<number | null>(null);\n",
      "  const videoRef=useRef<HTMLVideoElement|null>(null);\n",
    ];
    const anchor = anchors.find((candidate) => next.includes(candidate));
    if (!anchor) throw new Error('R421: ponto de inserção do carregamento de elenco não encontrado.');
    const effect = `\n  useEffect(() => {\n    let cancelled = false;\n    void loadSquadMappingState()\n      .then((state) => { if (!cancelled) setMappedPlayersR421(state.players.filter((player) => !player.excluded)); })\n      .catch(() => { if (!cancelled) setMappedPlayersR421([]); });\n    return () => { cancelled = true; };\n  }, []);\n`;
    next = next.replace(anchor, `${anchor}${effect}`);
    changed = true;
  }

  if (!next.includes('selectedMappedPlayerR421')) {
    const anchors = [
      "  const active = useMemo(() => sessions.find((session) => session.id === activeId) || null, [activeId, sessions]);\n",
      "  function addMarker(kind: MatchEventKind) {\n",
    ];
    const anchor = anchors.find((candidate) => next.includes(candidate));
    if (!anchor) throw new Error('R421: ponto de inserção da seleção de jogador não encontrado.');
    const selector = "  const selectedMappedPlayerR421 = useMemo(() => mappedPlayersR421.find((player) => player.id === markerPlayer) ?? null, [mappedPlayersR421, markerPlayer]);\n";
    next = next.replace(anchor, anchor.startsWith('  const active') ? `${anchor}${selector}` : `${selector}${anchor}`);
    changed = true;
  }

  const oldPlayerLine = '      playerId: markerPlayer.trim() || null,';
  const newPlayerBlock = `      playerId: selectedMappedPlayerR421?.id ?? null,\n      playerLabel: selectedMappedPlayerR421?.name ?? null,\n      playerCardFingerprint: selectedMappedPlayerR421?.cardFingerprint ?? null,\n      playerHistoryId: selectedMappedPlayerR421?.linkedHistoryId ?? null,`;
  if (next.includes(oldPlayerLine)) {
    next = next.split(oldPlayerLine).join(newPlayerBlock);
    changed = true;
  }
  const compactPlayerLine = '      playerId: markerPlayer.trim() || null,';
  if (next.includes(compactPlayerLine)) {
    next = next.split(compactPlayerLine).join(newPlayerBlock);
    changed = true;
  }

  if (!next.includes('<select value={markerPlayer}')) {
    const pattern = /<label>Jogador ou setor<input value=\{markerPlayer\}[^>]*placeholder="Ex\.: Maldini, Rodri, lado esquerdo"[^>]*onChange=\{\(event: \{ target: HTMLInputElement \}\) => setMarkerPlayer\(event\.target\.value\)\}\/><\/label>/;
    if (!pattern.test(next)) throw new Error('R421: campo livre de jogador não encontrado no MatchTrainerCenter.');
    next = next.replace(pattern, `<label>Jogador do elenco<select value={markerPlayer} onChange={(event: { target: HTMLSelectElement }) => setMarkerPlayer(event.target.value)}><option value="">Não vinculado / setor não identificado</option>{mappedPlayersR421.map((player) => <option key={player.id} value={player.id}>{player.name} • {player.mainPosition} • {player.cardLabel}</option>)}</select></label>`);
    changed = true;
  }

  return { source: next, changed };
}

function patchTacticalEngine(source) {
  let next = source;
  let changed = false;
  const replacements = [
    ["action(leftDefender, creator, 'movimento', 'Apoio por fora')", "action(leftDefender, midfielder, 'movimento', 'Aproximar por dentro')"],
    ["action(rightDefender, striker, 'movimento', 'Amplitude oposta')", "action(rightDefender, midfielder, 'movimento', 'Apoio interior')"],
  ];
  for (const [from, to] of replacements) {
    if (next.includes(to)) continue;
    const count = next.split(from).length - 1;
    if (count !== 1) throw new Error(`R421: contrato tático inesperado para ${from}; ocorrências=${count}`);
    next = next.replace(from, to);
    changed = true;
  }
  return { source: next, changed };
}

function patchTacticalStorage(source) {
  if (source.includes("typeof project.id !== 'string'") && source.includes('frame.actions.every')) return { source, changed: false };
  const pattern = /function isProject\(value: unknown\): value is TacticalSequenceProject \{[\s\S]*?\n\}/;
  const replacement = `function isProject(value: unknown): value is TacticalSequenceProject {\n  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;\n  const project = value as Partial<TacticalSequenceProject>;\n  if (typeof project.id !== 'string' || !project.id.trim()) return false;\n  if (typeof project.name !== 'string' || !project.name.trim()) return false;\n  if (typeof project.formationId !== 'string' || !project.formationId.trim()) return false;\n  if (typeof project.style !== 'string' || !project.style.trim()) return false;\n  if (!Array.isArray(project.frames) || project.frames.length < 2 || project.frames.length > 12) return false;\n  return project.frames.every((frame) => {\n    if (!frame || typeof frame !== 'object' || Array.isArray(frame)) return false;\n    if (typeof frame.id !== 'string' || !frame.id.trim()) return false;\n    if (typeof frame.title !== 'string' || typeof frame.objective !== 'string') return false;\n    if (!Number.isFinite(Number(frame.durationMs)) || Number(frame.durationMs) < 600 || Number(frame.durationMs) > 10000) return false;\n    if (!Array.isArray(frame.players) || !Array.isArray(frame.actions)) return false;\n    const playersValid = frame.players.every((player) => Boolean(player && typeof player.slotId === 'string' && typeof player.label === 'string' && Number.isFinite(Number(player.x)) && Number.isFinite(Number(player.y))));\n    const actionsValid = frame.actions.every((action) => Boolean(action && typeof action.id === 'string' && typeof action.fromSlotId === 'string' && typeof action.toSlotId === 'string' && typeof action.kind === 'string' && typeof action.label === 'string'));\n    return playersValid && actionsValid;\n  });\n}`;
  const r = replaceRegexRequired(source, pattern, replacement, 'validação estrutural de projeto tático');
  return { source: r.source, changed: r.changed };
}

function validateSquadContract(source) {
  if (!/avoidWingers:\s*true/.test(source)) throw new Error('R421: Mapeamento perdeu preferência sem pontas.');
  if (!/favorCentralTriangles:\s*true/.test(source)) throw new Error('R421: Mapeamento perdeu triângulos centrais.');
  if (/result\.training\s*=/.test(source)) throw new Error('R421: Mapeamento não pode reescrever a progressão permanente da carta.');
}

function validateConverged(root) {
  const matchEngine = fs.readFileSync(path.resolve(root, FILES.matchEngine), 'utf8');
  const matchCenter = fs.readFileSync(path.resolve(root, FILES.matchCenter), 'utf8');
  const tacticalEngine = fs.readFileSync(path.resolve(root, FILES.tacticalEngine), 'utf8');
  const tacticalStorage = fs.readFileSync(path.resolve(root, FILES.tacticalStorage), 'utf8');
  const squadEngine = fs.readFileSync(path.resolve(root, FILES.squadEngine), 'utf8');

  const requiredMatch = ["| 'interception'", "'interception': {", 'playerCardFingerprint?: string | null;', 'playerHistoryId?: string | null;', 'playerLabel?: string | null;'];
  for (const fragment of requiredMatch) if (!matchEngine.includes(fragment)) throw new Error(`R421: contrato de vídeo ausente: ${fragment}`);
  if (!matchCenter.includes('loadSquadMappingState') || !matchCenter.includes('mappedPlayersR421') || !matchCenter.includes('<select value={markerPlayer}')) throw new Error('R421: Match Trainer não está vinculado ao elenco mapeado.');
  if (/Apoio por fora|Amplitude oposta/.test(tacticalEngine)) throw new Error('R421: sequência tática central ainda contém instrução por fora.');
  if (!tacticalEngine.includes('Aproximar por dentro') || !tacticalEngine.includes('Apoio interior')) throw new Error('R421: sequência tática central incompleta.');
  if (!tacticalStorage.includes("typeof project.id !== 'string'") || !tacticalStorage.includes('frame.actions.every')) throw new Error('R421: importação tática continua permissiva demais.');
  if (/\.slice\(0,\s*MAX_TACTICAL_SEQUENCE_PROJECTS\)/.test(tacticalStorage)) throw new Error('R421: teto artificial do Tactical Studio reapareceu.');
  validateSquadContract(squadEngine);
}

export function applyR421SquadVideoTacticalClosure(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patches = [
    [FILES.matchEngine, patchMatchEngine],
    [FILES.matchCenter, patchMatchCenter],
    [FILES.tacticalEngine, patchTacticalEngine],
    [FILES.tacticalStorage, patchTacticalStorage],
  ];
  const patched = [];
  for (const [relative, patcher] of patches) {
    const { file, source } = readRequired(root, relative);
    const result = patcher(source);
    if (result.changed) {
      fs.writeFileSync(file, result.source, 'utf8');
      patched.push(relative);
    }
  }
  const squad = readRequired(root, FILES.squadEngine);
  validateSquadContract(squad.source);
  validateConverged(root);
  return { changed: patched.length > 0, patched };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR421SquadVideoTacticalClosure(process.cwd());
  console.log(result.changed
    ? `R421: elenco, vídeo revisável e Estúdio Tático convergidos (${result.patched.length} arquivo(s)).`
    : 'R421: elenco, vídeo revisável e Estúdio Tático já estavam convergidos.');
}
