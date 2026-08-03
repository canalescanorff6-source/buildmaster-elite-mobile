# v38.39 — Hotfix definitivo da regressão v31.20

## Problema

O grupo v31.20 falhava no GitHub mesmo com a interface e o contexto tático presentes. O contrato repetia o mesmo typecheck do grupo v31.10 e dependia de caminhos relativos e correspondências textuais rígidas.

## Correções aplicadas

- removido o `typecheck:v3110` duplicado do grupo v31.20;
- preservado o typecheck original no grupo v31.10 e no TypeScript completo;
- os testes v31.20 agora localizam a raiz pelo próprio arquivo com `import.meta.url`;
- normalização de BOM, CRLF e espaços;
- validação semântica dos temas, home premium, formação automática, técnico, posição soberana e perfil automático pela carta;
- mensagens de falha específicas;
- novo contrato preventivo ligado à própria regressão v38.39.

## Funções preservadas

Nenhuma função do aplicativo foi removida ou simplificada. A correção afeta apenas a estabilidade e a precisão do diagnóstico automatizado.
