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

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function planText(result: AnalysisResult): string {
  return Object.entries(result.training ?? {})
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${TRAINING_LABELS[key as TrainingKey] ?? key} +${value}`)
    .join(' • ');
}

function statusClass(status: string): string {
  if (status === 'PRONTO' || status === 'APLICAR_COM_SEGURANCA') return 'safe';
  if (status === 'TESTE_RECOMENDADO' || status === 'TESTAR_ANTES_DE_GASTAR') return 'test';
  return 'blocked';
}

function verdictLabel(verdict: string): string {
  if (verdict === 'IDEAL') return 'Encaixe ideal';
  if (verdict === 'FORTE') return 'Encaixe forte';
  if (verdict === 'SITUACIONAL') return 'Adaptação exigente';
  return 'Adaptação fora da posição natural';
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
  const unified = result.unifiedPerformanceV3920;
  if (!unified) return null;
  const adaptive = result.adaptivePositionV3930;
  const functional = result.performanceFunctionV3940;
  const adaptiveMaximum = result.adaptiveMaximumV4030;
  const precision4040 = result.maximumPerformanceV4040;
  const validatedGameplay = result.gameplayValidationMemoryV4050;
  const longitudinalGameplay = result.longitudinalGameplayMemoryV4060;
  const positionFit = unified.positionFit;
  const identity = unified.identity;
  const status = adaptive?.status ?? unified.resourceSafety.status;
  const statusLabel = adaptive?.statusLabel ?? unified.resourceSafety.label;
  const statusClassName = statusClass(status);
  // r45: uma única autoridade visual e funcional. Motores históricos continuam auditáveis, mas não podem substituir a ficha final na tela.
  const appliedTraining = result.training;
  const appliedSkills = safeArray(functional?.finalSkills).length
    ? safeArray(functional?.finalSkills)
    : safeArray(adaptive?.finalSkills).length
      ? safeArray(adaptive?.finalSkills)
      : safeArray(unified.canonicalSkills);
  const displayedSkills = safeArray(result.recommendedSkills).slice(0, 5);
  const impetos = safeArray(functional?.impetos).length ? safeArray(functional?.impetos) : safeArray(adaptive?.impetos).length ? safeArray(adaptive?.impetos) : safeArray(unified.canonicalImpetos);
  const primaryImpeto = result.recommendedImpetos?.[0]?.name ?? functional?.primaryImpeto ?? adaptive?.primaryImpeto ?? unified.primaryImpeto ?? impetos[0]?.name ?? null;
  const conflicts = safeArray(positionFit?.conflicts);
  const traits = safeArray(identity?.traits);
  const deterministicChecks = safeArray(unified.deterministicChecks);
  const evidence = safeArray(identity?.cardEvidence);
  const safetyReasons = safeArray(unified.resourceSafety?.reasons);
  const proStatus = unified.proCompact?.status ?? 'SEM_EVIDENCIA';
  const copySummary = async () => {
    const text = [
      `BuildMaster • ${result.parsed.playerName}`,
      `Identidade: ${identity?.label ?? 'carta individual'}`,
      `Ficha aplicada: ${planText(result)}`,
      `Habilidades: ${displayedSkills.join(', ') || 'revisar'}`,
      `Ímpeto fixo: ${primaryImpeto || 'revisar'}`,
      `Posição escolhida: ${functional?.selectedPositionLabel ?? adaptive?.selectedPositionLabel ?? positionFit?.selectedPositionLabel ?? result.bestPosition.label}`,
      `Função real: ${functional?.roleLabel ?? 'análise da carta'}`,
      `Status: ${statusLabel}`,
      `Assinatura: ${functional?.roleSignature ?? adaptive?.positionSignature ?? unified.lockSignature}`
    ].join('\n');
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  return <article className="luxury-panel wide-card unified-performance-v3920">
    <header className="unified-v3920-head">
      <div>
        <p className="kicker"><BrainCircuit size={15} /> Aprendizado Competitivo por Carta • v40.60</p>
        <h3>DNA + Pareto + gameplay real + estabilidade em várias sessões</h3>
        <p>{longitudinalGameplay?.applied ? `${result.parsed.playerName}: ${longitudinalGameplay.winnerLabel} foi confirmada em ${longitudinalGameplay.sessions} sessões com confiança ${Math.round(longitudinalGameplay.confidenceScore)}/100.` : longitudinalGameplay?.provisionalV4050Blocked ? `${result.parsed.playerName}: a v40.60 encontrou um vencedor provisório, mas a v40.60 manteve a ficha Pareto até existir repetição longitudinal.` : precision4040?.summary ?? adaptiveMaximum?.summary ?? functional?.summary ?? adaptive?.summary ?? unified.summary}</p>
        <small>Motor determinístico: compara centenas de distribuições com orçamento idêntico, mantém o DNA e não usa GER como alvo. Versões futuras do eFootball não recebem pesos antes de validação.</small>
      </div>
      <span className={`unified-v3920-safety ${statusClassName}`}>
        {statusClassName === 'safe' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
        {statusLabel}
      </span>
    </header>

    <section className="unified-v3920-actionbar">
      <button type="button" className="result-action-primary" onClick={onSave} disabled={!onSave}><Save size={16} /> Salvar ficha</button>
      <button type="button" onClick={onShare}><Share2 size={16} /> Compartilhar</button>
      <button type="button" onClick={onExportImage}><Download size={16} /> Exportar imagem</button>
      <button type="button" onClick={() => void copySummary()}><Copy size={16} /> Copiar resumo</button>
    </section>

    <section className={`unified-v3920-resource-gate ${statusClassName}`}>
      <div>{statusClassName === 'safe' ? <CheckCircle2 size={26} /> : <LockKeyhole size={26} />}</div>
      <span>
        <strong>{statusLabel}</strong>
        <small>{adaptive
          ? adaptive.status === 'REVISAR_LEITURA'
            ? 'Confirme os campos do print. O bloqueio é da leitura, não da posição escolhida.'
            : functional?.recommendedUse ?? 'A posição não bloqueia a ficha. O motor adapta o necessário e preserva o Ímpeto da carta.'
          : unified.resourceSafety.nextAction}</small>
      </span>
      <em>{adaptive?.deterministic ? 'Receita repetível' : unified.resourceSafety.recipeLocked ? 'Receita travada' : 'Revisar'}</em>
    </section>

    <section className="unified-v3920-grid">
      <article>
        <div className="unified-v3920-card-title"><Sparkles size={17} /><span><strong>Identidade da carta</strong><small>O núcleo que nunca é apagado pela posição</small></span></div>
        <h4>{identity?.label ?? 'Perfil individual da carta'}</h4>
        <p>{identity?.realLifeModel ?? 'A carta é tratada pelos próprios atributos, estilo e habilidades.'}</p>
        <div className="chip-cloud">{traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
        <small>Confiança {Math.round(Number(identity?.confidence ?? 0))}% • {identity?.primaryArchetype ?? 'DNA principal'} + {identity?.secondaryArchetype ?? 'apoio'}</small>
      </article>

      <article>
        <div className="unified-v3920-card-title"><Target size={17} /><span><strong>Adaptação para a posição escolhida</strong><small>Sem proibir jogador fora da posição natural</small></span></div>
        <h4>{functional?.selectedPositionLabel ?? adaptive?.selectedPositionLabel ?? positionFit?.selectedPositionLabel ?? result.bestPosition.label} • {functional?.roleLabel ?? (adaptive ? `${Math.round(adaptive.positionFit)}/100` : verdictLabel(positionFit?.verdict ?? ''))}</h4>
        <div className="unified-v3920-metrics">
          <span><b>{Math.round(Number(functional?.corePreservation ?? adaptive?.corePreservation ?? positionFit?.identityFit ?? 0))}</b><small>DNA preservado</small></span>
          <span><b>{functional?.candidateCount ?? adaptive?.changes.length ?? 0}</b><small>fichas comparadas</small></span>
          <span><b>{positionFit?.playstyleActive ? 'Ativo' : 'Neutro'}</b><small>estilo na posição</small></span>
        </div>
        <p>{functional?.roleDescription ?? (adaptive
          ? adaptive.adaptationApplied
            ? 'A ficha foi ajustada dentro de um limite seguro. Ela não é uma cópia genérica da posição.'
            : 'A ficha-base já era a melhor opção dentro do limite seguro, por isso o motor não forçou mudanças artificiais.'
          : positionFit?.recommendedUse)}</p>
        {functional && <div className="unified-v3920-metrics">
          <span><b>{Math.round(functional.responseScoreBefore)}→{Math.round(functional.responseScoreAfter)}</b><small>resposta funcional</small></span>
          <span><b>{Math.round(functional.stabilityScore)}</b><small>estabilidade</small></span>
          <span><b>{functional.useLevel}</b><small>nível de uso</small></span>
        </div>}
        {precision4040 && <div className="unified-v3920-metrics">
          <span><b>{Math.round(precision4040.contextScores.ranked)}</b><small>ranqueada</small></span>
          <span><b>{Math.round(precision4040.responseScore)}</b><small>resposta funcional</small></span>
          <span><b>{Math.round(precision4040.confidence.score)}</b><small>confiança {precision4040.confidence.level.toLowerCase()}</small></span>
        </div>}
        {precision4040 && <div className="chip-cloud">
          <span>{precision4040.candidatesEvaluated} candidatas</span>
          <span>{precision4040.paretoCandidates} Pareto</span>
          <span>DNA {Math.round(precision4040.dnaPreservation)}</span>
          <span>Eficiência {Math.round(precision4040.efficiencyScore)}</span>
        </div>}
        {adaptiveMaximum && <div className="unified-v3920-metrics">
          <span><b>{Math.round(adaptiveMaximum.contextScores.ranked)}</b><small>robustez ranqueada</small></span>
          <span><b>{Math.round(adaptiveMaximum.contextScores.events)}</b><small>eventos</small></span>
          <span><b>{Math.round(adaptiveMaximum.contextScores.friends)}</b><small>contra amigos</small></span>
        </div>}
        {adaptiveMaximum && <div className="chip-cloud">{adaptiveMaximum.profiles.map((profile) => <span key={profile.id}>{profile.rank}. {profile.label} · {Math.round(profile.score)}</span>)}</div>}
        {(functional?.changes.length ?? adaptive?.changes.length) ? <div className="unified-v3920-alerts">{(functional?.changes ?? adaptive?.changes ?? []).map((change) => <span key={change.key}>{change.label}: {change.from} → {change.to}</span>)}</div> : null}
        {conflicts.length > 0 && <details><summary>Ver comportamento tático</summary><div className="unified-v3920-alerts">{conflicts.slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div></details>}
      </article>

      <article className="unified-v3920-build">
        <div className="unified-v3920-card-title"><Trophy size={17} /><span><strong>Ficha aplicada</strong><small>Núcleo da carta + adaptação controlada</small></span></div>
        <div className="unified-v3920-training-grid">
          {Object.entries(appliedTraining ?? {}).filter(([, value]) => Number(value) > 0).map(([key, value]) => <div key={key}><span>{TRAINING_LABELS[key as TrainingKey] ?? key}</span><strong>+{value}</strong></div>)}
        </div>
        <p><LockKeyhole size={14} /> {result.finalCardAuthorityV4080R45 ? `final-r45 • físico ${result.finalCardAuthorityV4080R45.physicalSignalsUsed}` : (functional?.roleSignature ?? adaptive?.positionSignature ?? unified.lockSignature)}</p>
        {unified.recipeMemory?.note && <small className={`unified-v3920-memory ${String(unified.recipeMemory.status ?? 'NOVA').toLowerCase()}`}>{unified.recipeMemory.note}</small>}
        {longitudinalGameplay?.applied && <details open><summary>Ver aprendizado longitudinal v40.60</summary><p>{longitudinalGameplay.winnerLabel} foi promovida somente depois de repetir vantagem em várias sessões. A memória continua válida apenas enquanto a mesma alternativa e distribuição existirem no Pareto atual.</p><small>{longitudinalGameplay.sessions} sessões • {longitudinalGameplay.pairedSessions} pareadas • confiança {Math.round(longitudinalGameplay.confidenceScore)}/100 • verificada em {longitudinalGameplay.verifiedAt ? new Date(longitudinalGameplay.verifiedAt).toLocaleDateString('pt-BR') : '—'}</small></details>}
        {validatedGameplay?.applied && !longitudinalGameplay?.applied && <details><summary>Ver evidência provisória v40.60</summary><p>{validatedGameplay.winnerLabel} venceu o A/B da v40.60, mas a v40.60 ainda exige repetição em sessões distintas antes de aplicar essa memória como ficha permanente.</p></details>}
        {precision4040 && <details><summary>Ver decisão da Precisão Competitiva 99</summary><p>{precision4040.reasons.join(' ')}</p><small>{precision4040.candidatesEvaluated} candidatas • {precision4040.paretoCandidates} na fronteira de Pareto • orçamento exato: {precision4040.exactBudget ? 'sim' : 'revisar'} • confiança {Math.round(precision4040.confidence.score)}/100 • meta base v{precision4040.metaRuntime.stableVersion}</small><div className="chip-cloud">{precision4040.alternatives.map((item) => <span key={item.id}>{item.label} · {Math.round(item.score)}</span>)}</div></details>}
        {adaptiveMaximum && <details><summary>Ver decisão do Desempenho Máximo</summary><p>{adaptiveMaximum.reasons.join(' ')}</p><small>{adaptiveMaximum.candidatesEvaluated} candidatas • robustez média {Math.round(adaptiveMaximum.contextScores.average)}/100 • orçamento exato: {adaptiveMaximum.exactBudget ? 'sim' : 'revisar'} • meta base v{adaptiveMaximum.metaRuntime.stableVersion}</small></details>}
        {functional && <details><summary>Ver decisão da função real</summary><p>{functional.recommendedUse}</p><small>{functional.candidateCount} candidatas • resposta {Math.round(functional.responseScoreAfter)}/100 • orçamento exato: {functional.exactBudget ? 'sim' : 'revisar'}</small></details>}
        {!functional && adaptive && <details><summary>Ver núcleo fixo da carta</summary><p>Assinatura: {adaptive.coreSignature}</p><small>Preservação {Math.round(adaptive.corePreservation)}% • orçamento exato: {adaptive.exactBudget ? 'sim' : 'revisar'}</small></details>}
      </article>

      <article>
        <div className="unified-v3920-card-title"><Sparkles size={17} /><span><strong>Habilidades adicionais</strong><small>Top 5 complementar, sem duplicar habilidades já possuídas</small></span></div>
        <div className="unified-v3920-skill-list">
          {displayedSkills.map((skill, index) => <button type="button" key={skill} className={skillProgress?.[skill] ? 'done' : ''} onClick={() => onSkillToggle?.(skill)}><b>{index + 1}</b><span><strong>{skill}</strong><small>{appliedSkills.find((item) => item.name === skill)?.gameplayImpact ?? 'Complementa a carta sem copiar um molde genérico.'}</small></span><em>{skillProgress?.[skill] ? '✓' : '○'}</em></button>)}
        </div>
        {precision4040 && <small>{precision4040.skillPlan.slotsFilled}/5 slots preenchidos • {precision4040.skillPlan.duplicatesBlocked} duplicações bloqueadas • nomes somente do catálogo reconhecido pelo app.</small>}
      </article>

      <article className={`unified-v3920-impeto ${statusClassName}`}>
        <div className="unified-v3920-card-title"><BrainCircuit size={17} /><span><strong>Ímpeto fixo da carta</strong><small>Não muda quando você troca a posição</small></span></div>
        <h4>{primaryImpeto || 'Revisar leitura'}</h4>
        <p>{impetos[0]?.reason ?? 'A recomendação é presa à identidade da versão exata da carta.'}</p>
        <div className="chip-cloud purple">{safeArray(impetos[0]?.attributes).map((attribute) => <span key={attribute}>{attribute}</span>)}</div>
        <strong className="unified-v3920-spend-lock">{adaptive?.canUseImpeto === false ? 'Confirme a leitura antes de gastar' : 'Mesmo Ímpeto em todas as posições'}</strong>
      </article>

      <article>
        <div className="unified-v3920-card-title"><Trophy size={17} /><span><strong>Benchmark Pro Global</strong><small>Referência compacta, nunca cópia cega</small></span></div>
        <h4>{String(proStatus).replaceAll('_', ' ')}</h4>
        <p>{unified.proCompact?.label ?? 'Sem referência profissional exata para esta versão da carta.'}</p>
        <div className="unified-v3920-metrics">
          <span><b>{Number(unified.proCompact?.exactReferences ?? 0)}</b><small>fontes exatas</small></span>
          <span><b>{Number(unified.proCompact?.fullBuildReferences ?? 0)}</b><small>fichas completas</small></span>
          <span><b>{Number(unified.proCompact?.confidence ?? 0)}%</b><small>confiança</small></span>
        </div>
      </article>
    </section>

    <details className="unified-v3920-details">
      <summary>Ver auditoria técnica sem abrir outras abas</summary>
      <section>
        <div><h4>Repetibilidade</h4>{safeArray(functional?.reasons).map((item) => <p key={item}>• {item}</p>)}{!functional && safeArray(adaptive?.reasons).map((item) => <p key={item}>• {item}</p>)}{!adaptive && deterministicChecks.map((item) => <p key={item}>• {item}</p>)}</div>
        <div><h4>Alertas</h4>{safeArray(functional?.tacticalWarnings).map((item) => <p key={item}>• {item}</p>)}{!functional && safeArray(adaptive?.warnings).map((item) => <p key={item}>• {item}</p>)}{!adaptive && safetyReasons.map((item) => <p key={item}>• {item}</p>)}</div>
        <div><h4>Evidências da identidade</h4>{evidence.map((item) => <p key={item}>• {item}</p>)}</div>
      </section>
    </details>
  </article>;
}
