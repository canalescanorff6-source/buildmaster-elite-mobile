# Atualização corrigida — diagnóstico e solução

## Problema encontrado

Os builds mais recentes terminavam em verde, mas mostravam o aviso de que os Secrets de assinatura estavam ausentes. Nessa situação o GitHub criava apenas um artefato temporário e não substituía a release usada pelo aplicativo.

Por isso, o app continuava consultando uma release antiga e não encontrava a revisão nova. Além disso, cada APK de depuração podia usar uma chave diferente e o Android recusava a instalação por cima.

## O que foi corrigido

- um único Secret de assinatura: `ANDROID_SIGNING_BUNDLE`;
- o workflow falha claramente quando a assinatura não foi configurada;
- build de produção `assembleRelease`, sem distribuir APK de depuração;
- alinhamento com `zipalign` e assinatura com `apksigner`;
- verificação da assinatura antes de publicar;
- publicação da release e do manifesto em toda execução bem-sucedida;
- substituição dos arquivos da release sem apagar a versão anterior antes de concluir;
- APK, manifesto, build ID, `versionCode` e SHA-256 gerados juntos;
- URL de atualização continua apontando para `buildmaster-latest`.

## Resultado esperado

Depois da primeira instalação com a chave permanente, as próximas versões poderão ser instaladas por cima, mantendo conta, configurações e dados locais. O Android ainda pedirá confirmação do usuário para instalar, pois o app não está na Play Store.
