import type { PositionCode } from './analyzerDomain';
import { readAccountStorage, writeAccountStorage } from './accountStorage';

export const EFOOTBALL_2027_PHASE_CATALOG_R124_VERSION = 'r124-phase-separated-live-safe' as const;
export const REMOTE_PHASE_EXTENSIONS_R124_KEY = 'buildmaster.efootball2027.phase-extensions.r124';

export type PlaystylePhaseR124 = 'OFFENSIVE' | 'DEFENSIVE';
export type PlaystyleEvidenceR124 = 'KONAMI_PTBR' | 'GAME_EXPORT_CORROBORATED' | 'LEGACY_GAME' | 'REMOTE_CONFIRMED';
export type PhasePlaystyleEntryR124 = {
  label: string;
  phase: PlaystylePhaseR124;
  aliases: readonly string[];
  positions: readonly PositionCode[];
  evidence: PlaystyleEvidenceR124;
  /** Somente true quando a posição foi confirmada o bastante para gerar alerta de incompatibilidade. */
  strictPositions?: boolean;
};

const normalize = (value: unknown) => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

const OFF = (label:string, aliases:string[], positions:PositionCode[], evidence:PlaystyleEvidenceR124='LEGACY_GAME', strictPositions=false): PhasePlaystyleEntryR124 => ({ label, phase:'OFFENSIVE', aliases, positions, evidence, strictPositions });
const DEF = (label:string, aliases:string[], positions:PositionCode[], evidence:PlaystyleEvidenceR124='GAME_EXPORT_CORROBORATED', strictPositions=false): PhasePlaystyleEntryR124 => ({ label, phase:'DEFENSIVE', aliases, positions, evidence, strictPositions });

/**
 * Catálogo-base v6.0/eFootball 2027. Os nomes em inglês são preservados quando
 * a localização PT-BR ainda não foi publicada de forma inequívoca. Isso é
 * deliberado: o app não inventa tradução oficial.
 */
export const BUILTIN_OFFENSIVE_PLAYSTYLES_R124: readonly PhasePlaystyleEntryR124[] = [
  OFF('Básico', ['Basic','Default','Padrão'], [], 'GAME_EXPORT_CORROBORATED'),
  OFF('Artilheiro', ['Goal Poacher','Adv. Striker','Advanced Striker','Atacante matador'], ['CF'], 'LEGACY_GAME', true),
  OFF('Homem de Área', ['Fox in the Box'], ['CF'], 'LEGACY_GAME', true),
  OFF('Pivô', ['Target Man'], ['CF'], 'LEGACY_GAME', true),
  OFF('Puxa Marcação', ['Dummy Runner'], ['CF','SS'], 'LEGACY_GAME'),
  OFF('Atacante Pivô', ['Deep Lying Forward'], ['CF','SS'], 'LEGACY_GAME'),
  OFF('Infiltração', ['Hole Player','Jogador de infiltração'], ['SS','AMF','CMF'], 'LEGACY_GAME'),
  OFF('Clássico 10', ['Classic No. 10','Classic N.10'], ['SS','AMF'], 'LEGACY_GAME'),
  OFF('Armador Criativo', ['Creative Playmaker'], ['AMF','SS','LWF','RWF'], 'LEGACY_GAME'),
  OFF('Perito em Cruzamento', ['Cross Specialist'], ['LWF','RWF','LMF','RMF'], 'LEGACY_GAME'),
  OFF('Lateral Móvel', ['Roaming Flank'], ['LWF','RWF','LMF','RMF'], 'LEGACY_GAME'),
  OFF('Ala Produtivo', ['Prolific Winger'], ['LWF','RWF'], 'LEGACY_GAME'),
  OFF('Orquestrador', ['Orchestrator'], ['CMF','DMF'], 'LEGACY_GAME'),
  OFF('1º Volante', ['Anchor Man','Primeiro volante','Âncora'], ['DMF'], 'LEGACY_GAME'),
  OFF('Meia versátil', ['Box-to-Box','Box to Box'], ['CMF','DMF','LMF','RMF'], 'LEGACY_GAME'),
  OFF('Lateral Ofensivo', ['Offensive Fullback','Offensive Full-back','Attacking Full-back','Attacking Fullback'], ['LB','RB'], 'LEGACY_GAME'),
  OFF('Lateral Defensivo', ['Defensive Fullback','Defensive Full-back','Defending Fullback'], ['LB','RB'], 'LEGACY_GAME'),
  OFF('Lateral Atacante', ['Fullback Finisher','Full-back Finisher'], ['LB','RB'], 'LEGACY_GAME'),
  OFF('Defensor Criativo', ['Build Up','Build-up','Construtor'], ['CB'], 'LEGACY_GAME'),
  OFF('Atacante Surpresa', ['Extra Frontman','Extra Front-man'], ['CB'], 'GAME_EXPORT_CORROBORATED'),
  // Confirmado em cartas exportadas atuais (ex.: Iker Casillas FC Porto 17-18).
  OFF('High Line GK', ['High-Line GK','Goleiro de linha alta'], ['GK'], 'GAME_EXPORT_CORROBORATED', true)
] as const;

