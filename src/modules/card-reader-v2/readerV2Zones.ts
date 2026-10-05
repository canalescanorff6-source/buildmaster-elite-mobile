import type { ReaderV2Evidence, ReaderV2FieldEvidence, ReaderV2Progress, ReaderV2Zone } from './readerV2Types';

type ImageSessionPort = {
  withCrop<T>(zone: ReaderV2Zone, callback: (input: unknown) => Promise<T> | T): Promise<T>;
};
type WorkerPort = {
  recognize(input: unknown, key: string): Promise<ReaderV2FieldEvidence>;
};

export async function readReaderV2Zones(input: {
  sessionId: string;
  zones: ReaderV2Zone[];
  imageSession: ImageSessionPort;
  worker: WorkerPort;
  onProgress?: (progress: ReaderV2Progress) => void;
}): Promise<ReaderV2Evidence> {
  const startedAt = new Date().toISOString();
  const enabled = input.zones.filter((zone) => zone.enabled !== false);
  const fields: ReaderV2FieldEvidence[] = [];
  const uncertain = new Set<string>();

  for (let index = 0; index < enabled.length; index += 1) {
    const zone = enabled[index];
    let evidence: ReaderV2FieldEvidence;
    try {
      evidence = await input.imageSession.withCrop(zone, (crop) => input.worker.recognize(crop, zone.key));
    } catch (cause) {
      evidence = {
        key: zone.key,
        label: zone.label,
        value: '',
        confidence: 0,
        uncertain: true,
        error: cause instanceof Error ? cause.message : 'Falha OCR da zona',
      };
    }
    evidence = { ...evidence, key: zone.key, label: zone.label };
    if (!evidence.value.trim() || evidence.uncertain || evidence.confidence < 60) uncertain.add(zone.key);
    if (zone.kind === 'attributes') {
      const numericTokens = evidence.value.match(/\b\d{1,3}\b/g) ?? [];
      if (numericTokens.length < 26) uncertain.add(zone.key);
    }
    fields.push(evidence);
    input.onProgress?.({
      stage: 'reading',
      percent: Math.round(((index + 1) / Math.max(1, enabled.length)) * 95),
      label: `Lendo ${zone.label}`,
      completed: index + 1,
      total: enabled.length,
      key: zone.key,
    });
  }

  return {
    sessionId: input.sessionId,
    mode: 'zones',
    rawText: fields.map((field) => field.rawText ?? field.value).filter(Boolean).join('\n'),
    fields,
    uncertainKeys: [...uncertain],
    startedAt,
    completedAt: new Date().toISOString(),
  };
}
