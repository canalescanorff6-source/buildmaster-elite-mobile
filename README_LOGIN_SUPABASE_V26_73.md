# BuildMaster v26.73 — correção do login Supabase

## Problema identificado

A pasta `out` do projeto recebido continha valores de teste:

- `https://example.supabase.co`
- `sb_publishable_test`

Como esses valores não estavam vazios, a tela dizia “Licença verificada no servidor”, mas o APK não estava conectado ao projeto real. Além disso, qualquer erro do Supabase era exibido como “Usuário ou senha incorretos”.

## Correções

- valores de exemplo deixam de ser aceitos como configuração válida;
- o login diferencia senha incorreta, conta não confirmada, chave inválida e falha de conexão;
- o GitHub Actions interrompe o build quando URL ou chave estão ausentes, inválidas ou de teste;
- o workflow confirma que a URL e a chave reais foram incorporadas em `out`;
- o workflow confirma novamente os valores dentro dos arquivos Android que serão empacotados no APK.

## Como gerar o APK correto

No GitHub, mantenha em **Settings → Secrets and variables → Actions → Variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BUILDMASTER_ALLOW_LOCAL_FALLBACK` com valor `0`

Depois execute o workflow **Gerar APK e publicar atualização segura v26.73**. A etapa “Confirmar Supabase real no app gerado” precisa ficar verde.

## APK de teste sem assinatura

O workflow agora também gera um APK de teste quando o Secret `ANDROID_SIGNING_BUNDLE` ainda não existe. Assim é possível confirmar o login primeiro. Nesse modo, a atualização automática não é publicada e talvez seja necessário desinstalar o APK antigo antes de instalar o novo.
