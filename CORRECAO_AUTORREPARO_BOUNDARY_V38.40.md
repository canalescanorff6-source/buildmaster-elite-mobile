# Correção do autorreparo da rota raiz — v38.40

O GitHub Actions encontrava `src/app/page.tsx` sobrescrito pela página pública e executava o autorreparo. O template antigo restaurava apenas `AuthGate` e `CardVisionApp`, removendo `AppShellSafetyBoundaryV3930`. Por isso as regressões v38.40 e v39.30 falhavam depois do reparo.

A correção atualiza o template, o validador, o pré-voo, a auditoria e a regressão v31.72 para exigir e restaurar:

- `AppShellSafetyBoundaryV3930`;
- `AuthGate`;
- `CardVisionApp`.

Assim, mesmo que a rota raiz seja substituída por política de privacidade ou exclusão de conta, o workflow restaura a rota funcional completa antes dos testes e do build.
