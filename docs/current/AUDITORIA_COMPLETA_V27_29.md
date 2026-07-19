# Auditoria completa — BuildMaster Elite Tático v27.29.0

## Resultado executivo

A base completa do aplicativo foi revisada em código-fonte, testes, exportação web, integração Android, atualização automática, dados locais, backup, contas, fichas, OCR, design, acessibilidade, segurança e GitHub Actions. A versão foi elevada para **27.29.0** e recebeu correções estruturais de baixo risco, preservando as regras já consolidadas do BuildMaster.

A análise encontrou três dívidas grandes que continuam registradas para uma futura versão de arquitetura: `legacy-compat.css` com cerca de 12,7 mil linhas, `CardVisionApp.tsx` com cerca de 7 mil linhas e `analyzer.ts` com cerca de 4,4 mil linhas. Dividir esses arquivos agora, junto com a correção crítica do atualizador, aumentaria muito o risco de regressão. Nesta versão, os módulos pesados foram isolados por carregamento progressivo e barreiras de erro; a separação física completa fica recomendada para uma versão maior e dedicada.

## Escopo inspecionado

- 111 arquivos em `src`;
- 69 arquivos de testes;
- interface principal, login, contas e licenças;
- leitor de prints, OCR, ficha, habilidades, ímpetos e motores táticos;
- Cofre, histórico, backup, restauração e migração;
- service worker, PWA, exportação estática e Capacitor;
- plugin Android de segurança e instalação;
- workflow de compilação, assinatura, publicação e canais de atualização;
- dependências de produção e padrões de segurança do código.

## Mudanças entregues

### 1. Atualização automática e Android

- memória de saúde das rotas para evitar repetir imediatamente um canal que entregou arquivo incorreto;
- bloqueio atômico contra dois downloads de atualização ao mesmo tempo;
- até duas tentativas nativas por rota, com alternância de redirecionamento manual e automático;
- `Accept-Encoding: identity`, conexão sem reaproveitamento e cache desativado;
- tamanho anunciado pelo CDN virou informação diagnóstica; a aceitação usa os bytes efetivamente recebidos e o SHA-256;
- validação do cabeçalho APK/ZIP, pacote, versão, `versionCode` e certificado de assinatura;
- exclusão imediata de cópias rejeitadas;
- diagnóstico com URL final, host, status HTTP, tipo, codificação, tamanho e ETag;
- preservação do APK imutável, do ativo versionado e de `BuildMaster-Elite-Tatico-latest.apk`;
- manifesto publicado somente depois da verificação pública do arquivo correspondente;
- `contents: write`, concorrência controlada e auditoria obrigatória no GitHub Actions.

### 2. Armazenamento, backup e integridade

- acesso ao `localStorage` centralizado e protegido contra modo privado, quota, indisponibilidade e JSON corrompido;
- aviso de armazenamento indisponível sem derrubar o aplicativo;
- identificadores estáveis com fonte criptográfica quando disponível;
- backup sanitizado antes de salvar ou restaurar;
- limites de profundidade, nós, itens, chaves e tamanho de texto/imagem;
- bloqueio de `__proto__`, `prototype` e `constructor` para impedir poluição de protótipo;
- checksum estável com detecção de estruturas circulares;
- migração não destrutiva para o esquema 2729.

### 3. Estabilidade da interface

- barreiras de erro independentes nos módulos pesados;
- fallback de carregamento para imports dinâmicos;
- páginas de carregamento, não encontrado e recuperação global;
- registro seguro de erros não tratados e rejeições de promessa;
- indicação de modo offline;
- foco e rolagem consistentes ao trocar de seção;
- impressão de relatório sem `document.write`, usando arquivo temporário isolado;
- remoção de tipos `any` explícitos no código-fonte.

### 4. Design, layout e acessibilidade

- nova camada final `design-system-v2729.css`;
- áreas seguras para recorte, barra de status e navegação do Android;
- alvos de toque mínimos de 44 px;
- foco visível por teclado;
- comportamento responsivo da Central de Atualizações;
- respeito a `prefers-reduced-motion`;
- renderização adiada de conteúdo fora da tela quando suportada;
- ajustes para telas estreitas e para o menu inferior.

### 5. Segurança web e cache

- cabeçalhos `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e `Cross-Origin-Opener-Policy`;
- service worker restrito à mesma origem;
- rotas de manifesto e API excluídas do cache;
- navegação em modo network-first;
- remoção de injeções diretas de HTML e execução dinâmica;
- nenhum keystore, APK, AAB, chave privada ou manifesto oficial empacotado no código-fonte.

## Validações executadas

- `npm run typecheck`: aprovado;
- `npm run quality:audit`: **27 verificações obrigatórias aprovadas**;
- `npm run test:all`: suíte completa aprovada com código de saída 0;
- `npm audit --omit=dev`: 0 vulnerabilidades encontradas;
- `npm run apk:build-web`: exportação estática aprovada;
- Capacitor Android criado e sincronizado;
- plugin Java gerado e conferido quanto a download exclusivo, SHA-256, identidade, pacote, versão e assinatura;
- workflow YAML carregado com sucesso;
- 37 blocos shell do workflow aprovados por `bash -n`;
- manifesto oficial ausente dos arquivos empacotados no APK.

O build Gradle local não pôde terminar porque este ambiente não tem acesso ao servidor de distribuição do Gradle. A compilação e a assinatura oficiais continuam no GitHub Actions, onde o `ANDROID_SIGNING_BUNDLE` já está configurado.

## Tamanho e desempenho

A exportação estática ficou próxima de 2,4 MB. O maior chunk JavaScript continua ligado ao núcleo principal do aplicativo, e a folha de compatibilidade histórica ainda é grande. A v27.29 reduz o impacto percebido com imports dinâmicos, fallbacks, isolamento de falhas e `content-visibility`, sem fazer uma refatoração arriscada do motor e da tela principal.

## O que ainda precisa de prova real

O código e o workflow estão validados, mas a atualização automática só pode ser confirmada definitivamente depois que:

1. o GitHub gerar o APK assinado da v27.29;
2. os três canais forem publicados em verde;
3. o aparelho baixar o APK pela versão instalada;
4. o Android aceitar a assinatura e concluir a atualização por cima.

A confirmação final **Atualizar** é uma exigência do Android para aplicativos comuns e não pode ser removida pelo BuildMaster.
