# R142 — Analyzer Boundary + Final Build Diagnostics

## Objetivo
Reduzir o monólito `analyzer.ts` sem alterar a autoridade competitiva e remover trabalho provisório que não participa da decisão final do Clean Slate.

## Modularização
- `analyzerPositionCoreR142.ts` recebeu o núcleo de score funcional de posição, prioridade por estilo, posição principal, preenchimento determinístico de atributos ausentes, PRI e encaixe tático.
- `analyzer.ts` caiu de aproximadamente 2.765 para 2.384 linhas.
- O novo módulo é somente leitura/score. Ele não escreve progressão, Top 5 ou Ímpeto.

## Produção enxuta
`analyzeCard()` continua em modo FULL para regressões e diagnósticos históricos.

A produção usa `analyzeCardProductionBaseR142()`. Nesse caminho, a busca de variantes provisórias cai de centenas de candidatos para no máximo três bases iniciais. O Clean Slate continua sendo executado integralmente e permanece como único escritor final.

Em uma carta de controle desta release:
- analyzer FULL: 245 simulações provisórias;
- base de produção R142: 3 simulações provisórias;
- progressão final: idêntica;
- Top 5: idêntico;
- Ímpeto: idêntico;
- score Clean Slate: idêntico.

Benchmark local do pipeline completo no mesmo ambiente, após aquecimento:
- R141: mediana ~352 ms;
- R142: mediana ~330 ms.

O ganho total é moderado porque o Clean Slate continua sendo o maior custo e não teve seu beam reduzido nesta release. A prioridade foi não sacrificar qualidade card-specific por velocidade.

## Diagnósticos finais sincronizados
Antes da R142, o comparador/Advanced Optimizer podia ter sido calculado sobre a ficha provisória do analyzer e depois a progressão ser substituída pelo Clean Slate.

`finalBuildDiagnosticsR142.ts` sincroniza os painéis de comparação com a ficha realmente selada:
- primeira variante = progressão final Clean Slate;
- vencedor = `Ficha Clean Slate — final`;
- pontos usados/restantes = orçamento final;
- score/eficiência do painel usam a autoridade final quando disponíveis;
- posição exibida = posição real canônica de uso.

A sincronização não reotimiza e não pode mudar progressão, Top 5 ou Ímpeto.

## Migração barata
Fichas R141 ou anteriores podem possuir outputs R128 ainda válidos, mas não o selo de diagnóstico R142. `ensureCurrentProductionAnalysisR128()` agora distingue:
- outputs + evidência + diagnóstico atuais: retorna sem trabalho;
- outputs/evidência atuais, diagnóstico antigo: sincroniza apenas o diagnóstico;
- outputs/evidência antigos: executa a cadeia oficial e depois sincroniza.

Assim abrir uma ficha antiga não força recálculo competitivo quando somente o painel visual está desatualizado.

## Invariantes preservadas
- Clean Slate R125/R119 continua como único escritor final.
- Overall/GER não entra na decisão.
- `usagePosition` continua canônica.
- R131–R134 continuam protegendo evidência OCR.
- R135/R136 continuam calibrando somente retorno marginal.
- R138/R139 continuam sendo fachada/lifecycle de produção/Cofre.
- R140/R141 continuam garantindo persistência confirmada e backup/cloud seguro.

## Validação
- equivalência R141 × R142 confirmada para progressão, Top 5, Ímpeto, posição e score Clean Slate;
- R125 → R142 aprovadas em blocos;
- typecheck v40.80 aprovado;
- auditoria 127/127;
- preflight produção 138/138;
- preflight Play 27/27;
- sintaxe, contratos interativos e acessibilidade aprovados.
