# BuildMaster Elite Tático v24.37 — Conversão Universal por Posição

A posição escolhida pelo usuário passa a ser a ordem principal do motor em todas as posições de linha.

## Regra universal

Qualquer jogador de linha pode receber uma ficha para qualquer uma destas posições:

CA, SA, PE, PD, ME, MD, MAT, MLG, VOL, ZAG, LE e LD.

A posição original não bloqueia nem substitui a posição escolhida. Ela permanece apenas como identidade da carta. O estilo e os atributos atuais são usados para preservar qualidades úteis e compensar limitações, mas toda a distribuição é calculada para a posição-alvo.

## Cobertura automática

O teste de regressão percorre todas as 144 combinações possíveis entre as 12 posições de linha, incluindo manutenção da posição e conversões completas.

Conversões entre goleiro e jogador de linha continuam bloqueadas por incompatibilidade estrutural dos atributos.
