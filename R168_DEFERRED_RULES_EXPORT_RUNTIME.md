# R168 — Deferred Rules + Export Runtime

## Objetivo
Retirar do caminho estático inicial operações acionadas exclusivamente por interação do usuário: atualização/restauração de regras contínuas e exportações HTML/Markdown/PNG/SVG/impressão.

## Fronteira criada
Novo módulo leve:

- `src/modules/runtime/cardVisionDeferredActionsR168.ts`

Ele mantém duas promises memoizadas:

- `loadContinuousRulesRuntimeR168()`
- `loadCardVisionExportRuntimeR168()`

Os módulos pesados são carregados apenas por `import()` dinâmico.

## Módulos removidos do startup

- `src/lib/continuousRulesV3770.ts`
- `src/modules/builds/buildReportExport.ts`
- `src/lib/premiumCleanResultV3810.ts`
- `src/modules/export/clientTextExportR129.ts`

O tipo `PremiumCleanExportFormat` permanece apenas como `import type`, sem custo de runtime.

## Semântica preservada
A R168 não cria nova autoridade de regras nem novo exportador. Os handlers do `CardVisionApp` continuam chamando diretamente, após carregamento lazy:

- `activateContinuousRulePackV3770`
- `sanitizeContinuousRulePackV3770`
- `computeRulePackChecksumV3770`
- `restoreRulePackVersionV3770`
- `buildSavedAnalysisHtmlExportR129`
- `buildCurrentHtmlExportR129`
- `buildCurrentMarkdownExportR129`
- `downloadClientTextExportR129`
- `buildPremiumCleanCardSvg`
- `premiumCleanSvgToPngBlob`
- `buildProfessionalReportHtml`
- `downloadBlobFile`

Não houve alteração nas regras de build, progressão, habilidades, Ímpetos, posição, produção R138, OCR, Cofre ou persistência.

## Medição de startup

| Métrica | R167 | R168 | Delta |
|---|---:|---:|---:|
| Módulos estáticos | 197 | 194 | -3 |
| Fonte estática | 2.821.204 B | 2.777.514 B | -43.690 B (-1,55%) |
| `CardVisionApp.tsx` | 2.838 linhas | 2.848 linhas | +10 linhas |

O pequeno aumento do shell corresponde aos `await`/namespaces explícitos necessários para deixar a fronteira lazy auditável. O ganho principal desta rodada é de dependência/runtime inicial.

## Regressões e contratos

Passaram:

- typecheck autocontido R151 de toda `src`
- v37.70 Atualização Contínua
- v38.10 Resultado Premium Clean
- v38.10 integração Premium Clean
- v38.22 export button TypeScript hotfix
- R129 Vault modularization/export
- R138 produção/posição canônica
- R140 persistência confirmada
- R141 backup/cloud
- R153 fila canônica do Cofre
- R154 action guard/feedback
- R157 split session/autosave
- R164 reader interaction/light models
- R165 backup bootstrap
- R166 vault cloud lazy runtime
- R167 light training/coach storage contracts
- R168 deferred rules/export runtime

## Qualidade final

- 640 arquivos TS/TSX com sintaxe válida
- 790 botões tipados
- 34 imagens com `alt`
- acessibilidade/contraste/foco aprovados
- 127/127 auditorias
- 138/138 pré-voo de produção
- 27/27 pré-voo Play

Avisos conhecidos permanecem:

- código-fonte total ~6,65 MB
- `CardVisionApp.tsx` ainda é um shell grande (~2,85 mil linhas)

## Trava R168

- `tests/v40-80-r168-deferred-rules-export-runtime-regression.mjs`
- `scripts/check-cardvision-static-closure-r168.mjs`

Budget R168:

- máximo 194 módulos estáticos
- máximo 2.790.000 bytes de fonte estática

Essas travas impedem retorno dos quatro módulos pesados ao startup e preservam explicitamente as autoridades R37.70, R129 e Premium Clean.
