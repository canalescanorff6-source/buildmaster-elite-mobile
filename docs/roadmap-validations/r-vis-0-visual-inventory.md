# R-VIS 0 — Inventário visual + mapa de telas

Status: `INVENTORY_AUDITED_R_VIS_11_CLOSED`.

Baseline funcional congelado: `27faa2a78e1c59d1d200e3b9a89fb7a0cf98851a`.

Implementação de fechamento validada: `b72d3c547c532b2e77dec7b75f51203271c7328a` — Run 404 (`37071391733`) integralmente GREEN.

Estado do core: `CORE_FROZEN_GATE_B` — R510 continua `PROVISIONAL_UNCALIBRATED / ENGINEERING_SEED / certifiedForFinalWrite=false`; R517 continua fail-closed. Este inventário não autoriza `ENGINE_CERTIFIED`.

## Objetivo

Cumprir o Gate de Transição do Prompt Mestre antes de qualquer nova alteração visual: mapear as superfícies reais do BuildMaster para a sequência R-VIS, identificar o que já existe e impedir que o redesign apague funções reais ou invente dados para imitar mockups.

O contrato visual continua sendo alta fidelidade ao BuildMaster de referência: navy/obsidiana profunda, ouro metálico e ciano técnico, com aparência mobile-first no APK e responsiva na web.

## Classificação canônica

- `EXISTE`: a função e a superfície visual real já estão presentes no código atual.
- `FECHADO`: além de existir, possui gate preventivo executável e foi comprovado no CI.
- `PARCIAL`: existe implementação relevante, mas falta um gate de fechamento/aceitação que prove a cobertura completa exigida pelo Prompt Mestre.
- `MISSING_FUNCTIONAL`: a referência exige uma função legítima que não existe no produto e precisaria ser implementada de verdade antes de ser exibida.
- `APENAS_MOCKUP`: elemento visual da referência sem fonte funcional real; não pode aparecer como se fosse dado ou função existente.

## Mapa R-VIS → produto real

| Etapa | Área | Status | Implementação real auditada | Contrato preservado |
| --- | --- | --- | --- | --- |
| R-VIS 0 | Inventário visual + mapa de telas | **FECHADO** | Este documento + navegação canônica `src/lib/appNavigationR127.ts` | Nenhuma tela importante pode desaparecer; cada referência deve apontar para superfície real ou ficar explicitamente indisponível. |
| R-VIS 1 | Design System + assets | **EXISTE** | `src/app/v41-premium-product.css`, `src/app/v44-buildmaster-reference.css`, `src/components/PremiumBrand.tsx`, `BuildMasterMark` | Tokens navy/obsidiana, ouro e ciano; presets e tema claro preservados; sem fonte/asset fictício. |
| R-VIS 2 | App Shell | **EXISTE** | `src/components/CardVisionAppChromeR185.tsx`, `src/components/RefinedNavigation.tsx`, `PremiumContextBar`, `src/app/layout.tsx` | R521: splash, topbar, conta, navegação, menu mobile, safe areas, loading/erro; sem autoridade de análise. |
| R-VIS 3 | Home / Dashboard | **EXISTE** | `src/modules/core/IntegratedHomePanel.tsx` | R522: dashboard usa contadores, time, última ficha e recomendações reais; não hardcoda métricas de demonstração. |
| R-VIS 4 | Leitura / OCR | **EXISTE** | `src/components/CardVisionApp.tsx`, `ReaderImageSourceCardV4010`, `ReaderLiveProgressCardV3840`, `TotalCardReaderPanel`, `OcrVisionCenter`, `EfhubVisualCalibrator` | R523: imagem/câmera, crop, progresso, qualidade, conflitos, confiança e revisão; reader/core não é reescrito pela UI. |
| R-VIS 5 | Resultado do jogador | **EXISTE** | `src/components/result/ResultWorkspace.tsx`, `UnifiedPerformanceV3920Panel`, `GameplayDnaProfilesCard`, `CalibrationV32Card`, `PrecisionBuildPanel` | R524: ficha, PP, DNA, estabilidade, evidência e ações usam `AnalysisResult` real; certificado precisa permanecer honesto. |
| R-VIS 6 | Skills + Ímpeto | **EXISTE** | `src/components/result/ResultWorkspace.tsx` | R525: Top 5, habilidades existentes, substituições, redundância, Ímpeto, vaga/Token e evidência vêm do estado real do motor. |
| R-VIS 7 | Táticas | **EXISTE** | `src/modules/tactical-studio/MetaFormationStudioV3832.tsx`, `TeamFullMapPanel`, guia tático no `CardVisionApp` | R526: formações, estilos, posições, banco, recomendações, salvar/restaurar e exportar; não altera ficha para caber na formação. |
| R-VIS 8 | Cofre / coleção | **EXISTE** | `src/components/vault/CardVisionVaultWorkspaceR191.tsx`, `CleanVaultV3800` | R527: busca, filtros, favoritos, organização, comparação, lixeira, backup/cloud usam registros reais. |
| R-VIS 9 | Exportar / compartilhar | **EXISTE** | `src/components/CompactSharePanel.tsx`, aba `exportar` de `ResultWorkspace.tsx`, exportação tática | R528: Web Share/clipboard/PNG-SVG/HTML/impressão-PDF apenas quando suportado; exportar não recalcula a ficha. |
| R-VIS 10 | Perfil / conta / admin | **EXISTE** | `src/components/settings/CardVisionSettingsWorkspaceR190.tsx`, `AccountAdminPanel`, `IdentityAppearancePanel` | R529: conta, licença, aparelhos, aparência, desempenho, segurança, backup, atualizações e admin sem promessas falsas. |
| R-VIS 11 | Polimento final | **FECHADO** | `src/app/v44-buildmaster-reference.css`, `bm-r530-final-polish`, `test:r530`, `quality:visual`, R201–R204, v3400, bundle e R534 | R530 prova R521–R530, superfícies reais, responsividade/acessibilidade, contrato R534 e fingerprint congelado de R119 no PR/release. |

