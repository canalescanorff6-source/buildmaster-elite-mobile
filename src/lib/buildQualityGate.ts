import type { AnalysisResult, TrainingPlan } from './analyzerDomain';

export type BuildQualityStatus = 'ready' | 'review' | 'blocked';
export type BuildQualitySeverity = 'pass' | 'warning' | 'block';
export type BuildQualityTarget = 'resumo' | 'ficha' | 'habilidades' | 'treinador' | 'leitura' | 'validacao' | 'dados';

export type BuildQualitySignal = {
  id: string;
  label: string;
  detail: string;
  severity: BuildQualitySeverity;
  weight: number;
  target: BuildQualityTarget;
  actionLabel: string;
};

export type BuildQualityReport = {
  score: number;
  status: BuildQualityStatus;
  title: string;
  summary: string;
  readyToSave: boolean;
  blockers: BuildQualitySignal[];
  warnings: BuildQualitySignal[];
  passed: BuildQualitySignal[];
  signals: BuildQualitySignal[];
  nextActions: BuildQualitySignal[];
};

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function sumPlan(plan: Partial<TrainingPlan> | null | undefined) {
  return Object.values(plan ?? {}).reduce((total, value) => total + (Number.isFinite(Number(value)) ? Number(value) : 0), 0);
}

function signal(
  id: string,
  label: string,
  detail: string,
  severity: BuildQualitySeverity,
  weight: number,
  target: BuildQualityTarget,
  actionLabel: string
): BuildQualitySignal {
  return { id, label, detail, severity, weight, target, actionLabel };
}

function distinctPlans(result: AnalysisResult) {
  return new Set(result.buildVariants.map((variant) => JSON.stringify(variant.training))).size;
}

