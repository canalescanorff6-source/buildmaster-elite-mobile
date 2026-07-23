# BuildMaster Elite Tático v27.40.0 — Evolução 360

Pacote-fonte limpo do BuildMaster Elite Tático. Esta versão continua o refinamento geral da v27.39 e acrescenta uma camada de evolução diária, personalização, rotinas guiadas, diagnóstico local e arquitetura mais segura.

## Principais áreas preservadas

- login Supabase, licença, MFA e controle de aparelhos;
- leitor de print, OCR offline e Manual Pro;
- geração de fichas, habilidades, ímpetos e comparação por carta;
- Pesquisa de Fichas de Criadores por YouTube/TikTok usando prints conferidos;
- Cofre, lixeira, backup criptografado e sincronização por conta;
- Meu Time, formações, Estúdio Tático, treinos e partidas;
- atualização automática com SHA-256, pacote, versão e assinatura Android.

## Novidades da v27.40

### Evolução 360

A nova central reúne em um único lugar:

- pontuação de saúde do uso do aplicativo;
- pendências inteligentes;
- metas pessoais;
- sessões de foco;
- manutenção preventiva;
- perfil recomendado para o aparelho;
- relatório 360 exportável;
- notificações contextuais e atalhos rápidos.

### Rotinas guiadas

Fluxos prontos ajudam o usuário a concluir tarefas sem esquecer etapas:

- analisar uma carta nova;
- revisar o time antes de jogar;
- validar uma ficha em partidas;
- atualizar o aplicativo com segurança.

O progresso fica salvo localmente e cada etapa abre diretamente a área correta.

### Experiência adaptável

O usuário pode ajustar sem alterar as funções:

- densidade compacta, confortável ou espaçosa;
- tamanho das letras de 90% a 120%;
- contraste padrão ou reforçado;
- intensidade das cores suave, equilibrada ou viva;
- efeitos completos ou reduzidos;
- ações importantes fixas;
- guias informativas visíveis ou ocultas.

As preferências são aplicadas no início do aplicativo.

### Diagnóstico local

A Central 360 verifica, sem enviar dados para servidores:

- gravação local;
- IndexedDB;
- Web Crypto;
- Service Worker;
- conectividade;
- volume do armazenamento simples;
- cota de armazenamento quando o Android/navegador informa.

O relatório não contém senha, token, imagens ou conteúdo das fichas.

### Arquitetura

A matemática de pontos de progressão foi extraída de `analyzer.ts` para `trainingPlanCore.ts`, permitindo testes isolados de custo, soma, parsing e ajuste de blocos. Essa divisão reduz o risco de uma alteração em pontos quebrar leitura, habilidades ou tática.

## Validar o projeto

```bash
npm ci
npm run typecheck
npm run quality:audit
npm run test:all
npm run build
```

## Gerar o APK oficial

1. Envie todo o conteúdo desta pasta para a branch `main`, incluindo `.github`.
2. Mantenha as Variables `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Mantenha o Secret `ANDROID_SIGNING_BUNDLE` com a mesma assinatura das versões instaladas.
4. Execute `.github/workflows/build-apk.yml`.

O workflow cria o Android do zero, incorpora o OCR local, testa, assina e valida o APK antes de publicar o manifesto de atualização.

## Arquivos que não devem entrar no repositório

Não envie `node_modules`, `.next`, `out`, `android`, APK, keystore, `.env`, logs, caches ou `public/update-manifest.json`. Esses itens são gerados ou protegidos fora do pacote-fonte.

## Limite da validação local

O pacote inclui testes e auditorias, mas a confirmação definitiva depende do GitHub Actions terminar totalmente em verde e do APK ser testado em Android real, principalmente login, OCR, backup/restauração e atualização sobre uma versão anterior.
