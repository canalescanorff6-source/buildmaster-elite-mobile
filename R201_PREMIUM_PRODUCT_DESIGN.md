# R201 — Premium Product Design

## Objetivo

Transformar a interface do BuildMaster Elite Tático em um produto visualmente coerente, premium e fácil de operar, sem alterar os motores de ficha, OCR, Clean Slate, Cofre, identidade canônica ou regras de produção.

## Problema corrigido

O aplicativo acumulou várias camadas visuais históricas. Apesar de funcionais, elas criavam competição de cores, bordas, sombras, raios, densidade e padrões de navegação. O resultado era uma interface com boa quantidade de recursos, mas sem uma linguagem visual única.

## Solução R201

Foi criada a camada final `src/app/v41-premium-product.css`, importada por último no layout e identificada por `bm-v4100-product`.

Ela unifica:

- shell desktop e mobile;
- sidebar e drawer;
- topbar e estado de salvamento;
- contexto da área atual;
- navegação principal e ativa;
- botão de criação;
- bottom navigation móvel;
- action sheets;
- cards e superfícies;
- heroes e métricas;
- abas e segmented controls;
- filtros;
- inputs, selects e textareas;
- detalhes expansíveis;
- estados hover/focus/active;
- animações leves;
- redução de movimento;
- tema claro e escuro;
- sete presets visuais já existentes.

## Direção visual

A linguagem R201 evita excesso de neon e gradientes competitivos. O visual passa a usar:

- superfícies grafite/marinho de baixo ruído;
- bordas discretas;
- profundidade controlada;
- acento de tema como identidade, não como decoração em excesso;
- tipografia com hierarquia mais clara;
- cantos e espaçamentos consistentes;
- ações principais destacadas sem poluir a tela;
- navegação móvel com leitura imediata.

## Compatibilidade

As classes históricas permanecem no markup para preservar regressões e compatibilidade. A R201 funciona como autoridade visual final e não remove contratos anteriores.

## Proteções

O teste `tests/v41-00-premium-product-design-regression.mjs` valida:

- importação da camada R201 como última folha de estilo;
- presença da classe de produto no `body`;
- sidebar, topbar, contexto, dock e action sheet premium;
- sete presets visuais;
- tema claro/escuro;
- `prefers-reduced-motion`;
- marcadores semânticos novos na navegação e no contexto.

## Escopo funcional preservado

R201 não altera `src/lib/cleanSlatePerformance2027V4080R119.ts`, identidade R126, produção R128, Cofre, OCR, Mapeamento, treinamento, habilidades, Ímpetos ou persistência.
