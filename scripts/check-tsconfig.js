const fs = require('fs');
const p = 'tsconfig.json';
const text = fs.readFileSync(p, 'utf8');
if (text.includes('baseUrl')) {
  console.error('ERRO: tsconfig.json ainda contém baseUrl. Rode npm run fix:tsconfig.');
  process.exit(1);
}
console.log('TypeScript OK: tsconfig sem baseUrl.');
