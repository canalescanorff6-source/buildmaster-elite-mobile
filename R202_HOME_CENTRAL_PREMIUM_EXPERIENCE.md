# R202 — Home / Central Premium Experience

## Objetivo

Transformar a Central do BuildMaster em uma tela de produto premium, com prioridade clara para a criação de ficha, leitura imediata do estado do app e acesso rápido às áreas principais, sem alterar a autoridade de análise, OCR, Cofre ou persistência.

## Mudanças

- Hero principal com hierarquia editorial e duas ações primárias bem definidas.
- Última análise tratada como resumo executivo da carta, reduzindo a aparência de card genérico.
- Painel completo aberto por padrão, mas ainda recolhível pelo usuário.
- Métricas compactas e escaneáveis.
- Workspace reorganizado em destinos consistentes e responsivos.
- Meu Time e Inteligência diferenciados visualmente por função.
- Melhor ergonomia mobile: alvos de toque, grid 2x2, hero vertical e resumo compacto da última análise.
- Light mode com a mesma hierarquia do dark mode, sem depender de sombras pesadas.
- `focus-visible` e `prefers-reduced-motion` preservados.

## Limites arquiteturais

- Nenhum motor de ficha alterado.
- R119 permanece imutável.
- Nenhuma mudança em identidade R126, Cofre, OCR, cálculo de pontos ou habilidades.
- A R202 é uma camada de apresentação final importada após a R201.
- O orçamento TypeScript continua abaixo do checkpoint de 5.360.000 bytes.
