# Correção das regressões v31.78 e v31.79 — v31.82

## Causa

As regressões antigas validavam literalmente que as versões internas do mapa eFHUB, do OCR e do normalizador começassem com `31.81-`.

A melhoria do calibrador nítido atualizou corretamente esses componentes para `31.82-`, mas os testes continuaram presos ao prefixo anterior e encerravam o diagnóstico consolidado com código 1.

## Correção aplicada

- A regressão v31.78 agora exige versão interna **31.81 ou posterior** para a geometria e o OCR.
- A regressão v31.79 agora exige versão interna **31.81 ou posterior** para a geometria e o normalizador.
- A validação continua rígida: formatos inválidos ou versões inferiores a 31.81 continuam reprovados.
- Nenhuma regra de ficha, habilidade adicional, leitura OCR ou posicionamento do calibrador foi removida ou afrouxada.

## Testes executados

- `npm run test:v3178` — aprovado.
- `npm run test:v3179` — aprovado.
- `npm run test:v3181` — aprovado.
- `npm run test:v3182` — aprovado.
- Sintaxe, contratos interativos, acessibilidade, pré-voo e auditoria estrutural — aprovados.

## Observação do ambiente local

O typecheck completo não pôde ser repetido neste ambiente porque o espelho intermediário de pacotes retornou HTTP 404 para `zlibjs@0.3.1`. No GitHub Actions, as dependências já foram instaladas e o log enviado mostrou somente as duas regressões de versão corrigidas neste hotfix.
