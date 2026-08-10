# BuildMaster v38.40 r8 — Auditoria completa de estabilidade, rotas, rede e cores

## Escopo

Auditoria executada sobre o pacote `buildmaster-elite-mobile(20260810-225729).7z`, sem usar uma versão anterior como base.

Foram revisados código TypeScript/TSX, CSS/tema, rotas, contratos interativos, OCR, motores de ficha, persistência, Supabase/login, atualização, Java nativo, publicação e regressões críticas da linha 38/39.

## Defeitos comprovados e corrigidos

### 1. Rota inicial incorreta dentro do próprio pacote

O arquivo `src/app/page.tsx` entregue no pacote estava contendo a página pública de exclusão de conta. O CI possuía um autorreparo que restaurava a rota antes de alguns testes, escondendo o defeito no artefato-fonte.

Correção:
- rota raiz persistida com `AppShellSafetyBoundaryV3930` + `AuthGate` + `CardVisionApp`;
- auditoria passa a comparar `src/app/page.tsx` com o template canônico;
- `prebuild` e `prevercel-build` executam reparo preventivo das rotas antes de qualquer build.

### 2. Proteção de tema escuro não ativava em parte do app

As proteções globais de contraste usavam `[data-theme='dark']`, mas o elemento principal expunha apenas a classe `theme-dark`. Assim, algumas regras destinadas a impedir painéis brancos não eram aplicadas.

Correção:
- `CardVisionApp` agora expõe `data-theme={appTheme}`;
- nova folha `v38-stability-theme.css` é carregada por último;
- painéis, cards, modais, gavetas, campos, selects, placeholders e componentes antigos recebem cores coerentes no tema escuro;
- avisos, estados de erro e níveis arquiteturais recebem contraste próprio;
- o tema claro continua separado e não é forçado para escuro.

### 3. Chamadas de rede sem prazo explícito

Alguns módulos ainda usavam `fetch()` direto e podiam manter uma tela esperando indefinidamente em rede instável.

Correção:
- criado `src/lib/fetchWithTimeout.ts`;
- catálogo global Pro: 18 s;
- registro mundial Pro: 18 s;
- pesquisa Pro: 22 s;
- canais de atualização: 20 s;
- regras remotas no app: 20 s;
- solicitação pública de exclusão: 25 s;
- histórico de atualização: 20 s;
- autenticação mantém seu timeout próprio existente de 30 s;
- chamadas nativas de atualização já preservam `connectTimeout`/`readTimeout`.

A auditoria passa a impedir novos `fetch()` sem prazo em módulos ativos, salvo os wrappers/fluxos que já controlam timeout diretamente.

## Auditoria visual

Foram inspecionadas 17 folhas CSS, com aproximadamente 27,8 mil linhas de estilos acumulados pelas versões do projeto.

Há regras antigas com fundos claros por compatibilidade com o tema claro. Elas não foram apagadas indiscriminadamente. Em vez disso, a camada final r8 garante que, quando `data-theme='dark'`, essas superfícies sejam sobrescritas pelo conjunto de tokens escuros atual.

A verificação automática de visual/acessibilidade agora também exige:
- `data-theme={appTheme}` na árvore principal;
- folha r8 importada após a folha de contraste do leitor;
- `color-scheme: dark` no tema escuro;
- guardas de contraste para componentes legados relevantes.

## Validações executadas

Aprovadas após as correções:
- sintaxe: 418 arquivos TypeScript/TSX;
- contratos interativos: 775 botões;
- imagens: 32 com texto alternativo;
- visual e acessibilidade;
- rotas críticas sem necessidade de autorreparo;
- configuração TypeScript raiz;
- tipos do recorte OCR;
- contrato preventivo do CI;
- guardas de versão;
- Java nativo gerado;
- pré-voo de produção: 138 verificações;
- pré-voo Play: 27 verificações;
- auditoria estrutural: 127 verificações;
- v38.40: 15/15 verificações;
- regressões críticas v38.50, v38.60, v38.70, v38.80, v38.90, v39.00, v39.20, v39.30, v39.40 e v39.50.

Também foi iniciada a bateria geral histórica. Ela aprovou as etapas executadas até a linha v31 durante a janela local, mas a execução monolítica é longa e atingiu o limite do ambiente; os testes críticos posteriores foram executados separadamente conforme listado acima.

## Limitações da validação local

O arquivo enviado não contém `node_modules`. Portanto, `quality:dependencies`, o typecheck raiz completo dependente dos pacotes instalados e o build Next/Android completo não podem ser validados neste ambiente sem executar `npm ci`.

O diagnóstico rápido apresentou somente essa falha de ambiente: 13 dependências esperadas ausentes em `node_modules`. Os outros 14 grupos do diagnóstico rápido foram aprovados.

O GitHub Actions deve executar `npm ci` antes do typecheck/build. Um APK em aparelho real continua sendo a validação final para comportamento específico de WebView, memória, GPU, fabricante e Android.

## Alertas não bloqueantes

- `src/components/CardVisionApp.tsx`: 4196 linhas;
- `src/lib/analyzer.ts`: 3432 linhas;
- fonte TypeScript ocupa cerca de 93,6% do orçamento configurado;
- dois módulos de formação aparecem como não alcançáveis na árvore ativa, mas são preservados por compatibilidade/testes: `MarquesFormationStudio.tsx` e `metaFormationCatalog.ts`.

Esses pontos são dívida de modularização e não foram refatorados nesta correção para não introduzir regressão em uma versão focada em estabilidade.

## Resultado

A r8 corrige defeitos comprovados de rota, ativação do tema/contraste e espera infinita em chamadas de rede, mantendo as correções anteriores de login, OCR por quadrados, ficha por posição, habilidades e Ímpetos.
