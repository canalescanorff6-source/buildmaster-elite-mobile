# BuildMaster Elite Tático v25.80 — Reorganização Visual Premium

Esta versão reorganiza a interface completa sem alterar o motor de fichas, os catálogos oficiais, o Cofre ou as decisões do usuário.

## Principais mudanças

- Navegação móvel reduzida de 7 para 5 itens: Início, Criar, Resultado, Cofre e Mais.
- Leitor e Manual Pro abertos por um seletor simples no botão Criar.
- Meu Time e Ajustes agrupados no botão Mais.
- Cada área renderiza somente o conteúdo necessário; não depende mais de uma página enorme escondida por CSS.
- Elementos fixos que cobriam conteúdo foram removidos.
- Topo compacto e contextual, mostrando apenas a área atual.
- Tema, cor e modo simples/avançado foram movidos para Ajustes.
- Resultado dividido em cinco grupos: Visão geral, Análise, Desenvolvimento, Tática e Ferramentas.
- Subabas do resultado aparecem apenas dentro do grupo selecionado.
- Fluxo de criação separado do resultado final.
- Cofre, Meu Time e Ajustes usam páginas próprias em largura total.
- Cartões, espaçamento, tipografia e botões foram padronizados.
- Build com Webpack para evitar travamentos excessivos do Turbopack no ambiente de geração.
- Exportação estática corrigida para remover temporariamente a API de nuvem antes do APK.

## Proteções mantidas

- Posição escolhida pelo usuário.
- Estilos e habilidades oficiais já cadastrados.
- Histórico e pastas do Cofre.
- Técnicos, formação, equipe, adversário e calibração.
- Backup, restauração e migração de dados.

## Validações

- TypeScript aprovado.
- Teste específico da interface v25.80 aprovado.
- Todos os testes de regressão anteriores aprovados.
- Build web aprovado.
- Exportação estática do APK aprovada.
