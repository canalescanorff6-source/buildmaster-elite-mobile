# BuildMaster Elite Tático v33.00 — Interface Executive

## Objetivo

Reconstruir somente a camada de interface, navegação e desempenho de abertura, preservando integralmente os motores validados da v32.00.

## Navegação

- Desktop/tablet: barra lateral fixa à esquerda.
- Celular: botão **Menu** abre uma gaveta lateral pela esquerda.
- A barra inferior foi removida.
- **Jogadores** abre diretamente o banco de jogadores.
- As etapas Usar imagem, Nova ficha manual e Ficha atual continuam acessíveis no fluxo lateral.
- Meu Time, Partidas, Configurações, Busca e todos os módulos permanecem disponíveis.

## Tema visual

- Fundo pérola/cinza claro.
- Cartões brancos com bordas discretas.
- Navegação em azul-marinho.
- Destaques champanhe/dourado.
- Tipografia de alto contraste.
- Menos sombras, blur e animações pesadas.

## Correções funcionais de interface

1. A entrada Jogadores não reutiliza mais a última subaba aberta.
2. Meu Time não usa `Array.prototype.at`, evitando falhas em WebViews Android antigos.
3. A limpeza do cache web do APK ocorre somente quando a estrutura de cache muda. Antes, ela era executada em toda abertura do aplicativo.
4. O menu lateral bloqueia o scroll do conteúdo quando aberto e fecha com toque externo ou tecla Escape.

## Preservado sem alterações

- autenticação e sessão persistente;
- leitor de print e calibrador em tela cheia;
- Mega Calibração v32.00;
- distribuição exata dos pontos;
- habilidades adicionais;
- Ímpetos;
- formação, técnico e contexto tático;
- Cofre, backup, atualização, partidas e publicação.

## Validações específicas

- regressão `v33-00-executive-redesign-regression.mjs`;
- sintaxe TypeScript/TSX;
- contratos de botões e imagens;
- acessibilidade;
- abertura de Meu Time sem jogadores;
- regressão da Mega Calibração v32.00;
- persistência de sessão, habilidades, Ímpetos e calibrador v31.82;
- pré-voo de produção e Google Play;
- auditoria estrutural.
