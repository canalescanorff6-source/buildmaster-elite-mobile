import assert from 'node:assert/strict';
import { buildActiveSessionSnapshotR137 } from '../src/modules/session/activeSessionRepositoryR137';
import { mergeActiveSessionSnapshotR157, splitActiveSessionSnapshotR157 } from '../src/modules/session/activeSessionRepositoryR137';

const preview = `data:image/webp;base64,${'a'.repeat(640_000)}`;
const player = `data:image/webp;base64,${'b'.repeat(420_000)}`;
const snapshot = buildActiveSessionSnapshotR137({
  preview,
  playerCardImage: player,
  fileName: 'r157.webp',
  ocrDone: true,
  rawText: 'NOME: R157\nPOSICAO: CMF',
  objective: 'COMPETITIVE',
  targetPosition: 'CMF',
  cardPositionOverride: 'AUTO',
  playstyleOverride: 'AUTO',
  defensivePlaystyleOverride: 'AUTO',
  readingMode: 'precision',
  formation: '4-3-3',
  teamStyle: 'POSSE_DE_BOLA',
  managerId: 'AUTO',
  gameplayMode: 'UNIVERSAL',
  connectionProfile: 'VARIABLE',
  controlProfile: 'AUTO',
  manualFields: { playerName: 'R157', level: '30', trainingPointsTotal: '60', attributes: {} } as any,
  manualMode: false,
  activeHistoryId: null,
  savedAt: Date.UTC(2026, 8, 5)
});

const split = splitActiveSessionSnapshotR157(snapshot);
const oldPayloadBytes = Buffer.byteLength(JSON.stringify(snapshot), 'utf8');
const metadataBytes = Buffer.byteLength(JSON.stringify(split.metadata), 'utf8');
assert.equal(split.preview, preview);
assert.equal(split.playerCardImage, player);
assert.doesNotMatch(JSON.stringify(split.metadata), /data:image\//, 'Metadados R157 não podem carregar base64 de imagem.');
assert.ok(metadataBytes < oldPayloadBytes * 0.01, `Metadados devem ser <1% do snapshot sintético pesado (${metadataBytes}/${oldPayloadBytes}).`);

const merged = mergeActiveSessionSnapshotR157(split);
assert.equal(merged.preview, preview);
assert.equal(merged.playerCardImage, player);
assert.equal(merged.rawText, snapshot.rawText);
assert.equal(merged.targetPosition, snapshot.targetPosition);
assert.equal(merged.result, null);
assert.equal(merged.draftResult, null);

console.log(`R157 aprovado: metadados ${metadataBytes} B vs snapshot monolítico ${oldPayloadBytes} B; mídia permanece recuperável separadamente.`);
