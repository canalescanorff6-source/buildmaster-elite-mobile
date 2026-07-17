# BuildMaster Elite Tático v26.81 — Leitor Total de Carta

A v26.81 melhora a captura de dados da carta usando várias telas do mesmo jogador. Em vez de depender de um único print, o aplicativo analisa cada tela separadamente, compara a identidade e reúne os dados em uma única revisão.

## Como usar

Na área de criação da ficha, escolha **Leitura completa**.

Envie os prints nos espaços correspondentes:

1. **Visão geral — obrigatório**  
   Nome, tipo da carta, posição, estilo, nível e GER.
2. **Atributos — obrigatório**  
   Tela com a lista de atributos do jogador.
3. **Habilidades — recomendado**  
   Habilidades existentes e habilidade especial, quando visível.
4. **Progressão e pontos — obrigatório**  
   Pontos disponíveis, nível e distribuição atual.
5. **Posições jogáveis — opcional**  
   Posições principais e alternativas exibidas no jogo.

Depois toque em **Analisar carta completa**.

## O que o leitor faz

- verifica a qualidade de cada imagem;
- identifica automaticamente o tipo de tela;
- utiliza regiões específicas para nome, posição, nível, pontos, atributos e habilidades;
- executa uma segunda passagem nas regiões com baixa confiança;
- cruza nome, posição, GER, nível e tipo da carta entre os prints;
- informa quais campos foram confirmados e quais precisam de revisão;
- bloqueia a finalização quando faltam dados críticos;
- exige confirmação humana quando os prints podem pertencer a versões diferentes da carta.

## Auditoria da leitura

Na revisão, o aplicativo mostra:

- cobertura das telas enviadas;
- tipo detectado de cada print;
- confiança individual e combinada;
- identidade encontrada em cada tela;
- origem do dado e quantidade de passagens realizadas;
- campos críticos ausentes ou incertos;
- possíveis divergências entre versões da carta.

O aplicativo não troca silenciosamente a posição, o estilo ou a identidade da carta. Dados incertos permanecem destacados para confirmação.

## Privacidade

A preparação e o cruzamento dos prints são realizados no próprio fluxo do aplicativo. Os prints usados na leitura não são enviados ao Supabase pelo módulo Leitor Total. O salvamento segue as regras já existentes do Cofre e do backup.

## Compatibilidade

- Base: v26.80 Evolução Total.
- Versão do aplicativo: 26.81.0.
- Não exige nova migração nem alteração das Edge Functions do Supabase.
- Mantém login, licença, Cofre, formações, fichas, backup, segurança e atualizador.

## Publicação

1. Envie o projeto completo para o branch `main` em um novo commit.
2. Mantenha o Secret `ANDROID_SIGNING_BUNDLE` e as Variables do Supabase.
3. Execute o workflow **Gerar APK e publicar atualização definitiva**.
4. Aguarde todas as etapas ficarem verdes.
5. Instale ou atualize pelo próprio BuildMaster.

O APK final assinado deve ser gerado pelo GitHub Actions e conferido no aparelho real.
