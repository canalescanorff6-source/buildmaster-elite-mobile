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
import { OfficialSkillIconR119 } from '@/components/result/OfficialSkillIconR119';
import { buildSkillWorkflowStateR121 } from '@/modules/vault/skillWorkflowR121';

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


function SkillWorkflowR121({
  skills,
  progress,
  description,
  onToggle,
  onReplaceOwned
}: {
  skills: string[];
  progress?: Record<string, boolean>;
  description: (skill: string) => string;
  onToggle?: (skill: string) => void;
  onReplaceOwned?: (skill: string) => void;
}) {
  const workflow = buildSkillWorkflowStateR121(skills, progress);
  const { pending, completed, total, done, remaining, percent } = workflow;

  return <div className="r121-skill-workflow">
    <div className="r121-skill-progress-head">
      <span><strong>{done}/{total || 5} adicionadas</strong><small>{remaining ? `Faltam ${remaining}` : total ? 'Top 5 concluído' : 'Aguardando recomendações'}</small></span>
      <b>{percent}%</b>
    </div>
    <div className="r121-skill-progress-track" role="progressbar" aria-label="Progresso das habilidades adicionais" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>

    <section className="r121-skill-section">
      <div className="r121-skill-section-title"><strong>Habilidades para adicionar</strong><small>Toque em uma habilidade e confirme somente depois que ela estiver aplicada no jogo.</small></div>
      <div className="r121-skill-pending-list">
        {pending.map((skill) => {
          const slot = Math.max(1, skills.indexOf(skill) + 1);
          return <div className="r121-skill-pending-item" key={skill}>
            <button type="button" className="r121-skill-primary" onClick={() => onToggle?.(skill)} disabled={!onToggle}>
              <OfficialSkillIconR119 skill={skill} />
              <span><small>ADICIONAL {slot}</small><strong>{skill}</strong><em>{description(skill)}</em></span>
              <b>Confirmar</b>
            </button>
            {onReplaceOwned && <button type="button" className="r121-skill-owned" onClick={() => onReplaceOwned(skill)}><Sparkles size={14} /> A carta já possui? Gerar outra</button>}
          </div>;
        })}
        {!pending.length && total > 0 && <div className="r121-skills-complete"><CheckCircle2 size={21} /><span><strong>Top 5 concluído</strong><small>Todas as habilidades recomendadas foram marcadas como adicionadas.</small></span></div>}
        {!total && <p>Nenhuma habilidade adicional segura disponível com a leitura atual.</p>}
      </div>
    </section>

    <section className="r121-skill-section completed">
      <div className="r121-skill-section-title"><strong>Habilidades adicionadas</strong><small>Ficam separadas da fila pendente. Toque para devolver uma habilidade à lista se marcou por engano.</small></div>
      <div className="r121-skill-added-list">
        {completed.map((skill) => <button type="button" key={skill} onClick={() => onToggle?.(skill)} disabled={!onToggle}><CheckCircle2 size={17} /><span><strong>{skill}</strong><small>Pronta • tocar para reabrir</small></span></button>)}
        {!completed.length && <span className="r121-empty-added">Nenhuma habilidade marcada como adicionada ainda.</span>}
      </div>
    </section>
  </div>;
}

