import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const declared = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
const failures = [];
const installedVersions = new Map();

for (const name of Object.keys(declared).sort()) {
  const installedPath = path.join('node_modules', ...name.split('/'), 'package.json');
  const lockEntry = lock.packages?.[`node_modules/${name}`];

  if (!fs.existsSync(installedPath)) {
    failures.push(`${name}: pacote não instalado em ${installedPath}`);
    continue;
  }
  if (!lockEntry?.version) {
    failures.push(`${name}: entrada ausente no package-lock.json`);
    continue;
  }

  let installed;
  try {
    installed = JSON.parse(fs.readFileSync(installedPath, 'utf8'));
  } catch (error) {
    failures.push(`${name}: package.json instalado ilegível (${error instanceof Error ? error.message : String(error)})`);
    continue;
  }

  installedVersions.set(name, installed.version);
  if (installed.version !== lockEntry.version) {
    failures.push(`${name}: instalado ${installed.version}, mas o lock exige ${lockEntry.version}`);
  }
}

function requireSameVersion(names, label) {
  const available = names.map((name) => [name, installedVersions.get(name)]).filter(([, version]) => Boolean(version));
  if (available.length !== names.length) return;
  const versions = new Set(available.map(([, version]) => version));
  if (versions.size > 1) failures.push(`${label}: versões divergentes (${available.map(([name, version]) => `${name}@${version}`).join(', ')})`);
}

requireSameVersion(['react', 'react-dom'], 'React e React DOM');
requireSameVersion(['@capacitor/core', '@capacitor/android', '@capacitor/cli'], 'Capacitor Core, Android e CLI');

if (failures.length) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log(`Dependências diretas aprovadas: ${installedVersions.size} pacotes conferem exatamente com o package-lock.json.`);
console.log(`React sincronizado em ${installedVersions.get('react')}; Capacitor sincronizado em ${installedVersions.get('@capacitor/core')}.`);
