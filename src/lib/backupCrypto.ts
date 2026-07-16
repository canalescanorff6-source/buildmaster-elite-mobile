const ENCRYPTED_BACKUP_FORMAT = 'buildmaster-encrypted-backup';
const ENCRYPTED_BACKUP_VERSION = 1;
const PBKDF2_ITERATIONS = 210_000;

export type EncryptedBackupFile = {
  format: typeof ENCRYPTED_BACKUP_FORMAT;
  version: number;
  algorithm: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  createdAt: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunk, bytes.length)));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number, usages: KeyUsage[]) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    usages
  );
}

export function isEncryptedBackupFile(input: unknown): input is EncryptedBackupFile {
  if (!input || typeof input !== 'object') return false;
  const value = input as Partial<EncryptedBackupFile>;
  return value.format === ENCRYPTED_BACKUP_FORMAT
    && value.version === ENCRYPTED_BACKUP_VERSION
    && value.algorithm === 'AES-GCM-256'
    && value.kdf === 'PBKDF2-SHA256'
    && Number.isInteger(value.iterations)
    && Number(value.iterations) >= 100_000
    && typeof value.salt === 'string'
    && typeof value.iv === 'string'
    && typeof value.ciphertext === 'string';
}

export function validateBackupPassword(password: string): string | null {
  if (password.length < 12) return 'A senha do backup precisa ter pelo menos 12 caracteres.';
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) return 'Use letras e pelo menos um número na senha do backup.';
  return null;
}

export async function encryptBackupPayload(payload: unknown, password: string): Promise<EncryptedBackupFile> {
  if (!globalThis.crypto?.subtle) throw new Error('Criptografia segura indisponível neste aparelho.');
  const passwordError = validateBackupPassword(password);
  if (passwordError) throw new Error(passwordError);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS, ['encrypt']);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, plaintext);
  return {
    format: ENCRYPTED_BACKUP_FORMAT,
    version: ENCRYPTED_BACKUP_VERSION,
    algorithm: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    createdAt: new Date().toISOString()
  };
}

export async function decryptBackupPayload(input: EncryptedBackupFile, password: string): Promise<unknown> {
  if (!isEncryptedBackupFile(input)) throw new Error('O arquivo criptografado não foi reconhecido.');
  if (!password) throw new Error('Digite a senha usada quando o backup foi criado.');
  try {
    const salt = base64ToBytes(input.salt);
    const iv = base64ToBytes(input.iv);
    const ciphertext = base64ToBytes(input.ciphertext);
    const key = await deriveKey(password, salt, input.iterations, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, ciphertext as BufferSource);
    return JSON.parse(new TextDecoder().decode(decrypted)) as unknown;
  } catch {
    throw new Error('Senha incorreta ou arquivo de backup alterado.');
  }
}
