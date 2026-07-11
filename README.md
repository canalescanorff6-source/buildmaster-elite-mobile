# BuildMaster Elite Tático v24.15 — Mapeamento Total do Time

Versão fiel ao projeto web/APK com foco em máxima precisão de jogabilidade.

## Novidades da v24.15

- Motor por **posição + estilo de jogo + atributos + formação + modelo do técnico**.
- Regras específicas para GOL, ZAG, laterais, VOL, MLG, MAT, pontas, SA e CA.
- Estilos tratados com função real: Goleiro ofensivo/defensivo, Defensor criativo, O destruidor, Orquestrador, Primeiro volante, Meia versátil, Clássico 10, Armador criativo, Ala produtivo, Pivô, Homem de área, Puxa marcação e Artilheiro.
- Nova área **Mapa Total do Time**, usando o Cofre de Jogadores para avaliar o elenco inteiro.
- Diagnóstico por fase: marcação, cobertura, saída de bola, passe, criação, aceleração, finalização, jogo aéreo e físico.
- Alertas de buracos táticos: falta de VOL, criador, finalizador, jogo aéreo, saída de bola ou cobertura.
- Top líderes do elenco por fase do jogo.

## Validação recomendada

```bash
npm install --registry=https://registry.npmjs.org/
npm run typecheck
npm run test:all
npm run build
```

Para gerar APK fiel, use o workflow do GitHub Actions: **Gerar APK Android Fiel ao Projeto**.
