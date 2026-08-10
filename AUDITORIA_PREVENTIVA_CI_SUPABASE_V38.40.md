# BuildMaster Elite Tático v38.40 — auditoria preventiva de CI e Supabase

## Correções aplicadas

1. O diagnóstico consolidado agora inclui também as regressões v39.30, v39.40 e v39.50. Antes, `test:all` executava essas suítes, mas `ci:verify` encerrava na v39.20.
2. O contrato preventivo da CI compara automaticamente as regressões declaradas em `test:all` com as executadas pelo `ci-doctor`, impedindo nova divergência silenciosa.
3. Os workflows APK e Google Play não aceitam mais apenas um HTTP 200 no health check: a resposta precisa ser JSON válido do Supabase Auth, com `name: GoTrue` e versão informada.
4. O workflow Google Play passou a validar o formato da URL e da chave pública do Supabase antes de gerar o AAB, igual ao workflow do APK direto.
5. A regressão de login foi ampliada para proteger essas validações, o bloqueio de redirecionamentos inesperados e a restrição do transporte nativo ao host oficial do projeto Supabase.

## Validações executadas

- Sintaxe TypeScript/TSX: aprovada em 414 arquivos.
- Contrato preventivo da CI: aprovado.
- Pré-voo de produção: 138 verificações aprovadas.
- Pré-voo Google Play: 27 verificações aprovadas.
- Auditoria estrutural: 124 verificações aprovadas.
- Rotas críticas, acessibilidade, contratos interativos, Java nativo e isolamento TypeScript: aprovados.
- Regressões v30.00, v33.00, v37.71, v38.00, v38.31, v38.40, v39.30, v39.40 e v39.50: aprovadas.
- Typecheck direcionado de login/sessão: aprovado.
- YAML dos três workflows: válido.

## Limites da validação local

O `npm ci` não pôde ser concluído neste ambiente porque o proxy interno de pacotes retornou 404 ao buscar `zlibjs`. Por isso, o build Next.js e a compilação final do APK/AAB permanecem sob responsabilidade do GitHub Actions, que instala as dependências no registro público antes de compilar.

## Observações não bloqueantes

- `CardVisionApp.tsx` e `analyzer.ts` continuam grandes e merecem modularização futura.
- Dois módulos antigos de formações permanecem fora da árvore ativa; não interferem no aplicativo atual, mas podem ser removidos em uma limpeza futura depois de confirmar que não serão reaproveitados.
