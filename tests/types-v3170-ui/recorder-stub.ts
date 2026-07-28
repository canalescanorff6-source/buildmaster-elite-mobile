export type MatchRecordingQuality = 'economy' | 'balanced' | 'detailed';
export type MatchRecordingDescriptor = { id:string; path:string; fileName:string; sizeBytes:number; quality:MatchRecordingQuality; state:string };
export type MatchRecorderStatus = { state:string; active:boolean; startedAt:number|null; elapsedMs:number; last?:MatchRecordingDescriptor|null };
export type MatchRecorderCapabilities = { supported:boolean; profiles:MatchRecordingQuality[]; maxRecommendedProfile:MatchRecordingQuality; reason?:string };
export function deleteMatchRecording(_id:string):Promise<boolean>{return Promise.resolve(true)}
export function getMatchRecorderCapabilities():Promise<MatchRecorderCapabilities>{return Promise.resolve({supported:true,profiles:['balanced'],maxRecommendedProfile:'balanced'})}
export function getMatchRecorderStatus():Promise<MatchRecorderStatus>{return Promise.resolve({state:'idle',active:false,startedAt:null,elapsedMs:0})}
export function listMatchRecordings():Promise<MatchRecordingDescriptor[]>{return Promise.resolve([])}
export function listenToMatchRecorder(_cb:(status:MatchRecorderStatus)=>void):Promise<{remove():Promise<void>}|null>{return Promise.resolve(null)}
export function restoreMatchRecorderOrientation():Promise<boolean>{return Promise.resolve(true)}
export function startMatchRecording(_options:{quality:MatchRecordingQuality;landscape:boolean;includeMicrophone:boolean;title:string}):Promise<MatchRecorderStatus>{return getMatchRecorderStatus()}
export function stopMatchRecording():Promise<MatchRecorderStatus>{return getMatchRecorderStatus()}
