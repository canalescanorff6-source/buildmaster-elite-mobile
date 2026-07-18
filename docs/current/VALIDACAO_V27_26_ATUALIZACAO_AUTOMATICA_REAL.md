# BuildMaster Elite Tático v27.26 — auditoria e atualização automática real

## Escopo auditado

A base enviada foi extraída e percorrida por inteiro. Antes da inclusão deste relatório, a análise contabilizou **551 arquivos de projeto**, aproximadamente **47.831 linhas em arquivos de código/configuração**, **102 arquivos em `src`**, **65 testes** e os workflows da pasta `.github`. Também foram conferidos o código web, o plugin Android gerado, o manifesto Android, os scripts de build, o sistema de backup, a validação de assinatura e a publicação pelo GitHub Actions.

O objetivo principal foi corrigir o fluxo completo de atualização sem exigir que o usuário entre em Releases ou baixe um APK manualmente.

## Causas encontradas

1. O atualizador aceitava a primeira rota válida. Se essa rota ainda mostrasse um manifesto antigo, ela escondia uma versão mais nova existente em outra rota.
2. A verificação automática detectava a atualização, mas não iniciava automaticamente o download e a abertura do instalador.
3. O backup anterior à atualização dependia de exportação manual com senha e poderia interromper o fluxo.
4. O canal dependia excessivamente de arquivos mutáveis e da propagação/cache do GitHub.
5. Existia um `public/update-manifest.json` antigo, com dados de exemplo e checksum inválido, que não deveria fazer parte do aplicativo.
6. Um APK rejeitado por incompatibilidade de assinatura poderia permanecer no cache local.
7. A validação pública final da ponte antiga tinha uma URL de conferência montada com `&` sem uma query anterior; isso foi corrigido para `?` e ganhou teste de regressão.

## Arquitetura nova de atualização

O aplicativo consulta **três canais independentes em paralelo**:

1. **Canal principal:** `buildmaster-update/update-manifest.json` por `raw.githubusercontent.com`.
2. **Ponte de compatibilidade:** `buildmaster-latest/update-manifest.json`, preservada para APKs antigos.
3. **Rota de reserva:** API `releases/latest`, que encontra o manifesto da release imutável mais recente.

Todas as respostas válidas são comparadas. A seleção prioriza, nesta ordem: maior `versionCode`, maior versão semântica, data mais recente e prioridade da rota. Portanto, uma rota antiga não pode esconder outra mais nova.

## Comportamento automático na v27.26

Ao abrir o app, retornar para ele ou recuperar conexão, o verificador automático:

- consulta os três canais;
- registra diagnóstico e rota escolhida;
- cria uma cópia local de recuperação em IndexedDB, sem pedir senha ou abrir seletor de arquivos;
- inicia o download quando a permissão Android já está liberada;
- abre automaticamente a tela oficial de permissão na primeira necessidade;
- ao retornar ao app, tenta continuar o fluxo;
- valida tamanho, SHA-256, cabeçalho APK/ZIP, `applicationId`, versão, `versionCode` e certificado de assinatura;
- apaga qualquer pacote rejeitado;
- abre o instalador oficial do Android.

A opção “Baixar e abrir o instalador automaticamente” fica ligada por padrão e pode ser desativada pelo usuário.

## Publicação segura no GitHub

O workflow da v27.26:

- exige a chave permanente `ANDROID_SIGNING_BUNDLE`;
- executa TypeScript e toda a suíte de regressão;
- gera um `versionCode` maior que o das versões v27.25 anteriores;
- cria um nome exclusivo por execução/tentativa;
- publica um único APK em uma release imutável;
- baixa novamente esse APK pela URL pública;
- confere hash, tamanho, pacote, versão e assinatura;
- somente depois atualiza o canal `buildmaster-update` pela API de Contents do GitHub;
- valida publicamente o canal raw e o APK apontado;
- somente depois atualiza a ponte `buildmaster-latest`;
- valida publicamente a ponte antiga e o mesmo APK;
- marca a release imutável como Latest por último.

Assim, nenhum manifesto é ativado antes de o APK público correspondente ser comprovado.

## Compatibilidade com o APK já instalado

Código novo não pode executar dentro de uma versão antiga antes que ela seja atualizada. A versão anterior enviada pelo usuário já possui detecção automática, mas ainda exige tocar no botão do próprio app para iniciar o primeiro download. A ponte `buildmaster-latest` foi mantida especificamente para permitir essa transição **sem abrir Releases e sem baixar arquivo manualmente**.

Depois que a v27.26 estiver instalada, as próximas atualizações podem iniciar automaticamente conforme o fluxo descrito acima.

O Android ainda exige a permissão “Instalar apps desconhecidos” para a fonte e a confirmação final “Atualizar”. Essas confirmações pertencem ao sistema operacional e não podem ser eliminadas por um aplicativo Android comum.

## Validações executadas

- `npm ci`: aprovado.
- TypeScript estrito: aprovado.
- Suíte completa de testes do app: todos os scripts foram aprovados, executados em blocos devido ao limite de tempo do terminal.
- Regressões específicas v27.26, v27.25, v27.22, v27.21, atualização v26.78, segurança v26.75, backup e integridade de release: aprovadas novamente após a correção final.
- Exportação estática para APK: aprovada.
- Criação do projeto Android e sincronização do Capacitor: aprovadas.
- Geração do plugin nativo: aprovada.
- Análise sintática do Java gerado: aprovada.
- Manifesto Android: `REQUEST_INSTALL_PACKAGES`, `FileProvider`, bloqueio de tráfego HTTP e `allowBackup=false` confirmados.
- Workflow YAML: analisado com sucesso.
- Todos os 31 blocos shell do workflow: aprovados por `bash -n`.
- Manifesto local obsoleto: removido e protegido por teste.

A compilação Gradle local não foi concluída neste ambiente porque ele não conseguiu alcançar `services.gradle.org` e não possuía o Gradle/SDK necessário em cache. Isso não é um erro de código constatado: o projeto Android, o plugin e o Java foram gerados e validados; a geração assinada final ocorrerá no runner Android do GitHub Actions.

## Limites e prova final

A correção foi validada no código e no ambiente de build disponível. A confirmação definitiva depende de duas etapas externas que só acontecem no ambiente do usuário:

1. o workflow terminar em verde usando a chave de assinatura permanente do repositório;
2. o APK publicado ser testado no aparelho real.

A mesma chave que assinou o APK instalado é obrigatória. Se o secret tiver outra chave, o Android recusará a atualização por segurança e nenhuma alteração no downloader poderá contornar essa regra.

## Publicação

Extraia o pacote, substitua o repositório inteiro incluindo `.github`, faça um commit na `main` e aguarde o workflow **“Gerar APK v27.26 e publicar atualização automática em três canais”**. Depois, use somente a Central de Atualizações do aplicativo. Não é necessário entrar em Releases nem baixar APK manualmente.
