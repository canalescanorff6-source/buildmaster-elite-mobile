const fs = require('fs');
const p = 'tsconfig.json';
const clean = {
  extends: 'expo/tsconfig.base',
  compilerOptions: {
    strict: false,
    noEmit: true,
    skipLibCheck: true,
    jsx: 'react-native'
  },
  include: ['index.js', 'App.tsx', 'src/**/*.ts', 'src/**/*.tsx']
};
fs.writeFileSync(p, JSON.stringify(clean, null, 2));
console.log('tsconfig.json limpo sem baseUrl:');
console.log(fs.readFileSync(p, 'utf8'));