export const BUILTIN_DEFENSIVE_PLAYSTYLES_R124: readonly PhasePlaystyleEntryR124[] = [
  DEF('Básico', ['Basic','Default','Padrão'], [], 'GAME_EXPORT_CORROBORATED'),
  // Nome PT-BR explicitamente usado pela Konami no exemplo da v6.0.
  DEF('Pressão no Ataque', ['Front Line Pressure','Frontline Pressure','Front Pressure','Attacking Pressure'], ['CF','SS','LWF','RWF'], 'KONAMI_PTBR'),
  DEF('Front Line Poacher', ['Frontline Poacher'], ['CF','SS']),
  DEF('Attack Outlet', ['Attacking Outlet'], ['CF','SS']),
  DEF('Pass Disruptor', ['Passing Disruptor'], ['AMF']),
  DEF('Meia versátil', ['Box-to-Box','Box to Box'], ['CMF','DMF','LMF','RMF'], 'LEGACY_GAME'),
  DEF('All Action Defender', ['All-Action Defender','Action Defender'], ['DMF','CMF','LMF','RMF']),
  DEF('1º Volante', ['Anchor Man','Primeiro volante','Âncora'], ['DMF','CMF'], 'LEGACY_GAME'),
  DEF('Covering Role', ['Covering','Coverage Role'], ['CMF','DMF','CB','LB','RB']),
  DEF('High Line Master', ['High-Line Master','Offside Trap Master'], ['CB','LB','RB']),
  DEF('Destruidor', ['O destruidor','The Destroyer','Destroyer'], ['CB','DMF','LB','RB'], 'GAME_EXPORT_CORROBORATED'),
  DEF('Sweeper GK', ['Sweeper Goalkeeper'], ['GK'], 'GAME_EXPORT_CORROBORATED', true),
  DEF('Goleiro Ofensivo', ['Offensive GK','Attacking GK','Offensive Goalkeeper'], ['GK'], 'GAME_EXPORT_CORROBORATED', true),
  DEF('Goleiro Defensivo', ['Defensive GK','Defensive Goalkeeper'], ['GK'], 'GAME_EXPORT_CORROBORATED', true)
] as const;

export type RemotePhaseExtensionR124 = {
  label: string;
  phase: PlaystylePhaseR124;
  aliases?: string[];
  positions?: PositionCode[];
  confirmed?: boolean;
};

function sanitizeRemoteEntry(value: unknown): RemotePhaseExtensionR124 | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<RemotePhaseExtensionR124>;
  const label = String(raw.label ?? '').replace(/\s+/g,' ').trim().slice(0,64);
  if (!label || (raw.phase !== 'OFFENSIVE' && raw.phase !== 'DEFENSIVE') || raw.confirmed !== true) return null;
  const aliases = Array.isArray(raw.aliases) ? raw.aliases.map((x)=>String(x).trim()).filter(Boolean).slice(0,20) : [];
  const valid = new Set<PositionCode>(['GK','CB','LB','RB','DMF','CMF','LMF','RMF','AMF','LWF','RWF','SS','CF']);
  const positions = Array.isArray(raw.positions) ? raw.positions.filter((x):x is PositionCode=>valid.has(x as PositionCode)).slice(0,13) : [];
  return { label, phase: raw.phase, aliases, positions, confirmed:true };
}

