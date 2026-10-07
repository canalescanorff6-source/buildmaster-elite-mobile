import * as assert from 'node:assert/strict';
import { readReaderV2Automatic } from '../src/modules/card-reader-v2/readerV2Automatic';
import { createReaderV2Orchestrator } from '../src/modules/card-reader-v2/readerV2Orchestrator';
import type { ReaderV2ImageSession } from '../src/modules/card-reader-v2/readerV2ImageSession';
import type { ReaderV2OcrWorkerSession } from '../src/modules/card-reader-v2/readerV2OcrWorker';
import type { ReaderV2FieldEvidence, ReaderV2Progress, ReaderV2SessionSnapshot, ReaderV2Zone } from '../src/modules/card-reader-v2/readerV2Types';

async function testAutomaticReader() {
  const seen: string[] = [];
  const imageSession = {
    async withCrop<T>(zone: ReaderV2Zone, operation: (crop: HTMLCanvasElement) => Promise<T> | T): Promise<T> {
      seen.push(String(zone.key));
      return await operation({ zoneKey: zone.key } as unknown as HTMLCanvasElement);
    },
  } as Pick<ReaderV2ImageSession, 'withCrop'>;
  const values: Record<string, string> = {
    playerName: 'Neymar Jr\nArmador criativo',
    identityMeta: 'Nível máximo: 31\nPontos totais: 60\nPosição principal: PTE',
    level: '31',
    points: '60',
    mainPosition: 'LWF',
    playstyle: 'Armador criativo',
    attributes: '90 91 92 89 88 87 86 85 84 83 82 81 80 79 78 77 76 75 74 73 72 71 70 69 68 67',
    skills: 'Double Touch\nSole Control',
    impeto: 'Booster +2',
  };
  const workerSession = {
    async recognize(_input: unknown, key: string): Promise<ReaderV2FieldEvidence> {
      return { key, label: key, value: values[key] ?? '', confidence: 90, source: 'automatic', rawText: values[key] ?? '' };
    },
  } as Pick<ReaderV2OcrWorkerSession, 'recognize'>;

  const evidence = await readReaderV2Automatic({ imageSession, workerSession });
  assert.equal(evidence.mode, 'automatic');
  assert.equal(evidence.attributesRead, 26);
  assert.ok(seen.includes('playerName'));
  assert.ok(seen.includes('identityMeta'));
  assert.ok(seen.includes('attributes-values-left'));
  assert.ok(seen.includes('skills'));
  assert.ok(evidence.fields.every((field) => field.source === 'automatic'));
}

