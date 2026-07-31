# Correção do TypeScript completo — v34.00

## Falha

O cabeçalho superior teve a lupa removida corretamente, porém a propriedade obrigatória `onSearch` também foi retirada por engano da chamada de `RefinedNavigation`.

A busca continua disponível no rodapé do menu lateral, portanto o componente ainda exige essa propriedade. O TypeScript completo detectou a inconsistência e encerrou o CI com código 2.

## Correção

- `onSearch={() => openMainSection('buscar')}` restaurado somente em `RefinedNavigation`.
- A lupa continua removida de `PremiumContextBar`.
- Busca continua acessível dentro do menu lateral.
- Nova regressão impede que as propriedades dos componentes voltem a ficar dessincronizadas.

Nenhuma alteração foi feita na rolagem, menu, fichas, OCR, habilidades, Ímpetos ou Meu Time.
