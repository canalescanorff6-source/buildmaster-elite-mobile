# R-VIS 0 — Inventário visual + mapa de telas

Status: `INVENTORY_AUDITED`.

Baseline funcional congelado: `27faa2a78e1c59d1d200e3b9a89fb7a0cf98851a`.

Estado do core: `CORE_FROZEN_GATE_B` — R510 continua `PROVISIONAL_UNCALIBRATED / ENGINEERING_SEED / certifiedForFinalWrite=false`; R517 continua fail-closed. Este inventário não autoriza `ENGINE_CERTIFIED`.

## Objetivo

Cumprir o Gate de Transição do Prompt Mestre antes de qualquer nova alteração visual: mapear as superfícies reais do BuildMaster para a sequência R-VIS, identificar o que já existe, o que está parcial e impedir que o redesign apague funções reais ou invente dados para imitar mockups.

O contrato visual continua sendo alta fidelidade ao BuildMaster de referência: navy/obsidiana profunda, ouro metálico e ciano técnico, com aparência mobile-first no APK e responsiva na web.

## Classificação canônica

- `EXISTE`: a função e a superfície visual real já estão presentes no código atual.
- `PARCIAL`: existe implementação relevante, mas falta um gate de fechamento/aceitação que prove a cobertura completa exigida pelo Prompt Mestre.
- `MISSING_FUNCTIONAL`: a referência exige uma função legítima que não existe no produto e precisaria ser implementada de verdade antes de ser exibida.
- `APENAS_MOCKUP`: elemento visual da referência sem fonte funcional real; não pode aparecer como se fosse dado ou função existente.

## Mapa R-VIS → produto real

| Etapa | Área | Status | Implementação real auditada | Contrato preservado |
| --- | --- | --- | --- | --- |
| R-VIS 0 | Inventário visual + mapa de telas | **EXISTE** | Este documento + navegação canônica `src/lib/appNavigationR127.ts` | Nenhuma tela importante pode desaparecer; cada referência deve apontar para superfície real ou ficar explicitamente indisponível. |
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
| R-VIS 11 | Polimento final | **PARCIAL** | `src/app/v44-buildmaster-reference.css`, `bm-r530-final-polish`, `quality:visual`, regressões R201–R204 e responsivas existentes | R530 existe visualmente, mas falta um único gate de fechamento que prove R521–R530 + rotas reais + core congelado + CI web/APK em conjunto. |

## Navegação/superfícies que não podem sumir

O modelo canônico atual expõe grupos principais `inicio`, `jogadores`, `mapeamento`, `time`, `partidas` e `ajustes`, além das superfícies `menu`, `buscar`, `leitor`, `manual`, `resultado` e `cofre`.

Dentro de Jogadores, os workspaces reais são `visao-geral`, `leitor`, `manual`, `resultado` e `cofre`.

Dentro do Cofre, as áreas reais são `jogadores`, `organizar`, `comparar` e `backup/proteção`.

Configurações possuem visão geral, evolução, experiência, aparência, desempenho, segurança, suporte, comunidade, comercial, publicação, backup, atualizações e contas, com exibição condicionada por modo/role onde aplicável.

O fechamento visual precisa preservar essas superfícies mesmo quando uma referência principal não mostra todas elas.

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

## Proteções existentes encontradas

O repositório já possui testes visuais e de arquitetura úteis para o fechamento:

- `quality:visual` verifica contraste, foco, touch target, reduced motion, forced colors e regiões ao vivo;
- R201 protege a fundação visual, presets e tema claro;
- R202 protege Home/Dashboard e impede que a Central vire writer;
- R203 protege Reader/Resultado e congela o SHA-256 de R119;
- R204 protege Cofre e impede writers diretos;
- regressões v34 incluem responsividade, touch/scroll/menu e temas;
- o gate de PR executa R419 e R128 antes de TypeScript/build.

A lacuna restante não é “fazer o redesign do zero”. É **fechar R530 como acceptance gate único do redesign de referência**, conectando essas proteções e as superfícies R521–R529.

## Resultado R-VIS 0

**R-VIS 0 concluído por auditoria real da `main`.**

Não há `MISSING_FUNCTIONAL` identificado nas dez superfícies principais do Prompt Mestre neste checkpoint. O único estado `PARCIAL` é R-VIS 11, porque falta uma regressão de fechamento única que garanta cobertura R521–R530, todas as superfícies principais e o baseline funcional congelado.

Próxima etapa exata: executar o plano `docs/superpowers/plans/2026-10-02-buildmaster-r-vis-11-closure.md` após revisão, começando por teste RED do gate R530 e sem alterar o core.