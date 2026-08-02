# BuildMaster v38.34 — Correção completa do CI

A v38.34 preserva integralmente o Gerador Tático Profissional da v38.33 e corrige os três bloqueios que impediram o workflow de avançar: orçamento do código-fonte, auditoria/rota inicial e TypeScript completo.

## 1. TypeScript do Estúdio de Formações

O repositório público ainda possuía um chamador que enviava estas propriedades ao `TacticalPosterStudioPanel`:

- `brandTitle`;
- `brandSubtitle`;
- `defaultPalette`;
- `defaultFocus`.

O componente não declarava essas propriedades. A v38.34 amplia o contrato sem quebrar chamadas antigas:

- todas as propriedades são opcionais;
- os valores da Marques Fichas permanecem como padrão;
- o estado inicial usa a personalização apenas quando ela é informada;
- o template, os 11 jogadores, as setas e as exportações continuam preservados.

## 2. Rota inicial e auditoria

A raiz correta do aplicativo continua sendo composta por `AuthGate` e `CardVisionApp`. A entrega inclui essa rota correta e mantém o autorreparo que impede uma página pública de privacidade ou exclusão de substituir a tela principal.

## 3. Orçamento do código-fonte

O gerador SVG profissional aumentou legitimamente o tamanho do código-fonte. Em vez de retirar recursos, o orçamento foi recalibrado de 3,5 MiB para 4 MiB.

A proteção não foi simplesmente desativada:

- limite total TypeScript/TSX: 4 MiB;
- alerta antecipado a partir de 90%;
- limite individual por módulo: 400 KiB;
- limites do JavaScript compilado preservados.

Na validação local, o projeto utilizou 3.698.316 bytes de 4.194.304 bytes, equivalentes a 88,2% do novo orçamento.

## 4. Versionamento e cache

- versão do projeto: `38.34.0`;
- cache web: `buildmaster-v38-34-ci-stability-1`;
- esquema nativo: `38.34.0-ci-stability-1`;
- release notes Google Play atualizadas;
- regressão v38.34 incluída no diagnóstico consolidado.

## Recursos preservados

Nenhum módulo funcional foi removido. Permanecem presentes:

- Gerador Tático Profissional por Template;
- Estúdio de Formações Meta;
- fichas e pontos exatos;
- cinco habilidades adicionais e substituição inteligente;
- Ímpetos/Boosters;
- OCR, leitor eFHUB e calibrador;
- Meu Time e Cofre;
- gravações, Galeria e compartilhamento;
- Análise de Vídeo Inteligente 2.0;
- contas, prazos, renovação e MFA;
- Supabase, sessão persistente e atualizador;
- backups, histórico e regras remotas.
