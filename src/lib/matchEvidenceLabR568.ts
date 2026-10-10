import type { MatchPerformanceMetrics, MatchValidationRecord } from './appStartupContractsR200';

export const MATCH_EVIDENCE_LAB_R568_VERSION = 'r568-match-evidence-readonly-1' as const;

/** Not an automatic win/loss judgement: only metrics explicitly observed for a player. */
export const MATCH_METRICS_R568 = [
  { key: 'interceptions', label: 'Interceptações' },
  { key: 'passErrors', label: 'Erros de passe' },
  { key: 'ballLosses', label: 'Perdas de bola' },
  { key: 'dribblesCompleted', label: 'Dribles concluídos' },
  { key: 'keyPasses', label: 'Passes decisivos' },
  { key: 'shotsOnTarget', label: 'Chutes no alvo' },
  { key: 'tackles', label: 'Desarmes' },
  { key: 'goals', label: 'Gols' },
] as const satisfies ReadonlyArray<{key: keyof MatchPerformanceMetrics; label: string}>;

export type MatchMetricR568 = typeof MATCH_METRICS_R568[number]['key'];
export type MatchContextR568 = {
  key: string;
  label: string;
  records: number;
  armA: number;
  armB: number;
};
export type MatchArmSummaryR568 = {
  arm: 'A' | 'B';
  buildSignature: string | null;
  samples: number;
  sessions: number;
  totalMinutes: number;
  observedPer90: number | null;
};
export type MatchEvidenceR568 = {
  version: typeof MATCH_EVIDENCE_LAB_R568_VERSION;
  status: 'SEM_CONTEXTO' | 'CONTEXTO_NAO_SELECIONADO' | 'PENDENTE' | 'DESCRITIVO';
  contextKey: string | null;
  metric: MatchMetricR568;
  comparison: { deltaBminusA: number; interpretation: 'DIFERENCA_OBSERVADA_NAO_CAUSAL' } | null;
  arms: [MatchArmSummaryR568, MatchArmSummaryR568];
  minimumPerArm: number;
  excludedRecords: number;
  warnings: string[];
  winner: null;
  canCalibrate: false;
};

const MIN_MATCHES = 5;
const MIN_MINUTES = 30;
const EMPTY_ARM = (arm: 'A' | 'B'): MatchArmSummaryR568 =>
  ({ arm, buildSignature: null, samples: 0, sessions: 0, totalMinutes: 0, observedPer90: null });
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const str = (v: unknown) => typeof v === 'string' && v.trim() ? v.trim() : null;
const isObserved = (record: MatchValidationRecord, metric: MatchMetricR568): boolean =>
  !!record.observedMetricKeysR468?.includes(metric)
  && Number.isSafeInteger(record.metrics?.[metric])
  && Number(record.metrics?.[metric]) >= 0;

/**
 * Keeps each card edition/position/formation/style/patch/connection under its own
 * experimental context. Incomplete metadata is excluded rather than guessed.
 */
function contextKeyR568(record: MatchValidationRecord): string | null {
  const fingerprint = str(record.cardFingerprint);
  const version = str(record.gameVersion);
  const season = str(record.gameSeason);
  const mode = str(record.mode);
  const connection = str(record.connection);
  const style = str(record.teamStyle);
  const formation = str(record.formation);
  const position = str(record.targetPosition);
  const control = str(record.controlStyle);
  const functionName = str(record.usageFunction);
  if (![fingerprint,version,season,mode,connection,style,formation,position,control,functionName].every(Boolean)) return null;
  return JSON.stringify([fingerprint,version,season,mode,connection,style,formation,position,control,functionName]);
}
export function listMatchEvidenceContextsR568(records: readonly MatchValidationRecord[]): MatchContextR568[] {
  const groups = new Map<string, MatchContextR568>();
  for (const record of records) {
    if (record.experimentArm !== 'A' && record.experimentArm !== 'B') continue;
    const key = contextKeyR568(record);
    if (!key) continue;
    const group = groups.get(key) ?? {
      key, label: [record.gameVersion,record.formation,record.teamStyle,record.mode,record.connection,record.usageFunction].join(' • '),
      records: 0, armA: 0, armB: 0,
    };
    group.records += 1;
    if (record.experimentArm === 'A') group.armA += 1;
    else group.armB += 1;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a,b)=>b.records-a.records || a.key.localeCompare(b.key));
}

