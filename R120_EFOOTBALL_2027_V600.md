# R120 — eFootball 2027 / v6.0

## Objetivo

Atualizar a autoridade final de recomendação do BuildMaster para o contexto de jogabilidade do eFootball 2027/v6.0 sem reativar motores históricos, sem otimizar GER/overall e sem introduzir receitas fixas por jogador, posição ou estilo.

## Mudanças principais

- Separação de estilo ofensivo e estilo defensivo no fluxo de leitura e revisão.
- Fallback neutro `Básico` para cartas antigas que possuem apenas um estilo legado.
- Suporte confirmado a `Pressão no Ataque` na fase defensiva.
- Inclusão de `Sobreposição` nos módulos que usam estilo coletivo/tático.
- Manutenção independente de posição original da carta e posição escolhida para uso.
- Autoridade final continua sendo o Clean Slate r119; a r120 é uma evolução contextual dentro do mesmo escritor final.
- Resistência passa a responder à carga funcional projetada da carta, em vez de uma meta fixa de atributo por posição.
- `Interceptação` e `Pressão no Ataque` alteram frequência funcional apenas quando realmente presentes na leitura/contexto.
- Pontos de treino continuam obedecendo orçamento exato e ROI da carta; overall não é objetivo de otimização.
- Cadastro de técnico preparado para a estrutura de 2027 e registro de Frank Lampard com alta proficiência oficial em Sobreposição, sem inventar valor numérico não publicado.

## Compatibilidade de cartas antigas

Uma carta antiga com apenas `ESTILO DE JOGO: Infiltração`, por exemplo, é interpretada como:

- Ofensivo: `Infiltração`
- Defensivo: `Básico`

O estilo legado não é mais clonado automaticamente para a fase defensiva.

## Validação

Executado com sucesso:

- `npm run typecheck:v4080`
- `npm run test:r119`
- `npm run test:r120`
- regressão de autoridade única r118/r119

O typecheck completo do aplicativo requer as dependências de projeto instaladas (React/Next/Capacitor e demais pacotes); o ZIP de origem não contém `node_modules`.

## Fontes oficiais de referência

- KONAMI eFootball v6.0.0 — mudanças de jogabilidade, defesa, resistência, estilos de jogo e temporada 2027.
- KONAMI eFootball v6.0.1 — hotfix Android, sem recalibração de gameplay usada pelo motor.

Novos nomes de habilidades/estilos não confirmados não devem ser inventados. O catálogo pode ser ampliado conforme houver texto oficial ou lista fornecida e validada.
