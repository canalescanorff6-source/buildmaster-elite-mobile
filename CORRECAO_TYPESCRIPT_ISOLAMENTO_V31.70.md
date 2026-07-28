# Correção TypeScript v31.71

O typecheck principal incluía toda a pasta `tests` por causa dos padrões globais `**/*.ts` e `**/*.tsx`. Os arquivos `stubs.d.ts` dos testes declaravam versões parciais de React, lucide-react, analyzer e TeamDiagnosis. Essas declarações substituíam os tipos reais e geravam mais de mil erros falsos no GitHub Actions.

## Correção

- `tsconfig.json` agora inclui apenas o aplicativo e configurações necessárias.
- `tests` foi excluída integralmente do build principal.
- `tsconfig.app.json` tornou-se o projeto exclusivo do `npm run typecheck`.
- Testes de cada versão continuam usando seus próprios tsconfigs e stubs.
- Novo portão `quality:typecheck-isolation` impede regressão.
- Workflows APK e Play executam o portão antes do typecheck.
- Regressões v31.10 e v31.71 validam o isolamento.

Nenhum componente, ícone ou função do aplicativo foi removido.
