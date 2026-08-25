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
import type { FinalDecisionAuthority2027R118 } from '@/lib/finalDecisionAuthority2027V4080R118';
import type { CleanSlate2027R119 } from '@/lib/cleanSlatePerformance2027V4080R119';
import { TRAINING_LABELS } from '@/lib/trainingEngine';
import { OFFICIAL_ADDITIONAL_SKILL_DESCRIPTIONS } from '@/modules/analysis/analyzerCatalog';
import {
  GOALKEEPER_PROGRESS_ORDER_R106,
  TRAINING_PROGRESS_ORDER_R106,
  TrainingProgressionIconR106,
  type TrainingProgressionKeyR106
} from '@/components/result/TrainingProgressionIconR106';

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

function skillVisualKind(skill: string): 'dribble' | 'finishing' | 'passing' | 'defense' | 'mental' | 'goalkeeper' | 'aerial' {
  const normalized = skill.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/goleiro|pegador de penalti/.test(normalized)) return 'goalkeeper';
  if (/marcacao|interceptacao|bloqueador|carrinho|afastamento|volta para marcar/.test(normalized)) return 'defense';
  if (/cabecada|superioridade aerea/.test(normalized)) return 'aerial';
  if (/passe|cruzamento|calcanhar|de letra|sem olhar/.test(normalized)) return 'passing';
  if (/chute|finalizacao|efeito|cavadinha|folha seca|precisao|penalti/.test(normalized)) return 'finishing';
  if (/lideranca|substituto|espirito guerreiro|malicia/.test(normalized)) return 'mental';
  return 'dribble';
}

function SkillVisualGlyph({ skill }: { skill: string }) {
  const kind = skillVisualKind(skill);
  const Icon = kind === 'finishing'
    ? Target
    : kind === 'passing'
      ? Share2
      : kind === 'defense'
        ? ShieldCheck
        : kind === 'mental' || kind === 'aerial'
          ? Trophy
          : kind === 'goalkeeper'
            ? BrainCircuit
            : Sparkles;
  return <span className={`r119-skill-glyph ${kind}`} aria-hidden="true"><Icon size={18} /></span>;
}

function skillDescription(skill: string): string {
  return (OFFICIAL_ADDITIONAL_SKILL_DESCRIPTIONS as Record<string, string>)[skill] ?? 'Habilidade adicional oficial escolhida pelo DNA funcional desta carta.';
}

