# v38.31 — Correção das regressões do CI

Esta versão corrige incompatibilidades de testes antigos introduzidas pela v38.30 sem remover a proteção de nome manual nem a substituição inteligente de habilidades.

## Correções

- restaura o contrato de deduplicação explícita das habilidades nativas esperado pelo OCR rígido v31.40;
- mantém a normalização canônica das habilidades nativas, adicionais instaladas e especiais;
- atualiza as guardas de cache das regressões v33.00 e v37.71 para reconhecer v38.30 e v38.31;
- preserva e valida novamente a Central Profissional v37.00;
- adiciona regressão própria da v38.31 ao diagnóstico consolidado;
- força a renovação segura do cache web e nativo para aplicar o hotfix.

## Funções preservadas

- prioridade absoluta do nome confirmado manualmente;
- bloqueio de habilidades já possuídas;
- separação de habilidades nativas, adicionais e especiais;
- geração inteligente de substituta, sem escolha aleatória;
- cálculo da ficha e do Booster sem alterações.
