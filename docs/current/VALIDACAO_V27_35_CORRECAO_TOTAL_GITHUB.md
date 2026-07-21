# BuildMaster Elite Tático v27.35 — Correção total do GitHub Actions

## Falha reproduzida

A execução falhava em **Rodar testes do motor** com:

```text
ENOENT: no such file or directory,
open 'android/app/src/main/java/com/buildmaster/elitetatico/BuildMasterSecurityPlugin.java'
```

O diretório `android/` é intencionalmente ignorado pelo Git porque é gerado pelo Capacitor durante o workflow. O teste da v27.35, entretanto, tentava abrir esse arquivo antes da etapa `cap add android`. Em um checkout limpo do GitHub, o arquivo realmente não existe.

## Correções aplicadas

1. O teste da v27.35 deixou de depender do diretório Android gerado.
2. O instalador do plugin é executado em um projeto Android temporário e limpo durante o teste.
3. O Java produzido é verificado nos dois pontos: gerador e saída gerada.
4. Foi criado um segundo teste que compila `BuildMasterSecurityPlugin.java` e `MainActivity.java` com `javac` e APIs Android/Capacitor mínimas de teste.
5. O workflow agora remove qualquer pasta `android/` antiga antes de `cap add android`, evitando mistura com arquivos de versões anteriores.
6. O workflow ganhou uma etapa específica de pré-compilação:

```text
:app:compileReleaseJavaWithJavac
```

7. O tempo máximo do job foi aumentado de 55 para 90 minutos, pois os limites individuais anteriores podiam ultrapassar o limite total do job.
8. A ordem antiga da suíte foi preservada para manter compatibilidade com todos os testes de regressão históricos.
9. O plugin mantém a correção `Number -> long`, os snapshots finais da `Thread`, DownloadManager, transporte HTTP reserva, SHA-256, pacote, versão, versionCode e assinatura.

## Validações executadas

- Teste em checkout sem diretório `android/`: aprovado.
- Geração temporária do plugin Android: aprovada.
- Compilação do Java gerado com `javac`: aprovada.
- TypeScript estrito: aprovado.
- Build estático Next.js para o APK: aprovado.
- Auditoria automática: 31 verificações aprovadas.
- Suítes históricas de fichas, OCR, contas, backup, segurança, Estúdio Tático e atualizador: aprovadas.
- Dois arquivos YAML do GitHub Actions: analisados com sucesso.
- 42 blocos Bash dos workflows: sintaxe aprovada.
- Manifesto placeholder local: ausente.
- Nenhuma chave privada, keystore, APK assinado ou segredo incluído no pacote.

## Limite da validação local

A compilação Gradle Android completa não pôde baixar a distribuição do Gradle neste ambiente, porque `services.gradle.org` não estava acessível. Para reduzir esse risco, o Java gerado foi compilado diretamente com `javac`, e o workflow agora executará também a tarefa Gradle de pré-compilação antes de montar o APK.

A assinatura e a publicação final continuam sendo feitas no GitHub com o `ANDROID_SIGNING_BUNDLE` permanente.

## Publicação

1. Substituir todo o conteúdo do repositório pelo pacote corrigido, incluindo `.github`.
2. Fazer um **novo commit** na branch `main`.
3. Não usar apenas **Re-run jobs** na execução antiga, pois ela usa o commit defeituoso.
4. Aguardar as etapas **Rodar testes do motor**, **Pré-compilar Java do atualizador**, **Gerar APK release** e as validações públicas ficarem verdes.
