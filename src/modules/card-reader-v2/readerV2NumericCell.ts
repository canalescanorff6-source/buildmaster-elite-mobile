/** A cell must contain the whole printed number, never a surviving single digit. */
export function readerV2CellNumber(text: string, confidence: number): number | null {
  const token = text.trim();
  if (!/^\d{2,3}$/.test(token) || confidence < 55) return null;
  const value = Number(token);
  return value >= 10 && value <= 110 ? value : null;
}

/** Bounded retry on one small cell; the source crop remains available. */
export function thresholdReaderV2Cell(canvas: HTMLCanvasElement, removeNoise = false): void {
  const context = canvas.getContext('2d', {willReadFrequently:true});
  if (!context) return;
  const image = context.getImageData(0,0,canvas.width,canvas.height);
  const {data,width,height} = image;
  if (!removeNoise) {
    for (let i=0;i<data.length;i+=4) data[i]=data[i+1]=data[i+2]=data[i]<128?0:255;
  } else {
    const seen = new Uint8Array(width*height);
    for (let start=0;start<seen.length;start++) {
      if (seen[start] || data[start*4]>=128) continue;
      const pixels=[start];seen[start]=1;
      let left=width,right=0,top=height,bottom=0;
      for (let index=0;index<pixels.length;index++) {
        const point=pixels[index],x=point%width,y=Math.floor(point/width);
        left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
        for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++) {
          const xx=x+dx,yy=y+dy,next=yy*width+xx;
          if (xx<0 || xx>=width || yy<0 || yy>=height || seen[next] || data[next*4]>=128) continue;
          seen[next]=1;pixels.push(next);
        }
      }
      const w=right-left+1,h=bottom-top+1;
      const keep=pixels.length>=10 && h>=8 && w>=3 && pixels.length/(w*h)>.13;
      for (const point of pixels) data[point*4]=data[point*4+1]=data[point*4+2]=keep?0:255;
    }
    for (let point=0;point<seen.length;point++) if (!seen[point]) data[point*4]=data[point*4+1]=data[point*4+2]=255;
  }
  context.putImageData(image,0,0);
}
