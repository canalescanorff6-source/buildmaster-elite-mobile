# R151 — Whole Source Typecheck + Vault Selector Modularization

## Objetivo

Fechar o ponto cego de compilação do pacote limpo e iniciar a redução segura do `CardVisionApp.tsx` sem alterar a inteligência esportiva, persistência canônica ou experiência do Cofre.

## Problema encontrado

A R150 adicionou um checker específico para o `CardVisionApp.tsx`, porém o ZIP de release não carrega `node_modules`. O `tsconfig.app.json` completo, portanto, produz milhares de diagnósticos ambientais de React/Next/Capacitor e não funciona como contrato autocontido da release. Isso deixava componentes fora do CardVision sem uma barreira equivalente contra símbolos, callbacks e tipos quebrados.

Além disso, filtros, busca, ordenação e catálogos do Cofre ainda eram calculados inline dentro do shell principal.

## Mudanças

1. `typecheck:r151`
   - compila toda a pasta `src/**/*.ts` e `src/**/*.tsx`;
   - funciona dentro do ZIP limpo, sem `node_modules`;
   - usa stubs externos tipados apenas para dependências de ambiente;
   - inclui `DOM.Iterable`, `PointerEvent.pointerType`, ícones Lucide realmente usados e contrato mínimo tipado do Tesseract.

2. `cardVisionVaultSelectorsR151.ts`
   - centraliza filtros padrão do Cofre;
   - busca textual por jogador/posição/build/estilo/habilidades/tags/notas;
   - filtros avançados e pasta Arquivados;
   - ordenação por atualização, nome, posição e habilidades pendentes;
   - catálogo único de estilos e habilidades;
   - contagem de filtros ativos.

3. `CardVisionApp.tsx`
   - deixou de implementar a filtragem detalhada inline;
   - continua sendo o orquestrador e não ganha nova persistência;
   - caiu de aproximadamente 3901 linhas da R150 para 3871 linhas na R151.

## Invariantes preservadas

- Clean Slate R119 continua autoridade final da progressão.
- R149 Scalar Score Hot Path não foi alterado.
- Beam, custos, pesos, heurísticas, Top 5 e Ímpeto não foram alterados.
- R129 continua autoridade das mutações de metadados do Cofre.
- R139/R140 continuam autoridade de lifecycle/persistência confirmada.
- R150 continua protegendo os callbacks integrados restaurados.
- A extração R151 é somente de seleção/derivação de visão; não escreve ficha nem histórico.

## Contratos novos

- `npm run typecheck:r151`
- `npm run test:r151`

O teste R151 também congela o comportamento de busca, favoritos, posição, arquivados, ordenação, catálogos e imutabilidade do histórico de entrada.

## Validação final

- `typecheck:r151`: toda `src` aprovada no ZIP limpo.
- `test:r151`: comportamento dos seletores e imutabilidade aprovados.
- R150: contratos integrados continuam aprovados.
- R149: Scalar Score Hot Path continua aprovado e intocado.
- Regressões principais R119–R151 executadas em blocos e aprovadas.
- Sintaxe: 613 arquivos TS/TSX aprovados.
- Contratos interativos: 792 botões + 34 imagens aprovados.
- Visual/acessibilidade: aprovado.
- Auditoria: 127/127.
- Preflight produção: 138/138.
- Play Store: 27/27.

## Próximos alvos recomendados

1. Continuar extraindo seletores/controladores puros do `CardVisionApp` antes de mover blocos JSX grandes.
2. Modularizar backup/sincronização em etapas pequenas, preservando R140/R141 como autoridades.
3. Reavaliar o motor de fichas somente quando houver evidência esportiva nova (patch/meta) ou gargalo mensurável; não fazer micro-otimização por rotina.
4. Expandir o contrato R151 para budgets de dependência/imports e testes de rotas de interação críticas.
