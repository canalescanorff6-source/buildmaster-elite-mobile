import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { repairCriticalRoutes } from '../scripts/repair-critical-routes.mjs';

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-route-repair-'));
const rootPage = path.join(tempRoot, 'src', 'app', 'page.tsx');
fs.mkdirSync(path.dirname(rootPage), { recursive: true });
fs.writeFileSync(rootPage, `import Link from 'next/link';\nexport default function AccountDeletionPage(){return <main className="public-policy-page"><h1>Solicitar exclusão da conta</h1><Link href="/">Voltar</Link></main>}\n`, 'utf8');

const repaired = repairCriticalRoutes(tempRoot);
assert.equal(repaired.repaired, true);
assert.equal(repaired.reason, 'deletion-page-overwrite');
const restored = fs.readFileSync(rootPage, 'utf8');
assert.match(restored, /@\/components\/AuthGate/);
assert.match(restored, /@\/components\/CardVisionApp/);
assert.match(restored, /@\/components\/AppShellSafetyBoundaryV3930/);
assert.match(restored, /<AppShellSafetyBoundaryV3930>/);
assert.match(restored, /<AuthGate>/);
assert.match(restored, /<\/AppShellSafetyBoundaryV3930>/);
assert.doesNotMatch(restored, /AccountDeletionPage|Solicitar exclusão da conta|public-policy-page/);

const secondPass = repairCriticalRoutes(tempRoot);
assert.equal(secondPass.repaired, false);
assert.equal(secondPass.reason, 'valid');

assert.throws(
  () => {
    fs.writeFileSync(rootPage, 'export default function Broken(){ return null }\n', 'utf8');
    repairCriticalRoutes(tempRoot, { checkOnly: true });
  },
  (error) => error?.code === 'BUILDMASTER_INVALID_ROOT_ROUTE'
);

fs.rmSync(tempRoot, { recursive: true, force: true });
console.log('v31.72 autorreparo da rota inicial aprovado: restaura boundary, autenticação e app mesmo após sobrescrita por política/exclusão.');
