import { spawnSync } from 'node:child_process';
import { applyTotalReaderFinalizationR501 } from './apply-r501-total-reader-finalization.mjs';
import { applyR502StructuralCardTruthCertification } from './apply-r502-structural-card-truth-certification.mjs';
import { applyR503SingleReaderFinalization } from './apply-r503-single-reader-finalization.mjs';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const repairs = [
  ['TypeScript raiz', ['run', 'types:repair']],
  ['Sanitização forward-only', ['run', 'sanitize:update-source']],
  ['Rotas críticas', ['run', 'routes:repair']]
];

let failed = false;
for (const [label, args] of repairs) {
  console.log(`\n[CI SAFE REPAIR] ${label}`);
  const result = spawnSync(npmCommand, args, { stdio: 'inherit', env: process.env, shell: false });
  if (result.error || result.status !== 0) {
    failed = true;
    console.error(`Falha no reparo determinístico: ${label}`);
  }
}

if (!failed) {
  console.log('\n[CI SAFE REPAIR] Card Truth R501 — finalização do Leitor Total');
  try {
    const result = applyTotalReaderFinalizationR501(process.cwd());
    console.log(result.changed
      ? `R501 Total Reader ajustou ${result.patched.length} arquivo(s).`
      : 'R501 Total Reader já estava convergido.');
  } catch (error) {
    failed = true;
    console.error('Falha no reparo determinístico: Card Truth R501 — finalização do Leitor Total');
    console.error(error);
  }
}

if (!failed) {
  console.log('\n[CI SAFE REPAIR] Card Truth R502 — certificação estrutural');
  try {
    const result = applyR502StructuralCardTruthCertification(process.cwd());
    console.log(result.changed
      ? `R502 materializou certificação estrutural em ${result.patched.length} arquivo(s).`
      : 'R502 certificação estrutural já estava convergida.');
  } catch (error) {
    failed = true;
    console.error('Falha no reparo determinístico: Card Truth R502 — certificação estrutural');
    console.error(error);
  }
}

if (!failed) {
  console.log('\n[CI SAFE REPAIR] Card Truth R503 — confirmação unitária');
  try {
    const result = applyR503SingleReaderFinalization(process.cwd());
    console.log(result.changed
      ? `R503 materializou o gate unitário em ${result.patched.length} arquivo(s).`
      : 'R503 confirmação unitária já estava convergida.');
  } catch (error) {
    failed = true;
    console.error('Falha no reparo determinístico: Card Truth R503 — confirmação unitária');
    console.error(error);
  }
}

if (failed) process.exit(1);
console.log('\nReparos determinísticos seguros concluídos.');
