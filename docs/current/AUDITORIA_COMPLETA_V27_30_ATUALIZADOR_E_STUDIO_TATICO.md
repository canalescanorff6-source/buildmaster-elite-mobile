# Auditoria completa — BuildMaster Elite Tático v27.32

## Escopo realmente revisado

A base possui 582 arquivos úteis, 114 arquivos em `src` e 70 arquivos de testes. Foram revisados o fluxo de publicação, manifesto, rotas do GitHub, transporte Android, validação do APK, assinatura, atualização em segundo plano, interface da Central de Atualizações, formação tática, exportação de imagens, armazenamento, backup, contas, segurança e estrutura geral.

## Diagnóstico do atualizador

O aplicativo já encontrava a nova versão e o APK baixado manualmente era instalável. Isso afasta Supabase, `applicationId`, versão e assinatura como causa principal do erro de download. A falha acontecia antes do instalador, na comparação dos bytes recebidos pelo transporte HTTP próprio com tamanho e SHA-256 do manifesto.

A conclusão técnica mais provável é uma incompatibilidade do `HttpURLConnection` usado pelo atualizador anterior com o encadeamento de redirecionamentos/CDN do GitHub em alguns aparelhos ou ROMs. O navegador e o gerenciador de downloads do Android conseguiam obter o arquivo correto, enquanto o fluxo HTTP interno recebia bytes divergentes ou incompletos.

## Correção principal aplicada

- `DownloadManager` do Android passou a ser o transporte principal.
- O download vai para a pasta privada do aplicativo, sem solicitar acesso geral aos arquivos.
- O fluxo HTTP próprio foi mantido como reserva independente.
- São feitas até quatro tentativas, alternando sistema e HTTP.
- O APK continua bloqueado até passar em tamanho, SHA-256, cabeçalho ZIP/APK, pacote, versão, `versionCode` e certificado de assinatura.
- Downloads simultâneos continuam bloqueados.
- APK inválido é apagado antes de uma nova rota ser testada.
- O diagnóstico agora informa qual transporte funcionou.

## Publicação no GitHub

O manifesto principal agora aponta primeiro para um APK de release imutável. Esse arquivo nunca é sobrescrito. O mesmo manifesto publica dois espelhos oficiais:

1. APK versionado na release fixa `buildmaster-latest`;
2. `BuildMaster-Elite-Tatico-latest.apk` para compatibilidade com versões antigas.

O workflow valida publicamente os bytes do APK antes de ativar os manifestos. A release imutável continua sendo marcada como `Latest` apenas no final.

## Atualização verdadeiramente automática

A v27.32 verifica ao abrir o app, ao voltar para o primeiro plano, quando a internet retorna e a cada seis horas. Quando encontra uma versão maior e a opção automática está ativa, prepara a cópia de recuperação, baixa, valida e abre o instalador.

O Android ainda exige a autorização única de “Instalar apps desconhecidos” e a confirmação final do instalador. Um aplicativo comum não pode concluir silenciosamente essa última etapa.

## Estúdio Tático Local

Foi criado um gerador determinístico de imagens inspirado na organização visual da referência enviada, sem copiar a marca e sem usar API de inteligência artificial:

- arte premium escura com paletas ouro, ciano e rubi;
- formação e jogadores vindos da análise do app;
- camisas, posições, funções e notas de encaixe;
- linhas de passe, reciclagem e compactação defensiva;
- painéis de instruções, legenda, princípios e erros;
- campos editáveis;
- exportação local em SVG e PNG;
- funcionamento offline e sem custo por imagem.

A função foi integrada ao Laboratório de Formações.

## Pontos estruturais encontrados

### Prioridade alta

- `src/components/CardVisionApp.tsx`: 6.964 linhas. Deve ser dividido por domínio em uma versão planejada, pois concentra navegação, estado e vários módulos.
- `src/app/legacy-compat.css`: 12.753 linhas. Precisa ser separado por tela e ter regras antigas removidas gradualmente.
- `src/lib/analyzer.ts`: 4.404 linhas. O motor deve ser separado em leitura, regras, pontuação, ficha, habilidade e explicações.

Esses três arquivos não foram reescritos integralmente nesta entrega porque uma refatoração brusca aumentaria muito o risco de quebrar fichas, contas ou histórico. A v27.32 adiciona a correção crítica sem alterar o contrato desses módulos.

### Prioridade média

- Central de Atualizações e plugin Android ainda são grandes, mas agora possuem responsabilidades mais explícitas.
- Há 323 documentos históricos na raiz e em subpastas. Eles não entram no APK, porém deixam o repositório mais difícil de manter.
- O conjunto de 70 testes é amplo, mas ainda depende do ambiente do GitHub para TypeScript completo, Gradle e APK assinado.

## Validações executadas neste ambiente

- auditoria automática: 31 verificações aprovadas;
- regressão específica v27.32 aprovada;
- regressões relevantes de atualização, release, backup e ponte antiga aprovadas com executor TypeScript local;
- sintaxe dos arquivos TypeScript/TSX modificados aprovada pelo compilador TypeScript;
- workflow YAML analisado com sucesso;
- 37 blocos shell do workflow aprovados por `bash -n`;
- plugin Java gerado com 774 linhas, chaves balanceadas e todos os métodos esperados;
- SVG de amostra gerado e validado como XML;
- PNG de amostra renderizado em 1024 × 1536;
- auditoria de segredos sem keystore, chave privada ou APK dentro do código.

## Limitações da validação local

Não foi possível executar `npm ci`, o build completo do Next, Gradle ou assinar um APK neste ambiente porque não há acesso ao registro npm/servidores Android e a chave permanente existe somente no GitHub. A prova final é o workflow verde com o seu Secret e o teste em aparelho real.

## Protocolo definitivo de teste

1. Publicar e colocar a v27.32 no aparelho.
2. Publicar o pacote v27.31 de teste entregue junto desta auditoria.
3. Abrir a v27.32 e aguardar a verificação automática.
4. Confirmar que o diagnóstico mostra `android-download-manager` ou, se necessário, um transporte HTTP de reserva.
5. Confirmar “Atualizar” na tela do Android.
6. Conferir a versão 27.31 instalada e a preservação das fichas, contas e configurações.

A versão antiga já instalada não pode receber o novo `DownloadManager` antes de a v27.32 entrar no aparelho. Portanto, primeiro tente a ponte automática existente. Caso o atualizador antigo continue entregando bytes incorretos, uma instalação manual única da base v27.32 é tecnicamente inevitável; depois dela, o teste v27.31 comprova o fluxo novo.
