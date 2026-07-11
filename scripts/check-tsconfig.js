const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('tsconfig.json','utf8'));
const co = cfg.compilerOptions || {};
if ('baseUrl' in co || 'paths' in co) {
  console.error('tsconfig ainda contem baseUrl/paths antigos. Rode npm run fix:tsconfig.');
  process.exit(1);
}
console.log('tsconfig OK: sem baseUrl e sem paths.');
