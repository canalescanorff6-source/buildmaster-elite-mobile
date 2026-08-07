# Correção de compatibilidade do Motor Supremo v38.70

## Problema encontrado

O teste específico do Motor v38.60 continuava aprovado, porém o diagnóstico consolidado passou a reprovar 11 grupos legados: v31.00, v31.20, v31.72, v31.79, v31.82, v32.00, v35.00, v35.10, v38.30, v38.38 e v38.39.

A causa não era a fórmula principal de desempenho. A nova camada v38.70 havia quebrado contratos públicos ainda usados pelas regressões antigas:

- exigia sempre cinco habilidades adicionais, mesmo quando a carta possuía menos de cinco vagas oficiais disponíveis;
- devolvia mais de cinco variantes de ficha, contrariando o contrato visual e funcional antigo;
- alterava o padrão público do nome da ficha automática;
- recalculava o Ímpeto, mas não registrava na evidência que a escolha havia sido feita sobre a ficha final;
- o pipeline preservava o comportamento de integridade, porém não mantinha a assinatura textual verificada pela regressão v38.30;
- a busca suprema gerava candidatos demais para o diagnóstico consolidado, aumentando o tempo sem ganho proporcional.

## Correções aplicadas

1. O Top adicional agora aceita de zero a cinco habilidades conforme as vagas oficiais realmente restantes.
2. Habilidades nativas, especiais e adicionais já presentes continuam bloqueadas.
3. As variantes públicas foram limitadas a no máximo cinco.
4. O nome voltou a preservar o contrato `Ficha Automática v38.40`, mantendo a identificação do Motor Supremo v38.70.
5. A evidência do Ímpeto registra explicitamente que ele foi recalculado com a ficha final.
6. O contrato legado do pipeline de integridade foi preservado.
7. A busca continua com quatro rodadas, seis fases, seis adversários e fronteira de Pareto, mas usa um feixe controlado e determinístico.
8. Foi incluída uma regressão exclusiva para cartas com menos de cinco vagas adicionais.

## Desempenho da busca

No teste funcional de referência atual, a v38.70 avaliou 88 distribuições únicas na triagem robusta. Esse volume continua acima do mínimo de exploração exigido, mas reduz drasticamente o tempo do diagnóstico em comparação com a expansão anterior de centenas de vizinhos redundantes.

## Garantias preservadas

- nenhuma pontuação usa Overall/GER como objetivo;
- orçamento de progressão fechado exatamente;
- posição escolhida pelo usuário preservada;
- análise por microfunção, seis fases e seis tipos de adversário;
- avaliação conservadora, fronteira de Pareto e retorno marginal;
- Top adicional sem duplicidades;
- Ímpeto escolhido depois da progressão e das habilidades.

## Otimização adicional de desempenho

A execução também foi reorganizada em duas etapas:

- a triagem profunda reutiliza temporariamente o Top adicional e o Ímpeto já validados pela v38.60;
- as melhores candidatas são recalculadas integralmente antes da decisão final;
- as segundas execuções idempotentes dos motores v37.50, v38.50 e v38.60 foram removidas do fluxo real, mantendo os contratos legados documentados para o CI.

Essa alteração não reduz as fases, os adversários, as rodadas, a fronteira de Pareto nem a auditoria final. Ela elimina recomputações repetidas e torna a leitura de lotes de jogadores mais rápida.
