# Verificação do leitor padrão

`npm run test:reader` é o gate compartilhado do Reader V2. Ele deve passar
antes do build no APK direto, no AAB Play e na validação de pull requests.
Esses três workflows executam `npm run test:audit` logo depois, verificando
preservação de storage, conta, backup e evidências de análise/treino/scouting.
O workflow R542 também o executa em `integration`, preservando os oito checks
existentes e passando a acompanhar alterações relevantes na `main`.

## Verificação de código e fluxo

```bash
npm ci
npm run test:reader
npm run test:audit
npm run typecheck
NEXT_TELEMETRY_DISABLED=1 npm run build
```

O gate executa os quatro projetos TypeScript isolados, as regressões do Reader
V2 e os testes comportamentais da seleção, revisão e lifecycle. A regressão
`reader-runtime-ci-gate-regression.mjs` executa os comandos dos workflows com
processos npm/npx controlados: uma falha do reader, auditoria, preparação de
Chromium/assets ou browser OCR deve impedir o comando seguinte.

Os testes de ações usam uma resposta OCR controlada para verificar estado,
evidência e confirmação. Essa execução não comprova a qualidade do OCR de
um screenshot real, o consumo de memória do WebView ou o funcionamento do APK
em um aparelho físico.

## Revisão React e OCR no navegador

PR e `R542/integration` preparam Chromium e os assets locais antes do gate
de navegador. Os filtros R542 são iguais para pull request e push na `main`.
Essa preparação não faz parte de `test:reader`, que deve rodar sem downloads
de navegador ou OCR.

```bash
npx --no-install playwright install --with-deps chromium
npm run vendor:ocr
npm run test:reader:browser
```

O gate de navegador monta o componente de revisão React e exercita edição,
geração e recuperação com uma análise controlada. O outro teste usa canvas,
worker, Tesseract/WASM e idioma português reais para ler uma imagem sintética
nos modos automático e por quadrados, verificando nome, bio, atributos,
habilidades e encerramento do worker sem chamadas externas durante a leitura.

Esses testes verificam execução real do navegador e contratos do layout
controlado. Os screenshots originais, variações do jogo e o WebView Android
ainda exigem a prova física descrita abaixo.

## Build que entra no APK

O APK usa exportação estática com Turbopack. O `npm run build` anterior usa
Webpack; os dois comandos verificam caminhos de compilação diferentes.

Com as variáveis públicas de configuração do ambiente de build disponíveis:

```bash
npm run vendor:ocr
npm run apk:build-web
npm run quality:bundle-built
```

Confirmar `out/tesseract/worker.min.js`, os quatro arquivos de core local e
`out/tesseract/lang/por.traineddata`. O orçamento de bundle soma JS em
`_next/static`; não mede o heap de OCR, WASM, canvas ou bitmaps no aparelho.

Os hooks de typecheck/build executam reparadores históricos. Conferir o diff
de fonte antes e depois da validação para identificar qualquer mudança que
esses comandos tenham produzido.

## Verificação nativa

Java 21+, Android SDK, sdkmanager e adb são necessários. Em um checkout de
build separado com o export estático pronto:

```bash
npx --no-install cap add android
node scripts/install-android-security-plugin.mjs
node scripts/install-match-recorder-plugin.mjs
node scripts/install-native-vault-storage-plugin.mjs
node scripts/install-android-branding.mjs
npx --no-install cap sync android
cd android
./gradlew --no-daemon :app:compileReleaseJavaWithJavac assembleRelease
```

A assinatura e identidade do APK final devem seguir o workflow de release.
`quality:native-java` verifica a fonte Java gerada e seus contratos; não
substitui Gradle, instalação ou execução Android.

## Prova física ainda necessária

Registrar o `sourceSha`, `versionCode` e SHA-256 do APK efetivamente instalado.
`40.80.0` pode identificar diferentes builds e não basta para reproduzir um
erro ou relacioná-lo ao código da `main`.

No mesmo APK, executar os screenshots que apresentaram o problema:

1. Selecionar pela galeria e aguardar a leitura automática até a revisão.
2. Repetir no modo por quadrados, confirmar campos e gerar a ficha.
3. Conferir nome, nível, posição, pontos, atributos e habilidades reconhecidos.
4. Cancelar uma leitura e iniciar outra com uma nova imagem.
5. Salvar a ficha, fechar o app e reabrir; conferir a mesma decisão no Cofre.
6. Alternar de aplicativo durante a leitura e observar a retomada ou erro.

Coletar logcat durante essas ações para relacionar a interrupção com erros
JavaScript, WebView, memória ou processo Android. Registrar também modelo,
versão do Android e versão do Android System WebView.

O workflow separado de aceitação R532 confere o recibo contra o APK e commit
da release. Um template R532, um recibo `BUILD_VERIFIED / DEVICE_PENDING` ou
uma CI verde não são prova de que o fluxo físico passou. A validação do
defeito permanece pendente enquanto os screenshots originais não completarem
o fluxo no aparelho.
