# R518 Readiness Panel — Implementation Plan

**Goal:** Expor em Partidas o readiness empírico R510/R518 com evidência persistida R137, estritamente read-only e sem criar nova autoridade de produção.

## Contratos preservados
- Fonte de partidas: R137 já recebida por `MatchLaboratory`.
- Contextos: apenas resultados atuais que já possuam R460 + R470 + R472 completos; R516 é reconstruído em memória pelo bridge oficial.
- R518 recebe `origin: 'PERSISTED_REAL'` e nunca fabrica contexto ausente.
- `R119 → R126 → R128` permanece autoridade final.
- Nenhum writer novo, nenhuma aplicação automática, nenhuma certificação R510, nenhuma mutação de ficha/Top 5/Skills/Ímpeto.

## TDD
1. Criar regressão de contrato do painel e anexá-la ao gate mestre R419.
2. Provar RED na PR: `MatchLaboratory` ainda não materializa R518/read-only na UI.
3. Implementar o mínimo em `src/modules/matches/MatchLaboratory.tsx`.
4. Provar GREEN no teste novo e nas regressões R518/R419/R128, TypeScript e build.
5. Só integrar à `main` com o SHA exato totalmente verde.

## UI bounded
O card “Evidência real R510 / R518” mostra:
- origem persistida R137;
- partidas e sessões reais;
- contextos disponíveis/prontos;
- estado R518;
- critérios faltantes e blockers;
- aviso explícito de revisão humana/read-only.

O card não usa nem exibe `ENGINE_CERTIFIED` e não promete readiness global quando os contextos não estão presentes.