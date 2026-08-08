'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Globe2,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Trophy
} from 'lucide-react';
import type { AnalysisResult, TrainingPlan } from '@/lib/analyzerDomain';
import {
  CREATOR_BUILD_RESEARCH_EVENT,
  CREATOR_TRAINING_KEYS,
  CREATOR_TRAINING_LABELS,
  creatorTrainingCost
} from '@/lib/creatorBuildResearch';
import {
  GLOBAL_PRO_BUILD_EVENT,
  buildGlobalProBenchmarkV3900,
  loadGlobalProBuildSources,
  refreshGlobalProBuildCatalog
} from '@/lib/globalProBenchmarkV3900';
import { exactCardSearchUrl, listWorldPros, worldProTierLabel } from '@/lib/worldProRegistry';

function planText(plan: TrainingPlan): string {
  return CREATOR_TRAINING_KEYS
    .filter((key) => plan[key] > 0)
    .map((key) => `${CREATOR_TRAINING_LABELS[key]} +${plan[key]}`)
    .join(' • ');
}

function differenceLabel(value: number): string {
  if (value === 0) return 'igual';
  return value > 0 ? `pro +${value}` : `BuildMaster +${Math.abs(value)}`;
}

function evidenceLabel(value: string): string {
  if (value === 'FICHA_COMPLETA') return 'Ficha completa';
  if (value === 'PROGRESSAO') return 'Somente progressão';
  return 'Evidência parcial';
}

