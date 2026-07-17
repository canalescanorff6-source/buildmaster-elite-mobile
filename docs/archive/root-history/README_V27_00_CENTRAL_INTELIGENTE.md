# BuildMaster Elite Tático v27.00 — Central Inteligente Integrada

A v27.00 reorganiza o aplicativo inteiro em torno de um fluxo único. Carta, ficha, Cofre, formação, elenco e partidas deixam de funcionar como áreas isoladas e passam a compartilhar a mesma identidade de jogador.

## Navegação principal

A interface principal foi reduzida para cinco áreas:

1. **Início** — prioridades, diagnóstico e ações rápidas.
2. **Jogadores** — Leitor Total, Manual Pro, ficha, habilidades, Cofre e histórico da carta.
3. **Meu Time** — formação, escalação, funções, banco, entrosamento, planos e adversário.
4. **Partidas** — preparação, cenários, substituições e validação pós-jogo.
5. **Ajustes** — aparência, desempenho, segurança, backup, atualização e contas.

As telas antigas continuam disponíveis como subfluxos para preservar todos os recursos.

## Central Inteligente

A tela inicial agora apresenta:

- último jogador para continuar;
- adicionar nova carta;
- analisar o time;
- preparar partida;
- prontidão do elenco;
- cartas confirmadas e pendentes;
- fichas ainda sem validação real;
- problemas críticos, importantes, oportunidades e informações.

## Laboratório do Jogador

Cada carta possui um perfil permanente que conecta:

- identidade da versão;
- posição original e posição escolhida;
- estilo oficial;
- ficha recomendada;
- habilidades;
- melhores encaixes em formações;
- registro no Cofre;
- partidas e média de desempenho.

O fluxo visual contém oito passos: adicionar, confirmar identidade, escolher posição, gerar ficha, revisar habilidades, conferir encaixe tático, salvar e validar em partidas.

## Laboratório do Time

O aplicativo cruza o Cofre com a formação escolhida e entrega:

- melhor jogador encontrado para cada espaço;
- nota de encaixe;
- setor mais forte e setor prioritário;
- funções repetidas;
- funções sem cobertura;
- banco recomendado;
- combinações entre ataque, meio e reservas;
- acesso aos módulos completos de formação, escalação, banco e Planos A/B/C.

## Laboratório da Partida

Existem três cenários integrados:

- **Segurar resultado**;
- **Controlar a partida**;
- **Buscar empate ou virada**.

Cada cenário mostra objetivo, ajuste da formação, perfil dos jogadores, substituições e riscos. O histórico pós-jogo volta para o perfil do jogador e para as recomendações do time, sem alterar fichas automaticamente.

## Assistente BuildMaster

O botão do assistente fica disponível em todo o aplicativo. Ele responde localmente usando somente os dados salvos pelo usuário, por exemplo:

- quem é o melhor VOL;
- qual ficha se encaixa melhor na 4-2-2-2;
- quem combina ao lado de um Artilheiro;
- se o time está ofensivo demais;
- quem deve entrar no segundo tempo;
- quais cartas precisam de revisão.

O assistente não inventa jogadores e não envia as perguntas a um serviço externo de inteligência artificial.

## Banco unificado e impacto de mudanças

A v27 cria um índice não destrutivo que relaciona:

```text
Carta → Ficha → Formação → Escalação → Partidas
```

Quando uma carta está incompleta ou precisa de revisão, o índice identifica que as recomendações de ficha, formação e time podem ser afetadas. Os dados originais continuam nas chaves existentes para evitar perda e permitir restauração.

## Modos Essencial e Profissional

O perfil de primeiro uso da v26.80 foi preservado:

- **Essencial:** mostra as ações principais e esconde auditorias técnicas.
- **Profissional:** libera propostas, comparação, pesos, auditoria, contexto tático e validação avançada.

É possível alternar sem perder os dados.

## Arquitetura modular

A nova camada integrada foi separada em módulos carregados conforme a área aberta:

```text
src/modules/
  core/
  players/
  card-reader/
  builds/
  formations/
  squad/
  matches/
  training/
  vault/
  backup/
  updates/
  administration/
  assistant/
  migration/
```

Os motores antigos foram preservados e conectados por fachadas de domínio, reduzindo o risco de regressão durante a transição.

## Migração e backup

Na primeira abertura da v27, o aplicativo cria um relatório de migração não destrutiva e preserva:

- fichas;
- Cofre;
- formações;
- preferências;
- partidas;
- login;
- licença;
- configuração do atualizador.

O backup v27 também inclui o relatório de migração e o índice da Central Inteligente.

## Atualização

A versão do aplicativo é `27.0.0`. A publicação continua pelo workflow **Gerar APK e publicar atualização definitiva**, usando o mesmo `ANDROID_SIGNING_BUNDLE`.

Não é necessário alterar o Supabase para esta versão.
