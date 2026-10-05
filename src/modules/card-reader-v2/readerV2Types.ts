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

export type ReaderV2Progress = {
  stage: ReaderV2Stage;
  percent: number;
  label: string;
  detail?: string;
  completed?: number;
  total?: number;
  key?: string;
};

export type ReaderV2FieldEvidence = {
  key: string;
  label: string;
  value: string;
  confidence: number;
  rawText?: string;
  uncertain?: boolean;
  error?: string;
};

export type ReaderV2Zone = {
  key: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  enabled?: boolean;
  kind?: 'text' | 'attributes' | 'skills' | 'identity' | 'progression';
};

export type ReaderV2Evidence = {
  sessionId: string;
  mode: ReaderV2Mode;
  rawText: string;
  fields: ReaderV2FieldEvidence[];
  uncertainKeys: string[];
  startedAt: string;
  completedAt: string;
};

export type ReaderV2ReviewDraft = {
  playerName: string;
  level: string;
  points: string;
  mainPosition: string;
  rawText: string;
  fields: ReaderV2FieldEvidence[];
  uncertainKeys: string[];
  preview: string | null;
};

export type ReaderV2SessionSnapshot = {
  sessionId: string | null;
  mode: ReaderV2Mode | null;
  stage: ReaderV2Stage;
  workerReady: boolean;
  pendingRecognitions: number;
  cancelled: boolean;
  imageSelected: boolean;
};
