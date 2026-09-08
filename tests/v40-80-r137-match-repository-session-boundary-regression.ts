import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { MatchValidationRecord } from '../src/lib/appEvolution';
import {
  exactUsageMatchValidationRecordsR137,
  matchValidationRevisionR137,
  normalizeMatchValidationRecordsR137,
  removeUsageMatchValidationRecordsR137
} from '../src/modules/matches/matchValidationRepositoryR137';
import { buildActiveSessionSnapshotR137 } from '../src/modules/session/activeSessionRepositoryR137';

function match(id: string, playedAt: string, position: any = 'CMF', extra: Partial<MatchValidationRecord> = {}): MatchValidationRecord {
  return {
    id,
    cardFingerprint: 'card-r137',
    playerName: 'R137 Jogador',
    targetPosition: position,
    formation: '4-3-3' as any,
    teamStyle: 'POSSE_DE_BOLA' as any,
    buildName: 'build',
    buildSignature: `build-${position}`,
    playedAt,
    minutes: 90,
    overallRating: 3,
    passing: 3,
    movement: 3,
    finishing: 3,
    defending: 3,
    physical: 3,
    stamina: 3,
    tags: [],
    note: '',
    ...extra
  } as MatchValidationRecord;
}

const normalized = normalizeMatchValidationRecordsR137([
  match('old', '2026-08-30T12:00:00.000Z'),
  match('dup', '2026-08-29T12:00:00.000Z', 'CMF', { note: 'antigo' }),
  { nope: true },
  match('new', '2026-09-04T12:00:00.000Z'),
  match('dup', '2026-09-03T12:00:00.000Z', 'CMF', { note: 'mais novo' }),
  match('other-pos', '2026-09-02T12:00:00.000Z', 'CB')
]);
assert.deepEqual(normalized.map((item) => item.id), ['new', 'dup', 'other-pos', 'old'], 'Repositório deve deduplicar e ordenar por recência.');
assert.equal(normalized.find((item) => item.id === 'dup')?.note, 'mais novo', 'Duplicata deve preservar a versão temporalmente mais nova.');
assert.match(matchValidationRevisionR137(normalized), /^matches-r137-[a-f0-9]{8}$/);

const result = {
  parsed: { playerName: 'R137 Jogador' },
  bestPosition: { code: 'CMF' }
} as any;
// O fingerprint real é calculado pelo resultado, então ajustamos a amostra para a mesma assinatura que o helper enxerga.
const repositorySource = fs.readFileSync(path.join(path.resolve(__dirname, '..'), 'src/modules/matches/matchValidationRepositoryR137.ts'), 'utf8');
assert.match(repositorySource, /migrateLegacy:\s*false/, 'Partidas não podem migrar legado implicitamente entre contas.');
assert.match(repositorySource, /persisted\s*=\s*writeAccountStorage/, 'Falha real de persistência precisa ser observável.');

// Para testar isolamento por uso sem depender da implementação do fingerprint, usamos o fingerprint calculado pelo helper em uma primeira passagem.
const appEvolution = require('../src/lib/appEvolution') as typeof import('../src/lib/appEvolution');
const fp = appEvolution.cardFingerprint(result);
const usageRecords = [
  match('cmf-1', '2026-09-04T12:00:00.000Z', 'CMF', { cardFingerprint: fp }),
  match('cb-1', '2026-09-03T12:00:00.000Z', 'CB', { cardFingerprint: fp }),
  match('other-card', '2026-09-02T12:00:00.000Z', 'CMF', { cardFingerprint: 'other-card' })
];
assert.deepEqual(exactUsageMatchValidationRecordsR137(result, usageRecords).map((item) => item.id), ['cmf-1']);
assert.deepEqual(removeUsageMatchValidationRecordsR137(result, usageRecords).map((item) => item.id), ['cb-1', 'other-card'], 'Limpar CMF deve preservar a mesma carta usada como CB.');

