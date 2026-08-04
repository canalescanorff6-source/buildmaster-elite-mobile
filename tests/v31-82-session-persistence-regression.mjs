import fs from 'node:fs';
import assert from 'node:assert/strict';

const auth = fs.readFileSync('src/lib/accountAuth.ts', 'utf8');
const gate = fs.readFileSync('src/components/AuthGate.tsx', 'utf8');
const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');

assert.match(auth, /let memorySession: AccountSession \| null \| undefined/);
assert.match(auth, /let refreshSessionInFlight: Promise<AccountSession> \| null/);
assert.match(auth, /if \(refreshSessionInFlight\) return refreshSessionInFlight/);
assert.match(auth, /latest\.refreshToken !== current\.refreshToken/);
assert.match(auth, /for \(const delay of \[0, 90, 220\]\)/);
assert.match(auth, /if \(raw\) return parseStoredSession\(raw\)/);
assert.match(auth, /const cached = await readCachedLicense\(\)/);
assert.match(gate, /Date\.now\(\) - lastSuccessfulValidationRef\.current < 2 \* 60 \* 1000/);
assert.match(gate, /terminalFailureCountRef\.current >= 5/);
assert.match(gate, /15 \* 60 \* 1000/);
assert.match(gate, /setValidation\(\(current\) => current \? \{ \.\.\.current, offline: true \} : current\)/);
assert.doesNotMatch(app, /clearBuildMasterSession\(\);\s*void account\?\.logout\(\)/);

console.log('Regressão de persistência de sessão v31.82 aprovada.');
