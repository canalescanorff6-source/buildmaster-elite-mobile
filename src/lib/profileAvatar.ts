import { readAccountStorage, removeAccountStorage, writeAccountStorage } from '@/lib/accountStorage';

export const PROFILE_AVATAR_STORAGE_KEY = 'buildmaster_profile_avatar_v1';
const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const OUTPUT_SIZE = 320;

export function readProfileAvatar(): string | null {
  const value = readAccountStorage(PROFILE_AVATAR_STORAGE_KEY);
  return value?.startsWith('data:image/') ? value : null;
}

export function saveProfileAvatar(dataUrl: string): boolean {
  if (!dataUrl.startsWith('data:image/')) return false;
  return writeAccountStorage(PROFILE_AVATAR_STORAGE_KEY, dataUrl);
}

export function removeProfileAvatar(): boolean {
  return removeAccountStorage(PROFILE_AVATAR_STORAGE_KEY);
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível abrir esta imagem.'));
    image.src = source;
  });
}

export async function createProfileAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Escolha uma imagem da galeria.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('A imagem deve ter no máximo 12 MB.');

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    if (!sourceSize) throw new Error('A imagem não possui uma resolução válida.');
    const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
    const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('O aparelho não conseguiu preparar a foto.');
    context.fillStyle = '#0b1624';
    context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    return canvas.toDataURL('image/jpeg', .86);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
