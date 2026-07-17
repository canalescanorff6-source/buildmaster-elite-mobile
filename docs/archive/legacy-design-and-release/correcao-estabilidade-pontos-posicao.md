# Correção de estabilidade — pontos e posição automática

Esta versão muda o motor para evitar dois erros críticos do OCR:

1. Pontos absurdos, como `2/2` ou `116/116`, lidos de ícones, boosters, estrelas ou outros números da tela.
2. Jogador sendo recomendado em posição sem sentido quando o OCR lê a grade completa de posições.

## Regra nova de pontos

- Valores automáticos abaixo de 20 são descartados.
- Valores automáticos acima de 80 são descartados.
- O app prefere calcular pelo nível máximo quando ele é seguro.
- Se o nível também vier suspeito, o app usa 64 pontos como padrão seguro.

Exemplos:

- Nível 32 → 62 pontos.
- Nível 33 → 64 pontos.
- OCR 2/2 → descartado.
- OCR 116/116 → descartado.

## Regra nova de posição

- O modo automático agora respeita a posição principal detectada na carta.
- O app não escolhe mais uma posição apenas porque algum atributo ficou alto no cálculo.
- Estilos como `Homem de área`, `Artilheiro`, `Pivô` e `Atacante matador` priorizam CA.
- Estilos defensivos priorizam VOL/ZAG/laterais conforme a carta.

## Observação

OCR não é 100% garantido. Por isso o app mantém a aba de dados lidos para conferência, mas agora ele tem travas para não aceitar valores claramente absurdos.
