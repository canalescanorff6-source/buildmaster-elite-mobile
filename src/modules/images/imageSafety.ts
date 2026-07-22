export const IMAGE_IMPORT_LIMITS = {
  maxFileBytes: 20 * 1024 * 1024,
  maxPixelCount: 40_000_000,
  maxDimension: 8192,
  thumbnailMaxDimension: 512,
  maxLibraryItems: 40,
  maxLibraryBytes: 160 * 1024 * 1024
} as const;

export type SupportedImageKind = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp' | 'svg' | 'avif' | 'heic' | 'heif';

export type ValidatedImage = {
  kind: SupportedImageKind;
  mime: string;
  width: number;
  height: number;
  pixels: number;
  size: number;
  animatedFramePolicy: 'first-frame' | 'static';
  sanitizedBlob: Blob;
};

const MIME_KIND: Record<string, SupportedImageKind> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/x-ms-bmp': 'bmp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif'
};

const EXT_KIND: Record<string, SupportedImageKind> = {
  jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', gif: 'gif', bmp: 'bmp', svg: 'svg', avif: 'avif', heic: 'heic', heif: 'heif'
};

function extensionOf(name: string): string {
  return name.toLowerCase().split('.').pop() || '';
}

function bytesEqual(bytes: Uint8Array, offset: number, expected: number[]): boolean {
  return expected.every((value, index) => bytes[offset + index] === value);
}

function sniffRasterKind(bytes: Uint8Array): SupportedImageKind | null {
  if (bytesEqual(bytes, 0, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (bytesEqual(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (bytesEqual(bytes, 0, [0x47, 0x49, 0x46, 0x38])) return 'gif';
  if (bytesEqual(bytes, 0, [0x42, 0x4d])) return 'bmp';
  if (bytesEqual(bytes, 0, [0x52, 0x49, 0x46, 0x46]) && bytesEqual(bytes, 8, [0x57, 0x45, 0x42, 0x50])) return 'webp';
  const brand = new TextDecoder().decode(bytes.slice(4, 16)).toLowerCase();
  if (brand.includes('ftypavif') || brand.includes('ftypavis')) return 'avif';
  if (/ftyp(?:heic|heix|hevc|hevx|mif1|msf1)/.test(brand)) return brand.includes('he') ? 'heic' : 'heif';
  return null;
}

function sanitizeSvgText(source: string): string {
  if (source.length > 4 * 1024 * 1024) throw new Error('O SVG é grande demais para ser importado com segurança.');
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(source, 'image/svg+xml');
  if (documentNode.querySelector('parsererror')) throw new Error('O arquivo SVG está corrompido.');
  const root = documentNode.documentElement;
  if (root.tagName.toLowerCase() !== 'svg') throw new Error('O arquivo não contém um SVG válido.');
  root.querySelectorAll('script,foreignObject,iframe,object,embed,audio,video').forEach((node) => node.remove());
  root.querySelectorAll('*').forEach((node) => {
    for (const attribute of Array.from(node.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith('on')) node.removeAttribute(attribute.name);
      if ((name === 'href' || name === 'xlink:href' || name === 'src') && /^(?:https?:|file:|javascript:|data:text\/html)/i.test(value)) {
        node.removeAttribute(attribute.name);
      }
      if (name === 'style' && /url\s*\(|expression\s*\(|javascript:/i.test(value)) node.removeAttribute(attribute.name);
    }
  });
  if (!root.getAttribute('xmlns')) root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(root);
}

async function sanitizedInput(file: File): Promise<{ blob: Blob; kind: SupportedImageKind; mime: string }> {
  const declared = MIME_KIND[file.type.toLowerCase()];
  const extension = EXT_KIND[extensionOf(file.name)];
  const header = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const sniffed = sniffRasterKind(header);
  const isSvgCandidate = declared === 'svg' || extension === 'svg' || new TextDecoder().decode(header).trimStart().startsWith('<svg');
  if (isSvgCandidate) {
    const clean = sanitizeSvgText(await file.text());
    return { blob: new Blob([clean], { type: 'image/svg+xml' }), kind: 'svg', mime: 'image/svg+xml' };
  }
  const kind = sniffed || declared || extension;
  if (!kind || kind === 'svg') throw new Error('Formato não reconhecido. Use JPG, JPEG, PNG, WebP, GIF, BMP, SVG, AVIF, HEIC ou HEIF.');
  if (sniffed && declared && sniffed !== declared && !(sniffed === 'heic' && declared === 'heif')) {
    throw new Error('A extensão e o conteúdo real da imagem não conferem.');
  }
  return { blob: file, kind, mime: file.type || `image/${kind === 'jpeg' ? 'jpeg' : kind}` };
}

async function decodeDimensions(blob: Blob, kind: SupportedImageKind): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    } catch (error) {
      if (kind === 'heic' || kind === 'heif') throw new Error('Este aparelho não possui codec para HEIC/HEIF. Converta a imagem para JPEG ou PNG.');
      if (kind === 'avif') throw new Error('Este aparelho não conseguiu abrir AVIF. Converta a imagem para JPEG, PNG ou WebP.');
      if (kind !== 'svg') throw error;
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('O arquivo está corrompido ou não é suportado neste aparelho.'));
      image.src = url;
    });
    return dimensions;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function validateImageFile(file: File): Promise<ValidatedImage> {
  if (!file || file.size <= 0) throw new Error('Selecione uma imagem válida.');
  if (file.size > IMAGE_IMPORT_LIMITS.maxFileBytes) throw new Error('A imagem ultrapassa o limite de 20 MB.');
  const input = await sanitizedInput(file);
  const { width, height } = await decodeDimensions(input.blob, input.kind);
  if (!width || !height) throw new Error('Não foi possível confirmar as dimensões da imagem.');
  if (width > IMAGE_IMPORT_LIMITS.maxDimension || height > IMAGE_IMPORT_LIMITS.maxDimension) {
    throw new Error(`A imagem ultrapassa ${IMAGE_IMPORT_LIMITS.maxDimension}px em um dos lados.`);
  }
  const pixels = width * height;
  if (pixels > IMAGE_IMPORT_LIMITS.maxPixelCount) throw new Error('A imagem ultrapassa o limite seguro de 40 megapixels.');
  return {
    kind: input.kind,
    mime: input.mime,
    width,
    height,
    pixels,
    size: input.blob.size,
    animatedFramePolicy: input.kind === 'gif' ? 'first-frame' : 'static',
    sanitizedBlob: input.blob
  };
}

export async function createImageThumbnail(blob: Blob, maxDimension = IMAGE_IMPORT_LIMITS.thumbnailMaxDimension): Promise<Blob> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  try {
    const ratio = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * ratio));
    const height = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('O aparelho não conseguiu preparar a miniatura.');
    context.drawImage(bitmap, 0, 0, width, height);
    const thumbnail = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Falha ao criar miniatura.')), 'image/webp', 0.82));
    canvas.width = 1;
    canvas.height = 1;
    return thumbnail;
  } finally {
    bitmap.close();
  }
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(blob);
  });
}
