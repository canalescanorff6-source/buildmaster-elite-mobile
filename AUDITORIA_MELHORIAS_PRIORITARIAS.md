# Auditoria de melhorias prioritárias do BuildMaster

## Situação atual

O aplicativo já possui um conjunto amplo de módulos. O maior risco neste momento não é falta de funções, mas excesso de complexidade visual, dados de entrada incertos e concentração do código em componentes muito grandes.

## Prioridade 1 — Precisão comprovada

Criar uma base de testes reais por carta, posição e estilo, com comparativo antes/depois da ficha. O motor deve aprender com registros do usuário sem alterar silenciosamente regras oficiais.

## Prioridade 2 — Banco de cartas verificadas

Separar claramente dados confirmados, dados lidos por imagem e dados informados manualmente. Cada ficha deve exibir a origem e a confiança de cada campo.

## Prioridade 3 — Arquitetura modular

Separar criação, resultado, Cofre, Meu Time, formações, atualização e administração em módulos carregados sob demanda. Isso reduz risco de regressão e melhora o desempenho em celulares.

## Prioridade 4 — Assistente de primeiro uso

Adicionar um roteiro curto que ensine: cadastrar carta, escolher posição, gerar ficha, comparar propostas, salvar no Cofre e testar em partida.

## Prioridade 5 — Qualidade visual automatizada

Adicionar testes de captura e comparação visual para tamanhos comuns de Android, além dos testes de lógica já existentes.
