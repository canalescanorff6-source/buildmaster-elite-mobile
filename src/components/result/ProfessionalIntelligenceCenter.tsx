'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  ClipboardCopy,
  Database,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert
} from 'lucide-react';
import type { AnalysisResult, TrainingKey, TrainingPlan } from '@/lib/analyzer';
import {
  CARD_REGISTRY_STORAGE_KEY,
  MATCH_VALIDATION_STORAGE_KEY,
  type CardRegistryEntry,
  type MatchValidationRecord
} from '@/lib/appEvolution';
import { readAccountStorage } from '@/lib/accountStorage';
import {
  buildProfessionalIntelligenceReport,
  type ScenarioGameplayProfile
} from '@/lib/professionalIntelligenceV37';
import { TRAINING_LABELS } from '@/lib/trainingEngine';

function loadArray<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(readAccountStorage(key) || '[]') as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function planText(plan: TrainingPlan) {
  return (Object.entries(plan) as Array<[TrainingKey, number]>)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${TRAINING_LABELS[key]} ${value}`)
    .join(' • ');
}

function ProfileCard({ profile, playerName, position }: { profile: ScenarioGameplayProfile; playerName: string; position: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const content = [
      `${playerName} • ${position}`,
      profile.label,
      planText(profile.training),
      `Habilidades: ${profile.recommendedSkills.join(', ')}`,
      `Objetivo: ${profile.objective}`
    ].join('\n');
    try {
      await navigator.clipboard?.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }
  return <article className={`professional-scenario-card scenario-${profile.id.toLowerCase()}`}>
    <header><div><small>{profile.id}</small><strong>{profile.label}</strong></div><b>{profile.score}</b></header>
    <p>{profile.objective}</p>
    <div className="professional-profile-plan">{planText(profile.training)}</div>
    <div className="professional-profile-chips">{profile.priorities.map((item) => <span key={item}>{item}</span>)}</div>
    <div className="professional-profile-skills">{profile.recommendedSkills.map((skill) => <span key={skill}>{skill}</span>)}</div>
    <small>{profile.tradeOffs[0]}</small>
    <footer><span>{profile.pointsUsed} pts • {profile.exactBudget ? 'orçamento exato' : 'revisar orçamento'}</span><button type="button" onClick={() => void copy()}><ClipboardCopy size={15}/>{copied ? 'Copiado' : 'Copiar ficha'}</button></footer>
  </article>;
}

export function ProfessionalIntelligenceCenter({ result }: { result: AnalysisResult }) {
  const [matches, setMatches] = useState<MatchValidationRecord[]>([]);
  const [registry, setRegistry] = useState<CardRegistryEntry[]>([]);

  useEffect(() => {
    const refresh = () => {
      setMatches(loadArray<MatchValidationRecord>(MATCH_VALIDATION_STORAGE_KEY));
      setRegistry(loadArray<CardRegistryEntry>(CARD_REGISTRY_STORAGE_KEY));
    };
    refresh();
    window.addEventListener('buildmaster:match-validation-updated', refresh);
    return () => window.removeEventListener('buildmaster:match-validation-updated', refresh);
  }, [result.parsed.internalId]);

  const report = useMemo(() => buildProfessionalIntelligenceReport(result, { matches, registry }), [result, matches, registry]);
  const visiblePositions = report.positionMatrix.entries.slice(0, 8);

  return <div className="professional-intelligence-center result-section-grid">
    <article className="luxury-panel wide-card professional-command-card">
      <div className="section-title-row"><div><p className="kicker"><BrainCircuit size={14}/> Central Profissional v37.00</p><h3>Da leitura da carta à comprovação dentro da partida</h3></div><span>{report.activeCapabilities.length} sistemas ativos</span></div>
      <p className="panel-note">Esta central une ficha, posição, habilidades, banco de cartas, partidas reais, vídeo, elenco e aprendizado pessoal. Nenhum dado isolado altera sua ficha automaticamente.</p>
      <div className="professional-capability-grid">{report.activeCapabilities.map((item, index) => <span key={item}><b>{String(index + 1).padStart(2, '0')}</b>{item}</span>)}</div>
      <div className="professional-next-actions">{report.nextActions.map((item, index) => <div key={item}><strong>Próximo passo {index + 1}</strong><span>{item}</span></div>)}</div>
    </article>

    <article className="luxury-panel wide-card professional-evidence-card">
      <div className="section-title-row"><div><p className="kicker"><Activity size={14}/> Motor validado por partidas</p><h3>Evidência real desta carta e posição</h3></div><span>Confiança {report.evidenceLoop.confidence}</span></div>
      <div className="professional-evidence-score"><strong>{report.evidenceLoop.samples}</strong><span>partidas registradas</span></div>
      <p className="panel-note"><b>{report.evidenceLoop.verdict}</b></p>
      {report.evidenceLoop.correction && <div className="professional-correction"><TriangleAlert size={18}/><span>{report.evidenceLoop.correction}</span></div>}
      <div className="professional-evidence-list">{report.evidenceLoop.evidence.map((item) => <span key={item}>{item}</span>)}</div>
      <div className="professional-preserve-list">{report.evidenceLoop.preserve.map((item) => <span key={item}><ShieldCheck size={15}/>{item}</span>)}</div>
    </article>

    <article className="luxury-panel wide-card professional-position-card">
      <div className="section-title-row"><div><p className="kicker"><Target size={14}/> Compatibilidade completa</p><h3>Todas as posições avaliadas com limite real da carta</h3></div><span>{report.positionMatrix.selected.label} {report.positionMatrix.selected.score}%</span></div>
      <p className="panel-note">{report.positionMatrix.summary}</p>
      {report.positionMatrix.warning && <div className="professional-correction"><TriangleAlert size={18}/><span>{report.positionMatrix.warning}</span></div>}
      <div className="professional-position-grid">{visiblePositions.map((entry) => <article key={entry.position} className={`${entry.selected ? 'is-selected' : ''} ${entry.natural ? 'is-natural' : ''}`}>
        <header><strong>{entry.label}</strong><b>{entry.score}%</b></header>
        <span>{entry.level}</span>
        <small>{entry.selected ? 'Posição escolhida' : entry.natural ? 'Posição natural' : entry.permitted ? 'Alternativa permitida' : 'Conversão limitada'}</small>
        <div><i><b style={{ width: `${entry.score}%` }}/></i></div>
        <p>{entry.strengths.slice(0, 2).join(' • ')}</p>
      </article>)}</div>
    </article>

    <article className="luxury-panel wide-card professional-scenarios-card">
      <div className="section-title-row"><div><p className="kicker"><Layers3 size={14}/> Perfis profundos de gameplay</p><h3>Principal, alternativas e contextos de partida</h3></div><span>{report.scenarios.profiles.length} fichas</span></div>
      <p className="panel-note">{report.scenarios.summary}</p>
      <div className="professional-scenario-grid">{report.scenarios.profiles.map((profile) => <ProfileCard key={profile.id} profile={profile} playerName={result.parsed.playerName} position={result.bestPosition.label}/>)}</div>
      <div className="professional-guardrails">{report.scenarios.safeguards.map((item) => <span key={item}><ShieldCheck size={14}/>{item}</span>)}</div>
    </article>

    <article className="luxury-panel wide-card professional-skills-card">
      <div className="section-title-row"><div><p className="kicker"><Sparkles size={14}/> Matriz completa de habilidades</p><h3>Top 5, reservas, obrigatória e opções que não compensam</h3></div><span>{report.skills.officialOnly ? '100% oficial' : 'revisar'}</span></div>
      <p className="panel-note">{report.skills.summary}</p>
      <div className="professional-skill-columns">
        <section><strong>Top 5</strong>{report.skills.topFive.map((item) => <div key={item.name}><b>{item.priority}</b><span><strong>{item.name}</strong><small>{item.classification} • {item.reason}</small></span></div>)}</section>
        <section><strong>Reservas</strong>{report.skills.reserves.map((item) => <div key={item.name}><b>{item.priority}</b><span><strong>{item.name}</strong><small>{item.reason}</small></span></div>)}{!report.skills.reserves.length && <p>Nenhuma reserva segura disponível.</p>}</section>
        <section className="avoid-column"><strong>Não compensa</strong>{report.skills.avoid.map((item) => <div key={item.name}><b>×</b><span><strong>{item.name}</strong><small>{item.reason}</small></span></div>)}{!report.skills.avoid.length && <p>Nenhuma habilidade oficial foi bloqueada.</p>}</section>
      </div>
      <div className="professional-skill-summary"><span><BadgeCheck size={16}/>Obrigatória: <b>{report.skills.mandatory?.name ?? 'não definida'}</b></span><span><Gauge size={16}/>Opcional: <b>{report.skills.optional?.name ?? 'não definida'}</b></span></div>
      {report.skills.synergies.map((item) => <p key={item} className="panel-note">✓ {item}</p>)}
    </article>

    <article className="luxury-panel wide-card professional-learning-card">
      <div className="section-title-row"><div><p className="kicker"><BrainCircuit size={14}/> Aprendizado pessoal</p><h3>O app aprende como você joga sem alterar nada sozinho</h3></div><span>{report.learning.confidence}</span></div>
      <p className="panel-note"><b>{report.learning.identity}</b> • {report.learning.summary}</p>
      <div className="professional-learning-grid">{report.learning.tendencies.map((item) => <article key={item.label}><header><strong>{item.label}</strong><b>{item.score}</b></header><i><b style={{ width: `${item.score}%` }}/></i><small>{item.evidence}</small></article>)}</div>
      {report.learning.recommendations.map((item) => <p key={item} className="panel-note">• {item}</p>)}
    </article>

    <article className="luxury-panel wide-card professional-knowledge-card">
      <div className="section-title-row"><div><p className="kicker"><Database size={14}/> Banco verificado por versão</p><h3>Identidade da carta sem confundir versões diferentes</h3></div><span>{report.cardKnowledge.status}</span></div>
      <div className="professional-knowledge-status">{report.cardKnowledge.exactVersionKnown ? <CheckCircle2 size={22}/> : <Database size={22}/>}<div><strong>{report.cardKnowledge.summary}</strong><span>{report.cardKnowledge.versionsForPlayer} versão(ões) registrada(s) • {report.cardKnowledge.latestVersion}</span><small>Fonte: {report.cardKnowledge.source}</small></div></div>
      <p className="panel-note">O banco local é estruturado e atualizável, mas não chama uma carta de oficial sem fonte confirmada. Prints revisados continuam sendo armazenados por versão e comparados nas próximas leituras.</p>
    </article>
  </div>;
}
