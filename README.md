# BuildMaster Elite Tático v25.80

> Interface reorganizada por páginas e navegação premium. Consulte `README_REORGANIZACAO_V25_80.md`.

# BuildMaster Elite Tático v25.19 — Lote 10: Banco e Planos

Esta versão amplia a gestão coletiva sem retirar a decisão do usuário.

## Novidades

- v25.07: cobertura real nas 13 posições oficiais;
- v25.08: melhor reserva para cada titular;
- v25.09: equilíbrio do banco por defesa, meio, ataque, velocidade, criação, energia e versatilidade;
- v25.19: Planos A, B e C salvos localmente e comparáveis.

## Regras preservadas

- nenhuma troca é automática;
- nenhuma formação ou estilo é aplicado sem confirmação;
- nomes oficiais continuam vindo dos catálogos internos;
- posição escolhida e fichas já salvas continuam preservadas.

## Validação

Execute:

```bash
npm ci
npm run typecheck
npm run test:all
npm run build
```

O APK é gerado pelo workflow `Gerar APK Android Fiel v25.19 Lote 10 Banco e Planos`.

## v25.16 — Lote 11: Adversário avançado
- Comparação entre sua defesa/meio/ataque e os setores equivalentes do rival.
- Duelos individuais estimados com jogador real da sua escalação.
- Mapa de ameaças por zona, com nível e proteção sugerida.
- Mapa de fraquezas com oportunidades e forma de explorar.
- Nenhuma alteração automática de escalação, ficha, formação ou plano.
