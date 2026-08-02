# BuildMaster v38.36 — Auditoria estrutural determinística

A v38.36 corrige a falha recorrente em que a auditoria estrutural passava no pacote limpo, mas falhava no checkout do GitHub por arquivos TypeScript antigos ou não alcançáveis ainda presentes na árvore do repositório.

## Regra nova

A auditoria constrói o grafo real a partir das rotas do aplicativo e aplica como bloqueios somente aos módulos ativos:

- imports internos não resolvidos;
- acesso direto ao localStorage;
- tipos explícitos any.

Arquivos não alcançáveis continuam sendo listados como aviso, mas não interrompem a geração do APK. Chaves privadas, APKs/AABs incluídos, versões, rotas, workflows, caches e arquivos essenciais continuam sendo bloqueios globais.

## Diagnóstico no GitHub

Qualquer falha crítica gera também uma anotação `::error` no GitHub Actions com o motivo exato.
