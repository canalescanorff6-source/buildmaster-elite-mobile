# BuildMaster Elite Tático v26.76 — Revisão geral e Ficha Studio

## Base usada

Esta revisão foi feita sobre o pacote completo `buildmaster-elite-mobile-v26.75-seguranca-reforcada`, preservando:

- sessão persistente ao alternar para WhatsApp, navegador ou outro aplicativo;
- bloqueio de versões antigas no servidor;
- MFA administrativo;
- armazenamento seguro com Android Keystore;
- controle criptográfico de aparelhos;
- backup criptografado;
- atualização verificada;
- rate limit administrativo;
- Supabase, contas, Cofre, fichas e motores táticos.

## Problemas encontrados na criação de fichas

1. O título da área aparecia duas vezes: no cartão de contexto e no cabeçalho “Criar Ficha”.
2. A página apresentava objetivo, posição, estilo, formação, modelo de jogo, técnico e guia tático com o mesmo peso visual.
3. O contexto tático parecia obrigatório, mesmo sendo apenas um refinamento.
4. O lado direito permanecia com um estado vazio genérico antes da auditoria.
5. O botão de gerar, o próximo passo, a porcentagem e o status estavam separados.
6. No celular, as cinco etapas ocupavam muito espaço e alongavam a tela.
7. No Manual Pro, a auditoria era aberta enquanto a coluna lateral continuava parecendo uma tela inicial comum.
8. O texto “Reabrir auditoria Elite” não deixava clara a ação real.

## Melhorias aplicadas

### Ficha Studio

- novo cabeçalho de criação com identidade própria;
- resumo ao vivo de modo, destino, pontos e prontidão;
- escolha entre Leitor e Manual Pro integrada ao fluxo;
- progresso compacto e adaptado ao celular;
- remoção do cabeçalho duplicado da área;
- posição escolhida destacada como informação prioritária;
- objetivo, posição-alvo, posição original e estilo reunidos em “Essenciais da ficha”;
- formação, modelo de jogo, técnico e guia tático movidos para “Contexto tático opcional”;
- prévia viva da construção no lado direito;
- cartão visual da carta antes do resultado;
- resumo de objetivo, posições, estilo, pontos e técnico;
- barra de prontidão para auditoria;
- ação principal unificada com o próximo passo;
- indicadores dos dados prontos e pendentes;
- texto “Atualizar prévia” no lugar de “Reabrir auditoria Elite”;
- registro técnico mantido recolhido;
- imagens do Cofre e origens visuais carregadas sob demanda;
- tema claro, tema escuro, celulares pequenos, tablets e redução de movimento preservados.

## O que não foi alterado

- cálculos da ficha;
- regras de pontos;
- habilidades oficiais;
- posição escolhida pelo usuário;
- técnicos e estilos;
- Supabase;
- contas e licenças;
- formato do Cofre;
- backup;
- funções `license-session` e `admin-users`;
- segurança v26.75.

## Versão

- aplicativo: `26.76.0`;
- versão mínima aceita no servidor: `26.75.0`;
- esquema de backup: `26.75.0`, pois não houve mudança estrutural nos dados;
- APK esperado: `BuildMaster-Elite-Tatico-v26.76.apk`.

## Testes executados

- TypeScript;
- teste específico do Ficha Studio;
- integridade da release;
- segurança v26.75;
- backup e atualizações;
- contas e licenças;
- organização da interface;
- precisão da ficha;
- migração do Cofre;
- exportação estática para o APK.
