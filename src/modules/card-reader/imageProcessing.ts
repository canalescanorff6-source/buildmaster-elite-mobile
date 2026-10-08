import { getRuntimeOptimizationProfile, planAdaptiveImageSize } from '@/lib/invisibleOptimizationV3820';

export type ImageEnhancement = 'original' | 'color' | 'contrast' | 'sharp' | 'binary' | 'inverted';
type PixelBuffer = Uint8ClampedArray<ArrayBufferLike>;
type DecodedBitmap = ImageBitmap | (HTMLImageElement & { close?: () => void });
const safeOcrSourceCache=new WeakMap<Blob,Promise<Blob|File>>();
const isAndroidRuntime=()=>typeof navigator!=='undefined'&&/Android/i.test(navigator.userAgent);
const ocrReadingActive=()=>typeof document!=='undefined'&&document.body?.dataset.ocrReading==='active';

function normalizeLine(line:string){return line.replace(/\s+/g,' ').trim();}
export function mergeOcrTexts(...texts:string[]){
  const lines=new Map<string,string>();
  for(const text of texts)for(const line of text.split(/\r?\n/).map(normalizeLine).filter(Boolean)){
    const key=line.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
    if(key&&!lines.has(key))lines.set(key,line);
  }
  return Array.from(lines.values()).join('\n');
}

async function htmlImageFallback(file:File|Blob):Promise<DecodedBitmap|null>{
  if(typeof document==='undefined'||typeof URL==='undefined'||!URL.createObjectURL)return null;
  return new Promise((resolve)=>{
    const url=URL.createObjectURL(file),image=new Image();let settled=false;
    const finish=(value:DecodedBitmap|null)=>{if(settled)return;settled=true;globalThis.clearTimeout(timer);if(!value)URL.revokeObjectURL(url);resolve(value);};
    const timer=globalThis.setTimeout(()=>finish(null),8_000);
    image.onload=()=>{const decoded=image as DecodedBitmap;decoded.close=()=>{image.src='';URL.revokeObjectURL(url);};finish(decoded);};
    image.onerror=()=>finish(null);image.src=url;
  });
}

export async function imageToBitmap(file:File|Blob):Promise<DecodedBitmap|null>{
  if(typeof document==='undefined')return null;
  if(typeof createImageBitmap!=='undefined'){
    const bitmap=await new Promise<ImageBitmap|null>((resolve)=>{
      let settled=false;
      const timer=globalThis.setTimeout(()=>{if(!settled){settled=true;resolve(null);}},8_000);
      createImageBitmap(file).then((value)=>{if(settled){value.close?.();return;}settled=true;globalThis.clearTimeout(timer);resolve(value);},()=>{if(!settled){settled=true;globalThis.clearTimeout(timer);resolve(null);}});
    });
    if(bitmap)return bitmap;
  }
  return htmlImageFallback(file);
}

