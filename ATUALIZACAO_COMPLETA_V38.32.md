# BuildMaster v38.32 — Integração completa

A v38.32 foi implementada sobre a v38.31, preservando o aplicativo, o `applicationId` `com.buildmaster.elitetatico`, o fluxo de atualização, a assinatura esperada pelos workflows, Supabase, login, Cofre, Meu Time, fichas, OCR, gravações e módulos anteriores.

## Criação de usuários

- validação local clara de usuário, senha, prazo e aparelho;
- retorno abaixo do botão e estado `Criando usuário...`;
- bloqueio de envio repetido na interface e por `clientRequestId`;
- uma única rota Android por `CapacitorHttp`;
- confirmação independente do Auth, perfil e prazo no Supabase;
- limpeza do usuário do Auth quando o perfil não é confirmado;
- recuperação idempotente de uma operação já concluída;
- geração e cópia de senha segura.

## Gravações

- área `Minhas gravações`;
- assistir, analisar, salvar, compartilhar, renomear e excluir;
- nome público `BuildMaster_Partida_AAAAMMDD_HHMMSS.mp4`;
- destino `Filmes/BuildMaster/Partidas` via MediaStore;
- compartilhamento por `content://` e `Intent.EXTRA_STREAM`;
- validação de tamanho, estado da Galeria, prontidão para análise e armazenamento disponível;
- a exclusão interna não remove uma cópia já exportada para a Galeria.

## Análise de Vídeo Inteligente 2.0

- abas Resumo, Momentos, Ataque, Defesa, Comandos, Tática, Treino e Evolução;
- linha do tempo com evidência, consequência, alternativa, gravidade e confiança;
- candidatos automáticos separados de lances confirmados;
- confirmar, editar ou descartar antes de pontuar;
- comandos classificados como observados, inferidos ou não confirmados;
- clipe normal, 0,5x, pausa no quadro-chave e anotações táticas;
- notas separadas e explicadas;
- três erros prioritários, jogadas-modelo, treino e comparação entre partidas.

## Estúdio de Formações Meta Premium

- integrado ao Meu Time, sem criar outro aplicativo;
- modos Rápido, Personalizado e Inteligente;
- três estilos de técnico e 16 objetivos;
- catálogo com 30 formações personalizadas, 10 por estilo;
- exatamente 11 posições calibradas por formação;
- apenas os 22 estilos oficiais definidos para o projeto;
- validação de complementaridade, cobertura, criação, profundidade e risco;
- seleção de jogadores do Meu Time com indicação ideal, compatível, adaptável ou de risco;
- setas, zonas, instruções e textos relacionados à formação;
- prévia em tempo real e identidade Marques Fichas.

## Exportação tática

- composição gráfica por camadas controladas;
- formatos vertical, quadrado, Story, WhatsApp, somente campo e completo;
- PNG em alta resolução;
- PDF pelo fluxo de impressão do navegador/aparelho;
- compartilhamento e salvamento;
- personalização de textos, jogadores, posições, setas, fundo, camisa, notas, time, usuário e logo.

## Integração e dados

- formações Meta entram no backup e na restauração;
- sessões e análises de partidas entram no backup de desempenho;
- jogadores do Meu Time podem ser ligados aos 11 lugares da formação;
- nenhuma ficha ou jogador é alterado automaticamente;
- regras de ficha, cinco habilidades, Boosters e posição escolhida permanecem preservadas.

## Versão

- versão do pacote: `38.32.0`;
- PWA: `BuildMaster Elite Tático v38.32`;
- cache: `buildmaster-v38-32-complete-integration-1`;
- regressão: `test:v3832`;
- Play workflow: `Gerar AAB v38.32 Google Play`;
- APK workflow preservado: `Gerar APK Canal Direto`.