function impetoVisualStatus(decision: CleanSlate2027R119['impetoDecision']) {
  if (decision === 'KEEP_CURRENT') return { className: 'safe', label: 'Manter o atual' };
  if (decision === 'RECOMMEND_NEW') return { className: 'safe', label: 'Aplicar — vaga confirmada' };
  if (decision === 'REVIEW_SLOT') return { className: 'test', label: 'Confirmar vaga antes de gastar' };
  if (decision === 'SLOT_NOT_AVAILABLE') return { className: 'blocked', label: 'Sem vaga — não aplicar' };
  return { className: 'blocked', label: 'Nenhum candidato seguro' };
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
  const cleanSlate = (result as AnalysisResult & { cleanSlate2027R119?: CleanSlate2027R119 }).cleanSlate2027R119;
  if (cleanSlate) {
    const displayedSkills = safeArray(result.recommendedSkills).slice(0, 5);
    const primaryImpeto = result.recommendedImpetos?.[0]?.name ?? null;
    const attributeCount = Number(result.parsed.evidence?.attributeCount ?? Object.keys(result.parsed.attributes ?? {}).length);
    const positionRatingsCount = Number(result.parsed.evidence?.positionRatingsCount ?? Object.keys(result.parsed.positionRatings ?? {}).length);
    const progressionOrder = result.parsed.mainPosition === 'GK' ? GOALKEEPER_PROGRESS_ORDER_R106 : TRAINING_PROGRESS_ORDER_R106;
    const activeTraining = progressionOrder
      .map((key) => ({ key, value: Number(result.training?.[key] ?? 0) }))
      .filter((item) => item.value > 0);
    const impetoStatus = impetoVisualStatus(cleanSlate.impetoDecision);
    const impetoName = cleanSlate.currentImpeto ?? primaryImpeto ?? cleanSlate.impetoIdeal;
    return <article className="luxury-panel wide-card unified-performance-v3920">
      <header className="unified-v3920-head">
        <div>
          <p className="kicker"><BrainCircuit size={15} /> Clean Slate • r119</p>
          <h3>Ficha recalculada do zero pela identidade da carta</h3>
          <p>{result.parsed.playerName}: o motor avaliou {cleanSlate.candidateCount} estados e escolheu a distribuição com maior retorno funcional para as ações naturais desta carta.</p>
          <small>Motores históricos não participam do caminho crítico do Android e não podem semear a ficha final.</small>
        </div>
        <span className={`unified-v3920-safety ${cleanSlate.status === 'READY' ? 'safe' : 'blocked'}`}>
          {cleanSlate.status === 'READY' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          {cleanSlate.status === 'READY' ? 'Clean Slate pronto' : 'Leitura insuficiente'}
        </span>
      </header>
      <section className="unified-v3920-actionbar">
        <button type="button" className="result-action-primary" onClick={onSave} disabled={!onSave}><Save size={16} /> Salvar ficha</button>
        <button type="button" onClick={onShare}><Share2 size={16} /> Compartilhar</button>
        <button type="button" onClick={onExportImage}><Download size={16} /> Exportar imagem</button>
      </section>
      <section className="unified-v3920-grid">
        <article className="r119-final-build">
          <div className="unified-v3920-card-title"><Target size={17} /><span><strong>Ficha final</strong><small>Único escritor: Clean Slate r119</small></span></div>
          {activeTraining.length ? <div className="r119-training-icons">
            {activeTraining.map(({ key, value }) => <div key={key} className="r119-training-item">
              <span className="r119-training-icon"><TrainingProgressionIconR106 trainingKey={key as TrainingProgressionKeyR106} title={TRAINING_LABELS[key as TrainingKey] ?? key} size={31} /></span>
              <span><small>{TRAINING_LABELS[key as TrainingKey] ?? key}</small><strong>+{value}</strong></span>
            </div>)}
          </div> : <h4>Aguardando leitura completa</h4>}
          <small className="r119-training-summary">{planText(result) || 'Nenhum ponto aplicado.'}</small>
          <div className="unified-v3920-metrics">
            <span><b>{Math.round(cleanSlate.responseScore)}</b><small>resposta</small></span>
            <span><b>{Math.round(cleanSlate.synergyScore)}</b><small>sinergia</small></span>
            <span><b>{Math.round(cleanSlate.confidence)}</b><small>confiança</small></span>
          </div>
          {cleanSlate.status !== 'READY' && <p><strong>Atributos lidos: {attributeCount}/26.</strong> Posições reconhecidas: {positionRatingsCount}/13. O motor não inventa os valores ausentes; revise a leitura quando a cobertura estiver baixa.</p>}
          <div className="chip-cloud">
            <span>Motor final: Clean Slate r119</span>
            {cleanSlate.dominantDna.map((dna) => <span key={dna}>{dna}</span>)}
          </div>
        </article>
        <article className="r119-resources-card">
          <div className="unified-v3920-card-title"><Sparkles size={17} /><span><strong>5 habilidades adicionais</strong><small>Oficiais, complementares e sem repetir habilidade já existente</small></span></div>
          <div className="r119-skill-list">
            {displayedSkills.map((skill, index) => <div key={skill} className="r119-skill-row">
              <SkillVisualGlyph skill={skill} />
              <span><small>ADICIONAL {index + 1}</small><strong>{skill}</strong><em>{skillDescription(skill)}</em></span>
            </div>)}
            {!displayedSkills.length && <p>Nenhuma habilidade adicional segura disponível com a leitura atual.</p>}
          </div>
          <div className={`r119-impeto-card ${impetoStatus.className}`}>
            <div className="r119-impeto-head"><Trophy size={19} /><span><small>ÍMPETO</small><strong>{impetoName ?? 'Nenhum candidato seguro'}</strong></span></div>
            <span className="r119-impeto-status">{impetoStatus.label}</span>
            {cleanSlate.impetoIdeal && !cleanSlate.currentImpeto && <div className="r119-impeto-metrics"><span>encaixe <b>{Math.round(cleanSlate.impetoIdealScore)}</b></span><span>confiança <b>{Math.round(cleanSlate.impetoIdealConfidence)}</b></span></div>}
            <p>{cleanSlate.impetoReason}</p>
          </div>
        </article>
        <article className="r119-actions-card">
          <div className="unified-v3920-card-title"><Trophy size={17} /><span><strong>Ações decisivas</strong><small>Prioridade funcional estimada — capacidade não é tratada automaticamente como frequência</small></span></div>
          <div className="chip-cloud">{cleanSlate.actions.slice(0, 6).map((action) => <span key={action.id}>{action.label} {Math.round(action.frequency)}%</span>)}</div>
          <small>{cleanSlate.reasons[2] ?? cleanSlate.reasons[1]}</small>
        </article>
      </section>
    </article>;
  }
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
  const finalAuthority = (result as AnalysisResult & { finalDecisionAuthority2027R118?: FinalDecisionAuthority2027R118 }).finalDecisionAuthority2027R118;
  // r118: a tela lê somente a decisão selada. Métricas históricas permanecem auditáveis nos detalhes.
  const appliedTraining = result.training;
  const appliedSkills = safeArray(functional?.finalSkills).length
    ? safeArray(functional?.finalSkills)
    : safeArray(adaptive?.finalSkills).length
      ? safeArray(adaptive?.finalSkills)
      : safeArray(unified.canonicalSkills);
  const displayedSkills = safeArray(result.recommendedSkills).slice(0, 5);
  const impetos = safeArray(result.recommendedImpetos);
  const currentImpeto = finalAuthority?.currentImpeto ?? null;
  const primaryImpeto = result.recommendedImpetos?.[0]?.name ?? null;
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
      `Ímpeto: ${currentImpeto ? `manter ${currentImpeto}` : primaryImpeto || 'nenhum seguro'}`,
      `Posição escolhida: ${functional?.selectedPositionLabel ?? adaptive?.selectedPositionLabel ?? positionFit?.selectedPositionLabel ?? result.bestPosition.label}`,
      `Função real: ${functional?.roleLabel ?? 'análise da carta'}`,
      `Status: ${statusLabel}`,
      `Motor final: ${finalAuthority?.finalEngineLabel ?? 'em revisão'}`
    ].join('\n');
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  return <article className="luxury-panel wide-card unified-performance-v3920">
    <header className="unified-v3920-head">
      <div>
        <p className="kicker"><BrainCircuit size={15} /> Autoridade Única por Carta • r119</p>
        <h3>Clean Slate decide; motores históricos apenas auditam</h3>
        <p>{longitudinalGameplay?.applied ? `${result.parsed.playerName}: ${longitudinalGameplay.winnerLabel} foi confirmada em ${longitudinalGameplay.sessions} sessões com confiança ${Math.round(longitudinalGameplay.confidenceScore)}/100.` : longitudinalGameplay?.provisionalV4050Blocked ? `${result.parsed.playerName}: a v40.60 encontrou um vencedor provisório, mas a v40.60 manteve a ficha Pareto até existir repetição longitudinal.` : precision4040?.summary ?? adaptiveMaximum?.summary ?? functional?.summary ?? adaptive?.summary ?? unified.summary}</p>
        <small>Um único escritor final sela ficha, Top 5 e Ímpeto. Pareto, v39/v40, r70, r107 e r109 continuam disponíveis somente como diagnóstico.</small>
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
        {finalAuthority && <div className="unified-v3920-metrics">
          <span><b>{Math.round(Number(finalAuthority.responseScore ?? 0))}</b><small>resposta Card Signature</small></span>
          <span><b>{Math.round(Number(finalAuthority.synergyScore ?? 0))}</b><small>sinergia</small></span>
          <span><b>{Math.round(finalAuthority.confidence)}</b><small>confiança final</small></span>
        </div>}
        {finalAuthority && <div className="chip-cloud">
          <span>Motor final: {finalAuthority.finalEngineLabel}</span>
          <span>DNA {finalAuthority.dominantDna.join(' + ') || 'em revisão'}</span>
          <span>{finalAuthority.specialSkills.length ? `Especial: ${finalAuthority.specialSkills.join(', ')}` : 'Sem especial confirmada'}</span>
          <span>Legado: somente leitura</span>
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
        <p><LockKeyhole size={14} /> {finalAuthority ? `Motor final: ${finalAuthority.finalEngineLabel} • ${finalAuthority.trainingSource === 'CARD_SIGNATURE_R115' ? 'Card Signature' : 'fallback de emergência'}` : 'Autoridade final em revisão'}</p>
        {finalAuthority?.fallbackReason && <small className="unified-v3920-memory">{finalAuthority.fallbackReason}</small>}
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
        <small>Autoridade r80 • {displayedSkills.length}/5 slots finais • a tela não usa mais Top 5 de motores anteriores.</small>
      </article>

      <article className={`unified-v3920-impeto ${statusClassName}`}>
        <div className="unified-v3920-card-title"><BrainCircuit size={17} /><span><strong>Ímpeto da carta</strong><small>Recurso permanente decidido pelo r80, independente da posição</small></span></div>
        <h4>{currentImpeto ? `Manter ${currentImpeto}` : primaryImpeto || 'Nenhum Ímpeto seguro'}</h4>
        <p>{currentImpeto
          ? 'Este Ímpeto já está aplicado na carta. O r80 o preserva e bloqueia sua repetição como nova recomendação.'
          : impetos[0]?.reason ?? 'O r80 não aprovou gasto seguro para esta carta; nenhum Ímpeto antigo será mostrado como fallback.'}</p>
        <div className="chip-cloud purple">{safeArray(impetos[0]?.attributes).map((attribute) => <span key={attribute}>{attribute}</span>)}</div>
        <strong className="unified-v3920-spend-lock">{currentImpeto ? 'Ímpeto atual preservado • não gastar para repetir' : primaryImpeto ? 'Ímpeto aprovado pelo r80 para a carta' : 'Não gastar Ímpeto até existir aprovação segura'}</strong>
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