export function evaluateMatchEvidenceR568(input: {
  records: readonly MatchValidationRecord[];
  contextKey: string | null;
  metric: MatchMetricR568;
}): MatchEvidenceR568 {
  const contexts = listMatchEvidenceContextsR568(input.records);
  const warnings:string[] = [];
  const base: MatchEvidenceR568 = {
    version: MATCH_EVIDENCE_LAB_R568_VERSION,
    status:'SEM_CONTEXTO', contextKey:input.contextKey, metric:input.metric,
    comparison:null, arms:[EMPTY_ARM('A'),EMPTY_ARM('B')], minimumPerArm:MIN_MATCHES,
    excludedRecords:input.records.length, warnings, winner:null, canCalibrate:false,
  };
  if (!contexts.length) {
    warnings.push('Sem testes A/B com edição, versão de jogo, formação, função, modo e conexão identificados.');
    return base;
  }
  if (!input.contextKey || !contexts.some(context => context.key===input.contextKey)) {
    warnings.push('Escolha explicitamente um contexto de teste; não selecionar automaticamente o grupo com melhor resultado.');
    return {...base,status:'CONTEXTO_NAO_SELECIONADO'};
  }
  if (!MATCH_METRICS_R568.some(item=>item.key===input.metric)) {
    warnings.push('Métrica desconhecida para a versão R568.');
    return {...base,status:'PENDENTE'};
  }
  const rows=input.records.filter(r=>contextKeyR568(r)===input.contextKey && (r.experimentArm==='A'||r.experimentArm==='B'));
  const included:MatchValidationRecord[]=[];
  const sessionSet=new Set<string>();
  const idSet=new Set<string>();
  for(const r of rows){
    const session=str(r.sessionIdR462);
    const id=str(r.id);
    const variant=str(r.testedBuildId)||str(r.buildSignature);
    const validDate=Number.isFinite(Date.parse(r.playedAt));
    if(!session || !id || !variant || !validDate || !Number.isFinite(r.minutes)
      || r.minutes<MIN_MINUTES || r.minutes>120
      || idSet.has(id) || sessionSet.has(session)
      || !isObserved(r,input.metric)) continue;
    idSet.add(id);sessionSet.add(session);
    included.push(r);
  }
  function summarize(arm:'A'|'B'):MatchArmSummaryR568 {
    const sample=included.filter(r=>r.experimentArm===arm);
    const signatures=new Set(sample.map(r=>str(r.testedBuildId)||str(r.buildSignature)).filter(Boolean));
    const min=sample.reduce((sum,r)=>sum+r.minutes,0);
    const numerator=sample.reduce((sum,r)=>sum+Number(r.metrics?.[input.metric]??0),0);
    return {arm,buildSignature:signatures.size===1?[...signatures][0]:null,
      samples:sample.length,sessions:new Set(sample.map(r=>r.sessionIdR462)).size,
      totalMinutes:min, observedPer90:min>0?round3(numerator*90/min):null};
  }
  const a=summarize('A'), b=summarize('B');
  const excludedRecords=input.records.length-included.length;
  if(a.samples<MIN_MATCHES || b.samples<MIN_MATCHES)
    warnings.push('Cada opção exige pelo menos cinco partidas válidas com esta métrica individual explicitamente observada.');
  if(!a.buildSignature || !b.buildSignature)
    warnings.push('Cada opção A/B deve corresponder a uma única ficha/assinatura identificada.');
  if(a.buildSignature && a.buildSignature===b.buildSignature)
    warnings.push('A e B precisam representar duas fichas diferentes.');
  if(excludedRecords>0) warnings.push(excludedRecords+' registro(s) excluído(s) por contexto, metadados, sessão duplicada, minutos ou métrica não observada.');
  const comparable=a.samples>=MIN_MATCHES && b.samples>=MIN_MATCHES && !!a.buildSignature
    && !!b.buildSignature && a.buildSignature!==b.buildSignature;
  const comparison=comparable?{deltaBminusA:round3((b.observedPer90??0)-(a.observedPer90??0)),
    interpretation:'DIFERENCA_OBSERVADA_NAO_CAUSAL' as const}:null;
  if(comparable)warnings.push('Comparação descritiva, não prova causal: adversários, seleção e mudanças de jogo podem influenciar a diferença.');
  return {...base,status:comparable?'DESCRITIVO':'PENDENTE',contextKey:input.contextKey,
    arms:[a,b],excludedRecords,comparison,warnings};
}
