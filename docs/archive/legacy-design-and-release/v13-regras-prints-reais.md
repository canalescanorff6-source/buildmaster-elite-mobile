# BuildMaster Local Pro v13 — regras com base nos prints reais

Esta versão reforça o motor de Gameplay Real com os exemplos enviados pelo Tiago:

- Ronaldinho Gaúcho — AMF/MAT — Armador criativo
- Aurélien Tchouaméni — DMF/VOL — Primeiro volante
- Gennaro Gattuso — DMF/VOL — O destruidor
- Lamine Yamal — RWF/PD — Lateral móvel
- El-Hadji Diouf — CF/CA — Artilheiro
- Didier Drogba — CF/CA — Homem de área
- Edgar Davids — DMF/VOL — O destruidor

## Ajuste principal

Quando o OCR não lê a posição grande da carta com segurança, o app não usa mais o maior overall da grade como prioridade principal. Ele faz:

1. estilo de jogo;
2. posição original lida;
3. posições compatíveis;
4. diferença tolerada de overall;
5. função real de gameplay.

Exemplo: se o jogador é DMF/VOL com estilo `O destruidor` ou `Primeiro volante`, o app prioriza VOL/MLG/ZAG antes de laterais, mesmo que LB/RB/CB apareçam com overall um pouco maior.

## Conversão PT-BR

- CF → CA
- SS → SA
- LWF → PE
- RWF → PD
- LMF → ME
- RMF → MD
- AMF → MAT
- CMF → MLG
- DMF → VOL
- CB → ZAG
- LB → LE
- RB → LD
- GK → GOL

## Regras de exemplo

- MAT + Armador criativo → MAT, SA, MLG.
- VOL + Primeiro volante → VOL, MLG, ZAG.
- VOL/MLG + O destruidor → VOL/MLG, ZAG; laterais só como alternativa manual.
- PD/PE + Lateral móvel → PD/PE, MD/ME, SA/MAT; não vira lateral automaticamente.
- CA + Artilheiro → CA e SA.
- CA + Homem de área → CA; foco físico, cabeceio e finalização.

## Ímpetos

Ímpetos agora continuam sendo recomendados por posição + estilo:

- Destruidor/Primeiro volante: Duelo, Roubo de bola, Defesa, Motor do time, Reconstrução.
- Armador criativo/Orquestrador: Técnica, Passe, Criador ofensivo, Proteção de Posse, Volante criativo.
- Lateral móvel/Ala produtivo: Condução de bola, Agilidade, Rompe-barreira, Cruzamento.
- Artilheiro/Homem de área: Instinto artilheiro, Chute, Disputa aérea, Força, Fisicalidade.
