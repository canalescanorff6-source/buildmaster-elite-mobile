# R183 — Android Release Channel Convergence

## Objetivo
Consolidar as duas variantes R182 que haviam evoluído em paralelo. A base mais recente preservava as correções do APK direto, porém havia perdido correções já feitas no workflow Google Play. A R183 passa a ser a única fonte canônica para os dois canais.

## Falha estrutural encontrada
A R182 de APK direto continha corretamente o plugin `BuildMasterBackgroundOcr`, a permissão `FOREGROUND_SERVICE_DATA_SYNC` independente da ordem dos instaladores e regressões OCR alinhadas a R163/R164. Porém seu `.github/workflows/build-play-store.yml` havia regredido para:
- versão fixa `40.70.0`;
- release notes fixas `40.70.0.txt`;
- artefato histórico `buildmaster-play-v40-30-*`;
- ausência do preflight nativo consolidado.

Outra variante R182 já tinha corrigido o Play, mas não continha toda a proteção Android direta mais recente. Nenhuma das duas, isoladamente, representava a união correta.

## Correções R183
1. Mantida integralmente a linha mais nova do APK direto:
   - `install-background-ocr-plugin.mjs` no APK direto;
   - `FOREGROUND_SERVICE_DATA_SYNC` independente;
   - `POST_NOTIFICATIONS` independente;
   - serviço e plugin OCR validados no Manifest/MainActivity;
   - regressões OCR v40.10/v40.20 apontando para R163/R164.
2. Restaurada a linha correta da Google Play:
   - versão derivada de `package.json`;
   - SemVer validado;
   - release notes derivadas de `${VERSION}`;
   - artefato de homologação usa `BUILDMASTER_VERSION` + `ANDROID_VERSION_CODE`;
   - removidos hardcodes `40.70.0` e `v40-30`.
3. O Play continua deliberadamente sem `BuildMasterBackgroundOcr`/`FOREGROUND_SERVICE_DATA_SYNC`, documentando a diferença de política em vez de instalar silenciosamente serviço foreground sensível.
4. Novo preflight R183 unifica contratos dos dois canais e valida Capacitor sincronizado no lockfile.
5. Os workflows APK e Play executam `npm run apk:preflight-native` após `npm ci`.
6. A cadeia `test:v4080` passa a terminar em R183, preservando R180 → R181 → R182 → R183.

## Escopo preservado
Nenhum arquivo de `src` foi alterado. Não houve mudança no motor esportivo, Clean Slate R119, DNA R122, progressão R125, Top 5, Ímpetos, Cofre, OCR web R163/R164 ou UI.

## Resultado esperado
Uma única base deixa de escolher entre “APK direto correto” e “Play correto”: ambos os contratos passam a coexistir e são protegidos por regressão específica contra nova divergência de branches/variantes.

## Validações executadas
- YAML dos workflows APK/Play: aprovado;
- R182 direto: aprovado;
- R183 convergência: aprovado;
- Java nativo gerado: aprovado;
- R180 auditoria global: 425/425 módulos alcançáveis;
- R181 aposentadoria de motores redundantes: aprovada;
- contrato preventivo do CI: aprovado;
- sintaxe: 655 TS/TSX;
- interações: 790 botões / 34 imagens com alt;
- visual/acessibilidade: aprovado;
- auditoria: 127/127;
- pré-voo de produção: 138/138;
- pré-voo Play: 27/27;
- orçamento TypeScript: 5.497.941 / 5.505.024 bytes (verde, margem 7.083 bytes).

## Limite desta execução
O ambiente atual possui Java 21, mas não possui Android SDK/adb/sdkmanager nem `node_modules` completos. Portanto, a R183 valida fonte, workflows, regressões e Java gerado, mas não declara um APK/AAB físico compilado localmente. Os workflows GitHub Actions permanecem a prova final de build, assinatura e publicação.
