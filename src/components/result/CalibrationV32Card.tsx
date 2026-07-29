import type { AnalysisResult, TrainingKey, TrainingPlan } from '@/lib/analyzerDomain';
import { TRAINING_LABELS } from '@/lib/trainingEngine';

const DIMENSIONS: Array<{ key: keyof NonNullable<AnalysisResult['calibrationV32']>['dimensions']; label: string }> = [
  { key: 'roleFit', label: 'Função' },
  { key: 'formationFit', label: 'Formação' },
  { key: 'playstyleFit', label: 'Estilo' },
  { key: 'controlFit', label: 'Seu controle' },
  { key: 'connectionRobustness', label: 'Conexão' },
  { key: 'pointEfficiency', label: 'Pontos' },
  { key: 'skillSynergy', label: 'Habilidades' },
  { key: 'impetoSynergy', label: 'Ímpeto' },
  { key: 'antiOverallWaste', label: 'Anti-overall' },
  { key: 'crossModeStability', label: 'Estabilidade' }
];

function planSummary(plan: TrainingPlan) {
  return (Object.entries(plan) as Array<[TrainingKey, number]>)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${TRAINING_LABELS[key]} ${value}`)
    .join(' • ');
}

function profileClass(mode: string, selected: string) {
  return mode === selected ? 'calibration-profile selected' : 'calibration-profile';
}

export function CalibrationV32Card({ result }: { result: AnalysisResult }) {
  const calibration = result.calibrationV32;
  if (!calibration) return null;
  return (
    <article className="luxury-panel wide-card calibration-v32-card">
      <div className="section-title-row">
        <div>
          <p className="kicker">Matriz de Calibração v32.00</p>
          <h3>Ficha calibrada para a partida real</h3>
        </div>
        <span>{calibration.calibrationScore}/100</span>
      </div>
      <p className="panel-note"><b>{calibration.patchReference}</b> • prontidão {calibration.readiness} ({calibration.readinessScore}/100) • confiança {calibration.confidence}/100</p>
      <div className="health-score-grid calibration-score-grid">
        <article><strong>{calibration.calibrationScore}</strong><span>Calibração final</span></article>
        <article><strong>{calibration.exactBudgetCandidates}</strong><span>Candidatas exatas</span></article>
        <article><strong>{calibration.candidatesEvaluated}</strong><span>Simulações</span></article>
        <article><strong>{calibration.recalibrated ? 'SIM' : 'OK'}</strong><span>{calibration.recalibrated ? 'Ficha recalibrada' : 'Ficha confirmada'}</span></article>
      </div>
      <div className="stat-bars five-cols calibration-dimension-bars">
        {DIMENSIONS.map(({ key, label }) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{Math.round(calibration.dimensions[key])}</strong>
            <i><b style={{ width: `${Math.min(100, calibration.dimensions[key])}%` }} /></i>
          </div>
        ))}
      </div>
      <div className="variant-grid calibration-profile-grid">
        {calibration.profiles.map((profile) => (
          <div key={profile.mode} className={profileClass(profile.mode, calibration.selectedMode)}>
            <strong>{profile.label}{profile.mode === calibration.selectedMode ? ' • ATIVA' : ''}</strong>
            <span>Nota {profile.score}/100 • orçamento {profile.exactBudget ? 'exato' : 'revisar'}</span>
            <em>{planSummary(profile.training)}</em>
            <p>{profile.strengths.join(' • ')}</p>
            <small>{profile.tradeOffs.join(' ')}</small>
          </div>
        ))}
      </div>
      {(calibration.blockers.length > 0 || calibration.warnings.length > 0) && (
        <div className="skill-grid calibration-alert-grid">
          <div className="skill-check-card muted">
            <strong>O que ainda melhora a precisão</strong>
            {calibration.blockers.map((item) => <span key={item}>⚠ {item}</span>)}
            {calibration.warnings.map((item) => <span key={item}>• {item}</span>)}
          </div>
          <div className="skill-check-card">
            <strong>Proteções ativas</strong>
            {calibration.safeguards.slice(0, 7).map((item) => <span key={item}>✓ {item}</span>)}
          </div>
        </div>
      )}
      {calibration.reasons.map((item) => <p key={item} className="panel-note">• {item}</p>)}
      <p className="panel-note"><b>{calibration.summary}</b></p>
    </article>
  );
}
