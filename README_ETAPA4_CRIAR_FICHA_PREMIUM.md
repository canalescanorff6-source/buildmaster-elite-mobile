# Etapa 4 — Criar Ficha, Leitor e Manual Pro

Esta versão contém as Etapas 1, 2, 3 e 4 da reformulação visual do BuildMaster Elite Tático.

## Alterações da Etapa 4

- Nova central **Criar Ficha**.
- Escolha clara entre **Leitor por print** e **Manual Pro**.
- Progresso visual em cinco etapas: método, entrada, configuração, revisão e ficha.
- Upload de imagem reformulado, com prévia, qualidade e requisitos do print.
- Manual Pro apresentado como entrada controlada, sem OCR e sem troca automática da posição escolhida.
- Configuração organizada para objetivo, posição, estilo, formação, modelo de jogo e técnico.
- Tela de processamento própria durante a leitura OCR.
- Revisão dividida em confirmações independentes:
  1. Identidade;
  2. Posição original e posição-alvo;
  3. Estilo de jogo;
  4. Nível e pontos disponíveis.
- Barra de conclusão da revisão.
- Geração final separada da prévia e do recálculo.
- Layout responsivo para computador, tablet e celular.
- Tema escuro e tema claro preservados.

## Funções preservadas

- Login e licença pelo Supabase.
- Contas e painel administrativo.
- Leitura OCR local.
- Modo Manual Pro.
- Motor de fichas e orçamento de pontos.
- Cofre separado por usuário.
- Backup, restauração e atualização do APK.
- Técnicos, elenco, escalação e análise tática.

## Validação realizada

- `npm run typecheck`
- `npm run apk:build-web`
- Suítes de contas, backup, interface, release, fichas, cartas, prints, técnicos, elenco, escalação, adversário e plano de jogo.
