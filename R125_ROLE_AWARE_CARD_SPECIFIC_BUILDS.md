# R125 — Ficha por carta + função real de uso

## Objetivo

Eliminar convergência artificial de progressões no Clean Slate final sem trocar a autoridade do app, sem usar Overall/GER como alvo e sem criar receitas fixas por posição.

## Causa estrutural corrigida

1. A autoridade final calculava a frequência das ações principalmente pela `mainPosition` da carta e não pela posição realmente escolhida em `bestPosition`.
2. Os atributos de uma ação tinham peso equivalente. Grupos com vários atributos úteis lateralmente (especialmente Drible, Destreza e Pernas) recebiam vantagem matemática desproporcional.
3. Estilos de jogo podiam continuar influenciando a ação mesmo em uma posição onde o estilo fica inativo/cinza.

## Contrato R125

- `positionAnchor` continua sendo a posição natural e faz parte da identidade permanente da carta.
- `usagePosition` é a função em que a carta será usada e pode alterar a progressão final.
- Trocar a posição de uso **não altera `cardKey`** e não transforma a carta em outro jogador.
- A função real de campo domina a frequência das ações; a posição natural permanece somente como resíduo de DNA em adaptações.
- O catálogo de fase ofensiva/defensiva informa se o estilo está provavelmente ativo. Estilo inativo não força pontos.
- Cada estilo ativo reforça ações específicas (ex.: Pivô → proteção/apoio; Artilheiro → ataque ao espaço/finalização), em peso moderado e sempre subordinado à evidência da carta.
- Estilo defensivo provisório recebe peso zero até ser confirmado.
- As ações usam pesos funcionais por atributo; atributos periféricos não valem o mesmo que o atributo nuclear da ação.
- Nome e Overall/GER continuam fora da decisão de progressão.
- Não existem pisos, tetos ou receitas como “ZAG = X em defesa” ou “CA = Y em finalização”. A decisão continua vindo da evidência da carta + função + custo marginal.
- A autoridade final continua única: `CLEAN_SLATE_SINGLE_WRITER`.

## Regressões protegidas

O teste `test:r125` garante, entre outros pontos:

- mesma carta CF em CF e em CB preserva identidade, mas muda a ficha;
- Artilheiro usado em CB fica com estilo ofensivo inativo e não força receita ofensiva;
- Artilheiro e Pivô, com os mesmos atributos, alteram frequências de ações coerentes sem criar tabela fixa de pontos;
- estilo defensivo provisório não altera a ficha;
- mudar apenas Overall não altera a ficha;
- CF técnico e CF aéreo geram progressões diferentes;
- ZAG construtor e ZAG de imposição geram progressões diferentes;
- ZAG não recebe Drible alto apenas por eficiência matemática do grupo;
- orçamento continua exato.
