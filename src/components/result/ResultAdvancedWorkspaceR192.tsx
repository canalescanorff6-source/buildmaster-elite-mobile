'use client';

import dynamic from 'next/dynamic';
import { Ban, BrainCircuit, RotateCcw, ThumbsUp } from 'lucide-react';
import { ATTRIBUTE_PT, POSITION_PT, type AnalysisResult, type AttributeKey, type PositionCode } from '@/lib/analyzer';
import { buildReliabilityCenter, compareBuildVariants, detectInconsistencies } from '@/lib/confidenceComparison';
import { canonicalizeSkillList, skillIdentityKey } from '@/lib/officialSkillIdentity';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';
import { getMergedCorrectionsForResult, type DynamicRulePack } from '@/modules/builds/dynamicRules';
import { useObservabilityFeatureFlag } from '@/modules/observability/useObservabilityFeatureFlag';
import { StructuralPrecisionPanel } from '@/components/StructuralPrecisionPanel';
import { AdvancedMotorV3750Panel } from '@/components/AdvancedMotorV3750Panel';
import { ContinuousUpdateV3770Panel } from '@/components/ContinuousUpdateV3770Panel';
import {
  CommunityIntelligencePanel,
  CreatorBuildResearchPanel,
  GlobalProLabV3900Panel,
  MatchValidationCenter,
  SkillAndTrainingPanel,
  VerifiedCardRegistryPanel,
  VideoReviewPanel
} from '@/components/lazy/AppLazyPanels';

const RealMatchCalibrationPanelR189 = dynamic(
  () => import('@/components/result/RealMatchCalibrationPanelR189').then((module) => module.RealMatchCalibrationPanelR189),
  { ssr: false, loading: () => <article className="luxury-panel wide-card"><p className="panel-note">Carregando calibração pós-partida…</p></article> }
);

export type AdvancedResultTabR192 = 'leitura' | 'confianca' | 'comparar' | 'partidas' | 'motor' | 'comunidade' | 'proglobal' | 'fontes' | 'calibracao' | 'treino' | 'correcao' | 'regras' | 'validacao' | 'posicoes' | 'dados';

function positionPt(code: string) { return POSITION_PT[code as PositionCode] ?? code; }

function attributeNamePt(key: string) {
  return ATTRIBUTE_PT[key as AttributeKey] ?? key;
}

