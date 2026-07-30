# Correção CI v34.00 — TypeScript, regressões v31.10 e v31.20

## Falha observada
O diagnóstico consolidado encerrava com código 1 por três grupos:

- TypeScript completo (código 2)
- Regressões v31.10 (código 2)
- Regressões v31.20 (código 2)

## Causa
A reconstrução visual v34.00 adicionou rotas seguras de recuperação para a Central, porém cinco chamadas de `recordSafeRuntimeError` usavam o contrato antigo com dois argumentos posicionais. A função atual recebe um objeto `{ area, code, message }`.

O typecheck isolado legado da v31.10 também não declarava `useRef`, embora o painel moderno de formações use esse hook para levar o usuário até a guia selecionada.

## Correções
- todas as cinco chamadas usam o contrato tipado atual;
- erros capturados são convertidos em mensagens seguras;
- as Promises de diagnóstico são tratadas com `void` quando não precisam bloquear a interface;
- o stub de React da v31.10 reconhece `useRef`;
- nova regressão impede retorno ao formato incompatível.

## Resultado
Os testes `test:v3110`, `test:v3120` e `test:v3400` foram aprovados em conjunto, preservando a interface Studio Premium, Mega Calibração, OCR, fichas, habilidades e Ímpetos.
