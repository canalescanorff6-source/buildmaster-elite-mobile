# Correção definitiva do erro Pontos 2/2

Nesta versão o app não usa mais valores pequenos de OCR como orçamento de ficha.

## O que foi corrigido

- `Pontos 2/2`, `3/3`, `8/8` e qualquer valor abaixo de 20 são descartados.
- Se o app ler nível máximo confiável, ele calcula os pontos pelo nível:
  - Nível 32 → 62 pontos
  - Nível 33 → 64 pontos
- Se o OCR quebrar `Nível 32` e ler apenas `Nível 2`, esse nível baixo também é descartado.
- Se pontos e nível não forem lidos com segurança, o app usa o padrão seguro de 64 pontos.
- O motor de ficha nunca mais deve gerar build com orçamento 2/2.

## Observação

Depois de subir estes arquivos, faça um novo deploy na Vercel. Se ainda aparecer 2/2, a Vercel ou o GitHub ainda está usando arquivos antigos.
