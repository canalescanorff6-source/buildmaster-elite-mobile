import fs from 'node:fs';

// One-shot branch bootstrap. Remove after the persisted GREEN commit is verified.
const packagePath = 'package.json';
const doctorConfigPath = 'scripts/ci-doctor-config.mjs';
const doctorPath = 'scripts/ci-doctor.mjs';
const r534TestPath = 'tests/v40-80-r534-ci-doctor-sharding-regression.mjs';

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts['test:r530'] = 'node tests/v44-00-r530-reference-redesign-closure-regression.mjs';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

let doctorConfig = fs.readFileSync(doctorConfigPath, 'utf8');
doctorConfig = doctorConfig.replace('export const EXPECTED_FULL_GROUPS = 97;', 'export const EXPECTED_FULL_GROUPS = 98;');
if (!doctorConfig.includes("['Fechamento visual R530', ['run', 'test:r530']]")) {
  doctorConfig = doctorConfig.replace(
    "  ['TypeScript completo', ['run', 'typecheck']],",
    "  ['Fechamento visual R530', ['run', 'test:r530']],\n  ['TypeScript completo', ['run', 'typecheck']],"
  );
}
fs.writeFileSync(doctorConfigPath, doctorConfig);

let doctor = fs.readFileSync(doctorPath, 'utf8');
doctor = doctor.replace('const EXPECTED_FULL_GROUPS = 97;', 'const EXPECTED_FULL_GROUPS = 98;');
if (!doctor.includes("['Fechamento visual R530', ['run', 'test:r530']]")) {
  doctor = doctor.replace(
    "  ['TypeScript completo', ['run', 'typecheck']],",
    "  ['Fechamento visual R530', ['run', 'test:r530']],\n  ['TypeScript completo', ['run', 'typecheck']],"
  );
}
fs.writeFileSync(doctorPath, doctor);

let r534 = fs.readFileSync(r534TestPath, 'utf8');
r534 = r534.replaceAll('97', '98');
fs.writeFileSync(r534TestPath, r534);

console.log('Bootstrap R530 aplicado: package, doctor canônico, espelho R534 e regressão de sharding alinhados.');
