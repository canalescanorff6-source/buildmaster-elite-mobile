# BuildMaster v26.78 — Atualização Definitiva

Esta versão refaz o fluxo completo de atualização do APK.

## Como funciona

1. O app consulta automaticamente o manifesto ao abrir, voltar do WhatsApp/navegador, reconectar à internet e a cada seis horas.
2. A comparação usa o `versionCode` real instalado, não apenas o texto da versão.
3. O workflow gera sempre um `versionCode` maior, inclusive quando uma nova revisão mantém o mesmo número de versão.
4. O APK é publicado com a assinatura permanente configurada em `ANDROID_SIGNING_BUNDLE`.
5. O aplicativo orienta a liberação de **Permitir desta fonte** no Android.
6. O download mostra progresso e aceita somente o repositório oficial.
7. Antes da instalação são conferidos tamanho, SHA-256, appId, versionCode, versionName e certificado de assinatura.
8. O manifesto é publicado somente depois do APK.
9. O GitHub Actions baixa novamente a release publicada e verifica checksum, tamanho, assinatura e versionCode.

## Compatibilidade com a versão anterior

O manifesto continua apontando para `BuildMaster-Elite-Tatico-latest.apk`, com um identificador único na URL. Isso permite que o atualizador da v26.77 reconheça a v26.78 e reduz o risco de cache antigo.

## Regra obrigatória

O workflow oficial agora falha quando `ANDROID_SIGNING_BUNDLE` não existe. Ele não publica APK debug como atualização, porque APKs assinados com chaves diferentes não podem ser instalados por cima.

## Primeira instalação

- Se o APK instalado já usa a mesma chave permanente, a v26.78 será instalada por cima e os dados serão mantidos.
- Se o APK instalado foi gerado como debug ou com outra chave, faça backup, desinstale uma única vez e instale a v26.78 oficial. Depois disso, as próximas atualizações funcionarão por cima.

## O que configurar no GitHub

### Secret

- `ANDROID_SIGNING_BUNDLE`

### Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BUILDMASTER_ALLOW_LOCAL_FALLBACK` com valor `0`

Não é necessário alterar o banco ou as Edge Functions do Supabase para esta versão.

## Teste recomendado

1. Envie o projeto completo ao GitHub e inicie uma nova execução do workflow.
2. Confirme que a etapa **Verificar release publicada de ponta a ponta** fica verde.
3. Instale a v26.78 oficial.
4. Em **Ajustes → Atualizações**, toque em **Verificar agora**.
5. Em uma versão futura, basta aumentar a versão do `package.json` ou gerar uma nova revisão. O workflow calcula automaticamente o novo `versionCode`.
