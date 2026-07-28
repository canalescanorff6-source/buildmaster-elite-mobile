import type { MatchRecordingDescriptor, MatchRecordingQuality } from './recorder-stub';
export type MatchEventKind = 'pass-error'|'dangerous-turnover'|'marking-error'|'cursor-error'|'forced-shot'|'good-play'|'possible-delay'|'goal-for'|'goal-against'|'note';
export type MatchTrainerSession = { id:string; createdAt:string; updatedAt:string; title:string; source:'native-recording'|'imported-video'; videoPath?:string; fileName:string; fileSizeBytes:number; recording?:MatchRecordingDescriptor|null; quality:MatchRecordingQuality|'imported'; formation:string; teamStyle:string; manager:string; connectionRating:1|2|3|4|5; notes:string; analysis?:{qualityScore:number;automaticMarkers:Array<{id:string;atMs:number;kind:MatchEventKind;source:'manual'|'automatic';confidence:number;title:string;detail:string}>}|null; markers:Array<{id:string;atMs:number;kind:MatchEventKind;source:'manual'|'automatic';confidence:number;title:string;detail:string}>; status:'recorded'|'analyzing'|'review'|'completed'|'failed' };
export function analyzeMatchVideo(_source:Blob|string,_options:Record<string,unknown>):Promise<any>{return Promise.resolve({})}
export function createMatchMarker(kind:MatchEventKind,atMs:number,detail=''){return {id:'x',kind,atMs,detail,source:'manual' as const,confidence:100,title:kind}}
export function createMatchTrainerSession(_input:Record<string,unknown>):MatchTrainerSession{throw new Error('stub')}
export function deleteMatchTrainerSession(_id:string):MatchTrainerSession[]{return []}
export function exportMatchTrainerReport(_session:MatchTrainerSession):string{return ''}
export function readMatchTrainerSessions():MatchTrainerSession[]{return []}
export function summarizeMatchTrainerSession(_session:MatchTrainerSession){return {verdict:'',passErrors:0,dangerousTurnovers:0,markingErrors:0,cursorErrors:0,forcedShots:0,possibleDelay:0,priorities:[] as string[],matchRules:[] as string[]}}
export function upsertMatchTrainerSession(session:MatchTrainerSession):MatchTrainerSession[]{return [session]}
