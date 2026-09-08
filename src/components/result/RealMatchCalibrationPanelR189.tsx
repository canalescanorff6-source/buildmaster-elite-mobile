'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';
import { buildCalibrationReport, type MatchFeedback, type MatchFeedbackKey } from '@/lib/realMatchCalibration';
import { buildAdvancedCalibration } from '@/lib/advancedCalibration';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { cardUsageIdentityKeyR126 } from '@/lib/cardIdentityFingerprintR126';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';
import { CALIBRATION_STORAGE_KEY } from '@/modules/matches/calibrationStorage';
import { COMPETITIVE_FUSION_EVENT } from '@/lib/competitiveBuildFusion';

const trainingLabels: Record<string, string> = {
  shooting: 'Finalização', passing: 'Passe', dribbling: 'Drible', dexterity: 'Destreza',
  lowerBodyStrength: 'Força pernas', aerialStrength: 'Bola aérea', defending: 'Defesa',
  gk1: 'Goleiro 1', gk2: 'Goleiro 2', gk3: 'Goleiro 3'
};

function trainingSummary(plan: Record<string, number>) {
  return Object.entries(plan)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${trainingLabels[key] ?? key} +${value}`)
    .join(' • ');
}

function trainingSignature(plan: Record<string, number>) {
  return Object.entries(plan).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}:${value}`).join('|');
}

const FEEDBACK_LABELS: Array<{ key: MatchFeedbackKey; label: string }> = [
  { key: 'workedWell', label: 'Jogou bem' }, { key: 'feltSlow', label: 'Ficou lento' },
  { key: 'tiredEarly', label: 'Cansou cedo' }, { key: 'missedPasses', label: 'Errou passes' },
  { key: 'defendedWell', label: 'Defendeu bem' }, { key: 'lackedPhysical', label: 'Faltou físico' },
  { key: 'createdLittle', label: 'Criou pouco' }, { key: 'finishedPoorly', label: 'Finalizou mal' },
  { key: 'outOfPosition', label: 'Ficou fora de posição' }
];

