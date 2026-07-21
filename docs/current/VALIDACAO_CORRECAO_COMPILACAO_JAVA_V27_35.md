# Validação — correção da compilação Java v27.35

## Erro reproduzido no GitHub Actions

A etapa **Gerar APK release** falhava na compilação de `BuildMasterSecurityPlugin.java` com a mensagem:

```text
local variables referenced from a lambda expression must be final or effectively final
```

O método `downloadAndInstallApk` normalizava `urlValue`, `expectedChecksum`, `expectedVersionName` e `expectedSize` antes de iniciar uma `Thread`. Como essas variáveis recebiam novos valores, deixavam de ser “effectively final” e não podiam ser capturadas pela lambda do Java.

## Correção aplicada

Depois de todas as validações e antes da criação da `Thread`, o plugin agora cria cópias imutáveis:

```java
final String downloadUrl = urlValue;
final String checksumSha256 = expectedChecksum;
final long manifestVersionCode = expectedVersionCode.longValue();
final Long manifestSizeBytes = expectedSize;
final String manifestVersionName = expectedVersionName;
```

A rotina assíncrona usa somente essas cópias finais. A correção foi aplicada nos dois lugares necessários:

- `android/app/src/main/java/com/buildmaster/elitetatico/BuildMasterSecurityPlugin.java`
- `scripts/install-android-security-plugin.mjs`

Assim, uma futura sincronização ou recriação do Android não devolve o código defeituoso.

## Proteção contra regressão

O teste `tests/v27-35-native-number-bridge-regression.mjs` agora confirma que:

- os snapshots finais existem no gerador e no plugin gerado;
- nenhuma variável normalizada/mutável é usada dentro da lambda;
- os snapshots não aparecem antes da própria declaração;
- a ponte `Number → long` do `versionCode` continua ativa;
- o código antigo com `PluginCall.getLong()` não reaparece.

## Validações executadas

- TypeScript estrito: aprovado.
- Teste específico v27.35: aprovado.
- Testes do atualizador v26.78, v27.21–v27.29 e v27.34: aprovados.
- Auditoria automática: 31 verificações aprovadas.
- Exportação estática do aplicativo: aprovada.
- Sincronização do Capacitor Android: aprovada.
- Suítes restantes do aplicativo executadas em grupos: aprovadas.
- O gerador do plugin foi executado e produziu exatamente o mesmo arquivo Java corrigido.

## Limite da validação local

O Gradle não pôde baixar sua distribuição neste ambiente sem acesso externo. A compilação release assinada continuará sendo executada pelo GitHub Actions, que possui rede e usa o Secret `ANDROID_SIGNING_BUNDLE`.

O erro mostrado no print era um erro de linguagem Java na captura da lambda; os pontos indicados pelo compilador foram substituídos por variáveis finais antes de o projeto ser entregue.
