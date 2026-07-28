export type StubAccount = { profile: { id:string; username:string; displayName:string; role:'admin'|'user'; status:'active'|'suspended'|'blocked'|'expired'; plan:string; expiresAt:string|null; maxDevices:number } };
export function useBuildMasterAccount(): StubAccount | null { return null; }
