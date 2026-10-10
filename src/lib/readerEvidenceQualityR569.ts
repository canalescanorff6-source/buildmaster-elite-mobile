import type { ReaderV2ReviewDraft } from '../modules/card-reader-v2/readerV2Types';

export const READER_EVIDENCE_QUALITY_R569_VERSION = 'r569-field-gates-1' as const;
export type ReaderQualityIssueR569 = {
  code: string;
  field: 'playerName' | 'level' | 'points' | 'mainPosition' | 'attributes' | 'general';
  message: string;
};
export type ReaderQualityR569 = {
  version: typeof READER_EVIDENCE_QUALITY_R569_VERSION;
  status: 'COBERTURA_COMPLETA_REVISAO_OBRIGATORIA' | 'INCOMPLETO';
  attributeSlotsExpected: 26;
  attributeSlotsRecognized: number;
  attributeSlotsMissing: number;
  printedPointsObserved: boolean;
  /** Reader confidence or complete coverage NEVER certifies OCR accuracy. */
  manualReviewRequired: true;
  issues: ReaderQualityIssueR569[];
};

type QualityInput = Pick<ReaderV2ReviewDraft,
  'playerName' | 'level' | 'points' | 'pointsSource' | 'mainPosition'
  | 'attributeRows' | 'fields' | 'uncertainKeys'>;

const VALID_ATTRIBUTE = (v: number | null | undefined) =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 1 && v <= 120;
const VALID_INT = (v: string, min:number, max:number) =>
  /^\d{1,3}$/.test(v.trim()) && Number.isSafeInteger(Number(v)) && Number(v) >= min && Number(v) <= max;

/**
 * Diagnostic only. Does NOT alter the OCR pipeline, replace evidence values,
 * clear uncertainties, auto-save, or infer missing attributes from neighbouring cells.
 */
export function assessReaderEvidenceQualityR569(draft: QualityInput): ReaderQualityR569 {
  const issues: ReaderQualityIssueR569[] = [];
  function issue(code:string,field:ReaderQualityIssueR569['field'],message:string) {
    if (!issues.some(v=>v.code===code)) issues.push({code,field,message});
  }
  if (!draft.playerName.trim()) issue('NOME_AUSENTE','playerName','Nome não identificado.');
  if (!VALID_INT(draft.level,1,100)) issue('NIVEL_INVALIDO','level','Nível ausente ou inválido.');
  if (!VALID_INT(draft.points,0,999)) issue('PONTOS_INVALIDOS','points','Pontos não confirmados.');
  if (draft.pointsSource!=='print') issue('PONTOS_NAO_OBSERVADOS','points',
    'Pontos calculados, editados ou sem origem direta no print: revisar no jogo.');
  if (!draft.mainPosition.trim()) issue('POSICAO_AUSENTE','mainPosition','Posição principal não identificada.');
  const rows = draft.attributeRows ??
    draft.fields.find(f=>f.key==='attributes')?.attributeRows;
  const recognized = rows?.filter(VALID_ATTRIBUTE).length ?? 0;
  if (!rows || rows.length!==26) issue('ATRIBUTOS_SEM_LAYOUT_COMPLETO','attributes',
    'Os 26 slots não foram identificados em posições fixas; não inferir pela ordem de texto.');
  if (recognized < 26) issue('ATRIBUTOS_PENDENTES','attributes',
    (26-recognized)+' atributo(s) não comprovado(s) em seus slots.');
  for (const key of ['playerName','level','points','mainPosition','attributes'] as const) {
    const evidence = draft.fields.find(f=>f.key===key || (key==='playerName'&&f.key==='name'));
    if (!evidence || evidence.error || evidence.confidence < 80) {
      issue('EVIDENCIA_FRACA_'+key,key,'Campo ausente, com erro ou abaixo de confiança de leitura: '+key);
    }
  }
  for (const key of draft.uncertainKeys) {
    if (['playerName','level','points','mainPosition','attributes'].includes(String(key))) {
      issue('PENDENCIA_'+String(key),'general','Leitor marcou '+key+' para revisão.');
    }
  }
  const status = issues.length === 0
    ? 'COBERTURA_COMPLETA_REVISAO_OBRIGATORIA' : 'INCOMPLETO';
  return {
    version:READER_EVIDENCE_QUALITY_R569_VERSION,status,
    attributeSlotsExpected:26,attributeSlotsRecognized:Math.min(recognized,26),
    attributeSlotsMissing:26-Math.min(recognized,26),
    printedPointsObserved:draft.pointsSource==='print',
    manualReviewRequired:true,issues,
  };
}

/** Golden-label benchmark: only compares provided ground truth, never manufactures accuracy. */
export type ReaderLabeledCaseR569 = {
  caseId: string;
  expected: {playerName:string;level:string;points:string;attributeRows:readonly number[]};
  actual: QualityInput;
};
export type ReaderBenchmarkR569 = {
  fixtures:number;
  nameExact:number;
  levelExact:number;
  pointsExact:number;
  attributeExact:number;
  attributeTotal:number;
  attributeAccuracy:number|null;
  status:'SEM_FIXTURES'|'MEDIDO_EM_FIXTURES';
  /** Synthetic labels must never be represented as a real-world accuracy claim. */
  validatedOnRealScreenshots:false;
};
const clean=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/\s+/g,' ').trim();
export function benchmarkLabeledReaderCasesR569(fixtures:readonly ReaderLabeledCaseR569[]):ReaderBenchmarkR569 {
  const out:ReaderBenchmarkR569={fixtures:fixtures.length,nameExact:0,levelExact:0,pointsExact:0,
    attributeExact:0,attributeTotal:0,attributeAccuracy:null,
    status:fixtures.length?'MEDIDO_EM_FIXTURES':'SEM_FIXTURES',validatedOnRealScreenshots:false};
  for(const item of fixtures) {
    if(clean(item.actual.playerName)===clean(item.expected.playerName)) out.nameExact++;
    if(item.actual.level.trim()===item.expected.level.trim())out.levelExact++;
    if(item.actual.points.trim()===item.expected.points.trim())out.pointsExact++;
    const actual=item.actual.attributeRows;
    out.attributeTotal+=item.expected.attributeRows.length;
    for(let i=0;i<item.expected.attributeRows.length;i++) {
      if(actual && VALID_ATTRIBUTE(actual[i]) && actual[i]===item.expected.attributeRows[i])out.attributeExact++;
    }
  }
  out.attributeAccuracy=out.attributeTotal?Math.round((out.attributeExact/out.attributeTotal)*10000)/100:null;
  return out;
}
