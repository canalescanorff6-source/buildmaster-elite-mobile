'use client';

import {
  BrainCircuit,
  CheckCircle2,
  Copy,
  Download,
  LockKeyhole,
  Save,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy
} from 'lucide-react';
import type { AnalysisResult, TrainingKey } from '@/lib/analyzerDomain';
import { TRAINING_LABELS } from '@/lib/trainingEngine';

function planText(result: AnalysisResult): string {
  return Object.entries(result.training)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${TRAINING_LABELS[key as TrainingKey]} +${value}`)
    .join(' • ');
}

function safetyClass(status: string): string {
  if (status === 'APLICAR_COM_SEGURANCA') return 'safe';
  if (status === 'TESTAR_ANTES_DE_GASTAR') return 'test';
  return 'blocked';
}

function verdictLabel(verdict: string): string {
  if (verdict === 'IDEAL') return 'Encaixe ideal';
  if (verdict === 'FORTE') return 'Encaixe forte';
  if (verdict === 'SITUACIONAL') return 'Uso situacional';
  return 'Encaixe incompatível';
}

export function UnifiedPerformanceV3920Panel({
  result,
  onSave,
  onShare,
  onExportImage,
  onSkillToggle,
  skillProgress
}: {
  result: AnalysisResult;
  onSave?: () => void;
  onShare?: () => void;
  onExportImage?: () => void;
  onSkillToggle?: (skill: string) => void;
  skillProgress?: Record<string, boolean>;
}) {
  const analysis = result.unifiedPerformanceV3920;
  if (!analysis) return null;
  const safety = analysis.resourceSafety;
  const statusClass = safetyClass(safety.status);
  const copySummary = async () => {
    const text = [
      `BuildMaster • ${result.parsed.playerName}`,
      `Identidade: ${analysis.identity.label}`,
      `Ficha: ${planText(result)}`,
      `Habilidades: ${result.recommendedSkills.join(', ') || 'revisar'}`,
      `Ímpeto: ${analysis.primaryImpeto || 'revisar'}`,
      `Posição testada: ${analysis.positionFit.selectedPositionLabel} • ${verdictLabel(analysis.positionFit.verdict)}`,
      `Segurança: ${safety.label}`,
      `Assinatura: ${analysis.lockSignature}`
    ].join('\n');
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  return <article className="luxury-panel wide-card unified-performance-v3920">
    <header className="unified-v3920-head">
      <div>
        <p className="kicker"><BrainCircuit size={15} /> Motor Unificado de Desempenho v39.20</p>
        <h3>Uma ficha definitiva, uma tela e proteção contra gasto errado</h3>
        <p>{analysis.summary}</p>
      </div>
      <span className={`unified-v3920-safety ${statusClass}`}>
        {safety.status === 'APLICAR_COM_SEGURANCA' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
        {safety.label}
      </span>
    </header>

    <section className="unified-v3920-actionbar">
      <button type="button" className="result-action-primary" onClick={onSave} disabled={!onSave}><Save size={16} /> Salvar ficha</button>
      <button type="button" onClick={onShare}><Share2 size={16} /> Compartilhar</button>
      <button type="button" onClick={onExportImage}><Download size={16} /> Exportar imagem</button>
      <button type="button" onClick={() => void copySummary()}><Copy size={16} /> Copiar resumo</button>
    </section>

    <section className={`unified-v3920-resource-gate ${statusClass}`}>
      <div>{safety.status === 'APLICAR_COM_SEGURANCA' ? <CheckCircle2 size={26} /> : <LockKeyhole size={26} />}</div>
      <span><strong>{safety.label}</strong><small>{safety.nextAction}</small></span>
      <em>{safety.minimumTestMatches ? `${safety.minimumTestMatches} partidas antes do Ímpeto` : 'Receita liberada'}</em>
    </section>

    <section className="unified-v3920-grid">
      <article>
        <div className="unified-v3920-card-title"><Sparkles size={17} /><span><strong>Identidade da carta</strong><small>{analysis.identity.source === 'CURADORIA_E_CARTA' ? 'Nome + versão exata da carta' : 'Inferida pela própria carta'}</small></span></div>
        <h4>{analysis.identity.label}</h4>
        <p>{analysis.identity.realLifeModel}</p>
        <div className="chip-cloud">{analysis.identity.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
        <small>Confiança {Math.round(analysis.identity.confidence)}% • {analysis.identity.primaryArchetype} + {analysis.identity.secondaryArchetype}</small>
      </article>

      <article>
        <div className="unified-v3920-card-title"><Target size={17} /><span><strong>Encaixe na posição escolhida</strong><small>Diagnóstico separado da ficha</small></span></div>
        <h4>{analysis.positionFit.selectedPositionLabel} • {verdictLabel(analysis.positionFit.verdict)}</h4>
        <div className="unified-v3920-metrics">
          <span><b>{Math.round(analysis.positionFit.compatibility)}</b><small>compatibilidade</small></span>
          <span><b>{Math.round(analysis.positionFit.structuralFit)}</b><small>estabilidade tática</small></span>
          <span><b>{analysis.positionFit.playstyleActive ? 'Ativo' : 'Neutro'}</b><small>estilo na posição</small></span>
        </div>
        <p>{analysis.positionFit.recommendedUse}</p>
        {analysis.positionFit.conflicts.length > 0 && <div className="unified-v3920-alerts">{analysis.positionFit.conflicts.slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div>}
      </article>

      <article className="unified-v3920-build">
        <div className="unified-v3920-card-title"><Trophy size={17} /><span><strong>Ficha definitiva</strong><small>Não muda quando você troca a posição</small></span></div>
        <div className="unified-v3920-training-grid">
          {Object.entries(analysis.canonicalTraining).filter(([, value]) => Number(value) > 0).map(([key, value]) => <div key={key}><span>{TRAINING_LABELS[key as TrainingKey]}</span><strong>+{value}</strong></div>)}
        </div>
        <p><LockKeyhole size={14} /> {analysis.lockSignature}</p>
        {analysis.recipeMemory && <small className={`unified-v3920-memory ${analysis.recipeMemory.status.toLowerCase()}`}>{analysis.recipeMemory.note}</small>}
        {analysis.microAdaptation.available && <details><summary>Microadaptação opcional para {analysis.positionFit.selectedPositionLabel}</summary><p>{analysis.microAdaptation.note}</p>{analysis.microAdaptation.changes.map((change) => <small key={change.key}>{change.label}: {change.from} → {change.to}</small>)}</details>}
      </article>

      <article>
        <div className="unified-v3920-card-title"><Sparkles size={17} /><span><strong>Habilidades adicionais</strong><small>Top definitivo da identidade da carta</small></span></div>
        <div className="unified-v3920-skill-list">
          {result.recommendedSkills.slice(0, 5).map((skill, index) => <button type="button" key={skill} className={skillProgress?.[skill] ? 'done' : ''} onClick={() => onSkillToggle?.(skill)}><b>{index + 1}</b><span><strong>{skill}</strong><small>{analysis.canonicalSkills.find((item) => item.name === skill)?.gameplayImpact ?? 'Complementa a carta sem copiar um molde de posição.'}</small></span><em>{skillProgress?.[skill] ? '✓' : '○'}</em></button>)}
        </div>
      </article>

      <article className={`unified-v3920-impeto ${statusClass}`}>
        <div className="unified-v3920-card-title"><BrainCircuit size={17} /><span><strong>Ímpeto definitivo</strong><small>Travado pela mesma assinatura da ficha</small></span></div>
        <h4>{analysis.primaryImpeto || 'Revisar leitura'}</h4>
        <p>{analysis.canonicalImpetos[0]?.reason ?? 'O motor ainda não possui evidência suficiente para recomendar gasto.'}</p>
        <div className="chip-cloud purple">{analysis.canonicalImpetos[0]?.attributes.map((attribute) => <span key={attribute}>{attribute}</span>)}</div>
        <strong className="unified-v3920-spend-lock">{safety.canSpendImpeto ? 'Liberado para aplicar' : 'Bloqueado para evitar perda de giro'}</strong>
      </article>

      <article>
        <div className="unified-v3920-card-title"><Trophy size={17} /><span><strong>Benchmark Pro Global</strong><small>Compacto e sem copiar cegamente</small></span></div>
        <h4>{analysis.proCompact.status.replaceAll('_', ' ')}</h4>
        <p>{analysis.proCompact.label}</p>
        <div className="unified-v3920-metrics">
          <span><b>{analysis.proCompact.exactReferences}</b><small>fontes exatas</small></span>
          <span><b>{analysis.proCompact.fullBuildReferences}</b><small>fichas completas</small></span>
          <span><b>{analysis.proCompact.confidence}%</b><small>confiança</small></span>
        </div>
      </article>
    </section>

    <details className="unified-v3920-details">
      <summary>Ver auditoria técnica sem abrir outras abas</summary>
      <section>
        <div><h4>Por que a receita não muda</h4>{analysis.deterministicChecks.map((item) => <p key={item}>• {item}</p>)}</div>
        <div><h4>Segurança antes de gastar</h4>{safety.reasons.map((item) => <p key={item}>• {item}</p>)}</div>
        <div><h4>Evidências da identidade</h4>{analysis.identity.cardEvidence.map((item) => <p key={item}>• {item}</p>)}</div>
      </section>
    </details>
  </article>;
}
