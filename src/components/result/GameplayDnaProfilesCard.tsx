'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit, Check, ShieldCheck, Sparkles, Target } from 'lucide-react';
import type { AnalysisResult, GameplayDnaProfileId, TrainingKey, TrainingPlan } from '@/lib/analyzerDomain';
import { TRAINING_LABELS } from '@/lib/trainingEngine';

function planSummary(plan: TrainingPlan) {
  return (Object.entries(plan) as Array<[TrainingKey, number]>)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${TRAINING_LABELS[key]} ${value}`)
    .join(' • ');
}

export function GameplayDnaProfilesCard({ result, onApplyProfile }: {
  result: AnalysisResult;
  onApplyProfile?: (profileId: GameplayDnaProfileId) => void;
}) {
  const dna = result.gameplayDna;
  const [activeId, setActiveId] = useState<GameplayDnaProfileId | null>(dna?.primaryProfileId ?? null);

  useEffect(() => setActiveId(dna?.primaryProfileId ?? null), [dna?.primaryProfileId, dna?.playerName]);
  if (!dna?.profiles.length) return null;

  function apply(profileId: GameplayDnaProfileId) {
    setActiveId(profileId);
    onApplyProfile?.(profileId);
  }

  return (
    <article className="luxury-panel wide-card bm-dna-profiles-card">
      <div className="section-title-row">
        <div>
          <p className="kicker"><BrainCircuit size={14} /> Perfis de Gameplay v35.20</p>
          <h3>Três fichas para o DNA real da carta</h3>
        </div>
        <span>{dna.profiles.length} PERFIS</span>
      </div>

      <p className="panel-note"><b>{dna.playerName}</b> • posição {result.bestPosition.label} • estilo oficial {dna.officialPlaystyle || 'não confirmado'}</p>
      <div className="bm-dna-detected">
        {dna.detectedDna.map((item) => <span key={item}><Sparkles size={14} /> {item}</span>)}
      </div>

      <div className="bm-dna-profile-grid">
        {dna.profiles.map((profile) => {
          const active = profile.id === activeId;
          return (
            <section key={profile.id} className={active ? 'bm-dna-profile is-active' : 'bm-dna-profile'}>
              <header>
                <div><small>FICHA {profile.rank}</small><strong>{profile.label}</strong></div>
                <b>{profile.score}/100</b>
              </header>
              <p>{profile.functionalStyle}</p>
              <div className="bm-dna-score-line"><span>Compatibilidade</span><strong>{profile.compatibility}%</strong><i><b style={{ width: `${profile.compatibility}%` }} /></i></div>
              <div className="bm-dna-focus">{profile.focus.map((item) => <span key={item}>{item}</span>)}</div>
              <em>{planSummary(profile.training)}</em>
              <div className="bm-dna-skills">
                {profile.additionalSkills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
              <small>{profile.description}</small>
              <button type="button" className={active ? 'bm-dna-apply is-active' : 'bm-dna-apply'} onClick={() => apply(profile.id)}>
                {active ? <Check size={17} /> : <Target size={17} />}
                {active ? 'Ficha selecionada' : 'Usar esta ficha'}
              </button>
            </section>
          );
        })}
      </div>

      <div className="bm-dna-guard"><ShieldCheck size={17} /><span>{dna.summary}</span></div>
    </article>
  );
}
