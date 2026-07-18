# Atualizador Definitivo — v27.21.0

## Problema corrigido

O canal antigo usava uma release mutável chamada `buildmaster-latest`. Mesmo com nome único de APK, a combinação de cache do GitHub/CDN, reexecuções do workflow e manifesto substituído podia fazer o aparelho receber bytes diferentes daqueles usados para calcular tamanho e SHA-256. O bloqueio do app era correto, mas a publicação não era suficientemente imutável.

## Nova arquitetura

1. Cada execução cria uma tag exclusiva no formato `buildmaster-vVERSAO-VERSIONCODE-TENTATIVA`.
2. O APK e o manifesto dessa execução são publicados em uma release isolada.
3. A própria automação baixa os arquivos públicos e confere tamanho, SHA-256, assinatura e versionCode.
4. Somente depois da conferência a release é marcada como a mais recente.
5. A v27.21 consulta primeiro a API oficial `releases/latest` e localiza o manifesto da release aprovada.
6. A release `buildmaster-latest` continua sendo atualizada para que APKs v27.00–v27.20 ainda encontrem a transição.

## Correções no aplicativo

- manifesto lido como texto antes do JSON, inclusive quando o GitHub responde como `application/octet-stream`;
- cache busting em toda consulta;
- API latest como rota principal e manifesto fixo como fallback;
- nova consulta do manifesto imediatamente antes da instalação;
- repetição da rota completa quando há falha de integridade ou erro temporário;
- mensagens separadas para assinatura, versionCode, GitHub 403/429, manifesto inválido e APK inválido.

## Correções no Android nativo

- quatro tentativas de download;
- `Accept-Encoding: identity` e cache desativado;
- até dez redirecionamentos HTTPS autorizados;
- bloqueio de HTML/JSON recebido no lugar do APK;
- conferência do cabeçalho ZIP antes do PackageManager;
- nomes temporários por versionCode;
- permissão de leitura concedida explicitamente ao instalador;
- abertura alternativa com `ACTION_INSTALL_PACKAGE` quando necessário.

## Publicação

O arquivo inteiro do projeto deve substituir o conteúdo do repositório. Depois, faça um novo commit na branch `main` e espere o workflow **Gerar APK e publicar atualização definitiva** terminar com sucesso.

Não use apenas “Re-run jobs” em uma execução antiga para trocar a versão: a v27.21 precisa entrar no repositório para que o novo atualizador e o novo workflow sejam usados.

## Limite inevitável

Uma versão já instalada não pode receber mudanças no código nativo antes de se atualizar. Por isso, o canal antigo foi mantido. Caso a assinatura do APK atualmente instalado seja diferente da chave permanente, o Android exigirá uma instalação manual única da v27.21. Depois dessa base oficial, as próximas versões poderão ser instaladas por cima.
