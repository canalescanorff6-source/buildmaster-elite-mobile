# Testes reais — v38.32

## Aprovados neste ambiente

- regressão e typechecks direcionados da v38.32;
- criação de contas: interface, contrato do cliente e Edge Function;
- gravação, MediaStore, compartilhamento seguro e instalador nativo gerado;
- Análise de Vídeo 2.0, evidências, candidatos, treino e evolução;
- catálogo de 30 formações, 11 jogadores por formação e 22 estilos oficiais;
- exportação SVG/PNG por contrato, formatos e identidade visual;
- integração com Meu Time, backup e restauração;
- regressões v30.00 a v31.20 executadas no diagnóstico parcial;
- regressões v31.30, v31.40, v31.50 e v31.60;
- regressões v31.70 a v31.82, incluindo os subtestes da v31.82;
- regressões v32.00, v33.00, v34.00, v35.00, v35.10, v35.20 e v36.00;
- regressões v37.00, v37.40, v37.50, v37.60, v37.70, v37.71, v37.80 e v37.90;
- regressões v38.00, v38.10, v38.20, v38.21, v38.22, v38.30, v38.31 e v38.32;
- sintaxe TypeScript/TSX: 348 arquivos;
- contratos interativos: 720 botões tipados e 27 imagens com texto alternativo;
- visual e acessibilidade;
- rotas críticas;
- Java nativo gerado;
- auditoria estrutural: 111 verificações;
- pré-voo de produção: 124 verificações, assinatura `d856075913d0b078`;
- pré-voo Google Play: 27 verificações;
- orçamento do código-fonte aprovado em 99,8%.

## Limitações reais do ambiente

### npm ci e TypeScript global

O `npm ci --registry=https://registry.npmjs.org/` foi executado, mas a rede do ambiente retornou `EAI_AGAIN` ao baixar dependências, incluindo `zlibjs`, `typescript` e pacotes auxiliares. A instalação ficou incompleta e foi removida do pacote final.

Por isso, o `typecheck` global não pôde ser validado com uma instalação limpa completa. A tentativa com dependências parciais falhou pela ausência dos tipos `node`, `react`, `react-dom`, `fs-extra` e `slice-ansi`. Os typechecks direcionados das áreas alteradas passaram.

### Supabase real

Não foram usados URL, chave, conta administrativa nem projeto Supabase reais. Foram validados o contrato, os tipos, a idempotência e as confirmações programadas. A criação real precisa ser confirmada pelo workflow e por um teste no projeto Supabase conectado.

### Android físico

MediaStore, Galeria, `content://`, gravação e compartilhamento foram validados por contrato e pelo Java nativo gerado. Não havia aparelho/emulador Android, SDK completo nem chave de assinatura para executar o APK neste ambiente.

### PNG, PDF e APK

A composição SVG e o caminho de conversão PNG foram testados por regressão. A renderização visual final, o diálogo PDF, a assinatura e a instalação por cima do APK existente dependem do navegador/aparelho e dos workflows do GitHub.

## Confirmação necessária após publicação

Executar os workflows e confirmar:

1. `Publicar contas e licenças no Supabase`;
2. `Gerar APK Canal Direto`;
3. opcionalmente `Gerar AAB v38.32 Google Play`.

Somente o resultado desses workflows pode confirmar a geração, assinatura e instalação do APK/AAB oficiais.
