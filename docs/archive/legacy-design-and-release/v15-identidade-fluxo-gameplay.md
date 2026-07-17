# BuildMaster Local Pro v15 — identidade preservada e gameplay real

Melhorias desta versão:

- A posição e o estilo da carta ficam preservados no card principal.
- A recomendação de melhor posição aparece somente nas seções de texto/abas.
- O fluxo não roda OCR automaticamente após escolher a imagem: o usuário toca em **Prosseguir: ler carta e gerar ficha Elite**.
- OCR local com recorte específico de **Identidade da carta** e **Topo da carta** antes dos recortes gerais.
- O detector de estilo não busca no texto inteiro para evitar confundir menus/listas/recomendações com o estilo real do jogador.
- Ficha Elite continua focada em gameplay real, não em overall alto.
- Ímpetos continuam recomendados por posição + estilo + função real.

Regra principal:

```text
Identidade da carta = nome + posição original + estilo original + overall lido.
Recomendação do BuildMaster = melhor posição real + ficha + habilidades + ímpeto.
```

Exemplo:

```text
Carta: ZAG + O destruidor
Card principal: ZAG + O destruidor
Texto abaixo: Melhor uso pode ser ZAG, VOL, LD ou LE, conforme leitura e função real.
```
