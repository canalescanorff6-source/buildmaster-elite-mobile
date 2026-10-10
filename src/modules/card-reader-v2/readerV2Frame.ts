import type {ReaderV2Zone} from './readerV2Types';

export type ReaderV2Frame = {x:number;y:number;w:number;h:number};
type Pixels = {width:number;height:number;data:Uint8ClampedArray};
type Badge = {x:number;y:number;w:number};
type Column = {x:number;size:number;pitch:number;rows:number[]};
const median=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)]};

// Locate the table independently of player text and screenshot margins.
export function detectReaderV2Frame({width,height,data}:Pixels):ReaderV2Frame|undefined {
 if(width<100||height<100||data.length!==width*height*4)return;
 const mask=new Uint8Array(width*height);
 for(let i=0;i<mask.length;i++){
  const r=data[i*4],g=data[i*4+1],b=data[i*4+2];
  mask[i]=Math.max(r,g,b)>180&&Math.max(r,g,b)-Math.min(r,g,b)>65?1:0;
 }
 const queue=new Int32Array(mask.length);const badges:Badge[]=[];
 for(let seed=0;seed<mask.length;seed++){
  if(!mask[seed])continue;
  mask[seed]=0;queue[0]=seed;let head=0,tail=1;
  let x1=width,y1=height,x2=0,y2=0;
  while(head<tail){
   const index=queue[head++],x=index%width,y=Math.floor(index/width);
   x1=Math.min(x1,x);y1=Math.min(y1,y);x2=Math.max(x2,x);y2=Math.max(y2,y);
   const visit=(next:number)=>{if(mask[next]){mask[next]=0;queue[tail++]=next}};
   if(x>0)visit(index-1);if(x+1<width)visit(index+1);
   if(y>0)visit(index-width);if(y+1<height)visit(index+width);
  }
  const w=x2-x1+1,h=y2-y1+1;
  if(w<4||h<4||w>width*.12||h/w<.6||h/w>11||tail/(w*h)<.52)continue;
  // Resampling can join neighboring badges.
  const count=h/w>1.7?Math.round(h/(w*1.08)):1;
  if(count<1||count>10)continue;
  for(let row=0;row<count;row++)badges.push({x:x1+w/2,y:y1+(row+.5)*h/count,w});
  if(badges.length>2048)return;
 }
 const groups:Badge[][]=[];
 for(const badge of badges){
  const group=groups.find(items=>Math.abs(items[0].x-badge.x)<Math.max(2,badge.w*.3)&&badge.w/items[0].w>.65&&badge.w/items[0].w<1.5);
  if(group)group.push(badge);else groups.push([badge]);
 }
 const columns:Column[]=[];
 for(const group of groups){
  group.sort((a,b)=>a.y-b.y);
  for(let start=0;start+5<group.length;start++){
   const size=median(group.slice(start,start+6).map(b=>b.w));
   const pitch=group[start+1].y-group[start].y;
   if(pitch<size*.75||pitch>size*1.65)continue;
   const rows=[group[start].y];
   for(let next=start+1;next<group.length;next++){
    const y=group[next].y,distance=y-rows[rows.length-1];
    if(distance>pitch*2.15||y-rows[0]>pitch*9.4)break;
    if(distance<pitch*.65)continue;
    const row=Math.round((y-rows[0])/pitch);
    if(Math.abs(y-rows[0]-row*pitch)>pitch*.25)break;
    rows.push(y);
   }
   if(rows.length>=6)columns.push({x:median(group.slice(start,start+rows.length).map(b=>b.x)),size,pitch:median(rows.slice(1).map((y,i)=>(y-rows[i])/Math.round((y-rows[i])/pitch))),rows});
  }
 }
 columns.sort((a,b)=>a.x-b.x);
 if(columns.length>128)return;
 const candidates:ReaderV2Frame[]=[];
 for(const left of columns)for(const middle of columns)for(const right of columns){
  const spacing=middle.x-left.x;if(spacing<left.size*5)continue;
  if(Math.abs(right.x-middle.x-spacing)>spacing*.08)continue;
  const pitch=median([left.pitch,middle.pitch,right.pitch]);
  if([left,middle,right].some(c=>Math.abs(c.pitch-pitch)>pitch*.15||c.size/left.size<.7||c.size/left.size>1.4||Math.abs(c.rows[0]-left.rows[0])>pitch*.3))continue;
  const lengths=[left,middle,right].map(c=>Math.round((c.rows[c.rows.length-1]-c.rows[0])/pitch)+1);
  if(lengths[0]!==10||lengths[1]!==9||lengths[2]!==7)continue;
  const w=(right.x-left.x)*1400/920,h=pitch*1600/47.7;
  const x=left.x-w*424/1400,y=median([left.rows[0],middle.rows[0],right.rows[0]])-h*588/1600;
  if(w<100||h<100||w/h<.65||w/h>1.1||x< -width*.025||y< -height*.025||x+w>width*1.025||y+h>height*1.08)continue;
  const frame={x:Math.max(0,x)/width,y:Math.max(0,y)/height,w:Math.min(w,width-Math.max(0,x))/width,h:Math.min(h,height-Math.max(0,y))/height};
  if(!candidates.some(c=>Math.abs(c.x-frame.x)*width<pitch&&Math.abs(c.y-frame.y)*height<pitch))candidates.push(frame);
 }
 // Ambiguous panels require selection.
 if(candidates.length!==1)return;
 const frame=candidates[0];
 if(frame.x<.035&&frame.y<.035&&frame.w>.94&&frame.h>.92)return {x:0,y:0,w:1,h:1};
 return frame;
}

export function detectReaderV2ImageFrame(source:CanvasImageSource&{width:number;height:number}):ReaderV2Frame|undefined {
 const canvas=document.createElement('canvas');
 try{
  const scale=Math.min(1,1800/Math.max(source.width,source.height));
  canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
  const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return;
  context.drawImage(source,0,0,canvas.width,canvas.height);
  return detectReaderV2Frame(context.getImageData(0,0,canvas.width,canvas.height));
 }finally{canvas.width=1;canvas.height=1}
}

export function mapReaderV2ZoneToFrame(zone:ReaderV2Zone,frame:ReaderV2Frame):ReaderV2Zone {
 return {...zone,x:frame.x+zone.x*frame.w,y:frame.y+zone.y*frame.h,w:zone.w*frame.w,h:zone.h*frame.h};
}
