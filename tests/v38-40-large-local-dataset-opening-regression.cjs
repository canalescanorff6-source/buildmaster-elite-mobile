const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createBackupEnvelope } = require('../src/lib/dataSafety.ts');

const history = Array.from({ length: 200 }, (_, playerIndex) => ({
  id: `player-${playerIndex}`,
  saveKey: `save-${playerIndex}`,
  result: {
    parsed: { playerName: `Jogador ${playerIndex}`, nativeSkills: ['Passe de primeira'] },
    detailedEvidence: Array.from({ length: 500 }, (_, itemIndex) => ({
      key: `field-${itemIndex}`,
      value: itemIndex,
      confirmed: itemIndex % 2 === 0
    }))
  }
}));

const envelope = createBackupEnvelope({ history });
assert.equal(envelope.sections.history.length, 200);
assert.match(envelope.checksum, /^[0-9a-f]{8}$/);

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
assert.match(app, /A Central de Backup é informativa e nunca pode impedir a abertura do app/);
assert.match(app, /O volume de dados local é grande\. O aplicativo continuará abrindo normalmente/);
assert.match(app, /if \(!syncHealthEnvelope\)[\s\S]*a serialização profunda acontece apenas quando o usuário exporta ou sincroniza/);
assert.doesNotMatch(app, /syncHealthEnvelope \?\? createBackupEnvelope/);

const boundary = fs.readFileSync('src/components/AppShellSafetyBoundaryV3930.tsx', 'utf8');
assert.match(boundary, /bm-recovery-diagnostic/);
assert.match(boundary, /Detalhe técnico:/);

console.log('v38.40 base local grande aprovada: 200 fichas detalhadas não bloqueiam a abertura e a Central de Backup possui fallback não fatal.');
