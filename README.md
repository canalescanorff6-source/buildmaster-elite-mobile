# BuildMaster Elite Tático v30.00 — projeto limpo

Este pacote contém somente a base atual necessária para desenvolver, testar e publicar o BuildMaster Elite Tático.

## Estrutura mantida

- `src/`: aplicativo, motores de fichas, OCR, contas, backup, táticas, desempenho e publicação;
- `public/`: PWA, ícones e recursos usados no aplicativo;
- `scripts/`: build, auditoria, integridade, APK, AAB e publicação;
- `tests/`: regressões atuais da v30.00 e fixtures isoladas de TypeScript;
- `supabase/`: migrações e Edge Functions necessárias para contas, licenças e serviços;
- `play-store/`: materiais e documentos da Google Play;
- `.github/workflows/`: APK direto, AAB Google Play e implantação do Supabase.

## Limpeza aplicada

- histórico local `.git` removido do pacote;
- manifestos antigos removidos;
- caches, builds, `node_modules`, Android gerado e arquivos temporários removidos;
- arquivos TypeScript órfãos removidos;
- testes históricos substituídos pela bateria atual da v30.00;
- 35 arquivos de estilos antigos consolidados em `src/app/globals.css`.

## Comandos principais

```bash
npm ci --no-audit --no-fund
npm run typecheck
npm run test:all
npm run build
```

Para gerar o site estático usado pelo Capacitor:

```bash
npm run apk:build-web
```

## Colocar no GitHub

Use uma pasta clonada pelo GitHub Desktop. Preserve a pasta oculta `.git` dessa clonagem, apague os demais arquivos antigos e copie o conteúdo deste projeto limpo para a raiz do repositório.

A raiz correta deve conter diretamente `src`, `scripts`, `tests`, `public`, `.github`, `package.json` e `package-lock.json`.

## Segurança

O projeto não inclui APK, AAB, keystore, senhas, chaves privadas ou credenciais. Os Secrets e Variables continuam sendo configurados no GitHub e no Supabase.
