import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let ts;
try { ts = require('typescript'); }
catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const result = [];
  const stack = [directory];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (['node_modules', '.next', 'out', 'android', '.git'].includes(entry.name)) continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (entry.name.endsWith('.tsx')) result.push(target);
    }
  }
  return result.sort();
}

function attr(opening, name) {
  return opening.attributes.properties.find((property) => ts.isJsxAttribute(property) && property.name.text === name);
}
function tagName(opening) {
  return opening.tagName.getText();
}
function hasText(node) {
  if (!ts.isJsxElement(node)) return false;
  return node.children.some((child) => {
    if (ts.isJsxText(child)) return child.text.replace(/\s+/g, ' ').trim().length > 0;
    if (ts.isJsxExpression(child)) return Boolean(child.expression);
    if (ts.isJsxElement(child)) return hasText(child);
    return false;
  });
}

const failures = [];
const warnings = [];
let buttons = 0;
let images = 0;
for (const file of walk('src')) {
  const sourceText = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  function visit(node) {
    const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
    if (opening) {
      const tag = tagName(opening);
      const position = source.getLineAndCharacterOfPosition(opening.getStart(source));
      const location = `${file}:${position.line + 1}`;
      if (tag === 'button') {
        buttons += 1;
        if (!attr(opening, 'type')) failures.push(`${location} botão sem type="button|submit|reset".`);
        const parentElement = ts.isJsxElement(node) ? node : null;
        if (!attr(opening, 'aria-label') && !attr(opening, 'aria-labelledby') && !attr(opening, 'title') && parentElement && !hasText(parentElement)) {
          failures.push(`${location} botão sem nome acessível identificável.`);
        }
      }
      if (tag === 'img') {
        images += 1;
        if (!attr(opening, 'alt')) failures.push(`${location} imagem sem atributo alt.`);
      }
      const target = attr(opening, 'target');
      if (tag === 'a' && target?.initializer && target.initializer.getText(source).includes('_blank') && !attr(opening, 'rel')) {
        failures.push(`${location} link target="_blank" sem rel seguro.`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

const globals = fs.readFileSync('src/app/globals.css', 'utf8').trim();
const finalCss = fs.readFileSync('src/app/design-system-v2920-production.css', 'utf8');
if (!globals.endsWith('@import "./design-system-v2920-production.css";')) failures.push('A camada visual v29.20 não é a última importação global.');
for (const required of ['@media (max-width: 900px)', '@media (max-width: 640px)', '@media (max-width: 380px)', ':focus-visible', 'min-height: 44px', 'prefers-reduced-motion: reduce']) {
  if (!finalCss.includes(required)) failures.push(`Contrato responsivo ausente: ${required}`);
}
if (buttons < 100) warnings.push(`Apenas ${buttons} botões foram encontrados; revisar se a varredura alcançou toda a interface.`);

if (warnings.length) for (const warning of warnings) console.warn(`⚠ ${warning}`);
if (failures.length) {
  console.error(`Contratos interativos falharam em ${failures.length} ocorrência(s):`);
  for (const failure of failures.slice(0, 100)) console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log(`Contratos interativos aprovados: ${buttons} botões tipados e ${images} imagens com alt.`);
