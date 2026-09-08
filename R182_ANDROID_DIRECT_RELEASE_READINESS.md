# R182 — Android Direct Release Readiness

## Objetivo

Fechar a prontidão Android/APK da base R181 sem alterar o motor esportivo, a autoridade R119, o Cofre, o cálculo de progressão, as 5 habilidades adicionais ou os Ímpetos.

A R182 concentra-se em três pontos:

1. validar a cadeia Capacitor/Android reproduzível;
2. corrigir a proteção nativa do OCR no APK direto;
3. distinguir falha de código de ausência de toolchain local.

## Achados reais

### 1. Regressões Android presas ao CardVisionApp antigo

Os testes `v40-10-android-ocr-bootstrap-hotfix-regression.mjs` e `v40-20-android-ocr-bootstrap-hotfix-regression.mjs` ainda procuravam o pré-aquecimento, status e progresso do OCR diretamente no `CardVisionApp`.

A autoridade atual já é:

- `readerInteractionRuntimeR164.ts` — pré-aquecimento do worker;
- `readerAnalysisRuntimeR163.ts` — status amigável e progresso do bootstrap.

As regressões foram realinhadas sem mudar o comportamento do OCR.

### 2. Plugin de proteção OCR existia, mas não entrava no APK direto

O projeto já continha `scripts/install-background-ocr-plugin.mjs` e o runtime web já chamava `BuildMasterBackgroundOcr`, porém `.github/workflows/build-apk.yml` não instalava esse plugin.

Como as chamadas nativas eram `catch`-safe, o aplicativo não precisava quebrar; porém a proteção foreground ao alternar entre aplicativos podia simplesmente não existir no APK publicado.

A R182 inclui o instalador no workflow do APK direto e valida:

- `BuildMasterBackgroundOcrPlugin.java`;
- `BuildMasterBackgroundOcrService.java`;
- registro no `MainActivity`;
- declaração do serviço no Manifest;
- permissões foreground necessárias.

### 3. Permissão dataSync podia faltar por causa da ordem real dos plugins

O gravador de partidas instala `android.permission.FOREGROUND_SERVICE` antes do OCR.

O instalador OCR antigo adicionava `FOREGROUND_SERVICE` e `FOREGROUND_SERVICE_DATA_SYNC` dentro do mesmo `if`. Se a permissão genérica já existisse, a permissão específica `FOREGROUND_SERVICE_DATA_SYNC` não era adicionada.

A R182 passa a garantir independentemente:

- `android.permission.FOREGROUND_SERVICE`;
- `android.permission.FOREGROUND_SERVICE_DATA_SYNC`;
- `android.permission.POST_NOTIFICATIONS`.

A regressão nativa reproduz a ordem real de instalação para impedir o retorno desse defeito.

## Google Play

O plugin `BuildMasterBackgroundOcr` **não foi ativado no AAB da Play nesta R**.

Motivo: o serviço usa foreground service do tipo `dataSync`. Antes de colocar esse serviço no canal Play, o tipo de foreground service e sua declaração precisam estar enquadrados de forma compatível com a política vigente da Play. A R182 documenta essa diferença diretamente no workflow Play em vez de introduzir silenciosamente uma permissão sensível.

O APK direto recebe a proteção OCR nativa completa.

## Novo doctor R182

Arquivo:

`scripts/check-android-release-readiness-r182.mjs`

Ele valida 51 contratos de fonte/workflow, incluindo:

- Node/Capacitor declarados;
- appId `com.buildmaster.elitetatico`;
- `webDir: out`;
- HTTPS e WebView de produção;
- export estático Next;
- sequência `vendor:ocr -> build web -> cap add -> plugins -> cap sync -> Java -> assembleRelease`;
- Keystore/segurança;
- Cofre privado;
- branding;
- OCR português BEST;
- plugin OCR foreground no APK direto;
- política conservadora no AAB Play.

O modo `--strict-env` também exige toolchain local completo.

## Validação desta R

### R182

- `npm run test:r182` — aprovado;
- Java nativo gerado — aprovado;
- prontidão Android de fonte/workflow — 51 contratos aprovados;
- regressão Android v38.40 — aprovada;
- regressões Android v40.10/v40.20 — aprovadas;
- YAML dos workflows APK e Play — sintaticamente válido.

### Gates globais preservados

- bundle: **5.497.941 / 5.505.024 B** — aprovado;
- sintaxe: **655 TS/TSX** — aprovado;
- interações: **790 botões / 34 imagens com alt** — aprovado;
- visual/acessibilidade — aprovado;
- auditoria: **127/127**;
- pré-voo de produção: **138/138**;
- assinatura lógica: `3b060951bdd4913b`;
- Play: **27/27**;
- R181 — aprovado;
- R180 global audit — aprovado e atualizado para exigir R182 na cadeia final.

## Ambiente local desta execução

Disponível:

- Node.js **22.16.0**;
- Java **21.0.11**.

Bloqueios externos do container:

- acesso ao registro npm indisponível durante `npm ci`;
- dependências ficaram incompletas e foram consideradas não utilizáveis;
- `ANDROID_HOME` / `ANDROID_SDK_ROOT` não estão configurados;
- Android SDK/build-tools não estão instalados neste ambiente.

Por esses motivos, esta execução **não declara que um APK binário foi compilado localmente**. O bloqueio é de toolchain/rede do ambiente, não dos contratos de fonte Android.

## Caminho oficial para gerar o APK real

O workflow `.github/workflows/build-apk.yml` permanece a rota oficial para build reproduzível. Ele exige:

- Java 21;
- npm público acessível;
- Android SDK do runner;
- `NEXT_PUBLIC_SUPABASE_URL` real;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` pública real;
- `ANDROID_SIGNING_BUNDLE` permanente.

A sequência final inclui geração do site estático, OCR local, projeto Android limpo, plugins nativos, branding, sincronização Capacitor, compilação Java, `assembleRelease`, `zipalign`, assinatura e validação por `apksigner`/`aapt`.

## Smoke test recomendado em aparelho real

Após gerar o APK:

1. instalação limpa e abertura a frio;
2. login/Supabase;
3. abertura do Leitor;
4. seleção de print e leitura OCR;
5. alternar para outro aplicativo durante a leitura;
6. confirmar notificação foreground da leitura protegida;
7. retornar ao BuildMaster e confirmar retomada/resultado;
8. reiniciar o app e conferir Cofre privado;
9. testar gravação de partida;
10. testar atualização do APK direto e validação de assinatura/SHA-256.

## Conclusão

A R182 deixa a **fonte do canal APK direto pronta e auditada** e corrige duas falhas reais de empacotamento Android: plugin OCR não instalado e permissão `FOREGROUND_SERVICE_DATA_SYNC` dependente da ordem dos plugins.

Nenhuma regra esportiva foi alterada.
