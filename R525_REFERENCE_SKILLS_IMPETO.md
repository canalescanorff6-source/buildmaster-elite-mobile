# R525 — Reference Skills + Ímpeto

Data: 2026-09-29

## Escopo

R-VIS 6 aplicado às superfícies de Habilidades adicionais e Ímpeto do Resultado.

- integridade do Top 5;
- progresso das habilidades recomendadas;
- Top 5 avançado e estado concluído;
- boas alternativas e itens a evitar;
- fluxo “Já possui? Gerar outra” preservado;
- Ímpeto vencedor, score e confiança;
- vaga de Ímpeto e bloqueio/liberação de Token;
- atributos favorecidos e evidências;
- alternativas seguras e Ímpetos a evitar;
- responsividade e alvos de toque mobile.

## Firewall funcional

R525 é somente apresentação. `ResultWorkspace` continua consumindo as decisões que chegam no `AnalysisResult` e não importa nenhuma autoridade de Skills/Ímpeto para recalcular decisões na UI.

Permanecem intactos:

- R457 — conjunto final de habilidades e decisão de Ímpeto;
- R505 — avaliação de Ímpeto no estado pós-build;
- R506 — Top 5 usando estado pós-build;
- R507 — autoridade final pública;
- R510/R511/R512 — gameplay/Posse/joint frontier;
- R517/R518 — certificação e evidência real fail-closed.

O melhor Ímpeto continua selecionado exclusivamente a partir de `recommendedImpetos`, respeitando `canCraftImpeto`. Quando a vaga está ausente, ocupada ou não confirmada, o bloqueio de gasto permanece visível.

## Evidência de verificação

- `tests/v40-80-r525-reference-skills-impeto-regression.mjs` — GREEN.
- R521–R524 — GREEN.
- R457 Skills — GREEN.
- R457 Ímpeto — GREEN.
- R505 post-build Ímpeto — GREEN.
- R506 post-build Skills — GREEN.
- R419 master engine closure, cobrindo R501→R518 — GREEN.
- R519/R520 core baseline + reference UI — GREEN.
- `scripts/check-source-syntax.mjs` — 826 arquivos TS/TSX aprovados.
- `npm run quality:visual` — contraste, toque, foco, movimento reduzido e regiões ao vivo aprovados.

## Próxima etapa

R-VIS 7 — Táticas: formações, estilos, posições, banco, explicações e exportação, sem permitir que a UI altere ficha, Skills, Ímpeto ou qualquer autoridade do core.
