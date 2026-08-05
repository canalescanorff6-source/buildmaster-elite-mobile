# Correção da regressão v34.00 no Mapeamento v38.40

A implementação do Mapeamento adicionou `mapeamento` à lista de seções principais que não exibem o painel legado. O teste antigo da v34.00 ainda exigia a lista anterior e encerrava o GitHub Actions com código 1, apesar de o módulo novo estar aprovado.

## Ajuste aplicado

- contrato legado da v34.00 atualizado para reconhecer `mapeamento`;
- regressão da v38.40 reforçada para impedir que o contrato volte a divergir;
- nenhuma regra de funcionamento do app foi removida ou flexibilizada.
