# BuildMaster Elite Tático v34.00 — Studio Premium Clean

A v34.00 reorganiza a interface para caber corretamente em celulares de diferentes tamanhos, sem alterar os motores de fichas, OCR, habilidades adicionais, Ímpetos e Mega Calibração v32.

## Principais mudanças

- todas as telas limitadas à largura real do aparelho, sem conteúdo cortado;
- grades, formulários, botões e guias reorganizados automaticamente;
- menu lateral à esquerda preservado;
- títulos menores, textos curtos e informações secundárias recolhidas;
- guias sem rolagem horizontal obrigatória;
- tabelas grandes com rolagem interna, sem alargar a página;
- calibrador abre enquadrado e usa tela cheia somente quando solicitado;
- Jogadores, Meu Time e Partidas protegidos contra dados incompletos;
- alertas compactos, sem cobrir a navegação;
- menos blur, animações e alturas fixas para melhorar o desempenho móvel;
- cache renovado somente quando a estrutura da versão muda.

## Verificação antes da publicação

```bash
npm run test:v3400
npm run release:preflight
npm run quality:audit
npm run integrity:verify
```
