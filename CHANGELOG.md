# v27.33.0 — App completo, Estúdio Tático editável e atualizador Android reforçado

- Estúdio Tático com setas automáticas e editor manual completo;
- temas e cores personalizadas;
- biblioteca com migração, rascunho por formação e até 60 projetos;
- exportação PNG, SVG, impressão/PDF, JSON e compartilhamento;
- leitura do DownloadManager por `openDownloadedFile` e `ParcelFileDescriptor`;
- cópia dos bytes para armazenamento privado antes de validar e instalar;
- HTTP reserva, integridade, pacote, versão, versionCode e assinatura preservados;
- teste v27.33, auditoria, regressões, build estático e Capacitor validados.

# v27.30.0 — Atualizador do sistema e Estúdio Tático Local

- DownloadManager do Android virou o transporte principal do APK.
- HTTP próprio permanece como reserva e as tentativas alternam os transportes.
- Manifesto principal usa APK imutável e publica dois espelhos oficiais.
- Diagnóstico registra transporte, host, tamanho e integridade.
- Estúdio Tático Local gera infográficos em SVG/PNG sem API paga.
- Versão, PWA, cache, workflow, auditoria e testes atualizados.

## 27.29.0 — Auditoria total, estabilidade e atualizador resiliente

- auditoria automatizada de código, segurança, interface, armazenamento, backup, workflow e Android;
- atualizador com memória de saúde por rota, bloqueio de downloads simultâneos e alternância real após falhas;
- download nativo com `Accept-Encoding: identity`, tentativas limitadas e diagnóstico HTTP completo;
- validação final por bytes reais, SHA-256, cabeçalho APK, pacote, versão, `versionCode` e assinatura;
- armazenamento local protegido contra indisponibilidade, quota e dados corrompidos;
- restauração de backup limitada por profundidade, volume e tamanho, com bloqueio de poluição de protótipo;
- identificadores estáveis com `crypto.randomUUID` quando disponível;
- isolamento de falhas e carregamento progressivo dos módulos pesados;
- avisos de modo offline, falha de armazenamento e erros globais recuperáveis;
- melhorias de área segura, foco, toque mínimo, movimento reduzido e telas pequenas;
- remoção de `any` explícito, `document.write` e injeções diretas de HTML;
- cabeçalhos de segurança web, service worker restrito à mesma origem e cache renovado;
- auditoria obrigatória no GitHub Actions antes da assinatura e publicação;
- suíte completa de regressão aprovada e build estático do APK concluído.

## v27.26.0 — correção do workflow de atualização

- remove automaticamente `public/update-manifest.json` antes dos testes e do build;
- impede que manifesto placeholder antigo seja empacotado no APK;
- mantém o manifesto oficial sendo gerado apenas depois da validação do APK publicado;
- adiciona regressão para impedir a volta do erro no GitHub Actions.

# Changelog

## 27.26.0 — Atualização Automática Real em Três Canais

- auditoria integral da base enviada e reconstrução do fluxo de atualização;
- consulta paralela do canal raw, ponte antiga e API Latest;
- seleção obrigatória do maior `versionCode` válido;
- download e abertura automática do instalador na v27.26;
- permissão Android guiada e continuação ao retornar ao app;
- cópia local de recuperação automática, sem exportação manual;
- APK imutável único, manifesto ativado somente após validação pública;
- validação de tamanho, SHA-256, pacote, versão, `versionCode` e assinatura;
- exclusão de qualquer APK rejeitado do cache;
- remoção do manifesto local obsoleto;
- correção da URL final de validação da ponte antiga;
- novo teste de regressão `test:v2726`.

## 27.22.0 — Atualizador Definitivo

- release imutável exclusiva por execução e tentativa;
- descoberta da versão aprovada pela API oficial `releases/latest`;
- fallback para `buildmaster-latest`, mantendo compatibilidade com APKs antigos;
- manifesto schema 2 vinculado à tag e ao nome exato do APK;
- leitura segura de JSON mesmo com `application/octet-stream`;
- nova consulta imediatamente antes de instalar;
- repetição completa após falha temporária ou divergência de integridade;
- quatro tentativas nativas sem cache e com `Accept-Encoding: identity`;
- bloqueio de HTML/JSON recebido no lugar do APK;
- conferência do cabeçalho APK/ZIP;
- abertura reforçada do instalador Android;
- verificação pública de APK e manifesto antes de marcar a release como latest;
- teste de regressão específico `test:v2721`.

## 27.20.0 — Auditoria Premium e Estrutura

- Controle Final da Ficha com nota, aprovados, avisos e bloqueios;
- verificação unificada de orçamento, OCR, identidade, atributos, habilidades, tática e variantes;
- resultados críticos salvos com marca “Revisar”, preservando a decisão do usuário;
- busca global com atalho Ctrl/Cmd+K e navegação por teclado;
- modo econômico para reduzir desfoques, sombras, animações e renderização fora da tela;
- rascunho com debounce e indicador de salvamento;
- limite seguro para imagens no rascunho;
- limpeza automática de URLs temporárias de imagem;
- prevenção de links `blob:` inválidos no Cofre;
- Design System incremental em `design-system-v2720.css`;
- regressão específica da v27.20;
- atualização imutável da v27.12 preservada.

## 27.10.0 — Reconstrução Completa

- Print Único Pro com templates adaptativos e leitura por campo;
- correção da confusão entre nível e GER;
- níveis altos legítimos e orçamento ampliado;
- auditoria visual com mapa e recortes;
- cache, fila, cancelamento e memória de correções do OCR;
- IndexedDB estruturado por conta;
- Design System premium e acessibilidade;
- ícones maskable dedicados;
- explicação de investimento de pontos;
- detector de lacunas do elenco;
- planos de partida conectados ao banco;
- diagnóstico seguro e compartilhamento compacto;
- extração de módulos críticos e carregamento dinâmico;
- testes de casos críticos e TypeScript estrito;
- documentação atual separada do histórico;
- remoção do manifesto local de publicação.

## v27.28.0 — Atualizador com ponte versionada

- Corrigida a falsa alternância de rotas da v27.26.
- Canal principal passa a usar APK versionado dentro de `buildmaster-latest`.
- Ativo público é validado com o mesmo perfil HTTP do Android antes da ativação do manifesto.
- Download de ativos versionados usa URL exata, sem nonce desnecessário.
- Alternância real entre URLs oficiais distintas.
- Diagnóstico detalhado de tamanho, SHA-256, host, status HTTP e tipo de conteúdo.
- Mantidas release imutável, ponte para versões antigas e validação de assinatura.
