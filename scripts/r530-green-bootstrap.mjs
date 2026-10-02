import fs from 'node:fs';

const packagePath = 'package.json';
const doctorPath = 'scripts/ci-doctor-config.mjs';
const workflowPath = '.github/workflows/pull-request-validation.yml';

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

let workflow = fs.readFileSync(workflowPath, 'utf8');
workflow = workflow.replace(
  '      - name: R530 TDD — executar fechamento RED\n        run: node tests/v44-00-r530-reference-redesign-closure-regression.mjs',
  '      - name: R530 — fechamento do redesign premium\n        run: npm run test:r530'
);
fs.writeFileSync(workflowPath, workflow);

console.log('Bootstrap R530 aplicado: package script, PR gate e release doctor alinhados.');