export function GlobalProLabV3900Panel({ result }: { result: AnalysisResult }) {
  const [sources, setSources] = useState(() => loadGlobalProBuildSources());
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState('');
  const profiles = useMemo(() => listWorldPros('TODOS'), []);
  const benchmark = useMemo(() => buildGlobalProBenchmarkV3900(result, sources), [result, sources]);
  const dominant = result.eliteDominanceV3910;

  useEffect(() => {
    const refresh = () => setSources(loadGlobalProBuildSources());
    window.addEventListener(GLOBAL_PRO_BUILD_EVENT, refresh);
    window.addEventListener(CREATOR_BUILD_RESEARCH_EVENT, refresh);
    return () => {
      window.removeEventListener(GLOBAL_PRO_BUILD_EVENT, refresh);
      window.removeEventListener(CREATOR_BUILD_RESEARCH_EVENT, refresh);
    };
  }, []);

  async function syncCatalog() {
    setSyncing(true);
    setStatus('Atualizando o catálogo profissional verificado…');
    try {
      const response = await refreshGlobalProBuildCatalog();
      setSources(response.sources);
      setStatus(response.message);
    } finally {
      setSyncing(false);
    }
  }

  async function copyBuild(title: string, training: TrainingPlan, skills: string[], impeto: string | null) {
    const text = [
      title,
      planText(training),
      `Custo: ${creatorTrainingCost(training).totalCost}/${result.trainingPointsTotal}`,
      `Habilidades: ${skills.join(', ') || 'não publicadas'}`,
      `Ímpeto: ${impeto || 'não publicado'}`
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Ficha completa copiada.');
    } catch {
      setStatus('O aparelho não permitiu copiar automaticamente.');
    }
  }

  return <article className="luxury-panel wide-card global-pro-lab-v3900">
    <div className="section-title-row global-pro-title-row">
      <div>
        <p className="kicker"><Globe2 size={15} /> Laboratório Pro Global 2026</p>
        <h3>BuildMaster contra fichas dos melhores jogadores do mundo</h3>
      </div>
      <button type="button" className="secondary-button" disabled={syncing} onClick={() => void syncCatalog()}>
        <RefreshCw size={16} className={syncing ? 'spin' : ''} /> {syncing ? 'Atualizando' : 'Atualizar base'}
      </button>
    </div>

    <p className="panel-note">O módulo compara somente a mesma versão exata da carta. Quando um pro player não publicou progressão, habilidades e Ímpeto completos, o app mostra “sem dados” e não inventa uma ficha.</p>

    {dominant && <section className="dominant-engine-v3910">
      <div className="section-title-row">
        <div>
          <p className="kicker"><ShieldCheck size={15} /> Motor Dominante Universal v39.10</p>
          <h4>Uma carta, uma receita definitiva, testada em todas as posições próprias</h4>
        </div>
        <span className={`dominant-status ${dominant.proChallengeStatus}`}>{dominant.proChallengeStatus === 'supera_no_modelo' ? 'Acima do benchmark' : dominant.proChallengeStatus === 'empata_no_modelo' ? 'Empate técnico' : dominant.proChallengeStatus === 'abaixo_no_modelo' ? 'Abaixo no modelo' : 'Sem evidência exata'}</span>
      </div>
      <p className="panel-note">A posição selecionada não muda a ficha, as habilidades nem o Ímpeto. A receita é criada pela identidade da versão da carta e desafiada contra as fichas profissionais verificáveis, sem deixar a base online alterar silenciosamente o resultado.</p>
      <div className="dominant-metrics-v3910">
        <article><strong>{dominant.candidatesGenerated}</strong><span>candidatas determinísticas</span><small>{dominant.candidatesEvaluated} avaliadas integralmente</small></article>
        <article><strong>{Math.round(dominant.winner.universalScore)}</strong><span>desempenho universal</span><small>sem Overall/GER</small></article>
        <article><strong>{Math.round(dominant.winner.worstPositionScore)}</strong><span>pior posição protegida</span><small>{dominant.compatiblePositions.length} posição(ões) próprias</small></article>
        <article><strong>{dominant.confidence}%</strong><span>confiança da receita</span><small>{dominant.decision === 'aprovada' ? 'aprovada' : 'revisar leitura'}</small></article>
      </div>
      <div className={`dominant-pro-challenge ${dominant.proChallengeStatus}`}>
        <div>{dominant.proChallengeStatus === 'supera_no_modelo' ? <Trophy size={22} /> : dominant.proChallengeStatus === 'sem_evidencia' ? <Database size={22} /> : <ShieldCheck size={22} />}</div>
        <span><strong>Desafio contra fichas top global</strong><small>{dominant.proChallengeLabel}</small></span>
        <em>{dominant.proReferencesChallenged} ficha(s) exata(s)</em>
      </div>
      <div className="dominant-build-v3910">
        <article><span>Ficha definitiva</span><strong>{planText(dominant.winner.training)}</strong><small>{creatorTrainingCost(dominant.winner.training).totalCost}/{result.trainingPointsTotal} pontos • assinatura {dominant.resultSignature}</small></article>
        <article><span>Habilidades adicionais definitivas</span><strong>{dominant.skills.map((item) => item.name).join(' • ') || 'Revisar leitura da carta'}</strong><small>Escolhidas em conjunto pela cobertura universal e pelo DNA da carta</small></article>
        <article><span>Ímpeto definitivo</span><strong>{dominant.primaryImpeto || 'Revisar leitura da carta'}</strong><small>Calculado depois da ficha e das habilidades, contra o elo mais fraco</small></article>
      </div>
      <div className="dominant-position-grid-v3910">{dominant.compatiblePositions.map((item) => <article key={item.position}>
        <div><strong>{item.label}</strong><span>{item.familiarity}% familiaridade</span></div>
        <b>{Math.round(item.performanceScore)}</b>
        <small>Pior cenário {Math.round(item.worstScenario)} • consistência {Math.round(item.consistency)}</small>
        <em className={item.verdict}>{item.verdict}</em>
      </article>)}</div>
      <details className="settings-details-card"><summary>Por que esta receita não muda quando a posição é trocada</summary>{dominant.deterministicChecks.map((item) => <p className="panel-note" key={item}>• {item}</p>)}</details>
      <details className="settings-details-card"><summary>Proteções contra ficha genérica e promessa falsa</summary>{dominant.guardrails.map((item) => <p className="panel-note" key={item}>• {item}</p>)}</details>
    </section>}

    <div className="global-pro-metrics">
      <article><strong>{benchmark.registryProfiles}</strong><span>pro players verificados</span><small>campeões e finalistas globais</small></article>
      <article><strong>{benchmark.exactReferences}</strong><span>fontes da carta exata</span><small>{benchmark.distinctPros} pro player(s) distinto(s)</small></article>
      <article><strong>{benchmark.fullBuildReferences}</strong><span>fichas completas</span><small>progressão + habilidades + Ímpeto</small></article>
      <article><strong>{benchmark.confidence}%</strong><span>confiança profissional</span><small>{benchmark.confidenceLabel}</small></article>
    </div>

    <section className={`global-pro-gate ${benchmark.automaticCalibrationApplied ? 'approved' : benchmark.exactReferences ? 'comparison' : 'empty'}`}>
      <div>{benchmark.automaticCalibrationApplied ? <CheckCircle2 size={22} /> : benchmark.exactReferences ? <ShieldCheck size={22} /> : <TriangleAlert size={22} />}</div>
      <span>
        <strong>{benchmark.automaticCalibrationApplied ? 'Calibração profissional aplicada' : benchmark.exactReferences ? 'Comparação disponível, receita protegida' : 'Nenhuma ficha profissional pública desta carta'}</strong>
        <small>{benchmark.summary}</small>
      </span>
      <em>{benchmark.professionalInfluence}% de influência</em>
    </section>

    <section className="global-pro-comparison-card">
      <div className="section-title-row"><div><p className="kicker">Progressão completa</p><h4>Ficha gerada × consenso dos pro players</h4></div><span>{benchmark.trainingSimilarity === null ? 'sem amostra' : `${benchmark.trainingSimilarity}% semelhante`}</span></div>
      <div className="global-pro-build-summary">
        <article><span>BuildMaster final</span><strong>{planText(benchmark.finalTraining)}</strong><small>{creatorTrainingCost(benchmark.finalTraining).totalCost}/{result.trainingPointsTotal} pontos</small></article>
        <article><span>Consenso profissional</span><strong>{benchmark.exactReferences ? planText(benchmark.proConsensusTraining) : 'Sem ficha pública verificada'}</strong><small>{benchmark.exactReferences ? `${creatorTrainingCost(benchmark.proConsensusTraining).totalCost} pontos no consenso` : 'O motor próprio foi mantido'}</small></article>
      </div>
      <div className="global-pro-table-wrap">
        <table className="global-pro-table">
          <thead><tr><th>Bloco</th><th>BuildMaster</th><th>Pro global</th><th>Diferença</th><th>Acordo</th></tr></thead>
          <tbody>{benchmark.blockComparisons.map((item) => <tr key={item.key}>
            <td>{item.label}</td><td><b>{item.buildMaster}</b></td><td><b>{benchmark.exactReferences ? item.proConsensus : '—'}</b></td><td>{benchmark.exactReferences ? differenceLabel(item.difference) : 'sem dados'}</td><td>{item.sourceCount ? `${item.agreement}%` : '—'}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>

    <section className="global-pro-full-comparison">
      <article>
        <div><span>Habilidades do BuildMaster</span><em>{benchmark.skillSimilarity === null ? 'sem comparação' : `${benchmark.skillSimilarity}% de coincidência`}</em></div>
        <strong>{benchmark.finalSkills.join(' • ') || 'Revisar leitura da carta'}</strong>
        {benchmark.proConsensusSkills.length > 0 && <small>Mais repetidas entre pro players: {benchmark.proConsensusSkills.join(' • ')}</small>}
      </article>
      <article>
        <div><span>Ímpeto final</span><em>{benchmark.impetoAgreement === null ? 'sem comparação' : benchmark.impetoAgreement ? 'há acordo' : 'há divergência'}</em></div>
        <strong>{benchmark.finalImpeto || 'Revisar leitura da carta'}</strong>
        <small>{benchmark.proConsensusImpeto ? `Mais repetido entre pro players: ${benchmark.proConsensusImpeto}` : 'Nenhum Ímpeto profissional completo foi publicado para esta carta.'}</small>
      </article>
    </section>

    <section className="global-pro-reference-section">
      <div className="section-title-row"><div><p className="kicker"><Trophy size={14} /> Biblioteca pública auditada</p><h4>Fichas completas dos pro players para esta carta</h4></div><span>{benchmark.references.filter((item) => item.exactCard).length} exata(s)</span></div>
      <div className="global-pro-reference-grid">{benchmark.references.filter((item) => item.exactCard).map((reference) => <article key={reference.id}>
        <div className="global-pro-reference-head"><span><Trophy size={15} /> {reference.gamerTag}</span><em>{reference.platform}</em></div>
        <h5>{reference.title}</h5>
        <p>{reference.country} • {reference.achievement}</p>
        <div className="global-pro-reference-badges"><span>{evidenceLabel(reference.evidenceLevel)}</span><span>{reference.identityScore}% carta exata</span><span>{reference.completeness}% completa</span>{reference.testedInMatches && <span>testada em partidas</span>}</div>
        <strong>{planText(reference.training)}</strong>
        <small><b>Habilidades:</b> {reference.skills.join(', ') || 'não publicadas'}</small>
        <small><b>Ímpeto:</b> {reference.impeto || 'não publicado'}</small>
        <div className="global-pro-reference-actions"><button type="button" onClick={() => void copyBuild(`${reference.gamerTag} • ${reference.title}`, reference.training, reference.skills, reference.impeto)}><Copy size={14} /> Copiar</button><a href={reference.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Abrir prova</a></div>
      </article>)}</div>
      {!benchmark.references.some((item) => item.exactCard) && <div className="global-pro-empty-state"><Database size={28} /><strong>Nenhuma ficha completa desta versão foi publicada e verificada</strong><span>Pesquise nos perfis abaixo ou registre um vídeo/print em “Fichas de criadores”. A ausência de dados não será preenchida com informação inventada.</span></div>}
    </section>

    <details className="global-pro-registry-details global-pro-complete-library">
      <summary>Biblioteca global de fichas completas ({benchmark.globalFullBuildReferences})</summary>
      <p className="panel-note">Esta biblioteca reúne as fichas completas verificadas que já estão no catálogo, mesmo quando pertencem a outra carta. Elas servem para consulta e nunca são aplicadas à carta atual sem fingerprint idêntico.</p>
      <div className="global-pro-reference-grid">{benchmark.references.filter((item) => item.evidenceLevel === 'FICHA_COMPLETA').map((reference) => <article key={`global-${reference.id}`}>
        <div className="global-pro-reference-head"><span><Trophy size={15} /> {reference.gamerTag}</span><em>{reference.platform}</em></div>
        <h5>{reference.playerName} • {reference.cardType}{reference.specialTag ? ` • ${reference.specialTag}` : ''}</h5>
        <p>{reference.title}</p>
        <div className="global-pro-reference-badges"><span>{reference.mainPosition}</span><span>{reference.trainingPointsTotal ?? '—'} pontos</span><span>{reference.completeness}% completa</span>{reference.exactCard && <span>carta atual exata</span>}</div>
        <strong>{planText(reference.training)}</strong>
        <small><b>Habilidades:</b> {reference.skills.join(', ') || 'não publicadas'}</small>
        <small><b>Ímpeto:</b> {reference.impeto || 'não publicado'}</small>
        <div className="global-pro-reference-actions"><button type="button" onClick={() => void copyBuild(`${reference.gamerTag} • ${reference.playerName}`, reference.training, reference.skills, reference.impeto)}><Copy size={14} /> Copiar</button><a href={reference.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Abrir prova</a></div>
      </article>)}</div>
      {!benchmark.globalFullBuildReferences && <div className="global-pro-empty-state"><Database size={28} /><strong>A biblioteca ainda não possui fichas completas verificadas</strong><span>Registre provas no módulo Fichas de criadores ou sincronize a base remota. Nenhum dado fictício será exibido.</span></div>}
    </details>

    <details className="global-pro-registry-details">
      <summary>Índice mundial verificado de 2026</summary>
      <div className="global-pro-registry-grid">{profiles.map((profile) => <article key={profile.id}>
        <div><strong>{profile.gamerTag}</strong><span>{worldProTierLabel(profile.tier)} • {profile.platform}</span></div>
        <p>{profile.achievement}</p>
        <div><a href={exactCardSearchUrl(result, profile)} target="_blank" rel="noreferrer"><Globe2 size={14} /> Pesquisar esta carta</a><a href={profile.officialSourceUrl} target="_blank" rel="noreferrer"><ShieldCheck size={14} /> Fonte oficial</a></div>
      </article>)}</div>
    </details>

    <details className="settings-details-card"><summary>Regras que impedem comparação falsa</summary>{benchmark.guardrails.map((item) => <p className="panel-note" key={item}>• {item}</p>)}</details>
    {benchmark.warnings.map((item) => <p className="global-pro-warning" key={item}><TriangleAlert size={15} /> {item}</p>)}
    {status && <p className="creator-status" role="status">{status}</p>}
  </article>;
}