const dataImage = `data:image/png;base64,${'a'.repeat(20)}`;
const session = buildActiveSessionSnapshotR137({
  preview: dataImage,
  playerCardImage: 'blob:nao-persistir',
  fileName: 'carta.png',
  ocrDone: true,
  rawText: 'NOME: R137',
  objective: 'COMPETITIVE',
  targetPosition: 'AUTO',
  cardPositionOverride: 'AUTO',
  playstyleOverride: 'AUTO',
  defensivePlaystyleOverride: 'AUTO',
  readingMode: 'precision',
  formation: 'AUTO',
  teamStyle: 'AUTO',
  managerId: 'AUTO',
  gameplayMode: 'UNIVERSAL',
  connectionProfile: 'VARIABLE',
  controlProfile: 'AUTO',
  manualFields: { playerName: '', level: '', trainingPointsTotal: '', attributes: {} } as any,
  manualMode: false,
  activeHistoryId: null,
  savedAt: Date.UTC(2026, 8, 4)
});
assert.equal(session.preview, dataImage);
assert.equal(session.playerCardImage, null, 'Sessão não deve persistir blob URL efêmera.');
assert.equal(session.result, null);
assert.equal(session.draftResult, null, 'Sessão só guarda entrada; autoridade derivada deve ser recalculada.');

const root = path.resolve(__dirname, '..');
const directReaders = [
  'src/modules/matches/matchEvidenceCalibrationR135.ts',
  'src/lib/longitudinalGameplayLearningV4060.ts',
  'src/lib/performanceLab2027V4080R90.ts',
  'src/components/PrecisionBuildPanel.tsx'
].map((file) => [file, fs.readFileSync(path.join(root, file), 'utf8')] as const);
for (const [file, source] of directReaders) {
  assert.doesNotMatch(source, /readAccountStorage\(MATCH_VALIDATION_STORAGE_KEY|JSON\.parse\(readAccountStorage\(MATCH_VALIDATION_STORAGE_KEY/, `${file} não pode ler partidas direto do storage.`);
  assert.match(source, /matchValidationRepositoryR137|readMatchValidationRepositoryR137|exactUsageMatchValidationRecordsR137/, `${file} deve depender do repositório R137.`);
}

const center = fs.readFileSync(path.join(root, 'src/components/MatchValidationCenter.tsx'), 'utf8');
assert.match(center, /removeUsageMatchValidationRecordsR137\(result, records\)/, 'Reset deve ser por carta + posição de uso.');
assert.match(center, /if\s*\(!storage\.persisted\)/, 'Memória derivada não pode avançar se a partida não persistiu.');
const cardVision = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
const backupRuntime = fs.readFileSync(path.join(root, 'src/modules/backup/cardVisionBackupRuntimeR162.ts'), 'utf8');
assert.match(backupRuntime, /readMatchValidationRepositoryR137\(\)/, 'Backups devem ler o snapshot normalizado do repositório R137 dentro do runtime R162.');
assert.match(backupRuntime, /commitCriticalVaultRestoreR140\(/, 'Restauração de backup deve passar pelo coordenador transacional R140 dentro do runtime R162.');
assert.doesNotMatch(backupRuntime, /replaceMatchValidationRepositoryR137\(/, 'O runtime de backup não deve restaurar partidas diretamente, fora da transação R140.');
assert.match(cardVision, /useCardVisionBackupControllerR162\(\{/, 'A UI deve delegar backup/restore ao controller R162.');
assert.match(cardVision, /useActiveSessionAutosaveR157\(\{/, 'Indicador/autosave deve passar pela fronteira R157, que preserva o retorno real de persistência sem reserializar mídia.');
assert.ok(cardVision.split(/\r?\n/).length < 4120, 'CardVisionApp deve continuar diminuindo sem compactação artificial.');

console.log('r137 aprovada: partidas têm fonte única por conta/posição, reset não apaga outras funções, falha de persistência não alimenta memória e sessão ativa foi extraída do monólito.');
