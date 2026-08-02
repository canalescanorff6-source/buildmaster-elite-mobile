# Correção de compatibilidade das dependências — v31.82

## Causa

O scanner preventivo de `lucide-react` usava uma expressão regular ampla (`[\s\S]*?`). Em arquivos com imports anteriores do React, a captura podia atravessar mais de uma declaração e interpretar nomes como `useState`, `CSSProperties` e `PointerEvent` como ícones do Lucide. O resultado era um falso erro na etapa **Compatibilidade das dependências**.

## Correções

- Scanner limitado às chaves da própria importação de `lucide-react`.
- Rejeição explícita de nomes malformados e falsos imports do React.
- Modo `--scan-only` para testar o parser sem depender de `node_modules`.
- Verificação determinística dos pacotes instalados contra o `package-lock.json`.
- Confirmação de versões idênticas entre React/React DOM e entre Capacitor Core/Android/CLI.
- Regressão específica para impedir o retorno do falso positivo.

A proteção de compatibilidade permanece ativa; apenas a leitura incorreta foi removida.
