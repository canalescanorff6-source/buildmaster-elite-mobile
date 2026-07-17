# BuildMaster v27.12 — atualização sem conflito de cache

## Erro corrigido

A mensagem “o arquivo baixado não corresponde ao manifesto oficial” ocorria quando um APK era reconstruído ou republicado com o mesmo nome. O manifesto novo podia conter o SHA-256 da reconstrução, enquanto alguma rota do GitHub ou da rede ainda entregava os bytes anteriores.

## Correção aplicada

- Cada execução e cada tentativa do GitHub Actions recebe um nome de APK exclusivo.
- O APK versionado não usa `--clobber`; portanto, um mesmo URL nunca troca de conteúdo.
- O workflow baixa e confere publicamente o APK antes de publicar o manifesto.
- O manifesto continua sendo publicado por último.
- O URL inclui um identificador de publicação para evitar cópias antigas em cache.
- O app consulta novamente o manifesto imediatamente antes de instalar.
- O plugin Android desativa cache, solicita conteúdo sem compactação e repete o download até três vezes quando há arquivo truncado ou SHA-256 divergente.
- Uma execução em andamento não é mais cancelada no meio da publicação.

## Compatibilidade

O caminho continua usando a release `buildmaster-latest` e o formato de nome aceito pelo APK v27.00. Assim, a versão instalada atualmente consegue receber a v27.12 normalmente.
