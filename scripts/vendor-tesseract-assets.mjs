import { mkdir, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const assets = [
  ['public/tesseract/worker.min.js', 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js', 50_000],
  ['public/tesseract/core/tesseract-core.wasm.js', 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core.wasm.js', 100_000],
  ['public/tesseract/core/tesseract-core-simd.wasm.js', 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd.wasm.js', 100_000],
  ['public/tesseract/core/tesseract-core-lstm.wasm.js', 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-lstm.wasm.js', 100_000],
  ['public/tesseract/core/tesseract-core-simd-lstm.wasm.js', 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm.js', 100_000],
  ['public/tesseract/lang/por.traineddata.gz', 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/por@1.0.0/4.0.0_best_int/por.traineddata.gz', 1_000_000],
  ['public/tesseract/lang/eng.traineddata.gz', 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz', 1_000_000]
];

async function valid(path, minBytes) {
  try { return (await stat(path)).size >= minBytes; } catch { return false; }
}

async function download(relative, url, minBytes) {
  const target = join(ROOT, relative);
  if (await valid(target, minBytes)) {
    console.log(`OCR local já presente: ${relative}`);
    return;
  }
  await mkdir(dirname(target), { recursive: true });
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Falha ${response.status} ao baixar ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < minBytes) throw new Error(`Arquivo OCR incompleto: ${relative} (${bytes.byteLength} bytes)`);
  const temporary = `${target}.tmp`;
  await writeFile(temporary, bytes);
  await rename(temporary, target);
  console.log(`OCR local preparado: ${relative}`);
}

for (const [relative, url, minBytes] of assets) await download(relative, url, minBytes);
console.log('Pacote OCR offline completo e pronto para entrar no APK.');
