type ValueRow = { left: number; top: number; width: number; height: number };
const valueRows = new WeakMap<HTMLCanvasElement, ValueRow[]>();
export function readerV2ValueRows(canvas: HTMLCanvasElement): ValueRow[] | undefined {
  return valueRows.get(canvas);
}

/** Prepare a single temporary crop. The original print and preview stay intact. */
export function prepareReaderV2Crop(canvas: HTMLCanvasElement, key: string, lightText=false): void {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = image;
  const numericColumn = key.startsWith('attributes-values-');
  const colorAt = (index: number) => {
    const max = Math.max(data[index], data[index + 1], data[index + 2]);
    const min = Math.min(data[index], data[index + 1], data[index + 2]);
    return max > 180 && max - min > 65;
  };

  if(key==='mainPosition'&&lightText){
    const light=(i:number)=>Math.min(data[i],data[i+1],data[i+2])>160&&Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])<75;
    let count=0;for(let i=0;i<data.length;i+=4)if(light(i))count++;
    if(count>width*height*.01&&count<width*height*.45){
      for(let i=0;i<data.length;i+=4){const value=light(i)?0:255;data[i]=data[i+1]=data[i+2]=value;}
      context.putImageData(image,0,0);return;
    }
  }
  if (numericColumn) {
    // EFHub puts black digits inside red, yellow and green badges. Isolate the
    // badge column before removing its colors; inversion of the whole strip
    // would erase the digits or turn the surrounding dark UI into solid ink.
    const columns = new Uint32Array(width);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (colorAt((y * width + x) * 4)) columns[x]++;
    }
    const peak = Math.max(...columns);
    if (peak > height * .15) {
      const active = [...columns].flatMap((count, x) => count > peak * .5 ? [x] : []);
      const left = Math.min(...active), right = Math.max(...active);
      const rowLeft = new Int32Array(height).fill(-1);
      const rowRight = new Int32Array(height).fill(-1);
      for (let y = 0; y < height; y++) for (let x = left; x <= right; x++) {
        if (colorAt((y * width + x) * 4)) {
          if (rowLeft[y] < 0) rowLeft[y] = x;
          rowRight[y] = x;
        }
      }
      const bands: Array<{ top: number; bottom: number }> = [];
      for (let y = 0; y < height; y++) {
        if (rowRight[y] - rowLeft[y] < (right - left) * .55) continue;
        const previous = bands.at(-1);
        if (previous && y <= previous.bottom + 2) previous.bottom = y;
        else bands.push({ top: y, bottom: y });
      }
      const starts = bands.slice(1).map((band, index) => band.top - bands[index].top).sort((a, b) => a - b);
      const pitch = starts.length ? starts[Math.floor(starts.length / 2)] : 0;
      // Adjacent red/yellow badges can touch after phone/video compression.
      // Split a merged band using the row spacing observed in the same strip.
      const cells = bands.filter(band => band.bottom - band.top >= 12).flatMap(band => {
        const count = pitch ? Math.max(1, Math.round((band.bottom - band.top + 1) / pitch)) : 1;
        return Array.from({ length:count }, (_, index) => ({
          top:band.top + index * pitch,
          bottom:Math.min(band.bottom, count > 1 ? band.top + (index + 1) * pitch - 2 : band.bottom),
        }));
      });
      const expected = key.endsWith('left') ? 10 : key.endsWith('center') ? 9 : 7;
      if (cells.length === expected) valueRows.set(canvas, cells.map(cell => ({
        left: 0, top: Math.max(0, cell.top - 4), width,
        height: Math.min(height, cell.bottom + 5) - Math.max(0, cell.top - 4),
      })));
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const cell = cells.find(band => y >= band.top + 2 && y <= band.bottom - 2);
        const inside = cell && rowRight[y] - rowLeft[y] >= (right - left) * .5
          && x >= left + 2 && x <= right - 2;
        const signal = Math.max(data[i], data[i + 1], data[i + 2]);
        const value = inside ? Math.max(0, Math.min(255, (signal - 70) * 1.6)) : 255;
        data[i] = data[i + 1] = data[i + 2] = value;
        data[i + 3] = 255;
      }
      context.putImageData(image, 0, 0);
      return;
    }
  }

  let dark = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.max(data[i], data[i + 1], data[i + 2]) < 100) dark++;
  }
  if (dark > width * height * .6) {
    for (let i = 0; i < data.length; i += 4) {
      const value = 255 - Math.max(data[i], data[i + 1], data[i + 2]);
      data[i] = data[i + 1] = data[i + 2] = value;
    }
    context.putImageData(image, 0, 0);
  }
}
