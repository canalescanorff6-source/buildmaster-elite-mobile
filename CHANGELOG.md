## v27.27.0 — ponte `latest.apk` compatível com a v27.00

- restaura o contrato real usado pelo APK v27.00 já instalado;
- publica `BuildMaster-Elite-Tatico-latest.apk` dentro da release fixa `buildmaster-latest`;
- faz o manifesto antigo apontar para a mesma release e para o nome exato aceito pelo atualizador antigo;
- preserva a release imutável para as versões novas do aplicativo;
- valida publicamente tamanho e SHA-256 da cópia `latest.apk` antes de ativar o manifesto;
- publica o manifesto somente por último, após a cópia compatível estar disponível;
- adiciona três tentativas de publicação e até doze verificações de propagação da CDN;
- adiciona regressão `test:v2727` baseada no contrato real da v27.00.

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
