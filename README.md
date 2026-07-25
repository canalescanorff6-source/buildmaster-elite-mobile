# BuildMaster Elite Tático v30.00

Versão final do ciclo de evolução, com:

- **Bloco 28 — Publicação profissional na Google Play**;
- **revisão completa de produção**;
- preservação das funções implementadas da v27 até a v29.80.

## Entregas principais

A v30.00 adiciona uma Central de Publicação na área **Ajustes**, workflow próprio para Android App Bundle, integração nativa com Play Integrity e Play In-App Updates, páginas públicas de privacidade e exclusão, pacote de materiais da loja e portões automáticos para impedir uma publicação incompleta.

O projeto mantém dois canais separados:

- **distribuição direta**: APK assinado e atualizador próprio já existente;
- **Google Play**: AAB assinado pela chave de upload, Play App Signing e atualização dentro da loja.

O build da Google Play remove do manifesto a permissão `REQUEST_INSTALL_PACKAGES`, o `FileProvider` do instalador direto e as consultas ligadas à instalação de APK. Dessa forma, o artefato Play não tenta instalar atualizações externas.

## Comandos principais

```bash
npm ci --no-audit --no-fund
npm run test:v3000
npm run release:play-preflight
npm run quality:audit
npm run typecheck
npm run test:all
```

O workflow `.github/workflows/build-play-store.yml` executa essas etapas, gera o AAB, aplica API 36, assina com a chave de upload, valida a assinatura, executa `bundletool validate`, confirma `versionCode` e `versionName`, gera SHA-256 e pode publicar no canal selecionado.

## Configuração obrigatória no GitHub

### Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_PLAY_CLOUD_PROJECT_NUMBER`

### Secrets

- `GOOGLE_PLAY_UPLOAD_KEY_BUNDLE`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` — necessário somente quando `publish_to_play=true`.

Formato de `GOOGLE_PLAY_UPLOAD_KEY_BUNDLE`:

```json
{
  "keystoreBase64": "BASE64_DO_ARQUIVO_JKS",
  "storePassword": "SENHA_DO_KEYSTORE",
  "keyAlias": "ALIAS_DA_CHAVE",
  "keyPassword": "SENHA_DA_CHAVE"
}
```

As senhas são mascaradas durante o workflow e gravadas apenas em arquivos temporários removidos antes do upload do artefato.

## Configuração obrigatória no Supabase

1. Aplicar `supabase/migrations/202607250002_block28_play_publication.sql`.
2. Publicar as Edge Functions:
   - `account-deletion-request`;
   - `play-integrity-verify`.
3. Configurar no ambiente das funções:
   - `SUPABASE_URL`;
   - `SUPABASE_SERVICE_ROLE_KEY`;
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`;
   - `BUILDMASTER_PRIVACY_HASH_SALT`.

A infraestrutura de Play Integrity foi criada, mas cada ação sensível que exigirá bloqueio por integridade deve ser ligada explicitamente ao backend conforme a política do produto.

## Materiais da loja

A pasta `play-store/` contém:

- título, descrição curta e descrição completa em pt-BR;
- notas da v30.00;
- ícone 512 × 512;
- imagem de destaque 1024 × 500;
- documentos para privacidade, Segurança dos Dados, exclusão, acesso para revisão, classificação, anúncios, Play App Signing, Play Integrity e Android vitals;
- pastas orientativas para capturas reais de celular e tablet.

Capturas simuladas não foram incluídas. Elas precisam ser produzidas a partir do AAB final instalado pelo canal interno.

## Publicação segura

Use inicialmente:

- `track: internal`;
- `publish_to_play: false` para a primeira geração;
- depois `publish_to_play: true` com `release_status: draft`.

Somente avance para produção após instalar o AAB pelo canal interno, validar login, licença, OCR, fichas, backup, restauração, Estúdio Tático, treinos, atualização e exclusão da conta.

## Limites desta entrega

O pacote contém o código e a automação de produção. Ele **não contém**:

- AAB ou APK assinado;
- keystore ou credenciais;
- acesso ao Play Console;
- contato público definitivo;
- URLs públicas já implantadas;
- capturas reais da versão final;
- formulários preenchidos no Play Console.

Esses itens dependem da conta, dos Secrets, do domínio público e da execução do GitHub Actions.