export function readRemotePhaseExtensionsR124(): RemotePhaseExtensionR124[] {
  try {
    const raw = readAccountStorage(REMOTE_PHASE_EXTENSIONS_R124_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(sanitizeRemoteEntry).filter((x):x is RemotePhaseExtensionR124=>Boolean(x)) : [];
  } catch { return []; }
}

export function writeRemotePhaseExtensionsR124(entries: RemotePhaseExtensionR124[]) {
  const safe = entries.map(sanitizeRemoteEntry).filter((x):x is RemotePhaseExtensionR124=>Boolean(x));
  writeAccountStorage(REMOTE_PHASE_EXTENSIONS_R124_KEY, JSON.stringify(safe.slice(0,120)));
}

function remoteAsEntry(entry: RemotePhaseExtensionR124): PhasePlaystyleEntryR124 {
  return { label:entry.label, phase:entry.phase, aliases:entry.aliases ?? [], positions:entry.positions ?? [], evidence:'REMOTE_CONFIRMED' };
}

export function effectivePhaseEntriesR124(phase: PlaystylePhaseR124): PhasePlaystyleEntryR124[] {
  const base = phase === 'OFFENSIVE' ? [...BUILTIN_OFFENSIVE_PLAYSTYLES_R124] : [...BUILTIN_DEFENSIVE_PLAYSTYLES_R124];
  const remote = readRemotePhaseExtensionsR124().filter((x)=>x.phase===phase).map(remoteAsEntry);
  const out: PhasePlaystyleEntryR124[]=[]; const seen=new Set<string>();
  for (const entry of [...base,...remote]) { const key=normalize(entry.label); if (!key || seen.has(key)) continue; seen.add(key); out.push(entry); }
  return out;
}

function canonicalKeys(value: unknown): string[] {
  const key = normalize(value);
  if (!key) return [];
  const prefixes = [
    'estilo de jogo ', 'playing style ',
    'estilo de jogo ofensivo ', 'estilo ofensivo ', 'offensive playstyle ', 'attacking playstyle ',
    'estilo de jogo defensivo ', 'estilo defensivo ', 'defensive playstyle ', 'defending playstyle ',
    'com a bola ', 'sem a bola ', 'quando atacando ', 'quando defendendo ',
    'ataque ', 'atacando ', 'ofensivo ', 'attack ', 'attacking ', 'offensive ', 'att ',
    'defesa ', 'defendendo ', 'defensivo ', 'defence ', 'defense ', 'defending ', 'defensive ', 'def '
  ];
  const out = new Set<string>([key]);
  for (const prefix of prefixes) if (key.startsWith(prefix)) out.add(key.slice(prefix.length).trim());
  return [...out].filter(Boolean);
}

function canonicalize(value: unknown, phase: PlaystylePhaseR124): string | null {
  const keys=canonicalKeys(value); if (!keys.length) return null;
  for (const entry of effectivePhaseEntriesR124(phase)) {
    const identities=[entry.label,...entry.aliases].map(normalize).filter(Boolean);
    if (keys.some((key)=>identities.includes(key))) return entry.label;
  }
  return null;
}


export function findPhasePlaystyleMatchesR124(value: unknown, phase: PlaystylePhaseR124) {
  const text=normalize(value);
  if (!text) return [] as Array<{ label:string; index:number; end:number }>;
  const matches:Array<{ label:string; index:number; end:number }>=[];
  for (const entry of effectivePhaseEntriesR124(phase)) {
    const identities=Array.from(new Set([entry.label,...entry.aliases].map(normalize).filter(Boolean))).sort((a,b)=>b.length-a.length);
    let best:{label:string;index:number;end:number}|null=null;
    for (const identity of identities) {
      const padded=` ${text} `; const needle=` ${identity} `; const at=padded.indexOf(needle);
      if (at<0) continue;
      const index=Math.max(0,at); const candidate={label:entry.label,index,end:index+identity.length};
      if (!best || candidate.index<best.index || (candidate.index===best.index && candidate.end>best.end)) best=candidate;
    }
    if (best) matches.push(best);
  }
  return matches.sort((a,b)=>a.index-b.index || (b.end-b.index)-(a.end-a.index));
}

export const canonicalizeOffensivePlaystyleR124 = (value: unknown) => canonicalize(value,'OFFENSIVE');
export const canonicalizeDefensivePlaystyleR124 = (value: unknown) => canonicalize(value,'DEFENSIVE');

export function phasePlaystyleOptionsR124(phase: PlaystylePhaseR124) {
  return effectivePhaseEntriesR124(phase).map((x)=>x.label);
}

export function inspectPlaystyleActivationR124(style: string | null | undefined, phase: PlaystylePhaseR124, position: PositionCode | 'AUTO' | null | undefined) {
  const canonical=canonicalize(style,phase); if (!canonical) return { known:false, canonical:null, status:'UNKNOWN' as const, message:'Estilo ainda não confirmado no catálogo desta fase.' };
  const entry=effectivePhaseEntriesR124(phase).find((x)=>x.label===canonical)!;
  if (!position || position==='AUTO' || entry.positions.length===0) return { known:true, canonical, status:'UNVERIFIED_POSITION' as const, message:'Estilo reconhecido; confirme a posição final para avaliar ativação.' };
  if (entry.positions.includes(position)) return { known:true, canonical, status:'LIKELY_ACTIVE' as const, message:'Compatível com a posição selecionada segundo o catálogo atual.' };
  if (entry.strictPositions) return { known:true, canonical, status:'LIKELY_INACTIVE' as const, message:`Este estilo é conhecido para ${entry.positions.join('/')} e pode ficar inativo em ${position}.` };
  return { known:true, canonical, status:'CHECK_POSITION' as const, message:`A posição ${position} não está entre as posições mais observadas (${entry.positions.join('/') || 'sem lista'}). Confira se o estilo fica ativo no jogo.` };
}
