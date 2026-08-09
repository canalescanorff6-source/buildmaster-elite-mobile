# Correção da rota raiz e TypeScript — v38.40

## Falhas corrigidas

- `src/app/page.tsx` havia sido sobrescrito pela política de privacidade, fazendo a regressão v38.40 falhar e exigindo autorreparo no workflow.
- Um deep link sem `workspace` enviava `undefined` para `setPlayerWorkspace`, causando o erro TS2345 em `CardVisionApp.tsx`.

## Solução

- a rota `/` volta a montar `AuthGate`, `CardVisionApp` e `AppShellSafetyBoundaryV3930`;
- a política permanece exclusivamente em `/privacidade`;
- o workspace opcional é normalizado para `visao-geral` antes de ser usado;
- o estado de workspace só é atualizado quando o grupo do deep link é `jogadores`;
- uma regressão dedicada impede que a rota raiz ou a tipagem sejam quebradas novamente.
