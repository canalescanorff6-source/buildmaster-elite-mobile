export type AccountStatus = 'active'|'suspended'|'blocked'|'expired';
export type AccountExpiryMode = 'days'|'date'|'never';
export type AdminUserRow = { id:string; username:string; displayName:string; role:'admin'|'user'; status:AccountStatus; plan:string; expiresAt:string|null; maxDevices:number; deviceCount?:number; lastAccessAt?:string|null; createdAt?:string };
export type AdminBackendHealth = { ready:boolean; databaseReady:boolean; functionReady:boolean; adminRoleReady:boolean; mfaRequired:boolean; currentLevel:'aal1'|'aal2'; profileCount:number; userCount:number; minAppVersion:string; message:string };
export type AdminMfaFactor = { id:string; status:'verified'|'unverified'; friendlyName:string; createdAt?:string };
export type AdminMfaStatus = { currentLevel:'aal1'|'aal2'; factors:AdminMfaFactor[]; verifiedFactor:AdminMfaFactor|null; protected:boolean };
export type AdminMfaEnrollment = { factorId:string; qrCode:string; secret:string; uri:string };
export type AdminSecuritySettings = { minAppVersion:string; allowLegacyClients:boolean; requireDeviceProof:boolean; adminMfaRequired:boolean; userOfflineGraceHours:number; adminOfflineGraceHours:number; updatedAt:string };
export type AdminDeviceRow = { id:string; userId:string; username:string; deviceId:string; deviceName:string; platform:string; firstSeenAt:string; lastSeenAt:string; revokedAt:string|null; securityVersion:number; protected:boolean };
export type AdminAuditRow = { id:string; adminId:string|null; adminUsername:string; targetUserId:string|null; targetUsername:string|null; action:string; outcome:'success'|'denied'|'error'; appVersion:string|null; details:Record<string,unknown>; createdAt:string };
export type AdminRateLimitRow = { action:string; requestCount:number; windowStartedAt:string; updatedAt:string };
export type AdminOverview = { users:AdminUserRow[]; devices:AdminDeviceRow[]; audit:AdminAuditRow[]; settings:AdminSecuritySettings; rateLimits:AdminRateLimitRow[]; generatedAt:string };
export type AdminCreateUserResult = { success:boolean; userId:string; username:string; requestId:string; authConfirmed:boolean; profileConfirmed:boolean; expiryConfirmed:boolean; duplicateBlocked:boolean };
export type AdminUserAction =
  | { action:'health' }
  | { action:'restore_account_creation' }
  | { action:'list' }
  | { action:'overview'; auditLimit?:number }
  | { action:'list_devices'; userId?:string; includeRevoked?:boolean }
  | { action:'revoke_device'; userId:string; deviceId:string }
  | { action:'list_audit'; limit?:number; targetUserId?:string }
  | { action:'get_security_settings' }
  | { action:'update_security_settings'; settings:Partial<Omit<AdminSecuritySettings,'updatedAt'>> }
  | { action:'rate_limit_status' }
  | { action:'create'; username:string; password:string; displayName?:string; expiryMode:AccountExpiryMode; durationDays?:number; expiresAt?:string|null; maxDevices:number; plan?:string; clientRequestId:string }
  | { action:'renew'; userId:string; durationDays:number }
  | { action:'set_status'; userId:string; status:Exclude<AccountStatus,'expired'> }
  | { action:'reset_password'; userId:string; password:string }
  | { action:'set_devices'; userId:string; maxDevices:number }
  | { action:'revoke_devices'; userId:string }
  | { action:'delete'; userId:string };
export function adminAccountRequest<T = {users?:AdminUserRow[];success?:boolean}>(_action:AdminUserAction):Promise<T> { throw new Error('stub'); }
export function beginAdminMfaEnrollment():Promise<AdminMfaEnrollment> { throw new Error('stub'); }
export function getAdminMfaStatus():Promise<AdminMfaStatus> { throw new Error('stub'); }
export function getAdminBackendHealth():Promise<AdminBackendHealth> { throw new Error('stub'); }
export function isCloudAccountsConfigured():boolean { return true; }
export function validateOnlineLicense():Promise<{profile:{username:string}}> { throw new Error('stub'); }
export function verifyAdminMfa(_factorId:string, _code:string):Promise<AdminMfaStatus> { throw new Error('stub'); }
export function validateUsername(_username:string):string { return ''; }