export function buildBuildQualityGate(result: AnalysisResult): BuildQualityReport {
  const card = result.parsed;
  const pointsUsed = Number(result.trainingPointsUsed || 0);
  const pointsTotal = Number(result.trainingPointsTotal || 0);
  const pointsRemaining = Number(result.trainingPointsRemaining || 0);
  const trainingCost = sumPlan(result.trainingCost);
  const native = new Set(card.nativeSkills.map(normalize));
  const recommended = result.recommendedSkills.slice(0, 5);
  const duplicatedSkills = recommended.filter((item) => native.has(normalize(item)));
  const repeatedRecommendations = recommended.length - new Set(recommended.map(normalize)).size;
  const attributeCount = Object.values(card.attributes).filter((value) => Number.isFinite(Number(value))).length;
  const minimumAttributes = card.mainPosition === 'GK' ? 5 : 8;
  const variantsWithinBudget = result.buildVariants.every((variant) => variant.pointsUsed <= pointsTotal);
  const hasUnknownName = /nao identificado|não identificado|jogador desconhecido/i.test(card.playerName);
  const hasFunction = Boolean(result.teamMap?.functionLabel && result.advancedTacticalFunction?.position);
  const validationLevel = result.validation?.level ?? 'review';
  const confidence = Number(card.confidence || 0);
  const uncertaintyCount = result.deepAnalysis?.uncertainFields?.length ?? 0;
  const variantCount = result.buildVariants.length;
  const variantDiversity = distinctPlans(result);
  const officialSkillCatalog = result.specialSkillsAnalysis?.officialCatalogOnly !== false;

  const signals: BuildQualitySignal[] = [];

  if (pointsTotal <= 0) {
    signals.push(signal('budget-missing', 'Orçamento de pontos ausente', 'Informe os pontos totais da carta antes de confiar na distribuição.', 'block', 15, 'ficha', 'Revisar pontos'));
  } else if (pointsUsed > pointsTotal || pointsRemaining < 0) {
    signals.push(signal('budget-overflow', 'Distribuição ultrapassa o limite', `${pointsUsed}/${pointsTotal} pontos usados. A ficha não pode ser salva assim.`, 'block', 15, 'ficha', 'Corrigir ficha'));
  } else if (trainingCost && Math.abs(trainingCost - pointsUsed) > 1) {
    signals.push(signal('budget-cost', 'Custo e total precisam de conferência', `O custo calculado foi ${trainingCost}, mas o resumo registra ${pointsUsed}.`, 'warning', 15, 'ficha', 'Conferir custo'));
  } else {
    signals.push(signal('budget-ok', 'Orçamento respeitado', `${pointsUsed}/${pointsTotal} pontos usados, com ${Math.max(0, pointsRemaining)} restante(s).`, 'pass', 15, 'ficha', 'Abrir ficha'));
  }

  if (validationLevel === 'blocked') {
    signals.push(signal('validation-blocked', 'Leitura bloqueada pela validação', 'Há dados essenciais incompatíveis ou não confirmados.', 'block', 15, 'validacao', 'Abrir validação'));
  } else if (validationLevel === 'review' || !result.validation?.confirmed) {
    signals.push(signal('validation-review', 'Validação ainda pede revisão', 'A ficha pode ser analisada, mas os campos destacados devem ser confirmados.', 'warning', 15, 'validacao', 'Revisar validação'));
  } else {
    signals.push(signal('validation-ok', 'Validação concluída', 'Os dados essenciais foram liberados pelo motor de precisão.', 'pass', 15, 'validacao', 'Ver validação'));
  }

  if (hasUnknownName || !card.mainPosition || !result.bestPosition?.code) {
    signals.push(signal('identity-missing', 'Identidade da carta incompleta', 'Nome ou posição principal não foram reconhecidos com segurança.', 'block', 12, 'leitura', 'Revisar leitura'));
  } else if (!card.playstyle) {
    signals.push(signal('identity-style', 'Estilo de jogo não confirmado', `${card.playerName} está com a posição definida, mas o estilo ainda está em aberto.`, 'warning', 12, 'leitura', 'Confirmar estilo'));
  } else {
    signals.push(signal('identity-ok', 'Identidade preservada', `${card.playerName} • ${card.mainPositionPt} • ${card.playstyle}.`, 'pass', 12, 'leitura', 'Ver leitura'));
  }

  if (confidence < 55) {
    signals.push(signal('confidence-low', 'Confiança de leitura muito baixa', `Confiança atual: ${confidence}%. Refaça o print ou confirme os campos manualmente.`, 'block', 12, 'leitura', 'Corrigir leitura'));
  } else if (confidence < 80 || uncertaintyCount > 2) {
    signals.push(signal('confidence-review', 'Leitura precisa de conferência', `Confiança ${confidence}% e ${uncertaintyCount} campo(s) incerto(s).`, 'warning', 12, 'leitura', 'Conferir campos'));
  } else {
    signals.push(signal('confidence-ok', 'Leitura consistente', `Confiança ${confidence}% e baixa quantidade de incertezas.`, 'pass', 12, 'leitura', 'Ver evidências'));
  }

  if (!recommended.length) {
    signals.push(signal('skills-empty', 'Nenhuma habilidade adicional segura', 'O motor não encontrou recomendações oficiais suficientemente confiáveis.', 'warning', 10, 'habilidades', 'Abrir habilidades'));
  } else if (duplicatedSkills.length || repeatedRecommendations > 0 || !officialSkillCatalog) {
    const detail = duplicatedSkills.length
      ? `Já presentes na carta: ${duplicatedSkills.join(', ')}.`
      : repeatedRecommendations > 0
        ? 'Existem recomendações repetidas na lista final.'
        : 'A lista precisa ser reconferida com o catálogo oficial.';
    signals.push(signal('skills-review', 'Habilidades precisam de revisão', detail, 'warning', 10, 'habilidades', 'Revisar habilidades'));
  } else {
    signals.push(signal('skills-ok', 'Top 5 oficial sem repetição', `${recommended.length} habilidade(s) recomendada(s), sem duplicar as nativas.`, 'pass', 10, 'habilidades', 'Ver habilidades'));
  }

  if (attributeCount < Math.max(3, Math.floor(minimumAttributes / 2))) {
    signals.push(signal('attributes-low', 'Poucos atributos disponíveis', `Apenas ${attributeCount} atributo(s) foram reconhecidos. Isso reduz a precisão da ficha.`, 'block', 10, 'dados', 'Completar atributos'));
  } else if (attributeCount < minimumAttributes) {
    signals.push(signal('attributes-review', 'Cobertura parcial de atributos', `${attributeCount} atributo(s) reconhecido(s); o ideal para esta posição é pelo menos ${minimumAttributes}.`, 'warning', 10, 'dados', 'Revisar dados'));
  } else {
    signals.push(signal('attributes-ok', 'Boa cobertura de atributos', `${attributeCount} atributo(s) sustentam a recomendação.`, 'pass', 10, 'dados', 'Ver atributos'));
  }

  if (!hasFunction || (result.advancedTacticalFunction?.compatibilityScore ?? 0) < 45) {
    signals.push(signal('tactics-review', 'Encaixe tático frágil', 'A função real ou a compatibilidade com a posição escolhida precisa ser revisada.', 'warning', 8, 'treinador', 'Abrir tática'));
  } else {
    signals.push(signal('tactics-ok', 'Função tática definida', `${result.teamMap.functionLabel} • compatibilidade ${result.advancedTacticalFunction.compatibilityScore}/100.`, 'pass', 8, 'treinador', 'Ver função'));
  }

  if (!variantCount || !variantsWithinBudget) {
    signals.push(signal('variants-invalid', 'Variações de ficha inconsistentes', 'As alternativas não foram geradas corretamente ou alguma ultrapassa o orçamento.', 'block', 8, 'ficha', 'Recalcular fichas'));
  } else if (variantCount < 3 || variantDiversity < 2) {
    signals.push(signal('variants-review', 'Pouca variedade entre as fichas', `${variantCount} variante(s) e ${variantDiversity} distribuição(ões) realmente diferente(s).`, 'warning', 8, 'ficha', 'Comparar fichas'));
  } else {
    signals.push(signal('variants-ok', 'Fichas alternativas válidas', `${variantCount} opções dentro do orçamento e ${variantDiversity} distribuições distintas.`, 'pass', 8, 'ficha', 'Comparar fichas'));
  }

  if (card.trainingPointSource === 'FALLBACK') {
    signals.push(signal('source-fallback', 'Pontos vieram de valor de segurança', 'Confirme nível ou pontos totais para evitar uma ficha baseada em fallback.', 'warning', 5, 'leitura', 'Confirmar pontos'));
  } else {
    signals.push(signal('source-ok', 'Origem dos pontos identificada', `Fonte: ${card.trainingPointSource ?? 'motor validado'}.`, 'pass', 5, 'leitura', 'Ver origem'));
  }

  const weightedTotal = signals.reduce((total, item) => total + item.weight, 0);
  const weightedScore = signals.reduce((total, item) => {
    const factor = item.severity === 'pass' ? 1 : item.severity === 'warning' ? 0.55 : 0;
    return total + item.weight * factor;
  }, 0);
  const score = weightedTotal ? Math.max(0, Math.min(100, Math.round((weightedScore / weightedTotal) * 100))) : 0;
  const blockers = signals.filter((item) => item.severity === 'block');
  const warnings = signals.filter((item) => item.severity === 'warning');
  const passed = signals.filter((item) => item.severity === 'pass');
  const status: BuildQualityStatus = blockers.length ? 'blocked' : warnings.length || score < 85 ? 'review' : 'ready';

  const title = status === 'ready'
    ? 'Ficha pronta para salvar e usar'
    : status === 'blocked'
      ? 'Ficha bloqueada até corrigir os pontos críticos'
      : 'Ficha boa, mas ainda merece uma revisão rápida';
  const summary = status === 'ready'
    ? 'Orçamento, identidade, leitura, habilidades e encaixe tático passaram no controle final.'
    : status === 'blocked'
      ? `${blockers.length} problema(s) impedem um resultado confiável. Corrija antes de salvar.`
      : `${warnings.length} atenção(ões) podem melhorar a precisão antes de fechar a ficha.`;

  return {
    score,
    status,
    title,
    summary,
    readyToSave: blockers.length === 0,
    blockers,
    warnings,
    passed,
    signals,
    nextActions: [...blockers, ...warnings].slice(0, 4)
  };
}
