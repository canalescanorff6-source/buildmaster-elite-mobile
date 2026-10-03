import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from './safeLocalStorage';

export type NativeInstallInfo={packageName:string;versionName:string;versionCode:number;canInstallPackages:boolean;platform:'android'};
export type ApkDownloadPhase='refreshing-manifest'|'preparing-backup'|'awaiting-permission'|'connecting'|'waiting-download'|'download-paused'|'downloading'|'downloading-system'|'downloading-http'|'copying'|'finalizing-file'|'verifying-checksum'|'verifying'|'verifying-package'|'verifying-signature'|'opening-installer'|'ready';
export type ApkDownloadProgress={phase:ApkDownloadPhase;percent:number;downloadedBytes:number;totalBytes:number};
export type NativeHttpResponse={status:number;data:string;headers:Record<string,string>;url:string;transport:'buildmaster-native-http'};
export type ApkInstallResult={verified:boolean;checksum?:string;needsPermission?:boolean;versionCode?:number;versionName?:string;finalUrl?:string;responseHost?:string;contentType?:string;contentEncoding?:string;contentLength?:number;etag?:string;transport?:'android-download-manager'|'http-automatic-redirect'|'http-manual-redirect'|string};
type HttpOptions={url:string;method:string;headers?:Record<string,string>;body?:string;connectTimeoutMs?:number;readTimeoutMs?:number};
type DownloadOptions={url:string;checksum:string;expectedPackageName:string;expectedVersionCode:number;expectedVersionName:string;expectedSizeBytes?:number;maxAttempts?:number};
type Identity={deviceId:string;publicKey:string;algorithm:string};
type Signature={signature:string;algorithm:string};
type SecureStoragePlugin={set(options:{key:string;value:string}):Promise<void>;get(options:{key:string}):Promise<{value:string|null}>;remove(options:{key:string}):Promise<void>;clear():Promise<void>;getDeviceIdentity():Promise<Identity>;signDeviceMessage(options:{message:string}):Promise<Signature>;getAppInstallInfo():Promise<NativeInstallInfo>;openInstallPermissionSettings():Promise<void>;nativeHttpRequest(options:HttpOptions):Promise<NativeHttpResponse>;downloadAndInstallApk(options:DownloadOptions):Promise<ApkInstallResult>;addListener(eventName:'apkDownloadProgress',listener:(event:ApkDownloadProgress)=>void):Promise<PluginListenerHandle>};
const BuildMasterSecurity=registerPlugin<SecureStoragePlugin>('BuildMasterSecurity'),isNative=()=>Capacitor.isNativePlatform();
function requireWebStorage(){if(typeof window==='undefined')throw new Error('Armazenamento local indisponível.');}
export async function secureSet(key:string,value:string):Promise<void>{if(isNative()){await BuildMasterSecurity.set({key,value});return}requireWebStorage();if(!safeStorageSet(key,value))throw new Error('Armazenamento local indisponível ou sem espaço.');}
export async function secureGet(key:string):Promise<string|null>{if(isNative())return(await BuildMasterSecurity.get({key})).value??null;requireWebStorage();return safeStorageGet(key);}
export async function secureRemove(key:string):Promise<void>{if(isNative()){await BuildMasterSecurity.remove({key});return}safeStorageRemove(key);}
export async function migrateLegacyValueToSecureStorage(key:string):Promise<string|null>{const secure=await secureGet(key);if(secure!=null)return secure;if(typeof window==='undefined')return null;const legacy=safeStorageGet(key);if(legacy==null)return null;await secureSet(key,legacy);safeStorageRemove(key);return legacy;}
export async function getNativeDeviceIdentity():Promise<Identity|null>{return isNative()?BuildMasterSecurity.getDeviceIdentity():null;}
export async function signNativeDeviceMessage(message:string):Promise<Signature|null>{return isNative()?BuildMasterSecurity.signDeviceMessage({message}):null;}
export async function getNativeInstallInfo():Promise<NativeInstallInfo|null>{return isNative()?BuildMasterSecurity.getAppInstallInfo():null;}
export async function openInstallPermissionSettings():Promise<void>{if(!isNative())throw new Error('A permissão de instalação existe somente no Android.');await BuildMasterSecurity.openInstallPermissionSettings();}
export async function nativeSecureHttpRequest(options:HttpOptions):Promise<NativeHttpResponse>{if(!isNative())throw new Error('Transporte HTTP nativo indisponível fora do Android.');return BuildMasterSecurity.nativeHttpRequest(options);}
export async function onApkDownloadProgress(listener:(event:ApkDownloadProgress)=>void):Promise<PluginListenerHandle|null>{return isNative()?BuildMasterSecurity.addListener('apkDownloadProgress',listener):null;}
export async function downloadVerifyAndInstallApk(options:DownloadOptions):Promise<ApkInstallResult>{if(!isNative())throw new Error('A instalação verificada está disponível somente no APK Android.');return BuildMasterSecurity.downloadAndInstallApk(options);}
