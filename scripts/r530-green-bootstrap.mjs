import fs from 'node:fs';

// One-shot branch bootstrap. Remove after the persisted GREEN commit is verified.
const packagePath = 'package.json';
const doctorPath = 'scripts/ci-doctor-config.mjs';

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts['test:r530'] = 'node tests/v44-00-r530-reference-redesign-closure-regression.mjs';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

let doctor = fs.readFileSync(doctorPath, 'utf8');
doctor = doctor.replace('export const EXPECTED_FULL_GROUPS = 97;', 'export const EXPECTED_FULL_GROUPS = 98;');
if (!doctor.includes("['Fechamento visual R530', ['run', 'test:r530']]")) {
  doctor = doctor.replace(
    "  ['TypeScript completo', ['run', 'typecheck']],",
    "  ['Fechamento visual R530', ['run', 'test:r530']],\n  ['TypeScript completo', ['run', 'typecheck']],"
  );
}
fs.writeFileSync(doctorPath, doctor);

console.log('Bootstrap R530 aplicado: package script e release doctor alinhados.');
