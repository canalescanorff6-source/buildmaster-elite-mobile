# Gameplay Real + Posições PT-BR

Esta versão corrige a lógica de posição automática.

O motor antigo podia escolher uma posição com maior overall, por exemplo LE, mesmo quando o estilo e a posição natural pediam VOL. Agora a análise usa a função real da carta.

## Regras principais

- Destroyer / O destruidor: VOL > MC > ZAG.
- Homem de área / Artilheiro / Pivô: CA > SA.
- Ponta prolífico / Flanco móvel: PE/PD > ME/MD.
- Orquestrador / Âncora / Box-to-box: VOL/MC.
- Construtor: ZAG/VOL.

## Conversão automática

O app reconhece posições em inglês e mostra em PT-BR:
CF→CA, SS→SA, LWF→PE, RWF→PD, LMF→ME, RMF→MD, AMF→MAT, CMF→MC, DMF→VOL, CB→ZAG, LB→LE, RB→LD, GK→GOL.