## Navegação/superfícies que não podem sumir

O modelo canônico atual expõe grupos principais `inicio`, `jogadores`, `mapeamento`, `time`, `partidas` e `ajustes`, além das superfícies `menu`, `buscar`, `leitor`, `manual`, `resultado` e `cofre`.

Dentro de Jogadores, os workspaces reais são `visao-geral`, `leitor`, `manual`, `resultado` e `cofre`.

Dentro do Cofre, as áreas reais são `jogadores`, `organizar`, `comparar` e `backup/proteção`.

Configurações possuem visão geral, evolução, experiência, aparência, desempenho, segurança, suporte, comunidade, comercial, publicação, backup, atualizações e contas, com exibição condicionada por modo/role onde aplicável.

O fechamento visual preserva essas superfícies mesmo quando uma referência principal não mostra todas elas.

## Estados obrigatórios

Cada superfície considerada concluída precisa manter, quando aplicável:

- estado vazio;
- loading/progresso;
- erro recuperável;
- conflito/revisão;
- modo básico e avançado;
- navegação por toque, teclado e foco visível;
- safe areas Android;
- movimento reduzido;
- tema escuro e temas/presets já suportados;
- layout web responsivo;
- ausência de hardcode de demonstração.

## Elementos proibidos como maquiagem visual

Não criar apenas para combinar com a referência:

- número de cartas, favoritos, raridade, confiança, PP ou score sem fonte real;
- valor de mercado/patrimônio de carta;
- status `ENGINE_CERTIFIED` ou “Ficha certificada” enquanto R510/R517 não autorizarem;
- habilidades, Ímpetos, posições, estilos ou resultados inexistentes no motor;
- botões que pareçam funcionais sem ação real suportada;
- exportação/compartilhamento que afirme gerar formato não suportado.

## Proteções executáveis do fechamento

- `test:r530` verifica R521–R530, rotas/superfícies canônicas, ausência de writer direto nas superfícies visuais, fiação PR/release e SHA-256 congelado de R119;
- `quality:visual` verifica contraste, foco, touch target, reduced motion, forced colors e regiões ao vivo;
- R201 protege a fundação visual, presets e tema claro;
- R202 protege Home/Dashboard e impede que a Central vire writer;
- R203 protege Reader/Resultado e congela o SHA-256 de R119;
- R204 protege Cofre e impede writers diretos;
- v34 protege responsividade, touch/scroll/menu e temas;
- R534 agora preserva 98 grupos no diagnóstico completo, incluindo `test:r530`, com quatro shards disjuntos/determinísticos;
- o gate de PR executa R419 e R128 antes de TypeScript/build.

## Evidência TDD / CI

- RED: Run 392 (`37070479029`) falhou exatamente porque `package.json` ainda não expunha `test:r530`;
- GREEN de fechamento: Run 404 (`37071391733`) no SHA `b72d3c547c532b2e77dec7b75f51203271c7328a` passou integralmente;
- no Run 404 passaram R530, R201–R204, `quality:visual`, v3400, bundle, R534, R419, R128, TypeScript raiz, TypeScript completo do APK e build de produção;
- o orçamento de fonte passou, porém está em 98,9%; futuras expansões devem priorizar modularização antes de consumir o teto.

## Resultado R-VIS 0 / R-VIS 11

**R-VIS 0 e R-VIS 11 estão fechados por auditoria + regressão executável.**

Não há `MISSING_FUNCTIONAL` identificado nas dez superfícies principais do Prompt Mestre neste checkpoint. O redesign existente foi preservado; o fechamento adicionou proteção executável e documentação, sem reescrever as telas nem alterar a autoridade funcional do core.

O próximo requisito antes de integrar na `main` é apenas o CI do head documental final do PR #82, seguido pelo pipeline real pós-merge do APK.