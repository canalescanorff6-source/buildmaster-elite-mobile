# BuildMaster Elite Tático v27.35 — correção real do atualizador Android

## Diagnóstico confirmado

A falha exibida no aparelho não era causada pelo Supabase, pela release, pelo nome do APK nem pelo certificado de assinatura. O manifesto era encontrado e a atualização aparecia corretamente, mas o plugin Android recusava os parâmetros antes de iniciar o download.

O plugin usava `PluginCall.getLong("expectedVersionCode")` e `PluginCall.getLong("expectedSizeBytes")`. No Capacitor, números JavaScript que cabem em 32 bits chegam ao `JSONObject` como `Integer`. O método `getLong()` aceita somente um objeto `Long`; por isso o `versionCode` válido, como `1384000571`, era transformado em `null`.

Esse `null` ativava exatamente a validação genérica mostrada no aparelho:

> URL, versão ou SHA-256 inválido.

A v27.35 lê o valor diretamente do `JSObject` e converte qualquer `Number` para `long`, mantendo também suporte a string decimal. A mesma correção foi aplicada ao tamanho esperado do APK.

## Alterações do atualizador

- ponte JavaScript → Android corrigida para `Integer`, `Long`, `Double` ou string decimal;
- URL, SHA-256, pacote e versão normalizados antes da validação;
- mensagens separadas para URL, checksum e `versionCode` inválidos;
- `DownloadManager` do Android preservado como transporte principal;
- HTTP direto preservado como reserva;
- validação final de tamanho, SHA-256, cabeçalho APK, pacote, versão, `versionCode` e assinatura;
- exclusão automática de arquivos parciais ou rejeitados;
- teste de regressão reproduzindo um `versionCode` abaixo do limite de `Integer`.

## Correção do aviso de armazenamento

O Cofre já gravava o histórico completo no IndexedDB, mas também mantinha uma segunda cópia pesada no `localStorage`, incluindo imagens e prévias. Essa duplicação podia exceder a cota do WebView e gerar o aviso “Armazenamento com atenção”.

Agora:

- quando o IndexedDB confirma a gravação, a cópia pesada antiga do `localStorage` é removida;
- se o IndexedDB estiver indisponível, o fallback local é compacto e não inclui imagens base64 nem prévias completas;
- uma falha de armazenamento não apaga o estado em memória da sessão.

## Validações executadas

- `npm run test:v2735`: aprovado;
- TypeScript estrito: aprovado;
- auditoria estrutural: 31 verificações aprovadas;
- regressões do atualizador v26.78, v27.26, v27.27, v27.28, v27.29, v27.33 e v27.34: aprovadas;
- testes de assinatura, segurança, backup e contas: aprovados;
- testes de fichas, técnicos, entrosamento, escalação, adversário e plano de jogo: aprovados;
- exportação estática do Next.js: aprovada;
- projeto Capacitor Android sincronizado e plugin gerado com a nova leitura numérica.

A compilação Gradle assinada não foi concluída localmente porque este ambiente não conseguiu acessar `services.gradle.org`. O APK oficial será compilado e assinado pelo GitHub Actions com o secret permanente `ANDROID_SIGNING_BUNDLE`.

## Limitação inevitável da versão instalada

A correção está no código Java nativo do APK. A versão atualmente instalada contém o plugin antigo que rejeita o `versionCode` antes do download. Portanto, ela não consegue instalar automaticamente a própria correção.

É necessária uma única instalação manual da v27.35, por cima do aplicativo existente e com a mesma assinatura. Depois disso, a atualização automática deve ser testada publicando a v27.36. A partir da v27.35, o plugin corrigido fará o download, a verificação e a abertura do instalador automaticamente.

Não é necessário alterar o Supabase, recriar releases manualmente ou substituir `ANDROID_SIGNING_BUNDLE`.