function clampByte(value:number){return Math.max(0,Math.min(255,Math.round(value)));}
function luminance(red:number,green:number,blue:number){return red*.299+green*.587+blue*.114;}
function grayscaleInPlace(data:PixelBuffer){
  for(let i=0;i<data.length;i+=4){const gray=clampByte(luminance(data[i],data[i+1],data[i+2]));data[i]=gray;data[i+1]=gray;data[i+2]=gray;}
}
function darkUiRatio(data:PixelBuffer){
  let sampled=0,dark=0;
  for(let i=0;i<data.length;i+=32){sampled++;if(luminance(data[i],data[i+1],data[i+2])<82)dark++;}
  return sampled?dark/sampled:0;
}
function signalAt(data:PixelBuffer,index:number,brightForeground:boolean){
  return brightForeground?Math.max(data[index],data[index+1],data[index+2]):clampByte(luminance(data[index],data[index+1],data[index+2]));
}
function otsuThresholdRgba(data:PixelBuffer,brightForeground:boolean){
  const histogram=new Uint32Array(256);let pixels=0,total=0;
  for(let i=0;i<data.length;i+=4){const value=signalAt(data,i,brightForeground);histogram[value]++;pixels++;total+=value;}
  if(!pixels)return 128;
  let backgroundWeight=0,backgroundSum=0,bestVariance=-1,bestThreshold=128;
  for(let threshold=0;threshold<256;threshold++){
    backgroundWeight+=histogram[threshold];if(!backgroundWeight)continue;
    const foregroundWeight=pixels-backgroundWeight;if(!foregroundWeight)break;
    backgroundSum+=threshold*histogram[threshold];
    const backgroundMean=backgroundSum/backgroundWeight,foregroundMean=(total-backgroundSum)/foregroundWeight;
    const between=backgroundWeight*foregroundWeight*(backgroundMean-foregroundMean)**2;
    if(between>bestVariance){bestVariance=between;bestThreshold=threshold;}
  }
  return bestThreshold;
}
function applyContrast(data:PixelBuffer,factor:number,lift:number){
  for(let i=0;i<data.length;i+=4){const value=clampByte((data[i]-128)*factor+128+lift);data[i]=value;data[i+1]=value;data[i+2]=value;}
}
function sharpenGrayscaleInPlace(data:PixelBuffer,width:number,height:number){
  if(width<3||height<3)return;
  const source=new Uint8ClampedArray(data);
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const i=(y*width+x)*4;
    const next=clampByte(source[i]*5-source[i-4]-source[i+4]-source[i-width*4]-source[i+width*4]);
    data[i]=next;data[i+1]=next;data[i+2]=next;
  }
}
function enhancePixels(imageData:ImageData,mode:ImageEnhancement){
  if(mode==='original')return;
  const data=imageData.data;
  if(mode==='color'){
    for(let i=0;i<data.length;i+=4){const gray=luminance(data[i],data[i+1],data[i+2]);data[i]=clampByte((data[i]-gray)*.72+gray*1.06+5);data[i+1]=clampByte((data[i+1]-gray)*.72+gray*1.06+5);data[i+2]=clampByte((data[i+2]-gray)*.72+gray*1.06+5);}return;
  }
  if(mode==='contrast'||mode==='sharp'){
    grayscaleInPlace(data);applyContrast(data,mode==='sharp'?2.08:1.72,mode==='sharp'?20:15);
    if(mode==='sharp')sharpenGrayscaleInPlace(data,imageData.width,imageData.height);
    return;
  }
  const brightForeground=darkUiRatio(data)>=.58,threshold=otsuThresholdRgba(data,brightForeground);
  for(let i=0;i<data.length;i+=4){const signal=signalAt(data,i,brightForeground);const foreground=brightForeground?signal>threshold:signal<=threshold;const value=mode==='inverted'?(foreground?0:255):(foreground?255:0);data[i]=value;data[i+1]=value;data[i+2]=value;}
}

function canvasBlob(canvas:HTMLCanvasElement,fallback:File|Blob):Promise<Blob|File>{
  return new Promise((resolve)=>{let settled=false;const timer=globalThis.setTimeout(()=>{if(!settled){settled=true;resolve(fallback);}},6_000);canvas.toBlob((blob)=>{if(settled)return;settled=true;globalThis.clearTimeout(timer);resolve(blob??fallback);},'image/png',.96);});
}

