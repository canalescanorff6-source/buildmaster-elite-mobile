# BuildMaster Elite Tático — r119 Clean Slate Final

## Objetivo

A r119 substitui a cadeia de decisão herdada por uma autoridade final calculada do zero a partir do snapshot cru da carta. O Suárez/Neymar são apenas casos de regressão; não existem regras por nome de jogador.

## Autoridade final

- `r119 Clean Slate` é o único escritor final de ficha, Top 5 e Ímpeto.
- O snapshot de `parsed` é capturado antes de qualquer motor histórico.
- Motores v38/v39/v40, r70, r107, r108 e r109 ficam fora do caminho crítico do browser/Android por padrão.
- Motores históricos podem continuar disponíveis em Node/diagnóstico, mas alterações em `training` são tratadas como read-only.
- r119 ignora `overall`, ficha recebida como semente e a filosofia `floor/peak/ceiling`.
- Posição selecionada e formação continuam úteis na camada tática, mas não reescrevem a assinatura permanente da carta.

## Filosofia de otimização

O motor avalia ações funcionais compatíveis com o DNA natural da carta e o retorno de cada investimento dentro do orçamento exato. Ele não tenta consertar automaticamente o atributo mais fraco. Jogo aéreo só recebe prioridade forte quando atributos/habilidades da própria carta sustentam essa identidade.

## Habilidades adicionais e Ímpeto

- Top 5 usa o catálogo oficial e bloqueia habilidades já possuídas/duplicadas.
- Compatibilidade por posição natural é preservada.
- Há diversidade funcional para evitar cinco slots concentrados no mesmo tipo de ação.
- Ímpeto já existente é `KEEP_CURRENT` e nunca reaparece como nova recomendação.
- Um novo Ímpeto só é recomendado quando há vaga confirmada e confiança suficiente.

## Sanitizador / CI

`sanitize-update-source.mjs` detecta `BM_R119_CLEAN_SLATE_SINGLE_WRITER` e, nesse caso, não reaplica os patchers mutáveis r109-r116. Isso impede o CI de restaurar a arquitetura antiga.

## Validações executadas

- teste próprio r119: aprovado;
- `typecheck:v4080`: aprovado;
- regressões v31.82, v35.00, v35.10, v35.20, v39.20 e v39.30: aprovadas;
- suíte v40.80 concluída em blocos até r119: aprovada;
- sanitizador executado com hashes críticos idênticos antes/depois: aprovado;
- sintaxe TypeScript/TSX: 532 arquivos aprovados;
- pré-voo de produção: 138 verificações aprovadas;
- auditoria estrutural: 127 verificações aprovadas;
- pré-voo Google Play: 27 verificações aprovadas.

## Limitação do ambiente de validação

O build Next/Android completo não pôde ser executado localmente nesta sessão porque o registro npm não respondeu e as dependências não puderam ser instaladas em `node_modules`. Os typechecks direcionados e verificações que não dependem dessa instalação passaram. O GitHub Actions deve executar `npm ci` no ambiente normal antes do build.