function teamStyleLabel(value: unknown): string {
  const key = String(value ?? '').toUpperCase();
  const labels: Record<string, string> = {
    AUTO: 'Automático inteligente',
    POSSE_DE_BOLA: 'Posse de bola',
    CONTRA_ATAQUE: 'Contra-ataque',
    CONTRA_ATAQUE_RAPIDO: 'Contra-ataque rápido',
    POR_FORA: 'Por fora',
    PASSE_LONGO: 'Passe longo',
    SOBREPOSICAO: 'Sobreposição'
  };
  return labels[key] ?? String(value ?? 'Não informado').replaceAll('_', ' ');
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
  onReplaceOwnedSkill,
  skillProgress
}: {
  result: AnalysisResult;
  onSave?: () => void;
  onShare?: () => void;
  onExportImage?: () => void;
  onSkillToggle?: (skill: string) => void;
  onReplaceOwnedSkill?: (skill: string) => void;
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
    const skillWorkflow = buildSkillWorkflowStateR121(displayedSkills, skillProgress);
    const pendingSkills = skillWorkflow.pending;
    const completedSkills = skillWorkflow.completed;
    const offensiveStyle = result.parsed.offensivePlaystyle ?? result.parsed.playstyle ?? 'Básico';
    const defensiveStyle = result.parsed.defensivePlaystyle ?? 'Básico';
    const defensiveStyleStatus = defensiveStyle === 'Básico' || result.parsed.defensivePlaystyleConfirmed ? 'confirmado' : 'provisório';
    const nextAction = cleanSlate.status !== 'READY'
      ? 'Revisar os dados do print antes de aplicar a ficha.'
      : pendingSkills.length
        ? `Adicionar e confirmar: ${pendingSkills[0]}.`
        : cleanSlate.impetoDecision === 'REVIEW_SLOT'
          ? 'Confirmar a vaga de Ímpeto antes de gastar Token.'
          : cleanSlate.impetoDecision === 'RECOMMEND_NEW'
            ? `Top 5 concluído. Revisar o Ímpeto ${impetoName ?? 'recomendado'} antes de aplicar.`
            : 'Ficha e habilidades concluídas. Testar em partida e registrar o comportamento real.';
    return <article className="luxury-panel wide-card unified-performance-v3920">
      <header className="unified-v3920-head">
        <div>
          <p className="kicker"><BrainCircuit size={15} /> Clean Slate • r123</p>
          <h3>Ficha recalculada do zero pela identidade da carta</h3>
          <p>{result.parsed.playerName}: o motor avaliou {cleanSlate.candidateCount} estados e escolheu a distribuição com maior retorno para partidas online, preservando as ações naturais desta carta.</p>
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
      <section className="r121-readiness-panel" aria-label="Central de prontidão eFootball 2027">
        <div className="r121-readiness-title"><span><BrainCircuit size={18} /><strong>Central 2027</strong></span><small>Resumo operacional sem criar outro motor de decisão.</small></div>
        <div className="r121-readiness-grid">
          <div><small>Fase ofensiva</small><strong>{offensiveStyle}</strong><span>posição usada: {result.bestPosition.label}</span></div>
          <div><small>Fase defensiva</small><strong>{defensiveStyle}</strong><span>{defensiveStyleStatus}{defensiveStyle === 'Básico' ? ' • carta sem estilo defensivo separado' : ''}</span></div>
          <div><small>Estilo coletivo</small><strong>{teamStyleLabel(result.tacticalProfile?.style)}</strong><span>{result.tacticalProfile?.formation && result.tacticalProfile.formation !== 'AUTO' ? `formação ${result.tacticalProfile.formation}` : 'formação adaptável'}</span></div>
          <div><small>Top 5</small><strong>{completedSkills.length}/{displayedSkills.length || 5} prontas</strong><span>{pendingSkills.length ? `${pendingSkills.length} pendente(s)` : 'nenhuma pendência'}</span></div>
          <div><small>Objetivo da ficha</small><strong>Máximo online</strong><span>Ranked + amistoso • sem foco em GER</span></div>
          <div><small>DNA preservado</small><strong>{Math.round(cleanSlate.onlinePerformance.identityPreservation)}/100</strong><span>atributos + habilidades + estilos + ações naturais</span></div>
        </div>
        <div className="r121-next-action"><Target size={18} /><span><small>PRÓXIMA AÇÃO</small><strong>{nextAction}</strong></span></div>
      </section>
      <section className="unified-v3920-grid">
        <article className="r119-final-build">
          <div className="unified-v3920-card-title"><Target size={17} /><span><strong>Ficha final</strong><small>Único escritor: Clean Slate r123 • objetivo online</small></span></div>
          {activeTraining.length ? <div className="r119-training-icons">
            {activeTraining.map(({ key, value }) => <div key={key} className="r119-training-item">
              <span className="r119-training-icon"><TrainingProgressionIconR106 trainingKey={key as TrainingProgressionKeyR106} title={TRAINING_LABELS[key as TrainingKey] ?? key} size={31} /></span>
              <span><small>{TRAINING_LABELS[key as TrainingKey] ?? key}</small><strong>+{value}</strong></span>
            </div>)}
          </div> : <h4>Aguardando leitura completa</h4>}
          <small className="r119-training-summary">{planText(result) || 'Nenhum ponto aplicado.'}</small>
          <div className="unified-v3920-metrics r122-primary-metrics">
            <span><b>{Math.round(cleanSlate.onlinePerformance.rankedScore)}</b><small>online ranked</small></span>
            <span><b>{Math.round(cleanSlate.onlinePerformance.identityPreservation)}</b><small>DNA</small></span>
            <span><b>{Math.round(cleanSlate.responseScore)}</b><small>resposta</small></span>
            <span><b>{Math.round(cleanSlate.decisionConfidence.score)}</b><small>confiança ficha</small></span>
          </div>
          {cleanSlate.status !== 'READY' && <p><strong>Atributos lidos: {attributeCount}/26.</strong> Posições reconhecidas: {positionRatingsCount}/13. O motor não inventa os valores ausentes; revise a leitura quando a cobertura estiver baixa.</p>}
          <div className="chip-cloud">
            <span>Motor final: Clean Slate r123</span>
            {cleanSlate.dominantDna.map((dna) => <span key={dna}>{dna}</span>)}
          </div>
        </article>
        <article className="r119-resources-card">
          <div className="unified-v3920-card-title"><Sparkles size={17} /><span><strong>5 habilidades adicionais</strong><small>Fila prática com confirmação e histórico do que já foi aplicado</small></span></div>
          <SkillWorkflowR121 skills={displayedSkills} progress={skillProgress} description={skillDescription} onToggle={onSkillToggle} onReplaceOwned={onReplaceOwnedSkill} />
          <div className={`r119-impeto-card ${impetoStatus.className}`}>
            <div className="r119-impeto-head"><Trophy size={19} /><span><small>ÍMPETO</small><strong>{impetoName ?? 'Nenhum candidato seguro'}</strong></span></div>
            <span className="r119-impeto-status">{impetoStatus.label}</span>
            {cleanSlate.impetoIdeal && !cleanSlate.currentImpeto && <div className="r119-impeto-metrics"><span>encaixe <b>{Math.round(cleanSlate.impetoIdealScore)}</b></span><span>confiança <b>{Math.round(cleanSlate.impetoIdealConfidence)}</b></span></div>}
            <p>{cleanSlate.impetoReason}</p>
          </div>
        </article>
        <article className="r122-online-card">
          <div className="unified-v3920-card-title"><Trophy size={17} /><span><strong>Desempenho online</strong><small>Ranked e partidas casuais com amigos • sem perseguir Overall</small></span></div>
          <div className="r122-online-grid">
            <span><Target size={15} /><small>Ranqueada</small><strong>{Math.round(cleanSlate.onlinePerformance.rankedScore)}</strong></span>
            <span><Sparkles size={15} /><small>Amigos</small><strong>{Math.round(cleanSlate.onlinePerformance.friendsScore)}</strong></span>
            <span><Target size={15} /><small>Sob pressão</small><strong>{Math.round(cleanSlate.onlinePerformance.pressureReliability)}</strong></span>
            <span><BrainCircuit size={15} /><small>DNA</small><strong>{Math.round(cleanSlate.onlinePerformance.identityPreservation)}</strong></span>
            <span><ShieldCheck size={15} /><small>Consistência</small><strong>{Math.round(cleanSlate.onlinePerformance.matchConsistency)}</strong></span>
            <span><BrainCircuit size={15} /><small>Stamina</small><strong>{Math.round(cleanSlate.onlinePerformance.staminaSustainability)}</strong></span>
          </div>
          <p>O nome do jogador não entra no cálculo. A identidade vem da própria carta: atributos, habilidades, estilos e ações que ela tem evidência para executar com frequência.</p>
        </article>
        <article className="r122-why-card">
          <div className="unified-v3920-card-title"><BrainCircuit size={17} /><span><strong>Por que esta ficha?</strong><small>Retorno marginal dos pontos na decisão final</small></span></div>
          <div className="r122-rationale-list">
            {cleanSlate.pointRationale.slice(0, 6).map((item) => <div key={item.training}><span><strong>{item.label} +{item.level}</strong><small>{item.actions.slice(0, 2).join(' • ') || 'retorno combinado da carta'}</small></span><b>{item.returnPerCost >= 0 ? '+' : ''}{item.returnPerCost}</b></div>)}
          </div>
          <small>Cada grupo precisa justificar seu custo pelas ações reais da carta. Um atributo fraco não recebe pontos apenas para “ficar bonito” ou elevar GER.</small>
        </article>
        <article className="r123-confidence-card">
          <div className="unified-v3920-card-title"><ShieldCheck size={17} /><span><strong>Confiança da ficha</strong><small>Qualidade da leitura + estabilidade da decisão + evidência real</small></span></div>
          <div className="r123-confidence-head"><strong>{cleanSlate.decisionConfidence.level}</strong><b>{Math.round(cleanSlate.decisionConfidence.score)}/100</b></div>
          <div className="r123-confidence-grid">
            <span><small>Dados</small><strong>{Math.round(cleanSlate.decisionConfidence.dataQuality)}</strong></span>
            <span><small>Cobertura</small><strong>{Math.round(cleanSlate.decisionConfidence.attributeCoverage)}</strong></span>
            <span><small>Estabilidade</small><strong>{Math.round(cleanSlate.decisionConfidence.decisionStability)}</strong></span>
            <span><small>Partidas reais</small><strong>{Math.round(cleanSlate.decisionConfidence.realMatchEvidence)}</strong></span>
          </div>
          <small>{cleanSlate.decisionConfidence.reasons[3] ?? cleanSlate.decisionConfidence.reasons[0]}</small>
        </article>
        <article className="r123-saturation-card">
          <div className="unified-v3920-card-title"><Target size={17} /><span><strong>Saturação dos pontos</strong><small>Detecta quando os níveis finais começam a render menos — sem teto fixo por posição</small></span></div>
          <div className="r123-saturation-list">
            {cleanSlate.saturationProfile.slice(0, 7).map((item) => <div key={item.training} className={`r123-saturation-item ${item.status.toLowerCase()}`}>
              <span><strong>{item.label} +{item.level}</strong><small>{item.status === 'EFICIENTE' ? 'retorno consistente' : item.status === 'ATENCAO' ? 'retorno caindo' : 'zona de baixo retorno'}</small></span>
              <b>{item.lastReturnPerCost >= 0 ? '+' : ''}{item.lastReturnPerCost}</b>
            </div>)}
          </div>
          <small>A saturação é comparada com o próprio histórico marginal da carta. Ela não cria regra como “Passe máximo 8” ou “Defesa mínimo 10”.</small>
        </article>
        <article className="r123-lab-card">
          <div className="unified-v3920-card-title"><Trophy size={17} /><span><strong>Laboratório competitivo A/B</strong><small>Comparação controlada em Ranked e partidas com amigos • somente leitura</small></span></div>
          <div className="r123-lab-arms">
            {cleanSlate.competitiveLab.arms.map((arm) => <div key={arm.id} className={arm.isPrimary ? 'primary' : ''}>
              <span><strong>{arm.label}</strong><small>Ranked {Math.round(arm.rankedScore)} • amigos {Math.round(arm.friendsScore)}{arm.distanceFromPrimary ? ` • distância ${arm.distanceFromPrimary}` : ''}</small></span>
              <b>{Math.round(arm.score)}</b>
              <em>{arm.hypothesis}</em>
            </div>)}
          </div>
          <small>{cleanSlate.competitiveLab.canCompare ? `Pronto para A/B: mínimo ${cleanSlate.competitiveLab.minMatchesPerArm} partidas por ficha, em condições parecidas.` : 'Ainda não existe uma alternativa suficientemente diferente para um A/B útil.'}</small>
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
        <div className="unified-v3920-card-title"><Sparkles size={17} /><span><strong>Habilidades adicionais</strong><small>Top 5 complementar com progresso persistente</small></span></div>
        <SkillWorkflowR121 skills={displayedSkills} progress={skillProgress} description={(skill) => appliedSkills.find((item) => item.name === skill)?.gameplayImpact ?? 'Complementa a carta sem copiar um molde genérico.'} onToggle={onSkillToggle} onReplaceOwned={onReplaceOwnedSkill} />
        <small>Autoridade final preservada • {displayedSkills.length}/5 slots finais • motores históricos continuam somente para auditoria.</small>
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
