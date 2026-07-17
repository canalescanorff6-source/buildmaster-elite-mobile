# BuildMaster Elite Tático v27.10 — Reconstrução Completa

A v27.10 consolida a Central Inteligente v27.00 e aplica a auditoria completa do projeto: **Print Único Pro adaptativo**, correção da separação entre nível e GER, armazenamento estruturado, fila e cache de OCR, Design System premium, diagnóstico seguro, inteligência de elenco e modularização progressiva.

## Leia primeiro

- `LEIA-PRIMEIRO-V27.10-RECONSTRUCAO-COMPLETA.txt`
- `README_V27_10_RECONSTRUCAO_COMPLETA.md`
- `MATRIZ_IMPLEMENTACAO_V27_10.md`
- `TESTE_APARELHO_REAL_V27_10.md`

## Fluxo principal

```text
Print único ou leitura completa
→ auditoria dos campos reconhecidos
→ confirmação da identidade da carta
→ escolha soberana da posição
→ ficha exata com explicação dos investimentos
→ encaixe no time e nas formações
→ validação pós-jogo
```

## Áreas principais

- **Início:** prioridades, pendências e recomendações.
- **Jogadores:** carta, leitor, ficha, habilidades e histórico.
- **Meu Time:** formação, lacunas, titulares, banco e planos.
- **Partidas:** preparação, adversário, substituições e pós-jogo.
- **Ajustes:** conta, segurança, backup, atualização e diagnóstico.

## Desenvolvimento

Requisitos:

- Node.js 22.16 ou superior, abaixo da versão 25;
- npm com `package-lock.json` preservado.

Comandos principais:

```bash
npm ci --ignore-scripts
npm run typecheck
npm run test:all
npm run apk:build-web
```

A exportação estática local para teste exige variáveis válidas ou o fallback explicitamente habilitado apenas em desenvolvimento. O workflow de produção rejeita valores de exemplo.

## APK e atualização

Use o workflow:

```text
Gerar APK e publicar atualização definitiva
```

Mantenha o Secret permanente:

```text
ANDROID_SIGNING_BUNDLE
```

Não envie keystore, arquivo de chave, `.env`, token ou credencial para o repositório.

## Estrutura atual

```text
src/modules/card-reader   Print Único Pro, fila e processamento
src/modules/builds        orçamento de pontos e motor de fichas
src/modules/players       Laboratório do Jogador
src/modules/squad         time, encaixe e detector de lacunas
src/modules/matches       partida e pós-jogo
src/modules/core          repositório e inteligência integrada
src/app                   entrada CSS, compatibilidade e Design System
tests                     regressões e casos críticos de OCR
```

Os documentos antigos foram preservados em `docs/archive/` apenas para histórico. Eles não substituem a documentação atual.
