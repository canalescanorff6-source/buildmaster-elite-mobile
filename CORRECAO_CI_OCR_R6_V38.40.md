# BuildMaster v38.40 — hotfix r6

Correção dos quatro grupos exibidos no GitHub Actions após o hotfix OCR r5.

## Ajustes

- v31.40: `adaptiveZoneVariants(..., 'fast')` volta a representar apenas a área exata. O retry do nome continua isolado no leitor manual de 8 quadrados.
- v35.10: a adaptação por posição preserva as 3 habilidades centrais da identidade da carta e usa até 2 vagas para complementos da função escolhida.
- v38.37: contrato de migração dos perfis manuais para `AUTO` restaurado sem reintroduzir opções manuais.
- v39.20: regressão e memória canônica mantidas e validadas.
- v38.40: teste r5 atualizado para refletir 3 habilidades de identidade e novo teste r6 acrescentado.

## Objetivo

Preservar a correção estrutural do OCR (8 quadros, watchdogs, cancelamento e posição escolhida soberana) sem quebrar contratos antigos ainda executados pelo CI.
