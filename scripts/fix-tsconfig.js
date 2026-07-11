const fs = require('fs');
const path = 'tsconfig.json';
const config = JSON.parse(fs.readFileSync(path, 'utf8'));
config.compilerOptions = config.compilerOptions || {};
delete config.compilerOptions.baseUrl;
delete config.compilerOptions.paths;
fs.writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
console.log('tsconfig.json conferido: sem baseUrl e sem paths antigos.');
