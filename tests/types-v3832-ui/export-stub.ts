export function safeFileName(value: string): string { return value; }
export function downloadBlob(_blob: Blob, _name: string): void {}
export function svgToPngBlob(_svg: string, _width: number, _height: number): Promise<Blob> { return Promise.resolve(new Blob()); }
