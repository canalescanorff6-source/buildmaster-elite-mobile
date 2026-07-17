# Correção do GitHub Actions — v24.64

## Erro corrigido

O `actions/setup-java@v4` estava configurado com `cache: gradle` antes de o Capacitor criar a pasta `android`. Por isso o GitHub Actions encerrava o trabalho com a mensagem de que nenhum arquivo Gradle havia sido encontrado.

## Alteração aplicada

- Removido `cache: gradle` da etapa **Configurar Java**.
- Adicionado `gradle/actions/setup-gradle@v4` depois de **Criar projeto Android**.
- O restante do workflow continua usando `npm ci`, cache do npm e limites de tempo.

Depois de substituir os arquivos no repositório, execute o workflow novamente. Não use apenas **Re-run jobs** na execução antiga, porque isso executa o commit anterior.