export function ResultAdvancedWorkspaceR192({
  tab,
  result,
  onResetCorrections,
  onPromoteImpeto,
  onRejectImpeto,
  rulesUrl,
  setRulesUrl,
  rulesStatus,
  rulePackInfo,
  onLoadRulesFromUrl,
  onResetRules,
  onExportRulePack,
  onRestoreRulePackVersion
}: {
  tab: string;
  result: AnalysisResult;
  onResetCorrections?: () => void;
  onPromoteImpeto?: (impeto: string) => void;
  onRejectImpeto?: (impeto: string) => void;
  rulesUrl: string;
  setRulesUrl: (value: string) => void;
  rulesStatus: string;
  rulePackInfo: DynamicRulePack;
  onLoadRulesFromUrl: () => void;
  onResetRules: () => void;
  onExportRulePack: () => void;
  onRestoreRulePackVersion: (version: string) => void;
}) {
  const communityEnabled = useObservabilityFeatureFlag('community');
  const card = result.parsed;
  const usagePositionLabel = positionPt(analysisUsagePositionR138(result));
  const reliabilityCenter = buildReliabilityCenter(result);
  const inconsistencyReport = detectInconsistencies(result);
  const buildComparison = compareBuildVariants(result);
  const recommendedSkills = result.recommendedSkills.slice(0, 5);
  const nativeSkills = canonicalizeSkillList([...card.nativeSkills, ...(card.additionalSkills ?? []), ...card.specialSkills]).slice(0, 12);
  const skillRecommendations = result.skillRecommendations ?? result.recommendedSkills.map((skill) => ({ name: skill, tier: 'alternativa' as const, reason: '' }));
  const avoidSkillItems = skillRecommendations.filter((item) => item.tier === 'evitar').slice(0, 5);
  const alternativeSkillItems = skillRecommendations.filter((item) => item.tier === 'alternativa' && !recommendedSkills.includes(item.name)).slice(0, 6);
  const duplicateRecommendedSkills = recommendedSkills.filter((skill) => nativeSkills.some((owned) => skillIdentityKey(owned) === skillIdentityKey(skill)));
  const finalValidatorItems = [
    { label: 'Pontos dentro do limite', ok: result.trainingPointsUsed <= result.trainingPointsTotal, note: `${result.trainingPointsUsed}/${result.trainingPointsTotal} pontos` },
    { label: 'Top 5 sem repetição', ok: duplicateRecommendedSkills.length === 0 && result.skillIntegrity?.status !== 'review', note: duplicateRecommendedSkills.length ? `Revisar: ${duplicateRecommendedSkills.join(', ')}` : result.skillIntegrity?.checks[1] ?? 'habilidades já existentes foram filtradas' },
    { label: 'Lista oficial de habilidades', ok: recommendedSkills.length > 0, note: recommendedSkills.length ? 'recomendações travadas na lista local oficial' : 'nenhuma habilidade segura encontrada' },
    { label: 'Ímpetos separados das habilidades', ok: result.recommendedImpetos.length > 0, note: 'ímpeto não é tratado como habilidade adicional' },
    { label: 'Função real detectada', ok: Boolean(result.teamMap?.functionLabel), note: result.teamMap?.functionLabel ?? result.buildName },
    { label: 'Conferência/OCR', ok: result.validation?.level !== 'blocked', note: result.validation?.level === 'blocked' ? 'precisa revisar dados antes de usar' : 'análise liberada' }
  ];
  const localCorrections = getMergedCorrectionsForResult(result);
  const hasLocalCorrections = Boolean(localCorrections.blockedSkills.length || localCorrections.promotedSkills.length || localCorrections.blockedImpetos.length || localCorrections.promotedImpetos.length);
  const cardPositions = Array.from(new Set([card.mainPosition, ...card.positions])).slice(0, 10);
  const positionItems = result.positionScores.slice(0, 8);
  const positionRatings = Object.entries(card.positionRatings).filter(([, value]) => Number.isFinite(value));
  const attributes = Object.entries(card.attributes).filter(([, value]) => Number.isFinite(value));
  const sourceLabel = card.trainingPointSource === 'MANUAL'
    ? 'Orçamento manual confirmado'
    : card.trainingPointSource === 'TRAINING_READ'
      ? 'Plano automático somado'
      : card.trainingPointSource === 'LEVEL_INFERRED'
        ? 'Calculado pelo nível'
        : card.trainingPointSource === 'OCR'
          ? 'Informado no registro técnico'
          : 'Padrão seguro';
  const recommendedImpetos = result.recommendedImpetos.slice(0, 8);

  return <>
      {tab === 'leitura' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Análise profunda do print</p><h3>Separação entre leitura, inferência e recomendação</h3></div>
              <span>Confiança {result.deepAnalysis.confidenceLevel}</span>
            </div>
            <div className="data-grid">
              <div><span>Identidade original</span><strong>{result.deepAnalysis.originalIdentity}</strong></div>
              <div><span>Função recomendada</span><strong>{result.deepAnalysis.recommendedFunction}</strong></div>
              <div><span>Campos incertos</span><strong>{result.deepAnalysis.uncertainFields.length || 'Nenhum crítico'}</strong></div>
              <div><span>Confiança numérica</span><strong>{card.confidence}%</strong></div>
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Auditoria campo por campo</p>
            <div className="position-list">
              {result.deepAnalysis.readingItems.map((item) => (
                <div key={item.field}>
                  <strong>{item.field}: {item.value}</strong>
                  <span>{item.source} • confiança {item.confidence}</span>
                  <em>{item.note}</em>
                </div>
              ))}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Travas anti-invenção</p>
            <ul className="clean-list">{result.deepAnalysis.safeguards.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Por que os pontos foram usados assim</p>
            <ul className="clean-list">{result.deepAnalysis.pointRationale.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <StructuralPrecisionPanel result={result} />
          <VerifiedCardRegistryPanel result={result} />
        </div>
      )}


      {tab === 'confianca' && reliabilityCenter && inconsistencyReport && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker">Central de confiabilidade</p><h3>O que sustenta esta ficha</h3></div><span>{reliabilityCenter.score}/100 • {reliabilityCenter.level}</span></div>
            <div className="data-grid">
              <div><span>Confirmados</span><strong>{reliabilityCenter.confirmed}</strong></div>
              <div><span>Inferidos</span><strong>{reliabilityCenter.inferred}</strong></div>
              <div><span>Pendentes</span><strong>{reliabilityCenter.unresolved}</strong></div>
              <div><span>Integridade</span><strong>{inconsistencyReport.score}/100</strong></div>
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Origem e impacto dos dados</p>
            <div className="position-list">{reliabilityCenter.items.map((item) => <div key={`${item.field}-${item.value}`}><strong>{item.field}: {item.value}</strong><span>{item.source} • {item.confidence}% • impacto {item.impact}</span><em>{item.note}</em></div>)}</div>
          </article>
          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker">Detector de incoerências</p><h3>{inconsistencyReport.status === 'aprovado' ? 'Nenhum erro crítico encontrado' : 'Itens que precisam de revisão'}</h3></div><span>{inconsistencyReport.canGenerate ? 'Pode gerar' : 'Bloqueado'}</span></div>
            {inconsistencyReport.issues.length ? <div className="position-list">{inconsistencyReport.issues.map((issue) => <div key={issue.code}><strong>{issue.severity.toUpperCase()} • {issue.title}</strong><span>{issue.detail}</span><em>{issue.correction}</em></div>)}</div> : <p>A posição escolhida, o orçamento, os atributos e os nomes oficiais passaram nas verificações.</p>}
          </article>
          {reliabilityCenter.alerts.length > 0 && <article className="luxury-panel wide-card"><p className="kicker">Atenção antes de finalizar</p><ul className="clean-list">{reliabilityCenter.alerts.map((x) => <li key={x}>{x}</li>)}</ul></article>}
        </div>
      )}


      {tab === 'comparar' && buildComparison && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker">Comparador de fichas</p><h3>{buildComparison.winner}</h3></div><span>{result.buildVariants.length} opções</span></div>
            <p>{buildComparison.reason}</p>
          </article>
          <article className="luxury-panel wide-card comparison-table-card">
            <div className="comparison-table">
              <div className="comparison-row comparison-head"><strong>Critério</strong>{buildComparison.variants.map((v) => <b key={v.title}>{v.title}</b>)}</div>
              {buildComparison.rows.map((row) => <div className="comparison-row" key={row.key}><strong>{row.label}</strong>{row.values.map((cell) => <span className={cell.best ? 'comparison-best' : ''} key={`${row.key}-${cell.title}`}>{cell.value}</span>)}</div>)}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Riscos de cada opção</p>
            <div className="position-list">{buildComparison.variants.map((v) => <div key={v.title}><strong>{v.title} • {v.points} pts</strong><span>Qualidade {v.score} • eficiência {v.efficiency} • equilíbrio {v.balance}</span><em>{v.risks.length ? v.risks.join(' • ') : 'Sem risco crítico identificado.'}</em></div>)}</div>
          </article>
        </div>
      )}


      {tab === 'partidas' && <MatchValidationCenter result={result} />}


      {tab === 'motor' && <AdvancedMotorV3750Panel result={result} />}


      {tab === 'comunidade' && (communityEnabled ? <CommunityIntelligencePanel result={result} /> : <div className="settings-explanation-card"><div><strong>Inteligência de criadores pausada localmente</strong><span>Reative o módulo em Ajustes › Observabilidade e suporte.</span></div></div>)}


      {tab === 'proglobal' && <GlobalProLabV3900Panel result={result} />}


      {tab === 'fontes' && <CreatorBuildResearchPanel result={result} />}


      {tab === 'calibracao' && <RealMatchCalibrationPanelR189 result={result} />}


      {tab === 'treino' && <div className="result-section-grid"><SkillAndTrainingPanel result={result} /><VideoReviewPanel result={result} /></div>}


      {tab === 'correcao' && localCorrections && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card correction-hero-card">
            <div className="section-title-row">
              <div>
                <p className="kicker"><BrainCircuit size={14} /> Regras atualizáveis</p>
                <h3>O app aprende quando você diz que uma habilidade ou ímpeto não combina.</h3>
              </div>
              <span>{hasLocalCorrections ? 'Ativo' : 'Sem correções'}</span>
            </div>
            <p className="panel-note">As correções ficam salvas somente neste aparelho/navegador. Quando você marcar “Não combina” ou “Priorizar”, o BuildMaster evita repetir o erro para este jogador e para a função real parecida.</p>
            <div className="correction-summary-grid">
              <div><span>Habilidades bloqueadas</span><strong>{localCorrections.blockedSkills.length}</strong></div>
              <div><span>Habilidades priorizadas</span><strong>{localCorrections.promotedSkills.length}</strong></div>
              <div><span>Ímpetos bloqueados</span><strong>{localCorrections.blockedImpetos.length}</strong></div>
              <div><span>Ímpetos priorizados</span><strong>{localCorrections.promotedImpetos.length}</strong></div>
            </div>
            <button type="button" className="secondary-action" onClick={onResetCorrections} disabled={!hasLocalCorrections}><RotateCcw size={16} /> Limpar correções deste jogador/função</button>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Regras locais aplicadas</p>
            <div className="skill-grid">
              <div className="skill-check-card muted"><strong>Evitar habilidades</strong><span>{localCorrections.blockedSkills.length ? localCorrections.blockedSkills.join(' • ') : 'Nenhuma habilidade bloqueada.'}</span></div>
              <div className="skill-check-card"><strong>Priorizar habilidades</strong><span>{localCorrections.promotedSkills.length ? localCorrections.promotedSkills.join(' • ') : 'Nenhuma habilidade priorizada.'}</span></div>
              <div className="skill-check-card muted"><strong>Evitar ímpetos</strong><span>{localCorrections.blockedImpetos.length ? localCorrections.blockedImpetos.join(' • ') : 'Nenhum ímpeto bloqueado.'}</span></div>
              <div className="skill-check-card"><strong>Priorizar ímpetos</strong><span>{localCorrections.promotedImpetos.length ? localCorrections.promotedImpetos.join(' • ') : 'Nenhum ímpeto priorizado.'}</span></div>
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Como usar</p>
            <ul className="clean-list">
              <li>Na aba Habilidades, toque em <b>Não combina</b> quando o app recomendar algo errado para a função.</li>
              <li>Toque em <b>Priorizar</b> quando uma alternativa fizer mais sentido para seu estilo de jogo.</li>
              <li>Na área de ímpetos, bloqueie um ímpeto incompatível para o app ajustar a próxima ficha.</li>
              <li>Isso não usa IA paga; é memória local do seu próprio app.</li>
            </ul>
          </article>
        </div>
      )}



      {tab === 'regras' && <ContinuousUpdateV3770Panel
        result={result}
        rulesUrl={rulesUrl}
        setRulesUrl={setRulesUrl}
        rulesStatus={rulesStatus}
        rulePackInfo={rulePackInfo}
        onLoadRulesFromUrl={onLoadRulesFromUrl}
        onResetRules={onResetRules}
        onExportRulePack={onExportRulePack}
        onRestoreRulePackVersion={onRestoreRulePackVersion}
      />}


      {tab === 'validacao' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <p className="kicker">Validador final de precisão</p>
            <div className="squad-leader-grid">
              {finalValidatorItems.map((item) => (
                <div key={item.label} className={item.ok ? 'squad-leader-item validator-ok' : 'squad-leader-item validator-bad'}>
                  <span>{item.ok ? '✓ Aprovado' : '⚠ Revisar'}</span>
                  <strong>{item.label}</strong>
                  <em>{item.note}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">Esta etapa bloqueia os erros mais comuns: pontos acima do orçamento, habilidade inexistente, habilidade repetida e ímpeto usado como habilidade.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Habilidades por prioridade</p>
            <div className="skill-grid">
              <div className="skill-check-card">
                <strong>Essenciais</strong>
                <span>{recommendedSkills.length ? recommendedSkills.join(' • ') : 'Nenhuma essencial segura encontrada'}</span>
              </div>
              <div className="skill-check-card">
                <strong>Boas alternativas</strong>
                <span>{alternativeSkillItems.length ? alternativeSkillItems.map((item) => item.name).join(' • ') : 'Sem alternativa extra após o Top 5'}</span>
              </div>
              <div className="skill-check-card muted">
                <strong>Evitar</strong>
                <span>{avoidSkillItems.length ? avoidSkillItems.map((item) => item.name).join(' • ') : 'Nenhuma restrição crítica'}</span>
              </div>
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Checklist da ficha</p>
            <ul className="clean-list">
              <li>Ficha usa custo progressivo real e respeita o orçamento manual quando você digita pontos.</li>
              <li>Top 5 habilidades considera posição, estilo de jogo, função real, atributos e habilidades que o jogador já possui.</li>
              <li>Ímpetos são ranqueados por função e aparecem separados das habilidades adicionais.</li>
              <li>Goleiro usa motor separado com Pegador de pênalti, Arremesso longo do goleiro e reposições oficiais.</li>
            </ul>
          </article>
        </div>
      )}


      {tab === 'posicoes' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <p className="kicker">Identidade da carta</p>
            <div className="position-list">
              {cardPositions.map((code, index) => (
                <div key={code}>
                  <strong>{positionPt(code)}</strong>
                  <span>{index === 0 ? 'Posição da carta' : 'Compatível'}</span>
                  <em>{code === card.mainPosition ? `Preservada na carta • ${card.playstyle ?? 'estilo não lido'}` : `Registrada no painel${card.positionRatings[code] ? ` • ${card.positionRatings[code]}` : ''}`}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">Esta seção não é ranking: ela mostra a posição/estilo originais da carta e as posições compatíveis lidas.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Ranking de rendimento real</p>
            <div className="position-list">
              {positionItems.map((item, index) => (
                <div key={item.code}>
                  <strong>{item.label}</strong>
                  <span>{index === 0 ? 'Melhor uso' : item.score >= 90 ? 'Ótima' : item.score >= 82 ? 'Boa' : 'Alternativa'}</span>
                  <em>{item.role}{item.cardRating ? ` • ${item.cardRating}` : ''}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">Aqui sim o app pode recomendar outra posição, mas sem alterar a identidade original da carta.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">GERs lidos</p>
            <div className="data-grid">
              {positionRatings.length ? positionRatings.map(([code, value]) => (
                <div key={code}><span>{positionPt(code)}</span><strong>{value}</strong></div>
              )) : <p className="panel-note">Nenhum GER por posição lido com segurança.</p>}
            </div>
          </article>
        </div>
      )}


      {tab === 'dados' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <p className="kicker">Dados técnicos lidos</p>
            <div className="data-grid">
              <div><span>Posição da carta</span><strong>{card.mainPositionPt}</strong></div>
              <div><span>Estilo de jogo</span><strong>{card.playstyle ?? '—'}</strong></div>
              <div><span>Posição escolhida</span><strong>{usagePositionLabel}</strong></div>
              <div><span>Nível máximo</span><strong>{card.level ?? '—'}</strong></div>
              <div><span>Total de pontos</span><strong>{result.trainingPointsUsed}/{result.trainingPointsTotal}</strong></div>
              <div><span>Origem dos pontos</span><strong>{sourceLabel}</strong></div>
              <div><span>Altura</span><strong>{card.height ? `${card.height} cm` : '—'}</strong></div>
              <div><span>Peso</span><strong>{card.weight ? `${card.weight} kg` : '—'}</strong></div>
              <div><span>Idade</span><strong>{card.age ?? '—'}</strong></div>
              <div><span>Entrada</span><strong>Manual de precisão</strong></div>
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Melhores ímpetos e alertas</p>
            <div className="skill-grid">
              {recommendedImpetos.length ? recommendedImpetos.map((item) => (
                <div key={`${item.name}-${item.tier}`}>
                  <strong>{item.tier === 'ideal' ? 'Ideal' : item.tier === 'alternativo' ? 'Alternativo' : 'Evitar'} • {item.name}</strong>
                  <span>{item.attributes.join(', ')} — {item.reason}</span>
                  <div className="correction-actions">
                    <button type="button" onClick={() => onPromoteImpeto?.(item.name)}><ThumbsUp size={14} /> Priorizar</button>
                    <button type="button" onClick={() => onRejectImpeto?.(item.name)}><Ban size={14} /> Não combina</button>
                  </div>
                </div>
              )) : <p className="panel-note">Nenhum ímpeto recomendado com segurança.</p>}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Ímpetos lidos</p>
            <div className="chip-cloud purple">
              {card.impetos.length ? card.impetos.map((item) => (
                <span key={`${item.name}-${item.value ?? ''}`}>{item.name}{item.value ? ` +${item.value}` : ''}{item.active === false ? ' — inativo' : ''}</span>
              )) : <span>Nenhum ímpeto lido</span>}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Atributos</p>
            <div className="data-grid attributes-grid">
              {attributes.length ? attributes.map(([key, value]) => (
                <div key={key}><span>{attributeNamePt(key)}</span><strong>{value}</strong></div>
              )) : <p className="panel-note">Nenhum atributo lido com segurança.</p>}
            </div>
          </article>
        </div>
      )}

  </>;
}
