export type ReaderV2Mode = 'automatic' | 'zones';

export type ReaderV2Stage =
  | 'idle'
  | 'image-selected'
  | 'opening'
  | 'reading'
  | 'closing-ocr'
  | 'ocrClosed'
  | 'review'
  | 'bridging'
  | 'completed'
  | 'cancelled'
  | 'error';

export type ReaderV2FieldKey =
  | 'playerName'
  | 'level'
  | 'points'
  | 'mainPosition'
  | 'playstyle'
  | 'attributes'
  | 'skills'
  | 'impeto'
  | string;

export interface ReaderV2Progress {
  stage: ReaderV2Stage;
  current: number;
  total: number;
  percent: number;
  label: string;
  detail?: string;
  fieldKey?: ReaderV2FieldKey;
}

export interface ReaderV2FieldEvidence {
  key: ReaderV2FieldKey;
  label: string;
  value: string;
  confidence: number;
  source: ReaderV2Mode | 'manual';
  rawText?: string;
  error?: string;
  attributeValues?: number[];
}

export interface ReaderV2Evidence {
  mode: ReaderV2Mode;
  rawText: string;
  fields: ReaderV2FieldEvidence[];
  uncertainKeys: ReaderV2FieldKey[];
  attributesExpected?: number;
  attributesRead?: number;
  attributeValues?: number[];
}

export interface ReaderV2ReviewDraft {
  playerName: string;
  level: string;
  points: string;
  mainPosition: string;
  rawText: string;
  fields: ReaderV2FieldEvidence[];
  uncertainKeys: ReaderV2FieldKey[];
  attributeValues?: number[];
  skillValues?: string[];
  impetoName?: string;
  preview: string | null;
}

export interface ReaderV2SessionSnapshot {
  stage: ReaderV2Stage;
  mode: ReaderV2Mode | null;
  workerReady: boolean;
  pendingRecognitions: number;
  cancelled: boolean;
  error: string | null;
}

export interface ReaderV2Zone {
  key: ReaderV2FieldKey;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  enabled: boolean;
}
