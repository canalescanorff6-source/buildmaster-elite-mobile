# R138 — Posição real canônica + fachada única de produção

## Objetivo

Eliminar a confusão residual entre **bestPosition** (diagnóstico/posição que o analisador considera melhor) e **usagePosition** (posição em que o usuário realmente decidiu usar a carta), e impedir que a UI conheça o pipeline interno de análise.

## Falha estrutural corrigida

Desde a R125, o Clean Slate já calculava a ficha pela posição real de uso. Porém alguns subsistemas posteriores ainda usavam `result.bestPosition.code` para:

- chave do Cofre;
- assinatura da build;
- registro e limpeza de partidas;
- calibração R135/R136;
- memória longitudinal v40.60;
- laboratórios v40.50/v37.60;
- filtro e detector de duplicatas do Cofre.

Isso podia fazer duas fichas da mesma carta em funções diferentes colidirem ou compartilharem histórico quando `bestPosition` permanecia igual.

## Nova fonte única

`src/lib/analysisUsagePositionR138.ts`

Prioridade:

1. `cleanSlate2027R119.usagePosition`;
2. selo R128;
3. selo R126;
4. `bestPosition.code` apenas como compatibilidade legada;
5. posição natural como último fallback.

O helper não altera a identidade intrínseca da carta. Carta e posição de uso continuam conceitos separados.

## Cofre

A chave canônica passa a ser de fato:

`identidade da carta + posição real de uso`

Também foram corrigidos:

- filtro por posição;
- agrupamento por posição;
- assinatura usada para detectar duplicatas exatas;
- busca por posição.

Assim uma carta usada como CB e DMF pode coexistir no Cofre mesmo se `bestPosition` for CF nas duas análises.

## Partidas e aprendizado

Os seguintes caminhos passaram a usar a posição real canônica:

- criação de `MatchValidationRecord`;
- `buildSignature`;
- repositório R137;
- calibração R135;
- calibração temporal/contextual R136;
- memória longitudinal v40.60;
- validação A/B v40.50;
- validação v37.60;
- painel profissional de evidência.

Além disso, o fallback de histórico por **nome do jogador** foi removido da validação de carta. Evidência de outra edição do mesmo atleta não pode ser promovida para a carta atual apenas porque o nome coincide.

## Fachada de produção R138

`src/modules/analysis/productionOrchestratorR138.ts`

A UI agora usa somente:

- `createProductionAnalysisR138`;
- `rebuildProductionAnalysisR138`;
- `ensureProductionAnalysisR138`.

`CardVisionApp.tsx` não importa mais:

- `applyCompleteCardIntelligence`;
- `analyzeCardForProductionR128`;
- `ensureCurrentProductionAnalysisR128`.

A fachada pública de análise também deixou de exportar `analyzeCard` e `parseCard` crus.

O Clean Slate R125 continua sendo o único escritor final de ficha, Top 5 e Ímpeto. R138 apenas corrige roteamento e identidade de uso.

## Regressões

Novo teste:

`tests/v40-80-r138-canonical-usage-production-facade-regression.ts`

Protege:

- `bestPosition != usagePosition`;
- chaves distintas do Cofre para CB/DMF da mesma carta;
- assinatura de build distinta por função real;
- partida salva na posição de uso;
- reset por função sem apagar outra função;
- R135/R136 isoladas pela posição real;
- detector de duplicata/filtro do Cofre usando a posição real;
- ausência de fallback por nome;
- UI sem acesso direto ao pipeline interno.

## Resultado

R138 consolida o contrato:

**Jogador → Carta → Posição real de uso → Build → Partidas daquela função → calibração → Clean Slate**

`bestPosition` continua disponível como diagnóstico, mas não é mais tratado como sinônimo da função escolhida pelo usuário.
