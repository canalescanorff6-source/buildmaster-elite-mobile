import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('out');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

function localTarget(htmlFile, value) {
  const clean = value.split('#')[0].split('?')[0];
  if (!clean || /^(?:https?:|data:|mailto:|tel:|blob:|javascript:)/i.test(clean)) return null;
  if (clean.startsWith('/')) return path.join(root, clean.slice(1));
  return path.resolve(path.dirname(htmlFile), clean);
}

function targetExists(target) {
  if (!target) return true;
  if (fs.existsSync(target)) return true;
  if (fs.existsSync(`${target}.html`)) return true;
  if (fs.existsSync(path.join(target, 'index.html'))) return true;
  return false;
}

check(fs.existsSync(root), 'A pasta out não foi gerada.');
const rootHtml = path.join(root, 'index.html');
check(fs.existsSync(rootHtml) && fs.statSync(rootHtml).size > 500, 'out/index.html ausente ou vazio.');
for (const required of [
  'manifest.webmanifest',
  'sw.js',
  path.join('privacidade', 'index.html'),
  path.join('excluir-conta', 'index.html'),
]) {
  const file = path.join(root, required);
  check(fs.existsSync(file) && fs.statSync(file).size > 0, `Export estático obrigatório ausente: out/${required}`);
}

const swPath = path.join(root, 'sw.js');
if (fs.existsSync(swPath)) {
  const swSource = fs.readFileSync(swPath, 'utf8');
  const staticAssetsBody = swSource.match(/const\s+STATIC_ASSETS\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? '';
  const staticAssets = [...staticAssetsBody.matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
  check(staticAssets.length > 0, 'sw.js não declarou STATIC_ASSETS para o modo offline.');
  for (const asset of staticAssets) {
    if (!asset.startsWith('/')) continue;
    const target = path.join(root, asset.slice(1));
    check(targetExists(target), `Service Worker referencia recurso inexistente: ${asset}`);
  }
}

const htmlFiles = [];
if (fs.existsSync(root)) {
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(file);
      else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(file);
    }
  }
}

let localScripts = 0;
for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  if (/Internal Server Error|Application error: a client-side exception has occurred/i.test(html)) {
    failures.push(`${path.relative(root, htmlFile)} contém uma página de erro em vez da interface exportada.`);
  }
  for (const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    const value = match[1];
    const target = localTarget(htmlFile, value);
    if (target) {
      localScripts += 1;
      if (!targetExists(target)) failures.push(`${path.relative(root, htmlFile)} referencia script inexistente: ${value}`);
    }
  }
  for (const match of html.matchAll(/<link\b([^>]+)>/gi)) {
    const attrs = match[1];
    const href = attrs.match(/\bhref=["']([^"']+)["']/i)?.[1];
    const rel = attrs.match(/\brel=["']([^"']+)["']/i)?.[1] ?? '';
    if (!href || !/(?:stylesheet|icon|manifest|preload|modulepreload)/i.test(rel)) continue;
    const target = localTarget(htmlFile, href);
    if (target && !targetExists(target)) failures.push(`${path.relative(root, htmlFile)} referencia recurso inexistente: ${href}`);
  }
}

check(htmlFiles.length >= 3, `Poucas páginas HTML exportadas (${htmlFiles.length}).`);
check(localScripts > 0, 'Nenhum chunk JavaScript local foi referenciado pelo HTML exportado.');
const nextStatic = path.join(root, '_next', 'static');
check(fs.existsSync(nextStatic), 'out/_next/static ausente.');
if (fs.existsSync(rootHtml)) {
  const html = fs.readFileSync(rootHtml, 'utf8');
  check(/_next\/static\//.test(html), 'A página inicial não referencia os chunks _next/static.');
}

if (failures.length) {
  console.error(`Export estático inválido (${failures.length}):`);
  for (const failure of failures.slice(0, 80)) console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log(`Export estático aprovado: ${htmlFiles.length} páginas HTML e ${localScripts} referências locais de JavaScript verificadas.`);