export function releasePreparedOcrSource(file:File|Blob){safeOcrSourceCache.delete(file);}
function schedulePreparedOcrSourceRelease(file:File|Blob){
  if(typeof window==='undefined')return;
  const check=()=>{if(ocrReadingActive()){window.setTimeout(check,800);return;}releasePreparedOcrSource(file);};
  window.setTimeout(check,800);
}
export async function prepareRepeatedOcrSource(file:File|Blob):Promise<Blob|File>{
  if(!isAndroidRuntime()||typeof document==='undefined')return file;
  const cached=safeOcrSourceCache.get(file);if(cached)return cached;
  const task=(async()=>{
    const bitmap=await imageToBitmap(file);if(!bitmap)return file;
    const pixels=bitmap.width*bitmap.height,longest=Math.max(bitmap.width,bitmap.height);
    if(longest<=2800&&pixels<=5_000_000){bitmap.close?.();return file;}
    const profile={...getRuntimeOptimizationProfile(),maxFullOcrMegapixels:5};
    const plan=planAdaptiveImageSize(bitmap.width,bitmap.height,{workload:'ocr-full',preferredLongestSide:2800,minScale:.1,maxScale:1,profile});
    const canvas=document.createElement('canvas');
    try{canvas.width=plan.width;canvas.height=plan.height;const ctx=canvas.getContext('2d');if(!ctx)return file;ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);return await canvasBlob(canvas,file);}
    finally{bitmap.close?.();canvas.width=1;canvas.height=1;}
  })();
  safeOcrSourceCache.set(file,task);schedulePreparedOcrSourceRelease(file);return task;
}

export function expandOcrRegion(region:{x:number;y:number;w:number;h:number},horizontal=.04,vertical=.025){
  const x=Math.max(0,region.x-horizontal),y=Math.max(0,region.y-vertical),right=Math.min(1,region.x+region.w+horizontal),bottom=Math.min(1,region.y+region.h+vertical);
  return{x,y,w:Math.max(.01,right-x),h:Math.max(.01,bottom-y)};
}

export async function preprocessImage(file:File|Blob,mode:ImageEnhancement='contrast'):Promise<Blob|File>{
  const source=await prepareRepeatedOcrSource(file),bitmap=await imageToBitmap(source);if(!bitmap)return file;
  const plan=planAdaptiveImageSize(bitmap.width,bitmap.height,{workload:'ocr-full',preferredLongestSide:1800,minScale:.1,maxScale:1}),canvas=document.createElement('canvas');
  try{
    canvas.width=plan.width;canvas.height=plan.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return file;
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);enhancePixels(imageData,mode);ctx.putImageData(imageData,0,0);return await canvasBlob(canvas,file);
  }finally{bitmap.close?.();canvas.width=1;canvas.height=1;}
}

export async function cropImage(file:File|Blob,region:{x:number;y:number;w:number;h:number},widthTarget=1900,mode:ImageEnhancement='contrast'):Promise<Blob|File>{
  if(typeof document==='undefined')return file;
  const source=await prepareRepeatedOcrSource(file),bitmap=await imageToBitmap(source);if(!bitmap)return file;
  const cropX=Math.max(0,Math.round(bitmap.width*region.x)),cropY=Math.max(0,Math.round(bitmap.height*region.y));
  const cropW=Math.max(1,Math.min(bitmap.width-cropX,Math.round(bitmap.width*region.w))),cropH=Math.max(1,Math.min(bitmap.height-cropY,Math.round(bitmap.height*region.h)));
  const android=isAndroidRuntime(),safeTarget=Math.min(Math.max(720,widthTarget),android?1750:3200),baseProfile=getRuntimeOptimizationProfile();
  const profile=android?{...baseProfile,maxCropOcrMegapixels:1.8}:baseProfile;
  const plan=planAdaptiveImageSize(cropW,cropH,{workload:'ocr-crop',preferredLongestSide:safeTarget,minScale:android?.35:1,maxScale:android?2.2:4.2,profile}),canvas=document.createElement('canvas');
  try{
    canvas.width=plan.width;canvas.height=plan.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return file;
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,cropX,cropY,cropW,cropH,0,0,canvas.width,canvas.height);
    const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);enhancePixels(imageData,mode);ctx.putImageData(imageData,0,0);return await canvasBlob(canvas,file);
  }finally{bitmap.close?.();canvas.width=1;canvas.height=1;}
}