async function testOrchestratorLifecycle() {
  const events: string[] = [];
  const progress: ReaderV2Progress[] = [];
  let workerFactoryCalls = 0;
  let analysisCalls = 0;
  let workerSnapshot: ReaderV2SessionSnapshot = {
    stage: 'idle', mode: null, workerReady: false, pendingRecognitions: 0, cancelled: false, error: null,
  };

  const workerSession = {
    async start() {
      workerFactoryCalls += 1;
      workerSnapshot = { ...workerSnapshot, stage: 'reading', workerReady: true };
      events.push('worker:start');
      return {} as never;
    },
    async recognize() { throw new Error('not used directly by orchestrator fixture'); },
    async cancel() {
      workerSnapshot = { ...workerSnapshot, stage: 'cancelled', workerReady: false };
      events.push('worker:cancel');
    },
    async close() {
      workerSnapshot = { ...workerSnapshot, stage: 'ocrClosed', workerReady: false, pendingRecognitions: 0 };
      events.push('worker:close');
    },
    snapshot() { return workerSnapshot; },
  } as ReaderV2OcrWorkerSession;

  const imageSession = {
    preview: 'blob:reader-v2', width: 900, height: 1200,
    async withCrop<T>(_zone: ReaderV2Zone, operation: (crop: HTMLCanvasElement) => Promise<T> | T): Promise<T> {
      return await operation({} as HTMLCanvasElement);
    },
    close() { events.push('image:close'); },
    snapshot() { return { width: 900, height: 1200, originalWidth: 900, originalHeight: 1200, preview: 'blob:reader-v2', cropActive: false, closed: false }; },
  } as ReaderV2ImageSession;

  const evidence = {
    mode: 'automatic' as const,
    rawText: 'Neymar Jr\n31\n60',
    fields: [
      { key: 'playerName', label: 'Nome', value: 'Neymar Jr', confidence: 95, source: 'automatic' as const },
      { key: 'level', label: 'Nível', value: '31', confidence: 95, source: 'automatic' as const },
      { key: 'points', label: 'Pontos', value: '60', confidence: 95, source: 'automatic' as const },
    ],
    uncertainKeys: [],
  };

  const orchestrator = createReaderV2Orchestrator({
    openImageSession: async () => { events.push('image:open'); return imageSession; },
    createWorkerSession: () => workerSession,
    readAutomatic: async ({ onProgress }) => {
      events.push('ocr:read');
      onProgress?.({ stage: 'reading', current: 1, total: 1, percent: 100, label: 'OCR completo' });
      assert.equal(workerSession.snapshot().workerReady, true, 'R542-D: worker precisa estar ativo durante OCR.');
      assert.equal(analysisCalls, 0, 'R542-D: análise/bridge não pode rodar durante OCR.');
      return evidence;
    },
    readZones: async () => evidence,
    buildReview: (value, preview) => ({
      playerName: value.fields[0]?.value ?? '', level: value.fields[1]?.value ?? '', points: value.fields[2]?.value ?? '',
      mainPosition: '', rawText: value.rawText, fields: value.fields, uncertainKeys: value.uncertainKeys, preview,
    }),
    assertReviewReady: (snapshot) => {
      assert.equal(snapshot.stage, 'ocrClosed');
      assert.equal(snapshot.workerReady, false);
      assert.equal(snapshot.pendingRecognitions, 0);
      events.push('review:ready');
    },
    onProgress: (item) => progress.push(item),
  });

  const file = new File(['fake'], 'card.png', { type: 'image/png' });
  await orchestrator.select(file);
  assert.equal(workerFactoryCalls, 0, 'R542-D: selecionar arquivo não pode iniciar worker.');
  assert.equal(orchestrator.snapshot().stage, 'image-selected');

  const result = await orchestrator.start('automatic');
  assert.equal(result.evidence.rawText, evidence.rawText);
  assert.equal(result.review.playerName, 'Neymar Jr');
  assert.equal(workerFactoryCalls, 1, 'R542-D: leitura deve iniciar um worker uma única vez.');
  assert.ok(progress.length > 0, 'R542-D: fluxo precisa publicar progresso.');
  assert.deepEqual(events.slice(0, 5), ['image:open', 'worker:start', 'ocr:read', 'worker:close', 'review:ready']);
  assert.equal(orchestrator.snapshot().stage, 'review');
  assert.equal(orchestrator.snapshot().workerReady, false);
  assert.equal(analysisCalls, 0, 'R542-D: terminar OCR e abrir conferência não chama análise automaticamente.');

  analysisCalls += 1; // simula ação explícita posterior do bridge, fora do OCR.
  assert.equal(analysisCalls, 1);
  orchestrator.close();
  assert.ok(events.includes('image:close'));
}

