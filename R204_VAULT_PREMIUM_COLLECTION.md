# R204 — Cofre Premium / Competitive Collection

## Objetivo
Transformar o Cofre em uma biblioteca competitiva premium, com leitura rápida da coleção, navegação explícita e melhor ergonomia mobile, sem alterar a autoridade canônica de persistência, identidade ou motor de ficha.

## Mudanças
- Hero editorial do Cofre com hierarquia de coleção competitiva.
- Quatro áreas sempre visíveis: Jogadores, Organizar, Comparar e Proteção.
- Resumo do catálogo com jogadores visíveis, favoritos e filtros ativos.
- Busca ampliada por jogador, posição, estilo e habilidade.
- Cards de jogadores com contexto de fichas, versões e confiança.
- Cards, menus e estados do catálogo refinados para desktop e mobile.
- Organização, comparação, ranking, backup e lixeira recebem linguagem visual única.
- Dark/light preservados com materiais próprios e sem excesso de neon.
- Safe-area, toque e prefers-reduced-motion preservados.

## Invariantes preservados
- R119 Clean Slate não alterado.
- R126 identidade de carta não alterada.
- R139/R153 continuam responsáveis pelo ciclo de persistência/mutação do Cofre.
- R185 continua responsável pelas ações do Cofre.
- R191 continua sendo boundary lazy do workspace.
- Nenhum writer paralelo foi introduzido.
