import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { fetchWithTimeout } from './fetchWithTimeout';
import { buildCuratedCatalogR124, CURATED_EFOOTBALL_SOURCES_R124, type CuratedCatalogSourceR124 } from './efootballCatalogDiscoveryCoreR124';

export const EFOOTBALL_CATALOG_DISCOVERY_R124_VERSION='r124-native-curated-2' as const;
export { buildCuratedCatalogR124, CURATED_EFOOTBALL_SOURCES_R124 } from './efootballCatalogDiscoveryCoreR124';

async function getText(source:CuratedCatalogSourceR124){
  if(Capacitor.isNativePlatform()){
    try{const r=await CapacitorHttp.get({url:source.url,headers:{Accept:'text/html,*/*','Cache-Control':'no-cache','Accept-Encoding':'identity'},connectTimeout:8_000,readTimeout:12_000,responseType:'text'});return r.status>=200&&r.status<300?String(r.data??''):null;}catch{return null;}
  }
  try{const r=await fetchWithTimeout(source.url,{cache:'no-store',headers:{Accept:'text/html,*/*'},redirect:'follow'},8_000);return r.ok?await r.text():null;}catch{return null;}
}

export async function discoverCuratedCatalogR124(){
  const results=await Promise.all(CURATED_EFOOTBALL_SOURCES_R124.map(async(source)=>[source.id,await getText(source)] as const));
  const sourceHtml=new Map<string,string>();for(const [id,html] of results)if(html)sourceHtml.set(id,html);
  return buildCuratedCatalogR124(sourceHtml);
}