export function RealMatchCalibrationPanelR189({ result }: { result: AnalysisResult }) {
  const usagePosition = analysisUsagePositionR138(result);
  const storageId = cardUsageIdentityKeyR126(result.parsed, usagePosition);
  const legacyStorageId = `${result.parsed.internalId}:${usagePosition}`;
  const abTest = result.unifiedIntelligence?.simulation.abTest;
  const [feedbacks, setFeedbacks] = useState<MatchFeedback[]>([]);
  const [draft, setDraft] = useState<MatchFeedback>({ rating: 7, minutes: 90, abVariant: 'A' });
  useEffect(() => {
    try {
      const all = JSON.parse(readAccountStorage(CALIBRATION_STORAGE_KEY) || '{}') as Record<string, MatchFeedback[]>;
      setFeedbacks(Array.isArray(all[storageId]) ? all[storageId] : Array.isArray(all[legacyStorageId]) ? all[legacyStorageId] : []);
    } catch { setFeedbacks([]); }
  }, [storageId]);
  const report = useMemo(() => buildCalibrationReport(result, feedbacks), [result, feedbacks]);
  const advanced = useMemo(() => buildAdvancedCalibration(result, feedbacks), [result, feedbacks]);
  const abProgress = useMemo(() => {
    const calculate = (variant: 'A' | 'B') => {
      const items = feedbacks.filter((item) => item.abVariant === variant);
      const ratings = items.map((item) => Number(item.rating)).filter(Number.isFinite);
      return { count: items.length, average: ratings.length ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)) : null };
    };
    return { A: calculate('A'), B: calculate('B') };
  }, [feedbacks]);
  function saveFeedback() {
    const selectedVariant = draft.abVariant === 'B' && abTest?.available ? 'B' : 'A';
    const selectedPlan = selectedVariant === 'B' && abTest?.available ? abTest.variantB : abTest?.variantA ?? result.training;
    const item: MatchFeedback = {
      ...draft,
      abVariant: abTest?.available ? selectedVariant : undefined,
      trainingPlan: selectedPlan,
      createdAt: new Date().toISOString(),
      buildSignature: trainingSignature(selectedPlan),
      buildLabel: abTest?.available ? `Teste A/B • Ficha ${selectedVariant}` : result.buildName,
      managerId: result.tacticalProfile.managerId,
      managerName: result.tacticalProfile.managerName,
      formation: result.tacticalProfile.formation,
      tacticalStyle: result.tacticalProfile.style,
      predictedScore: Math.round(result.buildVariants[0]?.qualityScore ?? result.bestPosition.score ?? 0),
      gameSeason: 'eFootball 2027',
      gameVersion: '6.0.0',
      gameplayEpoch: 'V6',
      connectionProfile: result.efootballV600?.connectionProfile ?? result.tacticalProfile.connectionProfile
    };
    const next = [item, ...feedbacks].slice(0, 30);
    setFeedbacks(next);
    try {
      const all = JSON.parse(readAccountStorage(CALIBRATION_STORAGE_KEY) || '{}') as Record<string, MatchFeedback[]>;
      all[storageId] = next;
      writeAccountStorage(CALIBRATION_STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent(COMPETITIVE_FUSION_EVENT));
    } catch {}
    setDraft({ rating: 7, minutes: 90, abVariant: selectedVariant });
  }
  return <div className="result-section-grid">
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">Resultados reais</p><h3>Calibração pós-partida</h3></div><span>{report.sampleCount} jogo(s)</span></div>
      <p className="panel-note">Registre o que você realmente sentiu em campo. O app procura padrões repetidos, mas nunca altera sua ficha sem sua decisão.</p>
      {abTest?.available && <div className="bm-ab-feedback-selector">
        <strong>Qual ficha você usou nesta partida?</strong>
        <div className="chip-cloud purple">
          <button type="button" className={(draft.abVariant ?? 'A') === 'A' ? 'active' : ''} onClick={() => setDraft((current) => ({ ...current, abVariant: 'A' }))}>Ficha A • principal</button>
          <button type="button" className={draft.abVariant === 'B' ? 'active' : ''} onClick={() => setDraft((current) => ({ ...current, abVariant: 'B' }))}>Ficha B • teste</button>
        </div>
        <small>{draft.abVariant === 'B' ? trainingSummary(abTest.variantB) : trainingSummary(abTest.variantA)}</small>
        <div className="bm-ab-progress-row"><span>A: {abProgress.A.count}/5 • média {abProgress.A.average ?? '--'}</span><span>B: {abProgress.B.count}/5 • média {abProgress.B.average ?? '--'}</span></div>
      </div>}
      <div className="chip-cloud purple">{FEEDBACK_LABELS.map(({key,label}) => <button type="button" key={key} className={draft[key] ? 'active' : ''} onClick={() => setDraft((current) => ({ ...current, [key]: !current[key] }))}>{draft[key] ? '✓ ' : ''}{label}</button>)}</div>
      <div className="data-grid">
        <label><span>Minutos jogados</span><input inputMode="numeric" value={draft.minutes ?? 90} onChange={(e) => setDraft((current) => ({...current, minutes: Number(e.target.value) || 0}))}/></label>
        <label><span>Nota pessoal (0–10)</span><input inputMode="decimal" value={draft.rating ?? 7} onChange={(e) => setDraft((current) => ({...current, rating: Math.max(0, Math.min(10, Number(e.target.value) || 0))}))}/></label>
      </div>
      <label className="wide-input"><span>Observação opcional</span><textarea value={draft.notes ?? ''} onChange={(e) => setDraft((current) => ({...current, notes: e.target.value}))} placeholder="Ex.: perdeu duelos no segundo tempo, mas passou bem..." /></label>
      <button type="button" className="elite-button" onClick={saveFeedback}><Save size={17}/> Salvar resultado da partida</button>
    </article>
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">Calibração avançada</p><h3>Ficha, técnico, formação e realidade</h3></div><span>Confiança {advanced.prediction.confidence}</span></div>
      <div className="data-grid">
        {[advanced.byBuild, advanced.byManager, advanced.byFormation].map((item) => <div key={item.label} className="skill-check-card"><strong>{item.label}</strong><span>{item.sampleCount} jogo(s) • nota média {item.averageRating || '--'}/10</span><small>Positivos {item.positiveRate}% • problemas {item.issueRate}% • confiança {item.confidence}</small></div>)}
      </div>
      <div className="skill-check-card"><strong>Previsão versus realidade</strong><span>Previsto {advanced.prediction.predicted}/100 • Real {advanced.prediction.actual ?? '--'}/100</span><small>{advanced.prediction.verdict}</small></div>
      <div className="section-title-row"><div><p className="kicker">Preferência pessoal</p><h3>O que seu histórico valoriza</h3></div><span>{advanced.preference.sampleCount} jogo(s)</span></div>
      {advanced.preference.priorities.map((item) => <div key={item.key} className="skill-check-card"><strong>{item.label} • evidência {item.score}</strong><span>{item.reason}</span></div>)}
      {!advanced.preference.priorities.length && <p className="panel-note">{advanced.preference.note}</p>}
      {advanced.preference.avoidances.map((item) => <small key={item}>• {item}</small>)}
    </article>
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">Aprendizado controlado</p><h3>Diagnóstico da ficha</h3></div><span>Confiança {report.confidence}</span></div>
      <p className="panel-note"><b>{report.verdict}</b></p>
      {report.positives.map((item) => <p key={item} className="panel-note">✓ {item}</p>)}
      {report.corrections.map((item) => <div key={item.title} className="skill-check-card"><strong>{item.title} • prioridade {item.priority}</strong><span>{item.reason}</span><small>Treinos relacionados: {item.trainingGroups.join(', ')}</small></div>)}
      {!report.corrections.length && <p className="panel-note">Continue registrando partidas para confirmar tendências e evitar ajustes baseados em uma única impressão.</p>}
      <div className="chip-cloud">{Object.entries(report.learnedWeights).map(([key,value]) => <span key={key}>{key}: +{value}</span>)}</div>
      {report.safeguards.map((item) => <small key={item}>• {item}</small>)}
    </article>
  </div>;
}