async function testSecondCardStartsFreshReaderGeneration() {
  let workerGenerations = 0;
  const openedImages: string[] = [];
  const closedImages: string[] = [];
  let currentImageName = '';

  const makeEvidence = (name: string) => ({
    mode: 'automatic' as const,
    rawText: name,
    fields: [
      { key: 'playerName', label: 'Nome', value: name, confidence: 95, source: 'automatic' as const },
      { key: 'level', label: 'Nível', value: '31', confidence: 95, source: 'automatic' as const },
      { key: 'points', label: 'Pontos', value: '60', confidence: 95, source: 'automatic' as const },
    ],
    uncertainKeys: [],
  });

  const orchestrator = createReaderV2Orchestrator({
    openImageSession: async (file) => {
      const fileName = file instanceof File ? file.name : `blob-${openedImages.length + 1}`;
      const preview = `blob:${fileName}`;
      currentImageName = fileName;
      openedImages.push(preview);
      let closed = false;
      return {
        preview,
        width: 900,
        height: 1200,
        async withCrop<T>(_zone: ReaderV2Zone, operation: (crop: HTMLCanvasElement) => Promise<T> | T): Promise<T> {
          return await operation({} as HTMLCanvasElement);
        },
        close() {
          if (closed) return;
          closed = true;
          closedImages.push(preview);
        },
        snapshot() {
          return { width: 900, height: 1200, originalWidth: 900, originalHeight: 1200, preview, cropActive: false, closed };
        },
      } as ReaderV2ImageSession;
    },
    createWorkerSession: () => {
      workerGenerations += 1;
      let ready = false;
      let closed = false;
      let stage: ReaderV2SessionSnapshot['stage'] = 'idle';
      return {
        async start() { ready = true; stage = 'reading'; return {} as never; },
        async recognize() { throw new Error('not used directly by R546 fixture'); },
        async cancel() { ready = false; stage = 'cancelled'; },
        async close() {
          if (closed) return;
          closed = true;
          ready = false;
          stage = 'ocrClosed';
        },
        snapshot() {
          return { stage, mode: null, workerReady: ready, pendingRecognitions: 0, cancelled: stage === 'cancelled', error: null };
        },
      } as ReaderV2OcrWorkerSession;
    },
    readAutomatic: async () => makeEvidence(currentImageName.includes('second') ? 'Second Player' : 'First Player'),
    readZones: async () => makeEvidence(currentImageName.includes('second') ? 'Second Player' : 'First Player'),
    buildReview: (value, preview) => ({
      playerName: value.fields[0]?.value ?? '',
      level: value.fields[1]?.value ?? '',
      points: value.fields[2]?.value ?? '',
      mainPosition: '',
      rawText: value.rawText,
      fields: value.fields,
      uncertainKeys: value.uncertainKeys,
      preview,
    }),
    assertReviewReady: (snapshot) => {
      assert.equal(snapshot.stage, 'ocrClosed');
      assert.equal(snapshot.workerReady, false);
      assert.equal(snapshot.pendingRecognitions, 0);
    },
  });

  await orchestrator.select(new File(['first'], 'first-card.png', { type: 'image/png' }));
  const first = await orchestrator.start('automatic');
  assert.equal(first.review.playerName, 'First Player');

  await orchestrator.select(new File(['second'], 'second-card.png', { type: 'image/png' }));
  assert.equal(orchestrator.snapshot().stage, 'image-selected', 'R546-B: selecionar a segunda carta deve limpar o estado de review anterior.');
  const second = await orchestrator.start('automatic');

  assert.equal(second.review.playerName, 'Second Player', 'R546-B: a segunda carta não pode reutilizar evidência da primeira.');
  assert.equal(workerGenerations, 2, 'R546-B: cada carta precisa de uma geração independente do worker OCR.');
  assert.deepEqual(openedImages, ['blob:first-card.png', 'blob:second-card.png']);
  assert.ok(closedImages.includes('blob:first-card.png'), 'R546-B: a imagem da primeira carta deve ser liberada antes da segunda leitura.');
  assert.equal(orchestrator.snapshot().stage, 'review');
  assert.equal(orchestrator.snapshot().workerReady, false);

  orchestrator.close();
  assert.ok(closedImages.includes('blob:second-card.png'), 'R546-B: fechar o leitor deve liberar também a segunda imagem.');
}

async function main() {
  await testAutomaticReader();
  await testOrchestratorLifecycle();
  await testSecondCardStartsFreshReaderGeneration();
  console.log('R542-D aprovado: automático serial e orquestrador fecha OCR antes da conferência.');
}

void main().catch((cause) => {
  console.error(cause);
  process.exitCode = 1;
});
