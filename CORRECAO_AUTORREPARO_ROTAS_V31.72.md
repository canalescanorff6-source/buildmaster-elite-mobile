# BuildMaster v31.72 — Hotfix de autorreparo das rotas críticas

## Falha encontrada

No commit publicado, `src/app/page.tsx` foi substituído pelo conteúdo da página pública de exclusão de conta. Isso fez falhar, em cascata, as rotas críticas, o pré-voo, a auditoria, a integridade e regressões antigas que conferem a tela inicial.

## Correção

- `src/app/page.tsx` restaurado com `AuthGate` e `CardVisionApp`.
- Criado `scripts/repair-critical-routes.mjs`.
- Criado um modelo canônico da rota inicial fora do código compilado.
- `quality:routes` agora recupera a rota antes de validá-la.
- Typecheck, testes, exportação web e workflows executam a recuperação preventiva.
- Criada regressão em pasta temporária que simula a troca da rota inicial pela página de exclusão.
- O manifesto de integridade foi regenerado depois de todas as alterações.

## Resultado esperado

Mesmo que `src/app/page.tsx` seja trocado acidentalmente por uma página pública durante a cópia dos arquivos, o GitHub Actions restaura a rota inicial canônica antes do diagnóstico e prossegue com o restante da validação.
