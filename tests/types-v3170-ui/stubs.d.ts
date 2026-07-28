declare namespace JSX {
  interface Element {}
  interface IntrinsicElements { [name: string]: any }
}

declare module 'react' {
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export type MutableRefObject<T> = { current: T };
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useRef<T>(initial: T): MutableRefObject<T>;
}

declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}

declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const AlertTriangle: Icon; export const CheckCircle2: Icon; export const CircleStop: Icon;
  export const Clock3: Icon; export const Download: Icon; export const Film: Icon; export const Gauge: Icon;
  export const Import: Icon; export const LoaderCircle: Icon; export const Play: Icon; export const RotateCcw: Icon; export const Share2: Icon;
  export const ShieldCheck: Icon; export const Smartphone: Icon; export const Trash2: Icon; export const Video: Icon; export const Wifi: Icon;
}

declare module '@capacitor/core' {
  export type PluginListenerHandle = { remove(): Promise<void> };
  export const Capacitor: { convertFileSrc(path: string): string; isNativePlatform(): boolean };
  export function registerPlugin<T>(name: string): T;
}

declare module '@/lib/analyzer' { export type TacticalStyle = string; }
declare module '@/modules/core/centralIntelligence' { export type TeamDiagnosis = { formation: string }; }

declare module '@/modules/matches/matchRecorderBridge' {
  export type MatchRecordingQuality = 'economy' | 'balanced' | 'detailed';
  export type MatchRecordingDescriptor = { id:string; path:string; uri?:string; publicFileName?:string; relativePath?:string; fileName:string; sizeBytes:number; quality:MatchRecordingQuality; state:string };
  export type MatchRecorderStatus = { state:string; active:boolean; startedAt:number|null; elapsedMs:number; last?:MatchRecordingDescriptor|null };
  export type MatchRecorderCapabilities = { supported:boolean; profiles:MatchRecordingQuality[]; maxRecommendedProfile:MatchRecordingQuality; reason?:string };
  export function deleteMatchRecording(id:string):Promise<boolean>;
  export function getMatchRecorderCapabilities():Promise<MatchRecorderCapabilities>;
  export function getMatchRecorderStatus():Promise<MatchRecorderStatus>;
  export function listMatchRecordings():Promise<MatchRecordingDescriptor[]>;
  export function listenToMatchRecorder(cb:(status:MatchRecorderStatus)=>void):Promise<{remove():Promise<void>}|null>;
  export function restoreMatchRecorderOrientation():Promise<boolean>;
  export function saveMatchRecordingToGallery(id:string):Promise<{saved:boolean;reused:boolean;id:string;uri:string;fileName:string;relativePath:string}>;
  export function shareMatchRecording(id:string):Promise<{saved:boolean;reused:boolean;shared:boolean;id:string;uri:string;fileName:string;relativePath:string}>;
  export function startMatchRecording(options:{quality:MatchRecordingQuality;landscape:boolean;includeMicrophone:boolean;title:string}):Promise<MatchRecorderStatus>;
  export function stopMatchRecording():Promise<MatchRecorderStatus>;
}

declare module '@/modules/matches/matchTrainerEngine' {
  export type MatchEventKind = 'pass-error'|'dangerous-turnover'|'marking-error'|'cursor-error'|'forced-shot'|'good-play'|'possible-delay'|'goal-for'|'goal-against'|'note';
  export type MatchTrainerSession = { id:string; createdAt:string; updatedAt:string; title:string; source:'native-recording'|'imported-video'; videoPath?:string; fileName:string; fileSizeBytes:number; recording?:import('@/modules/matches/matchRecorderBridge').MatchRecordingDescriptor|null; quality:import('@/modules/matches/matchRecorderBridge').MatchRecordingQuality|'imported'; formation:string; teamStyle:string; manager:string; connectionRating:1|2|3|4|5; notes:string; analysis?:{qualityScore:number;automaticMarkers:Array<{id:string;atMs:number;kind:MatchEventKind;source:'manual'|'automatic';confidence:number;title:string;detail:string}>}|null; markers:Array<{id:string;atMs:number;kind:MatchEventKind;source:'manual'|'automatic';confidence:number;title:string;detail:string}>; status:'recorded'|'analyzing'|'review'|'completed'|'failed' };
  export function analyzeMatchVideo(source:Blob|string,options:Record<string,unknown>):Promise<any>;
  export function createMatchMarker(kind:MatchEventKind,atMs:number,detail?:string):any;
  export function createMatchTrainerSession(input:Record<string,unknown>):MatchTrainerSession;
  export function deleteMatchTrainerSession(id:string):MatchTrainerSession[];
  export function exportMatchTrainerReport(session:MatchTrainerSession):string;
  export function readMatchTrainerSessions():MatchTrainerSession[];
  export function summarizeMatchTrainerSession(session:MatchTrainerSession):{verdict:string;passErrors:number;dangerousTurnovers:number;markingErrors:number;cursorErrors:number;forcedShots:number;possibleDelay:number;priorities:string[];matchRules:string[]};
  export function upsertMatchTrainerSession(session:MatchTrainerSession):MatchTrainerSession[];
}
